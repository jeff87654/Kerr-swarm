// The Spice Rack: the climbing shaft of lm_chimney.js. Fourteen metres square and eight decks tall (decks 40 to 47,
// y 0 to 32), with routes of coloured holds on its back and spinward walls, galleries with rails on the other two sides
// at every deck, a bridge across the top, a lamp ceiling, and on the floor a thick mat whose painted target is laid anti
// of the routes, because everything that falls here lands anti.
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { SH, GO, NG, BR, CORE, PAL, ROUTE_COLS, SUB, toast, sfx, say, choose, read, find, seat, frameWait, movable } from './lm_chimney_parts.js';
import { R0, G0, MAT_TOP, driftFrom, fallTime, gOfDeck, cm, f2, D0 } from './lm_chimney_phys.js';

const PI = Math.PI;
// one colour for each deck's gallery: its fascia, its dado, its number
const DECK_COL = ['#2f7d7a', '#c8452e', '#d9a23a', '#34417a', '#4f8a52', '#6b3d5e', '#2f97b4', '#b0502c'];
// the routes: on the back wall (side 'b', at x) and the spinward wall (side 's', at z)
const ROUTES = [
  { side: 'b', at: -5.4, name: 'Brine', grade: '4', col: 0 },
  { side: 'b', at: -3.0, name: 'Long Ladle', grade: '5', col: 1 },
  { side: 'b', at: -0.6, name: 'Gin After Six', grade: '6a', col: 2 },
  { side: 'b', at: 1.9, name: 'The Bridge', grade: '6b', col: 3 },
  { side: 'b', at: 5.2, name: 'Second Helping', grade: '5', col: 4 },
  { side: 's', at: -5.0, name: 'Lid On', grade: '4', col: 5 },
  { side: 's', at: -2.4, name: 'Thursday Ramen', grade: '6a', col: 6 },
  { side: 's', at: 0.4, name: 'The Nine', grade: '7a', col: 7 },
  { side: 's', at: 3.2, name: 'Aunts', grade: '5', col: 8 },
];
// where the chalk bag is let go (over the bridge's anti rail) and where it lands
const XB0 = BR.x - BR.w / 2, XB1 = BR.x + BR.w / 2;
export const DROP = { x: XB0 - 0.2, y: 4 * BR.k + 1.15, z: 4.6 };
export const TARGET = { x: DROP.x - driftFrom(DROP.y), z: DROP.z };

// a point on a route's wall: u along the wall, y up, out (metres off the face) -> [x, y, z]
function onWall(side, u, y, out) { return side === 'b' ? [u, y, SH.z1 - out] : [SH.x1 - out, y, u]; }

export async function buildRack(game, s) {
  const f = s.frame;
  shell(game, s); await frameWait(game);
  walls(game, s); await frameWait(game);
  holds(game, s); await frameWait(game);
  for (let k = 1; k <= NG; k++) { gallery(game, s, k); if (k % 2 === 0) await frameWait(game); }
  bridge(game, s); await frameWait(game);
  mat(game, s);
  climbers(game, s); await frameWait(game);
  lights(game, s);
  chalkDrop(game, s);
  stairDoors(game, s);
  ground(game, s);
  s.zoneBox({ id: 'chimney-rack', place: 'chimney', box: [-7, -0.5, -7, 7, SH.top, 7], name: 'The Spice Rack', sub: 'the climbing shaft · ' + SUB, ambience: 'school', reverb: 'hall', sky: true, headroom: 30 });
  s.loop('murmur', 0, 2, 0, { vol: 0.35, radius: 30, param: 0.4 });
  s.loop('air', 0, 30, 0, { vol: 0.25, radius: 22 });
  void f;
}

// ---------------------------------------------------------------------------------------------------------------
// the floor, the ceiling and the lamp ceiling over the shaft
// ---------------------------------------------------------------------------------------------------------------
function shell(game, s) {
  const g = s.g;
  floor(s, GO.x, GO.z, SH.x1, SH.z1, 0, 'terrazzo', '#c9b99a');
  // the ceiling of the top gallery, and the lamp ceiling over the shaft: a grid of lit panels in a deep coffer
  ceiling(s, GO.x, GO.z, SH.x1, SH.z1, SH.top, 'paint', '#e6dcc8', { level: NG });
  const N = 4, cw = (SH.x1 - SH.x0) / N;
  s.structure((gg) => {
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const xa = SH.x0 + i * cw + 0.18, xb = SH.x0 + (i + 1) * cw - 0.18, za = SH.z0 + j * cw + 0.18, zb = SH.z0 + (j + 1) * cw - 0.18;
      gg.mat('paint', '#d8ccb4'); gg.box(xa - 0.18, SH.top - 0.55, za - 0.18, xb + 0.18, SH.top - 0.001, zb + 0.18, { faces: 'xXzZ' });
      gg.mat('diffuser', '#fff3dc', { emissive: 3.4, lamp: true }); gg.box(xa, SH.top - 0.5, za, xb, SH.top - 0.48, zb, { faces: 'y' });
    }
    // the beams between the coffers, painted teal, with the anchors for the ropes along the walls
    gg.mat('paint', PAL.teal);
    for (let i = 0; i <= N; i++) { const x = SH.x0 + i * cw; gg.box(x - 0.16, SH.top - 0.62, SH.z0, x + 0.16, SH.top - 0.01, SH.z1, { faces: 'xXy' }); }
    for (let j = 0; j <= N; j++) { const z = SH.z0 + j * cw; gg.box(SH.x0, SH.top - 0.62, z - 0.16, SH.x1, SH.top - 0.01, z + 0.16, { faces: 'zZy' }); }
  }, NG);
  // a ring of ducts round the top
  s.deco((gg) => {
    gg.mat('brushed', '#9aa09a');
    gg.tube([[GO.x + 0.4, SH.top - 0.4, GO.z + 0.4], [SH.x1 - 0.4, SH.top - 0.4, GO.z + 0.4]], 0.18, { segs: 10 });
    gg.tube([[GO.x + 0.4, SH.top - 0.4, GO.z + 0.4], [GO.x + 0.4, SH.top - 0.4, SH.z1 - 0.4]], 0.18, { segs: 10 });
    gg.mat('cast', '#3d4a45'); for (let x = GO.x + 2; x < SH.x1; x += 3) gg.tube([[x, SH.top - 0.4, GO.z + 0.4], [x, SH.top, GO.z + 0.4]], 0.03, { segs: 5 });
  }, NG);
}

