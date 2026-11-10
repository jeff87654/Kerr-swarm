// The Candlewick baths, off Ladle Row: the cheapest luxury in the drum, warmed for nothing by the food plant's 65 degree
// loop, and the block's living room in the evening. Entrance hall with Dorota's desk, lockers, robes and broth; a washing
// room; the main hall under a vault, with a big hot pool, a very hot pool, a cool plunge and a long warm shallow under a
// mosaic of the Hollow; a steam room behind glass; a resting room hung with felt.
import { floor, ceiling, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { CHATTER } from '../content/chatter.js';
import { shadeHex, mixHex, Rng, hashStr } from '../core/util.js';
import { PAL, cutRects, quadN, mosaicPicture, smoothArch, bathsParts } from './baths_parts.js';

// footprint x[-104, -68] z[-40, -4]; the street (Ladle Row) is toward +z
const FZ = -4.16;                                   // the facade's centre line (outer face at z = -4.08)
const HALL = { x0: -104, x1: -68, z0: -39.92, z1: -20 };
const NAVE = { x0: -95.92, x1: -76.08 };            // inner faces of the arcade walls
const SPR = 4.6, CROWN = 7.1;                       // the vault springs at 4.6 and rises to 7.1
const VC = -86, VHALF = (NAVE.x1 - NAVE.x0) / 2, VR = (VHALF * VHALF + (CROWN - SPR) * (CROWN - SPR)) / (2 * (CROWN - SPR)), VCY = CROWN - VR;
const arcY = (x) => VCY + Math.sqrt(Math.max(0, VR * VR - (x - VC) * (x - VC)));
const PIERS = [-35.75, -31.75, -27.75, -23.75];   // arcade piers (z) between the five arches each side

// the pools: water level, bottom, and what is under the water
const P1 = { x0: -92, z0: -33, x1: -80, z1: -26, water: -0.2, bottom: -1.4, tile: '#7fbcb4' };          // the big hot pool
const P2 = { x0: -102.2, z0: -31, x1: -98.2, z1: -26.5, water: -0.2, bottom: -0.78, tile: '#d98a6a' };   // the very hot pool
const P3 = { x0: -73.6, z0: -30.5, x1: -70.6, z1: -27.5, water: -0.2, bottom: -1.4, tile: '#a9d4dc' };  // the cool plunge
const P4 = { x0: -94, z0: -39.84, x1: -78, z1: -37.4, water: -0.15, bottom: -0.75, tile: '#7fbcb4', back: true };   // the long warm shallow

const DOROTA = { name: 'Dorota', colour: '#8fd0c0' };

export const place = {
  id: 'baths', name: 'The Candlewick baths', order: 62,
  build(game) {
    void bathsParts;
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('baths', f);
    const g = s.g;
    const rng = new Rng(hashStr('baths'));

    const clipLobby = [-96.1, -0.3, -13.1, -75.9, 3.45, -4.0];
    const clipPorch = [-96, -0.3, -5.1, -76, 3.4, -1.5];
    const clipWash = [-96.1, -0.3, -20.1, -75.9, 3.45, -12.9];
    const clipSteam = [-104.1, -0.3, -20.1, -95.9, 2.7, -12.9];
    const clipRest = [-76.1, -0.3, -20.1, -67.9, 3.1, -12.9];
    const clipHall = [-104.1, -1.6, -40.1, -67.9, 7.3, -19.9];

    // ================================================================================================
    // the shell
    // ================================================================================================
    const tileWall = { mat: 'tile', tint: '#ecdcbc', dado: { h: 1.2, mat: 'tile', tint: PAL.sea }, skirt: PAL.seaD };

    // --- the facade on Ladle Row: a tiled front, a recessed porch, frosted lit windows
    const winAt = [2.0, 5.0, 9.1, 25.9, 30.0, 33.0];
    wall(s, -104, FZ, -68, FZ, 0, 3.4, { mat: 'tile', tint: PAL.cream, dado: { h: 1.0, mat: 'tile', tint: PAL.teal }, skirt: PAL.deep,
      openings: [{ at: 12, w: 12, h: 2.75 }].concat(winAt.map((a) => ({ at: a, w: 1.0, h: 1.5, sill: 1.0 }))) });
    wall(s, -92.08, -5.0, -92.08, FZ - 0.08, 0, 2.75, { mat: 'tile', tint: PAL.cream, dado: { h: 1.0, mat: 'tile', tint: PAL.teal }, skirt: PAL.deep });
    wall(s, -79.92, -5.0, -79.92, FZ - 0.08, 0, 2.75, { mat: 'tile', tint: PAL.cream, dado: { h: 1.0, mat: 'tile', tint: PAL.teal }, skirt: PAL.deep });
    s.structure(() => {
      // frosted windows, lit from within, with brass glazing bars
      for (const a of winAt) {
        const x0 = -104 + a, x1 = x0 + 1.0;
        g.mat('diffuser', '#f3dcb2', { emissive: 1.1, lamp: true }); g.box(x0, 1.0, FZ - 0.02, x1, 2.5, FZ + 0.02, { faces: 'zZ' });
        g.mat('cast', PAL.brass); for (const u of [0.333, 0.667]) g.box(x0 + u, 1.0, FZ + 0.02, x0 + u + 0.02, 2.5, FZ + 0.035, { faces: 'ZxX' });
        for (const v of [1.5, 2.0]) g.box(x0, v, FZ + 0.02, x1, v + 0.02, FZ + 0.035, { faces: 'ZyY' });
        g.mat('tile', PAL.coral); g.box(x0 - 0.1, 0.92, FZ + 0.08, x1 + 0.1, 1.0, FZ + 0.15, { bevel: 0.01 });
        g.mat('tile', PAL.teal); g.box(x0 - 0.12, 2.5, FZ + 0.08, x1 + 0.12, 2.62, FZ + 0.13, { bevel: 0.01 });
        // an arched tile head over each window
        g.mat('tile', PAL.sea);
        for (let i = 0; i < 9; i++) { const t0 = i / 9 * Math.PI, t1 = (i + 1) / 9 * Math.PI; const xa = (x0 + x1) / 2 - Math.cos(t0) * 0.62, xb = (x0 + x1) / 2 - Math.cos(t1) * 0.62; g.box(Math.min(xa, xb), 2.62 + Math.sin((t0 + t1) / 2) * 0.32, FZ + 0.08, Math.max(xa, xb), 2.7 + Math.sin((t0 + t1) / 2) * 0.32, FZ + 0.12); }
      }
      // pilasters and a coral band along the whole front
      g.mat('tile', PAL.coral); g.box(-104, 1.0, FZ + 0.08, -92.1, 1.08, FZ + 0.12); g.box(-79.9, 1.0, FZ + 0.08, -68, 1.08, FZ + 0.12);
      g.mat('tile', PAL.teal);
      for (const x of [-103.95, -100.25, -97.25, -92.5, -79.5, -75.25, -71.75, -68.3]) g.box(x - 0.18 + (x < -103 ? 0.13 : 0) - (x > -69 ? 0.1 : 0), 0, FZ + 0.08, x + 0.18 + (x < -103 ? 0.13 : 0) - (x > -69 ? 0.1 : 0), 3.25, FZ + 0.14, { bevel: 0.015 });
      g.mat('paint', PAL.deep); g.box(-104, 3.2, FZ + 0.08, -68, 3.4, FZ + 0.16, { bevel: 0.01 });
      g.mat('cast', PAL.brass); g.box(-104, 3.18, FZ + 0.15, -68, 3.2, FZ + 0.17);
    });
    // the porch: a mosaic doormat, a low ceiling, the fascia over it
    s.structure(() => {
      g.mat('paint', PAL.deep); g.box(-92, 2.75, -5.0, -80, 2.8, FZ - 0.08, { faces: 'y' });
      g.mat('mosaic', PAL.coral); g.box(-91.7, 0.002, -4.98, -80.3, 0.006, -4.1, { faces: 'Y' });
      g.mat('mosaic', PAL.cream); g.box(-91.5, 0.006, -4.86, -80.5, 0.009, -4.22, { faces: 'Y' });
      g.mat('mosaic', PAL.teal); g.box(-88.6, 0.009, -4.78, -83.4, 0.012, -4.3, { faces: 'Y' });
    });
    ceiling(s, -92, -5.0, -80, FZ, 2.75, 'paint', PAL.deep, { noCollide: true });
    sign(s, Object.assign({}, SIGNS['baths.fascia'], { emblem: 'drop', palette: [PAL.deep, '#f6ead0', PAL.coral] }), -86, 3.07, FZ + 0.09, { face: 'Z', w: 5.2, h: 0.5, glow: 2.4 });
    sign(s, SIGNS['baths.hanging'], -94.0, 2.45, -3.62, { face: 'X', double: true, w: 0.55, h: 0.55 });
    s.deco(() => { g.mat('cast', '#2a2622'); g.tube([[-94.0, 2.82, FZ + 0.08], [-94.0, 2.82, -3.5], [-94.0, 2.76, -3.36]], 0.014, { segs: 6 }); for (const z of [-3.82, -3.42]) g.tube([[-94.0, 2.82, z], [-94.0, 2.73, z]], 0.005, { segs: 4 }); });
    sign(s, SIGNS['baths.rules'], -78.45, 1.55, FZ + 0.15, { face: 'Z' });
    shopfront(s, { side: 's', a0: -92, a1: -80, c: -5.0, y: 0, h: 2.75, fasciaH: 0.22, palette: { frame: PAL.deep, plinth: PAL.teal }, plinth: 0.6, door: { at: 5, w: 2.0, kind: 'open' }, lights: false });
    // a split cloth curtain hung in the open doorway, deep teal with a cream band
    s.deco(() => {
      g.mat('cast', PAL.brass); g.tube([[-87.05, 2.1, -5.14], [-84.95, 2.1, -5.14]], 0.016, { segs: 6 });
      for (let i = 0; i < 3; i++) {
        const xa = -87.0 + i * 0.67, xb = xa + 0.63;
        g.mat('weave', i === 1 ? PAL.coral : PAL.deep); g.sheet([xa, 2.1, -5.14], [xb, 2.1, -5.14], [xb, 1.74, -5.12], [xa, 1.74, -5.12], { nu: 3, nv: 2, ripple: 0.012, rippleN: 3 });
        g.mat('weave', '#f1e2c2'); g.box(xa + 0.02, 1.8, -5.17, xb - 0.02, 1.85, -5.09, { faces: 'zZ' });
        g.box(xa + 0.02, 1.95, -5.17, xb - 0.02, 1.98, -5.09, { faces: 'zZ' });
      }
    });
    lamp(s, 'lantern', -86, 2.35, -4.55, { tint: '#e8743b', drop: 0.32, power: 0.9, clip: clipPorch, K: 2600 });
    lamp(s, 'sconce', -92.75, 2.15, FZ + 0.12, { face: 'Z', clip: [-96, -0.3, -4.1, -88, 3.4, -1], K: 2700, power: 0.9 });
    lamp(s, 'sconce', -79.25, 2.15, FZ + 0.12, { face: 'Z', clip: [-84, -0.3, -4.1, -76, 3.4, -1], K: 2700, power: 0.9 });
    sign(s, { kind: 'label', text: 'Candlewick baths', lines: ['16 · 92'], ink: '#f1e6c9' }, -86, 2.5, -4.98, { face: 'Z', w: 0.9, h: 0.22 });

    // --- the entrance hall
    floor(s, -96, -13, -76, -4.08, 0, 'hex', '#e9dcc0');
    ceiling(s, -96, -13, -76, -5.0, 3.3, 'paint', '#efe4cc');
    const warm = '#e9c894';
    wall(s, -96, -13, -96, FZ - 0.08, 0, 3.4, Object.assign({}, tileWall, { matA: 'paint', tintA: warm, dado: { h: 1.5, mat: 'tile', tint: PAL.sea } }));
    wall(s, -76, -13, -76, FZ - 0.08, 0, 3.4, Object.assign({}, tileWall, { matB: 'paint', tintB: warm, dado: { h: 1.5, mat: 'tile', tint: PAL.sea } }));
    wall(s, -104, -13, -68, -13, 0, 3.4, Object.assign({}, tileWall, { matA: 'paint', tintA: warm, dado: { h: 1.5, mat: 'tile', tint: PAL.sea }, openings: [{ at: 16.5, w: 3.0, h: 2.8 }] }));
    smoothArch(s, -86, 0, -13, 3.0, 2.8, 'x', { tint: PAL.bone, depth: 0.34, rise: 0.9 });
    roomGlow(s, -96, 0, -13, -76, 3.3, -4.1, { sky: '#ffdcae', ground: '#c9a57c', power: 0.3 });
    lobbyDetail(s, game, clipLobby);

    // --- the washing room
    floor(s, -96, -20, -76, -13, 0, 'tile', '#d6e2d6');
    ceiling(s, -96, -20, -76, -13, 3.3, 'paint', '#e9e2d0');
    wall(s, -96, -20, -96, -13, 0, 3.4, Object.assign({}, tileWall, { dado: { h: 1.6, mat: 'tile', tint: PAL.sea } }));
    wall(s, -76, -20, -76, -13, 0, 3.4, Object.assign({}, tileWall, { dado: { h: 1.6, mat: 'tile', tint: PAL.sea } }));
    wall(s, -104, -20, -68, -20, 0, 3.4, Object.assign({}, tileWall, { openings: [{ at: 1.0, w: 6.0, h: 2.4 }, { at: 16.5, w: 3.0, h: 2.8 }, { at: 31.4, w: 1.2, h: 2.1 }] }));
    smoothArch(s, -86, 0, -20, 3.0, 2.8, 'x', { tint: PAL.bone, depth: 0.34, rise: 0.9 });
    roomGlow(s, -96, 0, -20, -76, 3.3, -13, { sky: '#ffe2bc', ground: '#a9c9b8', power: 0.28 });
    washDetail(s, game, clipWash);

    // --- the steam room and the resting room
    floor(s, -104, -20, -96, -13, 0, 'tile', '#3f7f73');
    ceiling(s, -104, -20, -96, -13, 2.6, 'tile', '#5a9a8a');
    wall(s, -103.92, -20, -103.92, -13, 0, 3.4, { mat: 'tile', tint: '#4f8f80', dado: { h: 0.95, mat: 'mosaic', tint: '#2a6863' }, skirt: false });
    roomGlow(s, -104, 0, -20, -96, 2.6, -13, { sky: '#ffcf9a', ground: '#4f8f80', power: 0.22 });
    steamDetail(s, game, clipSteam);

    floor(s, -76, -20, -68, -13, 0, 'planks', '#9a6a42');
    ceiling(s, -76, -20, -68, -13, 3.0, 'felt', '#5a3a2e');
    wall(s, -68.08, -20, -68.08, -13, 0, 3.4, { mat: 'plaster', tint: '#e2c99c', skirt: '#4a3220' });
    roomGlow(s, -76, 0, -20, -68, 3.0, -13, { sky: '#ffcf9a', ground: '#9a6a42', power: 0.2 });
    restDetail(s, game, clipRest);

    // --- the front corners (the pump room and the linen room, not open to guests)
    for (const xx of [[-104, -96], [-76, -68]]) { ceiling(s, xx[0], -13, xx[1], FZ, 3.3, 'paint', '#d9cdb8', { noCollide: true }); }
    wall(s, -103.92, -13, -103.92, FZ - 0.08, 0, 3.4, { mat: 'paint', tint: '#d9cdb8' });
    wall(s, -68.08, -13, -68.08, FZ - 0.08, 0, 3.4, { mat: 'paint', tint: '#d9cdb8' });

    // --- the main hall: outer walls, arcades, the vault
    hallShell(s, game, clipHall);
    hallPools(s, game, clipHall);
    hallDetail(s, game, clipHall);

    // ================================================================================================
    // people, use, sound
    // ================================================================================================
    peopleAndPaths(s);
    interactions(s, game, f);
    sounds(s, game, f);

    s.zoneBox({ id: 'baths-entry', place: 'baths', box: [-96, -0.5, -13, -76, 3.3, -4.0], name: 'The Candlewick baths', sub: "Dorota's desk · robes and broth", ambience: 'baths', reverb: 'room' });
    s.zoneBox({ id: 'baths-wash', place: 'baths', box: [-96, -0.5, -20, -76, 3.3, -13], name: 'The washing room', sub: 'Wash first, soak second', ambience: 'baths', reverb: 'tile' });
    s.zoneBox({ id: 'baths-hall', place: 'baths', box: [-104, -1.6, -39.92, -68, 7.2, -20], name: 'The Candlewick baths', sub: 'The hot pool · on the 65 degree loop', ambience: 'baths', reverb: 'tile', headroom: 7, env: { warmth: 0.38, bloom: 0.07, autoKey: 0.15 } });
    s.zoneBox({ id: 'baths-steam', place: 'baths', box: [-104, -0.5, -20, -96, 2.6, -13], name: 'The steam room', sub: 'The Candlewick baths', ambience: 'baths', reverb: 'tile', headroom: 2.6 });
    s.zoneBox({ id: 'baths-rest', place: 'baths', box: [-76, -0.5, -20, -68, 3.0, -13], name: 'The resting room', sub: 'The Candlewick baths', ambience: 'baths', reverb: 'felt' });

    s.finish();
    game.spawns.baths = { frame: f, x: -86, y: 0, z: -2.2, yaw: 0 };
    game.spawns['baths-hall'] = { frame: f, x: -86, y: 0, z: -21.5, yaw: 0 };
    game.spawns['baths-pool'] = { frame: f, x: -86, y: 0, z: -25.4, yaw: 0 };
    void rng; void mixHex;
  },
};

// ================================================================================================
// the entrance hall
// ================================================================================================
function lobbyDetail(s, game, clip) {
  const g = s.g;
  // a mosaic medallion in the hex floor, on the line from the door to the arch
  s.structure(() => {
    const cx = -86, cz = -8.6, cell = 0.09;
    for (let i = -15; i <= 15; i++) for (let j = -15; j <= 15; j++) {
      const x = cx + i * cell, z = cz + j * cell, d = Math.hypot(i, j) * cell; if (d > 1.32) continue;
      const a = Math.atan2(j, i), ray = Math.cos(a * 8) > 0.2;
      const c = d < 0.2 ? '#fff3c8' : d < 0.55 ? (ray ? PAL.ochre : '#f3dcae') : d < 0.72 ? PAL.cream : d < 1.1 ? (Math.sin(a * 12 + d * 9) > 0 ? PAL.sea : PAL.teal) : d < 1.2 ? PAL.cream : PAL.coral;
      g.mat('mosaic', c); g.box(x - cell / 2 + 0.006, 0.0, z - cell / 2 + 0.006, x + cell / 2 - 0.006, 0.005, z + cell / 2 - 0.006, { faces: 'Y' });
    }
    // a border of coral tile round the room
    g.mat('tile', PAL.coral);
    g.box(-95.9, 0, -12.9, -76.1, 0.004, -12.7, { faces: 'Y' }); g.box(-95.9, 0, -5.25, -76.1, 0.004, -5.05, { faces: 'Y' });
    g.box(-95.9, 0, -12.7, -95.7, 0.004, -5.25, { faces: 'Y' }); g.box(-76.3, 0, -12.7, -76.1, 0.004, -5.25, { faces: 'Y' });
  });
  // ceiling beams and a lagged pipe along the back wall (the loop on its way to the urn)
  s.deco(() => {
    g.mat('wood', '#4a3220');
    for (let x = -94; x < -76.5; x += 2.5) g.box(x - 0.09, 3.08, -12.92, x + 0.09, 3.3, -5.0, { bevel: 0.012 });
    g.mat('felt', '#e8dcc4'); g.tube([[-95.9, 2.9, -12.72], [-76.1, 2.9, -12.72]], 0.075, { segs: 10 });
    g.mat('cast', PAL.brass);
    for (let x = -95; x < -76.5; x += 1.5) { g.push(); g.move(x, 2.9, -12.72); g.rotZ(Math.PI / 2); g.cyl(0, -0.03, 0, 0.082, 0.06, { segs: 10 }); g.pop(); }
  });
  // three pendant lamps down the middle, sconces by the arch
  for (const x of [-91.5, -86, -80.5]) lamp(s, 'globe', x, 2.45, -8.6, { r: 0.2, drop: 0.85, clip, K: 2700, power: 1.1 });
  lamp(s, 'sconce', -88.15, 2.1, -12.9, { face: 'Z', clip, K: 2700, power: 0.7 });
  lamp(s, 'sconce', -83.85, 2.1, -12.9, { face: 'Z', clip, K: 2700, power: 0.7 });

  // --- the locker wall (west): two banks of numbered lockers, benches before them, slippers under
  let num = 1;
  for (const bz of [-10.92, -7.56]) {
    prop(s, 'baths.lockers', -95.69, 0, bz, Math.PI / 2, { cols: 7, rows: 3, seed: bz < -9 ? 1 : 2 });
    // numbers on the brass plates
    const cols = 7, cw = 0.42, Wd = cols * cw, rh = (2.0 - 0.19) / 3;
    for (let j = 2; j >= 0; j--) for (let i = 0; i < cols; i++) {
      const lx = -Wd / 2 + i * cw + 0.016 + (cw - 0.032) / 2, ly = 0.12 + j * rh + 0.016 + rh - 0.032 - 0.17;
      sign(s, { kind: 'label', text: String(num++), ink: '#3a2c14' }, -95.69 + 0.239, ly, bz - lx, { face: 'X', w: 0.08, h: 0.05 });
    }
    sign(s, { kind: 'label', text: bz < -9 ? 'shoes and coats · 1 to 21' : 'shoes and coats · 22 to 42', ink: '#f1e6c9' }, -95.4, 2.25, bz, { face: 'X', w: 1.2, h: 0.14 });
    prop(s, 'bench', -94.55, 0, bz, Math.PI / 2, { w: 2.2, wood: '#8a6240' });
  }
  const slip = ['#c9a46a', '#b08d5e', '#d9b77a'], straps = [PAL.teal, PAL.coral, PAL.indigo, PAL.ochre];
  for (let k = 0; k < 6; k++) prop(s, 'baths.slippers', -94.5 + (k % 2 ? 0.2 : -0.15), 0, -11.9 + k * 0.92, Math.PI / 2 + (k % 3 - 1) * 0.3, { c: slip[k % 3], strap: straps[k % 4] });
  s.detail(() => {
    // shoes in pairs on the locker plinths, a coat over a bench end
    for (let k = 0; k < 9; k++) {
      const z = -12.2 + k * 0.7 + (k > 4 ? 0.3 : 0); const c = ['#3a2a1e', '#6b3a2a', '#2a3a4a', '#5a4a3a', '#7a2a22'][k % 5];
      g.mat('leather', c); for (const dz of [-0.07, 0.07]) g.box(-95.42, 0.0, z + dz - 0.045, -95.16, 0.09, z + dz + 0.045, { bevel: 0.03 });
    }
    g.mat('weave', PAL.indigo); g.sheet([-94.75, 0.47, -9.4], [-94.35, 0.47, -9.4], [-94.3, 0.02, -9.3], [-94.8, 0.02, -9.3], { nu: 3, nv: 3, ripple: 0.03 });
  });

  // --- Dorota's desk (east): a long tiled desk, the robes on the warm rail behind it, towels on shelves
  prop(s, 'counter', -79.6, 0, -8.8, -Math.PI / 2, { w: 2.6, d: 0.65, body: PAL.teal, top: '#7a5233' }, { noSpots: true });
  s.spot('counter', -78.85, 0, -8.8, -Math.PI / 2, { who: 'dorota', tags: ['keeper', 'baths'] });
  for (const z of [-9.6, -8.0]) s.spot('customer', -80.55, 0, z, Math.PI / 2, { tags: ['baths'] });
  prop(s, 'baths.robes', -76.08, 0, -8.6, -Math.PI / 2, { w: 3.6, n: 9, seed: 1 });
  prop(s, 'baths.towels', -76.3, 0, -11.95, -Math.PI / 2, { w: 1.5, seed: 3 });
  prop(s, 'baths.towels', -76.3, 0, -5.95, -Math.PI / 2, { w: 1.3, seed: 4, shelves: 5 });
  // on the desk: the day book, a bell, the lost-and-found tray with a black thread in it, combs, a fern under the desk lamp
  s.detail(() => {
    g.mat('leather', '#5a2a22'); g.box(-79.75, 0.92, -9.75, -79.35, 0.945, -9.25, { bevel: 0.006 });
    g.mat('paper', '#f1e8d4'); g.box(-79.73, 0.945, -9.73, -79.37, 0.955, -9.27, { faces: 'YxXzZ' });
    g.mat('cast', PAL.brass); g.lathe(-79.5, -8.95, [[0, 0.92], [0.05, 0.92], [0.05, 0.93], [0.035, 0.96], [0.012, 0.99], [0.008, 1.0], [0, 1.0]], { segs: 12 });
    g.mat('wood', '#4a3220'); g.box(-79.8, 0.92, -8.6, -79.4, 0.95, -8.25, { bevel: 0.008 });
    g.mat('weave', '#14110e'); g.tube([[-79.7, 0.952, -8.5], [-79.6, 0.955, -8.4], [-79.52, 0.952, -8.47], [-79.58, 0.955, -8.36], [-79.48, 0.952, -8.33]], 0.003, { segs: 4 });
    g.mat('glaze', PAL.coral); g.box(-79.66, 0.952, -8.56, -79.6, 0.97, -8.5, { bevel: 0.006 });
    g.mat('glaze', '#e8d9b8'); g.lathe(-79.55, -7.9, [[0, 0.92], [0.05, 0.92], [0.055, 1.02], [0.05, 1.02], [0, 0.93]], { segs: 10, capTop: false });
    g.mat('wood', '#c9a46a'); for (let k = 0; k < 5; k++) g.box(-79.58 + k * 0.012, 0.95, -7.92, -79.57 + k * 0.012, 1.08, -7.88);
  });
  lamp(s, 'globe', -79.55, 1.3, -7.55, { r: 0.09, drop: 0.25, clip, K: 2600, power: 0.45, range: 3 });
  s.deco(() => { g.mat('cast', '#2a6863'); g.lathe(-79.55, -7.55, [[0.07, 0.92], [0.05, 0.94], [0.015, 0.96], [0.012, 1.55]], { segs: 10 }); g.mat('cast', '#2a6863'); g.lathe(-79.55, -7.55, [[0.16, 1.32], [0.1, 1.42], [0.02, 1.46]], { segs: 14, capBottom: false }); });
  prop(s, 'baths.fernpot', -77.0, 0, -6.6, 0, { pot: PAL.coral, size: 0.9 });

  // --- broth on the warm shelf (back wall, east of the arch): an urn, lidded cups in rows
  s.furniture(() => {
    g.mat('tile', PAL.teal); g.box(-83.2, 0, -12.92, -79.8, 0.86, -12.4, { bevel: 0.01, aoBottom: 0.6 });
    g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(-83.25, 0.86, -12.94, -79.75, 0.9, -12.34, { bevel: 0.008 });
    g.mat('felt', '#e8dcc4'); g.tube([[-83.15, 0.72, -12.3], [-79.85, 0.72, -12.3]], 0.05, { segs: 8 });
    g.mat('wood', '#5a3d28'); g.box(-83.1, 1.55, -12.92, -79.9, 1.58, -12.66, { bevel: 0.006 });
  });
  s.solid(-83.2, 0, -12.92, -79.8, 0.9, -12.34);
  prop(s, 'baths.urn', -82.6, 0.9, -12.62, 0, {});
  const cupCols = [PAL.cream, '#d9cfb8', PAL.sea, PAL.coral, '#e8d9b8', PAL.ochre];
  for (let i = 0; i < 12; i++) prop(s, 'cup', -82.05 + (i % 6) * 0.3, 0.9, -12.68 + Math.floor(i / 6) * 0.2, 0, { glaze: cupCols[i % 6], lid: shadeHex(cupCols[(i + 2) % 6], 0.85) });
  for (let i = 0; i < 8; i++) prop(s, 'cup', -82.95 + i * 0.4, 1.58, -12.8, 0, { glaze: cupCols[(i + 3) % 6], lid: shadeHex(cupCols[(i + 5) % 6], 0.9) });
  sign(s, { kind: 'label', text: 'Broth · free · lids on', ink: '#3a2c14' }, -81.5, 1.38, -12.9, { face: 'Z', w: 1.3, h: 0.16 });
  // the rules by the arch, a bench and a big fern on the west side of the back wall
  sign(s, SIGNS['baths.rules'], -89.4, 1.55, -12.9, { face: 'Z', w: 0.42, h: 0.58 });
  prop(s, 'bench', -92.6, 0, -12.55, 0, { w: 2.0, back: true, wood: '#7a5233' });
  prop(s, 'baths.fernpot', -95.2, 0, -12.4, 0, { pot: PAL.teal, size: 1.2 });
  prop(s, 'baths.fernpot', -88.6, 0, -12.45, 0, { pot: PAL.ochre, size: 0.8 });
  // a coral band at the dado's top, a picture rail, the day's chalkboard, the lost-and-found
  s.structure(() => {
    g.mat('tile', PAL.coral);
    g.box(-95.92, 1.5, -12.92, -95.9, 1.58, -5.0, { faces: 'X' }); g.box(-76.1, 1.5, -12.92, -76.08, 1.58, -5.0, { faces: 'x' });
    g.box(-95.92, 1.5, -12.92, -87.66, 1.58, -12.9, { faces: 'Z' }); g.box(-84.34, 1.5, -12.92, -76.08, 1.58, -12.9, { faces: 'Z' });
    g.mat('wood', '#4a3220');
    g.box(-95.92, 2.5, -12.92, -95.88, 2.55, -5.0, { faces: 'XyY' }); g.box(-76.12, 2.5, -12.92, -76.08, 2.55, -5.0, { faces: 'xyY' });
    g.box(-95.92, 2.5, -12.92, -87.66, 2.55, -12.88, { faces: 'ZyY' }); g.box(-84.34, 2.5, -12.92, -76.08, 2.55, -12.88, { faces: 'ZyY' });
  });
  sign(s, { kind: 'chalk', title: 'Today', lines: ['A long hot bath · free', 'A robe · free', 'Broth · free', 'Very hot pool: be brief', 'Lamps fade at eleven'] }, -95.86, 1.45, -5.9, { face: 'X', w: 0.62, h: 0.9 });
  sign(s, SIGNS['court.lost.thread'], -78.6, 1.62, -12.89, { face: 'Z', w: 0.34, h: 0.46 });
  sign(s, { kind: 'poster', title: 'Choir in the steam', lines: ['Fridays after the hall', 'Bring nothing', 'The tiles do the rest'], palette: [PAL.deep, '#f2c879', PAL.coral], motif: 'drum' }, -92.2, 2.0, -12.89, { face: 'Z', w: 0.5, h: 0.72 });
  // fern baskets hung from the beams
  for (const b of [[-94.6, -6.4], [-77.6, -12.0], [-94.6, -11.9]]) {
    s.detail(() => {
      g.mat('cast', '#3a3028'); for (let k = 0; k < 3; k++) { const a = k * 2.094; g.tube([[b[0], 3.08, b[1]], [b[0] + Math.cos(a) * 0.17, 2.42, b[1] + Math.sin(a) * 0.17]], 0.004, { segs: 3 }); }
      g.mat('cane', '#b08d5e'); g.lathe(b[0], b[1], [[0, 2.24], [0.12, 2.25], [0.19, 2.32], [0.2, 2.42], [0.18, 2.42], [0.0, 2.3]], { segs: 12, capTop: false });
      g.mat('fern', '#ffffff', { sway: 0.5 });
      for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; g.card(b[0] + Math.cos(a) * 0.08, 2.4, b[1] + Math.sin(a) * 0.08, 0.3, 0.55, a + Math.PI / 2, { tilt: 0.95 }); }
    });
  }
}

