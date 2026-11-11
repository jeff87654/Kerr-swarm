// The Garden: Chervil's lamp-lit racks in the Keel, deck 6, under Ring Four, at a full g near enough.
//
// The third tier of the food system: the Mill makes two-thirds of the calories and the Vats most of the rest; the Garden
// grows what cannot be made. Its big hall, the Greens, is five decks of racks behind glass, six rows of them running
// spinward for 330 metres, so the rows climb with the floor until the far end is over your head and then behind the
// ceiling. Every tray has its own lamp, red and blue, so the whole hall is pink, and pickers ride mast lifts between
// the racks with the bay they are working switched to white.
//
// In front of it, at the anti end, the Packing Hall (cool white): crates for the halls of Ring Four, each with a
// block's name on it. Beside it, the Glass Walk, the visitors' gallery the length of the hall, and off the walk the
// smaller places (lm_keel_garden_rooms.js): the Tomato House with its brush bench, the Tea Rows, the Cool Rooms where
// the mushrooms are, and the Green Tanks.
//
// Frame 'keel-garden': x spinward, z toward the back cap, y up. See HALL and the rest in lm_keel_garden_props.js.
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, REGION, HALL, GAL, ROWS, LANES, STREET, RACK_D, RX0, RX1, RACK_TOP, HALL_CLIP, C, PACK, LOBBY, BELT_X0, TOMATO, TEA, COOL, TANKS, FAR,
  bays, say, toast, find, tick, runX, lineX, gardenAtlas, glyphWord } from './lm_keel_garden_props.js';
import { buildRooms } from './lm_keel_garden_rooms.js';

const H = HALL.h;
const ENV_GREENS = { exposure: 1.0, autoKey: 0.16, bloom: 0.09, warmth: 0.0, contrast: 1.1, saturation: 1.12 };
const ENV_WALK = { exposure: 1.0, autoKey: 0.15, bloom: 0.08, warmth: 0.02, contrast: 1.08, saturation: 1.1 };
const LIFT_H = [1.9, 5.5, 9.1, 12.7, 16.3];
// the doors in the Glass Walk's outer wall, into the rooms: [x of the near edge, width, height]
const DOORS = [[TOMATO.x0 + 11.5, 2.2, 2.7], [TEA.x0 + 5, 1.8, 2.4], [COOL.x0 + 3, 1.4, 2.2], [TANKS.x0 + 4, 2.4, 3.0]];