// ---------------------------------------------------------------------------------------------------------------
// the two climbing walls: plywood panels painted in broad bands, bolt-on volumes, the route tapes at the foot
// ---------------------------------------------------------------------------------------------------------------
function walls(game, s) {
  const g = s.g, r = new Rng(4040);
  // the walls' bodies, full height, and their ends where the galleries meet them
  wall(s, GO.x, SH.z1 + 0.18, SH.x1 + 0.36, SH.z1 + 0.18, 0, SH.top, { t: 0.36, tint: PAL.plaster, skirt: false });
  wall(s, SH.x1 + 0.18, GO.z, SH.x1 + 0.18, SH.z1, 0, SH.top, { t: 0.36, tint: PAL.plaster, skirt: false });
  // painted gallery ends: each deck's colour band and a darker dado
  for (let k = 0; k <= NG; k++) {
    const y0 = 4 * k, c = DECK_COL[k];
    s.structure((gg) => {
      gg.mat('paint', shadeHex(c, 0.9)); gg.box(GO.x, y0, SH.z1 - 0.01, SH.x0, y0 + 1.1, SH.z1, { faces: 'z' }); gg.box(SH.x1 - 0.01, y0, GO.z, SH.x1, y0 + 1.1, SH.z0, { faces: 'x' });
      gg.mat('paint', mixHex(PAL.cream, c, 0.12)); gg.box(GO.x, y0 + 1.1, SH.z1 - 0.008, SH.x0, y0 + 4, SH.z1, { faces: 'z' }); gg.box(SH.x1 - 0.008, y0 + 1.1, GO.z, SH.x1, y0 + 4, SH.z0, { faces: 'x' });
    }, k);
  }
  // the panels: 1.22 m plywood in broad diagonal bands of colour; the seams show as the dark wall behind
  const bands = ['#cdb48a', '#d8c4a0', '#9fb7b0', '#cdb48a', '#e0b56a', '#cdb48a', '#a9a3c4', '#d6c2a0', '#c99f84'];
  const P = 1.22;
  for (const side of ['b', 's']) {
    for (let j = 0; j * P < SH.top - 0.6; j++) {
      const y0 = j * P + 0.01, y1 = Math.min(SH.top - 0.62, (j + 1) * P - 0.01);
      for (let i = 0; i * P < 14 - 0.01; i++) {
        const u0 = -7 + i * P + 0.01, u1 = Math.min(7, -7 + (i + 1) * P) - 0.01;
        const band = Math.floor((i * 0.7 + j * 1.0 + (side === 'b' ? 0 : 3)) / 3.2);
        const c = shadeHex(bands[((band % bands.length) + bands.length) % bands.length], r.f(0.93, 1.05));
        g.mat(r.chance(0.82) ? 'wood' : 'paint', c, { rough: 0.15 });
        if (side === 'b') g.box(u0, y0, SH.z1 - 0.035, u1, y1, SH.z1, { faces: 'z' });
        else g.box(SH.x1 - 0.035, y0, u0, SH.x1, y1, u1, { faces: 'x' });
      }
      s.flush({ tier: 's', cast: false, level: Math.min(NG, Math.floor(j * P / 4)) });
    }
  }
  // the seams behind the panels: a dark backing
  s.structure((gg) => { gg.mat('paint', '#3a3430'); gg.box(SH.x0, 0, SH.z1 - 0.02, SH.x1, SH.top - 0.6, SH.z1 - 0.019, { faces: 'z' }); gg.box(SH.x1 - 0.02, 0, SH.z0, SH.x1 - 0.019, SH.top - 0.6, SH.z1, { faces: 'x' }); });
  // bolt-on volumes: big flat-faced blocks painted in the wall's strong colours
  const vols = [['b', -4.2, 9.5, 1.6, 1.2, 0.45, '#2f7d7a'], ['b', 0.6, 14, 2.2, 1.4, 0.55, '#c8452e'], ['b', 3.9, 6.5, 1.4, 1.8, 0.4, '#34417a'], ['b', -1.8, 22.5, 1.8, 1.1, 0.5, '#d9a23a'], ['b', 4.4, 26, 1.6, 1.2, 0.45, '#6b3d5e'],
    ['s', -3.6, 12, 1.6, 1.4, 0.5, '#d9a23a'], ['s', 1.8, 17.5, 2.0, 1.2, 0.55, '#2f7d7a'], ['s', -1.0, 5.2, 1.3, 1.0, 0.4, '#c8452e'], ['s', 4.4, 23, 1.4, 1.6, 0.45, '#34417a'], ['s', -4.8, 27, 1.5, 1.1, 0.5, '#4f8a52']];
  for (const v of vols) {
    const [side, u, y, w, h, d, c] = v;
    s.furniture((gg) => {
      gg.mat('paint', c, { rough: 0.2 });
      const at = onWall(side, u, y, 0.035);
      gg.at(at[0], at[1], at[2], side === 'b' ? 0 : PI / 2); gg.rotX(-PI / 2);
      // a trapezoid face, pulled out from the wall
      gg.prism([[-w / 2, -h / 2], [w / 2, -h / 2], [w * 0.32, h / 2], [-w * 0.32, h / 2]], 0, d);
      gg.pop();
    }, Math.floor(y / 4));
    const sa = onWall(side, u, y, 0); if (side === 'b') s.solid(u - w / 2, y - h / 2, SH.z1 - d - 0.04, u + w / 2, y + h / 2, SH.z1); else s.solid(SH.x1 - d - 0.04, y - h / 2, u - w / 2, SH.x1, y + h / 2, u + w / 2);
    void sa;
  }
  // the route tapes at the foot of each route: a strip of the route's colour and its grade disc
  s.detail((gg) => {
    for (const R of ROUTES) {
      const c = ROUTE_COLS[R.col];
      gg.mat('weave', c); const a = onWall(R.side, R.at, MAT_TOP + 1.6, 0.04);
      if (R.side === 'b') gg.box(R.at - 0.16, MAT_TOP + 1.5, SH.z1 - 0.045, R.at + 0.16, MAT_TOP + 1.62, SH.z1 - 0.035, { faces: 'z' });
      else gg.box(SH.x1 - 0.045, MAT_TOP + 1.5, R.at - 0.16, SH.x1 - 0.035, MAT_TOP + 1.62, R.at + 0.16, { faces: 'x' });
      gg.mat('paint', '#f3ead8'); gg.at(a[0], a[1] + 0.3, a[2], R.side === 'b' ? 0 : PI / 2); gg.rotX(-PI / 2); gg.cyl(0, 0, 0, 0.09, 0.012, { segs: 12 }); gg.pop();
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the holds: every route a column of its own colour from the mat to the lamp ceiling
// ---------------------------------------------------------------------------------------------------------------
function holds(game, s) {
  const g = s.g;
  for (const R of ROUTES) {
    const r = new Rng(9100 + Math.round(R.at * 10) + (R.side === 'b' ? 0 : 500)), c = ROUTE_COLS[R.col];
    const top = SH.top - 1.0;
    let y = MAT_TOP + 0.25, n = 0;
    while (y < top) {
      const foot = r.chance(0.35), big = !foot && r.chance(0.22), sl = !foot && !big && r.chance(0.25);
      const u = R.at + r.f(-0.55, 0.55);
      const rx = foot ? r.f(0.04, 0.06) : big ? r.f(0.12, 0.17) : sl ? r.f(0.11, 0.15) : r.f(0.06, 0.1);
      const ry = foot ? rx * 0.8 : big ? rx * 0.75 : sl ? rx * 0.6 : rx * r.f(0.55, 0.85), rz = big ? rx * 0.55 : sl ? rx * 0.35 : rx * r.f(0.5, 0.75);
      const at = onWall(R.side, u, y, 0.035);
      g.mat('glaze', shadeHex(c, r.f(0.88, 1.08)), { rough: 0.35 });
      g.at(at[0], at[1], at[2], R.side === 'b' ? 0 : PI / 2); g.rotX(-PI / 2); g.rotY(r.f(0, PI));
      g.ball(0, 0, 0, rx, rz * 1.6, ry, { segs: big ? 9 : 7, rings: 3, bottom: 0 });
      // chalk on the holds people use most
      if (!foot && y < 14 && r.chance(0.45)) { g.mat('plain', '#f2efe8', { rough: 0.4 }); g.ball(0, 0.004, 0, rx * 0.7, rz * 1.62, ry * 0.7, { segs: 6, rings: 2, bottom: 0.55 }); }
      g.pop();
      y += r.f(0.3, 0.52); n++;
      if (n % 24 === 0) s.flush({ tier: 'd', cast: false, level: Math.min(NG, Math.floor(y / 4)) });
    }
    s.flush({ tier: 'd', cast: false, level: NG });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// a gallery: deck 40 + k, y = 4k. The front arm runs x[-10, 7] at z[-10, -7], the anti arm z[-7, 7] at x[-10, -7].
// ---------------------------------------------------------------------------------------------------------------
function gallery(game, s, k) {
  const g = s.g, y = 4 * k, c = DECK_COL[k], deck = D0 + k, r = new Rng(700 + k);
  // the slab: floor, underside, and a fascia on the shaft side painted in the deck's colour
  floor(s, GO.x, GO.z, SH.x1, SH.z0, y, 'planks', '#9a7350', { level: k });
  floor(s, GO.x, SH.z0, SH.x0, SH.z1, y, 'planks', '#9a7350', { level: k });
  s.structure((gg) => {
    gg.mat('paint', '#d8ccb4'); gg.box(GO.x, y - 0.45, GO.z, SH.x1, y - 0.02, SH.z0, { faces: 'y' }); gg.box(GO.x, y - 0.45, SH.z0, SH.x0, y - 0.02, SH.z1, { faces: 'y' });
    gg.mat('paint', c); gg.box(SH.x0, y - 0.45, SH.z0 - 0.06, SH.x1, y + 0.02, SH.z0, { faces: 'Zy' }); gg.box(SH.x0 - 0.06, y - 0.45, SH.z0, SH.x0, y + 0.02, SH.z1, { faces: 'Xy' });
    gg.mat('cast', '#b08a45', { rough: -0.1 }); gg.box(SH.x0 - 0.07, y - 0.08, SH.z0 - 0.07, SH.x1, y - 0.04, SH.z0 + 0.005, { faces: 'ZY' }); gg.box(SH.x0 - 0.07, y - 0.08, SH.z0, SH.x0 + 0.005, y - 0.04, SH.z1, { faces: 'XY' });
  }, k);
  // the deck's number on its fascia, both arms, big enough to read from the mat
  sign(s, { kind: 'letters', text: 'Deck ' + deck + ' · ' + gOfDeck(deck).toFixed(3) + ' g', font: 'caps', palette: ['#f6ecd6'] }, 0, y - 0.24, SH.z0 + 0.005, { face: 'Z', w: 3.4, h: 0.3, level: k });
  sign(s, { kind: 'letters', text: 'Deck ' + deck + ' · ' + gOfDeck(deck).toFixed(3) + ' g', font: 'caps', palette: ['#f6ecd6'] }, SH.x0 + 0.005, y - 0.24, 0, { face: 'X', w: 3.4, h: 0.3, level: k });
  // rails with glass on the shaft side; on the top deck the front rail parts for the bridge
  const rail = { h: 1.1, glass: true, tint: '#2c3a40', rail: '#7a5233', level: k };
  if (k === BR.k) { railing(s, [[SH.x0, SH.z0], [XB0, SH.z0]], y, rail); railing(s, [[XB1, SH.z0], [SH.x1 - 0.05, SH.z0]], y, rail); }
  else railing(s, [[SH.x0, SH.z0], [SH.x1 - 0.05, SH.z0]], y, rail);
  railing(s, [[SH.x0, SH.z1 - 0.05], [SH.x0, SH.z0]], y, rail);
  // the outer walls: on the front, for decks 41 to 44, a long window into the Spouts; on the anti side, the stair door
  const dado = { h: 1.1, mat: 'paint', tint: shadeHex(c, 0.85) };
  const win = k <= 4 ? [{ at: 2, w: 13, h: 1.5, sill: 0.95 }] : [];
  wall(s, GO.x, GO.z - 0.08, SH.x1, GO.z - 0.08, y, 4, { tint: mixHex(PAL.cream, c, 0.14), tintB: '#d9cdb2', dado, openings: win, level: k });
  if (k <= 4) { s.glass(GO.x + 2.05, y + 0.95, GO.z - 0.08, GO.x + 14.95, y + 2.45, GO.z - 0.08, { level: k }); s.structure((gg) => { gg.mat('cast', '#2c3a40'); for (let x = GO.x + 2; x <= GO.x + 15.01; x += 1.625) gg.box(x - 0.03, y + 0.95, GO.z - 0.14, x + 0.03, y + 2.45, GO.z - 0.02); gg.box(GO.x + 2, y + 0.9, GO.z - 0.2, GO.x + 15, y + 0.95, GO.z + 0.06); }, k); }
  wall(s, GO.x - 0.08, CORE.z1, GO.x - 0.08, SH.z1, y, 4, { tint: mixHex(PAL.cream, c, 0.14), dado, level: k });
  wall(s, GO.x - 0.08, GO.z, GO.x - 0.08, CORE.z1, y, 4, { tint: mixHex(PAL.cream, c, 0.14), dado, openings: [{ at: 0.6, w: 1.1, h: 2.2 }], level: k });
  door(s, { x: GO.x - 0.08, y, z: GO.z + 0.6, w: 1.1, h: 2.2, along: 'z', dir: 1, kind: 'hinge', style: 'panel', tint: shadeHex(c, 0.75), locked: true, lockedText: 'The stair is through here: use the plate beside the door.', level: k });
  // on the gallery: a bench against the anti wall, a planter, coat hooks, a drinking tap, the deck's notice
  prop(s, 'bench', GO.x + 0.42, y, 1.2, PI / 2, { w: 2.2, back: true, wood: PAL.wood }, { level: k });
  prop(s, 'bench', -3.2, y, GO.z + 0.42, 0, { w: 2.0, back: true, wood: shadeHex(PAL.wood, 1.1) }, { level: k });
  planter(s, GO.x + 0.4, y, 4.6, { w: 0.5, d: 1.6, h: 0.55, plants: k % 2 ? 'fern' : 'broad', tint: shadeHex(c, 0.7), level: k });
  prop(s, 'lmchimney.hooks', 2.6, y, GO.z + 0.05, 0, { w: 2.2, seed: k }, { level: k });
  s.detail((gg) => {
    gg.mat('cast', '#9aa3a6'); gg.box(GO.x + 0.02, y + 0.85, -2.3, GO.x + 0.12, y + 1.0, -1.9, { bevel: 0.01 }); gg.tube([[GO.x + 0.1, y + 1.0, -2.1], [GO.x + 0.24, y + 1.06, -2.1]], 0.012, { segs: 5 });
    gg.mat('glaze', '#e8e0cc'); gg.box(GO.x + 0.02, y + 0.8, -2.45, GO.x + 0.36, y + 0.86, -1.75, { bevel: 0.02 });
  }, k);
  const dropHere = driftFrom(y + 1.1);
  sign(s, { kind: 'notice', title: 'Deck ' + deck, lines: ['Weight here: ' + gOfDeck(deck).toFixed(3) + ' g', 'Height over the mat: ' + (y + 1.1 - MAT_TOP).toFixed(1) + ' m', 'Drop a cup over this rail:', 'it lands ' + cm(dropHere) + ' cm anti.', 'Nothing goes over the rail', 'that is not on a line.'] }, GO.x + 0.02, y + 1.6, -5.6, { face: 'X', w: 0.62, h: 0.62, level: k });
  // lamps: sconces on the outer walls
  const clip = [GO.x - 0.1, y - 0.1, GO.z - 0.1, SH.x1, y + 3.8, SH.z1];
  for (const x of [-5.5, 3.2]) lamp(s, 'sconce', x, y + 2.35, GO.z + 0.02, { face: 'Z', K: 2900, power: 0.9, clip, level: k });
  for (const z of [-3.2, 3.6]) lamp(s, 'sconce', GO.x + 0.02, y + 2.35, z, { face: 'X', K: 2900, power: 0.9, clip, level: k });
  roomGlow(s, GO.x, y, GO.z, SH.x0, y + 3.6, SH.z1, { power: 0.18 });
  // the zone of each arm
  for (const b of [[GO.x, y - 0.3, GO.z, SH.x1, y + 3.6, SH.z0], [GO.x, y - 0.3, SH.z0, SH.x0, y + 3.6, SH.z1]]) {
    s.zoneBox({ id: 'chimney-gal-' + k + '-' + b[2], place: 'chimney', box: b, name: 'The Spice Rack', sub: 'the gallery on deck ' + deck + ' · Ring Six', ambience: 'school', reverb: 'hall', headroom: 3.4 });
  }
  // people: watchers at the rail, a chat on the anti arm, sitters on the benches
  for (const x of [-5.2, -1.4, 2.0, 5.4]) if (!(k === BR.k && x > XB0 - 0.6 && x < XB1 + 0.6)) s.spot('stand', x + r.f(-0.3, 0.3), y, SH.z0 - 0.45, 0, { tags: ['watch'] });
  for (const z of [-4.4, 2.4, 5.6]) s.spot('stand', SH.x0 - 0.45, y, z + r.f(-0.3, 0.3), -PI / 2 + PI, { tags: ['watch'] });
  if (k % 2) { const cx = -8.6, cz = -0.6; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 0.4; s.spot('chat', cx + Math.sin(a) * 0.7, y, cz + Math.cos(a) * 0.7, a + PI, { tags: ['talk'] }); } }
  else { const cx = 0.4, cz = -8.7; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2 + 1.1; s.spot('chat', cx + Math.sin(a) * 0.7, y, cz + Math.cos(a) * 0.7, a + PI, { tags: ['talk'] }); } }
  s.path([[GO.x + 0.9, y, GO.z + 1.15], [GO.x + 1.4, y, GO.z + 1.4], [SH.x1 - 0.8, y, GO.z + 1.4]]);
  s.path([[GO.x + 1.4, y, GO.z + 1.4], [GO.x + 1.4, y, SH.z1 - 0.8]]);
  seat(s, -3.2, y, GO.z + 0.42, 0, 'Sit and watch the wall', { pitch: 0.12 });
}

// ---------------------------------------------------------------------------------------------------------------
// the bridge across the top, deck 47: from the front gallery to the back wall, over the routes
// ---------------------------------------------------------------------------------------------------------------
function bridge(game, s) {
  const g = s.g, k = BR.k, y = 4 * k;
  floor(s, XB0, SH.z0, XB1, SH.z1 - 0.02, y, 'deckplate', '#8a8f8a', { level: k });
  s.structure((gg) => {
    // two box girders and cross ties underneath, painted the deck's colour
    gg.mat('paint', DECK_COL[k]);
    for (const x of [XB0 + 0.08, XB1 - 0.08]) gg.box(x - 0.08, y - 0.7, SH.z0, x + 0.08, y - 0.02, SH.z1, { bevel: 0.01 });
    gg.mat('cast', '#3d4a45');
    for (let z = SH.z0 + 1; z < SH.z1; z += 1.5) gg.box(XB0 + 0.1, y - 0.62, z - 0.05, XB1 - 0.1, y - 0.52, z + 0.05);
    for (let z = SH.z0 + 1; z < SH.z1 - 1.4; z += 3) { gg.tube([[XB0 + 0.1, y - 0.6, z], [XB1 - 0.1, y - 0.6, z + 1.5]], 0.025, { segs: 5 }); gg.tube([[XB1 - 0.1, y - 0.6, z], [XB0 + 0.1, y - 0.6, z + 1.5]], 0.025, { segs: 5 }); }
  }, k);
  const rail = { h: 1.1, glass: true, tint: '#2c3a40', rail: '#7a5233', level: k };
  railing(s, [[XB0, SH.z0], [XB0, SH.z1 - 0.05]], y, rail); railing(s, [[XB1, SH.z0], [XB1, SH.z1 - 0.05]], y, rail);
  // the drop station: a brass hook for the bags, a painted arrow on the deck plate pointing anti
  s.detail((gg) => {
    gg.mat('cast', '#b08a45', { rough: -0.1 }); gg.box(XB0 - 0.04, y + 1.1, DROP.z - 0.25, XB0 + 0.04, y + 1.16, DROP.z + 0.25, { bevel: 0.01 });
    for (const dz of [-0.15, 0, 0.15]) gg.tube([[XB0 + 0.02, y + 1.1, DROP.z + dz], [XB0 + 0.1, y + 1.0, DROP.z + dz], [XB0 + 0.12, y + 0.95, DROP.z + dz]], 0.007, { segs: 4 });
    gg.mat('weave', '#8a2f3c'); for (const dz of [-0.15, 0.15]) gg.cyl(XB0 + 0.12, y + 0.8, DROP.z + dz, 0.055, 0.12, { segs: 8 });
    gg.mat('paint', '#f3e6c8'); gg.box(XB0 + 0.15, y + 0.003, DROP.z - 0.04, XB1 - 0.3, y + 0.008, DROP.z + 0.04, { faces: 'Y' });
    gg.prism([[XB0 + 0.15, DROP.z - 0.14], [XB0 + 0.15, DROP.z + 0.14], [XB0 + 0.0, DROP.z]].reverse(), y + 0.003, y + 0.008);
  }, k);
  sign(s, { kind: 'plate', text: 'Let go here', lines: ['bag lands ' + f2(driftFrom(DROP.y)) + ' m anti', 'on the target, ' + f2(fallTime(DROP.y)) + ' s down'] }, XB1 - 0.02, y + 1.0, DROP.z, { face: 'x', w: 0.5, h: 0.24, level: k, board: false });
  s.zoneBox({ id: 'chimney-bridge', place: 'chimney', box: [XB0, y - 0.3, SH.z0, XB1, y + 3.6, SH.z1], name: 'The Spice Rack', sub: 'the bridge · deck 47 · Ring Six', ambience: 'school', reverb: 'hall', headroom: 3.6 });
  s.path([[BR.x, y, SH.z0 - 1.6], [BR.x, y, SH.z0 + 0.6], [BR.x, y, SH.z1 - 0.8]]);
  s.spot('stand', BR.x - 0.3, y, 2.0, -PI / 2 + PI, { tags: ['watch'] });
  s.spot('stand', BR.x + 0.3, y, -3.2, PI / 2 + PI, { tags: ['watch'] });
}

// ---------------------------------------------------------------------------------------------------------------
// the mat and its target
// ---------------------------------------------------------------------------------------------------------------
function mat(game, s) {
  const g = s.g, r = new Rng(55);
  // cushions two metres square, stitched, in two blues; walkable at MAT_TOP
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const x0 = SH.x0 + i * 2, z0 = SH.z0 + j * 2;
      g.mat('speckle', (i + j) % 2 ? '#2f5f9a' : '#2a568c', { rough: 0.2 });
      g.box(x0 + 0.01, 0, z0 + 0.01, x0 + 1.99, MAT_TOP, z0 + 1.99, { bevel: 0.05, aoBottom: 0.6 });
    }
    s.flush({ tier: 's', cast: false });
  }
  s.solid(SH.x0, 0, SH.z0, SH.x1, MAT_TOP, SH.z1, { surf: 'felt' });
  // the target: rings of red and cream, a chalk smudge where the bags land
  s.detail((gg) => {
    const rings = [[1.6, '#f1e6cf'], [1.32, '#c8302a'], [1.0, '#f1e6cf'], [0.7, '#c8302a'], [0.4, '#f1e6cf'], [0.16, '#c8302a']];
    rings.forEach((q, i) => { gg.mat('paint', q[1], { rough: 0.1 }); gg.cyl(TARGET.x, MAT_TOP, TARGET.z, q[0], 0.003 + i * 0.0015, { segs: 40 }); });
    gg.mat('plain', '#f4f1ea', { rough: 0.4 }); for (let i = 0; i < 9; i++) { const a = r.f(0, PI * 2), d = r.f(0, 0.35); gg.cyl(TARGET.x + Math.cos(a) * d, MAT_TOP + 0.013, TARGET.z + Math.sin(a) * d, r.f(0.05, 0.13), 0.002, { segs: 10 }); }
    // the painted line from under the bridge route to the target, and its arrowhead pointing anti
    gg.mat('paint', '#f1e6cf');
    const xr = 1.9, z = TARGET.z;
    for (let x = xr; x > TARGET.x + 1.7; x -= 0.32) gg.box(x - 0.18, MAT_TOP, z - 0.035, x, MAT_TOP + 0.004, z + 0.035, { faces: 'Y' });
    gg.cyl(xr, MAT_TOP, z, 0.12, 0.004, { segs: 16 });
  });
  // a brass plate on a lectern at the mat's edge, read from the anti aisle
  s.furniture((gg) => {
    gg.mat('cast', '#3d4a45'); gg.lathe(-7.75, 3.6, [[0.2, 0], [0.18, 0.04], [0.04, 0.08], [0.035, 1.0], [0.06, 1.04]], { segs: 12 });
    gg.mat('wood', '#5b4636'); gg.at(-7.75, 1.05, 3.6, 0); gg.rotZ(-0.35); gg.box(-0.06, -0.03, -0.42, 0.06, 0.03, 0.42, { bevel: 0.01 }); gg.pop();
  });
  s.post(-7.75, 3.6, 0.2, 0, 1.05);
  const T30 = 30, T10 = 10;
  sign(s, { kind: 'plate', text: 'Every fall lands anti', lines: ['From the top hold, ' + T30 + ' m: ' + f2(driftFrom(T30 + MAT_TOP)) + ' m anti', 'From ' + T10 + ' m: ' + f2(driftFrom(T10 + MAT_TOP)) + ' m anti', 'A cup from your hand: ' + cm(driftFrom(1.4 + MAT_TOP) * 10) / 10 + ' cm', 'So the target is anti of the routes'] }, -7.7, 1.12, 3.6, { face: 'X', w: 0.82, h: 0.5 });
  s.interact({ x: -7.9, y: 1.1, z: 3.6, radius: 1.3, prompt: 'Read the brass plate', onUse: async (gm) => {
    await read(gm, 'The brass plate', [
      'Every fall lands anti. The drum turns under a falling thing, so it comes down a little behind the spot it left, on the anti side.',
      'From the top hold, thirty metres up, a fall lands ' + f2(driftFrom(30 + MAT_TOP)) + ' metres anti. From ten metres, ' + f2(driftFrom(10 + MAT_TOP)) + '. From your hand, about ' + Math.max(1, cm(driftFrom(1.4 + MAT_TOP))) + ' centimetres.',
      'That is why the target is painted ' + f2(1.9 - TARGET.x) + ' metres anti of the Bridge route and not under it. Nobody falls thirty metres here: the rope takes them. The target is for what people drop.',
      'Laid by the Rack committee, deck 40, and re-painted every Knotnight.',
    ]);
    find(gm, 'falls-anti');
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// climbers on the routes, their ropes, the coiled ropes of the routes nobody is on, and the belayers' places
// ---------------------------------------------------------------------------------------------------------------
function climbers(game, s) {
  const g = s.g;
  const who = [
    { r: 0, y: 6.2, pose: 0, top: '#e9c43d', bottom: '#2c3a40', skin: '#8d5a3a', hair: '#1d1410' },
    { r: 1, y: 17.4, pose: 1, top: '#2f9fa8', bottom: '#6b3d5e', skin: '#d3a17a', hair: '#7a4a2a' },
    { r: 2, y: 11.0, pose: 5, top: '#efe8da', bottom: '#34417a', skin: '#b9825a', hair: '#2a1d14' },
    { r: 3, y: 25.6, pose: 3, top: '#c8452e', bottom: '#2f4f4a', skin: '#6e432b', hair: '#121010' },
    { r: 4, y: 3.4, pose: 2, top: '#4fa65a', bottom: '#2c3a40', skin: '#e0b48e', hair: '#c9a060' },
    { r: 6, y: 21.0, pose: 4, top: '#e06a9a', bottom: '#34417a', skin: '#a8714e', hair: '#2a1d14' },
    { r: 8, y: 8.6, pose: 1, top: '#d9a23a', bottom: '#4f3a5e', skin: '#c48c62', hair: '#3a2416' },
  ];
  const used = new Set();
  for (const c of who) {
    const R = ROUTES[c.r]; used.add(c.r);
    const base = onWall(R.side, R.at, c.y, 0), yaw = R.side === 'b' ? 0 : PI / 2;
    prop(s, 'lmchimney.climber', base[0], base[1], base[2], yaw, { pose: c.pose, top: c.top, bottom: c.bottom, skin: c.skin, hair: c.hair, harness: ROUTE_COLS[(c.r + 3) % 9] }, { tier: 's', level: Math.floor(c.y / 4), noCollide: true });
    // tie-in point in the frame
    const P = [0.28, 0.12, 0.18, 0.02, 0.1, 0.45][c.pose]; const lz = -0.3 - P - 0.17;
    const tie = R.side === 'b' ? [base[0], base[1] + 0.04, base[2] + lz] : [base[0] + lz, base[1] + 0.04, base[2]];
    const anchor = onWall(R.side, R.at, SH.top - 0.7, 0.3);
    const belay = R.side === 'b' ? [R.at - 0.9, MAT_TOP + 1.05, SH.z1 - 1.5] : [SH.x1 - 1.6, MAT_TOP + 1.05, R.at - 0.6];
    s.deco((gg) => {
      gg.mat('weave', ROUTE_COLS[(c.r + 5) % 9]);
      gg.tube([anchor, tie], 0.011, { segs: 4, caps: false });
      // the belayer's side of the rope comes down nearly straight, a little slack at the bottom
      const mid = [(anchor[0] + belay[0]) / 2, (anchor[1] + belay[1]) / 2, (anchor[2] + belay[2]) / 2];
      gg.tube([anchor, mid, [belay[0] + 0.05, belay[1] + 0.4, belay[2] + 0.05], belay], 0.011, { segs: 4, caps: false });
    });
    s.spot('stand', belay[0] + (R.side === 'b' ? -0.25 : -0.1), MAT_TOP, belay[2] + (R.side === 'b' ? -0.25 : -0.25), R.side === 'b' ? 0 : PI / 2, { tags: ['belay'] });
  }
  // the routes nobody is on: the rope hangs doubled to a coil on the mat
  for (let i = 0; i < ROUTES.length; i++) {
    if (used.has(i)) continue;
    const R = ROUTES[i], anchor = onWall(R.side, R.at, SH.top - 0.7, 0.3), foot = onWall(R.side, R.at, MAT_TOP + 0.05, 0.6);
    s.deco((gg) => {
      gg.mat('weave', ROUTE_COLS[(i + 5) % 9]);
      for (const d of [-0.04, 0.04]) gg.tube([[anchor[0] + d, anchor[1], anchor[2]], [foot[0] + d, foot[1] + 0.3, foot[2]]], 0.011, { segs: 4, caps: false });
      const coil = []; for (let m = 0; m <= 36; m++) { const a = m / 12 * PI * 2; coil.push([foot[0] + Math.cos(a) * 0.22, foot[1] + 0.02 + m * 0.004, foot[2] + Math.sin(a) * 0.22]); }
      gg.tube(coil, 0.012, { segs: 4, caps: false });
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// light: the lamp ceiling's downlights, washes up the walls from the galleries, the shaft's own glow
// ---------------------------------------------------------------------------------------------------------------
function lights(game, s) {
  const CLIP = [GO.x - 0.2, -0.5, GO.z - 0.2, SH.x1 + 0.1, SH.top + 0.1, SH.z1 + 0.1];
  for (const lx of [-3.5, 3.5]) for (const lz of [-3.5, 3.5]) s.light({ at: [lx, SH.top - 0.7, lz], type: 'spot', dir: [0, -1, 0], cone: [62, 34], color: '#fff1df', power: 360, range: 38, shadow: true, radius: 1.6, clip: CLIP, lamp: true });
  // washes: from the anti gallery's fascia onto the spinward wall, from the front gallery's onto the back wall
  for (const k of [1, 3, 5]) {
    const y = 4 * k - 0.55;
    s.light({ at: [SH.x0 + 0.3, y, 0], type: 'spot', dir: [1, 0.35, 0], cone: [48, 26], color: '#ffe2b8', power: 70, range: 20, clip: CLIP, lamp: true, radius: 0.3 });
    s.light({ at: [0, y, SH.z0 + 0.3], type: 'spot', dir: [0, 0.35, 1], cone: [48, 26], color: '#ffe2b8', power: 70, range: 20, clip: CLIP, lamp: true, radius: 0.3 });
  }
  s.ambient({ box: [SH.x0, 0, SH.z0, SH.x1, SH.top, SH.z1], sky: '#fff0de', ground: '#9fb0c8', power: 1.6, skylit: true, lamp: true, soft: 2.0 });
  s.ambient({ box: [GO.x, 0, GO.z, SH.x1, SH.top, SH.z1], sky: '#ffdcae', ground: '#c9a57c', power: 0.22, lamp: true, soft: 1.5 });
  // lamp housings on the fascias, under each wash
  s.deco((gg) => {
    gg.mat('cast', '#2c3a40');
    for (const k of [1, 3, 5]) { const y = 4 * k - 0.55; gg.cyl(SH.x0 + 0.15, y - 0.1, 0, 0.12, 0.22, { segs: 10 }); gg.cyl(0, y - 0.1, SH.z0 + 0.15, 0.12, 0.22, { segs: 10 }); }
    gg.mat('diffuser', '#ffe9c8', { emissive: 4, lamp: true });
    for (const k of [1, 3, 5]) { const y = 4 * k - 0.55; gg.cyl(SH.x0 + 0.15, y + 0.12, 0, 0.1, 0.01, { segs: 10 }); gg.cyl(0, y + 0.12, SH.z0 + 0.15, 0.1, 0.01, { segs: 10 }); }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the chalk bag: let go from the bridge, it falls for two and a half seconds, drifting anti exactly as the drum says,
// and lands on the target
// ---------------------------------------------------------------------------------------------------------------
function chalkDrop(game, s) {
  const f = s.frame, k = BR.k;
  const bag = movable(s, (g) => {
    g.mat('weave', '#8a2f3c'); g.cyl(0, -0.06, 0, 0.06, 0.12, { segs: 10 });
    g.mat('plain', '#f4f1ea'); g.cyl(0, 0.06, 0, 0.05, 0.012, { segs: 10 });
    g.mat('weave', '#e9c43d'); g.tube([[-0.06, 0.03, 0], [0, 0.11, 0], [0.06, 0.03, 0]], 0.008, { segs: 4 });
  }, [TARGET.x + 0.2, MAT_TOP + 0.06, TARGET.z - 0.15], { radius: 0.3, far: 70 });
  const puff = movable(s, (g) => { g.mat('plain', '#f6f3ee', { rough: 0.5, emissive: 0.4 }); g.ball(0, 0.05, 0, 0.32, 0.08, 0.32, { segs: 12, rings: 4 }); }, [TARGET.x, -5, TARGET.z], { radius: 0.5, far: 70 });
  puff.userData.hidden = true;
  const st = { on: false, t: 0, T: fallTime(DROP.y), puffT: 0, n: 0 };
  s.every((dt) => {
    if (st.puffT > 0) { st.puffT -= dt; if (st.puffT <= 0) puff.userData.hidden = true; }
    if (!st.on) return;
    st.t += dt;
    const fallen = 0.5 * 9.81 * G0 * st.t * st.t, y = Math.max(MAT_TOP + 0.06, DROP.y - fallen);
    const drift = driftFrom(DROP.y) * Math.pow(Math.min(1, (DROP.y - y) / (DROP.y - MAT_TOP)), 1.5);
    const o = bag.userData.origin; o[0] = DROP.x - drift; o[1] = y; o[2] = DROP.z;
    if (y <= MAT_TOP + 0.06) {
      st.on = false; o[0] = TARGET.x; o[1] = MAT_TOP + 0.06;
      const po = puff.userData.origin; po[0] = TARGET.x; po[1] = MAT_TOP; po[2] = TARGET.z; puff.userData.hidden = false; st.puffT = 0.6;
      sfx(game, 'land', f, TARGET.x, MAT_TOP, TARGET.z, { vol: 0.8 });
      st.n++;
      game.flags['chimney.drops'] = (game.flags['chimney.drops'] || 0) + 1;
      const d = driftFrom(DROP.y);
      const lines = [
        'Two and a half seconds, and a soft thump. The bag lands ' + f2(d) + ' m anti of where you let it go, in the middle of the target. The rope hanging beside it never moved: only falling things drift.',
        'It lands on the target again, ' + f2(d) + ' m anti. A child on the mat picks it up and waves it at you, then puts it in the basket for the lift.',
        'Thump. ' + f2(d) + ' m anti, as the plate says. Someone on deck 43 claps.',
        'On the target. A belayer looks up, sees the bag, and goes back to the rope.',
      ];
      toast(game, lines[(st.n - 1) % lines.length]);
      find(game, 'falls-anti');
    }
  });
  s.interact({ x: XB0 + 0.35, y: 4 * k + 1.1, z: DROP.z, radius: 1.3, prompt: (gm) => (st.on ? 'Watch it fall' : 'Drop a chalk bag over the rail'), onUse: (gm) => {
    if (st.on) return;
    st.on = true; st.t = 0; const o = bag.userData.origin; o[0] = DROP.x; o[1] = DROP.y; o[2] = DROP.z;
    sfx(gm, 'chalk', f, DROP.x, DROP.y, DROP.z, { vol: 0.6 });
    if (gm.player) { gm.player.pitch = -1.05; gm.player.yaw = -PI / 2 + 0.25; }
  } });
}

// ---------------------------------------------------------------------------------------------------------------
// the stair: a plate beside the door on every deck; it takes you to any deck of the Rack
// ---------------------------------------------------------------------------------------------------------------
function stairDoors(game, s) {
  const f = s.frame;
  const where = (k) => (k === 0 ? 'the mat and the counter' : k === BR.k ? 'the top gallery and the bridge' : 'the gallery');
  for (let k = 0; k <= NG; k++) {
    const y = 4 * k;
    s.structure((gg) => { gg.mat('cast', '#b08a45', { rough: -0.1 }); gg.box(GO.x + 0.0, y + 1.1, GO.z + 1.85, GO.x + 0.03, y + 1.4, GO.z + 2.05, { bevel: 0.006 }); gg.mat('diffuser', '#3fe0d0', { emissive: 2, lamp: true }); gg.box(GO.x + 0.03, y + 1.22, GO.z + 1.92, GO.x + 0.04, y + 1.28, GO.z + 1.98, {}); }, k);
    s.interact({ x: GO.x + 0.5, y: y + 1.2, z: GO.z + 1.2, radius: 1.4, prompt: 'Take the stair', onUse: async (gm) => {
      const opts = [];
      for (let j = NG; j >= 0; j--) if (j !== k) opts.push({ label: 'Deck ' + (D0 + j) + (j > k ? ', up' : ', down'), sub: where(j) + ' · ' + gOfDeck(D0 + j).toFixed(3) + ' g', value: String(j) });
      const pick = await choose(gm, { name: 'The stair', colour: '#3fe0d0' }, 'Eight decks of stair, numbered at every landing.', opts);
      if (pick === null || pick === undefined) return;
      const j = Number(pick), p = gm.player;
      gm.busy++;
      try {
        sfx(gm, 'door', f, GO.x, y + 1, GO.z + 1);
        if (gm.ui) await gm.ui.fade(true, 0.35);
        p.place(f, GO.x + 0.9, 4 * j, GO.z + 1.2, PI * 0.72, 0);
        if (gm.ui) await gm.ui.fade(false, 0.45);
      } finally { gm.busy--; }
      const n = Math.abs(j - k), up = j > k;
      toast(gm, up ? n + ' deck' + (n > 1 ? 's' : '') + ' up, ' + (n * 4) + ' metres. You weigh ' + Math.round((1 - gOfDeck(D0 + j) / gOfDeck(D0 + k)) * 1000) / 10 + ' percent less here, which the stair did not feel like.' : n + ' deck' + (n > 1 ? 's' : '') + ' down. Down is free, as the old stair signs say.');
    } });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the ground floor round the mat: benches of parents under the galleries, belayers, children bouldering
// ---------------------------------------------------------------------------------------------------------------
function ground(game, s) {
  const g = s.g, r = new Rng(12);
  // columns carrying the anti galleries' outer wall, and the front aisle's wall into the Spouts
  for (const z of [-5.2, -0.2, 4.8]) { block(s, GO.x - 0.2, 0, z - 0.2, GO.x + 0.2, 3.6, z + 0.2, 'paint', DECK_COL[0], { bevel: 0.02 }); }
  s.structure((gg) => { gg.mat('paint', '#d8ccb4'); gg.box(GO.x - 0.25, 3.4, CORE.z1, GO.x + 0.25, 4.0, SH.z1, { faces: 'xXy' }); });
  wall(s, GO.x, GO.z - 0.08, SH.x1, GO.z - 0.08, 0, 4, { tint: mixHex(PAL.cream, DECK_COL[0], 0.14), tintB: '#d9cdb2', dado: { h: 1.1, mat: 'paint', tint: shadeHex(DECK_COL[0], 0.85) }, openings: [{ at: 8, w: 6, h: 3.2 }] });
  wall(s, GO.x - 0.08, GO.z, GO.x - 0.08, CORE.z1, 0, 4, { tint: mixHex(PAL.cream, DECK_COL[0], 0.14), dado: { h: 1.1, mat: 'paint', tint: shadeHex(DECK_COL[0], 0.85) }, openings: [{ at: 0.6, w: 1.1, h: 2.2 }] });
  door(s, { x: GO.x - 0.08, y: 0, z: GO.z + 0.6, w: 1.1, h: 2.2, along: 'z', dir: 1, kind: 'hinge', style: 'panel', tint: shadeHex(DECK_COL[0], 0.75), locked: true, lockedText: 'The stair is through here: use the plate beside the door.' });
  // benches of parents under the anti gallery, facing the wall
  for (const z of [-2.7, 2.3]) { prop(s, 'bench', GO.x + 0.6, 0, z, PI / 2, { w: 2.2, back: true, wood: PAL.wood }); seat(s, GO.x + 0.6, 0, z, PI / 2, 'Sit with the parents', { pitch: 0.25 }); }
  for (const x of [-6.6, 5.4]) prop(s, 'bench', x, 0, GO.z + 0.45, 0, { w: 2.0, back: true, wood: shadeHex(PAL.wood, 1.1) });
  // things on the floor: bags, a chalk tub, water bottles, shoes in pairs at the mat's edge
  prop(s, 'lmchimney.chalk', -7.6, 0, -1.1, 0, { tub: '#c8452e' });
  s.detail((gg) => {
    for (let i = 0; i < 10; i++) {
      const x = -7.5 + r.f(-0.3, 0.3), z = -6 + i * 1.3 + r.f(-0.2, 0.2);
      gg.mat('leather', r.pick(['#3a2b24', '#2f5f9a', '#c8452e', '#4f8a52', '#d9a23a'])); gg.box(x - 0.05, 0, z - 0.13, x + 0.05, 0.08, z, { bevel: 0.025 }); gg.box(x - 0.05, 0, z + 0.03, x + 0.05, 0.08, z + 0.16, { bevel: 0.025 });
    }
    for (let i = 0; i < 6; i++) { const x = -8.4 + r.f(-0.4, 0.4), z = -5.8 + i * 2.2; gg.mat('weave', r.pick(['#8a2f3c', '#2f7d7a', '#34417a', '#d9a23a'])); gg.box(x - 0.22, 0, z - 0.15, x + 0.22, 0.3, z + 0.15, { bevel: 0.06 }); }
    for (let i = 0; i < 5; i++) { const x = -9.6, z = -4 + i * 1.6; gg.mat('glaze', r.pick(['#e8e0cc', '#2f7d7a', '#c8452e'])); gg.cyl(x, 0.46, z, 0.035, 0.22, { segs: 8 }); }
  });
  // panel lamps under the galleries
  const clipA = [GO.x - 0.3, -0.2, GO.z - 0.2, SH.x0 + 0.3, 3.6, SH.z1], clipF = [GO.x - 0.3, -0.2, GO.z - 0.2, SH.x1, 3.6, SH.z0 + 0.3];
  for (const z of [-3, 3]) lamp(s, 'panel', -8.5, 3.53, z, { w: 0.6, d: 1.6, K: 3200, power: 0.8, clip: clipA });
  for (const x of [-3, 3.5]) lamp(s, 'panel', x, 3.53, -8.5, { w: 1.6, d: 0.6, K: 3200, power: 0.8, clip: clipF });
  // people on the ground: parents on the benches come from the bench props; children bouldering at the low corner; a chat
  for (let i = 0; i < 4; i++) s.spot('play', -5.2 + i * 0.9, MAT_TOP, 5.6 - (i % 2) * 0.7, 0, { tags: ['kids', i % 2 ? 'hop' : 'run'] });
  for (let i = 0; i < 3; i++) s.spot('play', 5.4 - (i % 2) * 0.6, MAT_TOP, -5 + i * 1.1, PI / 2, { tags: ['kids', 'hop'] });
  { const cx = -1.5, cz = -2.0; for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; s.spot('chat', cx + Math.sin(a) * 0.75, MAT_TOP, cz + Math.cos(a) * 0.75, a + PI, { tags: ['talk'] }); } }
  s.spot('stand', -7.4, 0, 0.6, PI / 2, { tags: ['watch'] }); s.spot('stand', 1.5, 0, -7.4, 0, { tags: ['watch'] });
  // walkways: round the aisles, out to the Spouts and the foyer
  s.path([[GO.x - 2, 0, 0.0], [GO.x + 1.4, 0, 0.0], [GO.x + 1.4, 0, -8.6], [1, 0, -8.6], [1, 0, -11.6]]);
  s.path([[GO.x + 1.4, 0, 0.0], [GO.x + 1.4, 0, 6.2]]);
  s.path([[GO.x + 1.4, 0, -8.6], [GO.x + 0.9, 0, GO.z + 1.15]]);
  s.path([[GO.x + 1.4, 0, -3.5], [-3.5, MAT_TOP, -3.5], [-1.5, MAT_TOP, 2.5], [3.5, MAT_TOP, 4.8]]);
  s.zoneBox({ id: 'chimney-aisle-a', place: 'chimney', box: [GO.x, -0.5, GO.z, SH.x0, 3.6, SH.z1], name: 'The Spice Rack', sub: 'the mat · ' + SUB, ambience: 'school', reverb: 'hall', headroom: 3.4 });
  s.zoneBox({ id: 'chimney-aisle-f', place: 'chimney', box: [SH.x0, -0.5, GO.z, SH.x1, 3.6, SH.z0], name: 'The Spice Rack', sub: 'the mat · ' + SUB, ambience: 'school', reverb: 'hall', headroom: 3.4 });
  // the routes board, on the end of the anti aisle
  sign(s, { kind: 'board', title: 'Routes on the Rack', lines: ROUTES.map((R) => R.name + ' · ' + (R.side === 'b' ? 'back' : 'spinward') + '|' + R.grade) }, -8.5, 1.75, SH.z1 - 0.02, { face: 'z', w: 1.5, h: 1.25 });
  s.interact({ x: -8.5, y: 1.5, z: SH.z1 - 0.8, radius: 1.2, prompt: 'Read the routes board', onUse: (gm) => read(gm, 'Routes on the Rack', [
    'Nine routes, all thirty-one metres, set by the volunteers on the first of every month. The tape at the foot is the route\'s colour; follow that colour to the top.',
    'The back wall is the friendly one: a fall from it drifts along the wall, not into it. The spinward wall throws you a little off it as you fall, which the setters like. Nobody sets on the anti side, because a fall there would scrape down its own face. That side is the galleries.',
    'The Nine is graded seven. It is named for the bowl of the bitter Nine on the free table, and for the same reason.',
  ]) });
}