// ================================================================================================
// the washing room
// ================================================================================================
function washDetail(s, game, clip) {
  const g = s.g;
  const placeAt = (x, z, yaw, k) => {
    // tap on the wall, stool before it, a bucket beside the stool
    prop(s, 'baths.tap', x, 0, z, yaw, { tile: PAL.cream });
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    prop(s, 'baths.stool', x + fx * 0.62, 0, z + fz * 0.62, yaw + Math.PI, { wood: ['#9a7448', '#b08d5e', '#8a6240'][k % 3] }, { spot: { tags: ['wash', 'baths'] } });
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    prop(s, 'baths.bucket', x + fx * 0.5 + rx * 0.36, 0, z + fz * 0.5 + rz * 0.36, yaw, { dipper: k % 2 === 0, wood: ['#a77e4c', '#b9925a', '#946a3e'][k % 3] });
  };
  let k = 0;
  for (const z of [-14.3, -15.6, -16.9, -18.2]) { placeAt(-95.92, z, Math.PI / 2, k++); placeAt(-76.08, z, -Math.PI / 2, k++); }
  for (const x of [-94.4, -93.0, -91.6, -90.2]) { placeAt(x, -13.08, Math.PI, k++); placeAt(x, -19.92, 0, k++); }
  for (const x of [-81.8, -80.4, -79.0, -77.6]) { placeAt(x, -13.08, Math.PI, k++); placeAt(x, -19.92, 0, k++); }
  // two tiled plinths in the middle with stacked buckets and folded wash cloths
  for (const cx of [-91.6, -80.4]) {
    s.furniture(() => {
      g.mat('tile', PAL.teal); g.box(cx - 1.4, 0, -17.0, cx + 1.4, 0.42, -16.0, { bevel: 0.02, aoBottom: 0.6 });
      g.mat('tile', PAL.cream); g.box(cx - 1.45, 0.42, -17.05, cx + 1.45, 0.47, -15.95, { bevel: 0.015 });
    });
    s.solid(cx - 1.45, 0, -17.05, cx + 1.45, 0.47, -15.95);
    const stack = [[-0.9, 0], [-0.62, 0], [-0.76, 0.2]];
    for (const st of stack) prop(s, 'baths.bucket', cx + st[0], 0.47 + st[1], -16.5, 0, { wood: '#a77e4c' });
    for (let i = 0; i < 4; i++) prop(s, 'baths.stool', cx + 0.2 + (i % 2) * 0.45, 0.47 + Math.floor(i / 2) * 0.25, -16.5, 0.1 * i, { wood: '#9a7448' }, { noSpots: true, noCollide: true });
    s.detail(() => { const cl = [PAL.cream, PAL.sea, PAL.coral, PAL.cream]; for (let i = 0; i < 4; i++) { g.mat('knit', cl[i]); g.box(cx + 1.0, 0.47 + i * 0.05, -16.75, cx + 1.3, 0.52 + i * 0.05, -16.3, { bevel: 0.02 }); } });
    s.spot('sit', cx, 0.47, -15.85, 0, { tags: ['wash', 'baths'] }); s.spot('sit', cx - 0.4, 0.47, -17.15, Math.PI, { tags: ['wash', 'baths'] });
  }
  // a drain channel under a brass grille, the pipes along the ceiling, a band of coral tile at the dado's top
  s.structure(() => {
    g.mat('grille', PAL.brass); g.box(-95.5, 0.0, -16.6, -76.5, 0.006, -16.4, { faces: 'Y' });
    g.mat('tile', PAL.coral);
    g.box(-95.84, 1.6, -19.92, -95.82, 1.68, -13.08, { faces: 'X' }); g.box(-76.18, 1.6, -19.92, -76.16, 1.68, -13.08, { faces: 'x' });
    g.box(-95.92, 1.6, -13.1, -76.08, 1.68, -13.08, { faces: 'z' }); g.box(-95.92, 1.6, -19.92, -76.08, 1.68, -19.9, { faces: 'Z' });
  });
  s.deco(() => {
    g.mat('felt', '#e8dcc4'); g.tube([[-95.6, 3.05, -19.6], [-76.4, 3.05, -19.6]], 0.07, { segs: 10 });
    g.mat('cast', '#c08a5a'); g.tube([[-95.6, 3.12, -13.4], [-76.4, 3.12, -13.4]], 0.035, { segs: 8 });
    g.mat('cast', PAL.brass); for (let x = -95; x < -76.5; x += 2) { g.tube([[x, 3.3, -19.6], [x, 3.12, -19.6]], 0.012, { segs: 4 }); g.tube([[x, 3.3, -13.4], [x, 3.15, -13.4]], 0.01, { segs: 4 }); }
  });
  sign(s, { kind: 'letters', text: 'Wash first, soak second', palette: [PAL.cream] }, -86, 3.03, -19.9, { face: 'Z', w: 2.6, h: 0.32 });
  for (const z of [-14.95, -17.55]) { lamp(s, 'sconce', -95.9, 2.05, z, { face: 'X', clip, K: 3000, power: 0.75 }); lamp(s, 'sconce', -76.1, 2.05, z, { face: 'x', clip, K: 3000, power: 0.75 }); }
  for (const x of [-91.6, -80.4]) lamp(s, 'globe', x, 2.55, -16.5, { r: 0.18, drop: 0.7, clip, K: 3000, power: 0.9 });
  prop(s, 'baths.fernpot', -95.35, 0, -19.4, 0, { pot: PAL.coral, size: 1.0 });
  prop(s, 'baths.fernpot', -76.65, 0, -13.6, 0, { pot: PAL.teal, size: 1.0 });
  s.spot('work', -86.0, 0, -15.2, Math.PI / 2, { tags: ['sweep', 'baths'] });
}

