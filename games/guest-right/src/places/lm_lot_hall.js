// The lot hall: Chervil's assembly, on the Middle decks under Ring Five (decks 200 to 203, about 0.73 g).
//
// A drum of two hundred million cannot meet, so every year it draws about a thousand residents by lot to set the
// commons, and they sit here. The building is how a drum governs itself: by lot, by ledger and in public.
//
//   The Bowl: a round hall, a shallow bowl of about a thousand chairs, every one different, remade and never replaced,
//   the oldest at the front with names carved under the arms. The speaker's stool in the middle, not a lectern; the
//   Churn beside it, the drum of numbered tokens the lot is drawn from; the public gallery right round on the deck
//   above; and hung over it all, the Slate: the questions before the assembly this year.
//   The foyer (lm_lot_hall_rooms.js): three decks tall, the floor door, the stairs, the Urn (tea), the cab lobby.
//   The Hatches: a corridor of offices, a hatch and a brass plate and one clerk each. The Two Chairs: the small court.
//   The Pin Room (lm_lot_hall_pins.js): what came in by light today, pinned up in columns, a clock over each.
//
// Frame 'lot-hall': x spinward, z toward the back cap, y up; deck 200 at y = 0. Plan in lm_lot_hall_props.js.
import { lamp } from '../world/kit.js';
import { sign } from '../world/signs.js';
import { prop } from '../world/props.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import {
  PI, TAU, REGION, SUB, B, RIM_IN, AISLES, DOOR_X, DOOR_W, DOOR_A, CLOTHS, WOODS, FELTS, C, CHURN,
  rowR, rowY, P, q4, ringFlat, ringWall, adiff, say, toast, sfx, find, hour, tick, seat, turning, pickBy, drawChurnCage,
} from './lm_lot_hall_props.js';
import { buildFoyer, buildHatches, buildCourt } from './lm_lot_hall_rooms.js';
import { buildPins } from './lm_lot_hall_pins.js';

const ENV_BOWL = { exposure: 1.0, autoKey: 0.15, bloom: 0.08, warmth: 0.12, contrast: 1.08, saturation: 1.08 };
const CLIP = [-B.RW - 0.4, -0.5, -B.RW - 0.4, B.RW + 0.4, B.TOP + 0.1, B.RW + 0.4];
const CHURN_AT = [-2.3, 0, -1.9];
const DESK_AT = [2.4, 0, -2.3];

