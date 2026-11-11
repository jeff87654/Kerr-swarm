// The Flour Hall: Chervil's vat halls in the Keel, deck 9, under Ring Five, at a full g near enough.
//
// One hall 340 m long, running spinward, so the floor and the rows of vats curve up ahead and behind until the far end
// is over your head. Twenty lines of eight thermophilic vats (sixty cubic metres each, at sixty-five degrees) make the
// drum's protein flour from methanol and air; their waste heat is the 65 degree loop that warms every bath and kitchen
// tap in the city. Line numbers skip a four. Line 9 is sealed and regrowing from library stock.
//
// Round it, smaller places (lm_keel_vats_rooms.js): the cab lobby at the anti end, the Pass (the desk and the board
// that watches every line), the Trimmings (the shift canteen, where the plant's seconds are eaten), Curd Row (the yeast
// dairy, behind glass), the seed room behind the blight door, and at the spinward end the Kettle, where the loop leaves
// for the city, with a second cab berth.
//
// Frame 'keel-vats': x spinward, z toward the back cap, y up. The hall is x[-170, 170] z[-16, 16], 11.6 m to the roof.
import { floor, ceiling, wall } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, C, LINE_COL, VAT_R, REGION, HALL, LINES, BLIGHT_LINE, LX0, LP, say, toast, tick, runX, lineX, glyphAtlas, glyphWord, glyphRing } from './lm_keel_vats_props.js';
import { buildRooms } from './lm_keel_vats_rooms.js';

const ROWS = [-11, -5, 5, 11];                      // vat rows across the hall (z)
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const HEAD_Y = 9.4;                                 // the header pipes over each row
const CAT_Y = 4.4, CAT_Z = 8, CAT_W = 0.75;         // the catwalks: deck height, centre line (z = ±8), half width

const ENV = { exposure: 1.0, autoKey: 0.17, bloom: 0.055, warmth: 0.07, contrast: 1.08, saturation: 1.1 };

