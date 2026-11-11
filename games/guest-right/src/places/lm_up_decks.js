// The Simmer: Chervil's slow water, on the High decks (deck 340, Ring Three, 0.55 g), and the elders' rooms round it.
//
// A warm pool fifty metres long in a tiled hall two decks tall, along the axis so a swimmer weighs the same both ways.
// A paddle at the back end sends a swell down it all day; at a little over half a g each wave takes thirteen seconds to
// reach the steps at the front and stands about a third taller than the same push would raise at the rim. The old float
// in it and talk. Deck 341's flats open onto a balcony over the water. The light off the waves moves on the vault.
//
// Round it (lm_up_decks_rooms.js): the cab lobby at the front end; Second Pot, the tea room behind glass on the anti
// side; the Up Table, where Ring Three's elders are given their flats; and through the spinward wall Potherb Lane, a
// quiet corridor of elders' doors with the light of their gardens under them, which ends at the Carver (the oldest chair
// on the deck) and the foot of the Lake Stair.
//
// Frame 'up-decks': x spinward, z toward the back cap, y up; deck 340's floor at y = 0, deck 341's at y = 4.
import { floor, wall, lamp, roomGlow, stairs } from '../world/kit.js';
import { railing, column } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { shadeHex } from '../core/util.js';
import { bathsParts, cutRects, quadN, smoothArch } from './baths_parts.js';
import { PI, REGION, GEE, HALL, POOL, STEPS, BAL, PAL, vaultY, say, toast, card, sfx, custom, tick, run, pick } from './lm_up_decks_props.js';
import { buildWater, bottomAt, CROSS_S, DIAL } from './lm_up_decks_water.js';
import { buildRooms } from './lm_up_decks_rooms.js';

const ENV = { exposure: 1.0, autoKey: 0.16, bloom: 0.06, warmth: 0.22, contrast: 1.05, saturation: 1.08 };
const CLIP = [HALL.x0 - 0.1, -3.0, HALL.z0 - 0.1, HALL.x1 + 0.1, HALL.crown + 0.1, HALL.z1 + 0.1];
const COLS = []; for (let z = -30; z <= 30.01; z += 6) COLS.push(z);            // the arcade under the balcony
const BAYS = []; for (let z = -27; z <= 27.01; z += 6) BAYS.push(z);            // the flats along the balcony, one to a bay