// ================================================================================================
// the steam room
// ================================================================================================
function steamDetail(s, game, clip) {
  const g = s.g;
  // tiered tiled benches along the back and west walls
  const tier = (x0, z0, x1, z1, y, tint) => {
    s.furniture(() => { g.mat('tile', tint); g.box(x0, 0, z0, x1, y - 0.05, z1, { aoBottom: 0.6 }); g.mat('wood', '#8a6240', { rough: -0.05 }); for (let u = 0; u < 6; u++) { const a = u / 6; if (z1 - z0 < x1 - x0) g.box(x0, y - 0.05, z0 + (z1 - z0) * a + 0.01, x1, y, z0 + (z1 - z0) * (a + 1 / 6) - 0.01, { bevel: 0.006 }); else g.box(x0 + (x1 - x0) * a + 0.01, y - 0.05, z0, x0 + (x1 - x0) * (a + 1 / 6) - 0.01, y, z1, { bevel: 0.006 }); } });
    s.solid(x0, 0, z0, x1, y, z1);
  };
  tier(-103.84, -13.68, -96.08, -13.08, 0.9, '#2a6863');
  tier(-103.84, -14.28, -96.08, -13.68, 0.45, '#3f7f73');
  tier(-103.84, -19.6, -103.24, -13.68, 0.9, '#2a6863');
  tier(-103.24, -19.6, -102.64, -14.28, 0.45, '#3f7f73');
  // wall finish: the -96 side and the back
  wall(s, -96.08, -20, -96.08, -13, 0, 2.6, { mat: 'tile', tint: '#4f8f80', dado: { h: 0.95, mat: 'mosaic', tint: '#2a6863' }, skirt: false, noCollide: true });
  s.structure(() => { g.mat('tile', '#4f8f80'); g.box(-103.84, 0.9, -13.12, -96.1, 2.6, -13.1, { faces: 'z' }); g.mat('mosaic', PAL.coral); g.box(-103.84, 1.9, -13.14, -96.1, 1.98, -13.12, { faces: 'z' }); g.box(-103.84, 1.9, -19.9, -103.82, 1.98, -13.12, { faces: 'X' }); });
  // the glazed front onto the hall, with its door
  s.structure(() => {
    g.mat('wood', '#4a3220');
    for (const x of [-103, -101.6, -100.45, -99.55, -98.4, -97]) g.box(x - 0.05, 0, -20.06, x + 0.05, 2.4, -19.94, { bevel: 0.01 });
    g.box(-103, 2.33, -20.06, -97, 2.4, -19.94, { bevel: 0.01 }); g.box(-103, 0, -20.06, -100.45, 0.5, -19.94, { bevel: 0.01 }); g.box(-99.55, 0, -20.06, -97, 0.5, -19.94, { bevel: 0.01 });
  });
  for (const pr of [[-102.95, -101.65], [-101.55, -100.5], [-99.5, -98.45], [-98.35, -97.05]]) { s.glass(pr[0], 0.5, -20, pr[1], 2.33, -20, { tint: '#f4e8d8', opacity: 0.42, rough: 0.35 }); }
  s.solid(-103, 0, -20.08, -100.45, 2.4, -19.92); s.solid(-99.55, 0, -20.08, -97, 2.4, -19.92);
  door(s, { x: -100.45, y: 0, z: -20, w: 0.9, h: 2.25, along: 'x', style: 'glazed', tint: '#4a3220', swing: 1, label: 'the steam room', auto: true });
  sign(s, { kind: 'label', text: 'steam', ink: '#f1e6c9' }, -100.0, 2.37, -20.08, { face: 'z', w: 0.5, h: 0.1 });
  // the steam outlet: a brass box under a grille in the corner, steam over it
  s.furniture(() => { g.mat('cast', PAL.brass); g.box(-97.0, 0, -19.9, -96.1, 0.55, -19.0, { bevel: 0.02 }); g.mat('grille', '#6a5a3a'); g.box(-96.95, 0.55, -19.85, -96.15, 0.56, -19.05, { faces: 'Y' }); });
  s.solid(-97.0, 0, -19.9, -96.1, 0.56, -19.0);
  lamp(s, 'sconce', -96.12, 1.7, -15.0, { face: 'x', clip, K: 2400, power: 0.55 });
  lamp(s, 'sconce', -103.8, 1.75, -18.6, { face: 'X', clip, K: 2400, power: 0.4 });
  lamp(s, 'bulb', -100, 2.2, -16.4, { clip, K: 2300, power: 0.35, range: 5 });
  for (const p of [[-96.6, 0.9, -19.4, 1.4, 0.07], [-97.4, 1.7, -18.6, 2.0, 0.04], [-102.4, 2.1, -14.4, 2.4, 0.035], [-99.4, 2.25, -14.8, 2.2, 0.03], [-102.8, 1.9, -18.0, 2.0, 0.03]]) {
    s.glowCard(p[0], p[1], p[2], { face: 'Z', color: '#fff0de', size: p[3], strength: p[4], follow: 'lamps' });
    s.glowCard(p[0], p[1], p[2], { face: 'X', color: '#fff0de', size: p[3] * 0.9, strength: p[4] * 0.8, follow: 'lamps' });
  }
  // people on the tiers
  for (let i = 0; i < 6; i++) s.spot('sit', -103.2 + i * 1.25, 0.9, -13.4, Math.PI, { tags: ['steam', 'baths'] });
  for (let i = 0; i < 5; i++) s.spot('sit', -102.6 + i * 1.3, 0.45, -14.0, Math.PI, { tags: ['steam', 'baths'] });
  for (let i = 0; i < 4; i++) s.spot('sit', -103.55, 0.9, -18.9 + i * 1.2, Math.PI / 2, { tags: ['steam', 'baths'] });
  for (let i = 0; i < 3; i++) s.spot('sit', -102.95, 0.45, -18.6 + i * 1.3, Math.PI / 2, { tags: ['steam', 'baths'] });
}

