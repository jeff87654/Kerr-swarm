// The Loop Hall: Chervil's heat works in the Keel, deck 3, under Ring Seven, at a full g.
//
// One hall 280 m long, running spinward, so the floor, the catwalk and the two ranks of exchangers curve up ahead of you
// until the far end is over your head. Thirty-two plate exchangers the size of houses hand the vats' waste heat (vat
// water in at 69 degrees) to the city's 65 degree loop (back from the city at 41), which goes up from here to every bath
// and kitchen tap in the drum. The loop's trunk mains run the length of both walls, a metre and a half across, red for
// flow and teal for return, banded in brass; the ochre vat mains run inboard of the ranks. What the city cannot use goes
// on to the back axle.
//
// Round it (lm_keel_heat_ends.js, lm_keel_heat_side.js): the cab lobby, the Watch Room and the crew room at the anti end;
// the Taps at the spinward end, where the loop leaves for the nine rings; off the long walls the Gin Kitchen, the Salt
// Pans, the Inlet (water in from the moat) and the Cookers (the oxidisers).
//
// Frame 'keel-heat': x spinward, z toward the back cap, y up. The hall is x[-140, 140] z[-15, 15], 14.5 m to the roof.
import { floor, ceiling, wall } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, REGION, HALL, CAT, RANK_Z, EX_N, EX_P, EX_X0, EX, EX_PAINT, MAIN, VAT, GIN, SALT, INLET, COOK, C, say, toast, tick, runX, lineX } from './lm_keel_heat_props.js';
import { buildEnds } from './lm_keel_heat_ends.js';
import { buildSide } from './lm_keel_heat_side.js';

const GAP = (k) => -112 + EX_P * k;                  // the crossings between exchangers (clear on both ranks), k = -1 .. 15
const ENV = { exposure: 1.0, autoKey: 0.16, bloom: 0.06, warmth: 0.12, contrast: 1.08, saturation: 1.12 };

