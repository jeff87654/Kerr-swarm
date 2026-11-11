// Lid Island and the Cold Rows: a landmark in the Hollow, on and beside Chervil's lake.
//   1. The rope ferry: two flat-bottomed boats on one endless rope, from a mooring beside the end of the first game's
//      jetty to a landing stage on Lid Island 434 m out. When one crosses, the other comes home; they pass mid-lake.
//   2. Lid Island (lm_hollow_island_isle.js): the old orchard, the Settle, the rail, the Kettle, the lanterns, the high board.
//   3. The Cold Rows (lm_hollow_island_winter.js): four winter tents at four degrees on the near shore, and the rows just
//      out of winter in blossom with the brush crew up their ladders.
// The cab sets you down at the lift pavilion nearest the place, on the meadow above the shore at (170, 1580).
import { lamp } from '../world/kit.js';
import { sign } from '../world/signs.js';
import { heightAt, LAND, nearestPavilion } from '../world/land.js';
import { smoother } from '../core/util.js';
import { gy, say, toast, sfx, signpost } from './hollow_parts.js';
import { IP, who, pick, movingMesh, drawBoat } from './lm_hollow_island_parts.js';
import { buildIsland, STAGE } from './lm_hollow_island_isle.js';
import { buildWinter } from './lm_hollow_island_winter.js';

const W = LAND.WATER;
const frameWait = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });

// the rope: from the boat's berth by the jetty (J) to its berth along the island's stage (I)
const J = [167.5, 1797.2], I = [599.5, 1753.1];
const DX = I[0] - J[0], DZ = I[1] - J[1], L = Math.hypot(DX, DZ), UX = DX / L, UZ = DZ / L, NX = -UZ, NZ = UX;
const YAW = Math.atan2(-UZ, UX);                 // turns the boat's local +x onto the line
const at = (sPos, side) => { const bow = side * 3.4 * Math.sin(Math.PI * Math.min(1, Math.max(0, sPos / L))); return [J[0] + UX * sPos - NX * bow, J[1] + UZ * sPos - NZ * bow]; };
const JY = 0.38;                                  // the first game's jetty deck

export const place = {
  id: 'lm-hollow-island', name: 'Lid Island and the Cold Rows', order: 10,
  region: 'hollow-island',
  near: { frame: 'hollow', x: 420, z: 1780, r: 430 },
  stops: [{ id: 'hollow-island', name: 'Lid Island and the Cold Rows', sub: 'the Hollow · the lake shore · rope ferry and winter tents', group: 'The Hollow', spawn: 'hollow-island', deck: 376, zd: 1780 }],
  async build(game) {
    const t0 = performance.now(), ms = [];
    const f = game.world.frame('hollow', 1500, 0, 0);
    const zones = [];
    let t = performance.now();
    buildFerry(game, f, zones); ms.push(performance.now() - t);
    await frameWait();
    t = performance.now(); buildIsland(game, f, zones); ms.push(performance.now() - t);
    await frameWait();
    t = performance.now(); buildWinter(game, f, zones); ms.push(performance.now() - t);
    // the spawn, beside the lift pavilion on the meadow, with a signpost
    const q = nearestPavilion(180, 1590, {});
    game.spawns['hollow-island'] = { frame: f, x: q.x + 2.5, y: heightAt(q.x, q.z) + 0.14, z: q.z, yaw: Math.PI / 2 };
    {
      const s = game.world.scope('lmhi-spawn', f);
      signpost(s, q.x + 4.6, q.z - 2.6, [
        { dir: 'z', text: 'The Cold Rows', sub: 'winter tents · 40 m', col: '#e9f1f5' },
        { dir: 'Z', text: 'Rope ferry', sub: 'to Lid Island · 230 m', col: '#efe6d2' },
        { dir: 'x', text: 'Lake pavilion', sub: 'and the green · 200 m', col: '#efe6d2' },
      ]);
      s.finish();
    }
    // the zones follow the land's day, dusk and night beds, as the first game's do
    const zs = zones.filter((z) => z.ambience && z.ambience.indexOf('hollow') === 0);
    game.events.on('prerender', () => { const lz = game.hollow && game.hollow.zone; if (!lz) return; for (const z of zs) z.ambience = lz.ambience; });
    console.log('[lm-hollow-island] built in ' + (performance.now() - t0).toFixed(0) + ' ms (ferry ' + ms[0].toFixed(0) + ', island ' + ms[1].toFixed(0) + ', winter ' + ms[2].toFixed(0) + ')');
  },
};