// ================================================================================================
// the resting room
// ================================================================================================
function restDetail(s, game, clip) {
  const g = s.g;
  // felt hangings on three walls, a felt baffle overhead
  s.deco(() => {
    const cols = [PAL.ochre, PAL.indigo, PAL.coral, PAL.teal, '#8a2f3c', PAL.ochre];
    let i = 0;
    for (const z0 of [-19.6, -17.4, -15.2]) { g.mat('felt', cols[i++]); g.sheet([-75.88, 2.75, z0], [-75.88, 2.75, z0 + 2.0], [-75.86, 0.5, z0 + 2.0], [-75.86, 0.5, z0], { nu: 6, nv: 4, ripple: 0.025, rippleN: 6 }); }
    for (const z0 of [-19.6, -17.4, -15.2]) { g.mat('felt', cols[i++ % cols.length]); g.sheet([-68.12, 2.75, z0 + 2.0], [-68.12, 2.75, z0], [-68.14, 0.5, z0], [-68.14, 0.5, z0 + 2.0], { nu: 6, nv: 4, ripple: 0.025, rippleN: 6 }); }
    g.mat('felt', '#c9a46a'); g.sheet([-75.6, 2.7, -13.12], [-68.4, 2.7, -13.12], [-68.4, 1.6, -13.1], [-75.6, 1.6, -13.1], { nu: 10, nv: 3, ripple: 0.02, rippleN: 14 });
    g.mat('cast', '#3a2a1e'); g.tube([[-75.88, 2.78, -19.7], [-75.88, 2.78, -13.2]], 0.015, { segs: 5 }); g.tube([[-68.12, 2.78, -19.7], [-68.12, 2.78, -13.2]], 0.015, { segs: 5 });
    for (let k = 0; k < 3; k++) { g.mat('felt', [PAL.indigo, PAL.ochre, PAL.teal][k]); g.sheet([-75.2, 2.98, -18.6 + k * 2.2], [-68.8, 2.98, -18.6 + k * 2.2], [-68.8, 2.62, -18.6 + k * 2.2], [-75.2, 2.62, -18.6 + k * 2.2], { nu: 8, nv: 2, sag: 0.08 }); }
  });
  // five loungers along the back wall, heads to the wall
  const towels = [PAL.cream, PAL.sea, PAL.coral, PAL.cream, PAL.ochre];
  for (let i = 0; i < 5; i++) prop(s, 'baths.lounger', -75.0 + i * 1.45, 0, -14.18, 0, { wood: ['#9a7448', '#b08d5e', '#8a6240'][i % 3], towel: towels[i] }, { spot: { tags: ['rest', 'baths'] } });
  // a rug, a low tea table, a board game with its cushions
  prop(s, 'rug', -72, 0, -17.6, 0, { w: 4.6, d: 3.0, a: '#8a2f3c', b: PAL.ochre });
  s.furniture(() => {
    g.mat('wood', '#5a3d28'); g.box(-73.9, 0.3, -18.0, -72.7, 0.35, -17.3, { bevel: 0.012 });
    for (const sx of [-73.8, -72.8]) for (const sz of [-17.9, -17.4]) g.box(sx - 0.025, 0, sz - 0.025, sx + 0.025, 0.3, sz + 0.025, { bevel: 0.006 });
  });
  s.solid(-73.9, 0, -18.0, -72.7, 0.35, -17.3);
  prop(s, 'baths.teapot', -73.3, 0.35, -17.65, 0.4, { glaze: PAL.teal });
  for (const c of [[-73.7, -17.45], [-73.55, -17.85], [-72.95, -17.5], [-72.85, -17.85]]) prop(s, 'cup', c[0], 0.35, c[1], 0, { glaze: PAL.cream, lid: PAL.sea });
  for (const c of [[-74.4, -17.65, Math.PI / 2], [-72.2, -17.65, -Math.PI / 2]]) prop(s, 'baths.cushion', c[0], 0, c[1], c[2], { c: c[0] < -73 ? PAL.ochre : PAL.coral });
  prop(s, 'baths.game', -70.4, 0, -18.2, 0.1, {});
  for (const c of [[-70.4, -17.5, Math.PI], [-70.4, -18.9, 0]]) prop(s, 'baths.cushion', c[0], 0, c[1], c[2], { c: c[1] > -18 ? PAL.indigo : PAL.teal });
  // a shelf of games and a fern by the door
  s.furniture(() => {
    g.mat('wood', '#5a3d28'); g.box(-69.4, 0, -19.92, -68.2, 1.2, -19.55, { bevel: 0.01 });
    const bc = [PAL.coral, PAL.indigo, PAL.ochre, PAL.teal, '#8a2f3c', PAL.cream];
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { g.mat('paper', bc[(r * 4 + i) % 6]); g.box(-69.3 + i * 0.27, 0.1 + r * 0.38, -19.85, -69.07 + i * 0.27, 0.16 + r * 0.38 + (i % 2) * 0.03, -19.6, { bevel: 0.006 }); }
  });
  s.solid(-69.4, 0, -19.92, -68.2, 1.2, -19.55);
  prop(s, 'baths.fernpot', -75.4, 0, -19.4, 0, { pot: PAL.ochre, size: 1.1 });
  prop(s, 'baths.fernpot', -68.7, 0, -16.2, 0, { pot: PAL.coral, size: 0.8 });
  // the doorway's curtain, drawn aside
  s.deco(() => { g.mat('felt', '#8a2f3c'); g.sheet([-71.38, 2.12, -19.8], [-70.75, 2.12, -19.8], [-70.8, 0.05, -19.74], [-71.25, 0.05, -19.74], { nu: 4, nv: 5, ripple: 0.03, rippleN: 5 }); g.mat('cast', PAL.brass); g.tube([[-72.7, 2.15, -19.8], [-70.6, 2.15, -19.8]], 0.012, { segs: 5 }); });
  // low lanterns
  lamp(s, 'lantern', -73.3, 2.1, -17.65, { tint: PAL.ochre, drop: 0.7, clip, K: 2500, power: 0.6 });
  lamp(s, 'lantern', -70.4, 2.0, -18.2, { tint: PAL.coral, drop: 0.8, clip, K: 2500, power: 0.5 });
  lamp(s, 'lantern', -72.0, 2.25, -14.8, { tint: '#f2c879', drop: 0.55, clip, K: 2500, power: 0.45 });
}