export const place = {
  id: 'lm-keel-heat', name: 'The Loop Hall', order: 10,
  region: REGION,
  stops: [
    { id: 'keel-heat', name: 'The Loop Hall', sub: 'the heat works · deck 3 · Ring Seven', group: 'The Keel', spawn: 'keel-heat', deck: 3, zd: 2710 },
    { id: 'keel-heat-taps', name: 'The Taps', sub: 'the Loop Hall, spinward end · deck 3', group: 'The Keel', spawn: 'keel-heat-taps', deck: 3, zd: 2710 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('keel-heat', deckRadius(3), 2.4, 2710);
    const s = W.scope('keel-heat', f);
    const r = new Rng(3065);

    shell(s);
    await tick(game);
    mains(s);
    await tick(game);
    for (let k = 0; k < EX_N; k++) {
      exchangerPair(s, k, r);
      if (k % 4 === 3) await tick(game);
    }
    catwalk(s);
    await tick(game);
    hallLight(s, r);
    hallLife(game, s, f, r);
    await tick(game);
    await buildEnds(game, s, f, r);
    await buildSide(game, s, f, r);

    s.zoneBox({ id: 'keel-heat-hall', place: 'keel-heat', box: [HALL.x0, -0.5, -HALL.z, HALL.x1, HALL.h, HALL.z], name: 'The Loop Hall', sub: 'The Keel · deck 3 · Ring Seven', ambience: 'station', reverb: 'station', headroom: 13, env: ENV });
    s.zoneBox({ id: 'keel-heat-catwalk', place: 'keel-heat', box: [CAT.x0 - 7, CAT.y - 0.2, -CAT.w - 0.3, CAT.x1 + 7, CAT.y + 3, CAT.w + 0.3], name: 'The Loop Hall', sub: 'The catwalk · between the exchangers', ambience: 'station', reverb: 'station', headroom: 9, env: ENV });
    for (let x = -120; x <= 120; x += 48) { s.loop('air', x, 12, 0, { vol: 0.3, radius: 40 }); s.loop('tide', x + 24, 10.6, 12.7, { vol: 0.22, radius: 22 }); s.loop('steam', x + 12, 3, -7.5, { vol: 0.14, radius: 16 }); }

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['keel-heat'] = { frame: f, x: -154.6, y: 0, z: 0.3, yaw: PI / 2 };
    console.log('[lm-keel-heat] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the shell: floor, roof, long walls with their openings, pilasters, roof trusses, the upper end walls
// ---------------------------------------------------------------------------------------------------------------
function shell(s) {
  const g = s.g, X0 = HALL.x0, X1 = HALL.x1, Z = HALL.z, H = HALL.h;
  // floor: warm concrete, wet in places; a red quarry-tile aisle under the catwalk; yellow lines; drains; the wall aisles
  floor(s, X0, -Z, X1, Z, 0, 'concrete', '#857c70', { matOpts: { rough: -0.22 } });
  runX(X0, X1, 14, (a, b, i) => {
    s.structure(() => {
      g.mat('tile', '#94533a', { rough: -0.3 }); g.box(a, 0, -1.6, b, 0.006, 1.6, { faces: 'Y' });
      g.mat('tile', '#7d6a55', { rough: -0.25 }); for (const sz of [-1, 1]) g.box(a, 0, sz * 12.2 - 1.1, b, 0.005, sz * 12.2 + 1.1, { faces: 'Y' });
      g.mat('paint', C.warn, { rough: -0.2 }); for (const z of [-1.7, 1.7, -5.15, 5.15, -9.9, 9.9, -13.4, 13.4]) g.box(a, 0, z - 0.06, b, 0.008, z + 0.06, { faces: 'Y' });
      g.mat('cast', '#2c2a28'); g.box(a + 3, 0, 2.3, a + 4.2, 0.009, 2.6, { faces: 'Y' }); g.box(a + 9, 0, -2.6, a + 10.2, 0.009, -2.3, { faces: 'Y' });
      if (i % 2) { g.mat('concrete', '#6a6157', { rough: -0.45 }); g.box(a + 4, 0, 3.0, a + 7.5, 0.007, 4.4, { faces: 'Y' }); g.box(b - 6, 0, -12.0, b - 2.5, 0.007, -11.0, { faces: 'Y' }); }
    });
  });
  ceiling(s, X0, -Z, X1, Z, H, 'panel', '#2e3436');
  // the long walls: dark green glazed tile to 2.4 m, ochre-cream blockwork above, the side rooms' openings cut through
  const wo = { mat: 'block', tint: '#cdb58a', dado: { h: 2.4, mat: 'tile', tint: '#24413f' }, skirt: '#2a2622' };
  const north = [
    { at: GIN.x0 + 1, w: 8, h: 1.6, sill: 1.0 }, { at: GIN.x0 + 10, w: 1.6, h: 2.4 }, { at: GIN.x0 + 12.6, w: 8.4, h: 1.6, sill: 1.0 },
    { at: COOK.x0 + 1, w: 8, h: 2.2, sill: 0.9 }, { at: COOK.x0 + 10, w: 3, h: 3.0 }, { at: COOK.x0 + 14, w: 15, h: 2.2, sill: 0.9 },
  ];
  const south = [
    { at: SALT.x0 + 1, w: 11, h: 1.8, sill: 0.9 }, { at: SALT.x0 + 13, w: 2, h: 2.6 }, { at: SALT.x0 + 16, w: 11, h: 1.8, sill: 0.9 },
    { at: INLET.x0 + 9.5, w: 4, h: 3.6 },
  ];
  longWall(s, Z, X0, X1, H, wo, north);
  longWall(s, -Z, X0, X1, H, wo, south);
  for (const op of north.concat(south)) {
    if (!op.sill) continue;
    const zc = north.includes(op) ? Z : -Z;
    s.glass(op.at, op.sill, zc, op.at + op.w, op.sill + op.h, zc, { tint: '#e6e0d0', opacity: 0.1 });
    s.structure(() => { g.mat('cast', C.steel); for (let x = op.at; x <= op.at + op.w + 0.01; x += op.w / Math.max(1, Math.round(op.w / 1.6))) g.box(x - 0.04, op.sill, zc - 0.05, x + 0.04, op.sill + op.h, zc + 0.05); g.mat('wood', '#4a3424'); g.box(op.at, op.sill - 0.05, zc - 0.22, op.at + op.w, op.sill, zc + 0.22); });
  }
  // a band of cream paint at 2.4 m, and the pilasters with the brackets that carry the mains
  runX(X0, X1, 14, (a, b) => s.structure(() => { g.mat('paint', '#e6dcc0'); for (const sz of [-1, 1]) g.box(a, 2.4, sz * Z - sz * 0.03, b, 2.52, sz * Z, { faces: sz > 0 ? 'zyY' : 'ZyY' }); }));
  const blocked = (x, list) => list.some((op) => x > op.at - 0.5 && x < op.at + op.w + 0.5);
  for (let k = -1; k <= EX_N; k++) {
    const x = GAP(k);
    for (const sz of [-1, 1]) {
      const open = blocked(x, sz > 0 ? north : south);
      s.structure(() => {
        g.mat('block', '#b59a6e'); g.box(x - 0.35, open ? 4.0 : 0, sz * Z - sz * 0.5, x + 0.35, H, sz * Z, { bevel: 0.02 });
        if (!open) { g.mat('cast', '#3d4245'); g.box(x - 0.4, 0, sz * Z - sz * 0.55, x + 0.4, 0.55, sz * Z, { bevel: 0.02 }); }
        g.mat('cast', '#3d4245');
        // the bracket: a cantilever under both mains, a hanger to the roof
        const zw = sz * (Z - 0.5), zi = sz * (MAIN.retZ - 1.0);
        g.box(x - 0.12, MAIN.y - MAIN.rf - 0.32, Math.min(zw, zi), x + 0.12, MAIN.y - MAIN.rf - 0.08, Math.max(zw, zi));
        g.tube([[x, MAIN.y - MAIN.rf - 0.2, zi], [x, MAIN.y - MAIN.rf - 1.4, zw]], 0.06, { segs: 6 });
        g.tube([[x, MAIN.y - MAIN.rf - 0.1, zi], [x, H, zi]], 0.04, { segs: 5 });
        for (const zc of [sz * MAIN.flowZ, sz * MAIN.retZ]) { g.mat('cast', '#3d4245'); g.box(x - 0.1, MAIN.y - MAIN.rf - 0.1, zc - 0.5, x + 0.1, MAIN.y - MAIN.rf + 0.15, zc + 0.5); }
      });
    }
    // the roof truss across the hall
    s.structure(() => {
      g.mat('cast', '#36403f');
      g.box(x - 0.15, H - 0.4, -Z, x + 0.15, H, Z); g.box(x - 0.12, H - 1.6, -Z + 0.5, x + 0.12, H - 1.4, Z - 0.5);
      for (let z = -Z + 0.5; z < Z - 1; z += 2.4) { g.tube([[x, H - 1.5, z], [x, H - 0.2, z + 1.2]], 0.04, { segs: 4, caps: false }); g.tube([[x, H - 0.2, z + 1.2], [x, H - 1.5, z + 2.4]], 0.04, { segs: 4, caps: false }); }
    });
  }
  // cable trays along the roof
  runX(X0, X1, 12, (a, b) => s.structure(() => { g.mat('cast', '#4a4f50'); for (const z of [-3.2, 3.2]) { g.box(a, H - 1.9, z - 0.3, b, H - 1.86, z + 0.3); g.box(a, H - 1.86, z - 0.3, b, H - 1.76, z - 0.28); g.box(a, H - 1.86, z + 0.28, b, H - 1.76, z + 0.3); } g.mat('weave', '#2a2622'); for (const z of [-3.2, 3.2]) g.box(a, H - 1.86, z - 0.22, b, H - 1.8, z + 0.2); }));
  // the hall's own bounce light: warm, off ochre walls and red pipes
  s.ambient({ box: HALL.clip, sky: '#ffc98e', ground: '#9a6a48', power: 0.3, soft: 1.5, spec: 0.55, lamp: false });
}

// A wall along x at z = zc from a0 to a1, cut into pieces short enough to bend; openings [{ at (x), w, h, sill }] in frame x.
function longWall(s, zc, a0, a1, h, o, openings) {
  const ops = (openings || []).slice().sort((p, q) => p.at - q.at);
  let x = a0;
  const solid = (u0, u1) => runX(u0, u1, 12, (a, b) => wall(s, a, zc, b, zc, 0, h, o));
  for (const op of ops) {
    if (op.at > x + 0.01) solid(x, op.at);
    wall(s, op.at, zc, op.at + op.w, zc, 0, h, Object.assign({}, o, { openings: [{ at: 0, w: op.w, h: op.h, sill: op.sill || 0 }] }));
    x = op.at + op.w;
  }
  if (x < a1 - 0.01) solid(x, a1);
}

// ---------------------------------------------------------------------------------------------------------------
// the mains: the loop's flow and return along both walls, the vat water inboard of the ranks
// ---------------------------------------------------------------------------------------------------------------
function mains(s) {
  const g = s.g, X0 = HALL.x0 + 0.2, X1 = HALL.x1 - 0.2;
  for (const sz of [-1, 1]) {
    runX(X0, X1, 12, (a, b, i) => {
      s.structure(() => {
        for (const q of [[sz * MAIN.flowZ, MAIN.rf, C.loop], [sz * MAIN.retZ, MAIN.rr, C.ret]]) {
          g.mat('paint', q[2], { rough: 0.1 }); g.tube(lineX(a, b, MAIN.y, q[0], 3), q[1], { segs: 22, caps: false });
          // brass bands every four metres, and the canvas straps of the lagging between them
          g.mat('cast', C.brass, { rough: -0.25 }); for (let x = a + 1; x < b - 0.2; x += 4) g.tube([[x - 0.09, MAIN.y, q[0]], [x + 0.09, MAIN.y, q[0]]], q[1] + 0.035, { segs: 22, caps: false });
          g.mat('weave', '#2a2622'); for (let x = a + 3; x < b - 0.2; x += 4) g.tube([[x - 0.04, MAIN.y, q[0]], [x + 0.04, MAIN.y, q[0]]], q[1] + 0.015, { segs: 22, caps: false });
        }
        // the vat main
        g.mat('paint', C.vat, { rough: 0.0 }); g.tube(lineX(a, b, VAT.y, sz * VAT.z, 3), VAT.r, { segs: 16, caps: false });
        g.mat('cast', C.brass, { rough: -0.25 }); for (let x = a + 2; x < b - 0.2; x += 4) g.tube([[x - 0.06, VAT.y, sz * VAT.z], [x + 0.06, VAT.y, sz * VAT.z]], VAT.r + 0.03, { segs: 16, caps: false });
        // its hangers from the roof
        g.mat('cast', '#3d4245'); for (let x = a + 1.5; x < b; x += 8) { g.tube([[x, VAT.y + VAT.r, sz * VAT.z], [x, HALL.h - 1.6, sz * VAT.z]], 0.035, { segs: 5 }); g.box(x - 0.06, VAT.y - VAT.r - 0.08, sz * VAT.z - 0.55, x + 0.06, VAT.y - VAT.r, sz * VAT.z + 0.55); for (const dz of [-0.5, 0.5]) g.tube([[x, VAT.y - VAT.r - 0.04, sz * VAT.z + dz], [x, VAT.y + 0.3, sz * VAT.z + dz]], 0.025, { segs: 4 }); }
      });
      // the way it flows, painted on the mains every other piece: arrows and the temperatures
      if (i % 2 === 0) {
        const xm = (a + b) / 2, dir = sz > 0 ? 1 : -1;
        sign(s, { kind: 'letters', text: '65 · OUT', font: 'caps', palette: ['#f6e2b8'] }, xm, MAIN.y, sz * (MAIN.flowZ - MAIN.rf - 0.02), { face: sz > 0 ? 'z' : 'Z', w: 1.6, h: 0.5, glow: 0.4 });
        sign(s, { kind: 'letters', text: '41 · BACK', font: 'caps', palette: ['#f6e2b8'] }, xm + 2 * dir, MAIN.y, sz * (MAIN.retZ - MAIN.rr - 0.02), { face: sz > 0 ? 'z' : 'Z', w: 1.6, h: 0.5, glow: 0.4 });
      }
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// a pair of exchangers, one in each rank, and their numbers
// ---------------------------------------------------------------------------------------------------------------
function exchangerPair(s, k, r) {
  const x = EX_X0 + EX_P * k;
  for (const sz of [1, -1]) {
    const yaw = sz > 0 ? 0 : PI, z = sz * RANK_Z, n = sz > 0 ? k + 1 : k + 1 + EX_N;
    const paint = EX_PAINT[(k * 5 + (sz > 0 ? 0 : 3)) % EX_PAINT.length];
    const v = r.f(0, 0.05);
    prop(s, 'keelheat.exchanger', x, 0, z, yaw, { paint }, { tint: [1 - v, 1 - v * 0.8, 1 - v * 0.6] });
    // the number, painted big on the head where the catwalk can read it
    const lx = -EX.L / 2 - 0.3, lz = -EX.D / 2 - 0.03;
    const wx = sz > 0 ? x + lx : x - lx, wz = sz > 0 ? z + lz : z - lz;
    sign(s, { kind: 'letters', text: String(n), font: 'caps', palette: ['#f1e6c9'] }, wx, 5.5, wz, { face: sz > 0 ? 'z' : 'Z', w: 0.9, h: 0.75, glow: 0.25 });
    // where its city pipes meet the mains: a brass flange on each main's belly
    const hx = sz > 0 ? x - 6.05 : x + 6.05, hx2 = sz > 0 ? x - 6.35 : x + 6.35;
    s.structure(() => {
      const g = s.g;
      g.mat('cast', C.brass, { rough: -0.2 });
      g.cyl(hx, MAIN.y - MAIN.rf - 0.18, sz * MAIN.flowZ, 0.32, 0.1, { segs: 12 }); g.cyl(hx2, MAIN.y - MAIN.rr - 0.2, sz * MAIN.retZ, 0.3, 0.1, { segs: 12 });
      g.cyl(hx, VAT.y - VAT.r - 0.1, sz * VAT.z, 0.3, 0.08, { segs: 12 }); g.cyl(hx2, VAT.y - VAT.r - 0.1, sz * VAT.z, 0.28, 0.08, { segs: 12 });
    });
    // steam off a weeping gland now and then, caught in the lamplight
    if (r.chance(0.5)) {
      const sx = sz > 0 ? x - 5.3 : x + 5.3, sz2 = z + (sz > 0 ? 0.6 : -0.6);
      s.glowCard(sx, 5.6, sz2, { face: 'x', color: '#fff0dc', size: 2.2, strength: 0.05, follow: 'always' });
      s.glowCard(sx, 6.6, sz2, { face: 'z', color: '#fff0dc', size: 2.8, strength: 0.03, follow: 'always' });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the catwalk down the middle: steel grating at y = 4.2, a bay at the middle, stairs at both ends
// ---------------------------------------------------------------------------------------------------------------
function catwalk(s) {
  const g = s.g, y = CAT.y, z0 = -CAT.w, z1 = CAT.w;
  runX(CAT.x0, CAT.x1, 8, (a, b, i) => {
    s.structure(() => {
      g.mat('grille', '#6a6a62'); g.box(a, y - 0.04, z0, b, y, z1, { faces: 'Yy' });
      g.mat('cast', '#36403f'); g.box(a, y - 0.24, z0 - 0.06, b, y + 0.12, z0); g.box(a, y - 0.24, z1, b, y + 0.12, z1 + 0.06);
      for (let x = a; x < b - 0.1; x += 1.6) g.box(x - 0.03, y - 0.22, z0, x + 0.03, y - 0.04, z1);
      for (const zr of [z0 - 0.03, z1 + 0.03]) {
        for (let x = a; x < b - 0.1; x += 2) g.tube([[x, y + 0.1, zr], [x, y + 1.08, zr]], 0.022, { segs: 5 });
        g.mat('cast', C.warn, { rough: -0.1 }); g.tube(lineX(a, b, y + 1.08, zr, 4), 0.03, { segs: 6, caps: false });
        g.mat('cast', '#36403f'); g.tube(lineX(a, b, y + 0.55, zr, 4), 0.016, { segs: 5, caps: false });
      }
      if (i % 2 === 0) for (const zr of [z0 - 0.06, z1 + 0.06]) g.tube([[a + 0.5, y + 0.12, zr], [a + 0.5, HALL.h - 1.9, zr]], 0.02, { segs: 4 });
    });
    s.solid(a, y - 0.25, z0, b, y, z1, { surf: 'metal' });
    s.solid(a, y, z0 - 0.08, b, y + 1.1, z0 - 0.01); s.solid(a, y, z1 + 0.01, b, y + 1.1, z1 + 0.08);
  });
  stairFlight(s, CAT.x0, 'x', y, 6.6);
  stairFlight(s, CAT.x1, 'X', y, 6.6);
}
// A flight from the catwalk's end down to the floor, centred on z = 0. dir 'x': it descends toward -x; 'X': toward +x.
function stairFlight(s, x, dir, rise, run) {
  const g = s.g, n = Math.round(rise / 0.18), sr = rise / n, st = run / n, sg = dir === 'X' ? 1 : -1, w = 2.0;
  s.structure(() => {
    for (let i = 0; i < n; i++) {
      const u0 = x + sg * i * st, u1 = x + sg * (i + 1) * st, yt = rise - i * sr;
      g.mat('grille', '#6a6a62'); g.box(Math.min(u0, u1), yt - 0.04, -w / 2, Math.max(u0, u1), yt, w / 2, { faces: 'Yy' });
      g.mat('cast', C.warn); g.box(sg > 0 ? u1 - 0.04 : u1, yt - 0.04, -w / 2, sg > 0 ? u1 : u1 + 0.04, yt + 0.002, w / 2, { faces: 'Y' });
    }
    g.mat('cast', '#36403f');
    for (const dz of [-w / 2 - 0.05, w / 2 + 0.05]) {
      g.tube([[x, rise, dz], [x + sg * run, 0, dz]], 0.07, { segs: 5 });
      g.tube([[x, rise + 1.05, dz], [x + sg * run, 1.0, dz]], 0.028, { segs: 6 });
      for (let k = 1; k < 4; k++) { const t = k / 4; g.tube([[x + sg * run * t, rise * (1 - t), dz], [x + sg * run * t, rise * (1 - t) + 1.02, dz]], 0.02, { segs: 4 }); }
    }
  });
  s.ramp(Math.min(x, x + sg * run), -w / 2, Math.max(x, x + sg * run), w / 2, sg > 0 ? rise : 0, sg > 0 ? 0 : rise, 'x', { surf: 'metal' });
  for (const dz of [-w / 2 - 0.08, w / 2 + 0.01]) s.solid(Math.min(x, x + sg * run), 0.6, dz, Math.max(x, x + sg * run), rise + 1.1, dz + 0.07);
}

// ---------------------------------------------------------------------------------------------------------------
// light: amber pendants over the catwalk, lamps under the mains along the walls, strips under the catwalk; warm fog
// ---------------------------------------------------------------------------------------------------------------
function hallLight(s, r) {
  const clip = HALL.clip;
  for (let k = 0; k < EX_N; k++) {
    const x = EX_X0 + EX_P * k;
    prop(s, 'keelheat.pendant', x, HALL.h, 0, 0, { drop: 3.6 });
    s.light({ at: [x, HALL.h - 4.2, 0], color: [1.0, 0.6, 0.3], power: 30, range: 17, radius: 0.25, shadow: true, clip });
    // under the catwalk: a strip of warm light over the red aisle
    if (k % 2 === 0) {
      s.structure((g) => { g.mat('diffuser', '#ffc070', { emissive: 4 }); g.box(x - 5, CAT.y - 0.3, -0.06, x + 5, CAT.y - 0.26, 0.06); });
      s.light({ at: [x - 5, CAT.y - 0.35, 0], to: [x + 5, CAT.y - 0.35, 0], type: 'tube', color: [1.0, 0.66, 0.36], power: 9, range: 7, radius: 0.08, shadow: true, clip });
    }
  }
  for (let k = -1; k <= EX_N; k++) {
    const x = GAP(k);
    for (const sz of [-1, 1]) {
      // a caged lamp on the pilaster under the mains, throwing light along the wall aisle
      s.deco((g) => {
        g.mat('cast', '#3d4245'); g.box(x - 0.12, 7.6, sz * (HALL.z - 0.5) - 0.3 * sz, x + 0.12, 7.9, sz * (HALL.z - 0.5));
        g.mat('diffuser', '#ffbe70', { emissive: 5 }); g.ball(x, 7.55, sz * (HALL.z - 1.0), 0.16, 0.2, 0.16, { segs: 10, rings: 6 });
        g.mat('cast', '#2c3133'); for (let i = 0; i < 4; i++) { const a = i * PI / 2; g.tube([[x + Math.sin(a) * 0.2, 7.35, sz * (HALL.z - 1.0) + Math.cos(a) * 0.2], [x + Math.sin(a) * 0.2, 7.8, sz * (HALL.z - 1.0) + Math.cos(a) * 0.2]], 0.01, { segs: 3 }); }
      });
      s.light({ at: [x, 7.4, sz * (HALL.z - 1.1)], color: [1.0, 0.64, 0.34], power: 13, range: 12, radius: 0.16, shadow: true, clip });
    }
  }
  // warm fog lying on the floor: the glands weep, the hall is at thirty degrees, and the air is wet
  for (let x = HALL.x0 + 4; x < HALL.x1 - 2; x += 8) {
    for (const z of [-12.3, -3.3, 3.3, 12.3]) {
      const k = r.f(0.8, 1.25);
      s.glowCard(x + r.f(-1.5, 1.5), 0.3, z, { face: 'y', color: '#ffcf9a', size: 8 * k, strength: 0.024, follow: 'always' });
      if (r.chance(0.6)) s.glowCard(x + r.f(-1, 1), 0.7, z + r.f(-0.8, 0.8), { face: 'x', color: '#ffd4a6', size: 3.6 * k, strength: 0.014, follow: 'always' });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// people and things to do in the hall
// ---------------------------------------------------------------------------------------------------------------
function hallLife(game, s, f, r) {
  const X0 = HALL.x0, X1 = HALL.x1;
  // walkways: the floor aisles beside the catwalk, the wall aisles, the crossings; the catwalk itself and its stairs
  // (kept sparse: the people who come to a place are counted from its walkways, and a heat works is not a street)
  for (const sz of [-1, 1]) {
    const w = [[X0 + 1, sz * 12.2]]; for (let k = -1; k <= EX_N; k++) w.push([GAP(k), sz * 12.2]); w.push([X1 - 1, sz * 12.2]); s.path(w);
  }
  for (let k = -1; k <= EX_N; k += 4) { s.path([[GAP(k), -12.2], [GAP(k), -3.0], [GAP(k), 0]]); s.path([[GAP(k), 12.2], [GAP(k), 3.0], [GAP(k), 0]]); }
  s.path([[X0 + 1, 0], [X0 + 1, 12.2]]); s.path([[X0 + 1, 0], [X0 + 1, -12.2]]); s.path([[X1 - 1, 0], [X1 - 1, 12.2]]); s.path([[X1 - 1, 0], [X1 - 1, -12.2]]);
  const cw = [[X0 + 1, 0, 0], [CAT.x0 - 6.6, 0, 0], [CAT.x0, CAT.y, 0]]; for (let x = -100; x <= 100; x += 40) cw.push([x, CAT.y, 0]); cw.push([CAT.x1, CAT.y, 0], [CAT.x1 + 6.6, 0, 0], [X1 - 1, 0, 0]);
  s.path(cw, { width: 1.2 });
  // crews at the exchangers: reading the thermometers on the heads, at the valve wheels, writing it up
  for (let k = 0; k < EX_N; k++) {
    const x = EX_X0 + EX_P * k;
    for (const sz of [1, -1]) {
      if (r.chance(0.45)) continue;
      const hx = sz > 0 ? x - 7.1 : x + 7.1, face = sz > 0 ? PI / 2 : -PI / 2;
      s.spot('work', hx, 0, sz * RANK_Z + sz * r.f(-0.8, 0.8), face, { tags: [r.chance(0.5) ? 'notes' : 'crew', 'exchanger'] });
    }
    if (k % 3 === 1) s.spot('work', GAP(k) + r.f(-0.6, 0.6), 0, r.chance(0.5) ? 2.8 : -2.8, r.f(0, 6), { tags: ['sweep'] });
    if (k % 4 === 2) { const sz = r.chance(0.5) ? 1 : -1; s.spot('work', GAP(k) + 1.6, 0, sz * 12.6, PI / 2, { tags: ['porter'] }); }
  }
  for (let x = -96; x <= 96; x += 48) s.spot('stand', x + r.f(-2, 2), CAT.y, 0.75, 0, { tags: ['crew', 'rail'] });
  // gauge posts at some crossings, in the floor aisles, with people reading them
  for (let k = 1; k < EX_N; k += 3) {
    const x = GAP(k), sz = k % 2 ? 1 : -1;
    prop(s, 'keelheat.gaugepost', x, 0, sz * 4.9, sz > 0 ? PI : 0, {});
    s.spot('work', x, 0, sz * 4.1, sz > 0 ? 0 : PI, { tags: ['notes', 'gauges'] });
    if (k % 2) { s.spot('chat', x - 0.8, 0, sz * 3.6, 0.9, { tags: ['crew'] }); s.spot('chat', x + 0.7, 0, sz * 3.4, -2.2, { tags: ['crew'] }); }
  }
  // a trolley of spare gaskets and a tool chest here and there in the wall aisles
  for (const k of [0, 5, 11, 15]) {
    const x = GAP(k) - 2.2, sz = k % 2 ? -1 : 1;
    s.detail((g) => {
      g.mat('paint', '#7a2e24'); g.box(x - 0.6, 0, sz * 14.0 - 0.3, x + 0.6, 0.9, sz * 14.0 + 0.3, { bevel: 0.015 });
      g.mat('cast', C.steel); for (let i = 0; i < 4; i++) g.box(x - 0.5, 0.15 + i * 0.19, sz * 14.0 - sz * 0.31, x + 0.5, 0.17 + i * 0.19, sz * 14.0 - sz * 0.3);
      g.mat('cast', C.brass); g.box(x - 0.15, 0.8, sz * 14.0 - sz * 0.32, x + 0.15, 0.84, sz * 14.0 - sz * 0.3);
      g.mat('speckle', '#25352f'); for (let i = 0; i < 6; i++) g.box(x + 0.9, i * 0.03, sz * 14.0 - 0.8, x + 2.4, i * 0.03 + 0.025, sz * 14.0 + 0.6, { bevel: 0.005 });
    });
    s.solid(x - 0.6, 0, sz * 14.0 - 0.3, x + 2.4, 0.9, sz * 14.0 + 0.6);
  }
  // read an exchanger: the plate on the head
  for (const k of [2, 9]) {
    const x = EX_X0 + EX_P * k - EX.L / 2 - 0.3, z = RANK_Z - EX.D / 2 - 0.03;
    sign(s, { kind: 'plate', text: 'Exchanger ' + (k + 1), lines: ['52 plates · 20,000 kW', 'vat side 69 in · 47 out', 'loop side 41 in · 65 out'] }, x, 2.2, z, { face: 'z', w: 0.5, h: 0.3 });
    s.interact({ x, y: 1.8, z: z - 0.8, radius: 1.6, prompt: 'Read the exchanger\'s plate', onUse: async (gm) => {
      await say(gm, 'Exchanger ' + (k + 1), [
        'Fifty-two pressed steel plates in a pack the size of a house, bolted shut. Vat water at sixty-nine degrees runs up one side of every plate, the city\'s loop runs down the other, and the two never touch.',
        'The loop comes back from the city at forty-one degrees and leaves this pack at sixty-five. The vat water goes home to the vats at forty-seven, ready to take up their heat again.',
        'A chalk tally on the frame: gaskets last changed eleven years ago, by hand, one plate at a time. Underneath, in another hand: and again next year.',
      ]);
    } });
  }
  // lean on the catwalk rail: the view up the hall
  for (const x of [-60, 40]) s.interact({ x, y: CAT.y + 1.2, z: CAT.w - 0.1, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => {
    const h = gm.clock ? gm.clock.hours : 12;
    await say(gm, 'The catwalk', [
      'Both ways the hall climbs. The ranks of exchangers, the red and teal mains and the line of amber lamps tilt up with the floor until the far end of the hall hangs over the roof trusses.',
      'The food plant throws off about a third of a kilowatt of heat for every person in the drum. The city takes a sixth of it as hot water and warm floors. The rest goes on along the Keel to the back axle, and out of the drum.',
      h >= 23 || h < 6.5 ? 'The lamp-night belongs to the machines. The loop runs the same at three in the morning as at noon; the baths are full of it either way.' : 'It is thirty degrees up here and wet. The crews work in shirtsleeves and drink a great deal of tea.',
    ]);
  } });
  // the board at the anti end: where the heat comes from
  sign(s, { kind: 'board', title: 'Into the loop', lines: ['The Flour Hall · Ring Five|by the Kettle', 'Curd Row · Ring Five|69', 'The steak halls · Ring Six|68', 'The brew vats · Ring Seven|66', 'The algae hall · Ring Four|62', 'Out to the city|65', 'Back from the city|41', 'On to the back axle|what is left'], palette: ['#24413f', '#f3e6c8', '#f2b56b'] }, X0 + 0.12, 2.0, -9.2, { face: 'X', w: 2.6, h: 1.8 });
  s.interact({ x: X0 + 1.0, y: 1.6, z: -9.2, radius: 1.8, prompt: 'Read the board', onUse: async (gm) => {
    await say(gm, 'Into the loop', [
      'The vat halls of the Keel send their warm water to the loop halls, and this is one of them. The thermophilic strains run at sixty to seventy degrees, and whatever they make, they make heat.',
      'The Flour Hall sends its share through the Kettle at Ring Five. The rest come in by the ochre mains, and all of it goes through the exchangers to the loop.',
      'Bottom line, in chalk: the city takes what it can use. What is left goes on to the back axle, and out of the drum with everything else, about a hundred and sixty gigawatts all told.',
    ]);
  } });
  // a toast the first time you come out onto the hall floor
  let seen = false;
  s.trigger({ box: [X0 + 0.5, -0.5, -5, X0 + 6, 3, 5], onEnter(gm) { if (seen) return; seen = true; toast(gm, 'Thirty-two exchangers and the loop\'s mains, curving up with the drum. The far end is over your head.'); } });
  void game; void f;
}