export const place = {
  id: 'lm-keel-vats', name: 'The Flour Hall', order: 10,
  region: REGION,
  stops: [
    { id: 'keel-vats', name: 'The Flour Hall', sub: 'the vat halls · deck 9 · Ring Five', group: 'The Keel', spawn: 'keel-vats', deck: 9, zd: 1875 },
    { id: 'keel-vats-kettle', name: 'The Kettle', sub: 'the Flour Hall, spinward end · deck 9', group: 'The Keel', spawn: 'keel-vats-kettle', deck: 9, zd: 1875 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('keel-vats', deckRadius(9), 0.9, 1875);
    const s = W.scope('keel-vats', f);
    const R = glyphAtlas(game);
    const r = new Rng(9065);

    shell(s, R);
    await tick(game);
    for (let i = 0; i < LINES.length; i++) {
      line(s, i, R, r);
      if (i % 3 === 2) await tick(game);
    }
    catwalks(s);
    await tick(game);
    hallLife(game, s, f, r);
    await buildRooms(game, s, f, R, r);

    // the hall's zone and sound
    s.zoneBox({ id: 'keel-vats-hall', place: 'keel-vats', box: [HALL.x0, -0.5, -HALL.z, HALL.x1, HALL.h, HALL.z], name: 'The Flour Hall', sub: 'The Keel · deck 9 · Ring Five', ambience: 'station', reverb: 'station', headroom: 11, env: ENV });
    s.zoneBox({ id: 'keel-vats-catwalk', place: 'keel-vats', box: [HALL.x0, CAT_Y - 0.2, -HALL.z, HALL.x1, CAT_Y + 3, HALL.z], name: 'The Flour Hall', sub: 'The catwalks · over the vats', ambience: 'station', reverb: 'station', headroom: 6, env: ENV });
    for (let x = -150; x <= 150; x += 60) { s.loop('air', x, 9, 0, { vol: 0.32, radius: 40 }); s.loop('steam', x + 20, 8.5, -8, { vol: 0.16, radius: 18 }); }

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['keel-vats'] = { frame: f, x: -176.5, y: 0, z: 0.4, yaw: PI / 2 };
    game.spawns['keel-vats-kettle'] = { frame: f, x: 189.5, y: 0, z: 0, yaw: -PI / 2 };
    console.log('[lm-keel-vats] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the shell: floor, roof, long walls, the trunk mains of the loop along the walls
// ---------------------------------------------------------------------------------------------------------------
function shell(s, R) {
  const g = s.g, X0 = HALL.x0, X1 = HALL.x1, Z = HALL.z, H = HALL.h;
  // floor: wet concrete, a red quarry-tile aisle down the middle, yellow lines at the aisle edges, drains
  floor(s, X0, -Z, X1, Z, 0, 'concrete', '#8b8478', { matOpts: { rough: -0.25 } });
  runX(X0, X1, 14, (a, b, i) => {
    s.structure(() => {
      g.mat('tile', '#9a5a40', { rough: -0.3 }); g.box(a, 0, -2.6, b, 0.006, 2.6, { faces: 'Y' });
      g.mat('paint', C.warn, { rough: -0.2 }); for (const z of [-2.75, 2.75, -6.95, 6.95, -9.05, 9.05, -12.95, 12.95]) g.box(a, 0, z - 0.06, b, 0.008, z + 0.06, { faces: 'Y' });
      g.mat('cast', '#2c2a28'); g.box(a + 2, 0, -0.18, a + 3.2, 0.009, 0.18, { faces: 'Y' });
      if (i % 2) { g.mat('concrete', '#6e675d', { rough: -0.45 }); g.box(a + 5, 0, 3.4, a + 8.5, 0.007, 4.6, { faces: 'Y' }); g.box(b - 6, 0, -14.2, b - 3.5, 0.007, -13.2, { faces: 'Y' }); }
    });
  });
  // roof, with a dark band of panels
  ceiling(s, X0, -Z, X1, Z, H, 'panel', '#3b4446');
  // the long walls: glazed tile to 2.4 m, painted panels above; the openings are the rooms'
  const dado = { h: 2.4, mat: 'tile', tint: '#d8d0b4' };
  longWall(s, -Z, X0, X1, H, { mat: 'panel', tint: '#2f5d5a', dado, skirt: '#3a3430' }, HALL.southOpenings);
  longWall(s, Z, X0, X1, H, { mat: 'panel', tint: '#2f5d5a', dado, skirt: '#3a3430' }, HALL.northOpenings);
  // pilasters every line, and a band of cream paint at 2.4 m
  for (let x = X0; x <= X1 + 0.1; x += LP) for (const sz of [-1, 1]) {
    s.structure(() => {
      g.mat('panel', '#26484a'); g.box(x - 0.3, 0, sz * Z - sz * 0.45 - 0.0001, x + 0.3, H, sz * Z, { bevel: 0.02 });
      g.mat('cast', '#3d4245'); g.box(x - 0.36, 0, sz * Z - sz * 0.5, x + 0.36, 0.5, sz * Z, { bevel: 0.02 });
    });
  }
  runX(X0, X1, 14, (a, b) => s.structure(() => { g.mat('paint', '#e6dcc0'); for (const sz of [-1, 1]) g.box(a, 2.4, sz * Z - sz * 0.03, b, 2.5, sz * Z, { faces: sz > 0 ? 'zyY' : 'ZyY' }); }));
  // the loop's trunk mains along both walls: flow (red) over return (teal), lagged in canvas with coloured bands, on brackets
  for (const sz of [-1, 1]) {
    const zc = sz * (Z - 0.85);
    runX(X0, X1, 12, (a, b) => {
      s.structure(() => {
        g.mat('weave', '#e8dfc8'); g.tube(lineX(a, b, 6.9, zc, 4), 0.42, { segs: 14, caps: false }); g.tube(lineX(a, b, 5.9, zc, 4), 0.36, { segs: 14, caps: false });
        for (let x = a + 1.5; x < b; x += 6) { g.mat('paint', C.loop); g.tube([[x - 0.3, 6.9, zc], [x + 0.3, 6.9, zc]], 0.43, { segs: 14, caps: false }); g.mat('paint', C.ret); g.tube([[x - 0.3, 5.9, zc], [x + 0.3, 5.9, zc]], 0.37, { segs: 14, caps: false }); }
        g.mat('cast', '#3d4245'); for (let x = a + 0.4; x < b; x += 4) { g.box(x - 0.06, 5.4, sz * Z - sz * 0.05, x + 0.06, 7.45, zc - sz * 0.05); g.box(x - 0.06, 5.48, zc - 0.5, x + 0.06, 5.54, zc + 0.5); g.box(x - 0.06, 6.42, zc - 0.55, x + 0.06, 6.48, zc + 0.55); }
        // the methanol main, high and apart: purple, banded yellow
        g.mat('cast', C.meth); g.tube(lineX(a, b, 8.4, sz * (Z - 0.5), 4), 0.16, { segs: 10, caps: false });
        g.mat('paint', C.warn); for (let x = a + 1; x < b; x += 4) g.tube([[x - 0.08, 8.4, sz * (Z - 0.5)], [x + 0.08, 8.4, sz * (Z - 0.5)]], 0.17, { segs: 10, caps: false });
      });
    });
  }
  // the anti end wall over the rooms, and its painted name; the spinward end wall is the Kettle's (rooms)
  s.structure(() => { g.mat('panel', '#2f5d5a'); g.box(X0 - 0.2, HALL.roomH, -Z, X0, H, Z, { faces: 'X' }); });
  s.structure(() => { g.mat('panel', '#2f5d5a'); g.box(X1, 10.4, -Z, X1 + 0.2, H, Z, { faces: 'x' }); });
  sign(s, { kind: 'letters', text: 'The Flour Hall', palette: ['#f1e6c9'] }, X0 + 0.04, 7.2, 0, { face: 'X', w: 14, h: 2.2, glow: 1.1 });
  sign(s, { kind: 'letters', text: 'LINES 1 TO 21 · NO LINE 4', font: 'caps', palette: ['#d6a640'] }, X0 + 0.04, 5.3, 0, { face: 'X', w: 9, h: 0.6, glow: 0.9 });
  // the hall's own bounce light: warm, wet, coming off pale cladding
  s.ambient({ box: [X0, 0, -Z, X1, H, Z], sky: '#ffcf96', ground: '#9a6a48', power: 0.34, soft: 1.5, spec: 0.55, lamp: false });
}

// A wall along x at z = zc from a0 to a1, cut into pieces short enough to bend; openings [{ at (x), w, h, sill }] in frame x.
function longWall(s, zc, a0, a1, h, o, openings) {
  const ops = (openings || []).slice().sort((p, q) => p.at - q.at);
  let x = a0;
  const solid = (u0, u1) => runX(u0, u1, 12, (a, b) => wall(s, a, zc, b, zc, 0, h, o));
  for (const op of ops) {
    if (op.at > x + 0.01) solid(x, op.at);
    runX(op.at, op.at + op.w, 12, (a, b) => wall(s, a, zc, b, zc, 0, h, Object.assign({}, o, { openings: [{ at: 0, w: b - a, h: op.h, sill: op.sill || 0 }] })));
    x = op.at + op.w;
  }
  if (x < a1 - 0.01) solid(x, a1);
}

// ---------------------------------------------------------------------------------------------------------------
// one line: eight vats, their pipes, their numbers, the truss over them, the board that names the line, the lamps
// ---------------------------------------------------------------------------------------------------------------
function line(s, li, R, r) {
  const g = s.g, x0 = LX0 + LP * li, num = LINES[li], col = LINE_COL[li % LINE_COL.length], dark = num === BLIGHT_LINE;
  const vx = [x0 + 4, x0 + 12];
  // the vats
  for (let k = 0; k < 2; k++) for (let j = 0; j < ROWS.length; j++) {
    const z = ROWS[j], yaw = z < 0 ? 0 : PI;
    prop(s, 'keelvats.vat', vx[k], 0, z, yaw, { band: col, dark: dark || undefined }, { tint: [1 - r.f(0, 0.06), 1 - r.f(0, 0.06), 1 - r.f(0, 0.08)] });
    prop(s, 'keelvats.vatnear', vx[k], 0, z, yaw, {});
    // the number, painted on the band: line, dot, letter
    s.structure(() => { g.at(vx[k], 0, z, yaw); glyphRing(g, R, String(num) + '·' + LETTERS[k * 4 + j], 0, 5.6, VAT_R + 0.035, 0.36, 0.56); g.pop(); });
  }
  // the header pipes over each row, and the drops to each vat
  for (const z of ROWS) {
    s.structure(() => {
      const zs = z < 0 ? 1 : -1;
      g.mat('cast', C.loop, { rough: -0.1 }); g.tube(lineX(x0, x0 + LP, HEAD_Y, z - 0.6 * zs, 4), 0.2, { segs: 10, caps: false });
      g.mat('cast', C.ret, { rough: -0.1 }); g.tube(lineX(x0, x0 + LP, HEAD_Y, z, 4), 0.18, { segs: 10, caps: false });
      g.mat('cast', C.meth); g.tube(lineX(x0, x0 + LP, HEAD_Y + 0.35, z + 0.55 * zs, 4), 0.09, { segs: 8, caps: false });
      g.mat('brushed', C.air); g.tube(lineX(x0, x0 + LP, HEAD_Y + 0.3, z + 0.95 * zs, 4), 0.12, { segs: 8, caps: false });
      // hangers from the roof
      g.mat('cast', '#3d4245'); for (const x of [x0 + 2, x0 + 10]) { g.box(x - 0.03, HEAD_Y - 0.28, z - 1.3, x + 0.03, HEAD_Y - 0.22, z + 1.3); for (const dz of [-1.25, 1.25]) g.box(x - 0.025, HEAD_Y - 0.28, z + dz - 0.025, x + 0.025, HALL.h, z + dz + 0.025); }
    });
    s.deco(() => {
      const zs = z < 0 ? 1 : -1;
      g.mat('cast', C.strap); for (const x of [x0 + 0.1, x0 + 8]) { g.tube([[x - 0.05, HEAD_Y, z - 0.6 * zs], [x + 0.05, HEAD_Y, z - 0.6 * zs]], 0.26, { segs: 10, caps: false }); g.tube([[x - 0.05, HEAD_Y, z], [x + 0.05, HEAD_Y, z]], 0.24, { segs: 10, caps: false }); }
      for (const x of vx) {
        // flow and return down into the vat's jacket, a methanol line to the manway side, air to the sparger
        g.mat('cast', C.loop); g.tube([[x - 0.9, HEAD_Y, z - 0.6 * zs], [x - 0.9, 7.3, z - 0.6 * zs], [x - 0.9, 6.9, z - 1.1 * zs]], 0.08, { segs: 6 });
        g.mat('cast', C.ret); g.tube([[x + 0.9, HEAD_Y, z], [x + 0.9, 7.25, z], [x + 1.3, 6.9, z]], 0.075, { segs: 6 });
        g.mat('cast', C.meth); g.tube([[x + 0.3, HEAD_Y + 0.35, z + 0.55 * zs], [x + 0.3, 7.35, z + 0.55 * zs]], 0.045, { segs: 5 });
        g.mat('paint', C.warn); g.tube([[x + 0.3, 8.2, z + 0.55 * zs], [x + 0.3, 8.32, z + 0.55 * zs]], 0.052, { segs: 5, caps: false });
        g.mat('brushed', C.air); g.tube([[x - 0.3, HEAD_Y + 0.3, z + 0.95 * zs], [x - 0.3, 7.25, z + 0.95 * zs]], 0.05, { segs: 5 });
      }
    });
  }
  // a truss across the hall at each end of the line, and a cable tray
  for (const x of [x0, x0 + 8]) {
    s.structure(() => {
      g.mat('cast', '#36403f');
      g.box(x - 0.12, HALL.h - 0.35, -HALL.z, x + 0.12, HALL.h, HALL.z); g.box(x - 0.1, 10.0, -HALL.z, x + 0.1, 10.2, HALL.z);
      for (let z = -HALL.z; z < HALL.z - 0.1; z += 2) { g.tube([[x, 10.1, z], [x, HALL.h - 0.2, z + 1]], 0.035, { segs: 4, caps: false }); g.tube([[x, HALL.h - 0.2, z + 1], [x, 10.1, z + 2]], 0.035, { segs: 4, caps: false }); }
    });
  }
  s.structure(() => { g.mat('cast', '#4a4f50'); for (const z of [-2.2, 2.2]) { g.box(x0, 10.0, z - 0.25, x0 + LP, 10.04, z + 0.25); g.box(x0, 10.04, z - 0.25, x0 + LP, 10.14, z - 0.23); g.box(x0, 10.04, z + 0.23, x0 + LP, 10.14, z + 0.25); } g.mat('weave', '#2a2622'); for (const z of [-2.2, 2.2]) g.box(x0, 10.04, z - 0.18, x0 + LP, 10.1, z + 0.15); });
  // the line's board, hanging over the edge of the middle aisle (off the centre line, so the far end shows down the middle):
  // the number big, both faces, a stripe of the line's colour
  const bx = x0 + 8, bz = li % 2 ? -3.3 : 3.3;
  s.structure(() => {
    g.mat('cast', '#2c3133'); for (const dz of [-0.55, 0.55]) g.tube([[bx, 10.0, bz + dz], [bx, 8.15, bz + dz]], 0.018, { segs: 4 });
    g.mat('paint', '#7a2a26'); g.box(bx - 0.04, 6.95, bz - 0.78, bx + 0.04, 8.15, bz + 0.78, { bevel: 0.015 });
    g.mat('paint', col); g.box(bx - 0.045, 6.95, bz - 0.78, bx + 0.045, 7.12, bz + 0.78);
    const txt = String(num);
    for (const face of [1, -1]) { g.push(); g.move(bx, 0, bz); g.rotY(face * PI / 2); glyphWord(g, R, txt, 1, 7.62, 0.046, 0.62, 0.92); g.pop(); }
    g.mat('diffuser', dark ? '#ff5040' : '#7fe08a', { emissive: 3 }); g.box(bx - 0.05, 6.82, bz - 0.08, bx + 0.05, 6.94, bz + 0.08);
  });
  // lamps: green enamel pendants over the middle aisle and over each catwalk, and the light they give
  for (const x of vx) prop(s, 'keelvats.pendant', x, 10.0, 0, 0, { drop: 1.1 });
  for (const sz of [-1, 1]) prop(s, 'keelvats.pendant', x0 + 8, 10.0, sz * CAT_Z, 0, { drop: 2.4 });
  s.light({ at: [vx[0], 8.5, 0], to: [vx[1], 8.5, 0], type: 'tube', color: [1.0, 0.72, 0.42], power: 26, range: 15, radius: 0.3, shadow: true, clip: HALL.clip });
  for (const sz of [-1, 1]) s.light({ at: [x0 + 8, 7.3, sz * CAT_Z], color: [1.0, 0.7, 0.4], power: 15, range: 11, radius: 0.2, shadow: true, clip: HALL.clip });
  // steam off the running vats' vents, caught in the lamplight
  if (!dark) {
    for (const x of vx) for (const z of ROWS) {
      if (r.chance(0.35)) continue;
      const yaw = z < 0 ? 0 : PI, c = Math.cos(yaw), sn = Math.sin(yaw);
      const sx = x + (c * -0.8 + sn * -0.35), sz = z + (-sn * -0.8 + c * -0.35);
      const k = r.f(0.7, 1.2);
      s.glowCard(sx, 9.2, sz, { face: 'Z', color: '#fff0dc', size: 1.8 * k, strength: 0.05, follow: 'always' });
      s.glowCard(sx + 0.1, 9.9, sz, { face: 'X', color: '#fff0dc', size: 2.4 * k, strength: 0.035, follow: 'always' });
    }
  }
  // Line 9 is sealed: yellow and black rope round its vats, its board red, a notice stand in the aisle
  if (dark) {
    for (const x of vx) for (const z of ROWS) {
      s.detail(() => {
        const pts = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * PI * 2; pts.push([x + Math.sin(a) * (VAT_R + 0.7), 0.95, z + Math.cos(a) * (VAT_R + 0.7)]); }
        for (let i = 0; i < 16; i++) { g.mat('paint', i % 2 ? C.warn : '#262220'); g.tube([pts[i], pts[i + 1]], 0.02, { segs: 4, caps: false }); }
        g.mat('cast', '#3a3430'); for (let i = 0; i < 16; i += 4) g.tube([[pts[i][0], 0, pts[i][2]], [pts[i][0], 1.0, pts[i][2]]], 0.025, { segs: 5 });
      });
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the catwalks: steel grating at y = 4.4 over the side aisles, the length of the hall, with stairs at both ends
// ---------------------------------------------------------------------------------------------------------------
function catwalks(s) {
  const g = s.g, a0 = -161.5, a1 = 161.5, y = CAT_Y;
  for (const sz of [-1, 1]) {
    const zc = sz * CAT_Z, z0 = zc - CAT_W, z1 = zc + CAT_W;
    runX(a0, a1, 8, (a, b, i) => {
      s.structure(() => {
        g.mat('grille', '#6a6a62'); g.box(a, y - 0.04, z0, b, y, z1, { faces: 'Yy' });
        g.mat('cast', '#36403f'); g.box(a, y - 0.22, z0 - 0.06, b, y + 0.12, z0); g.box(a, y - 0.22, z1, b, y + 0.12, z1 + 0.06);
        for (let x = a; x < b - 0.1; x += 1.6) g.box(x - 0.03, y - 0.2, z0, x + 0.03, y - 0.04, z1);
        // the rails: posts, a top rail, a knee rail
        for (const zr of [z0 - 0.03, z1 + 0.03]) {
          for (let x = a; x < b - 0.1; x += 2) g.tube([[x, y + 0.1, zr], [x, y + 1.08, zr]], 0.022, { segs: 5 });
          g.mat('cast', C.warn, { rough: -0.1 }); g.tube(lineX(a, b, y + 1.08, zr, 4), 0.03, { segs: 6, caps: false });
          g.mat('cast', '#36403f'); g.tube(lineX(a, b, y + 0.55, zr, 4), 0.016, { segs: 5, caps: false });
        }
        // a hanger rod up to the roof every other piece
        if (i % 2 === 0) for (const zr of [z0 - 0.06, z1 + 0.06]) g.tube([[a + 0.5, y + 0.12, zr], [a + 0.5, HALL.h - 0.4, zr]], 0.02, { segs: 4 });
      });
      s.solid(a, y - 0.25, z0, b, y, z1, { surf: 'metal' });
      s.solid(a, y, z0 - 0.08, b, y + 1.1, z0 - 0.01); s.solid(a, y, z1 + 0.01, b, y + 1.1, z1 + 0.08);
    });
    // stairs at each end: from the floor in the side aisle up to the catwalk
    stairFlight(s, -167.5, zc, 'X', y, 6);
    stairFlight(s, 167.5, zc, 'x', y, 6);
  }
}
function stairFlight(s, x, zc, dir, rise, run) {
  const g = s.g, n = Math.round(rise / 0.18), sr = rise / n, st = run / n, sg = dir === 'X' ? 1 : -1, w = CAT_W * 2;
  s.structure(() => {
    for (let i = 0; i < n; i++) {
      const u0 = x + sg * i * st, u1 = x + sg * (i + 1) * st, yt = (i + 1) * sr;
      g.mat('grille', '#6a6a62'); g.box(Math.min(u0, u1), yt - 0.04, zc - w / 2, Math.max(u0, u1), yt, zc + w / 2, { faces: 'Yy' });
      g.mat('cast', C.warn); g.box(Math.min(u0, u1) + (sg > 0 ? 0 : st - 0.04), yt - 0.04, zc - w / 2, Math.min(u0, u1) + (sg > 0 ? 0.04 : st), yt + 0.002, zc + w / 2, { faces: 'Y' });
    }
    g.mat('cast', '#36403f');
    for (const dz of [-w / 2 - 0.05, w / 2 + 0.05]) {
      g.tube([[x, 0, zc + dz], [x + sg * run, rise, zc + dz]], 0.06, { segs: 5 });
      g.tube([[x, 1.0, zc + dz], [x + sg * run, rise + 1.05, zc + dz]], 0.028, { segs: 6 });
      for (let k = 1; k < 4; k++) { const t = k / 4; g.tube([[x + sg * run * t, rise * t, zc + dz], [x + sg * run * t, rise * t + 1.02, zc + dz]], 0.02, { segs: 4 }); }
    }
  });
  s.ramp(Math.min(x, x + sg * run), zc - w / 2, Math.max(x, x + sg * run), zc + w / 2, sg > 0 ? 0 : rise, sg > 0 ? rise : 0, 'x', { surf: 'metal' });
  for (const dz of [-w / 2 - 0.08, w / 2 + 0.01]) s.solid(Math.min(x, x + sg * run), 0, zc + dz, Math.max(x, x + sg * run), rise + 1.1, zc + dz + 0.07);
}

// ---------------------------------------------------------------------------------------------------------------
// people and things to do in the hall
// ---------------------------------------------------------------------------------------------------------------
function hallLife(game, s, f, r) {
  const X0 = HALL.x0, X1 = HALL.x1;
  // walkways: the middle aisle end to end, the side aisles under the catwalks, the strips by the walls, the cross gaps
  // (kept sparse: the people who come to a place are counted from its walkways, and a vat hall is a quiet place)
  const EX = 168.6;
  const mid = [[-EX, 0]]; for (let x = LX0; x <= -LX0 + 0.01; x += LP) mid.push([x, 0]); mid.push([EX, 0]); s.path(mid, { width: 2 });
  for (let i = 0; i <= LINES.length; i += 2) { const x = LX0 + LP * i; s.path([[x, -8.7], [x, 0], [x, 8.7]]); }
  s.path([[EX, 0], [EX, 8]]); s.path([[-EX, 0], [-EX, 8]]);
  // catwalks and their stairs
  for (const sz of [1]) {
    const zc = sz * CAT_Z;
    s.path([[-EX, 0, zc], [-167.5, 0, zc], [-161.5, CAT_Y, zc], [-140, CAT_Y, zc], [-100, CAT_Y, zc], [-60, CAT_Y, zc], [-20, CAT_Y, zc], [20, CAT_Y, zc], [60, CAT_Y, zc], [100, CAT_Y, zc], [140, CAT_Y, zc], [161.5, CAT_Y, zc], [167.5, 0, zc], [EX, 0, zc]], { width: 1.2 });
    for (let x = -150; x <= 150; x += 50) s.spot('stand', x + r.f(-2, 2), CAT_Y, zc + sz * 0.35, sz > 0 ? PI : 0, { tags: ['crew', 'rail'] });
  }
  // at the vats: crews reading sight glasses and gauges, writing up the line
  for (let i = 0; i < LINES.length; i++) {
    const x0 = LX0 + LP * i, dark = LINES[i] === BLIGHT_LINE;
    for (let n = 0; n < 2; n++) {
      const x = x0 + (r.chance(0.5) ? 4 : 12), z = ROWS[r.i(0, 3)], face = z < 0 ? 1 : -1;
      const sz = z + face * (VAT_R + 0.55);
      s.spot('work', x + r.f(-0.2, 0.3), 0, sz, z < 0 ? PI : 0, { tags: [n === 0 ? 'notes' : 'crew', 'vats'] });
    }
    if (i % 3 === 1) { const z = r.chance(0.5) ? -13.6 : 13.6; prop(s, 'keelvats.trolley', x0 + 8, 0, z, PI / 2, { sacks: r.i(2, 6) }); s.spot('work', x0 + 6.9, 0, z, PI / 2, { tags: ['porter'] }); const sg = Math.sign(z); s.path([[x0, 0], [x0, sg * 8.7], [x0 + 8, sg * 8.7], [x0 + 8, sg * 12.4], [x0 + 6.6, sg * 12.9]]); }
    if (i % 4 === 2) s.spot('work', x0 + 8 + r.f(-1, 1), 0, r.chance(0.5) ? -1.4 : 1.4, r.f(0, 6), { tags: ['sweep'] });
    if (dark) { s.spot('work', x0 + 8, 0, -3.2, PI, { tags: ['notes'] }); s.spot('chat', x0 + 7.4, 0, 3.4, 2.3, { tags: ['blight'] }); s.spot('chat', x0 + 8.5, 0, 3.5, -2.3, { tags: ['blight'] }); }
  }
  // read a vat: the plate on the band, the sight glass
  const vatTalk = [
    [LINES.indexOf(1), 0, -5, 'Line 1, vat B'],
    [LINES.indexOf(12), 1, 5, 'Line 12, vat G'],
    [LINES.indexOf(17), 0, -11, 'Line 17, vat A'],
  ];
  for (const v of vatTalk) {
    const x = LX0 + LP * v[0] + (v[1] ? 12 : 4), z = v[2], face = z < 0 ? 1 : -1;
    s.interact({ x, y: 2.6, z: z + face * (VAT_R + 0.1), radius: 1.6, prompt: 'Look in the sight glass', onUse: async (gm) => {
      await say(gm, v[3], [
        'A slot of thick glass in a brass frame. Behind it the broth is the colour of weak tea, and it is moving all the time: air comes up through it from the bottom in a fine boil of bubbles.',
        'The plate under the glass: Methylotroph, thermophilic. Sixty-five degrees. Feed: methanol and air. Out: protein flour. Sixty cubic metres.',
        'Chervil keeps about twenty litres of vat for every person, of every kind. One vat like this is a block of three thousand, near enough.',
      ]);
    } });
  }
  // the methanol manifold at the anti end: a drop from the main to a valve station, and the rules about it
  s.furniture((g) => {
    const mx = X0 + 3.2, mz = -HALL.z + 0.45;
    g.mat('cast', C.meth); g.tube([[mx - 0.9, 8.4, -HALL.z + 0.5], [mx - 0.9, 1.2, mz]], 0.09, { segs: 8 }); g.tube([[mx - 0.9, 1.2, mz], [mx + 0.9, 1.2, mz]], 0.09, { segs: 8 });
    g.mat('paint', C.warn); for (const y of [2.2, 4.2, 6.2]) g.tube([[mx - 0.9, y, mz], [mx - 0.9, y + 0.14, mz]], 0.1, { segs: 8, caps: false });
    for (const x of [mx - 0.4, mx + 0.1, mx + 0.6]) { g.mat('cast', C.meth); g.tube([[x, 1.2, mz], [x, 1.2, mz + 0.3]], 0.04, { segs: 6 }); g.mat('cast', C.warn); g.push(); g.move(x, 1.2, mz + 0.32); g.rotX(PI / 2); g.lathe(0, 0, [[0.12, -0.01], [0.13, 0], [0.12, 0.01]], { segs: 14, capTop: false, capBottom: false }); g.pop(); }
    g.mat('paint', C.warn); g.box(mx - 1.6, 0, -HALL.z + 1.4, mx + 1.6, 0.01, -HALL.z + 1.52, { faces: 'Y' });
  });
  sign(s, { kind: 'board', title: 'Methanol', lines: ['The main food feedstock|0.8 kg a head a day', 'A dozen lethal doses|in every litre', 'No cups, flasks or bottles|past the yellow line', 'Nothing is decanted here|by anyone, ever'], palette: ['#3f2c44', '#f3e6c8', '#d6a640'] }, X0 + 3.2, 2.35, -HALL.z + 0.1, { face: 'Z', w: 1.5, h: 0.95 });
  s.interact({ x: X0 + 3.2, y: 1.4, z: -HALL.z + 1.0, radius: 1.8, prompt: 'Read the purple notice', onUse: async (gm) => {
    await say(gm, 'Purple pipes, yellow bands', [
      'METHANOL. The main food feedstock: about eight hundred grams a person a day comes through these mains, and every litre of it is a dozen lethal doses.',
      'It looks like water and smells like gin, and it is neither. No cups, flasks or bottles past the yellow line. Nothing is ever decanted here, by anyone, for any reason.',
      'Gin is sold only in the halls after six, with thiamine in it, where someone is always cooking. Chervil\'s methanol deaths are among the lowest on Herb Row. The crews would like to keep them there.',
    ]);
  } });
  // the notice stand at Line 9
  const bx = LX0 + LP * LINES.indexOf(BLIGHT_LINE) + 8;
  s.interact({ x: bx, y: 1.2, z: -2.2, radius: 1.6, prompt: 'Read the notice on Line 9', onUse: async (gm) => {
    await say(gm, 'Line 9 · sealed', [
      'LINE 9 SEALED. A phage got into the line eleven days ago. All eight vats were drained and steamed, and they are being steamed again.',
      'The line regrows from library stock behind the blight door: a vial to a flask to a seed vat to these, about twenty-seven doublings. Three days once the vats are clean. The cleaning is the slow part.',
      'Until then the Mill carries Line 9\'s share, and the flour halls it feeds eat the blight menu: free amino acids where the flour would be. A blight takes one line, never the dinner.',
    ]);
  } });
  s.detail((g) => {
    g.mat('cast', '#3a3430'); g.cyl(bx, 0, -2.2, 0.22, 0.04, { segs: 12 }); g.tube([[bx, 0, -2.2], [bx, 1.3, -2.2]], 0.025, { segs: 5 });
    g.mat('paint', C.warn); g.box(bx - 0.36, 1.05, -2.25, bx + 0.36, 1.6, -2.2, { bevel: 0.01 });
  });
  sign(s, { kind: 'notice', title: 'Line 9 sealed', lines: ['Phage found: eleven days ago', 'Vats drained and steamed', 'Regrowing from library stock', 'behind the blight door', 'Mill carries the line', 'Blight menu in the halls it feeds'] }, bx, 1.33, -2.18, { face: 'Z', w: 0.62, h: 0.5 });
  // lean on a catwalk rail: the view up the hall
  for (const x of [-120, 0, 110]) s.interact({ x, y: CAT_Y + 1.2, z: CAT_Z - CAT_W + 0.05, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => {
    const h = gm.clock ? gm.clock.hours : 12;
    await say(gm, 'The catwalk', [
      'From up here the hall is a street of vats, and the street climbs. Both ways the rows of lagged drums and the lines of lamps tilt up with the floor until the far end of the hall hangs over the vat tops.',
      h >= 23 || h < 6.5 ? 'The lamp-night belongs to the machines: the hall runs the same at three in the morning as at noon, with half the crew and all of the steam.' : 'It is warm up here. Everything under your hands is at sixty-five degrees somewhere, and the heat goes up the loop to the city.',
    ]);
  } });
  // a toast the first time you come out onto the hall floor
  let seen = false;
  s.trigger({ box: [X0 + 0.5, -0.5, -4.5, X0 + 6, 3, 4.5], onEnter(gm) { if (seen) return; seen = true; toast(gm, 'Twenty lines of vats, curving up with the drum. The far end is over your head.'); } });
}