// ================================================================================================
// the main hall: walls, arcades, the vault
// ================================================================================================
function hallShell(s, game, clip) {
  const g = s.g;
  const outer = { mat: 'tile', tint: PAL.cream, dado: { h: 1.4, mat: 'tile', tint: PAL.sea }, skirt: PAL.seaD };
  wall(s, -103.92, HALL.z0 - 0.08, -103.92, -20, 0, 3.4, outer);
  wall(s, -68.08, HALL.z0 - 0.08, -68.08, -20, 0, 3.4, outer);
  wall(s, -104, -40, -96, -40, 0, 3.4, outer); wall(s, -76, -40, -68, -40, 0, 3.4, outer);
  wall(s, -96, -40, -76, -40, 0, 7.2, { mat: 'tile', tint: PAL.cream, dado: { h: 0.95, mat: 'pattern', tint: PAL.coral }, skirt: false });
  wall(s, -96, -20, -76, -20, 3.4, 3.8, { mat: 'tile', tint: PAL.cream, skirt: false });
  // the arcades between nave and aisles
  const ops = []; for (let k = 0; k < 5; k++) ops.push({ at: 0.34 + 4 * k, w: 3.5, h: 3.0 });
  wall(s, -96, HALL.z0 + 0.08, -96, -20.08, 0, SPR, { mat: 'tile', tint: PAL.cream, tintA: PAL.cream, dado: { h: 1.4, mat: 'tile', tint: PAL.sea }, skirt: PAL.seaD, openings: ops, cap: true });
  wall(s, -76, HALL.z0 + 0.08, -76, -20.08, 0, SPR, { mat: 'tile', tint: PAL.cream, dado: { h: 1.4, mat: 'tile', tint: PAL.sea }, skirt: PAL.seaD, openings: ops, cap: true });
  for (let k = 0; k < 5; k++) { const zc = HALL.z0 + 0.08 + 0.34 + 4 * k + 1.75; smoothArch(s, -96, 0, zc, 3.5, 3.0, 'z', { tint: PAL.bone, depth: 0.3, rise: 1.0, f: 0.14 }); smoothArch(s, -76, 0, zc, 3.5, 3.0, 'z', { tint: PAL.bone, depth: 0.3, rise: 1.0, f: 0.14 }); }
  // the aisles' flat ceilings with beams; floors (cut round the pools later)
  for (const xx of [[-104, -96], [-76, -68]]) {
    ceiling(s, xx[0], HALL.z0, xx[1], -20, 3.3, 'paint', '#efe4cc');
    s.deco(() => {
      g.mat('wood', '#4a3220'); for (const z of PIERS.concat([-38.8, -21.2])) g.box(xx[0] + 0.05, 3.08, z - 0.1, xx[1] - 0.05, 3.3, z + 0.1, { bevel: 0.012 });
      // the loop's return and a cold main along the aisle ceiling, on hangers
      const px = xx[0] < -100 ? -103.3 : -68.7;
      g.mat('felt', '#e8dcc4'); g.tube([[px, 2.92, HALL.z0 + 0.1], [px, 2.92, -20.1]], 0.07, { segs: 10, caps: false });
      g.mat('cast', '#3f6f8a'); g.tube([[px + (px < -90 ? 0.28 : -0.28), 2.98, HALL.z0 + 0.1], [px + (px < -90 ? 0.28 : -0.28), 2.98, -20.1]], 0.04, { segs: 8, caps: false });
      g.mat('cast', '#2a2622'); for (let z = HALL.z0 + 1.2; z < -20.5; z += 2.4) g.tube([[px, 3.3, z], [px, 2.99, z]], 0.008, { segs: 4 });
      g.mat('cast', PAL.brass); for (let z = HALL.z0 + 1.2; z < -20.5; z += 2.4) g.tube([[px, 2.92, z - 0.025], [px, 2.92, z + 0.025]], 0.076, { segs: 10 });
    });
  }
  // a frieze along the nave walls above the aisle roofs: sea green, a coral band, cream
  s.structure(() => {
    for (const side of [[NAVE.x0, 1], [NAVE.x1, -1]]) {
      const x = side[0], d = side[1];
      g.mat('mosaic', PAL.sea); g.box(Math.min(x, x + d * 0.012), 3.55, HALL.z0 + 0.1, Math.max(x, x + d * 0.012), 4.1, -20.1, { faces: d > 0 ? 'X' : 'x' });
      g.mat('mosaic', PAL.coral); g.box(Math.min(x, x + d * 0.02), 3.62, HALL.z0 + 0.1, Math.max(x, x + d * 0.02), 3.7, -20.1, { faces: d > 0 ? 'X' : 'x' }); g.box(Math.min(x, x + d * 0.02), 3.95, HALL.z0 + 0.1, Math.max(x, x + d * 0.02), 4.03, -20.1, { faces: d > 0 ? 'X' : 'x' });
      g.mat('wood', '#4a3220'); g.box(Math.min(x, x + d * 0.22), SPR - 0.14, HALL.z0 + 0.08, Math.max(x, x + d * 0.22), SPR + 0.04, -20.08, { bevel: 0.015 });
    }
  });
  // the vault: a shell of warm plaster, wooden ribs over each pier, tie beams across, a brass ridge
  const N = 22, zA = HALL.z0 + 0.08, zB = -20.08;
  const pts = []; for (let i = 0; i <= N; i++) { const x = NAVE.x0 + (NAVE.x1 - NAVE.x0) * i / N; pts.push([x, arcY(x)]); }
  for (let zz = 0; zz < 4; zz++) {
    const za = zA + (zB - zA) * zz / 4, zb = zA + (zB - zA) * (zz + 1) / 4;
    s.structure(() => {
      g.mat('plaster', '#ecd9b4');
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[i + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        quadN(g, [a[0], a[1], za], [b[0], b[1], za], [b[0], b[1], zb], [a[0], a[1], zb], [VC - mx, VCY - my, 0]);
      }
    });
  }
  for (const zr of PIERS) {
    s.structure(() => {
      g.mat('wood', '#5a3d28');
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[i + 1];
        const na = [VC - a[0], VCY - a[1]], nb = [VC - b[0], VCY - b[1]]; const la = Math.hypot(na[0], na[1]), lb = Math.hypot(nb[0], nb[1]);
        const ai = [a[0] + na[0] / la * 0.2, a[1] + na[1] / la * 0.2], bi = [b[0] + nb[0] / lb * 0.2, b[1] + nb[1] / lb * 0.2];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        quadN(g, [ai[0], ai[1], zr - 0.14], [bi[0], bi[1], zr - 0.14], [bi[0], bi[1], zr + 0.14], [ai[0], ai[1], zr + 0.14], [VC - mx, VCY - my, 0]);
        quadN(g, [a[0], a[1], zr - 0.14], [b[0], b[1], zr - 0.14], [bi[0], bi[1], zr - 0.14], [ai[0], ai[1], zr - 0.14], [0, 0, -1]);
        quadN(g, [a[0], a[1], zr + 0.14], [b[0], b[1], zr + 0.14], [bi[0], bi[1], zr + 0.14], [ai[0], ai[1], zr + 0.14], [0, 0, 1]);
      }
      // the tie beam with an iron rod up to the crown
      g.box(NAVE.x0, SPR - 0.1, zr - 0.13, NAVE.x1, SPR + 0.22, zr + 0.13, { bevel: 0.02 });
      g.mat('cast', '#2a2622'); g.tube([[VC, SPR + 0.22, zr], [VC, CROWN - 0.2, zr]], 0.025, { segs: 6 });
      for (const sx of [-1, 1]) g.tube([[VC + sx * 4.5, SPR + 0.22, zr], [VC + sx * 1.2, arcY(VC + sx * 1.2) - 0.2, zr]], 0.018, { segs: 5 });
      g.mat('cast', PAL.brass); for (const sx of [-1, 1]) g.box(VC + sx * 6 - 0.06, SPR - 0.12, zr - 0.15, VC + sx * 6 + 0.06, SPR + 0.24, zr + 0.15, { bevel: 0.01 });
    });
  }
  s.deco(() => { g.mat('cast', PAL.brass); g.tube([[VC, CROWN - 0.12, zA + 0.1], [VC, CROWN - 0.12, zB - 0.1]], 0.05, { segs: 8 }); });
  // the end wall over the arch: a fan of glowing frosted glass (a lamp, not a window), and the arch's coral surround
  s.structure(() => {
    const cx = -86, cy = 3.4, R0 = 0.55, R1 = 2.3; const n = 9;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
      g.mat('diffuser', i % 2 ? '#f6dfb4' : '#f2d4a0', { emissive: 1.6, lamp: true });
      const p = (a, r) => [cx - Math.cos(a) * r, cy + Math.sin(a) * r, -20.1];
      quadN(g, p(a0 + 0.02, R0), p(a1 - 0.02, R0), p(a1 - 0.02, R1), p(a0 + 0.02, R1), [0, 0, -1]);
      g.mat('cast', PAL.brass); const q0 = p(a0, R0), q1 = p(a0, R1 + 0.08);
      g.tube([[q0[0], q0[1], -20.13], [q1[0], q1[1], -20.13]], 0.02, { segs: 5 });
    }
    g.mat('mosaic', PAL.coral);
    for (let i = 0; i < 18; i++) { const a0 = Math.PI * i / 18, a1 = Math.PI * (i + 1) / 18; const p = (a, r) => [cx - Math.cos(a) * r, cy + Math.sin(a) * r, -20.11]; quadN(g, p(a0, R1 + 0.08), p(a1, R1 + 0.08), p(a1, R1 + 0.28), p(a0, R1 + 0.28), [0, 0, -1]); }
  });
  s.light({ at: [-86, 4.4, -20.6], color: '#ffd9a0', power: 1.4, range: 7, clip, lamp: true, radius: 1.2 });
  // the mosaic on the end wall, lit along its sunline
  const sun = mosaicPicture(s, NAVE.x0 + 0.1, NAVE.x1 - 0.1, 0.95, HALL.z0 + 0.08, (x) => arcY(x) - 0.03, { sunY: 3.9 });
  void sun;
  s.light({ at: [NAVE.x0 + 2.0, 3.9, HALL.z0 + 0.35], to: [NAVE.x1 - 2.0, 3.9, HALL.z0 + 0.35], type: 'tube', color: '#ffd890', power: 1.6, range: 4.5, clip, lamp: true, radius: 0.15 });
  for (const sx of [-1, 1]) s.light({ at: [VC + sx * 5.5, SPR - 0.2, -35.4], type: 'spot', dir: [-sx * 0.05, -0.12, -1], cone: [48, 26], color: '#ffe0b0', power: 7, range: 11, clip, lamp: true, shadow: true });
  // a coral and cream pattern dado under the mosaic, a cornice line
  s.structure(() => { g.mat('tile', PAL.cream); g.box(NAVE.x0, 0.86, HALL.z0 + 0.08, NAVE.x1, 0.95, HALL.z0 + 0.12, { bevel: 0.01 }); });
}

// ================================================================================================
// the pools, the floor cut round them, steam
// ================================================================================================
function pool(s, P, o = {}) {
  const g = s.g;
  s.structure(() => {
    g.mat('tile', P.tile);
    if (!P.back) g.box(P.x0, P.bottom, P.z0 - 0.06, P.x1, 0, P.z0, { faces: 'Z' });
    else g.box(P.x0, P.bottom, P.z0, P.x1, 0.0, P.z0 + 0.012, { faces: 'Z' });
    g.box(P.x0, P.bottom, P.z1, P.x1, 0, P.z1 + 0.06, { faces: 'z' });
    g.box(P.x0 - 0.06, P.bottom, P.z0, P.x0, 0, P.z1, { faces: 'X' });
    g.box(P.x1, P.bottom, P.z0, P.x1 + 0.06, 0, P.z1, { faces: 'x' });
    g.mat('tile', shadeHex(P.tile, 0.55)); g.box(P.x0, P.bottom - 0.02, P.z0, P.x1, P.bottom, P.z1, { faces: 'Y' });
    // a coral line of tile just above the water, all round
    g.mat('tile', o.line || PAL.coral);
    const y0 = P.water + 0.04, y1 = P.water + 0.1;
    if (!P.back) g.box(P.x0, y0, P.z0, P.x1, y1, P.z0 + 0.008, { faces: 'Z' }); else g.box(P.x0, y0, P.z0 + 0.012, P.x1, y1, P.z0 + 0.02, { faces: 'Z' });
    g.box(P.x0, y0, P.z1 - 0.008, P.x1, y1, P.z1, { faces: 'z' });
    g.box(P.x0, y0, P.z0, P.x0 + 0.008, y1, P.z1, { faces: 'X' }); g.box(P.x1 - 0.008, y0, P.z0, P.x1, y1, P.z1, { faces: 'x' });
    // the coping: a rounded cream lip all round
    g.mat('terrazzo', o.coping || '#efe2c6');
    const c = 0.32, l = 0.05;
    if (!P.back) g.box(P.x0 - c, -0.05, P.z0 - c, P.x1 + c, 0.016, P.z0 + l, { bevel: 0.022 });
    g.box(P.x0 - c, -0.05, P.z1 - l, P.x1 + c, 0.016, P.z1 + c, { bevel: 0.022 });
    g.box(P.x0 - c, -0.05, P.z0 + (P.back ? 0 : l), P.x0 + l, 0.016, P.z1 - l, { bevel: 0.022 });
    g.box(P.x1 - l, -0.05, P.z0 + (P.back ? 0 : l), P.x1 + c, 0.016, P.z1 - l, { bevel: 0.022 });
  });
  // the water: a glossy sheet, subdivided so it bends with the floor
  s.furniture(() => {
    g.mat('glaze', o.water || PAL.water, { rough: -0.4 });
    const n = Math.max(1, Math.ceil((P.x1 - P.x0) / 4));
    for (let i = 0; i < n; i++) { const xa = P.x0 + (P.x1 - P.x0) * i / n, xb = P.x0 + (P.x1 - P.x0) * (i + 1) / n; g.quad([xa, P.water, P.z1], [xb, P.water, P.z1], [xb, P.water, P.z0], [xa, P.water, P.z0]); }
  });
  // collision: the bottom (wading, surf water), the walls below the deck's slab
  s.solid(P.x0, P.bottom - 0.5, P.z0, P.x1, P.bottom, P.z1, { surf: 'water' });
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z0 - 0.1, P.x1 + 0.1, -0.5, P.z0);
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z1, P.x1 + 0.1, -0.5, P.z1 + 0.1);
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z0, P.x0, -0.5, P.z1);
  s.solid(P.x1, P.bottom - 0.5, P.z0, P.x1 + 0.1, -0.5, P.z1);
  for (const L of o.ledges || []) s.solid(L[0], P.bottom, L[1], L[2], L[4], L[3], { surf: 'water' });
}

function handrail(s, x, z, dx, dz) {
  const g = s.g;
  s.detail(() => {
    g.mat('cast', PAL.brass, { rough: -0.25 });
    g.tube([[x, 0, z], [x, 0.9, z], [x + dx * 0.25, 0.95, z + dz * 0.25], [x + dx * 0.7, 0.6, z + dz * 0.7], [x + dx * 0.95, -0.1, z + dz * 0.95]], 0.022, { segs: 8 });
    g.cyl(x, 0, z, 0.05, 0.025, { segs: 10 });
  });
  s.post(x, z, 0.04, 0, 0.95);
}