export const place = {
  id: 'lm-up-decks', name: 'The Simmer', order: 10,
  region: REGION,
  stops: [
    { id: 'up-decks', name: 'The Simmer', sub: 'the slow water · deck 340 · Ring Three', group: 'The High decks', spawn: 'up-decks', deck: 340, zd: 1040 },
  ],
  async build(game) {
    const t0 = performance.now();
    void bathsParts;
    const W = game.world;
    const f = W.frame('up-decks', deckRadius(340), 0.3, 1040);
    const s = W.scope('up-decks', f);

    hallShell(s);
    await tick(game);
    vault(s);
    poolBasin(s);
    await tick(game);
    balcony(s);
    await tick(game);
    backEnd(s);
    hallFurnish(s);
    hallLights(s);
    await tick(game);
    const water = buildWater(game, s);
    hallLife(s);
    hallUse(game, s, f, water);
    await tick(game);
    await buildRooms(game, s, f);

    s.zoneBox({ id: 'up-decks-pool', place: 'up-decks', box: [HALL.x0, -3.0, HALL.z0, HALL.x1, HALL.crown, HALL.z1], name: 'The Simmer', sub: 'The slow water · deck 340 · 0.55 g', ambience: 'baths', reverb: 'tile', headroom: 7.4, env: ENV });
    s.zoneBox({ id: 'up-decks-balcony', place: 'up-decks', box: [BAL.x, 3.8, HALL.z0, HALL.x1, HALL.crown, HALL.z1], name: 'The Simmer', sub: 'The balcony · deck 341', ambience: 'baths', reverb: 'tile', headroom: 3.4, env: ENV });
    s.zoneBox({ id: 'up-decks-balcony-w', place: 'up-decks', box: [HALL.x0, 3.8, HALL.z0, -BAL.x, HALL.crown, HALL.z1], name: 'The Simmer', sub: 'The balcony · deck 341', ambience: 'baths', reverb: 'tile', headroom: 3.4, env: ENV });
    for (const xx of [[4, 6], [-6, -4]]) s.loop('water-lap', xx[0] < 0 ? -5 : 5, -0.2, -22, { vol: 0.32, radius: 14 });
    for (const z of [-8, 8]) s.loop('water-lap', 0, -0.2, z, { vol: 0.26, radius: 16 });
    s.loop('tide', 0, -1.5, 25.5, { vol: 0.3, radius: 12 });
    s.loop('murmur', 0, 1.0, 0, { vol: 0.26, radius: 30, param: 0.35 });

    let left = s.finish(40);
    while (left) { await tick(game); left = s.finish(40); }
    game.spawns['up-decks'] = { frame: f, x: 0, y: 0, z: -42.2, yaw: PI };
    game.spawns['up-decks-pool'] = { frame: f, x: 0, y: 0, z: -29.5, yaw: PI };
    console.log('[lm-up-decks] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the hall's shell: floors cut round the pool, the four walls (ground and balcony storeys), the lunettes under the vault
// ---------------------------------------------------------------------------------------------------------------
function hallShell(s) {
  const g = s.g;
  // floors: hex tile on the promenades, terrazzo under the arcade, a coral and teal border at the pool and the arcade
  const hole = [POOL.x0, POOL.z0, POOL.x1, POOL.z1];
  for (const r of cutRects(-BAL.x, HALL.z0, BAL.x, HALL.z1, [hole])) floor(s, r[0], r[1], r[2], r[3], 0, 'hex', '#e6d9bd');
  for (const sx of [-1, 1]) floor(s, Math.min(sx * BAL.x, sx * HALL.x1), HALL.z0, Math.max(sx * BAL.x, sx * HALL.x1), HALL.z1, 0, 'terrazzo', '#d9c9a6');
  s.structure(() => {
    for (const sx of [-1, 1]) {
      g.mat('tile', PAL.teal); g.box(Math.min(sx * 9.0, sx * 9.35), 0, POOL.z0 - 0.7, Math.max(sx * 9.0, sx * 9.35), 0.004, POOL.z1 + 0.6, { faces: 'Y' });
      g.mat('tile', PAL.coral); g.box(Math.min(sx * 9.35, sx * 9.47), 0, POOL.z0 - 0.7, Math.max(sx * 9.35, sx * 9.47), 0.004, POOL.z1 + 0.6, { faces: 'Y' });
      g.mat('tile', PAL.teal); g.box(Math.min(sx * (BAL.x - 0.45), sx * (BAL.x - 0.3)), 0, HALL.z0, Math.max(sx * (BAL.x - 0.45), sx * (BAL.x - 0.3)), 0.004, HALL.z1, { faces: 'Y' });
    }
    g.mat('tile', PAL.teal); g.box(-9.47, 0, POOL.z0 - 1.05, 9.47, 0.004, POOL.z0 - 0.7, { faces: 'Y' }); g.box(-9.47, 0, POOL.z1 + 0.6, 9.47, 0.004, POOL.z1 + 0.95, { faces: 'Y' });
    g.mat('tile', PAL.coral); g.box(-9.47, 0, POOL.z0 - 1.17, 9.47, 0.004, POOL.z0 - 1.05, { faces: 'Y' });
  });
  // the long walls: a ground storey (tea room glass, the Up Table's doors, the robe rooms, the arch into the lane) and the
  // balcony storey of deck 341's flats, a door and a window to a bay
  const ground = { mat: 'tile', tint: PAL.cream, dado: { h: 1.4, mat: 'tile', tint: PAL.sea }, skirt: PAL.deep };
  const at = (z) => z - HALL.z0;
  wall(s, HALL.x0, HALL.z0, HALL.x0, HALL.z1, 0, 4, Object.assign({}, ground, { tintA: PAL.cream, matB: 'paint', tintB: '#e8d6b0', openings: [
    { at: at(-21), w: 3.8, h: 1.75, sill: 0.75 }, { at: at(-17), w: 3.8, h: 1.75, sill: 0.75 }, { at: at(-13), w: 3.8, h: 1.75, sill: 0.75 },
    { at: at(-8.6), w: 1.4, h: 2.3 }, { at: at(9), w: 2.0, h: 2.6 }] }));
  wall(s, HALL.x1, HALL.z0, HALL.x1, HALL.z1, 0, 4, Object.assign({}, ground, { openings: [{ at: at(-12.6), w: 1.2, h: 2.2 }, { at: at(-1.6), w: 3.2, h: 2.9 }, { at: at(11.4), w: 1.2, h: 2.2 }] }));
  const upper = { mat: 'paint', tint: '#e9d5ab', skirt: false, dado: { h: 1.05, mat: 'tile', tint: PAL.teal } };
  const ups = []; for (const zc of BAYS) { ups.push({ at: at(zc - 1.9), w: 1.0, h: 2.15 }); ups.push({ at: at(zc + 0.1), w: 1.5, h: 1.25, sill: 0.9 }); }
  wall(s, HALL.x0, HALL.z0, HALL.x0, HALL.z1, 4, HALL.wallH - 4, Object.assign({}, upper, { openings: ups }));
  wall(s, HALL.x1, HALL.z0, HALL.x1, HALL.z1, 4, HALL.wallH - 4, Object.assign({}, upper, { openings: ups }));
  // the end walls: the arch to the lobby at the front, solid at the back (the wave clock is on it)
  run(HALL.x0, HALL.x1, 10.1, (a, b) => {
    const ops = []; if (a < -3.5 && b > 3.5) ops.push({ at: -3.5 - a, w: 7, h: 3.3 });
    wall(s, a, HALL.z0, b, HALL.z0, 0, HALL.wallH, Object.assign({}, ground, { dado: { h: 1.4, mat: 'tile', tint: PAL.sea }, openings: ops, skirt: PAL.deep }));
    wall(s, a, HALL.z1, b, HALL.z1, 0, HALL.wallH, Object.assign({}, ground, { dado: { h: 1.4, mat: 'tile', tint: PAL.sea } }));
  });
  smoothArch(s, 0, 0, HALL.z0, 7, 3.3, 'x', { tint: PAL.bone, depth: 0.36, rise: 1.2, f: 0.22, key: PAL.deep });
  // coral bands at the dado's top and a cornice where the walls meet the vault, all round
  s.structure(() => {
    for (const sx of [-1, 1]) {
      const x = sx * (HALL.x1 - 0.08);
      g.mat('tile', PAL.coral); g.box(Math.min(x, x - sx * 0.02), 1.4, HALL.z0, Math.max(x, x - sx * 0.02), 1.5, HALL.z1, { faces: sx > 0 ? 'x' : 'X' });
      g.mat('wood', PAL.dark); g.box(Math.min(x, x - sx * 0.2), HALL.wallH - 0.2, HALL.z0, Math.max(x, x - sx * 0.2), HALL.wallH, HALL.z1, { bevel: 0.02 });
      g.mat('tile', PAL.ochre); g.box(Math.min(x, x - sx * 0.03), HALL.wallH - 0.36, HALL.z0, Math.max(x, x - sx * 0.03), HALL.wallH - 0.28, HALL.z1, { faces: sx > 0 ? 'x' : 'X' });
    }
  });
  run(HALL.x0, HALL.x1, 10.1, (a, b) => s.structure(() => {
    for (const sz of [-1, 1]) {
      const z = sz * (HALL.z1 - 0.08);
      g.mat('tile', PAL.coral); g.box(a, 1.4, Math.min(z, z - sz * 0.02), b, 1.5, Math.max(z, z - sz * 0.02), { faces: sz > 0 ? 'z' : 'Z' });
      g.mat('wood', PAL.dark); g.box(a, HALL.wallH - 0.2, Math.min(z, z - sz * 0.2), b, HALL.wallH, Math.max(z, z - sz * 0.2), { bevel: 0.02 });
    }
  }));
  // the lunettes: the end walls carried up under the vault
  s.structure(() => {
    const N = 20;
    for (const sz of [-1, 1]) {
      const z = sz * (HALL.z1 - 0.08);
      for (let i = 0; i < N; i++) {
        const xa = HALL.x0 + (HALL.x1 - HALL.x0) * i / N, xb = HALL.x0 + (HALL.x1 - HALL.x0) * (i + 1) / N;
        g.mat('paint', '#e6dcc4'); quadN(g, [xa, HALL.wallH, z], [xb, HALL.wallH, z], [xb, vaultY(xb), z], [xa, vaultY(xa), z], [0, 0, -sz]);
      }
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the vault: a shallow plaster arc across the hall, ribs every four metres, a brass ridge pipe; the light off the water
// plays on it (lm_up_decks_water.js)
// ---------------------------------------------------------------------------------------------------------------
function vault(s) {
  const g = s.g, N = 26;
  const pts = []; for (let i = 0; i <= N; i++) { const x = HALL.x0 + (HALL.x1 - HALL.x0) * i / N; pts.push([x, vaultY(x)]); }
  run(HALL.z0, HALL.z1, 17.1, (za, zb) => s.structure(() => {
    g.mat('plaster', '#e8e6dc');
    for (let i = 0; i < N; i++) { const a = pts[i], b = pts[i + 1]; quadN(g, [a[0], a[1], za], [b[0], b[1], za], [b[0], b[1], zb], [a[0], a[1], zb], [0, -1, 0]); }
  }));
  for (let z = -32; z <= 32.01; z += 4) {
    s.structure(() => {
      g.mat('tile', z % 8 === 0 ? PAL.teal : PAL.deep);
      for (let i = 0; i < N; i++) {
        const a = pts[i], b = pts[i + 1];
        quadN(g, [a[0], a[1] - 0.2, z - 0.13], [b[0], b[1] - 0.2, z - 0.13], [b[0], b[1] - 0.2, z + 0.13], [a[0], a[1] - 0.2, z + 0.13], [0, -1, 0]);
        quadN(g, [a[0], a[1], z - 0.13], [b[0], b[1], z - 0.13], [b[0], b[1] - 0.2, z - 0.13], [a[0], a[1] - 0.2, z - 0.13], [0, 0, -1]);
        quadN(g, [a[0], a[1], z + 0.13], [b[0], b[1], z + 0.13], [b[0], b[1] - 0.2, z + 0.13], [a[0], a[1] - 0.2, z + 0.13], [0, 0, 1]);
      }
      // a thin coral line along each rib's soffit
      g.mat('tile', PAL.coral);
      for (let i = 0; i < N; i++) { const a = pts[i], b = pts[i + 1]; quadN(g, [a[0], a[1] - 0.205, z - 0.03], [b[0], b[1] - 0.205, z - 0.03], [b[0], b[1] - 0.205, z + 0.03], [a[0], a[1] - 0.205, z + 0.03], [0, -1, 0]); }
    });
  }
  // the ridge: a brass pipe the length of the hall (the warm water's return, carried high)
  run(HALL.z0, HALL.z1, 17.1, (za, zb) => s.deco(() => { g.mat('cast', PAL.brass, { rough: -0.15 }); g.tube([[0, HALL.crown - 0.12, za], [0, HALL.crown - 0.12, zb]], 0.07, { segs: 10, caps: false }); }));
}

// ---------------------------------------------------------------------------------------------------------------
// the pool: tiled walls, the steps of the shallows, the deep floor with its lane lines and a star, the coping, the rail,
// the float rope; the collision for wading
// ---------------------------------------------------------------------------------------------------------------
function poolBasin(s) {
  const g = s.g, P = POOL, wl = P.water;
  const tileSide = '#7cc0bc', tileDeep = '#4f9fa4';
  run(P.z0, P.z1, 12.5, (za, zb) => s.structure(() => {
    g.mat('tile', tileSide);
    g.box(P.x0 - 0.06, P.bottom, za, P.x0, 0, zb, { faces: 'X' }); g.box(P.x1, P.bottom, za, P.x1 + 0.06, 0, zb, { faces: 'x' });
    // a coral line at the water, a cream line above it
    g.mat('tile', PAL.coral); g.box(P.x0, wl + 0.05, za, P.x0 + 0.008, wl + 0.12, zb, { faces: 'X' }); g.box(P.x1 - 0.008, wl + 0.05, za, P.x1, wl + 0.12, zb, { faces: 'x' });
    g.mat('tile', PAL.deep); g.box(P.x0, wl - 0.75, za, P.x0 + 0.006, wl - 0.6, zb, { faces: 'X' }); g.box(P.x1 - 0.006, wl - 0.75, za, P.x1, wl - 0.6, zb, { faces: 'x' });
  }));
  s.structure(() => {
    g.mat('tile', tileSide); g.box(P.x0, STEPS[0][2], P.z0 - 0.06, P.x1, 0, P.z0, { faces: 'Z' });
    g.box(P.x0, P.bottom, P.z1, P.x1, 0, P.z1 + 0.06, { faces: 'z' });
    // the steps: tops, and a coral nosing on each
    for (let i = 0; i < STEPS.length; i++) {
      const st = STEPS[i], below = i + 1 < STEPS.length ? STEPS[i + 1][2] : P.bottom;
      g.mat('tile', i % 2 ? '#8acbc4' : '#9ad3cb'); g.box(P.x0, st[2] - 0.02, st[0], P.x1, st[2], st[1], { faces: 'Y' });
      g.mat('tile', tileSide); g.box(P.x0, below, st[1] - 0.001, P.x1, st[2], st[1], { faces: 'Z' });
      g.mat('tile', PAL.coral); g.box(P.x0, st[2] - 0.05, st[1] - 0.06, P.x1, st[2] + 0.004, st[1] + 0.002, { faces: 'YZ' });
    }
  });
  // the deep floor, lane lines, a star of five points at the middle (the seeds of an apple cut crosswise)
  run(STEPS[3][1], P.z1, 11, (za, zb) => s.structure(() => {
    g.mat('tile', tileDeep); g.box(P.x0, P.bottom - 0.02, za, P.x1, P.bottom, zb, { faces: 'Y' });
    g.mat('tile', '#1f5a60'); for (const x of [-4, 0, 4]) g.box(x - 0.13, P.bottom, Math.max(za, -17.5), x + 0.13, P.bottom + 0.004, Math.min(zb, 23), { faces: 'Y' });
  }));
  s.structure(() => {
    g.mat('tile', '#1f5a60'); for (const x of [-4, 0, 4]) { g.box(x - 0.6, P.bottom, -17.6, x + 0.6, P.bottom + 0.004, -17.35, { faces: 'Y' }); g.box(x - 0.6, P.bottom, 22.9, x + 0.6, P.bottom + 0.004, 23.15, { faces: 'Y' }); }
    const cz = 3, cell = 0.16, y = P.bottom + 0.006;
    for (let i = -20; i <= 20; i++) for (let j = -20; j <= 20; j++) {
      const x = i * cell, z = cz + j * cell, d = Math.hypot(i, j) * cell; if (d > 3.2) continue;
      const a = Math.atan2(j, i) + PI / 2, ang = ((a % (2 * PI / 5)) + 2 * PI / 5) % (2 * PI / 5) - PI / 5;
      const starR = 1.15 / Math.cos(ang * 1.35) * 0.6 + 0.45;
      let c = null;
      if (d < 0.32) c = PAL.cream; else if (d < starR) c = PAL.coral; else if (d > 2.75 && d < 3.05) c = PAL.ochre; else if (d > 3.05) c = PAL.cream;
      if (!c) continue;
      g.mat('mosaic', c); g.box(x - cell / 2 + 0.008, y, z - cell / 2 + 0.008, x + cell / 2 - 0.008, y + 0.004, z + cell / 2 - 0.008, { faces: 'Y' });
    }
  });
  // underwater lamps in the side walls: brass rims, glowing lenses
  for (const sx of [-1, 1]) for (const z of [-14, -2, 10, 20]) {
    s.deco(() => {
      const x = sx * (P.x1 - 0.01);
      g.mat('cast', PAL.brass); g.box(Math.min(x, x - sx * 0.04), -1.75, z - 0.3, Math.max(x, x - sx * 0.04), -1.25, z + 0.3, { bevel: 0.02 });
      g.mat('diffuser', '#d8f4f0', { emissive: 4, lamp: true }); g.box(Math.min(x, x - sx * 0.05), -1.68, z - 0.23, Math.max(x, x - sx * 0.05), -1.32, z + 0.23, { faces: sx > 0 ? 'x' : 'X' });
    });
  }
  // the coping: a rounded cream lip all round
  run(P.z0 - 0.3, P.z1 + 0.3, 12.5, (za, zb) => s.structure(() => {
    g.mat('terrazzo', '#f0e4c8');
    g.box(P.x0 - 0.32, -0.05, za, P.x0 + 0.04, 0.02, zb, { bevel: 0.024 }); g.box(P.x1 - 0.04, -0.05, za, P.x1 + 0.32, 0.02, zb, { bevel: 0.024 });
  }));
  s.structure(() => { g.mat('terrazzo', '#f0e4c8'); g.box(P.x0, -0.05, P.z0 - 0.32, P.x1, 0.02, P.z0 + 0.04, { bevel: 0.024 }); g.box(P.x0, -0.05, P.z1 - 0.04, P.x1, 0.02, P.z1 + 0.32, { bevel: 0.024 }); });
  // collision: the steps (wading water), the deep floor, the walls below the deck
  for (const st of STEPS) s.solid(P.x0, st[2] - 0.5, st[0], P.x1, st[2], st[1], { surf: 'water' });
  s.solid(P.x0, P.bottom - 0.5, STEPS[3][1], P.x1, P.bottom, P.z1, { surf: 'water' });
  s.solid(P.x0 - 0.1, P.bottom - 0.5, P.z0 - 0.1, P.x0, -0.5, P.z1 + 0.1); s.solid(P.x1, P.bottom - 0.5, P.z0 - 0.1, P.x1 + 0.1, -0.5, P.z1 + 0.1);
  s.solid(P.x0, P.bottom - 0.5, P.z1, P.x1, -0.5, P.z1 + 0.1);
  // the float rope across the end of the shallows: nobody goes deeper from the steps; the deep is reached by the ladders
  s.solid(P.x0, P.bottom, P.floatZ - 0.06, P.x1, 1.4, P.floatZ + 0.06);
  s.deco(() => {
    g.mat('weave', '#e8dcc0'); const rope = []; for (let i = 0; i <= 16; i++) { const x = P.x0 + 0.1 + (P.x1 - P.x0 - 0.2) * i / 16; rope.push([x, wl + 0.03 + 0.05 * Math.sin(i * 0.9), P.floatZ]); } g.tube(rope, 0.018, { segs: 5 });
    g.mat('cast', PAL.brass); for (const sx of [-1, 1]) g.box(sx * P.x1 - 0.06, wl - 0.1, P.floatZ - 0.06, sx * P.x1 + 0.06, 0.04, P.floatZ + 0.06, { bevel: 0.01 });
  });
  for (let i = 0; i < 24; i++) { const x = P.x0 + 0.45 + i * (P.x1 - P.x0 - 0.9) / 23; prop(s, 'updecks.float', x, wl + 0.04 + 0.05 * Math.sin(i * 0.6 * 1.5), P.floatZ, 0, { c: i % 2 ? PAL.coral : PAL.ochre }); }
  // the rail round the deep water: brass on teal posts, at a height to lean on
  for (const sx of [-1, 1]) { const pts = []; for (let z = P.floatZ; z <= P.z1 + 0.31; z += 6) pts.push([sx * (P.x1 + 0.18), Math.min(z, P.z1 + 0.3)]); if (pts[pts.length - 1][1] < P.z1 + 0.29) pts.push([sx * (P.x1 + 0.18), P.z1 + 0.3]); pts.push([sx * 0.5, P.z1 + 0.3]); railing(s, pts, 0.02, { h: 1.0, tint: PAL.teal, rail: PAL.brass, railMat: 'cast', posts: 1.5 }); }
  // ladders into the deep, two a side: the rail curls over and down into the water
  for (const sx of [-1, 1]) for (const z of [-9, 13]) {
    s.detail(() => {
      const x = sx * P.x1;
      g.mat('cast', PAL.brass, { rough: -0.25 });
      for (const dz of [-0.3, 0.3]) g.tube([[x + sx * 0.18, 1.0, z + dz], [x + sx * 0.18, 1.1, z + dz], [x - sx * 0.05, 1.12, z + dz], [x - sx * 0.2, 0.7, z + dz], [x - sx * 0.2, -1.6, z + dz]], 0.024, { segs: 8 });
      g.mat('cast', '#8a6d3b'); for (let y = -1.45; y < 0; y += 0.3) g.box(x - sx * 0.24 - 0.02, y - 0.02, z - 0.3, x - sx * 0.16 + 0.02, y + 0.02, z + 0.3, { bevel: 0.006 });
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the balcony of deck 341's flats: a slab on the arcade's columns, its rail, the flats' doors and lit windows
// ---------------------------------------------------------------------------------------------------------------
function balcony(s) {
  const g = s.g, y = BAL.y;
  for (const sx of [-1, 1]) {
    const x0 = Math.min(sx * BAL.x, sx * HALL.x1), x1 = Math.max(sx * BAL.x, sx * HALL.x1);
    floor(s, x0, HALL.z0, x1, HALL.z1, y, 'planks', '#9a6e48');
    s.structure(() => {
      g.mat('paint', '#e9dcc0'); g.box(x0, y - 0.32, HALL.z0, x1, y - 0.02, HALL.z1, { faces: 'y' });
      // the fascia: teal tile, a coral line, a cream lip
      const fx = sx * BAL.x;
      g.mat('tile', PAL.teal); g.box(Math.min(fx, fx - sx * 0.1), y - 0.42, HALL.z0, Math.max(fx, fx - sx * 0.1), y + 0.02, HALL.z1, { bevel: 0.01 });
      g.mat('tile', PAL.coral); g.box(Math.min(fx - sx * 0.1, fx - sx * 0.11), y - 0.26, HALL.z0, Math.max(fx - sx * 0.1, fx - sx * 0.11), y - 0.16, HALL.z1, { faces: sx > 0 ? 'x' : 'X' });
      g.mat('wood', PAL.dark); for (const z of COLS) g.box(x0 + 0.02, y - 0.42, z - 0.12, x1 - 0.02, y - 0.3, z + 0.12, { bevel: 0.01 });
    });
    for (const z of COLS) column(s, sx * BAL.x, 0, z, y - 0.42, { r: 0.19, mat: 'tile', tint: PAL.sea });
    // the rail, with a gap at the back where the stair comes up
    const pts = []; for (let z = HALL.z0 + 0.1; z <= 32.3; z += 6.6) pts.push([sx * (BAL.x + 0.06), z]); pts.push([sx * (BAL.x + 0.06), 32.3]);
    railing(s, pts, y, { h: 1.05, tint: PAL.deep, rail: PAL.brass, railMat: 'cast', posts: 1.3 });
    // the flats: doors painted each their own colour, windows lit behind drawn curtains, a pot or a chair outside each
    const doors = [PAL.coral, PAL.plum, '#3f6f8a', PAL.ochre, '#6b7a3a', PAL.deep, '#8a2f3c', '#5f9f95', PAL.coral, PAL.plum];
    BAYS.forEach((zc, k) => {
      const wx = sx * (HALL.x1 + 0.06), dz0 = zc - 1.9, wz0 = zc + 0.1;
      s.structure(() => {
        g.mat('paint', doors[(k + (sx > 0 ? 3 : 0)) % doors.length], { rough: -0.1 });
        g.box(Math.min(wx, wx + sx * 0.05), y, dz0, Math.max(wx, wx + sx * 0.05), y + 2.15, dz0 + 1.0, { faces: sx > 0 ? 'x' : 'X' });
        g.mat('cast', PAL.brass); g.box(Math.min(wx, wx - sx * 0.05), y + 1.0, dz0 + 0.82, Math.max(wx, wx - sx * 0.05), y + 1.04, dz0 + 0.9, { bevel: 0.006 });
        g.mat('wood', PAL.dark); g.box(Math.min(sx * HALL.x1, sx * (HALL.x1 - 0.1)), y + 2.15, dz0 - 0.08, Math.max(sx * HALL.x1, sx * (HALL.x1 - 0.1)), y + 2.23, dz0 + 1.08, { bevel: 0.008 });
        // the window: a lit blind, two curtains, a sill with a pot on it
        const lit = (k * 7 + (sx > 0 ? 3 : 0)) % 5 !== 0;
        g.mat('diffuser', lit ? ['#f6d9a2', '#f2c98a', '#f8e2b8'][k % 3] : '#6a5a48', lit ? { emissive: 1.4, lamp: true } : {});
        g.box(Math.min(wx, wx + sx * 0.04), y + 0.9, wz0, Math.max(wx, wx + sx * 0.04), y + 2.15, wz0 + 1.5, { faces: sx > 0 ? 'x' : 'X' });
        g.mat('weave', [PAL.plum, PAL.coral, '#3f6f8a', PAL.ochre][k % 4]);
        g.box(Math.min(wx - sx * 0.02, wx - sx * 0.05), y + 0.95, wz0 + 0.02, Math.max(wx - sx * 0.02, wx - sx * 0.05), y + 2.12, wz0 + 0.32, { faces: sx > 0 ? 'x' : 'X' });
        g.box(Math.min(wx - sx * 0.02, wx - sx * 0.05), y + 0.95, wz0 + 1.18, Math.max(wx - sx * 0.02, wx - sx * 0.05), y + 2.12, wz0 + 1.48, { faces: sx > 0 ? 'x' : 'X' });
        g.mat('wood', PAL.dark); g.box(Math.min(sx * HALL.x1, sx * (HALL.x1 - 0.16)), y + 0.86, wz0 - 0.06, Math.max(sx * HALL.x1, sx * (HALL.x1 - 0.16)), y + 0.9, wz0 + 1.56, { bevel: 0.008 });
      });
      if (k % 2 === 0) prop(s, 'plant', sx * (HALL.x1 - 0.35), y, zc - 0.3, 0, { pot: [PAL.coral, PAL.ochre, PAL.teal][k % 3], kind: k % 4 ? 'broad' : 'fern', size: 0.85, seed: k }, { level: 1 });
      else prop(s, 'chair', sx * (HALL.x1 - 0.55), y, zc - 0.4, sx > 0 ? -PI / 2 + 0.5 : PI / 2 - 0.5, { wood: '#6b4a2f', back: 'slat' }, { level: 1, spot: { tags: ['balcony'] } });
      sign(s, { kind: 'label', text: String(341) + ' · ' + (sx > 0 ? 'S' : 'A') + String(k + 1), ink: '#f1e6c9' }, wx - sx * 0.02, y + 2.36, dz0 + 0.5, { face: sx > 0 ? 'x' : 'X', w: 0.42, h: 0.1 });
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the back end: the paddle's housing, the paddle desk, the stairs up to the balcony, the wave clock and the name
// ---------------------------------------------------------------------------------------------------------------
function backEnd(s) {
  const g = s.g;
  // the housing: a low tiled wall behind the paddle with a brass grille over the machinery pit
  s.furniture(() => {
    g.mat('tile', PAL.deep); g.box(-8.3, 0, POOL.z1 + 0.3, 8.3, 0.5, POOL.z1 + 1.3, { bevel: 0.02, aoBottom: 0.6 });
    g.mat('tile', PAL.cream); g.box(-8.35, 0.5, POOL.z1 + 0.26, 8.35, 0.56, POOL.z1 + 1.34, { bevel: 0.015 });
    g.mat('grille', PAL.brass); g.box(-6, 0.561, POOL.z1 + 0.4, 6, 0.57, POOL.z1 + 1.2, { faces: 'Y' });
    g.mat('cast', '#2a2622'); for (const x of [-7.4, 7.4]) g.box(x - 0.25, 0.56, POOL.z1 + 0.45, x + 0.25, 0.95, POOL.z1 + 1.15, { bevel: 0.02 });
    g.mat('cast', PAL.brass, { rough: -0.2 }); for (const x of [-7.4, 7.4]) g.cyl(x, 0.95, POOL.z1 + 0.8, 0.16, 0.05, { segs: 14 });
  });
  s.solid(-8.35, 0, POOL.z1 + 0.26, 8.35, 0.57, POOL.z1 + 1.34);
  // the paddle desk on the spinward side: a sloped desk, a log, a lever in a brass quadrant
  s.furniture(() => {
    g.mat('wood', PAL.dark); g.box(9.6, 0, 26.6, 11.4, 0.95, 27.3, { bevel: 0.015, aoBottom: 0.6 });
    g.mat('wood', '#6b4a2f'); g.box(9.55, 0.95, 26.5, 11.45, 1.0, 27.4, { bevel: 0.01 });
    g.mat('cast', PAL.brass); g.lathe(11.0, 26.85, [[0.2, 1.0], [0.2, 1.03], [0, 1.03]], { segs: 16, capBottom: false });
    g.mat('cast', '#2a2622'); g.tube([[11.0, 1.03, 26.85], [11.0, 1.35, 26.95]], 0.016, { segs: 6 }); g.mat('paint', PAL.coral); g.ball(11.0, 1.37, 26.96, 0.04, 0.04, 0.04, { segs: 8, rings: 5 });
    g.mat('paper', PAL.paper); g.box(9.8, 1.0, 26.7, 10.5, 1.02, 27.2, { bevel: 0.004 });
  });
  s.solid(9.55, 0, 26.5, 11.45, 1.0, 27.4);
  prop(s, 'stool', 10.4, 0, 27.9, PI, { wood: '#7a5a3a', h: 0.62 });
  // the stairs to the balcony, one each side against the back wall
  for (const sx of [-1, 1]) {
    stairs(s, sx * 5.9, 0, 33.12, sx > 0 ? 'X' : 'x', BAL.y, BAL.x - 5.9, 1.4, { mat: 'tile', tint: '#d9c9a6', nosing: PAL.coral });
    s.structure(() => {
      // a stringer under the open side and a teal panel under the flight
      g.mat('tile', PAL.teal);
      const a = [sx * 5.9, 0, 32.4], b = [sx * BAL.x, BAL.y, 32.4];
      quadN(g, [a[0], 0, 32.4], [b[0], 0, 32.4], [b[0], b[1], 32.4], [a[0], 0.17, 32.4], [0, 0, -1]);
    });
    s.detail(() => {
      g.mat('cast', PAL.brass, { rough: -0.2 });
      g.tube([[sx * 5.9, 1.0, 32.46], [sx * BAL.x, BAL.y + 1.0, 32.46]], 0.026, { segs: 8 });
      for (let k = 0; k <= 5; k++) { const u = k / 5, x = sx * (5.9 + (BAL.x - 5.9) * u), yy = BAL.y * u; g.tube([[x, yy, 32.46], [x, yy + 1.0, 32.46]], 0.016, { segs: 6 }); }
      g.tube([[sx * 5.9, 0.95, 33.86], [sx * BAL.x, BAL.y + 0.95, 33.86]], 0.022, { segs: 8 });
    });
    for (let k = 0; k < 4; k++) { const u0 = k / 4, u1 = (k + 1) / 4; s.solid(Math.min(sx * (5.9 + (BAL.x - 5.9) * u0), sx * (5.9 + (BAL.x - 5.9) * u1)), BAL.y * u0, 32.38, Math.max(sx * (5.9 + (BAL.x - 5.9) * u0), sx * (5.9 + (BAL.x - 5.9) * u1)), BAL.y * u1 + 1.0, 32.44); }
  }
  // the wave clock: a cream dial in a coral ring, thirteen marks, the hand (lm_up_decks_water.js) going round once a crossing
  s.structure(() => {
    const zf = DIAL.z, R = DIAL.r;
    g.push(); g.move(DIAL.x, DIAL.y, zf); g.rotX(PI / 2);
    g.mat('tile', PAL.coral); g.cyl(0, 0.0, 0, R + 0.22, 0.06, { segs: 40 });
    g.mat('paint', '#f3ead4', { emissive: 0.7, lamp: true }); g.cyl(0, -0.012, 0, R, 0.02, { segs: 40 });
    g.pop();
    g.mat('paint', PAL.ink);
    for (let k = 0; k < CROSS_S; k++) {
      const a = k / CROSS_S * PI * 2, big = k === 0, r0 = R * (big ? 0.72 : 0.82), r1 = R * 0.93, w = big ? 0.05 : 0.025;
      const ax = -Math.sin(a), ay = Math.cos(a);
      const p0 = [DIAL.x + ax * r0, DIAL.y + ay * r0], p1 = [DIAL.x + ax * r1, DIAL.y + ay * r1];
      g.box(Math.min(p0[0], p1[0]) - w, Math.min(p0[1], p1[1]) - w, zf - 0.04, Math.max(p0[0], p1[0]) + w, Math.max(p0[1], p1[1]) + w, zf - 0.035, { faces: 'z' });
    }
  });
  sign(s, { kind: 'label', text: 'paddle · steps', ink: '#2a2218' }, DIAL.x, DIAL.y - 0.62, DIAL.z - 0.045, { face: 'z', w: 0.9, h: 0.14, board: false });
  sign(s, { kind: 'letters', text: 'The Simmer', palette: ['#f1e6c9'] }, 0, 6.95, HALL.z1 - 0.1, { face: 'z', w: 6.4, h: 0.9, glow: 1.4 });
  sign(s, { kind: 'letters', text: 'The Simmer', palette: ['#f1e6c9'] }, 0, 6.95, HALL.z0 + 0.1, { face: 'Z', w: 6.4, h: 0.9, glow: 1.2 });
  // a long warm bench under the clock, robes on a rail behind it
  prop(s, 'updecks.bench', -2.2, 0, 32.9, PI, { w: 2.6, wood: '#8a6240', cushion: PAL.ochre });
  prop(s, 'updecks.bench', 2.2, 0, 32.9, PI, { w: 2.6, wood: '#8a6240', cushion: PAL.plum });
  prop(s, 'baths.fernpot', -4.8, 0, 33.3, 0.3, { pot: PAL.coral, size: 1.25 }); prop(s, 'baths.fernpot', 4.8, 0, 33.3, 1.1, { pot: PAL.teal, size: 1.25 });
}

// ---------------------------------------------------------------------------------------------------------------
// furniture along the promenades and under the arcade
// ---------------------------------------------------------------------------------------------------------------
function hallFurnish(s) {
  const g = s.g;
  const cloths = [PAL.coral, PAL.plum, '#3f6f8a', PAL.ochre, '#6b7a3a', '#8a2f3c', PAL.teal];
  for (const sx of [-1, 1]) {
    const yawIn = sx > 0 ? -PI / 2 : PI / 2;                  // facing the water
    // benches facing the water, a stand of sticks at the end of each
    for (const z of [-15.5, -3.5, 8.5, 20.5]) {
      prop(s, 'updecks.bench', sx * 10.9, 0, z, yawIn, { w: 2.0, wood: ['#7a5233', '#8a6240', '#6b4a2f'][Math.abs(Math.round(z)) % 3], cushion: z > 0 ? cloths[Math.abs(Math.round(z)) % 7] : null }, { spot: { tags: ['simmer', 'watch'] } });
      prop(s, 'updecks.sticks', sx * 11.0, 0, z + 1.4, z, { n: 3 + (Math.abs(Math.round(z)) % 3), seed: z });
    }
    // armchairs in twos and threes round low tables, between the benches
    for (const z of [-9.5, 2.5, 14.5]) {
      const k = Math.abs(Math.round(z + sx * 3));
      prop(s, 'updecks.armchair', sx * 11.7, 0, z - 0.85, yawIn + sx * 0.6, { cloth: cloths[k % 7], mend: cloths[(k + 3) % 7] }, { spot: { tags: ['simmer'] } });
      prop(s, 'updecks.armchair', sx * 11.7, 0, z + 0.85, yawIn - sx * 0.6, { cloth: cloths[(k + 2) % 7], mend: z > 5 ? PAL.ochre : null }, { spot: { tags: ['simmer'] } });
      prop(s, 'updecks.armchair', sx * 9.9, 0, z, yawIn + PI, { cloth: cloths[(k + 4) % 7] }, { spot: { tags: ['simmer'] } });
      prop(s, 'table', sx * 10.85, 0, z, 0, { w: 0.6, round: true, h: 0.5, wood: '#5a3d28', top: '#8a6240' });
      prop(s, 'cup', sx * 10.75, 0.5, z - 0.12, 0, { glaze: PAL.cream, lid: PAL.sea });
      prop(s, 'cup', sx * 10.95, 0.5, z + 0.1, 0, { glaze: PAL.ochre, lid: PAL.coral });
      if (k % 2) prop(s, 'baths.teapot', sx * 10.85, 0.5, z + 0.05, 0.4, { glaze: PAL.teal });
    }
    // loungers at the front end of each promenade
    for (let i = 0; i < 3; i++) prop(s, 'baths.lounger', sx * (10.2 + i * 1.3), 0, -27.5, 0, { wood: ['#9a7448', '#b08d5e', '#8a6240'][i], towel: [PAL.cream, PAL.sea, PAL.coral][i] }, { spot: { tags: ['simmer', 'rest'] } });
    // under the arcade: robes on warm rails, fern pots by the columns, towel shelves, a broth urn
    prop(s, 'baths.robes', sx * (HALL.x1 - 0.1), 0, -22, yawIn, { w: 3.2, n: 8, seed: sx > 0 ? 2 : 5 });
    prop(s, 'baths.robes', sx * (HALL.x1 - 0.1), 0, 22, yawIn, { w: 3.2, n: 7, seed: sx > 0 ? 7 : 4 });
    prop(s, 'baths.towels', sx * (HALL.x1 - 0.3), 0, sx > 0 ? -5.5 : 5.2, yawIn, { w: 1.4, seed: sx > 0 ? 3 : 6 });
    for (const z of COLS) if (Math.abs(z) > 1) prop(s, 'baths.fernpot', sx * (BAL.x + 0.6), 0, z + 0.9, z * 0.7, { pot: [PAL.coral, PAL.teal, PAL.ochre][Math.abs(Math.round(z / 6)) % 3], size: 0.9 });
    // slippers left at the edge, lidded cups on the coping
    const strap = [PAL.teal, PAL.coral, PAL.plum, PAL.ochre];
    for (let i = 0; i < 6; i++) prop(s, 'baths.slippers', sx * (8.75 + (i % 2) * 0.15), 0, -16 + i * 7.1, yawIn + (i % 3 - 1) * 0.4, { c: '#c9a46a', strap: strap[i % 4] });
  }
  // the front promenade: an urn of broth each side of the steps, benches facing the shallows, the rules
  prop(s, 'updecks.urn', -10.6, 0, -31.4, PI / 2, { tile: PAL.coral });
  prop(s, 'updecks.urn', 10.6, 0, -31.4, -PI / 2, { tile: PAL.teal });
  for (const x of [-5.4, 5.4]) prop(s, 'updecks.bench', x, 0, -28.2, 0, { w: 2.4, wood: '#8a6240', cushion: x < 0 ? PAL.coral : PAL.teal }, { spot: { tags: ['simmer', 'watch'] } });
  // handrails down into the shallows: brass, curled over the coping
  for (const x of [-6.6, -2.2, 2.2, 6.6]) {
    s.detail(() => {
      g.mat('cast', PAL.brass, { rough: -0.25 });
      g.tube([[x, 0, -26.1], [x, 0.92, -26.1], [x, 0.98, -25.6], [x, 0.66, -24.9], [x, STEPS[1][2] + 0.86, -23.6], [x, STEPS[2][2] + 0.86, -22.0], [x, STEPS[2][2], -21.6]], 0.024, { segs: 8 });
      g.cyl(x, 0, -26.1, 0.05, 0.025, { segs: 10 });
    });
    s.post(x, -26.1, 0.04, 0, 0.95);
  }
  // fern pots and a coat stand by the arch
  prop(s, 'baths.fernpot', -13.6, 0, -33.2, 0.2, { pot: PAL.ochre, size: 1.3 });
  prop(s, 'baths.fernpot', 13.6, 0, -33.2, 0.9, { pot: PAL.coral, size: 1.3 });
  prop(s, 'updecks.sticks', 4.6, 0, -33.4, 0, { n: 6, seed: 2 });
  prop(s, 'updecks.sticks', -4.6, 0, -33.4, 0, { n: 4, seed: 5 });
  // the robe rooms' doors on the spinward wall (not open to look into)
  for (const z of [-12, 12]) {
    s.structure(() => {
      g.mat('paint', PAL.deep, { rough: -0.1 }); g.box(HALL.x1 + 0.02, 0, z - 0.6, HALL.x1 + 0.08, 2.2, z + 0.6, { faces: 'x' });
      g.mat('paint', shadeHex(PAL.deep, 1.3)); for (const dz of [-0.3, 0.3]) g.box(HALL.x1 - 0.0, 0.2, z + dz - 0.22, HALL.x1 + 0.02, 2.0, z + dz + 0.22, { faces: 'x' });
      g.mat('cast', PAL.brass); g.box(HALL.x1 - 0.04, 1.0, z - 0.06, HALL.x1 + 0.02, 1.08, z + 0.06, { bevel: 0.01 });
    });
    sign(s, { kind: 'label', text: z < 0 ? 'Robes and lockers' : 'Robes, showers', ink: '#f1e6c9' }, HALL.x1 - 0.1, 2.42, z, { face: 'x', w: 1.0, h: 0.16 });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// light: big pendants down the middle over the water, globes under the balcony, sconces on the balcony, lamps in the
// pool walls, the clock's lamps at the far end, and the bounce of a tiled room
// ---------------------------------------------------------------------------------------------------------------
function hallLights(s) {
  for (const z of [-20, -11, -2, 7, 16]) lamp(s, 'globe', 0, 5.75, z, { r: 0.42, drop: HALL.crown - 0.15 - 5.75, clip: CLIP, K: 2750, power: 3.4, range: 17 });
  for (const sx of [-1, 1]) {
    for (const z of [-27, -15, -3, 9, 21]) lamp(s, 'globe', sx * 14.15, 3.15, z, { r: 0.15, drop: 0.42, clip: CLIP, K: 2700, power: 0.9, range: 7 });
    for (const z of [-24, -12, 0, 12, 24]) lamp(s, 'sconce', sx * (HALL.x1 - 0.1), BAL.y + 1.9, z, { face: sx > 0 ? 'x' : 'X', clip: CLIP, K: 2600, power: 0.7 });
    for (const z of [-14, -2, 10, 20]) s.light({ at: [sx * 7.5, -1.5, z], color: '#bfeaea', power: 3.2, range: 9, clip: [POOL.x0, POOL.bottom - 0.1, POOL.z0, POOL.x1, POOL.water + 0.3, POOL.z1], lamp: true, radius: 0.25 });
  }
  // the far end: two lanterns either side of the wave clock, and a wash on the back wall
  for (const sx of [-1, 1]) lamp(s, 'lantern', sx * 2.6, 5.4, 33.2, { tint: PAL.ochre, drop: 1.6, r: 0.32, hh: 0.5, clip: CLIP, K: 2500, power: 1.8, range: 10 });
  s.light({ at: [0, 3.0, 31.5], type: 'spot', dir: [0, 0.55, 1], cone: [55, 30], color: '#ffd9a0', power: 9, range: 9, clip: CLIP, lamp: true });
  // the front end: sconces either side of the arch
  for (const sx of [-1, 1]) lamp(s, 'sconce', sx * 4.6, 2.6, HALL.z0 + 0.1, { face: 'Z', clip: CLIP, K: 2700, power: 0.9 });
  roomGlow(s, HALL.x0, -0.2, HALL.z0, HALL.x1, HALL.crown, HALL.z1, { sky: '#ffdcb0', ground: '#6fb0aa', power: 0.3 });
  roomGlow(s, POOL.x0, POOL.bottom, POOL.z0, POOL.x1, POOL.water, POOL.z1, { sky: '#9fe0dc', ground: '#4f9fa4', power: 0.35 });
}

// ---------------------------------------------------------------------------------------------------------------
// people: in the water, on the benches, at the rails; the attendants; a child visiting
// ---------------------------------------------------------------------------------------------------------------
// seats in the shallows (the player is seated at the same places): on the third step, facing up the pool
export const SEATS = [];
for (let i = 0; i < 10; i++) SEATS.push({ x: -7.2 + i * 1.6, y: STEPS[2][2] + 0.06, z: -22.55, yaw: 0 });

function hallLife(s) {
  for (const st of SEATS) s.spot('bath', st.x, st.y, st.z, st.yaw, { tags: ['simmer', 'shallows'] });
  // floating in the deep, in twos and threes, talking
  const floats = [[-4.5, -12, 0.5], [-3.2, -11.2, -2.2], [-5.6, -10.6, 2.4], [3.6, -4, -0.6], [4.8, -2.9, -2.6], [-2, 6, 0.2], [-0.6, 6.8, -2.9], [-1.2, 4.6, 2.0], [5, 12, -0.3], [3.6, 12.6, 1.9], [-5.6, 17, 0.8], [-4.4, 18.2, -2.4]];
  for (const p of floats) s.spot('bath', p[0], POOL.water - 0.42, p[1], p[2], { tags: ['simmer', 'float'] });
  // at the rails, leaning on them to watch the swell
  for (const sx of [-1, 1]) for (const z of [-17.5, -6, 5.5, 17.5]) s.spot('stand', sx * 8.75, 0, z + sx * 0.6, sx > 0 ? -PI / 2 : PI / 2, { tags: ['rail', 'simmer'] });
  for (const x of [-8.1, 8.1]) s.spot('stand', x, 0, 25.3, PI, { tags: ['rail', 'simmer'] });
  // talking in groups on the promenades
  group(s, -11.0, -21.5, 3, 0.65); group(s, 11.2, -21.0, 2, 0.55); group(s, 11.0, 26.8, 3, 0.7); group(s, -10.8, 27.4, 2, 0.6); group(s, 0, -31.0, 3, 0.7);
  // the attendants
  s.spot('work', 10.5, 0, 27.95, PI, { tags: ['notes', 'simmer'] });
  s.spot('work', -11.5, 0, -12, 0, { tags: ['sweep', 'simmer'] });
  s.spot('work', 12.0, 0, 6.5, PI, { tags: ['sweep', 'simmer'] });
  s.spot('work', -10.6, 0, -30.3, PI, { tags: ['serve', 'simmer'] });
  s.spot('work', -10.4, BAL.y, 0, PI / 2, { tags: ['sweep', 'simmer'] });
  // a child visiting a great-grandparent, hopping on the coping's tiles at the front
  s.spot('play', 3.6, 0, -26.4, PI, { tags: ['hop'] });
  s.spot('play', -1.8, 0, -27.2, 0.4, { tags: ['hop'] });
  // walkways: from the lobby through the arch, round the pool, under the arcade, to every door, up the stairs
  s.path([[0, -36.5], [0, -33.0], [0, -29.6]]);
  s.path([[-11.6, -29.6], [-6, -29.6], [0, -29.6], [6, -29.6], [11.6, -29.6]]);
  for (const sx of [-1, 1]) {
    s.path([[sx * 11.6, -29.6], [sx * 9.7, -24], [sx * 9.7, -12], [sx * 9.7, 0], [sx * 9.7, 12], [sx * 9.7, 24], [sx * 9.0, 28.5]]);
    s.path([[sx * 11.6, -29.6], [sx * 14.2, -26], [sx * 14.2, -13], [sx * 14.2, 0], [sx * 14.2, 13], [sx * 14.2, 26], [sx * 12.5, 29.2]]);
    for (const z of [-24, -12, 0, 12, 24]) s.path([[sx * 9.7, z], [sx * 14.2, z + (z > 0 ? 1 : -1)]], { width: 1.2 });
    s.path([[sx * 9.0, 28.5], [sx * 5.0, 29.3], [0, 29.3]]); s.path([[sx * 12.5, 29.2], [sx * 9.0, 28.5]]);
    // up the stair and along the balcony
    s.path([[sx * 5.3, 32.0], [sx * 5.3, 33.1], [sx * 5.9, 33.1]], { width: 1.1 }); s.path([[sx * 5.0, 29.3], [sx * 5.3, 32.0]], { width: 1.1 });
    s.path([[sx * 5.9, 0, 33.1], [sx * BAL.x, BAL.y, 33.1]], { width: 1.1 });
    s.path([[sx * (BAL.x + 0.6), BAL.y, 33.1], [sx * (BAL.x + 0.6), BAL.y, 20], [sx * (BAL.x + 0.6), BAL.y, 6], [sx * (BAL.x + 0.6), BAL.y, -8], [sx * (BAL.x + 0.6), BAL.y, -22], [sx * (BAL.x + 0.6), BAL.y, -33]], { width: 1.1 });
    s.path([[sx * BAL.x, BAL.y, 33.1], [sx * (BAL.x + 0.6), BAL.y, 33.1]], { width: 1.1 });
    for (const z of [-17.5, -6, 5.5, 17.5]) s.path([[sx * 9.7, z + sx * 0.6 + (z > 0 ? -0.6 : 0.6)], [sx * 8.75, z + sx * 0.6]], { width: 1.0 });
  }
  s.path([[0, -29.6], [0, -26.3]], { width: 1.4 });
  s.path([[-11.6, -29.6], [-10.6, -30.3]], { width: 1.0 });
  // the doors on the long walls: the tea room, the Up Table, the lane, the robe rooms
  s.path([[-14.2, -7.9], [-15.8, -7.9]], { width: 1.1 }); s.path([[-14.2, -13], [-14.2, -7.9]]);
  s.path([[-14.2, 10], [-15.9, 10]], { width: 1.6 }); s.path([[-14.2, 13], [-14.2, 10], [-14.2, 0]]);
  s.path([[14.2, 0], [15.9, 0]], { width: 2.0 });
  s.path([[0, 29.3], [0, 31.6]], { width: 1.2 });
}

function group(s, x, z, n, r, tags) {
  for (let i = 0; i < n; i++) { const t = i / n * PI * 2 + 0.4; const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags: tags || ['simmer'] }); }
}

// ---------------------------------------------------------------------------------------------------------------
// things to do at the water
// ---------------------------------------------------------------------------------------------------------------
const KEEPER = { name: 'Ilse at the paddle', colour: '#8fd0c0' };
const WATER_LINES = [
  ['Thirteen seconds from the paddle to my knees. I count them. My husband counted them for thirty years and never once got thirteen.', 'Twelve and a half, he said. He was always in a hurry.'],
  'At the rim I could not get out of a bath without a hand. Up here I get out of this one by myself, and I am a hundred and four.',
  ['Wait for the big one. Every half a minute or so the paddle sends a bigger one.', 'You see it coming the whole length. Plenty of time to decide not to mind.'],
  'My grandson says the swell is a third taller than it would be downstairs. I said, so am I, in my own way.',
  ['Where did you sleep last night.', 'A Margin flat. Good. Have you eaten. Then you can stay in a while.'],
  'The water is from the loop, the same sixty-five degrees that cooks the ramen in Ring Two. They cool it to thirty-six for us.',
  ['I gave my place to my great-granddaughter the week I came up. She cried on the stairs.', 'She has painted the kitchen orange since. I went down to see it. It is very orange.'],
  'Float on your back and watch the ceiling. The light off the water goes along the vault the same way the waves go.',
  ['They ring the paddle off at lamp-night.', 'Not because of us. Because of the people on the balcony, who are trying to sleep, and say so, loudly.'],
  'Ninety-five, they offer you a flat up here. I said no at ninety-five. I said yes at ninety-six, after I fell on the stairs at the rim deck and bounced.',
  ['Thursday is ramen at the long table on 341. You come.', 'You are a guest, it is free. Bring an appetite, we bring the noise.'],
  'A splash takes its time coming down at half a g. My great-grandchildren could do it for an hour. They have done it for an hour.',
];

function hallUse(game, s, f, water) {
  const seated = (gm) => gm.player && gm.player.seat && gm.player.seat.simmer;
  // into the shallows and out again: the seat nearest to where you stand
  s.interact({ x: -3.6, y: 0.5, z: -25.6, radius: 2.4, prompt: (gm) => seated(gm) ? 'Get out of the water' : 'Wade into the shallows and sit', onUse(gm) {
    const p = gm.player; if (!p) return;
    if (seated(gm)) { p.stand(); return; }
    let best = SEATS[0], bd = 1e9; for (const st of SEATS) { const d = Math.hypot(st.x - p.pos.x, st.z - p.pos.z); if (d < bd) { bd = d; best = st; } }
    p.sit({ x: best.x, y: best.y, z: best.z, yaw: best.yaw, eye: 0.62, simmer: true });
    p.yaw = PI - best.yaw; p.pitch = 0.02;
    sfx(gm, 'splash', f, best.x, POOL.water, best.z, { vol: 0.4 });
    if (!gm.flags.simmerIn) { gm.flags.simmerIn = true; if (gm.ui) gm.ui.subtitle(null, 'Warm to the chin. The swell lifts you a hand\'s width, holds you there, and puts you down again, slowly.', 6); custom(gm, 'The Simmer'); }
  } });
  // a splash that hangs
  s.interact({ x: 3.6, y: 0.4, z: -25.6, radius: 2.0, prompt: 'Slap the water and watch the splash', onUse(gm) {
    const p = gm.player; if (!p) return;
    let x = 3.6, z = -23.6;
    if (p.frame === f) { const fx = Math.sin(p.yaw), fz = -Math.cos(p.yaw); x = Math.max(POOL.x0 + 0.6, Math.min(POOL.x1 - 0.6, p.pos.x + fx * 1.4)); z = Math.max(POOL.z0 + 0.6, Math.min(POOL.floatZ - 0.4, p.pos.z + fz * 1.4)); }
    water.splash(x, z, 1.1);
    sfx(gm, 'splash', f, x, POOL.water, z, { vol: 0.8 });
    if (!gm.flags.simmerSplash) { gm.flags.simmerSplash = true; toast(gm, 'It goes up, and stays up, and comes down in its own time. At 0.55 g a splash is in the air nearly twice as long as it would be at the rim.'); }
    else toast(gm, pick(['Up, and a long wait, and down. An old man on the steps nods, as if you have done it properly.', 'The drops hang at the top long enough to count. Somebody does count them, out loud, and gets to eleven.', 'A slow splash. A woman floating by says it is the best thing about being old, after the naps.', 'Down it comes, in no hurry. A child on the coping claps.'], Math.floor((water.time() * 7) % 97)));
  } });
  // while in the water: what the old say
  let tNext = 6; const queue = [];
  s.every((dt, gm) => {
    if (!gm) return;
    for (let i = queue.length - 1; i >= 0; i--) { queue[i].t -= dt; if (queue[i].t <= 0) { if (gm.ui && seated(gm)) gm.ui.subtitle(queue[i].who, queue[i].text, 6); queue.splice(i, 1); } }
    if (!seated(gm)) { tNext = Math.max(tNext, 5); return; }
    tNext -= dt; if (tNext > 0) return;
    tNext = 11 + Math.random() * 7; if (!gm.ui) return;
    const l = WATER_LINES[Math.floor(Math.random() * WATER_LINES.length)];
    const who = pick(['A woman floating on her back', 'An old man on the step', 'Someone in the swell', 'A very old woman in a red cap', 'A man with his eyes shut'], Math.floor(Math.random() * 1000));
    if (Array.isArray(l)) { gm.ui.subtitle(who, l[0], 6); queue.push({ t: 3.4, who, text: l[1] }); } else gm.ui.subtitle(who, l, 6);
  });
  // the plate at the paddle desk
  s.interact({ x: 10.5, y: 1.2, z: 26.1, radius: 1.6, prompt: 'Read the plate on the paddle desk', onUse(gm) {
    card(gm, 'A brass plate on the paddle desk', 'The Simmer', 'Fifty metres of warm water at 0.55 g, along the axis, so a swimmer weighs the same both ways. A wave from the paddle takes thirteen seconds to reach the steps; at a full g it would be there in under ten. The same push stands it about a third taller up here. Water off the 65 degree loop, cooled to thirty-six.');
    custom(gm, 'The Simmer');
  } });
  // the paddle keeper
  s.interact({ x: 10.5, y: 1.2, z: 28.4, radius: 1.4, kind: 'talk', prompt: 'Ask about the paddle', async onUse(gm) {
    if (!gm.ui) return;
    if (!gm.flags.simmerKeeper) { gm.flags.simmerKeeper = true; await say(gm, KEEPER, ['A guest. Have you eaten. There is broth in the urns by the steps, free, lids on.', 'The paddle. It goes all day, one stroke every four seconds, a bigger set every half minute or so. Off at lamp-night, on again at seven.']); }
    gm.busy++; let c = null;
    try { c = await gm.ui.choose(KEEPER, 'She keeps one hand on the lever while she talks.', [{ label: 'Why so slow', value: 'slow' }, { label: 'Who comes here', value: 'who' }, { label: 'Thank you', value: null }]); } finally { gm.busy--; }
    if (c === 'slow') await say(gm, KEEPER, ['Weight. Everything that falls up here falls at a little over half the speed, and a wave is only water falling over and over.', 'At the rim this swell would run the pool in nine and a half seconds and stand lower. Here it takes thirteen. People say the water up here is patient. It is just light.']);
    else if (c === 'who') await say(gm, KEEPER, ['The flats on 340 to 344 mostly, and anyone in Ring Three over ninety who can get a cab. Grandchildren on the Quiet. Wanderers, now and then.', 'The balcony flats are the ones everyone asks for. You hear the water all night and the paddle all day. Nobody up there has ever complained about the water.']);
  } });
  // the wave clock
  s.interact({ x: 0, y: 1.4, z: 31.6, radius: 2.0, prompt: 'Watch the wave clock', onUse(gm) {
    toast(gm, 'One turn of the hand is thirteen seconds: from the paddle, at the top, to the steps. Thirteen marks, one a second. Children try to swim with a crest and lose it at about the fourth mark.');
  } });
  // the rules by the arch
  const RULES = { kind: 'notice', title: 'The Simmer', lines: ['Wash at the robe rooms first', 'Deep water by the ladders only', 'Hold the rail at the steps', 'The paddle stops at lamp-night', 'Broth by the steps: free, lids on', 'Guests welcome, no charge'], palette: [PAL.deep, '#f2e8d2', PAL.coral] };
  sign(s, RULES, -7.6, 1.6, HALL.z0 + 0.12, { face: 'Z', w: 0.8, h: 1.05 });
  s.interact({ x: -7.6, y: 1.4, z: HALL.z0 + 1.0, radius: 1.4, prompt: 'Read the rules of the Simmer', onUse(gm) { say(gm, { name: 'The Simmer', colour: '#FFD9A0' }, ['Wash at the robe rooms first. Deep water by the ladders only. Hold the rail at the steps.', 'The paddle stops at lamp-night. Broth by the steps, free, lids on. Guests welcome, no charge.', 'Pencilled under it: the water is thirty-six degrees, and so, on a good day, am I.']); } });
  // the broth urns
  for (const x of [-10.6, 10.6]) s.interact({ x: x + (x < 0 ? 0.7 : -0.7), y: 1.0, z: -31.4, radius: 1.3, prompt: 'Take a lidded cup of broth', onUse(gm) { sfx(gm, 'pour', f, x, 1.1, -31.4); sfx(gm, 'lid-down', f, x, 1.0, -31.2); toast(gm, 'Mill broth, hot, under a lid. Free, as broth is everywhere. A note on the urn: cups back in the rack, please, they are older than you.', 'gain'); custom(gm, 'Lids'); } });
  // the weight of the place, from the balcony rail
  s.interact({ x: 13.9, y: BAL.y + 1.3, z: 0, radius: 2.4, prompt: 'Lean on the rail and watch the swell', onUse(gm) {
    toast(gm, 'From up here the swell is a row of slow bright lines, four seconds apart, coming the whole length of the hall. The light they throw goes up the vault behind them.');
  } });
  s.interact({ x: -13.9, y: BAL.y + 1.3, z: 0, radius: 2.4, prompt: 'Lean on the rail and watch the swell', onUse(gm) {
    toast(gm, 'Below, two old men float on their backs side by side, arguing about something with great pleasure, and the swell lifts them both at once.');
  } });
  void GEE; void bottomAt;
}