export const place = {
  id: 'lm-lot-hall', name: 'The lot hall', order: 10,
  region: REGION,
  stops: [
    { id: 'lot-hall', name: 'The lot hall', sub: 'the assembly · deck 200 · Ring Five', group: 'The Middle decks', spawn: 'lot-hall', deck: 200, zd: 1875 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('lot-hall', deckRadius(200), -2.2, 1875);
    const s = W.scope('lot-hall', f);
    const r = new Rng(200203);

    bowlGround(game, s, f);
    bowlFloor(s);
    await tick(game);
    bowlRows(game, s, r);
    await tick(game);
    bowlRim(s);
    bowlWall(s, r);
    await tick(game);
    gallery(s);
    ceiling(s);
    await tick(game);
    slate(game, s);
    floorThings(game, s, f);
    bowlLights(s);
    bowlLife(game, s, f, r);
    await tick(game);
    await buildFoyer(game, s, f, r);
    await tick(game);
    await buildHatches(game, s, f, r);
    await tick(game);
    await buildCourt(game, s, f, r);
    await tick(game);
    await buildPins(game, s, f, r);
    await tick(game);

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['lot-hall'] = { frame: f, x: 0, y: 0, z: 41.4, yaw: 0 };
    console.log('[lm-lot-hall] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the ground of the Bowl: one height function for the floor, the rows, the aisles and the rim (boxes cannot make rings)
// ---------------------------------------------------------------------------------------------------------------
function rampY(r) {
  if (r <= B.R0) return 0;
  if (r <= RIM_IN) return Math.min(rowY(B.ROWS - 1), (r - B.R0) / B.D * B.RISE);
  return Math.min(B.RIM, rowY(B.ROWS - 1) + (r - RIM_IN) / 0.55 * (B.RIM - rowY(B.ROWS - 1)));
}
export function bowlHeight(x, z) {
  if (Math.abs(x) < B.THROAT && z > 0 && z < 20.2) return 0;            // the throat and the tunnel to the foyer
  const r = Math.hypot(x, z);
  if (r >= B.RW) return null;
  if (r < 0.95) return 0.15;                                           // the stool's dais
  if (r < B.R0) return 0;
  const th = Math.atan2(x, z);
  for (const a of AISLES) { const d = adiff(th, a); if (Math.abs(d) < PI / 2 && Math.abs(r * Math.sin(d)) < B.AHW) return rampY(r); }
  const k = Math.floor((r - B.R0) / B.D);
  return k >= B.ROWS ? B.RIM : rowY(k);
}
function bowlGround(game, s, f) {
  const col = game.world.colliders(f);
  if (col) { col.heightFn = bowlHeight; s.onDispose(() => { if (col.heightFn === bowlHeight) col.heightFn = null; }); }
  // the rows over the tunnel, the rim over it, and the tunnel's own walls: boxes
  for (let k = B.BRIDGE; k < B.ROWS; k++) s.solid(-B.THROAT, B.TUN, rowR(k), B.THROAT, rowY(k), rowR(k) + B.D, { surf: 'wood' });
  s.solid(-B.THROAT, B.TUN, RIM_IN, B.THROAT, B.RIM, 20, { surf: 'wood' });
  for (const sx of [-1, 1]) s.solid(sx * B.THROAT - (sx < 0 ? 0.3 : 0), 0, rowR(B.BRIDGE), sx * B.THROAT + (sx > 0 ? 0.3 : 0), B.TUN, 20);
  // the throat's side walls under the cut rows, and the rails on them
  for (let k = 0; k < B.BRIDGE; k++) {
    const za = Math.sqrt(rowR(k) ** 2 - B.THROAT ** 2), zb = Math.sqrt((rowR(k) + B.D) ** 2 - B.THROAT ** 2);
    for (const sx of [-1, 1]) {
      s.solid(Math.min(sx * B.THROAT, sx * (B.THROAT + 0.12)), 0, za, Math.max(sx * B.THROAT, sx * (B.THROAT + 0.12)), rowY(k), zb);
      s.solid(Math.min(sx * (B.THROAT + 0.03), sx * (B.THROAT + 0.11)), rowY(k), za, Math.max(sx * (B.THROAT + 0.03), sx * (B.THROAT + 0.11)), rowY(k) + 0.95, zb);
    }
  }
  // the hall's wall: a ring of posts from the rim up, with the doors left open
  const n = Math.ceil(TAU * B.RW / 0.5);
  for (let i = 0; i < n; i++) {
    const th = i / n * TAU, door = Math.abs(adiff(th, DOOR_A)) < DOOR_W / 2 / B.RW || Math.abs(adiff(th, -DOOR_A)) < DOOR_W / 2 / B.RW;
    const p = P(B.RW + 0.3, th, 0);
    if (Math.abs(p[0]) < B.THROAT + 0.2 && p[2] > 0) { s.post(p[0], p[2], 0.34, B.RIM, B.TOP); continue; }
    if (door) { s.post(p[0], p[2], 0.34, B.RIM + 2.3, B.GY); s.post(p[0], p[2], 0.34, B.GY + 2.3, B.TOP); continue; }
    s.post(p[0], p[2], 0.34, 0, B.TOP);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the floor: terrazzo, a dark band, a brass ring at its edge, the dais for the stool, a felt runner in from the throat
// ---------------------------------------------------------------------------------------------------------------
function bowlFloor(s) {
  const seg = 24;
  for (let i = 0; i < seg; i++) {
    const a = i / seg * TAU, b = (i + 1) / seg * TAU;
    s.structure((g) => {
      g.mat('terrazzo', C.floor); q4(g, P(0.95, b, 0), P(0.95, a, 0), P(3.2, a, 0), P(3.2, b, 0), 0, 1, 0);
      g.mat('terrazzo', '#2a3a3a'); q4(g, P(3.2, b, 0), P(3.2, a, 0), P(3.5, a, 0), P(3.5, b, 0), 0, 1, 0);
      g.mat('terrazzo', '#c9b490'); q4(g, P(3.5, b, 0), P(3.5, a, 0), P(4.45, a, 0), P(4.45, b, 0), 0, 1, 0);
      g.mat('cast', C.brass, { rough: -0.2 }); q4(g, P(4.45, b, 0.004), P(4.45, a, 0.004), P(B.R0, a, 0.004), P(B.R0, b, 0.004), 0, 1, 0);
      // the dais: a step of dark stone, worn pale on top
      g.mat('stone', '#5a4a3c'); q4(g, P(0.95, a, 0), P(0.95, b, 0), P(0.95, b, 0.15), P(0.95, a, 0.15), Math.sin((a + b) / 2), 0, Math.cos((a + b) / 2));
      g.mat('stone', '#a89878'); q4(g, P(0.001, b, 0.15), P(0.001, a, 0.15), P(0.95, a, 0.15), P(0.95, b, 0.15), 0, 1, 0);
      // inlaid in the dark band: a small brass token every fifteen degrees
      g.mat('cast', '#d2ad5c', { rough: -0.25 }); const m = (a + b) / 2; g.cyl(3.35 * Math.sin(m), 0.0, 3.35 * Math.cos(m), 0.07, 0.005, { segs: 10 });
    });
  }
  // the runner from the tunnel to the dais, madder felt with saffron edges
  s.deco((g) => {
    g.mat('felt', C.madder); g.box(-0.7, 0, 0.95, 0.7, 0.008, 20, { faces: 'Y' });
    g.mat('felt', C.saffron); for (const sx of [-1, 1]) g.box(sx * 0.7 - 0.06, 0, 0.95, sx * 0.7 + 0.06, 0.01, 20, { faces: 'Y' });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the rows: treads and risers in rings, the aisles stepped, the throat cut through the front seven rows, the tunnel
// under the back three, and about a thousand chairs
// ---------------------------------------------------------------------------------------------------------------
function gapsFor(k) {
  const gs = AISLES.map((a) => ({ a, hw: B.AHW }));
  if (k < B.BRIDGE) gs.push({ a: 0, hw: B.THROAT });
  gs.sort((p, q) => p.a - q.a);
  return gs;
}
// the sectors of a row between its gaps: [{ a0, h0, a1, h1 }] with a1 > a0 (unwrapped)
function sectorsFor(k) {
  const gs = gapsFor(k), out = [];
  for (let i = 0; i < gs.length; i++) { const p = gs[i], q = gs[(i + 1) % gs.length]; out.push({ a0: p.a, h0: p.hw, a1: q.a + (i + 1 === gs.length ? TAU : 0), h1: q.hw }); }
  return out;
}
const tS = (sc, r) => sc.a0 + Math.asin(Math.min(0.99, sc.h0 / r));
const tE = (sc, r) => sc.a1 - Math.asin(Math.min(0.99, sc.h1 / r));
const ROW_TINT = ['#8a5a34', '#93603a', '#7f5230', '#8c5c38', '#966540', '#83552f', '#8e5d36', '#7a4e2e', '#906038', '#86582f'];

function bowlRows(game, s, r) {
  let chairs = 0, sits = 0;
  for (let k = 0; k < B.ROWS; k++) {
    const ra = rowR(k), rb = ra + B.D, y = rowY(k), yp = k ? rowY(k - 1) : 0;
    for (const sc of sectorsFor(k)) {
      // the tread and its riser, in pieces about a metre and a half long
      const arc = (tE(sc, rb) - tS(sc, rb)) * rb, n = Math.max(1, Math.ceil(arc / 1.5));
      const lerp = (rr, t) => tS(sc, rr) + (tE(sc, rr) - tS(sc, rr)) * t;
      for (let j0 = 0; j0 < n; j0 += 6) {
        s.structure((g) => {
          for (let j = j0; j < Math.min(n, j0 + 6); j++) {
            const t0 = j / n, t1 = (j + 1) / n;
            const A0 = P(ra, lerp(ra, t0), y), A1 = P(ra, lerp(ra, t1), y), B0 = P(rb, lerp(rb, t0), y), B1 = P(rb, lerp(rb, t1), y);
            g.mat('planks', ROW_TINT[k]); q4(g, A1, A0, B0, B1, 0, 1, 0);
            const m = (lerp(ra, t0) + lerp(ra, t1)) / 2;
            g.mat('paint', k % 2 ? '#3a2a22' : '#43302a'); q4(g, P(ra, lerp(ra, t0), yp), P(ra, lerp(ra, t1), yp), P(ra, lerp(ra, t1), y - 0.04), P(ra, lerp(ra, t0), y - 0.04), -Math.sin(m), 0, -Math.cos(m));
            g.mat('cast', C.brass, { rough: -0.15 }); q4(g, P(ra, lerp(ra, t0), y - 0.04), P(ra, lerp(ra, t1), y - 0.04), P(ra, lerp(ra, t1), y), P(ra, lerp(ra, t0), y), -Math.sin(m), 0, -Math.cos(m));
          }
        });
      }
      // the chairs of this row in this sector
      const rc = ra + 0.72;
      const c0 = sc.a0 + Math.asin(Math.min(0.99, (sc.h0 + 0.33) / rc)), c1 = sc.a1 - Math.asin(Math.min(0.99, (sc.h1 + 0.33) / rc));
      const nc = Math.max(1, Math.floor((c1 - c0) * rc / 0.555) + 1);
      for (let i = 0; i < nc; i++) {
        const th = nc > 1 ? c0 + (c1 - c0) * i / (nc - 1) : (c0 + c1) / 2, x = rc * Math.sin(th), z = rc * Math.cos(th);
        const yaw = Math.atan2(-x, -z) + r.f(-0.05, 0.05);
        let a = k < 2 ? 3 : k < 5 ? 2 : k < 8 ? 1 : 0;
        if (r.chance(0.18)) a = Math.max(0, Math.min(3, a + (r.chance(0.5) ? 1 : -1)));
        const w = r.pick(WOODS), j = r.f(0.92, 1.06);
        prop(s, 'lothall.chair', x, y, z, yaw, { k: r.i(0, 5), a, c: r.pick(CLOTHS) }, { tint: [w[0] * j, w[1] * j, w[2] * j], noCollide: true });
        s.post(x, z, 0.21, y, y + 0.46);
        if (chairs % 3 === 1) { s.spot('sit', x, y + 0.46, z, yaw, { tags: ['assembly', 'member', 'seat'] }); sits++; }
        chairs++;
      }
    }
  }
  // the aisles: two steps a row, brass nosings, a kerb each side, a small step light in every other riser
  for (const a of AISLES) {
    s.structure((g) => {
      g.at(0, 0, 0, a);
      for (let k = 0; k < B.ROWS; k++) {
        const ra = rowR(k), y = rowY(k);
        g.mat('stone', '#8a7a64'); g.box(-B.AHW, Math.max(0, y - 0.6), ra, B.AHW, y - 0.18, ra + 0.55, { faces: 'Yz' }); g.box(-B.AHW, Math.max(0, y - 0.6), ra + 0.55, B.AHW, y, ra + B.D, { faces: 'Yz' });
        g.mat('cast', C.brass, { rough: -0.15 }); g.box(-B.AHW, y - 0.2, ra - 0.005, B.AHW, y - 0.18, ra + 0.03, { faces: 'Yz' }); g.box(-B.AHW, y - 0.02, ra + 0.545, B.AHW, y, ra + 0.58, { faces: 'Yz' });
        g.mat('paint', '#2c2420'); for (const sx of [-1, 1]) g.box(Math.min(sx * B.AHW, sx * (B.AHW - 0.05)), 0, ra, Math.max(sx * B.AHW, sx * (B.AHW - 0.05)), y + 0.01, ra + B.D, { faces: (sx > 0 ? 'x' : 'X') + 'Y' });
      }
      // the last two steps up onto the rim
      g.mat('stone', '#8a7a64'); g.box(-B.AHW, 3.2, RIM_IN, B.AHW, 3.8, RIM_IN + 0.55, { faces: 'Yz' }); g.box(-B.AHW, 3.4, RIM_IN + 0.55, B.AHW, B.RIM, RIM_IN + 1.1, { faces: 'Yz' });
      g.mat('cast', C.brass, { rough: -0.15 }); g.box(-B.AHW, 3.78, RIM_IN - 0.005, B.AHW, 3.8, RIM_IN + 0.03, { faces: 'Yz' }); g.box(-B.AHW, B.RIM - 0.02, RIM_IN + 0.545, B.AHW, B.RIM, RIM_IN + 0.58, { faces: 'Yz' });
      g.pop();
    });
    s.deco((g) => {
      g.at(0, 0, 0, a);
      g.mat('diffuser', '#ffc880', { emissive: 0.8, lamp: true });
      for (let k = 0; k < B.ROWS; k += 2) { const ra = rowR(k), y = rowY(k); g.box(-0.3, y - 0.34, ra - 0.006, 0.3, y - 0.31, ra, { faces: 'z' }); }
      g.pop();
    });
  }
  // the throat: its walls under the cut rows, with a coping and a rail, and its floor of stone
  for (let k = 0; k < B.BRIDGE; k++) {
    const za = Math.sqrt(rowR(k) ** 2 - B.THROAT ** 2), zb = Math.sqrt((rowR(k) + B.D) ** 2 - B.THROAT ** 2), y = rowY(k);
    s.structure((g) => {
      for (const sx of [-1, 1]) {
        const x0 = Math.min(sx * B.THROAT, sx * (B.THROAT + 0.12)), x1 = Math.max(sx * B.THROAT, sx * (B.THROAT + 0.12));
        g.mat('panel', C.teal); g.box(x0, 0, za, x1, y - 0.06, zb, { faces: sx > 0 ? 'x' : 'X' });
        g.mat('stone', '#a89878'); g.box(x0 - (sx < 0 ? 0.03 : 0), y - 0.06, za, x1 + (sx > 0 ? 0.03 : 0), y + 0.03, zb, { faces: (sx > 0 ? 'x' : 'X') + 'Yz' });
        g.mat('cast', C.gilt, { rough: -0.2 }); g.box(x0, 0.95, za, x1, 0.99, zb, { faces: sx > 0 ? 'x' : 'X' });
        // the rail along the row's edge
        g.mat('cast', C.iron); const xr = sx * (B.THROAT + 0.07);
        for (const zz of [za + 0.08, (za + zb) / 2, zb - 0.08]) g.tube([[xr, y + 0.03, zz], [xr, y + 0.95, zz]], 0.016, { segs: 6 });
        g.mat('cast', C.brass, { rough: -0.2 }); g.tube([[xr, y + 0.95, za], [xr, y + 0.95, zb]], 0.024, { segs: 8 });
      }
    });
  }
  s.structure((g) => {
    g.mat('stone', '#9c8f7c'); g.box(-B.THROAT, 0, Math.sqrt(B.R0 ** 2 - B.THROAT ** 2) - 0.2, B.THROAT, 0.003, rowR(B.BRIDGE), { faces: 'Y' });
    // the tunnel: walls, soffit, the lintel over its mouth
    for (const sx of [-1, 1]) { g.mat('panel', C.teal); g.box(Math.min(sx * B.THROAT, sx * (B.THROAT + 0.1)), 0, rowR(B.BRIDGE), Math.max(sx * B.THROAT, sx * (B.THROAT + 0.1)), B.TUN, 20, { faces: sx > 0 ? 'x' : 'X' }); }
    g.mat('stone', '#9c8f7c'); g.box(-B.THROAT, 0, rowR(B.BRIDGE), B.THROAT, 0.003, 20, { faces: 'Y' });
    g.mat('paint', '#e8d8b8'); g.box(-B.THROAT, B.TUN, rowR(B.BRIDGE), B.THROAT, B.TUN + 0.02, 20, { faces: 'y' });
    g.mat('wood', C.walnut); for (let z = rowR(B.BRIDGE) + 1.2; z < 19.5; z += 1.6) g.box(-B.THROAT, B.TUN - 0.16, z - 0.08, B.THROAT, B.TUN, z + 0.08, { faces: 'yzZ' });
    g.mat('paint', C.teal); g.box(-B.THROAT - 0.15, B.TUN - 0.05, rowR(B.BRIDGE) - 0.06, B.THROAT + 0.15, rowY(B.BRIDGE) - 0.02, rowR(B.BRIDGE) + 0.02, { faces: 'zyY' });
    g.mat('cast', C.gilt, { rough: -0.2 }); g.box(-B.THROAT - 0.15, B.TUN + 0.05, rowR(B.BRIDGE) - 0.075, B.THROAT + 0.15, B.TUN + 0.09, rowR(B.BRIDGE) - 0.06, { faces: 'z' });
    g.mat('panel', '#3a2a22'); g.box(-B.THROAT - 0.15, 0, rowR(B.BRIDGE) - 0.06, -B.THROAT, B.TUN, rowR(B.BRIDGE) + 0.02, { faces: 'zx' }); g.box(B.THROAT, 0, rowR(B.BRIDGE) - 0.06, B.THROAT + 0.15, B.TUN, rowR(B.BRIDGE) + 0.02, { faces: 'zX' });
  });
  lamp(s, 'globe', 0, B.TUN - 0.05, 14.8, { K: 2700, power: 0.7, drop: 0.25, r: 0.13, range: 5, clip: [-B.THROAT, 0, rowR(B.BRIDGE), B.THROAT, B.TUN, 20.2] });
  lamp(s, 'globe', 0, B.TUN - 0.05, 18.4, { K: 2700, power: 0.6, drop: 0.25, r: 0.13, range: 4, clip: [-B.THROAT, 0, rowR(B.BRIDGE), B.THROAT, B.TUN, 20.4] });
  console.log('[lm-lot-hall] ' + chairs + ' chairs, ' + sits + ' seats for people');
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// the rim: the walkway behind the last row at y = 4, a standing rail along its front, the riser up to it
// ---------------------------------------------------------------------------------------------------------------
function bowlRim(s) {
  const seg = 48;
  for (let i = 0; i < seg; i++) {
    const a = i / seg * TAU, b = (i + 1) / seg * TAU;
    s.structure((g) => {
      g.mat('planks', '#7a4e2e'); ringFlat(g, RIM_IN, B.RW, a, b, B.RIM, 2.0);
      g.mat('felt', C.teal); ringFlat(g, 16.6, 18.0, a, b, B.RIM + 0.006, 2.0);
      g.mat('paint', '#3a2a22'); ringWall(g, RIM_IN, a, b, rowY(B.ROWS - 1), B.RIM, false, 2.0);
    }, 1);
  }
  // the standing rail: iron posts, a brass rail at elbow height, a wooden rail under it, open at the aisles
  const R = RIM_IN + 0.1;
  const gapAt = (th) => AISLES.some((a) => Math.abs(R * Math.sin(adiff(th, a))) < B.AHW + 0.05 && Math.abs(adiff(th, a)) < PI / 2);
  const n = 240;
  let run = null;
  const runs = [];
  for (let i = 0; i <= n; i++) { const th = i / n * TAU; if (gapAt(th)) { if (run) { runs.push(run); run = null; } } else { if (!run) run = []; run.push(th); } }
  if (run) runs.push(run);
  for (const rn of runs) {
    s.structure((g) => {
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube(rn.map((th) => P(R, th, B.RIM + 1.02)), 0.024, { segs: 8 });
      g.mat('wood', C.walnut); g.tube(rn.map((th) => P(R, th, B.RIM + 0.55)), 0.03, { segs: 6 });
      g.mat('cast', C.iron); for (let i = 0; i < rn.length; i += 4) { const p = P(R, rn[i], B.RIM); g.tube([p, [p[0], B.RIM + 1.02, p[2]]], 0.016, { segs: 6 }); }
    }, 1);
    for (let i = 0; i < rn.length; i += 2) { const p = P(R, rn[i], 0); s.post(p[0], p[2], 0.07, B.RIM, B.RIM + 1.05); }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the wall: dark panelling at the rim, plaster under the gallery, felt hangings over it, the doors, a cornice
// ---------------------------------------------------------------------------------------------------------------
function bowlWall(s, r) {
  const doorHalf = DOOR_W / 2 / B.RW;
  const isDoor = (th) => Math.abs(adiff(th, DOOR_A)) < doorHalf || Math.abs(adiff(th, -DOOR_A)) < doorHalf;
  // break the circle at the door edges so each door is one clean gap
  const cuts = [];
  for (let i = 0; i < 64; i++) cuts.push(i / 64 * TAU);
  for (const c of [DOOR_A - doorHalf, DOOR_A + doorHalf, TAU - DOOR_A - doorHalf, TAU - DOOR_A + doorHalf]) cuts.push(c);
  cuts.sort((p, q) => p - q); cuts.push(TAU);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1]; if (b - a < 1e-4) continue;
    const door = isDoor((a + b) / 2);
    s.structure((g) => {
      // band at the rim (y 4 to 8): panelling to 5.2, plaster above
      g.mat('flute', C.walnut); if (!door) ringWall(g, B.RW - 0.03, a, b, B.RIM, 5.2, false, 1.6);
      g.mat('plaster', '#9a6a48'); ringWall(g, B.RW, a, b, door ? B.RIM + 2.3 : 5.2, B.GY - 0.3, false, 1.6);
      // above the gallery
      g.mat('plaster', '#5e3430'); ringWall(g, B.RW, a, b, door ? B.GY + 2.3 : B.GY, B.TOP, false, 1.6);
      g.mat('wood', C.walnut); if (!door) ringWall(g, B.RW - 0.05, a, b, 5.16, 5.24, false, 1.6);
      // the cornice
      g.mat('paint', C.teal); ringWall(g, B.RW - 0.12, a, b, B.TOP - 0.55, B.TOP, false, 1.6); ringFlat(g, B.RW - 0.12, B.RW, a, b, B.TOP - 0.55, 1.6, true);
      g.mat('cast', C.gilt, { rough: -0.2 }); ringWall(g, B.RW - 0.13, a, b, B.TOP - 0.62, B.TOP - 0.55, false, 1.6);
    }, 1);
  }
  // the doors' frames, at both levels: jambs, a lintel, a brass number over each
  for (const sx of [-1, 1]) for (const y0 of [B.RIM, B.GY]) {
    const th = sx * DOOR_A;
    s.structure((g) => {
      g.at(0, 0, 0, th);
      g.mat('wood', C.walnut); g.box(-DOOR_W / 2 - 0.16, y0, B.RW - 0.1, -DOOR_W / 2, y0 + 2.45, B.RW + 0.5, { faces: 'xXzY' }); g.box(DOOR_W / 2, y0, B.RW - 0.1, DOOR_W / 2 + 0.16, y0 + 2.45, B.RW + 0.5, { faces: 'xXzY' });
      g.box(-DOOR_W / 2 - 0.16, y0 + 2.3, B.RW - 0.1, DOOR_W / 2 + 0.16, y0 + 2.5, B.RW + 0.5, { faces: 'zyY' });
      g.mat('cast', C.gilt, { rough: -0.2 }); g.box(-0.3, y0 + 2.52, B.RW - 0.06, 0.3, y0 + 2.75, B.RW - 0.03, { faces: 'z' });
      g.pop();
    }, y0 > 5 ? 2 : 1);
  }
  // the hangings: twenty-four lengths of felt over the gallery, each given by a ring of blocks, each mended
  for (let i = 0; i < 24; i++) {
    const th = (i + 0.5) / 24 * TAU, w = 2.7, hw = w / 2 / (B.RW - 0.1);
    const a = th - hw, b = th + hw, y1 = B.TOP - 0.85, y0 = y1 - r.f(3.2, 3.8);
    const col = FELTS[(i * 5) % FELTS.length], col2 = FELTS[(i * 7 + 3) % FELTS.length];
    s.deco((g) => {
      g.mat('felt', col, { sway: 0.06 });
      const p00 = P(B.RW - 0.12, a, y0), p10 = P(B.RW - 0.12, b, y0), p11 = P(B.RW - 0.12, b, y1), p01 = P(B.RW - 0.12, a, y1);
      g.sheet(p01, p11, p10, p00, { sag: 0.0, ripple: 0.025, nu: 4, nv: 2 });
      // a broad band of another felt across the foot, and a patch with a stitched edge
      g.mat('felt', col2); const q0 = P(B.RW - 0.14, a, y0 + 0.35), q1 = P(B.RW - 0.14, b, y0 + 0.35), q2 = P(B.RW - 0.14, b, y0 + 0.7), q3 = P(B.RW - 0.14, a, y0 + 0.7);
      q4(g, q0, q1, q2, q3, -Math.sin(th), 0, -Math.cos(th));
      const pa = th + (r.f(-0.3, 0.3)) * hw, pw = 0.25 / B.RW, py = r.f(y0 + 1.2, y1 - 0.8);
      g.mat('felt', pickBy(FELTS, i * 3 + 1)); q4(g, P(B.RW - 0.145, pa - pw, py), P(B.RW - 0.145, pa + pw, py), P(B.RW - 0.145, pa + pw, py + 0.42), P(B.RW - 0.145, pa - pw, py + 0.42), -Math.sin(th), 0, -Math.cos(th));
      g.mat('cast', C.brass, { rough: -0.2 }); g.tube([P(B.RW - 0.12, a - 0.01, y1 + 0.03), P(B.RW - 0.12, b + 0.01, y1 + 0.03)], 0.02, { segs: 6 });
    }, 3);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the gallery: a ring at y = 8 under the hangings, a painted parapet with a brass rail, iron columns down to the rim
// ---------------------------------------------------------------------------------------------------------------
function gallery(s) {
  const seg = 48, y = B.GY;
  for (let i = 0; i < seg; i++) {
    const a = i / seg * TAU, b = (i + 1) / seg * TAU, m = (a + b) / 2;
    s.structure((g) => {
      g.mat('planks', '#8a6040'); ringFlat(g, B.G0, B.RW, a, b, y, 2.0);
      g.mat('felt', C.madder); ringFlat(g, 16.6, 17.8, a, b, y + 0.006, 2.0);
      g.mat('wood', '#5a3a24'); ringFlat(g, B.G0, B.RW, a, b, y - 0.32, 2.0, true);
      // the parapet: teal panels, a gilt line, a cap of dark wood
      g.mat('panel', C.teal); ringWall(g, B.G0, a, b, y - 0.32, y + 1.0, false, 2.0); ringWall(g, B.G0 + 0.12, a, b, y, y + 1.0, true, 2.0);
      g.mat('cast', C.gilt, { rough: -0.2 }); ringWall(g, B.G0 - 0.006, a, b, y - 0.12, y - 0.08, false, 2.0); ringWall(g, B.G0 - 0.006, a, b, y + 0.62, y + 0.65, false, 2.0);
      g.mat('wood', C.walnut); ringFlat(g, B.G0 - 0.03, B.G0 + 0.15, a, b, y + 1.0, 2.0);
    }, 2);
    // the floor, as boxes for walking (rails and walls keep people off the overhang)
    const pa = P(B.G0, a, 0), pb = P(B.G0, b, 0), pc = P(B.RW, a, 0), pd = P(B.RW, b, 0);
    s.solid(Math.min(pa[0], pb[0], pc[0], pd[0]), y - 0.32, Math.min(pa[2], pb[2], pc[2], pd[2]), Math.max(pa[0], pb[0], pc[0], pd[0]), y, Math.max(pa[2], pb[2], pc[2], pd[2]), { surf: 'wood' });
    void m;
  }
  const n = Math.ceil(TAU * B.G0 / 0.45);
  for (let i = 0; i < n; i++) { const p = P(B.G0 + 0.06, i / n * TAU, 0); s.post(p[0], p[2], 0.1, y, y + 1.0); }
  // twelve iron columns from the rim to the gallery, teal with gilt capitals
  for (let i = 0; i < 12; i++) {
    const th = (15 + 30 * i) * PI / 180, p = P(B.G0 + 0.4, th, 0);
    s.structure((g) => {
      g.mat('cast', C.teal); g.lathe(p[0], p[2], [[0.17, B.RIM], [0.17, B.RIM + 0.12], [0.11, B.RIM + 0.2], [0.09, y - 0.7], [0.11, y - 0.6]], { segs: 12, capBottom: false });
      g.mat('cast', C.gilt, { rough: -0.2 }); g.lathe(p[0], p[2], [[0.11, y - 0.6], [0.2, y - 0.4], [0.26, y - 0.33], [0.26, y - 0.32]], { segs: 12, capBottom: false });
    }, 1);
    s.post(p[0], p[2], 0.15, B.RIM, y - 0.32);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the ceiling: a dark disc under deck 204, radial beams to a ring round the Slate, a ring duct
// ---------------------------------------------------------------------------------------------------------------
function ceiling(s) {
  const T = B.TOP, seg = 32;
  for (let i = 0; i < seg; i++) {
    const a = i / seg * TAU, b = (i + 1) / seg * TAU;
    s.structure((g) => { g.mat('paint', '#3a2622'); ringFlat(g, 0.01, B.RW, a, b, T, 2.4, true); }, 3);
  }
  for (let i = 0; i < 24; i++) {
    const th = i / 24 * TAU;
    s.structure((g) => {
      g.at(0, 0, 0, th);
      g.mat('wood', '#4a2e1e'); g.box(-0.14, T - 0.5, 6.2, 0.14, T, B.RW - 0.1, { faces: 'xXy' });
      g.mat('cast', C.gilt, { rough: -0.1 }); g.box(-0.145, T - 0.53, 6.2, 0.145, T - 0.5, B.RW - 0.1, { faces: 'y' });
      g.pop();
    }, 3);
  }
  // ring beams, and a felt-wrapped air duct round the middle
  for (const rr of [6.2, 12.6]) {
    const pts = []; for (let i = 0; i <= 48; i++) pts.push(P(rr, i / 48 * TAU, T - 0.3));
    s.structure((g) => { g.mat('wood', '#4a2e1e'); g.tube(pts, 0.2, { segs: 6 }); }, 3);
  }
  const duct = []; for (let i = 0; i <= 48; i++) duct.push(P(9.4, i / 48 * TAU, T - 0.6));
  s.deco((g) => { g.mat('felt', '#6b4a3a'); g.tube(duct, 0.2, { segs: 8 }); g.mat('cast', C.brass); for (let i = 0; i < 24; i++) { const p = P(9.4, (i + 0.5) / 24 * TAU, T - 0.6); g.cyl(p[0], p[1] - 0.24, p[2], 0.23, 0.48, { segs: 8 }); } }, 3);
}

// ---------------------------------------------------------------------------------------------------------------
// the Slate: eight boards in a ring hung over the floor, painted with the questions before the assembly this year
// ---------------------------------------------------------------------------------------------------------------
const QUESTIONS = [
  { n: 1, t: 'The question', l: 'An extra hour of full sun in the Hollow, or a larger hall fund.', st: 'To every resident · Booking Day, 17:00', c: '#e0a040' },
  { n: 2, t: 'The split', l: "The year's beam, divided: the commons, the halls, the lamps, the Margin.", st: 'Read on Booking Day, 10:00', c: '#e0a040' },
  { n: 3, t: 'Refuge', l: 'Twenty thousand places from the Margin this year for people from dark drums.', st: 'Settled · 702 to 291', c: '#8fd694' },
  { n: 4, t: 'A price for a third', l: 'Post a price for a third child, or keep giving leave out loud by block court.', st: 'Lost again · 188 to 794', c: '#ff8a6a' },
  { n: 5, t: 'Gin', l: 'Sold only in the halls, after six, where someone is always cooking.', st: 'Kept · nobody asked to count', c: '#8fd694' },
  { n: 6, t: 'A brighter dim wood', l: 'Light the front wood a little brighter for the evening walkers.', st: 'Carried to next year', c: '#a9d8c8' },
  { n: 7, t: 'Guest-right', l: 'Three nights in a Margin flat for any traveller from a drum that grants the same.', st: 'Kept · out loud', c: '#8fd694' },
  { n: 8, t: 'The Long Flight', l: 'The Spindle open end to end on the night of Booking Day, by block, till lamp-dawn.', st: 'Kept · as every year', c: '#8fd694' },
];
function wrapText(ctx, text, maxW) {
  const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function slate(game, s) {
  const A = 5.0, side = 2 * A * Math.tan(PI / 8), y0 = 9.5, h = side / 2;
  let R = null;
  if (game.atlas) {
    R = game.atlas.add(2000, 500, (ctx) => {
      ctx.save(); ctx.scale(2000 / 2048, 500 / 512);
      for (let i = 0; i < 8; i++) {
        const q = QUESTIONS[i], x = (i % 4) * 512, y = Math.floor(i / 4) * 256;
        ctx.fillStyle = '#1c2723'; ctx.fillRect(x, y, 512, 256);
        ctx.strokeStyle = 'rgba(240,226,190,0.18)'; ctx.lineWidth = 3; ctx.strokeRect(x + 10, y + 10, 492, 236);
        ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(x + 54, y + 62, 30, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1c2723'; ctx.font = '600 34px "Barlow Condensed"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(q.n), x + 54, y + 63);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f3e6c8'; ctx.font = 'italic 600 44px "Cormorant Garamond"'; ctx.fillText(q.t, x + 100, y + 76);
        ctx.fillStyle = '#e6dcc6'; ctx.font = '25px "Barlow"';
        const ls = wrapText(ctx, q.l, 440); ls.slice(0, 3).forEach((ln, j) => ctx.fillText(ln, x + 36, y + 128 + j * 32));
        ctx.fillStyle = q.c; ctx.font = '600 23px "Barlow Condensed"'; ctx.fillText(q.st.toUpperCase(), x + 36, y + 228);
        ctx.fillStyle = 'rgba(240,226,190,0.08)'; for (let k = 0; k < 6; k++) ctx.fillRect(x + 300 + k * 30, y + 214, 18, 3);
      }
      ctx.restore();
    }, 'lothall-slate');
  }
  // each board leans out at the top, so it looks down at the rows; drawn in its own frame: x along it, y up it, z out
  const tilt = 0.28;
  for (let i = 0; i < 8; i++) {
    const phi = i / 8 * TAU, cx = A * Math.sin(phi), cz = A * Math.cos(phi);
    const world = (lx, ly, lz) => { const yy = ly * Math.cos(tilt) - lz * Math.sin(tilt), zz = ly * Math.sin(tilt) + lz * Math.cos(tilt); return [cx + lx * Math.cos(phi) + zz * Math.sin(phi), y0 + yy, cz - lx * Math.sin(phi) + zz * Math.cos(phi)]; };
    if (R) s.deco((g) => {
      const u0 = R.u0 + (R.u1 - R.u0) * (i % 4) / 4, u1 = R.u0 + (R.u1 - R.u0) * (i % 4 + 1) / 4;
      const vt = R.v0 + (R.v1 - R.v0) * Math.floor(i / 4) / 2, vb = R.v0 + (R.v1 - R.v0) * (Math.floor(i / 4) + 1) / 2;
      g.at(cx, y0, cz, phi); g.rotX(tilt);
      g.atlas(R.page, { emissive: 0.9, lamp: true });
      g.quad([-side / 2, 0, 0.02], [side / 2, 0, 0.02], [side / 2, h, 0.02], [-side / 2, h, 0.02], { uv: [u0, vb, u1, vt] });
      g.pop();
    }, 3);
    // the frame: a dark board behind, a walnut moulding top and bottom, a gilt line, a strip of lamp glass under it
    s.structure((g) => {
      g.at(cx, y0, cz, phi); g.rotX(tilt);
      g.mat('wood', '#2c1a12'); g.box(-side / 2, 0, -0.06, side / 2, h, 0.0, { faces: 'zZxX' });
      g.mat('wood', C.walnut); g.box(-side / 2 - 0.06, -0.22, -0.12, side / 2 + 0.06, 0, 0.08, { faces: 'yYzZ' }); g.box(-side / 2 - 0.06, h, -0.12, side / 2 + 0.06, h + 0.26, 0.08, { faces: 'yYzZ' });
      g.mat('cast', C.gilt, { rough: -0.15 }); g.box(-side / 2 - 0.06, h + 0.26, 0.04, side / 2 + 0.06, h + 0.3, 0.09, { faces: 'yYZ' }); g.box(-side / 2 - 0.06, -0.26, 0.04, side / 2 + 0.06, -0.22, 0.09, { faces: 'yYZ' });
      g.mat('diffuser', '#ffe0a8', { emissive: 2.2, lamp: true }); g.box(-side / 2, -0.24, 0.0, side / 2, -0.2, 0.06, { faces: 'y' });
      g.pop();
      // the rods up to the ceiling from each top corner
      g.mat('cast', C.iron); for (const sx of [-1, 1]) { const q = world(sx * side / 2, h + 0.3, -0.02); g.tube([q, [q[0] * 1.15, B.TOP - 0.02, q[2] * 1.15]], 0.018, { segs: 5 }); }
    }, 3);
  }
  // a ring of lamp glass under the Slate, and its rose on the ceiling
  s.deco((g) => {
    g.mat('cast', C.gilt, { rough: -0.1 }); g.lathe(0, 0, [[1.4, B.TOP - 0.05], [1.2, B.TOP - 0.25], [0.6, B.TOP - 0.4], [0, B.TOP - 0.42]], { segs: 24 });
    g.mat('cast', C.iron); g.tube([[0, B.TOP - 0.4, 0], [0, y0 - 0.3, 0]], 0.03, { segs: 6 });
    g.mat('diffuser', '#fff0d0', { emissive: 4.5, lamp: true }); g.lathe(0, 0, [[0.5, y0 - 0.32], [0.36, y0 - 0.45], [0, y0 - 0.48]], { segs: 18, capBottom: false });
  }, 3);
  s.interact({ x: 0, y: 1.0, z: 3.0, radius: 1.3, prompt: 'Read the Slate', onUse: readSlate });
  for (const sx of [-1, 1]) s.interact({ x: sx * 6.6, y: B.GY + 1.0, z: 16.9, radius: 1.5, prompt: 'Read the Slate across the hall', onUse: readSlate });
}
async function readSlate(game) {
  await say(game, 'The Slate', [
    'Eight boards hung in a ring over the floor, so whichever chair you are given, one of them faces you. The questions before the assembly this year, chalked over and repainted as they move.',
    'One: an extra hour of full sun in the Hollow, or a larger hall fund. That one goes to every resident on Booking Day. The assembly could not settle it, so the drum will.',
    'Three: twenty thousand places from the Margin this year for refuge. Settled, 702 to 291. Four: a price for a third child. Lost again, 188 to 794, as it is every few years.',
    'The rest are marked kept: gin in the halls after six, guest-right, the Long Flight. Under the one about the dim wood someone has chalked, small: next year, then.',
  ]);
  find(game, 'drawn-by-lot');
}

// ---------------------------------------------------------------------------------------------------------------
// on the floor: the speaker's stool, the Churn and its turning cage, the clerks' table, the minutes
// ---------------------------------------------------------------------------------------------------------------
function floorThings(game, s, f) {
  prop(s, 'lothall.stool', 0, 0.15, 0, 0.4, {});
  s.spot('sit', 0, 0.15 + 0.78, 0, PI, { tags: ['speaker'] });
  s.interact({ x: 0, y: 0.9, z: 0, radius: 1.3, prompt: (gm) => (gm.player && gm.player.seat ? 'Stand up' : 'Sit on the speaker\'s stool'), async onUse(gm) {
    const p = gm.player; if (!p) return;
    if (p.seat) { p.stand(); return; }
    p.sit({ x: 0, y: 0.15 + 0.3, z: 0, yaw: 0, eye: 1.3 }); p.yaw = 0; p.pitch = 0.28;
    if (gm.flags.lhStool) { toast(gm, 'The stool turns under you, a little stiffly. A thousand chairs, every one of them facing you.'); return; }
    gm.flags.lhStool = true;
    await say(gm, 'The speaker\'s stool', [
      'A tall stool with a turning seat, the felt worn through to the weave in the middle. There is no lectern in the Bowl and never has been.',
      'Whoever has the floor sits here, in the middle, low enough that the front row can see their feet. A lectern has a front and a back. A stool turns, so the speaker faces each part of the Bowl in turn, and nobody stands over anybody.',
      'Carved round the edge of the seat in small letters: SIT DOWN TO SAY IT.',
    ]);
  } });

  // the Churn: its frame is still, its cage turns; a prompt turns it and draws a token
  const [cx, , cz] = CHURN_AT;
  prop(s, 'lothall.churnframe', cx, 0, cz, 0, {});
  const cage = turning(s, cx, CHURN.ax, cz, 0.95, drawChurnCage, 'x');
  let ang = 0.3, spin = 0, busy = false;
  cage.set(ang);
  s.every((dt) => {
    if (spin <= 0.001) return;
    ang += spin * Math.min(0.1, dt); spin *= Math.exp(-0.45 * Math.min(0.1, dt)); if (spin < 0.05) spin = 0;
    cage.set(ang);
  });
  s.interact({ x: cx, y: 1.0, z: cz + 1.1, radius: 1.3, prompt: 'Turn the Churn', async onUse(gm) {
    if (busy) return; busy = true;
    try {
      spin = 5.5; sfx(gm, 'clunk', f, cx, 1.0, cz);
      for (let i = 0; i < 6; i++) setTimeout(() => sfx(gm, 'drum-tap', f, cx, 0.8, cz, { vol: 0.35 }), 250 + i * 330);
      await new Promise((res) => setTimeout(res, 2600));
      const n = 1 + Math.floor(Math.random() * 1000), row = Math.min(9, Math.floor((n - 1) / 100)), seatN = 1 + ((n * 37) % 97);
      sfx(gm, 'bell', f, cx, 1.0, cz);
      const lines = [
        'The cage turns, the tokens slide and clatter round inside it, and it slows. You open the little door and take one out: a disc of pale wood, number ' + n + ' cut into it, its edge worn round by hands.',
      ];
      if (!gm.flags.lhChurn) {
        gm.flags.lhChurn = true;
        lines.push('In a real draw the clerk turns it once for every seat, and each number is read against the roll of every resident of Chervil, all one hundred and ninety-four million of them, by the batch hatch down the corridor, overnight. About a thousand names come out each year.');
        lines.push('The number is also the chair. Whoever is drawn sits in that seat for their year, and carves their name under its arm when they go.');
      } else lines.push('Token ' + n + ': row ' + (row + 1) + ', seat ' + seatN + '. You put it back through the door for the next person.');
      await say(gm, 'The Churn', lines);
      find(gm, 'drawn-by-lot');
    } finally { busy = false; }
  } });
  sign(s, { kind: 'plate', text: 'THE CHURN', lines: ['turn it gently · it is older than the drum\'s Margin'] }, cx, 0.6, cz + 0.52, { face: 'Z', w: 0.5, h: 0.16 });
  s.spot('work', cx + 0.15, 0, cz + 1.0, PI, { tags: ['lot', 'clerk', 'write'] });

  // the clerks of the floor: one long table, two at work on the minutes
  const [dx, , dz] = DESK_AT, dyaw = Math.atan2(-dx, -dz);
  prop(s, 'lothall.clerkdesk', dx, 0, dz, dyaw, { w: 1.7 });
  const fx = Math.sin(dyaw), fz = Math.cos(dyaw), rx = Math.cos(dyaw), rz = -Math.sin(dyaw);
  for (const o of [-0.42, 0.42]) {
    const px = dx - fx * 0.62 + rx * o, pz = dz - fz * 0.62 + rz * o;
    prop(s, 'chair', px, 0, pz, dyaw, { wood: '#3a2a20', seat: C.teal });
    s.spot('work', px + fx * 0.15, 0, pz + fz * 0.15, dyaw, { tags: ['write', 'notes', 'clerk'] });
  }
  s.interact({ x: dx + fx * 0.8, y: 1.0, z: dz + fz * 0.8, radius: 1.2, prompt: 'Read the minutes', onUse(gm) {
    say(gm, 'The minutes', [
      'Two ledgers open side by side, in two hands. Every word said from the stool is written down here, and read back at the start of the next sitting, and anybody in Chervil may ask for a page.',
      'The last sitting, in full: the hall fund and the hour of sun, argued for three hours and not settled, so sent to the drum. A member from deck 31 asked that the minutes record she had changed her mind twice. They do.',
      'At the foot of the page, in the second hand: tea ran out at nine. Send to the Urn earlier.',
    ]);
  } });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// light: the Slate's own pool on the floor, two rings of pendants over the rows, the gallery's soffit, the hangings
// ---------------------------------------------------------------------------------------------------------------
function bowlLights(s) {
  lamp(s, 'spot', 0, 10.25, 0, { K: 3300, power: 9, range: 13, cone: [30, 14], clip: CLIP });
  s.glowCard(0, 0.02, 0, { face: 'y', color: '#ffd9a0', size: 6.5, strength: 0.1, follow: 'lamps' });
  for (let i = 0; i < 4; i++) { const p = P(3.0, (i + 0.5) / 4 * TAU, 10.2); lamp(s, 'bulb', p[0], p[1], p[2], { K: 3000, power: 5.0, range: 12, clip: CLIP }); }
  for (let i = 0; i < 8; i++) { const p = P(9.6, (i + 0.5) / 8 * TAU, 8.6); lamp(s, 'globe', p[0], p[1], p[2], { K: 2700, power: 2.2, range: 10, drop: B.TOP - 8.6 - 0.3, r: 0.22, clip: CLIP }); }
  for (let i = 0; i < 8; i++) { const p = P(13.4, i / 8 * TAU, 9.8); lamp(s, 'globe', p[0], p[1], p[2], { K: 2700, power: 1.7, range: 9, drop: B.TOP - 9.8 - 0.3, r: 0.2, clip: CLIP }); }
  // under the gallery, along the rim: tubes in the soffit
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.1) / 12 * TAU, b = (i + 0.9) / 12 * TAU, pa = P(17.6, a, B.GY - 0.36), pb = P(17.6, b, B.GY - 0.36);
    s.light({ at: pa, to: pb, type: 'tube', color: [1.0, 0.72, 0.45], power: 1.5, range: 5.0, radius: 0.15, lamp: true, clip: CLIP });
    s.deco((g) => { g.mat('diffuser', '#ffd9a0', { emissive: 0.8, lamp: true }); g.tube([pa, pb], 0.025, { segs: 5 }); }, 1);
  }
  // washers on the hangings, hidden behind the gallery's parapet cap
  for (let i = 0; i < 8; i++) { const p = P(15.8, (i + 0.25) / 8 * TAU, 12.8); lamp(s, 'bulb', p[0], p[1], p[2], { K: 2600, power: 2.6, range: 9, clip: CLIP }); }
  s.ambient({ box: CLIP, sky: '#ffcf96', ground: '#9a6a44', power: 0.1, soft: 1.5, spec: 0.4, lamp: true });
}

// ---------------------------------------------------------------------------------------------------------------
// people, walkways, things to do, zones and sound
// ---------------------------------------------------------------------------------------------------------------
const NAMES_UNDER = [
  ['Ilse Varga, 271', 'O. Mensah', 'Tam, deck 140, who said no once', 'Ruth Achterberg', 'a small drawn ladle and no name'],
  ['Kofi Lindahl', 'Petra, 9 Ring, in the year of the cold dairy', 'B. Okoro', 'Sandor', 'H. & H.', 'Wen Taufa, speaker'],
  ['Anouk', 'Desta Haile', 'Mirela, who argued for the dim wood and lost', 'Jun Takeda', 'a date too worn to read'],
  ['Aino Laine, for her mother', 'Caius', 'Gulnara Seitkali', 'T. Ferrand', 'ASK THE URN FOR THE SECOND POT'],
];
function bowlLife(game, s, f, r) {
  // walkways: in through the tunnel to the floor, round the floor, up every aisle, round the rim, round the gallery
  s.path([[0, 0, 33], [0, 0, 21], [0, 0, 16], [0, 0, 12.3], [0, 0, 6], [0, 0, 3.8]], { width: 1.6 });
  const ring = []; for (let i = 0; i <= 12; i++) ring.push(P(3.9, i / 12 * TAU, 0));
  s.path(ring, { width: 1.2 });
  for (const a of AISLES) {
    const pts = [P(3.9, a, 0)];
    for (let k = 0; k < B.ROWS; k++) { const rr = rowR(k) + 0.24; pts.push(P(rr, a, rampY(rr))); }
    pts.push(P(16.4, a, B.RIM)); pts.push(P(17.3, a, B.RIM));
    s.path(pts, { width: 1.0 });
  }
  const rim = []; for (let i = 0; i <= 36; i++) rim.push(P(17.3, i / 36 * TAU, B.RIM));
  s.path(rim, { width: 1.6 });
  const gal = []; for (let i = 0; i <= 36; i++) gal.push(P(17.2, i / 36 * TAU, B.GY));
  s.path(gal, { width: 1.4 });
  for (const sx of [-1, 1]) {
    const pr = P(17.3, sx * DOOR_A, B.RIM), pg = P(17.2, sx * DOOR_A, B.GY);
    s.path([pr, [sx * DOOR_X, B.RIM, 19.2], [sx * DOOR_X, B.RIM, 21.6]], { width: 1.2 });
    s.path([pg, [sx * DOOR_X, B.GY, 19.2], [sx * DOOR_X, B.GY, 21.4]], { width: 1.2 });
  }
  // standing at the rim's rail and at the gallery's parapet
  for (let i = 0; i < 14; i++) {
    const th = (i + 0.5) / 14 * TAU; if (AISLES.some((a) => Math.abs(adiff(th, a)) < 0.12)) continue;
    const p = P(RIM_IN + 0.45, th, B.RIM); s.spot('stand', p[0], p[1], p[2], Math.atan2(-p[0], -p[2]), { tags: ['rail', 'view'] });
  }
  for (let i = 0; i < 18; i++) {
    const th = (i + 0.3) / 18 * TAU, p = P(B.G0 + 0.45, th, B.GY);
    s.spot('stand', p[0], p[1], p[2], Math.atan2(-p[0], -p[2]) + r.f(-0.2, 0.2), { tags: ['gallery', 'rail', 'board'] });
  }
  // two talking on the floor by the Churn, three at the throat's mouth
  s.spot('chat', -3.2, 0, 1.4, 2.3, { tags: ['floor'] }); s.spot('chat', -2.5, 0, 2.2, -2.0, { tags: ['floor'] });
  s.spot('chat', -0.9, 0, 9.0, 0.8, {}); s.spot('chat', 0.6, 0, 9.4, -2.2, {}); s.spot('chat', 0.2, 0, 8.3, PI, {});

  // sit in the Bowl: a few chairs at the aisle ends invite you; the front row's arms have names under them
  let ni = 0;
  for (const k of [0, 3, 6, 9]) {
    for (const a of AISLES) {
      if ((ni++ + k) % 2) continue;
      const rc = rowR(k) + 0.72, th = a + Math.asin((B.AHW + 0.33) / rc), x = rc * Math.sin(th), z = rc * Math.cos(th), yaw = Math.atan2(-x, -z);
      if (k === 0) {
        const names = NAMES_UNDER[(ni + k) % NAMES_UNDER.length];
        s.interact({ x, y: rowY(k) + 0.7, z, radius: 0.9, prompt: 'Feel under the chair\'s arm', onUse(gm) {
          say(gm, 'Under the arm', [
            'The front rows are the oldest chairs in the Bowl. Nobody throws a chair away: when one breaks it goes to the remakers and comes back, and a new one costs about a hundred and twenty-five kays of mass.',
            'Under this arm the wood is soft with carving, names on names, in every hand there has been: ' + names.join('; ') + '.',
            'There is a little room left near the back leg. Someone has pencilled a line there, ready.',
          ]);
        } });
      } else {
        seat(s, x, rowY(k), z, yaw, 'Sit in the Bowl', { onSit(gm) {
          const h = hour(gm);
          toast(gm, h >= 17 && h < 21.5 ? 'A member two seats along shifts her coat off the chair for you and goes back to her notes.' : 'The Bowl rises round you. From here the stool looks very small and very far down.');
        } });
      }
    }
  }
  // the gallery's notice by each door
  for (const sx of [-1, 1]) {
    const p = P(B.RW - 0.06, sx * (DOOR_A + 0.09), B.GY + 1.6);
    sign(s, { kind: 'notice', title: 'The public gallery', lines: ['Open whenever the Bowl sits.', 'Anyone may watch. Nobody may call down.', 'Notes may be passed by the doorkeeper.'], palette: [C.cream, C.ink, C.madder] }, p[0], p[1], p[2] - 0.02, { face: 'z', w: 0.62, h: 0.48, level: 2 });
  }
  s.interact({ x: 0, y: B.GY + 1.0, z: 17.0, radius: 1.6, prompt: 'Look down into the Bowl', onUse(gm) {
    say(gm, 'The gallery', [
      'From up here the chairs make rings like a cut tree, darker and more mended toward the middle. About a thousand of them: one seat for every two hundred thousand people in Chervil, drawn by lot each year.',
      'Nobody here stood for anything or asked to be chosen. They were drawn, they came, and next year they will be back in the gallery with everyone else, watching the next thousand.',
    ]);
    find(gm, 'drawn-by-lot');
  } });

  // zones
  s.zoneBox({ id: 'lh-bowl', place: 'lot-hall', box: [-B.RW - 0.4, -0.5, -B.RW - 0.4, B.RW + 0.4, B.TOP, B.RW + 0.4], name: 'The Bowl', sub: SUB, ambience: 'quiet', reverb: 'hall', headroom: B.TOP, env: ENV_BOWL });
  s.zoneBox({ id: 'lh-gallery', place: 'lot-hall', box: [-B.RW - 0.4, B.GY - 0.1, -B.RW - 0.4, B.RW + 0.4, B.TOP, B.RW + 0.4], name: 'The public gallery', sub: 'the lot hall · deck 202 · Ring Five', ambience: 'quiet', reverb: 'hall', headroom: B.TOP - B.GY, env: ENV_BOWL });
  s.zoneBox({ id: 'lh-tunnel', place: 'lot-hall', box: [-B.THROAT, -0.5, rowR(B.BRIDGE), B.THROAT, B.TUN, 20], name: 'The floor door', sub: SUB, ambience: 'quiet', reverb: 'room', headroom: B.TUN });
  // sound: the Bowl's own murmur, fuller in the evening when it sits; the air handlers high up
  const mur = s.loop('murmur', 0, 2.5, 0, { vol: 0.2, radius: 24, param: 0.3 });
  s.loop('air', 0, B.TOP - 1, 0, { vol: 0.1, radius: 22 });
  let seen = false, tm = 0;
  s.every((dt, gm) => {
    if (!gm || !gm.zone || gm.zone.scope !== s) return;
    if (!seen && (gm.zone.id === 'lh-bowl' || gm.zone.id === 'lh-gallery')) { seen = true; toast(gm, 'A thousand chairs in rings, and none of them match.'); }
    tm -= dt; if (tm > 0) return; tm = 2;
    const h = hour(gm), sit = h >= 17.5 && h < 21.5 ? 1 : h >= 9 && h < 17.5 ? 0.45 : 0.12;
    if (mur && mur.set) mur.set({ vol: 0.08 + 0.3 * sit, param: 0.15 + 0.6 * sit });
  });
  void game; void f;
}