function hallPools(s, game, clip) {
  const g = s.g;
  // floors: tiled nave, hex-tiled aisles, each cut round its pools
  const hole = (P) => [P.x0, P.z0, P.x1, P.z1];
  for (const r of cutRects(NAVE.x0 - 0.08, HALL.z0, NAVE.x1 + 0.08, -20, [hole(P1), hole(P4)])) floor(s, r[0], r[1], r[2], r[3], 0, 'tile', '#ebdfc8');
  for (const r of cutRects(-104, HALL.z0, -96.08, -20, [hole(P2)])) floor(s, r[0], r[1], r[2], r[3], 0, 'hex', '#a9cbbf');
  for (const r of cutRects(-75.92, HALL.z0, -68, -20, [hole(P3)])) floor(s, r[0], r[1], r[2], r[3], 0, 'hex', '#a9cbbf');
  // a border of coral and teal tile round the nave floor
  s.structure(() => {
    g.mat('tile', PAL.teal);
    g.box(NAVE.x0 + 0.05, 0, -21.0, NAVE.x1 - 0.05, 0.004, -20.6, { faces: 'Y' });
    g.box(NAVE.x0 + 0.05, 0, -36.6, NAVE.x1 - 0.05, 0.004, -36.2, { faces: 'Y' });
    g.box(NAVE.x0 + 0.6, 0, -36.2, NAVE.x0 + 1.0, 0.004, -21.0, { faces: 'Y' }); g.box(NAVE.x1 - 1.0, 0, -36.2, NAVE.x1 - 0.6, 0.004, -21.0, { faces: 'Y' });
    g.mat('tile', PAL.coral);
    g.box(NAVE.x0 + 0.05, 0, -20.6, NAVE.x1 - 0.05, 0.004, -20.5, { faces: 'Y' }); g.box(NAVE.x0 + 0.05, 0, -36.7, NAVE.x1 - 0.05, 0.004, -36.6, { faces: 'Y' });
  });

  // the big hot pool: ledges along its long sides, steps at both ends
  // both long sides are a wide flight of submerged steps: sit on the second, climb out anywhere
  const band = []; for (let k = 0; k < 4; k++) { const top = -0.28 * (k + 1); band.push([-92, -33 + 0.3 * k, -80, -32.7 + 0.3 * k, top]); band.push([-92, -26.3 - 0.3 * k, -80, -26.0 - 0.3 * k, top]); }
  pool(s, P1, { ledges: band });
  stairs(s, -90, P1.bottom, -29.5, 'x', -P1.bottom, 2.0, 1.8, { mat: 'tile', tint: P1.tile, nosing: PAL.coral });
  stairs(s, -82, P1.bottom, -29.5, 'X', -P1.bottom, 2.0, 1.8, { mat: 'tile', tint: P1.tile, nosing: PAL.coral });
  handrail(s, -92.25, -28.45, 1, 0); handrail(s, -92.25, -30.55, 1, 0); handrail(s, -79.75, -28.45, -1, 0); handrail(s, -79.75, -30.55, -1, 0);
  // the very hot pool: ledges both sides, two steps at the front
  pool(s, P2, { ledges: [[-102.2, -31, -101.8, -26.5, -0.4], [-98.6, -31, -98.2, -26.5, -0.4], [-101.8, -31, -98.6, -30.6, -0.4], [-101.8, -26.9, -98.6, -26.5, -0.4]], line: PAL.ochre, water: '#4f9a96' });
  handrail(s, -101.15, -26.2, 0, -1);
  // the cool plunge: steps on the near side, a ledge on the far
  pool(s, P3, { ledges: [[-73.6, -30.5, -70.6, -30.1, -0.5]], line: PAL.indigo, water: '#3f8aa6' });
  stairs(s, -72.1, P3.bottom, -29.1, 'Z', -P3.bottom, 1.6, 1.2, { mat: 'tile', tint: P3.tile, nosing: PAL.indigo });
  handrail(s, -72.85, -27.25, 0, -1);
  // the long warm shallow under the mosaic: a bench along the back, a step along the front
  pool(s, P4, { ledges: [[-94, -39.84, -78, -39.4, -0.42], [-94, -37.8, -78, -37.4, -0.38]] });

  // steam over the hot water: faint pale cards, crossed so they read from any side
  const steam = (x, y, z, size, k) => { s.glowCard(x, y, z, { face: 'Z', color: '#fff1dc', size, strength: 0.045 * k, follow: 'lamps' }); s.glowCard(x, y + 0.1, z, { face: 'X', color: '#fff1dc', size: size * 0.85, strength: 0.04 * k, follow: 'lamps' }); };
  steam(-89, 0.35, -29.5, 3.2, 1); steam(-84.5, 0.45, -28.6, 2.8, 1); steam(-86.5, 0.7, -31.2, 3.4, 0.8); steam(-82, 0.3, -31, 2.4, 1);
  steam(-100.2, 0.4, -28.8, 2.6, 0.9); steam(-100.4, 0.9, -29.6, 2.0, 0.7);
  steam(-90, 0.3, -38.5, 2.6, 0.7); steam(-84, 0.4, -38.6, 2.6, 0.7); steam(-81, 0.3, -38.4, 2.2, 0.6);

  // the hot pool's spout: a tiled pillar at its far corner, a brass spout, a glossy stream into the water
  s.furniture(() => {
    g.mat('tile', PAL.coral); g.box(-102.9, 0, -31.75, -102.25, 1.05, -31.1, { bevel: 0.02, aoBottom: 0.6 });
    g.mat('tile', PAL.cream); g.box(-102.95, 1.05, -31.8, -102.2, 1.12, -31.05, { bevel: 0.015 });
    g.mat('cast', PAL.brass, { rough: -0.25 }); g.tube([[-102.4, 0.85, -31.2], [-102.0, 0.86, -30.85], [-101.85, 0.78, -30.7]], [0.045, 0.04, 0.05], { segs: 10 });
    g.mat('glaze', '#cfe8e2', { rough: -0.45 }); g.tube([[-101.84, 0.76, -30.68], [-101.78, 0.4, -30.62], [-101.74, P2.water + 0.01, -30.58]], [0.03, 0.026, 0.04], { segs: 8, caps: false });
  });
  s.solid(-102.95, 0, -31.8, -102.2, 1.12, -31.05);
  // the cool plunge's shower against the east wall: a brass riser, a big rose, a pull chain
  s.furniture(() => {
    g.mat('cast', PAL.brass, { rough: -0.2 });
    g.tube([[-68.12, 0.2, -32.0], [-68.12, 2.35, -32.0], [-68.55, 2.42, -32.0]], 0.022, { segs: 8 });
    g.lathe(-68.6, -32.0, [[0.02, 2.42], [0.1, 2.36], [0.13, 2.33], [0.0, 2.33]], { segs: 16 });
    g.mat('cast', '#7a6a4a'); g.tube([[-68.62, 2.33, -31.95], [-68.62, 1.55, -31.95]], 0.004, { segs: 4 });
    g.mat('wood', '#5a3d28'); g.cyl(-68.62, 1.48, -31.95, 0.018, 0.07, { segs: 8 });
    g.mat('grille', PAL.brass); g.box(-69.1, 0.0, -32.5, -68.2, 0.006, -31.5, { faces: 'Y' });
  });
}