// ===================================================================================================================
// The rope ferry
// ===================================================================================================================
function buildFerry(game, f, zones) {
  const s = game.world.scope('lmhi-ferry', f), g = s.g;
  // ---- the two posts by the jetty: a pulley dolphin behind the berth, and the bell post beside the jetty's end
  const post = (x, z, h, withWheel) => {
    const yb = Math.min(gy(x, z), W - 1.0) - 0.4;
    s.furniture(() => {
      g.mat('wood', '#4f4438'); for (const [dx, dz] of [[-0.16, -0.1], [0.16, -0.1], [0, 0.17]]) g.lathe(x + dx, z + dz, [[0.13, yb], [0.13, h - 0.1], [0.11, h]], { segs: 8 });
      g.mat('weave', '#b49a6e'); for (const yy of [h - 0.5, W + 0.4]) g.lathe(x, z, [[0.36, yy], [0.37, yy + 0.06], [0.36, yy + 0.12]], { segs: 10, capTop: false, capBottom: false });
      g.mat('paint', IP.saffron); g.lathe(x, z, [[0.3, h], [0.34, h + 0.04], [0.3, h + 0.08], [0, h + 0.09]], { segs: 10 });
      if (withWheel) {
        g.mat('cast', IP.iron); g.box(x - 0.06, h - 0.2, z - 0.42, x + 0.06, h + 0.25, z + 0.42);
        g.push(); g.move(x, h + 0.02, z); g.rotZ(Math.PI / 2); g.mat('cast', IP.brass); g.cyl(0, -0.09, 0, 0.36, 0.18, { segs: 18 }); g.pop();
      }
    });
    s.post(x, z, 0.32, yb, h);
  };
  post(163.2, 1796.9, 1.25, true);
  post(171.3, 1797.1, 1.45, false);
  // the bell on the post by the end of the jetty, and the rope from the pulley running down into the lake toward the island
  s.furniture(() => {
    g.mat('cast', IP.iron); g.tube([[171.3, 1.5, 1797.1], [171.3, 2.1, 1797.1], [171.0, 2.25, 1797.1]], 0.02, { segs: 5 });
    g.mat('cast', IP.brass); g.lathe(170.9, 1797.1, [[0.0, 1.8], [0.11, 1.82], [0.12, 1.95], [0.08, 2.08], [0.02, 2.14], [0, 2.14]], { segs: 12 });
    g.mat('weave', '#c9b48a'); g.tube([[163.2, 1.27, 1797.25], [165.5, W + 0.3, 1797.0], [168, W - 0.5, 1796.5]], 0.025, { segs: 5 });
    g.tube([[163.2, 1.27, 1796.55], [162.0, W + 0.2, 1795.6], [160.5, W - 0.5, 1795.0]], 0.025, { segs: 5 });
  });
  sign(s, { kind: 'notice', title: 'The rope ferry', lines: ['To Lid Island, 434 m.', 'Two boats, one rope: when', 'one crosses, the other', 'comes home. Free.', 'Lamp-dawn to nine, the', 'first boats are for the', 'oldest. Ring and sit.'] }, 171.3 - 0.36, 1.0, 1797.1, { face: 'x', w: 0.5, h: 0.68 });
  lamp(s, 'pole', 163.2, 1.3, 1796.9, { h: 1.2, K: 2800, power: 0.6, range: 8, night: true });
  // the island's end: the winch post on the beach with its little motor house, and the bell
  const WX = 604.3, WZ = 1752.2, wy = gy(WX, WZ);
  s.furniture(() => {
    g.mat('paint', '#2f6f73'); g.box(WX - 0.55, wy - 0.1, WZ - 0.45, WX + 0.55, wy + 0.9, WZ + 0.45, { bevel: 0.03 });
    g.mat('flute', '#a8503a'); g.box(WX - 0.65, wy + 0.9, WZ - 0.55, WX + 0.65, wy + 0.97, WZ + 0.55, { bevel: 0.01 });
    g.mat('cast', IP.iron); g.box(WX - 0.75, wy + 0.2, WZ - 0.08, WX - 0.55, wy + 0.75, WZ + 0.08);
    g.push(); g.move(WX - 0.82, wy + 0.5, WZ); g.rotZ(Math.PI / 2); g.mat('cast', IP.brass); g.cyl(0, -0.08, 0, 0.42, 0.16, { segs: 18 }); g.pop();
    g.mat('plain', '#e7b547'); g.box(WX - 0.2, wy + 0.5, WZ + 0.452, WX + 0.25, wy + 0.72, WZ + 0.456, { faces: 'Z' });
    g.mat('weave', '#c9b48a'); g.tube([[WX - 0.9, wy + 0.5, WZ - 0.2], [WX - 2.5, W + 0.1, WZ - 1.0], [WX - 4.5, W - 0.5, WZ - 1.6]], 0.025, { segs: 5 });
    g.mat('cast', IP.iron); g.tube([[WX + 0.4, wy + 0.97, WZ + 0.3], [WX + 0.4, wy + 1.7, WZ + 0.3], [WX + 0.2, wy + 1.85, WZ + 0.3]], 0.02, { segs: 5 });
    g.mat('cast', IP.brass); g.lathe(WX + 0.12, WZ + 0.3, [[0.0, wy + 1.42], [0.1, wy + 1.44], [0.11, wy + 1.56], [0.07, wy + 1.68], [0, wy + 1.72]], { segs: 12 });
  });
  s.solid(WX - 0.9, wy - 0.1, WZ - 0.55, WX + 0.65, wy + 0.97, WZ + 0.55);
  sign(s, { kind: 'plate', text: 'ROPE FERRY WINCH', sub: 'Lid Island end · do not oil the bell', palette: ['#efe6d2', '#2b2a26', '#2f6f73'] }, WX + 0.3, wy + 0.62, WZ + 0.46, { face: 'Z', w: 0.5, h: 0.17 });

  // ---- the boats: moving meshes, one at each end at rest
  const boats = [
    { mm: movingMesh(s, (bg) => drawBoat(bg, { hull: '#2f5f5a', gun: '#d9472b', cushions: ['#e7b547', '#b8336a'], lantern: '#f2b56b', yaw: YAW }), { radius: 4.5 }), sPos: 0, side: 1, phase: 0.3 },
    { mm: movingMesh(s, (bg) => drawBoat(bg, { hull: '#6a2f3a', gun: '#e7b547', cushions: ['#2f8f8a', '#efe6d2'], lantern: '#e07a6a', yaw: YAW }), { radius: 4.5 }), sPos: L, side: -1, phase: 1.9 },
  ];
  let clock = 0, anim = null, riding = false;
  const place = (b) => { const p = at(b.sPos, b.side); const o = b.mm.origin; o[0] = p[0]; o[2] = p[1]; o[1] = W - 0.06 + Math.sin(clock * 0.85 + b.phase) * 0.045; };
  boats.forEach(place);
  s.every((dt, gm) => {
    clock += dt;
    if (anim) { anim.t += dt; const k = Math.min(1, anim.t / anim.dur); anim.fn(k); if (k >= 1) { const res = anim.res; anim = null; res(); } }
    for (const b of boats) place(b);
    if (riding && riding.seat) { const b = riding.boat, p = at(b.sPos, b.side); const lx = riding.lx; riding.seat.x = p[0] + UX * lx; riding.seat.z = p[1] + UZ * lx; riding.seat.y = b.mm.origin[1] + 0.45; const pl = gm.player; pl.pos.x = riding.seat.x; pl.pos.z = riding.seat.z; pl.pos.y = riding.seat.y; }
  });
  const run = (dur, fn) => new Promise((res) => { anim = { t: 0, dur, fn, res }; });
  const ease = (k) => smoother(k);

  // ---- the crossing
  async function cross(gm, toIsland) {
    if (riding) return;
    const p = gm.player, ui = gm.ui;
    const boat = boats.find((b) => (toIsland ? b.sPos < 1 : b.sPos > L - 1)), other = boats.find((b) => b !== boat);
    if (!boat || !other) return;
    gm.busy = (gm.busy || 0) + 1;
    const dir = toIsland ? 1 : -1, s0 = boat.sPos, s1 = toIsland ? L : 0, o0 = other.sPos;
    riding = { boat, lx: toIsland ? -1.7 : 1.7, seat: null };
    try {
      sfx(gm, 'bell', f, toIsland ? 170.9 : WX + 0.12, 2.0, toIsland ? 1797.1 : WZ + 0.3);
      if (ui) await ui.fade(true, 0.45);
      const bp = at(boat.sPos, boat.side);
      riding.seat = { x: bp[0] + UX * riding.lx, y: boat.mm.origin[1] + 0.45, z: bp[1] + UZ * riding.lx, yaw: Math.atan2(UX * dir, UZ * dir), eye: 0.95 };
      p.place(f, riding.seat.x, riding.seat.y, riding.seat.z, Math.atan2(UX * dir, -UZ * dir), -0.02);
      p.sit(riding.seat); p.locked = true;
      if (ui) await ui.fade(false, 0.6);
      toast(gm, pick(['The rope comes up out of the lake ahead, runs through the guides on the gunwale and goes back in behind. Somewhere a winch takes up the slack.', 'The boat leaves the berth at a fast walk. The rope hums a little in its sheaves; the water talks along the planks.'], gm.flags && gm.flags.lmhiCrossed ? 1 : 0));
      // leaving: fifteen metres, gathering way
      await run(7, (k) => { const d = 15 * ease(k) * k; boat.sPos = s0 + dir * d; other.sPos = o0 - dir * d; });
      if (ui) await ui.fade(true, 0.5);
      // the middle: the other boat comes past, going home
      const m0 = L / 2 - dir * 9;
      boat.sPos = m0; other.sPos = L - m0;
      if (ui) await ui.fade(false, 0.6);
      toast(gm, toIsland ? 'Halfway. The other boat comes past going home, empty but for its cushions, close enough to touch a hand to. Behind you the jetty is a matchstick; ahead the island is a green lid on the water.' : 'Halfway. The other boat passes going out, somebody very old in it with a rug over their knees, who lifts a hand to you and does not stop talking to their friend.');
      await run(7, (k) => { const d = 18 * k; boat.sPos = m0 + dir * d; other.sPos = L - m0 - dir * d; });
      if (ui) await ui.fade(true, 0.5);
      // arriving: the last fifteen metres, slowing to the berth
      const a0 = s1 - dir * 15;
      boat.sPos = a0; other.sPos = L - a0;
      if (ui) await ui.fade(false, 0.6);
      await run(7, (k) => { const d = 15 * (1 - (1 - ease(k)) * (1 - k)); boat.sPos = a0 + dir * d; other.sPos = L - a0 - dir * d; });
      boat.sPos = s1; other.sPos = L - s1;
      if (ui) await ui.fade(true, 0.45);
      p.stand(); p.locked = false;
      if (toIsland) p.place(f, STAGE.x0 + 4.6, STAGE.y + 0.02, STAGE.z0 + 1.0, Math.PI / 2, 0);
      else p.place(f, 167.6, JY + 0.02, 1799.35, -Math.PI / 2, 0);
      riding = false;
      if (ui) await ui.fade(false, 0.6);
      gm.flags = gm.flags || {}; gm.flags.lmhiCrossed = (gm.flags.lmhiCrossed || 0) + 1;
      toast(gm, toIsland ? 'Lid Island. Five minutes on the rope at a fast walk. The path goes up through the old trees to the Settle.' : 'The jetty. Five minutes back on the rope, and the other boat already tied up on the island behind you.');
    } catch (e) { console.error('[lm-hollow-island] ferry: ' + (e && e.stack ? e.stack : e)); p.stand(); p.locked = false; riding = false; if (ui) ui.fade(false, 0.3); }
    gm.busy = Math.max(0, gm.busy - 1);
  }
  s.interact({ x: 167.6, y: JY + 1.0, z: 1799.1, radius: 1.7, prompt: 'Take the rope ferry to Lid Island', enabled: () => !riding, onUse: (gm) => cross(gm, true) });
  s.interact({ x: STAGE.x0 + 4.6, y: STAGE.y + 1.0, z: STAGE.z0 + 0.4, radius: 1.7, prompt: 'Take the rope ferry back to the jetty', enabled: () => !riding, onUse: (gm) => cross(gm, false) });
  s.interact({ x: 170.4, y: JY + 1.0, z: 1798.7, radius: 1.2, prompt: 'Read the ferry notice', onUse: (gm) => say(gm, { name: 'The rope ferry', colour: '#e7b547' }, [
    'To Lid Island, 434 metres. Two flat boats clipped to one endless rope that lies on the bed of the lake, round a wheel here and a winch on the island. When one boat crosses, the other comes home.',
    'Lamp-dawn to nine, the first boats are for the oldest: the Settle is theirs before it is anyone’s. After nine, anybody. Free, like the lake.',
    'Underneath, in pencil: the rope was spliced in nine places last year, and you can find every one of them by the colour of the thread.',
  ]) });
  s.spot('queue', 166.2, JY, 1799.2, Math.PI / 2, { tags: ['ferry', 'jetty'] }); s.spot('stand', 169.4, JY, 1799.3, Math.PI / 2 - 0.4, { tags: ['ferry', 'jetty', 'look'] });
  s.finish();
  return s;
}