export const place = {
  id: 'lm-keel-garden', name: 'The Garden', order: 10,
  region: REGION,
  stops: [
    { id: 'keel-garden', name: 'The Garden', sub: 'the garden racks · deck 6 · Ring Four', group: 'The Keel', spawn: 'keel-garden', deck: 6, zd: 1460 },
    { id: 'keel-garden-far', name: 'The Garden, spinward end', sub: 'the end of the Glass Walk · deck 6', group: 'The Keel', spawn: 'keel-garden-far', deck: 6, zd: 1460 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('keel-garden', deckRadius(6), 0.9, 1460);
    const s = W.scope('keel-garden', f);
    const tA = performance.now(); const R = gardenAtlas(game); console.log('[lm-keel-garden] atlas ' + (performance.now() - tA).toFixed(0) + ' ms');
    const r = new Rng(6146);
    const BAYS = bays();
    const lifts = planLifts(r, BAYS);
    const lamps = planLamps(r, lifts, BAYS);

    const T = [], mark = (n) => T.push(n + ' ' + (performance.now() - t0).toFixed(0));
    shell(s, R); mark('shell');
    await tick(game);
    for (let ri = 0; ri < ROWS.length; ri++) { rackRow(s, ri, R, BAYS, lamps); if (ri % 2) { mark('row' + ri); await tick(game); } }
    fittings(s, R, r, lifts, BAYS); mark('fit');
    await tick(game);
    glassWalk(game, s, f, R, r); mark('walk');
    await tick(game);
    greensLife(game, s, f, r, lifts);
    await buildRooms(game, s, f, R, r); mark('rooms');

    s.zoneBox({ id: 'keel-garden-greens', place: 'keel-garden', box: [HALL.x0, -0.5, HALL.z0, HALL.x1, H, HALL.z1], name: 'The Greens', sub: 'The Garden · five decks of racks', ambience: 'quiet', reverb: 'ring', headroom: H, env: ENV_GREENS });
    s.zoneBox({ id: 'keel-garden-walk', place: 'keel-garden', box: [HALL.x0, -0.5, GAL.z0, HALL.x1, H, GAL.z1], name: 'The Glass Walk', sub: 'The Garden · the Keel · deck 6 · Ring Four', ambience: 'quiet', reverb: 'ring', headroom: H, env: ENV_WALK });
    for (let x = 16; x < HALL.x1; x += 48) { s.loop('air', x, 17, 14, { vol: 0.28, radius: 34 }); s.loop('hum-lamp', x + 24, 4, 1.5, { vol: 0.14, radius: 12 }); }
    s.loop('tide', 40, 1, 14, { vol: 0.12, radius: 22 });

    let left = s.finish(80);
    while (left) { await tick(game); left = s.finish(80); }
    game.spawns['keel-garden'] = { frame: f, x: LOBBY.x0 + 3.2, y: 0, z: 14, yaw: PI / 2 };
    game.spawns['keel-garden-far'] = { frame: f, x: FAR.x1 - 1.6, y: 0, z: -3, yaw: -PI / 2 };
    mark('done');
    console.log('[lm-keel-garden] built in ' + (performance.now() - t0).toFixed(0) + ' ms (' + T.join(', ') + ')');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// planning: where the lifts are working, and which bays are lit white (being picked) or dark (in their own night)
// ---------------------------------------------------------------------------------------------------------------
function laneRows(li) { return li === 0 ? [0] : li === LANES.length - 1 ? [ROWS.length - 1] : [li - 1, li]; }
function planLifts(r, BAYS) {
  const out = [];
  const want = [0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 1, 4, 2];
  for (let k = 0; k < want.length; k++) {
    const li = want[k], bi = r.i(0, BAYS.length - 1), b = BAYS[bi];
    if (out.some((q) => q.li === li && Math.abs(q.bi - bi) < 3)) continue;
    const rows = laneRows(li), row = rows[r.i(0, rows.length - 1)];
    let z = LANES[li];
    if (li === 3) z = row === 2 ? STREET.z0 + 1.0 : STREET.z1 - 1.0;
    // nearer the glass the lifts sit lower, so a visitor sees a picker's face as well as their boots
    const h = li === 0 ? LIFT_H[r.i(0, 2)] : LIFT_H[r.i(0, LIFT_H.length - 1)];
    out.push({ li, bi, row, x: b[0] + r.f(1.4, BAY_W(b) - 1.4), z, h, lamp: r.chance(0.8) });
  }
  return out;
}
function BAY_W(b) { return b[1] - b[0]; }
function planLamps(r, lifts, BAYS) {
  const m = new Map();
  for (const q of lifts) m.set(q.row + ':' + q.bi, 'white');
  // a few bays keep their night now (their lamps off), a run of three at a time
  for (let k = 0; k < 7; k++) { const ri = r.i(0, ROWS.length - 1), b0 = r.i(2, BAYS.length - 4); for (let i = b0; i < b0 + 3; i++) if (!m.has(ri + ':' + i)) m.set(ri + ':' + i, 'off'); }
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// the shell of the Greens: floor, roof, walls, the glass, the ducts and the belt
// ---------------------------------------------------------------------------------------------------------------
function shell(s, R) {
  const g = s.g, X0 = HALL.x0, X1 = HALL.x1, Z1 = HALL.z1;
  floor(s, X0, HALL.z0, X1, Z1, 0, 'concrete', '#706c66', { matOpts: { rough: -0.3 } });
  // painted lines down the lanes and the street, drains under the racks' ends
  runX(X0, X1, 16, (a, b, i) => {
    s.structure(() => {
      g.mat('paint', '#d6a640', { rough: -0.2 });
      for (const z of [STREET.z0 + 0.12, STREET.z1 - 0.12]) g.box(a, 0, z - 0.06, b, 0.006, z + 0.06, { faces: 'Y' });
      g.mat('paint', '#e8e2d2', { rough: -0.2 }); for (let x = a + 1; x < b - 1; x += 4) g.box(x, 0, STREET.z0 + 2.9 - 0.05, x + 2, 0.006, STREET.z0 + 2.9 + 0.05, { faces: 'Y' });
      g.mat('concrete', '#5c5852', { rough: -0.45 }); if (i % 2) for (const z of LANES) g.box(a + 3, 0, z - 0.4, a + 6, 0.005, z + 0.4, { faces: 'Y' });
    });
  });
  ceiling(s, X0, HALL.z0, X1, Z1, H, 'panel', '#2a2830');
  // the back wall and the far end, plum-grey panels with a band of orange at each deck line
  runX(X0, X1, 12, (a, b) => {
    wall(s, a, Z1, b, Z1, 0, H, { mat: 'panel', tint: '#3a3440', skirt: false, t: 0.3 });
    s.structure(() => { g.mat('paint', C.deck); for (const y of [4, 8, 12, 16]) g.box(a, y - 0.1, Z1 - 0.18, b, y + 0.1, Z1 - 0.15, { faces: 'zyY' }); });
  });
  wall(s, X1, HALL.z0, X1, Z1, 0, H, { mat: 'panel', tint: '#3a3440', skirt: false, t: 0.3 });
  // the anti end over the Packing Hall (its glass is the Packing Hall's)
  s.structure(() => { g.mat('panel', '#3a3440'); g.box(X0 - 0.3, PACK.h, HALL.z0, X0, H, Z1, { faces: 'xX' }); g.box(X0 - 0.3, PACK.h, GAL.z0, X0, H, GAL.z1, { faces: 'xX' }); });
  sign(s, { kind: 'letters', text: 'The Greens', palette: ['#f1e6c9'] }, X0 + 0.02, 14.8, GAL.z0 / 2, { face: 'X', w: 3.4, h: 1.1, glow: 1.2 });
  // the glass between the Greens and the Glass Walk, deck by deck, with the deck numbers on the transoms
  runX(X0, X1, 8, (a, b, i) => {
    s.glass(a, 0.32, 0, b, H, 0, { tint: C.glassTint, opacity: 0.08, rough: 0.04 });
    s.structure(() => {
      g.mat('cast', '#2a2c30', { rough: -0.1 });
      for (const x of [a, (a + b) / 2]) g.box(x - 0.06, 0, -0.09, x + 0.06, H, 0.09, { faces: 'xXzZ' });
      for (const y of [4, 8, 12, 16]) g.box(a, y - 0.09, -0.1, b, y + 0.09, 0.1, { faces: 'yYzZ' });
      g.mat('concrete', '#4a4640'); g.box(a, 0, -0.16, b, 0.32, 0.16, { faces: 'yYzZ' });
    });
    if (i % 4 === 1 && R) s.structure(() => { g.at(a, 0, -0.1, PI); for (let d = 0; d < 5; d++) glyphWord(g, R, String(6 + d), 1, Math.min(d * 4 + 3.55, H - 0.5), 0.002, 0.22, 0.3); g.pop(); });
  });
  s.solid(X0, 0, -0.12, X1, H, 0.12, { surf: 'stone' });
  // air ducts over four of the lanes, on hangers
  for (const z of [LANES[1], LANES[2], LANES[4], LANES[5]]) {
    runX(X0 + 2, X1 - 2, 8, (a, b) => s.structure(() => {
      g.mat('brushed', '#b8b4ac', { rough: 0.1 }); g.tube(lineX(a, b, 18.75, z, 4), 0.32, { segs: 10, caps: false });
      g.mat('cast', '#5a5652'); g.tube([[a + 0.1, 18.75, z], [b - 0.1, 18.75, z]], 0.335, { segs: 10, caps: false }); g.box(a + 2, 19.05, z - 0.02, a + 2.06, H, z + 0.02);
      g.mat('grille', '#8a8880'); g.box(a + 3, 18.4, z - 0.22, a + 3.8, 18.44, z + 0.22, { faces: 'y' });
    }));
  }
  // the crate belt down the middle of the street, from the far end to the Packing Hall
  runX(BELT_X0, RX1 + 4, 8, (a, b) => s.structure(() => {
    const z0 = STREET.belt - 0.6, z1 = STREET.belt + 0.6;
    g.mat('speckle', '#2a2826', { rough: 0.2 }); g.box(a, 0.62, z0 + 0.06, b, 0.7, z1 - 0.06, { faces: 'Y' });
    g.mat('brushed', '#9c968a'); g.box(a, 0.55, z0, b, 0.82, z0 + 0.06, { faces: 'yYzZ' }); g.box(a, 0.55, z1 - 0.06, b, 0.82, z1, { faces: 'yYzZ' });
    g.mat('cast', '#3d4245'); for (let x = a + 0.5; x < b; x += 2) for (const z of [z0 + 0.03, z1 - 0.03]) g.box(x - 0.03, 0, z - 0.03, x + 0.03, 0.55, z + 0.03, { faces: 'xXzZ' });
  }));
  s.solid(BELT_X0, 0, STREET.belt - 0.6, RX1 + 4, 0.82, STREET.belt + 0.6, { surf: 'metal' });
  // the Greens' own bounce light: pink off everything
  s.ambient({ box: [HALL.x0 - 0.5, -0.5, HALL.z0 - 0.3, HALL.x1 + 0.5, H + 0.2, HALL.z1 + 0.5], sky: '#e03aa0', ground: '#4a1a40', power: 0.32, soft: 1.5, spec: 0.3, lamp: false });
}

// ---------------------------------------------------------------------------------------------------------------
// one row of racks: forty bays, the ends, the row's letter and the deck numbers on the end that faces the Packing Hall
// ---------------------------------------------------------------------------------------------------------------
function rackRow(s, ri, R, BAYS, lamps) {
  const row = ROWS[ri], g = s.g;
  for (const b of BAYS) {
    const i = b[2], lamp = lamps.get(ri + ':' + i) || 'pink';
    const crop = row.crops[(Math.floor(i / 3) + ri) % row.crops.length];
    prop(s, 'keelgarden.bay', (b[0] + b[1]) / 2, 0, row.z, 0, { crop, lamp, v: (i + ri) % 3 });
  }
  // the ends: the two ends of the row and both sides of each cross gap
  const ends = [[RX0 - 0.06, -PI / 2], [RX1 + 0.06, PI / 2]];
  for (let k = 1; k < BAYS.length; k++) if (BAYS[k][0] - BAYS[k - 1][1] > 0.5) { ends.push([BAYS[k - 1][1] + 0.06, PI / 2]); ends.push([BAYS[k][0] - 0.06, -PI / 2]); }
  for (const e of ends) prop(s, 'keelgarden.rackend', e[0], 0, row.z, e[1], {});
  if (R) s.structure(() => {
    g.at(RX0 - 0.13, 0, row.z, -PI / 2);
    glyphWord(g, R, row.name, 0, 2.5, 0.001, 1.0, 1.3, { emissive: 0.6 });
    for (let d = 0; d < 5; d++) glyphWord(g, R, String(6 + d), 1, Math.min(d * 4 + 3.45, RACK_TOP - 0.4), 0.001, 0.3, 0.4);
    g.pop();
  });
}

// ---------------------------------------------------------------------------------------------------------------
// what stands in the lanes: the lifts, crates on the belt, trolleys in the cross aisle, the lamps
// ---------------------------------------------------------------------------------------------------------------
function fittings(s, R, r, lifts) {
  const g = s.g;
  for (const q of lifts) {
    prop(s, 'keelgarden.lift', q.x, 0, q.z, 0, { h: q.h, lamp: q.lamp || undefined });
    // the lift's rail along the lane floor
    s.structure(() => { g.mat('cast', '#4a4640'); g.box(q.x - 4, 0, q.z - 0.05, q.x + 4, 0.03, q.z + 0.05, { faces: 'YzZ' }); });
    if (q.lamp) s.light({ at: [q.x - 0.4, q.h + 2.1, q.z], color: [1.0, 0.96, 1.0], power: 3.2, range: 4.5, radius: 0.08, clip: HALL_CLIP });
  }
  // crates riding the belt
  for (let x = 12; x < RX1; x += r.f(7, 14)) prop(s, 'keelgarden.crate', x, 0.7, STREET.belt, 0, { w: 0.6, d: 0.4, h: 0.3, fill: r.pick(['#9fd06a', '#7cc455', '#c07a88', '#a6dc7e']), leaf: r.chance(0.5) ? 'leafA' : 'leafB' }, { tier: 's' });
  // trolleys of crates in the cross aisle inside the glass, by the Lock
  for (const [x, z] of [[2.2, 22.0], [2.0, 19.0], [6.2, 4.0]]) trolley(s, x, z, r);
  // the light: a pink tube down every lane, in pieces, and a lower one along the glass so the Walk catches it
  for (let li = 0; li < LANES.length; li++) {
    runX(HALL.x0 + 2, HALL.x1 - 2, 48, (a, b) => s.light({ at: [a, 10, LANES[li]], to: [b, 10, LANES[li]], type: 'tube', color: C.pinkLight, power: 7, range: 10.5, radius: 0.5, clip: HALL_CLIP }));
  }
  runX(HALL.x0 + 2, HALL.x1 - 2, 48, (a, b) => s.light({ at: [a, 2.6, 1.2], to: [b, 2.6, 1.2], type: 'tube', color: C.pinkLight, power: 3.5, range: 6.5, radius: 0.3, clip: HALL_CLIP }));
}
function trolley(s, x, z, r) {
  const g = s.g;
  s.furniture(() => {
    g.mat('cast', '#2f5d5a'); g.box(x - 0.7, 0.18, z - 0.45, x + 0.7, 0.23, z + 0.45, { bevel: 0.01 });
    g.tube([[x - 0.7, 0.23, z - 0.45], [x - 0.8, 1.1, z - 0.45], [x - 0.8, 1.1, z + 0.45], [x - 0.7, 0.23, z + 0.45]], 0.02, { segs: 5 });
    g.mat('cast', C.dark); for (const sx of [-0.55, 0.55]) for (const sz of [-0.36, 0.36]) { g.push(); g.move(x + sx, 0.09, z + sz); g.rotX(PI / 2); g.cyl(0, -0.03, 0, 0.09, 0.06, { segs: 8 }); g.pop(); }
  });
  for (let k = 0; k < 4; k++) prop(s, 'keelgarden.crate', x + (k % 2 ? 0.32 : -0.32), 0.23 + Math.floor(k / 2) * 0.33, z, 0, { w: 0.6, d: 0.8, h: 0.3, lid: k > 1 || undefined, fill: k < 2 ? '#a6dc7e' : undefined });
  s.solid(x - 0.8, 0, z - 0.5, x + 0.75, 1.1, z + 0.5);
  void r;
}

// ---------------------------------------------------------------------------------------------------------------
// the Glass Walk: the visitors' gallery the length of the hall, z[-4, 0], the glass on one side and the rooms' doors on the other
// ---------------------------------------------------------------------------------------------------------------
function glassWalk(game, s, f, R, r) {
  const g = s.g, X0 = HALL.x0, X1 = HALL.x1, Z0 = GAL.z0;
  const clip = [X0 - 0.3, -0.3, Z0 - 0.3, X1 + 0.3, H, 0.3];
  floor(s, X0, Z0, X1, 0, 0, 'terrazzo', '#a89880');
  runX(X0, X1, 16, (a, b) => s.structure(() => { g.mat('terrazzo', '#6b4a3a'); g.box(a, 0, Z0 + 0.2, b, 0.004, Z0 + 0.5, { faces: 'Y' }); g.box(a, 0, -0.75, b, 0.004, -0.45, { faces: 'Y' }); }));
  ceiling(s, X0, Z0, X1, 0, H, 'panel', '#2a2830');
  // the outer wall: warm plaster to the rooms' height, dark panel above, the doors into the rooms
  const ops = DOORS.map((d) => ({ at: d[0], w: d[1], h: d[2] })).sort((p, q) => p.at - q.at);
  let x = X0;
  const piece = (u0, u1, op) => runX(u0, u1, 12, (a, b) => wall(s, a, Z0, b, Z0, 0, H, { mat: 'panel', tintA: '#3a3440', tintB: '#3a3440', dado: { h: 4.6, mat: 'plaster', tint: '#d4bf9c' }, skirt: '#4a3428', t: 0.3, openings: op ? [{ at: 0, w: b - a, h: op.h }] : undefined }));
  for (const op of ops) { if (op.at > x + 0.01) piece(x, op.at); piece(op.at, op.at + op.w, op); x = op.at + op.w; }
  if (x < X1 - 0.01) piece(x, X1);
  // a tile band and a picture rail at the top of the plaster
  runX(X0, X1, 12, (a, b) => s.structure(() => { g.mat('tile', '#2f6f73'); g.box(a, 4.45, Z0 + 0.15, b, 4.75, Z0 + 0.19, { faces: 'ZyY' }); g.mat('wood', '#5b4636'); g.box(a, 1.05, Z0 + 0.15, b, 1.12, Z0 + 0.2, { faces: 'ZY' }); }));
  // a line of small lamps along the top of the plaster and another high under the roof: they trace the curve
  runX(X0, X1, 8, (a, b) => s.structure(() => {
    g.mat('diffuser', '#ffc890', { emissive: 4 }); g.box(a + 3.9, 4.8, Z0 + 0.15, a + 4.1, 4.9, Z0 + 0.2, { faces: 'Zy' });
    g.mat('diffuser', '#ff8ac8', { emissive: 4 }); g.box(a + 3.85, H - 0.9, Z0 + 0.15, a + 4.15, H - 0.8, Z0 + 0.2, { faces: 'Zy' });
    g.mat('cast', '#2a2830'); g.box(a, H - 0.75, Z0 + 0.15, b, H - 0.65, Z0 + 0.3, { faces: 'ZyY' });
  }));
  // the far end closes over the far lobby's door
  s.structure(() => { g.mat('panel', '#3a3440'); g.box(X1, FAR.h, Z0, X1 + 0.3, H, 0, { faces: 'xX' }); });
  // the handrail along the glass, to lean on
  runX(X0 + 0.5, X1 - 0.5, 8, (a, b) => s.detail(() => {
    g.mat('cast', C.brass, { rough: -0.15 }); g.tube(lineX(a, b, 1.02, -0.32, 4), 0.025, { segs: 6, caps: false });
    g.mat('cast', '#2a2c30'); for (let xx = a + 1; xx < b; xx += 2) g.tube([[xx, 1.0, -0.32], [xx, 1.0, -0.12], [xx, 0.9, -0.1]], 0.012, { segs: 4 });
  }));
  // sconces on the outer wall: warm, so a visitor is lit pink on one side and lamp-yellow on the other
  for (let xx = 10; xx < X1; xx += 22) if (!DOORS.some((d) => xx > d[0] - 1 && xx < d[0] + d[1] + 1)) lamp(s, 'sconce', xx, 2.8, Z0 + 0.16, { face: 'Z', K: 2600, power: 1.3, range: 6, clip });
  s.ambient({ box: clip, sky: '#c0608a', ground: '#6a4038', power: 0.18, soft: 1.2, spec: 0.4, lamp: false });
  // benches facing the glass, herbs in pots beside them under their own small lamps
  for (const bx of [48, 128, 224, 318]) {
    prop(s, 'bench', bx, 0, Z0 + 0.95, 0, { w: 2.2, wood: '#7a5233', back: true });
    for (const dx of [-1.7, 1.7]) prop(s, 'plant', bx + dx, 0, Z0 + 0.45, 0, { kind: r.chance(0.5) ? 'fine' : 'fern', size: 0.7, pot: r.pick(['#a3563a', '#2f6f73', '#c9962e']) });
  }
  // the toast the first time you come out onto the Walk
  let seen = false;
  s.trigger({ box: [X0 + 0.5, -0.5, Z0, X0 + 7, 3, 0], onEnter(gm) { if (seen) return; seen = true; toast(gm, 'Five decks of racks, lit pink, running spinward until the floor carries them up out of sight.'); } });
  // boards on the outer wall, each with its interact
  const boards = [
    { x: 6, title: 'A square metre each', lines: ['Racks in Chervil|194 million m²', 'In the Greens|about 54,000 m²', 'Enough for|about 18 blocks', 'Share of calories|about 2 in 100', 'Share of food power|about 1 in 6'], who: 'A square metre each', say: [
      'Chervil keeps about a square metre of rack for every person in the drum: a hundred and ninety-four million square metres of trays, every one of them under a lamp.',
      'The Greens hold about fifty-four thousand of them. Six rows, two faces a row, twenty trays a face, three hundred and twenty metres long. That is a square metre each for about eighteen blocks.',
      'The Garden grows about two parts in a hundred of what the drum eats, and takes about a sixth of the power that feeds it. The light is the dear part.',
    ], disc: 'rack-metre' },
    { x: 66, title: 'Why the glass', lines: ['Air behind the glass|three times the CO₂', 'Leaves grow faster in it', 'Pickers change at the Lock', 'Nothing from the street|goes past it', 'Visitors stay on the Walk'], who: 'Why the glass', say: [
      'Behind the glass the air carries about three times the carbon dioxide of the streets. Leaves grow faster in it and waste less of the light. You would notice it yourself by the end of a shift.',
      'The glass keeps that air in, and keeps out whatever came down on your coat. Pickers change at the Lock and leave their own clothes on a peg.',
    ] },
    { x: 116, title: 'Nothing is sprayed', lines: ['No insect has ever lived|in Chervil', 'A blight is a mould,|a germ or a virus', 'A sick tray comes out whole', 'The bay is washed|and kept dark two days', 'Several kinds of each crop'], who: 'Nothing is sprayed', say: [
      'NOTHING IS SPRAYED. There is nothing to spray for. No insect has ever lived in Chervil, and nothing here eats a leaf but people.',
      'A blight in the Garden is a mould, a germ or a virus, and it comes in on hands, coats and water. When a tray shows it, the tray comes out whole, the bay is washed and kept dark for two days, and new seed goes in from the seed room.',
      'Every row grows several kinds of each crop, so a blight takes one kind of lettuce and never the salad.',
    ] },
    { x: 196, title: 'Their own night', lines: ['Lamps: red and blue', 'On eighteen hours in twenty-four', 'Most of them in the lamp-night,|when a kay buys most', 'White while a bay is picked'], who: 'Their own night', say: [
      'Every tray has its own lamp, red and blue, because that is the light a leaf uses. It is why the Greens are pink, and why the pickers look so strange in them.',
      'Plants want a night as well. Each row keeps its own: the lamps run eighteen hours in twenty-four, and as many of those as possible fall in the lamp-night, when power is cheapest.',
      'A picker switches a bay to white while they work it, to see what colour the leaves really are.',
    ] },
  ];
  for (const b of boards) {
    sign(s, { kind: 'board', title: b.title, lines: b.lines, palette: ['#22302c', '#f1e6c9', '#ff7ab8'] }, b.x, 1.85, Z0 + 0.17, { face: 'Z', w: 1.5, h: 1.0 });
    s.interact({ x: b.x, y: 1.4, z: Z0 + 0.9, radius: 1.5, prompt: 'Read the board: ' + b.title, onUse: async (gm) => { await say(gm, b.who, b.say); if (b.disc) find(gm, b.disc); } });
  }
  // lean on the rail: the view up the hall
  for (const lx of [24, 150, 260]) s.interact({ x: lx, y: 1.2, z: -0.6, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => {
    const hr = gm.clock ? gm.clock.hours : 12;
    await say(gm, 'The Glass Walk', [
      'The rows run spinward and the floor runs with them. A few hundred metres on, the racks have climbed so far that the far end of the hall is above the tops of the near ones, and past that it is behind the ceiling.',
      lx > 200 ? 'Look back the way you came and it is the same: the Packing Hall\'s white end is up there now, over the racks.' : 'Between the racks the lifts go up and down on their masts. A white bay is a bay being picked.',
      hr >= 23 || hr < 6.5 ? 'It is the lamp-night, and the Greens are at their brightest. Power is cheapest now, so this is when the Garden buys its light.' : 'Through the glass there is no sound at all, only the lamps\' hum on this side.',
    ]);
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// people in the Greens and on the Walk
// ---------------------------------------------------------------------------------------------------------------
function greensLife(game, s, f, r, lifts) {
  // pickers on the lifts, facing the rack they are picking
  for (const q of lifts) {
    const rz = ROWS[q.row].z, yaw = rz > q.z ? 0 : PI;
    s.spot('work', q.x + 0.25, q.h, q.z + (rz > q.z ? 0.12 : -0.12), yaw, { tags: ['crew', 'pick'] });
  }
  // pickers and crews on the floor, a few at the racks, porters at the belt, a sweeper
  for (let k = 0; k < 9; k++) {
    const li = r.i(0, LANES.length - 1), rows = laneRows(li), row = rows[r.i(0, rows.length - 1)], x = r.f(RX0 + 2, 90);
    const rz = ROWS[row].z, z = rz > LANES[li] ? rz - RACK_D - 0.45 : rz + RACK_D + 0.45;
    const sz = li === 3 ? (row === 2 ? STREET.z0 + 0.5 : STREET.z1 - 0.5) : z;
    s.spot('work', x, 0, sz, rz > sz ? 0 : PI, { tags: [k % 4 === 0 ? 'notes' : 'crew', 'pick'] });
  }
  for (const x of [9.2, 30, 62]) s.spot('work', x, 0, STREET.belt - 1.1, 0, { tags: ['porter'] });
  s.spot('work', 2.2, 0, 11.6, 0.8, { tags: ['sweep'] }); s.spot('work', 40, 0, 15.6, 2.4, { tags: ['sweep'] });
  // the walkways inside: the cross aisle by the glass, the street a little way, from the Lock
  s.path([[-2.5, 25], [1.5, 25], [4, 24], [4, 17], [4, 11], [4, 1], [6, 0.9]], { width: 1.2 });
  // the Walk: from the Packing Hall to the Green Tanks, with spurs into the rooms; and benches to sit on
  s.path([[-4, -2], [0, -2], [20, -2.1], [TOMATO.x0 + 12.6, -2], [40, -2.2], [TEA.x0 + 5.9, -2], [80, -2.1], [COOL.x0 + 3.7, -2], [120, -2], [TANKS.x0 + 5.2, -2]], { width: 2 });
  s.spot('stand', 24, 0, -0.75, 0, { tags: ['view'] }); s.spot('stand', 25.2, 0, -0.8, 0.3, { tags: ['view'] });
  s.spot('chat', 90.4, 0, -1.2, 1.2, { tags: ['view'] }); s.spot('chat', 91.6, 0, -1.4, -1.9, { tags: ['view'] });
  s.spot('stand', 150, 0, -0.75, 0, { tags: ['view'] });
}