// ================================================================================================
// the main hall: the pipes, benches, plants, lamps
// ================================================================================================
function hallDetail(s, game, clip) {
  const g = s.g;
  // the 65 degree loop along the west wall: two lagged pipes on brackets, coloured bands, valves, a gauge and its plate
  const PX = -103.6, pipeY = [1.05, 1.42];
  for (let seg = 0; seg < 4; seg++) {
    const za = HALL.z0 + 0.1 + seg * 4.95, zb = za + 4.95;
    s.furniture(() => {
      g.mat('felt', '#efe4cc'); for (const y of pipeY) g.tube([[PX, y, za], [PX, y, zb]], 0.1, { segs: 12, caps: false });
      g.mat('cast', PAL.brass, { rough: -0.2 });
      for (let z = za + 0.6; z < zb; z += 1.6) for (const y of pipeY) g.tube([[PX, y, z - 0.03], [PX, y, z + 0.03]], 0.108, { segs: 12 });
      g.mat('tile', PAL.coral); for (let z = za + 1.4; z < zb; z += 1.6) g.tube([[PX, pipeY[1], z - 0.08], [PX, pipeY[1], z + 0.08]], 0.104, { segs: 12, caps: false });
      g.mat('tile', PAL.teal); for (let z = za + 1.4; z < zb; z += 1.6) g.tube([[PX, pipeY[0], z - 0.08], [PX, pipeY[0], z + 0.08]], 0.104, { segs: 12, caps: false });
      g.mat('cast', '#2a2622'); for (let z = za + 0.3; z < zb; z += 1.6) { g.box(-103.84, 0.9, z - 0.03, -103.5, 0.95, z + 0.03); g.box(-103.84, 1.27, z - 0.03, -103.5, 1.32, z + 0.03); }
    });
  }
  s.solid(-103.84, 0.9, HALL.z0, -103.45, 1.55, -20);
  // valves: hand wheels on short risers
  for (const v of [[-24.6, 1.42], [-34.3, 1.05], [-37.6, 1.42]]) {
    s.detail(() => {
      g.mat('cast', PAL.brass, { rough: -0.2 }); g.tube([[PX, v[1], v[0]], [PX + 0.26, v[1], v[0]]], 0.04, { segs: 8 });
      g.mat('cast', '#a63c28'); g.push(); g.move(PX + 0.29, v[1], v[0]); g.rotZ(Math.PI / 2);
      g.lathe(0, 0, [[0.13, -0.012], [0.14, 0], [0.13, 0.012]], { segs: 18, capTop: false, capBottom: false }); g.pop();
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; g.tube([[PX + 0.29, v[1] + Math.cos(a) * 0.13, v[0] + Math.sin(a) * 0.13], [PX + 0.29, v[1] - Math.cos(a) * 0.13, v[0] - Math.sin(a) * 0.13]], 0.008, { segs: 4 }); }
    });
  }
  // the gauge: brass case, cream dial, the needle at sixty-five, a red mark at seventy
  s.detail(() => {
    const gz = -23.7, gy = 1.85, gx = -103.82;
    g.mat('cast', PAL.brass); g.tube([[PX, pipeY[1] + 0.1, gz], [PX, gy - 0.16, gz]], 0.014, { segs: 6 });
    g.push(); g.move(gx + 0.07, gy, gz); g.rotZ(-Math.PI / 2);
    g.mat('cast', PAL.brass, { rough: -0.2 }); g.cyl(0, -0.05, 0, 0.16, 0.06, { segs: 22 });
    g.mat('paint', '#f3ead6'); g.cyl(0, 0.011, 0, 0.14, 0.002, { segs: 22 });
    g.pop();
    g.mat('paint', '#2a2622');
    for (let i = 0; i <= 10; i++) { const a = -2.2 + i * 0.44; g.box(gx + 0.084, gy + Math.cos(a) * 0.115 - 0.004, gz + Math.sin(a) * 0.115 - 0.004, gx + 0.086, gy + Math.cos(a) * 0.115 + 0.004, gz + Math.sin(a) * 0.115 + 0.004, { faces: 'X' }); }
    const an = -2.2 + 6.5 * 0.44; g.tube([[gx + 0.088, gy, gz], [gx + 0.088, gy + Math.cos(an) * 0.11, gz + Math.sin(an) * 0.11]], 0.004, { segs: 4 });
    g.mat('paint', '#c9452e'); const ar = -2.2 + 7 * 0.44; g.box(gx + 0.085, gy + Math.cos(ar) * 0.12 - 0.006, gz + Math.sin(ar) * 0.12 - 0.006, gx + 0.087, gy + Math.cos(ar) * 0.12 + 0.006, gz + Math.sin(ar) * 0.12 + 0.006, { faces: 'X' });
  });
  sign(s, { kind: 'plate', text: 'The Sixty-Five', lines: ['food plant waste heat', 'in at 65 degrees', 'please do not sit on the valves'] }, -103.82, 1.68 - 0.1 + 0.62, -22.95, { face: 'X', w: 0.5, h: 0.24 });
  // warm benches under the pipes (sitting with your back to the loop)
  for (const zz of [[-39.4, -33.2], [-26.0, -24.6]]) {
    s.furniture(() => {
      g.mat('wood', '#9a7448', { rough: -0.05 }); for (let k = 0; k < 4; k++) g.box(-103.45 + k * 0.11, 0.42, zz[0], -103.36 + k * 0.11, 0.46, zz[1], { bevel: 0.006 });
      g.mat('tile', PAL.teal); for (const z of [zz[0] + 0.2, (zz[0] + zz[1]) / 2, zz[1] - 0.2]) g.box(-103.84, 0, z - 0.06, -103.0, 0.42, z + 0.06, { bevel: 0.01 });
    });
    s.solid(-103.84, 0, zz[0], -102.98, 0.46, zz[1]);
    for (let z = zz[0] + 0.4; z < zz[1] - 0.2; z += 0.75) s.spot('sit', -103.15, 0.46, z, Math.PI / 2, { tags: ['baths', 'pipes'] });
  }
  // built-in tiled benches along the east wall, with fern pots between
  for (const zz of [[-39.4, -33.6], [-26.2, -21.0]]) {
    s.furniture(() => {
      g.mat('tile', PAL.sea); g.box(-68.72, 0, zz[0], -68.16, 0.42, zz[1], { aoBottom: 0.6 });
      g.mat('tile', PAL.cream); g.box(-68.78, 0.42, zz[0] - 0.04, -68.16, 0.47, zz[1] + 0.04, { bevel: 0.015 });
      g.mat('tile', PAL.coral); g.box(-68.73, 0.3, zz[0], -68.72, 0.36, zz[1], { faces: 'x' });
    });
    s.solid(-68.78, 0, zz[0] - 0.04, -68.16, 0.47, zz[1] + 0.04);
    for (let z = zz[0] + 0.45; z < zz[1] - 0.2; z += 0.8) s.spot('sit', -68.5, 0.47, z, -Math.PI / 2, { tags: ['baths'] });
  }
  // fern pots by the arcade piers and in the corners: the damp suits them
  const pots = [[-97.0, -36.4, PAL.teal, 1.1], [-97.0, -23.1, PAL.coral, 1.0], [-75.0, -36.4, PAL.ochre, 1.1], [-75.0, -23.1, PAL.teal, 0.9],
    [-103.3, -21.0, PAL.coral, 1.2], [-103.3, -39.3, PAL.ochre, 1.3], [-68.7, -39.4, PAL.teal, 1.2], [-68.7, -20.6, PAL.coral, 1.0],
    [-94.9, -39.3, PAL.coral, 1.2], [-77.1, -39.3, PAL.coral, 1.2], [-69.3, -32.7, PAL.sea, 0.8]];
  for (const p of pots) prop(s, 'baths.fernpot', p[0], 0, p[1], rngYaw(p[0] * 7 + p[1]), { pot: p[2], size: p[3] });
  // two loungers in the east aisle, a shelf of towels by the arch
  for (let i = 0; i < 2; i++) prop(s, 'baths.lounger', -73.8 + i * 1.6, 0, -35.6, Math.PI, { wood: '#9a7448', towel: i ? PAL.sea : PAL.cream }, { spot: { tags: ['baths'] } });
  prop(s, 'baths.towels', -68.38, 0, -29.6, -Math.PI / 2, { w: 1.4, h: 1.5, shelves: 3, seed: 7 });
  // robes left on the warm rails by the arch, slippers in rows at the pools' edges
  prop(s, 'baths.robes', -92.4, 0, -20.08, Math.PI, { w: 2.6, n: 6, seed: 3, y: 1.7 });
  prop(s, 'baths.robes', -79.6, 0, -20.08, Math.PI, { w: 2.6, n: 6, seed: 5, y: 1.7 });
  const strap = [PAL.teal, PAL.coral, PAL.indigo, PAL.ochre];
  for (let i = 0; i < 7; i++) prop(s, 'baths.slippers', -90.6 + i * 1.6 + (i % 2) * 0.3, 0, -25.25 + (i % 3) * 0.08, Math.PI + (i % 3 - 1) * 0.35, { c: '#c9a46a', strap: strap[i % 4] });
  for (let i = 0; i < 5; i++) prop(s, 'baths.slippers', -92.4 + i * 3.1, 0, -36.85 + (i % 2) * 0.1, (i % 3 - 1) * 0.4, { c: '#d9b77a', strap: strap[(i + 2) % 4] });
  // lidded cups left on the coping, a few buckets
  for (const c of [[-91.2, -25.75], [-84.6, -25.8], [-80.9, -33.2], [-93.3, -37.05], [-79.0, -37.1]]) prop(s, 'cup', c[0], 0.016, c[1], 0, { glaze: PAL.cream, lid: PAL.sea });
  for (const b of [[-97.4, -26.0], [-74.9, -31.2]]) prop(s, 'baths.bucket', b[0], 0, b[1], 0.3, { dipper: true });

  // light: a row of big frosted lamps down the nave; sconces in the aisles; a coral lantern over the very hot pool
  for (const z of [-37.75, -33.75, -29.75, -25.75, -21.75]) lamp(s, 'globe', VC, 4.95, z, { r: 0.42, drop: CROWN - 0.15 - 4.95, clip, K: 2750, power: 3.2, range: 15 });
  for (const z of [-37.2, -30.0, -22.8]) { lamp(s, 'sconce', -103.82, 2.3, z, { face: 'X', clip, K: 2800, power: 0.8 }); lamp(s, 'sconce', -68.18, 2.3, z, { face: 'x', clip, K: 2800, power: 0.8 }); }
  lamp(s, 'lantern', -100.2, 2.45, -28.75, { tint: '#e8743b', drop: 0.62, r: 0.26, hh: 0.4, clip, K: 2500, power: 1.0 });
  lamp(s, 'globe', -72.1, 2.5, -29.0, { r: 0.16, drop: 0.6, clip, K: 4000, power: 0.8 });
  roomGlow(s, -104, -1.4, HALL.z0, -68, 7.1, -20, { sky: '#ffd9a8', ground: '#7fb0a4', power: 0.3 });
  roomGlow(s, NAVE.x0, SPR, HALL.z0, NAVE.x1, CROWN, -20, { sky: '#ffcf96', ground: '#ffd9a8', power: 0.18 });

  // people: work places, standing and chatting in robes
  s.spot('work', -86, 0, -35.0, 0, { tags: ['sweep', 'baths'] });
  s.spot('work', -99.0, 0, -36.5, Math.PI, { tags: ['sweep', 'baths'] });
  s.spot('stand', -103.1, 0, -23.7, Math.PI / 2, { tags: ['read', 'baths'] });
  s.spot('stand', -69.2, 0, -31.2, -Math.PI / 2, { tags: ['baths'] });
  group(s, -73.0, -22.7, 3, 0.65); group(s, -99.6, -34.2, 3, 0.6); group(s, -86.0, -35.3, 2, 0.55);
}

function rngYaw(k) { const v = Math.sin(k * 12.9898) * 43758.5453; return (v - Math.floor(v)) * Math.PI; }
function group(s, x, z, n, r, tags) {
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + 0.4; const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags: tags || ['baths'] }); }
}

// ================================================================================================
// spots in the water, walkways
// ================================================================================================
// bath seats: where people sit at the water line, facing in; the player is seated at the same places
const SEATS = { big: [], hot: [], plunge: [], shallow: [] };
for (let i = 0; i < 6; i++) { const x = -89.5 + i * 1.45; SEATS.big.push({ x, y: -0.56, z: -26.45, yaw: Math.PI }); SEATS.big.push({ x: x + 0.3, y: -0.56, z: -32.55, yaw: 0 }); }
for (const z of [-30.1, -28.6, -27.4]) { SEATS.hot.push({ x: -101.98, y: -0.4, z, yaw: Math.PI / 2 }); SEATS.hot.push({ x: -98.42, y: -0.4, z, yaw: -Math.PI / 2 }); }
SEATS.plunge.push({ x: -72.7, y: -0.5, z: -30.28, yaw: 0 }, { x: -71.5, y: -0.5, z: -30.28, yaw: 0 });
for (let i = 0; i < 9; i++) SEATS.shallow.push({ x: -93.0 + i * 1.75, y: -0.42, z: -39.6, yaw: 0 });

function peopleAndPaths(s) {
  for (const k in SEATS) for (const st of SEATS[k]) s.spot('bath', st.x, st.y, st.z, st.yaw, { tags: ['baths', k] });
  // from the street through the door, the lobby, the washing room, into the hall
  s.path([[-86, -4.6], [-86, -6.4], [-86, -8.8], [-86, -11.2], [-86, -13], [-86, -16.5], [-86, -20], [-86, -23]]);
  s.path([[-86, -8.8], [-81.3, -8.8]], { width: 1.2 });
  s.path([[-86, -6.4], [-93.6, -6.4], [-93.6, -11.6]], { width: 1.2 });
  s.path([[-86, -11.2], [-82.0, -11.7]], { width: 1.0 });
  s.path([[-86, -11.2], [-91.0, -11.6]], { width: 1.0 });
  s.path([[-86, -16.5], [-89.0, -15.2], [-94.4, -15.2]], { width: 1.1 }); s.path([[-89.0, -15.2], [-89.0, -18.6], [-94.4, -18.6]], { width: 1.0 });
  s.path([[-86, -16.5], [-83.0, -15.2], [-77.6, -15.2]], { width: 1.1 }); s.path([[-83.0, -15.2], [-83.0, -18.6], [-77.6, -18.6]], { width: 1.0 });
  // the hall: a cross walk at the front, round the big pool, down both aisles, to the steam and resting rooms
  s.path([[-86, -23], [-94, -23], [-100, -22.6], [-100, -20.8], [-100, -18.6], [-100.5, -16.2]]);
  s.path([[-86, -23], [-78, -23], [-72, -22.6], [-72, -20.8], [-72, -18.8], [-72, -16.2]]);
  s.path([[-94, -23], [-94, -29.75], [-94, -35.2], [-86, -35.6], [-78, -35.2], [-78, -29.75], [-78, -23]]);
  s.path([[-86, -23], [-86, -25.5]], { width: 1.2 });
  s.path([[-100, -22.6], [-97.2, -24.6], [-97.2, -29.75], [-97.2, -33.6], [-100.0, -36.6], [-101.5, -38.6]]);
  s.path([[-72, -22.6], [-74.9, -24.8], [-74.9, -29.75], [-74.9, -33.6], [-72.0, -37.0], [-70.6, -38.6]]);
  s.path([[-94, -29.75], [-97.2, -29.75]], { width: 1.2 }); s.path([[-78, -29.75], [-74.9, -29.75]], { width: 1.2 });
  s.path([[-94, -35.2], [-97.2, -33.6]], { width: 1.0 }); s.path([[-78, -35.2], [-74.9, -33.6]], { width: 1.0 });
  s.path([[-86, -35.6], [-86, -36.9]], { width: 1.2 });
  s.path([[-100.5, -16.2], [-101.6, -15.0]], { width: 1.0 }); s.path([[-72, -16.2], [-71.0, -15.3]], { width: 1.0 });
  // lockers and the broth shelf: people standing
  for (const z of [-11.6, -10.2, -8.3, -6.9]) s.spot('stand', -95.0, 0, z, -Math.PI / 2, { tags: ['baths', 'lockers'] });
  group(s, -84.2, -11.6, 3, 0.6); group(s, -91.0, -9.6, 2, 0.5);
  s.spot('work', -89.5, 0, -6.6, Math.PI, { tags: ['sweep', 'baths'] });
}

// ================================================================================================
// things to do
// ================================================================================================
async function talk(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
function custom(game, term) { if (game.journal && game.journal.custom) game.journal.custom(term); }
function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info' }); }

// overheard in the water: lines tagged 'baths' that suit the day and the hour
function pickChatter(game) {
  const day = game.clock ? game.clock.day : 1, part = game.clock && game.clock.part ? game.clock.part() : 'midday';
  const DAYS = ['day1', 'day2', 'day3'], PARTS = ['morning', 'midday', 'evening', 'night'];
  const ok = CHATTER.filter((e) => {
    if (!e.tags || e.tags.indexOf('baths') < 0) return false;
    const d = e.tags.filter((t) => DAYS.indexOf(t) >= 0), p = e.tags.filter((t) => PARTS.indexOf(t) >= 0);
    if (d.length && d.indexOf('day' + Math.min(3, day)) < 0) return false;
    if (p.length && p.indexOf(part) < 0) return false;
    return true;
  });
  const all = []; for (const e of ok) for (const l of e.lines) all.push(l);
  return all;
}

function interactions(s, game, f) {
  const seated = (gm, key) => gm.player && gm.player.seat && gm.player.seat.baths === key;
  const anySeat = (gm) => gm.player && gm.player.seat && gm.player.seat.baths;
  // sit the player at the seat of a group nearest to where they stand; using it again gets them out
  const sitIn = (gm, list, key, eye) => {
    const p = gm.player; if (!p) return;
    if (anySeat(gm)) { p.stand(); return; }
    let best = list[0], bd = 1e9; for (const st of list) { const d = Math.hypot(st.x - p.pos.x, st.z - p.pos.z); if (d < bd) { bd = d; best = st; } }
    p.sit({ x: best.x, y: best.y, z: best.z, yaw: best.yaw, eye, baths: key });
    p.yaw = Math.PI - best.yaw; p.pitch = -0.08;
    if (gm.sfxAt) gm.sfxAt('splash', f, best.x, 0, best.z, { vol: 0.4 });
    if (!gm.flags.bathsWashed && !gm.flags.bathsTold && gm.ui) { gm.flags.bathsTold = true; gm.ui.subtitle('A bather', 'Wash first, soak second. Dorota will know.', 4); }
  };

  // Dorota at her desk
  s.interact({ x: -80.7, y: 1.2, z: -8.8, radius: 1.7, kind: 'talk', prompt: 'Talk to Dorota', async onUse(gm) {
    if (gm.journal && gm.journal.meet) gm.journal.meet('dorota');
    if (!gm.ui) return;
    if (!gm.flags.bathsMet) { gm.flags.bathsMet = true; await talk(gm, DOROTA, ['Where did you sleep, and have you eaten. In that order.', 'Never mind. Robe from the rail, cup from the urn, wash first, then soak as long as you like.']); }
    gm.busy++; let c = null;
    try {
      c = await gm.ui.choose(DOROTA, 'What can she do for you?', [
        { label: 'A robe and a cup of broth', value: 'menu' },
        { label: 'Ask what a bath costs', value: 'cost' },
        { label: 'Ask about the black thread on the notice', value: 'thread', disabled: !!gm.flags.bathsThreadGiven },
        { label: 'Nothing, thank you', value: null },
      ]);
    } finally { gm.busy--; }
    if (c === 'menu') await bathsMenu(gm);
    else if (c === 'cost') {
      await talk(gm, DOROTA, ['Five hundredths of a kay for a long one, and the commons pays it.', "The heat is the food plant's leftovers. It comes up the loop at sixty-five whether we bathe in it or not. We pay for the pumps and the scrubbing."]);
      found(gm, 'free-bath'); custom(gm, 'The waste-heat loop');
    } else if (c === 'thread') {
      await talk(gm, DOROTA, ["Fished it out of the plunge drain this morning. Left wrist, small. It means don't message me, I won't see it.", "Nobody has come for it. Take it. Tomorrow's the Quiet, and half the drum ties one on anyway."]);
      gm.flags.bathsThreadGiven = true; if (gm.inv && gm.inv.give) gm.inv.give('black-thread');
      toast(gm, 'A black thread', 'gain'); found(gm, 'black-thread'); custom(gm, 'Going dark');
    }
  } });

  // the broth urn
  s.interact({ x: -82.4, y: 1.0, z: -12.0, radius: 1.3, prompt: (gm) => gm.flags.bathsBroth ? 'Another cup of broth' : 'Take a lidded cup of broth', onUse(gm) {
    gm.flags.bathsBroth = true; if (gm.sfxAt) { gm.sfxAt('pour', f, -82.6, 1.1, -12.4); gm.sfxAt('lid-down', f, -82.2, 1.0, -12.4, { delay: 0.8 }); }
    toast(gm, 'A lidded cup of Mill broth. Free, and hot for as long as the lid stays on.', 'gain'); custom(gm, 'Lids');
  } });
  // the robes on the warm rail (Dorota's side, but she waves you round)
  s.interact({ x: -77.0, y: 1.2, z: -9.6, radius: 1.5, prompt: (gm) => gm.flags.bathsRobe ? 'Hang the robe back on the rail' : 'Take a robe from the warm rail', onUse(gm) {
    gm.flags.bathsRobe = !gm.flags.bathsRobe;
    if (gm.flags.bathsRobe) { toast(gm, 'A robe, warm from the rail. Heliox pulls the heat off wet skin four times faster than air.', 'gain'); custom(gm, 'Heliox'); }
    else toast(gm, 'You hang the robe back over the pipe to keep warm for the next person.');
  } });
  // the rules, inside and out
  const rules = SIGNS['baths.rules'];
  const readRules = (gm) => talk(gm, { name: rules.title, colour: '#FFD9A0' }, rules.lines.join(' '));
  s.interact({ x: -89.4, y: 1.5, z: -12.5, radius: 1.3, prompt: 'Read the bath rules', onUse: readRules });
  s.interact({ x: -78.45, y: 1.5, z: -3.6, radius: 1.3, prompt: 'Read the bath rules', onUse: readRules });
  // the pipe's plate
  s.interact({ x: -103.2, y: 1.6, z: -23.2, radius: 1.4, prompt: 'Read the plate on the pipe', onUse(gm) {
    if (gm.ui) gm.ui.card({ kicker: 'A brass plate on the loop', title: 'The Sixty-Five', text: 'Waste heat from the food plant, coming up at sixty-five degrees. It warms every bath and kitchen tap in Candlewick. Heating the water costs nothing; the pumps and the cleaning cost about five hundredths of a kay a bath.', dur: 10 });
    found(gm, 'free-bath'); custom(gm, 'The waste-heat loop');
  } });

  // washing first: the nearest stool on the long walls
  s.interact({ x: -86, y: 0.8, z: -16.5, radius: 3.2, prompt: (gm) => seated(gm, 'wash') ? 'Get up' : gm.flags.bathsWashed ? 'Wash again' : 'Sit on a stool and wash first', onUse(gm) {
    const p = gm.player; if (!p) return;
    if (anySeat(gm)) { p.stand(); return; }
    const stools = []; for (const z of [-14.3, -15.6, -16.9, -18.2]) { stools.push({ x: -95.3, z, yaw: -Math.PI / 2 }); stools.push({ x: -76.7, z, yaw: Math.PI / 2 }); }
    let best = stools[0], bd = 1e9; for (const st of stools) { const d = Math.hypot(st.x - p.pos.x, st.z - p.pos.z); if (d < bd) { bd = d; best = st; } }
    p.sit({ x: best.x, y: 0.25, z: best.z, yaw: best.yaw, eye: 0.95, baths: 'wash' }); p.yaw = Math.PI - best.yaw; p.pitch = -0.15;
    if (gm.sfxAt) gm.sfxAt('pour', f, best.x, 0.6, best.z);
    if (!gm.flags.bathsWashed) { gm.flags.bathsWashed = true; if (gm.ui) gm.ui.subtitle('Someone on the next stool', 'Wash first, soak second. You learn fast.', 4); }
  } });

  // the pools
  const poolUse = (list, key, eye, x, z, r, label, enter) => s.interact({ x, y: 0.4, z, radius: r, prompt: (gm) => seated(gm, key) ? 'Get out of the water' : label, onUse(gm) {
    const was = anySeat(gm); sitIn(gm, list, key, eye); if (!was && enter && gm.ui) gm.ui.subtitle(null, enter, 5);
  } });
  const HOT = 'The very hot pool. Your ears start to ring after a minute, and everyone in it looks very pleased with themselves.';
  poolUse(SEATS.big, 'big', 0.66, -86.6, -25.5, 2.6, 'Get into the hot pool');
  poolUse(SEATS.big, 'big', 0.66, -86.6, -33.5, 2.6, 'Get into the hot pool');
  poolUse(SEATS.hot, 'hot', 0.52, -97.6, -28.75, 1.6, 'Try the very hot pool', HOT);
  poolUse(SEATS.hot, 'hot', 0.52, -100.2, -26.0, 1.4, 'Try the very hot pool', HOT);
  poolUse(SEATS.plunge, 'plunge', 0.62, -72.1, -27.0, 1.5, 'Plunge into the cool pool', 'Cold. Properly cold. Everyone watching pretends not to.');
  poolUse(SEATS.shallow, 'shallow', 0.62, -90.0, -37.0, 2.4, 'Sit in the long warm shallow');
  poolUse(SEATS.shallow, 'shallow', 0.62, -82.0, -37.0, 2.4, 'Sit in the long warm shallow');

  // the steam room: sit on the lower tier
  s.interact({ x: -100.0, y: 0.8, z: -16.0, radius: 2.4, prompt: (gm) => seated(gm, 'steam') ? 'Get up' : 'Sit in the steam', onUse(gm) {
    const p = gm.player; if (!p) return; if (anySeat(gm)) { p.stand(); return; }
    p.sit({ x: -100.0, y: 0.45, z: -14.0, yaw: Math.PI, eye: 1.1, baths: 'steam' }); p.yaw = 0; p.pitch = -0.05;
  } });
  // the resting room: lie on a lounger and let the hours go
  s.interact({ x: -72.0, y: 0.6, z: -15.6, radius: 2.0, prompt: (gm) => seated(gm, 'lounger') ? 'Get up' : 'Lie on a lounger a while', async onUse(gm) {
    const p = gm.player; if (!p) return; if (anySeat(gm)) { p.stand(); return; }
    p.sit({ x: -72.1, y: 0.62, z: -14.0, yaw: Math.PI, eye: 0.62, baths: 'lounger' }); p.yaw = 0; p.pitch = 0.18;
    if (!gm.ui || !gm.clock || !gm.ui.pickHour) return;
    gm.busy++; let h = null;
    try { h = await gm.ui.pickHour({ title: 'Lie here until', from: gm.clock.hours, to: gm.clock.hours + 8, now: gm.clock.hours }); } finally { gm.busy--; }
    if (h !== null && h !== undefined) { gm.clock.skipTo(h % 24); toast(gm, 'The felt drinks every sound. You wake warm, with the print of the slats on one cheek.'); }
  } });
  // the board game
  s.interact({ x: -70.4, y: 0.6, z: -18.2, radius: 1.3, prompt: 'Look at the board game', onUse(gm) {
    talk(gm, { name: 'The board', colour: '#FFD9A0' }, ['Stones on a board of nine by nine, a game left halfway. Someone has chalked on the table whose turn it is.', 'Yours, apparently.']);
  } });

  // while you sit in the water: what people say in the steam
  let tNext = 5, wet = 0; const queue = [];
  s.world.dynamics.push({ scope: s, update(dt) {
    const gm = game, p = gm.player, k = p && p.seat && p.seat.baths;
    for (let i = queue.length - 1; i >= 0; i--) { queue[i].t -= dt; if (queue[i].t <= 0) { if (gm.ui && k) gm.ui.subtitle(queue[i].who, queue[i].text, 5); queue.splice(i, 1); } }
    if (!k || k === 'lounger' || k === 'wash') { tNext = Math.max(tNext, 4); return; }
    wet += dt; tNext -= dt;
    if (wet > 30 && !gm.flags.bathsSawThread && (k === 'big' || k === 'shallow' || k === 'steam')) {
      gm.flags.bathsSawThread = true; tNext = 12;
      if (gm.ui) gm.ui.subtitle(null, 'Across the water, a girl of about fifteen with a black thread round her left wrist, laughing with three friends. Nobody here sends her anything.', 7);
      found(gm, 'black-thread'); custom(gm, 'Going dark'); return;
    }
    if (tNext > 0) return;
    tNext = 10 + Math.random() * 7;
    const lines = pickChatter(gm); if (!lines.length || !gm.ui) return;
    const l = lines[Math.floor(Math.random() * lines.length)];
    const names = ['A bather', 'Someone in the steam', 'An old man by the steps', 'A woman with her eyes shut', 'A boy on the ledge'];
    const a = names[Math.floor(Math.random() * names.length)];
    if (Array.isArray(l)) { gm.ui.subtitle(a, l[0], 5); queue.push({ t: 2.8, who: 'Another', text: l[1] }); }
    else gm.ui.subtitle(a, l, 5);
  } });
}

async function bathsMenu(game) {
  const M = MENUS.baths; if (!M || !game.ui) return;
  game.busy++; let id = null;
  try { id = await game.ui.menu({ kicker: 'Dorota', title: M.title, note: M.note, items: M.items.map((it) => Object.assign({}, it)), wallet: game.wallet ? game.wallet.kwh : 0 }); } finally { game.busy--; }
  if (!id) return;
  if (id === 'robe') { game.flags.bathsRobe = true; toast(game, 'A robe, warm from the rail. Heliox pulls the heat off wet skin four times faster than air.', 'gain'); custom(game, 'Heliox'); }
  else if (id === 'cup-broth') { game.flags.bathsBroth = true; if (game.audio) game.audio.play('cup', {}); toast(game, 'A lidded cup of Mill broth from the urn by the door.', 'gain'); custom(game, 'Lids'); }
  else if (id === 'bath') { await talk(game, DOROTA, ['Through the washing room. Stool, bucket, tap, and then the pools.', 'Stay as long as you like. The heat was going spare anyway.']); found(game, 'free-bath'); }
  else if (id === 'cool-pool') await talk(game, DOROTA, ['The plunge is in the spinward aisle, by the shower. Go in all at once. Nobody has ever gone in slowly and enjoyed it.']);
}

// ================================================================================================
// sound: started once, the first time anyone walks in
// ================================================================================================
function sounds(s, game, f) {
  let on = false;
  game.events.on('zone', (e) => {
    const z = e && (e.zone || e); if (on || !z || z.place !== 'baths' || !game.audio || !game.loopAt) return; on = true;
    game.loopAt('water-lap', f, -86, -0.2, -29.5, { vol: 0.35, radius: 12 });
    game.loopAt('water-lap', f, -86, -0.15, -38.6, { vol: 0.2, radius: 9 });
    game.loopAt('fountain', f, -101.8, 0.5, -30.6, { vol: 0.3, radius: 7 });
    game.loopAt('steam', f, -96.6, 0.6, -19.4, { vol: 0.35, radius: 6 });
    game.loopAt('murmur', f, -86, 1.2, -30, { vol: 0.3, radius: 20, param: 0.45 });
    game.loopAt('shower', f, -86, 1.0, -16.5, { vol: 0.12, radius: 9 });
    game.loopAt('tide', f, -103.6, 1.2, -30, { vol: 0.15, radius: 6 });
  });
}
