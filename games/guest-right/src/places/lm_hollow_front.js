// The front wood: the dim end of the Hollow by the front wall, where the sunline has given out and birch and bamboo grow.
// People made three things here: the Long Lamps, a straight promenade of pale gravel from the foot of the wall out to
// where the light starts, a lamp every twelve metres down both sides and lit all day; the Fern Cellar, a sunk garden of
// ferns under the birches round the bed of chervil the drum is named for; and paths into the wood, to a ring of logs, a
// hide for watching the light change, a birch hung with wanderers' ribbons and three benches set far apart on purpose.
// The Bowl is the round place at the wall's foot; the Halfway Urn sells tea at the middle of the walk.
import { warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt, landAt, nearestPavilion } from '../world/land.js';
import { Rng, hashStr } from '../core/util.js';
import { maxGround, minGround, say, toast, found, sfx, buyFrom, mapBoard } from './hollow_parts.js';
import { HF, walkX, lampZ, makeWalk, makeDayGlow, treesIn, nearTree, walkTrees, ringR, JOINS, lanePoint, hstrip, vstrip, lanternLine, fingerPost, plateStand } from './lm_hollow_front_parts.js';
import { buildCellar } from './lm_hollow_front_garden.js';
import { buildWood } from './lm_hollow_front_wood.js';

// Never bright here: a lower exposure than the open Hollow's, so the lamps show at midday.
const ENV = { exposure: 0.72, autoKey: 0.11, autoMin: 0.02, autoMax: 5, bloom: 0.08, warmth: 0.12, contrast: 1.12, saturation: 1.05, vignette: 0.32 };
const OPEN = { ambience: 'hollow-day', reverb: 'open', sky: true, skyTop: 40, sun: true, sunPower: 34, far: 2400, headroom: 30 };
// The sunline's lit part stops about 450 m short of the wall, and the floor's light falls away to about 38 per cent at the
// foot. A zone sets the sun's strength, so each zone here is cut into bands along z, each a little dimmer toward the wall.
export const sunHere = (z) => 34 * (0.38 + 0.62 * Math.pow(Math.max(0, Math.min(1, z / 750)), 1.3));
export function hfZone(s, list, o) {
  const b = o.box, z0 = Math.min(b[2], b[5]), z1 = Math.max(b[2], b[5]), n = Math.max(1, Math.ceil((z1 - z0) / 48));
  let first = null;
  for (let i = 0; i < n; i++) {
    const za = z0 + (z1 - z0) * i / n, zb = z0 + (z1 - z0) * (i + 1) / n;
    const z = s.zoneBox(Object.assign({}, OPEN, { place: 'hollow-front', env: Object.assign({}, ENV) }, o, { id: o.id + (n > 1 ? ':' + i : ''), box: [b[0], b[1], za, b[3], b[4], zb], sunPower: sunHere((za + zb) / 2) }));
    list.push(z); if (!first) first = z;
  }
  return first;
}
const WHO = { name: 'The Long Lamps', colour: '#f2c27b' };
const tick = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });

const URN_MENU = {
  title: 'The Halfway Urn', place: 'hollow-front',
  note: 'Lids on: the walk is long. Leave the cup on any bench and it finds its way back.',
  items: [
    { id: 'tea', name: 'Jasmine tea', desc: 'Poured long into a lidded cup. At half a g the stream takes its time and lands a little anti.', price: 0.15 },
    { id: 'milk-tea', name: 'Milk tea', desc: 'Black tea with Vat milk and Mill sugar, for the walk back.', price: 0.2 },
    { id: 'broth', name: 'A cup of broth', desc: 'Mill broth under a lid, with a sprig from the Name Bed floated on top. From the free table.', price: 0, worth: 0.3, tag: 'mill' },
    { id: 'walking-cake', name: 'A walking cake', desc: 'Steamed, the size of a palm, wrapped in paper so it can be eaten without stopping.', price: 0.25 },
  ],
};

export const place = {
  id: 'lm-hollow-front', name: 'The front wood', order: 10, region: 'hollow-front',
  near: { frame: 'hollow', x: 200, z: 380, r: 430 },
  stops: [{ id: 'hollow-front', name: 'The front wood', sub: 'the Hollow · the Long Lamps · Ring One', group: 'The Hollow', spawn: 'hollow-front', deck: 376, zd: 380 }],
  async build(game) {
    const t0 = performance.now();
    const f = game.world.frame('hollow', 1500, 0, 0);
    const ZONES = [];
    const trees = treesIn(84, 0, 290, 745);
    const glow = makeDayGlow(game, f);
    const bowlY = buildBowl(game, f, ZONES, glow);
    const walk = makeWalk(bowlY);
    await tick();
    await buildWalk(game, f, ZONES, trees, walk, glow);
    await tick();
    buildUrn(game, f, ZONES, walk, walkTrees(trees), glow);
    await tick();
    buildCellar(game, f, ZONES, trees, walk, hfZone, glow);
    await tick();
    buildWood(game, f, ZONES, trees, walk, hfZone, glow);
    glow.finish();
    // the whole dim end, under the smaller zones
    { const s = game.world.scope('hf-dim', f); hfZone(s, ZONES, { id: 'hf-dim', box: [86, -6, 0.5, 292, 40, 744], name: 'The front wood', sub: 'the Hollow · the Dim End' }); s.finish(); }
    // the cab sets you down beside the lift pavilion nearest the middle of the walk
    const q = nearestPavilion(200, 380, {});
    game.spawns['hollow-front'] = { frame: f, x: q.x + 2.5, y: heightAt(q.x, q.z) + 0.14, z: q.z, yaw: Math.PI / 2 };
    // my zones follow the land's day, dusk and night beds
    game.events.on('prerender', () => { const lz = game.hollow && game.hollow.zone; if (!lz) return; for (const z of ZONES) z.ambience = lz.ambience; });
    console.log('[lm-hollow-front] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ===================================================================================================================
// The Bowl: a round stone terrace at the foot of the front wall, a stone bowl in the middle with a slow spout, six tall
// lamps on its balustrade, benches, the map, signposts and a rack of hand lamps. Returns the height of its floor.
// ===================================================================================================================
function buildBowl(game, f, ZONES, glow) {
  const s = game.world.scope('hf-bowl', f), g = s.g;
  const { x: BX, z: BZ, r: BR } = HF.BOWL;
  let top = -9; for (let z = BZ - BR; z <= BZ + BR + 0.01; z += 0.8) for (let x = BX - BR; x <= BX + BR + 0.01; x += 0.8) if (Math.hypot(x - BX, z - BZ) <= BR + 0.3) top = Math.max(top, heightAt(x, z));
  const Y = top + 0.14;
  const mouth = (a) => Math.sin(a) > 0 && Math.abs(Math.cos(a)) * BR < HF.HW + 0.45;
  // ---- the drum it stands on, the floor in rings, brass lines
  s.structure(() => {
    g.mat('stone', '#9d9583'); g.lathe(BX, BZ, [[BR + 0.1, -1.2], [BR + 0.1, Y - 0.16], [BR + 0.18, Y - 0.1], [BR + 0.18, Y + 0.02], [BR - 0.1, Y + 0.02]], { segs: 48, capBottom: false, capTop: false });
    g.mat('stone', '#cbc1ad'); g.lathe(BX, BZ, [[BR - 0.1, Y], [BR - 1.3, Y]], { segs: 48, capBottom: false, capTop: false });
    g.mat('mosaic', '#2f6f73'); g.lathe(BX, BZ, [[BR - 1.3, Y], [BR - 1.7, Y]], { segs: 48, capBottom: false, capTop: false });
    g.mat('pattern', '#d9cdb2'); g.lathe(BX, BZ, [[BR - 1.7, Y], [3.3, Y]], { segs: 48, capBottom: false, capTop: false });
    g.mat('mosaic', '#c48a3a'); g.lathe(BX, BZ, [[3.3, Y], [2.5, Y]], { segs: 40, capBottom: false, capTop: false });
    g.mat('stone', '#b9ae98'); g.lathe(BX, BZ, [[2.5, Y], [0, Y]], { segs: 32, capBottom: false, capTop: false });
    g.mat('cast', '#b08a45');
    for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, c = Math.cos(a), sn = Math.sin(a), w = k % 2 ? 0.012 : 0.022, r0 = 3.35, r1 = BR - 1.75; g.quad([BX + c * r1 - sn * w, Y + 0.003, BZ + sn * r1 + c * w], [BX + c * r1 + sn * w, Y + 0.003, BZ + sn * r1 - c * w], [BX + c * r0 + sn * w, Y + 0.003, BZ + sn * r0 - c * w], [BX + c * r0 - sn * w, Y + 0.003, BZ + sn * r0 + c * w], { double: true }); }
  });
  for (let k = -7; k <= 7; k++) { const z0 = BZ + (k - 0.5) * BR / 7.5, z1 = BZ + (k + 0.5) * BR / 7.5, dz = Math.max(Math.abs(z0 - BZ), Math.abs(z1 - BZ)); if (dz > BR) continue; const hw = Math.sqrt(BR * BR - Math.min(BR * BR, dz * dz)) + 0.1; s.solid(BX - hw, -1.2, z0, BX + hw, Y, z1, { surf: 'stone' }); }
  // ---- the balustrade: stone piers, an iron railing between, a stone top rail; open where the walk comes in
  const RR = BR - 0.12, N = 48, segs = [];
  for (let i = 0; i < N; i++) { const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2; if (mouth(a0) || mouth(a1)) continue; segs.push([a0, a1]); }
  const P = (a, r) => [BX + Math.cos(a) * r, BZ + Math.sin(a) * r];
  s.furniture(() => {
    for (const [a0, a1] of segs) {
      const p = P(a0, RR), q = P(a1, RR);
      g.mat('stone', '#b5aa94'); g.tube([[p[0], Y + 1.0, p[1]], [q[0], Y + 1.0, q[1]]], 0.075, { segs: 5, caps: false });
      g.mat('cast', '#22392f'); g.tube([[p[0], Y + 0.12, p[1]], [q[0], Y + 0.12, q[1]]], 0.02, { segs: 3, caps: false });
      for (let t = 0.25; t < 1; t += 0.25) { const m = P(a0 + (a1 - a0) * t, RR); g.tube([[m[0], Y + 0.12, m[1]], [m[0], Y + 0.95, m[1]]], 0.011, { segs: 3, caps: false }); }
    }
  });
  s.furniture(() => {
    g.mat('stone', '#a99f8a');
    for (let i = 0; i <= N; i++) { const a = i / N * Math.PI * 2; if (mouth(a)) continue; if (i % 2) continue; const p = P(a, RR); g.box(p[0] - 0.13, Y, p[1] - 0.13, p[0] + 0.13, Y + 1.08, p[1] + 0.13, { bevel: 0.02 }); }
  });
  for (const [a0, a1] of segs) { const p = P(a0, RR), q = P(a1, RR); s.solid(Math.min(p[0], q[0]) - 0.1, Y, Math.min(p[1], q[1]) - 0.1, Math.max(p[0], q[0]) + 0.1, Y + 1.08, Math.max(p[1], q[1]) + 0.1); }
  // ---- the stone bowl, its plate, the sound of it
  prop(s, 'lm-hollow-front.bowl', BX, Y, BZ, 0, {}, { scale: 1.35 });
  s.loop('fountain', BX, Y + 1, BZ, { vol: 0.45, radius: 18 });
  plateStand(s, BX + 0.6, Y, BZ + 3.55, 'Z', { kind: 'plate', text: 'THE LONG LAMPS', sub: '697 m · a lamp every 12 m · never put out' }, { w: 0.62, hh: 0.3 });
  s.interact({ x: BX + 0.6, y: Y + 1.1, z: BZ + 4.1, radius: 1.3, prompt: 'Read the plate at the head of the walk', onUse: async (gm) => {
    await say(gm, WHO, [
      'The Long Lamps. Laid from the foot of the front wall out to where the light gives out: 697 metres, eight wide, a lamp every twelve metres down both sides.',
      'The sunline stops about 450 metres short of this wall, and the light on the floor falls away to about 38 per cent of mid-floor here at the foot. Under the birches it is less again, so the lamps burn while the sunline is up as well.',
      'They are brighter the nearer they stand to the wall, where the dark is. It is the one walk in the Hollow kept lit through the lamp-night.',
    ]);
    found(gm, 'dim-ends');
  } });
  s.interact({ x: BX - 2.95, y: Y + 1.0, z: BZ - 0.8, radius: 1.4, prompt: 'Look into the stone bowl', onUse: (gm) => {
    sfx(gm, 'splash', f, BX, Y + 1, BZ);
    say(gm, { name: 'The stone bowl', colour: '#9fd0c0' }, [
      'The spout lifts the water about a metre, and at half a g it hangs there longer than your eye expects before it falls.',
      'Each arc lands a couple of centimetres anti of where it would on the far side. The children stand spinward of the bowl and stay dry, mostly.',
    ]);
  } });
  // ---- the six tall lamps on the balustrade: the brightest on the walk
  const LA = [-0.35, -1.05, -1.75, -2.45, 0.42, 2.72].map((a) => a);
  LA.forEach((a, i) => {
    const p = P(a, BR - 0.12), h = 4.9;
    prop(s, 'lm-hollow-front.post', p[0], Y, p[1], 0, { h });
    s.structure(() => { g.mat('diffuser', '#ffe0ae', { emissive: 26 }); g.ball(p[0], Y + h + 0.32, p[1], 0.21, 0.26, 0.21, { segs: 10, rings: 7 }); g.mat('cast', '#b08a45'); g.lathe(p[0], p[1], [[0.09, Y + h + 0.56], [0.12, Y + h + 0.6], [0.03, Y + h + 0.72], [0, Y + h + 0.74]], { segs: 8 }); });
    glow.add(p[0], Y + h + 0.32, p[1], 0.21, 0.26, 70);
    if (i % 2 === 0) s.light({ at: [p[0], Y + h + 0.3, p[1]], color: warm(2650), power: 14, range: 16, radius: 0.22, shadow: true });
  });
  // ---- benches round the bowl, facing in
  [[-0.5, 6.6], [-2.65, 6.6], [0.55, 6.9], [2.6, 6.9]].forEach(([a, r], i) => { const p = P(a, r); prop(s, 'bench', p[0], Y, p[1], Math.atan2(BX - p[0], BZ - p[1]), { w: 2.2, back: true, wood: ['#8a5a33', '#7a5233', '#9a6f48', '#8a5a33'][i], metal: '#22392f' }, { spot: { tags: ['bowl', 'wall'] } }); });
  // ---- the map of the Hollow and the signposts at the mouth of the walk
  mapBoard(s, BX - 6.6, Y, BZ + 5.6, 0, { w: 2.0, h: 0.8, foot: 0.82, youX: BX, youZ: BZ });
  sign(s, { kind: 'plate', text: 'THE HOLLOW', sub: 'you are the red dot at the foot' }, BX - 6.6, Y + 1.86, BZ + 5.6 + 0.035, { face: 'Z', w: 0.9, h: 0.2 });
  s.interact({ x: BX - 6.6, y: Y + 1.2, z: BZ + 6.3, radius: 1.4, prompt: 'Read the map of the Hollow', onUse: (gm) => say(gm, { name: 'The enamel map', colour: '#9fd0c0' }, [
    'The red dot is at the very bottom edge, against the front wall: the power end, the quiet one.',
    'The dark green band across the bottom is the front wood, about 700 metres deep. The lake is 1.8 kilometres back up the floor, and the back wall 3.7.',
  ]) });
  fingerPost(s, BX - 5.2, Y, BZ + 8.8, [
    { dir: 'Z', text: 'The Long Lamps', sub: '697 m to the light' },
    { dir: 'Z', text: 'The Fern Cellar', sub: '300 m · anti side' },
    { dir: 'Z', text: 'The Halfway Urn', sub: '360 m · tea' },
  ]);
  fingerPost(s, BX + 5.2, Y, BZ + 8.8, [
    { dir: 'Z', text: 'The front wood', sub: '330 m · spinward' },
    { dir: 'Z', text: 'Lift pavilion', sub: '380 m' },
    { dir: 'Z', text: 'The lake', sub: '1.6 km', col: '#cfe6e0' },
    { dir: 'Z', text: 'Back wall', sub: '3.7 km', col: '#e7b547' },
  ]);
  // ---- hand lamps to borrow, and the keeper's ladder against one of the lamps
  { const p = P(-0.12, 8.4); prop(s, 'lm-hollow-front.lamprack', p[0], Y, p[1], -Math.PI / 2, { n: 6 });
    sign(s, { kind: 'notice', title: 'Hand lamps', lines: ['For the walk and', 'the wood. Hang it', 'back at either end.'] }, p[0] - 0.09, Y + 1.74, p[1], { face: 'x', w: 0.42, h: 0.3, board: false });
    s.interact({ x: p[0] - 0.8, y: Y + 1.2, z: p[1], radius: 1.4, prompt: (gm) => (gm.flags && gm.flags.hfHandLamp) ? 'Hang the hand lamp back' : 'Borrow a hand lamp', onUse: (gm) => {
      gm.flags = gm.flags || {};
      if (gm.flags.hfHandLamp) { gm.flags.hfHandLamp = false; sfx(gm, 'clunk', f, p[0], Y + 1.4, p[1]); toast(gm, 'You hang the hand lamp back on its hook.'); return; }
      gm.flags.hfHandLamp = true; sfx(gm, 'lamp-click', f, p[0], Y + 1.4, p[1]);
      const day = gm.clock ? gm.clock.day : 1;
      toast(gm, day === 3 ? 'A hand lamp, from the commons. Tonight is the Long Flight: take it up the axis with you and bring it back after.' : 'A hand lamp, on loan from the commons. Hang it back on any hook at either end of the walk.');
    } });
  }
  { const p = P(-1.05, BR - 0.75); prop(s, 'hollow.stepladder', p[0], Y, p[1], Math.atan2(BX - p[0], BZ - p[1]) + Math.PI, { h: 2.9, brush: false }); s.spot('work', p[0] + (BX - p[0]) * 0.12, Y, p[1] + (BZ - p[1]) * 0.12, Math.atan2(p[0] - BX, p[1] - BZ), { tags: ['lamps', 'clean', 'bowl'] }); }
  // ---- people: a ring round the bowl, the mouth, the balustrade to lean on and look up the wall
  const ring = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([BX + Math.cos(a) * 4.4, Y, BZ + Math.sin(a) * 4.4]); }
  s.path(ring, { width: 1.6 }); s.path([[BX, Y, BZ + 4.4], [BX, Y, BZ + BR + 0.6]], { width: 2.4 });
  for (const a of [-0.8, -1.3, -1.9, -2.3, -0.4]) { const p = P(a, BR - 0.75); s.spot('stand', p[0], Y, p[1], Math.atan2(Math.cos(a), Math.sin(a)), { tags: ['bowl', 'wall', 'look-up'] }); }
  for (const [a, r] of [[2.1, 5.6], [2.3, 5.9], [2.2, 6.6]]) { const p = P(a, r); s.spot('chat', p[0], Y, p[1], Math.atan2(BX + Math.cos(2.2) * 6 - p[0], BZ + Math.sin(2.2) * 6 - p[1]) + Math.PI, { tags: ['bowl', 'promenade'] }); }
  hfZone(s, ZONES, { id: 'hf-bowl', box: [BX - BR - 0.5, -3, 0.5, BX + BR + 0.5, 30, BZ + BR + 0.4], name: 'The Bowl', sub: 'the foot of the front wall · the Long Lamps' });
  s.finish();
  return Y;
}

// ===================================================================================================================
// The Long Lamps: the walk itself, its kerbs, the lamps and their lantern strings, benches between the lamps, the stone
// rings round the trees it was laid among, and the walkways people follow down it.
// ===================================================================================================================
async function buildWalk(game, f, ZONES, trees, walk, glow) {
  const s = game.world.scope('hf-walk', f), g = s.g, r = new Rng(hashStr('hf-walk'));
  const Y = walk.Y, HW = HF.HW, K = HF.KERB, step = walk.step;
  const inWalk = walkTrees(trees);
  // where the kerb opens: for the Urn, the Cellar and the wood's paths, and wherever a gravel walk of the land crosses
  const gaps = HF.GAPS.map((q) => Object.assign({}, q));
  for (const side of [-1, 1]) {
    let run = null;
    for (let z = HF.Z0 + 16; z <= HF.Z1; z += 0.5) {
      const xk = walkX(z) + side * (HW + K * 0.5), out = walkX(z) + side * (HW + 3.5);
      const on = landAt(xk, z).pd < 1.6 && landAt(out, z).pd < 1.8;
      if (on && !run) run = { side, z0: z - 1.0, z1: z + 1.0, auto: true }; else if (on) run.z1 = z + 1.0; else if (run) { gaps.push(run); run = null; }
    }
    if (run) gaps.push(run);
  }
  const inGap = (side, z) => gaps.some((q) => q.side === side && z > q.z0 && z < q.z1);
  const gLow = (x, z) => Math.min(heightAt(x, z), heightAt(x, z - 1), heightAt(x, z + 1)) - 0.3;
  // ---- the surface, the setts at its edges, the kerbs; drawn in sixteen-metre pieces
  const nSeg = Math.round((HF.Z1 - HF.Z0) / step);
  for (let i0 = 0; i0 < nSeg; i0 += 8) {
    s.structure(() => {
      for (let i = i0; i < Math.min(nSeg, i0 + 8); i++) {
        const za = HF.Z0 + i * step, zb = za + step, ya = Y(za), yb = Y(zb), ca = walkX(za), cb = walkX(zb);
        g.mat('gravel', '#ece2cf'); hstrip(g, ca - HW + 0.45, ca + HW - 0.45, za, ya, cb - HW + 0.45, cb + HW - 0.45, zb, yb);
        g.mat('stone', '#cfc5b1'); hstrip(g, ca - HW, ca - HW + 0.45, za, ya + 0.004, cb - HW, cb - HW + 0.45, zb, yb + 0.004); hstrip(g, ca + HW - 0.45, ca + HW, za, ya + 0.004, cb + HW - 0.45, cb + HW, zb, yb + 0.004);
        for (const side of [-1, 1]) {
          const zm = (za + zb) / 2, xa = ca + side * HW, xb = cb + side * HW, xo = xa + side * K, xob = xb + side * K;
          if (inGap(side, zm)) {
            // no kerb: the setts' edge goes straight down to the ground
            g.mat('stone', '#a69d8b'); vstrip(g, xa, za, zb, ya, yb, gLow(xa, za), gLow(xb, zb), side);
            continue;
          }
          g.mat('stone', '#9b927f');
          const ka = ya + 0.12, kb = yb + 0.12;
          if (side < 0) hstrip(g, xo, xa, za, ka, xob, xb, zb, kb); else hstrip(g, xa, xo, za, ka, xb, xob, zb, kb);
          vstrip(g, xa, za, zb, ka, kb, ya, yb, -side);
          vstrip(g, xo, za, zb, ka, kb, gLow(xo, za), gLow(xob, zb), side);
        }
      }
    });
    // collision: the walk is a floor that slopes with it
    for (let i = i0; i < Math.min(nSeg, i0 + 8); i += 2) { const za = HF.Z0 + i * step, zb = Math.min(HF.Z1, za + 2 * step), c = walkX((za + zb) / 2); s.ramp(c - HW - K, za, c + HW + K, zb, Y(za), Y(zb), 'z', { surf: 'gravel' }); }
  }
  // the ends of the kerbs and the setts at the far end, toward the light
  s.structure(() => { const z = HF.Z1, c = walkX(z), y = Y(z); g.mat('stone', '#a69d8b'); g.quad([c - HW - K, gLow(c, z), z], [c + HW + K, gLow(c, z), z], [c + HW + K, y + 0.12, z], [c - HW - K, y + 0.12, z]); g.mat('stone', '#b8ad98'); hstrip(g, c - HW, c + HW, z - 0.6, Y(z - 0.6) + 0.006, c - HW, c + HW, z, y + 0.006); });
  await tick();
  // ---- lamps: a post every twelve metres on both sides, brighter toward the wall
  const posts = [];
  for (let k = 0; k < HF.LAMPN; k++) {
    let z = lampZ(k); if (z > HF.Z1 - 3) break;
    const w = Math.max(0, Math.min(1, 1 - (z - 26) / 690)), em = 9 + 16 * w * w;
    // a band of setts across the walk at every pair of lamps
    s.structure(() => { const c = walkX(z); g.mat('stone', '#bdb29d'); hstrip(g, c - HW + 0.45, c + HW - 0.45, z - 0.28, Y(z - 0.28) + 0.006, c - HW + 0.45, c + HW - 0.45, z + 0.28, Y(z + 0.28) + 0.006); });
    for (const side of [-1, 1]) {
      let pz = z; if (inGap(side, pz) || nearTree(trees, walkX(pz) + side * (HW + K + 0.32), pz, 0.7)) { pz = z + 1.6; if (inGap(side, pz) || nearTree(trees, walkX(pz) + side * (HW + K + 0.32), pz, 0.7)) pz = z - 1.6; }
      const px = walkX(pz) + side * (HW + K + 0.32), py = Y(pz) + 0.12, h = 4.3;
      s.structure(() => { g.mat('stone', '#8f8674'); g.box(px - 0.27, gLow(px, pz), pz - 0.27, px + 0.27, py, pz + 0.27, { faces: 'xXzZY' }); });
      prop(s, 'lm-hollow-front.post', px, py, pz, 0, { h });
      const gyb = py + h + 0.32;
      s.structure(() => { g.mat('diffuser', '#ffdcaa', { emissive: em }); g.ball(px, gyb, pz, 0.19, 0.24, 0.19, { segs: 8, rings: 6 }); g.mat('cast', '#b08a45'); g.lathe(px, pz, [[0.08, gyb + 0.22], [0.11, gyb + 0.26], [0, gyb + 0.38]], { segs: 6 }); });
      glow.add(px, gyb, pz, 0.19, 0.24, 34 + 30 * w * w);
      const lit = z < 70 ? true : k % 2 === 0 && ((k / 2) % 2 === 0) === (side < 0);
      if (lit) s.light({ at: [px - side * 0.05, gyb, pz], color: warm(2700), power: z < 70 ? 6 + 4 * w : 8 + 7 * w * w, range: z < 70 ? 13 : 17, radius: 0.2, shadow: z < 200 });
      posts.push({ k, side, x: px, y: py, z: pz, top: py + h - 0.62 });
    }
  }
  // ---- Booking Day: lantern strings from post to post down both sides, and across the walk every fourth pair
  for (const side of [-1, 1]) {
    const row = posts.filter((p) => p.side === side);
    for (let i = 0; i < row.length - 1; i++) lanternLine(s, [row[i].x, row[i].top, row[i].z], [row[i + 1].x, row[i + 1].top, row[i + 1].z], { n: 5, sag: 0.6, offset: i * 2 + (side > 0 ? 3 : 0) });
  }
  for (let k = 2; k < HF.LAMPN; k += 4) {
    const a = posts.find((p) => p.k === k && p.side < 0), b = posts.find((p) => p.k === k && p.side > 0);
    if (a && b) lanternLine(s, [a.x, a.top + 0.1, a.z], [b.x, b.top + 0.1, b.z], { n: 6, sag: 0.8, offset: k });
  }
  await tick();
  // ---- stone rings round the trees standing in the walk
  inWalk.forEach((t, i) => {
    const R = ringR(t), y = Y(t.z);
    s.structure(() => {
      g.mat('stone', i % 5 === 2 ? '#a89a82' : '#a49c8c'); g.lathe(t.x, t.z, [[R, y - 0.2], [R, y + 0.22], [R - 0.03, y + 0.26], [R - 0.2, y + 0.26], [R - 0.23, y + 0.22], [R - 0.23, y + 0.08]], { segs: 14, capBottom: false, capTop: false });
      g.mat('grass', '#4b6631'); g.lathe(t.x, t.z, [[R - 0.23, y + 0.1], [0.05, y + 0.16]], { segs: 12, capBottom: false, capTop: false });
      if (t.sp !== 3) { g.mat('fern', '#dceeb0', { sway: 0.3 }); for (let k = 0; k < 5; k++) { const a = k / 5 * 6.283 + i, d = R * 0.55; g.card(t.x + Math.cos(a) * d, y + 0.12, t.z + Math.sin(a) * d, 0.22, 0.42, a + 1.57, { tilt: 0.55 }); } }
    });
    s.post(t.x, t.z, R, y - 0.3, y + 0.26);
  });
  // the plate on one ring, a third of the way out, says why
  const plateTree = inWalk.filter((t) => t.sp !== 3 && t.z > 200 && t.z < 260)[0] || inWalk[Math.floor(inWalk.length / 3)];
  if (plateTree) {
    const R = ringR(plateTree), y = Y(plateTree.z), side = plateTree.x < walkX(plateTree.z) ? 1 : -1, px = plateTree.x + side * (R + 0.02);
    sign(s, { kind: 'plate', text: 'WE WENT ROUND', sub: 'this birch was here first' }, px, y + 0.15, plateTree.z, { face: side > 0 ? 'X' : 'x', w: 0.42, h: 0.11 });
    s.interact({ x: px + side * 0.6, y: y + 0.7, z: plateTree.z, radius: 1.3, prompt: 'Read the plate on the tree ring', onUse: (gm) => say(gm, WHO, [
      'The walk goes round the trees, not the other way. These birches stood here before the paving, and in the Hollow a tree is not felled for a path.',
      inWalk.length + ' of them stand in the walk between the Bowl and the light, each in its ring of stone. On the evening walk you go round them arm in arm, and nobody lets go.',
    ]) });
  }
  // ---- a plate on one lamp, across from the Urn
  { const p = posts.find((q) => q.k === 29 && q.side < 0); if (p) {
    sign(s, { kind: 'plate', text: 'LAMP 59', sub: 'of 116 · the commons' }, p.x + 0.075, p.y + 1.55, p.z, { face: 'X', w: 0.28, h: 0.13 });
    s.interact({ x: p.x + 0.8, y: p.y + 1.2, z: p.z, radius: 1.2, prompt: 'Read the plate on the lamp post', onUse: (gm) => say(gm, WHO, [
      'Lamp 59 of 116. Sixty watts out here, ninety at the wall, burning through the sunline\'s hours and the lamp-night alike.',
      'About 200 kays a day for the whole walk, paid from the commons like the lit streets. Every globe is wiped once a week from a ladder, from the wall end out.',
    ]) });
  } }
  await tick();
  // ---- benches between the lamps, on small paved bays outside the kerb, facing the walk
  const benchAt = [];
  for (let k = 0; k < HF.LAMPN - 1; k++) {
    const zm = lampZ(k) + 6; if (zm > HF.Z1 - 6) break;
    const sides = k % 3 === 0 ? [-1, 1] : [k % 2 ? 1 : -1];
    for (const side of sides) {
      if (inGap(side, zm - 1.6) || inGap(side, zm + 1.6) || inGap(side, zm)) continue;
      if (side > 0 && zm > HF.URN.z0 - 3 && zm < HF.URN.z1 + 3) continue;
      const bx = walkX(zm) + side * (HW + K + 0.72);
      if (nearTree(trees, bx, zm, 1.5) || nearTree(trees, bx, zm - 1.1, 0.9) || nearTree(trees, bx, zm + 1.1, 0.9)) continue;
      const by = Y(zm) + 0.12;
      s.structure(() => { g.mat('stone', '#b3a994'); g.box(bx - 0.62, gLow(bx, zm), zm - 1.35, bx + 0.62, by, zm + 1.35, { faces: 'xXzZY' }); });
      s.solid(bx - 0.62, by - 0.6, zm - 1.35, bx + 0.62, by, zm + 1.35, { surf: 'stone' });
      prop(s, 'bench', bx + side * 0.12, by, zm, side < 0 ? Math.PI / 2 : -Math.PI / 2, { w: 2.0, back: true, wood: r.pick(['#8a5a33', '#7a5233', '#9a6f48', '#6f4a2c']), metal: '#22392f' }, { tier: 'd', spot: { tags: ['promenade', 'bench', 'evening'] } });
      benchAt.push({ x: bx, y: by, z: zm, side, k });
    }
  }
  // four of them let you sit and watch
  const sitLines = (gm) => { const h = gm.clock ? gm.clock.hours : 13; return h >= 19 && h < 23.5 ? 'The evening walk: couples arm in arm, aunts in their good coats, children running the kerb. Everyone nods to everyone, and nobody hurries.' : h >= 23.5 || h < 6 ? 'The lamp-night. The rest of the Hollow is dark and the walk is still lit, a line of lamps running to the wall, and somebody far off walking it alone.' : 'Quiet at this hour: a gardener with a barrow, two old friends on the next bench. The walk fills after dinner, from about half past seven.'; };
  for (const want of [4, 17, 33, 48]) {
    const b = benchAt.reduce((best, q) => (!best || Math.abs(q.k - want) < Math.abs(best.k - want) ? q : best), null); if (!b) continue;
    s.interact({ x: b.x - b.side * 0.9, y: b.y + 0.8, z: b.z, radius: 1.4, prompt: 'Sit on the bench and watch the walk', onUse: (gm) => {
      if (gm.player && gm.player.sit) { gm.player.sit({ x: b.x + b.side * 0.12 - b.side * 0.05, y: b.y + 0.46, z: b.z, yaw: b.side < 0 ? Math.PI / 2 : -Math.PI / 2, eye: 1.12 }); gm.player.yaw = b.side < 0 ? Math.PI / 2 + Math.PI * 0.85 : -Math.PI / 2 - Math.PI * 0.85; }
      toast(gm, sitLines(gm));
    } });
  }
  // ---- people: a walkway down the middle and one down each side, round the tree rings; groups that stop to talk
  const lane = (off) => {
    const zs = []; for (let z = HF.Z0 + 2; z <= HF.Z1 - 0.5; z += 6) zs.push(z);
    for (const [o, z] of JOINS) if (o === off) zs.push(z);
    zs.sort((a, b) => a - b);
    return zs.filter((z, i) => i === 0 || z - zs[i - 1] > 0.8 || JOINS.some((j) => j[1] === z)).map((z) => lanePoint(walk, inWalk, off, z));
  };
  s.path(lane(0), { width: 2.4 }); s.path(lane(-2.7), { width: 1.6 }); s.path(lane(2.7), { width: 1.6 });
  for (let z = 70, i = 0; z < HF.Z1 - 20; z += 34 + r.f(0, 14), i++) {
    const side = i % 2 ? 1 : -1, cx = walkX(z) + side * 2.2, n = r.i(2, 4);
    if (nearTree(inWalk, cx, z, 1.6)) continue;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + r.f(0, 1), px = cx + Math.cos(a) * 0.6, pz = z + Math.sin(a) * 0.6; s.spot('chat', px, Y(pz), pz, Math.atan2(cx - px, z - pz), { tags: ['promenade', 'evening'] }); }
  }
  for (const p of posts) if (p.k % 5 === 1) s.spot('stand', p.x - p.side * 0.7, Y(p.z), p.z + 0.6, p.side < 0 ? Math.PI * 0.75 : -Math.PI * 0.75, { tags: ['promenade', 'look'] });
  hfZone(s, ZONES, { id: 'hf-walk', box: [walkX(HF.Z0) - HW - 1.6, -6, HF.BOWL.z + HF.BOWL.r + 0.4, walkX(HF.Z1) + HW + 1.6, 30, HF.Z1 + 1], name: 'The Long Lamps', sub: 'the front wood · a lamp every twelve metres' });
  s.finish();
}

// ===================================================================================================================
// The Halfway Urn: a tea kiosk on a paved bay off the spinward side of the walk, with tables under a lamp.
// ===================================================================================================================
function buildUrn(game, f, ZONES, walk, inWalk, glow) {
  const s = game.world.scope('hf-urn', f), g = s.g, U = HF.URN, zc = (U.z0 + U.z1) / 2;
  const yA = Math.max(walk.Y(zc), maxGround(U.x0, U.z0, U.x1, U.z1, 1) + 0.05), yL = minGround(U.x0, U.z0, U.x1, U.z1, 1) - 0.35;
  s.structure(() => {
    g.mat('stone', '#cfc5b1'); g.box(U.x0, yL, U.z0, U.x1, yA, U.z1, { faces: 'xXzZY' });
    g.mat('stone', '#9b927f'); g.box(U.x1 - 0.24, yL, U.z0, U.x1, yA + 0.12, U.z1, { bevel: 0.01 }); g.box(U.x0, yL, U.z0, U.x1, yA + 0.12, U.z0 + 0.24, { bevel: 0.01 }); g.box(U.x0, yL, U.z1 - 0.24, U.x1, yA + 0.12, U.z1, { bevel: 0.01 });
    g.mat('mosaic', '#c48a3a'); g.box(U.x0 + 0.6, yA, zc - 2.2, U.x0 + 0.9, yA + 0.004, zc + 2.2, { faces: 'Y' });
  });
  s.solid(U.x0, yL, U.z0, U.x1, yA, U.z1, { surf: 'stone' });
  const KX = U.x1 - 2.3;
  prop(s, 'lm-hollow-front.kiosk', KX, yA, zc, -Math.PI / 2, {});
  prop(s, 'hollow.urn', KX - 1.38, yA + 1.06, zc + 0.35, -Math.PI / 2, { col: '#9a6a3a' });
  for (let i = 0; i < 4; i++) prop(s, 'cup', KX - 1.42, yA + 1.06, zc - 0.5 - i * 0.13, 0, { glaze: ['#e9e1cf', '#2f6f73', '#c9552e', '#e7b547'][i] });
  sign(s, { kind: 'fascia', text: 'The Halfway Urn', sub: 'tea · broth · lids on', palette: ['#c4472c', '#f3e6c8', '#e7b547'] }, KX - 1.62, yA + 2.45, zc, { face: 'x', w: 1.2, h: 0.24, board: false });
  // tables and chairs
  const T = [[U.x0 + 2.2, U.z0 + 2.2, '#2f6f73'], [U.x0 + 2.2, U.z1 - 2.2, '#c48a3a'], [U.x0 + 5.6, U.z1 - 1.7, '#8a2f3c']];
  T.forEach(([x, z, top], i) => {
    prop(s, 'lm-hollow-front.cafetable', x, yA, z, 0, { top });
    const n = i === 2 ? 2 : 3;
    for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2 + i, cx = x + Math.cos(a) * 0.62, cz = z + Math.sin(a) * 0.62; prop(s, 'chair', cx, yA, cz, Math.atan2(x - cx, z - cz), { wood: ['#6b4a2f', '#8a5a33', '#4a3426'][k % 3], back: k % 2 ? 'slat' : 'hoop' }, { spot: { tags: ['tea', 'urn'] } }); }
    prop(s, 'cup', x + 0.12, yA + 0.74, z - 0.05, 0, { glaze: '#e9e1cf' }); if (i !== 1) prop(s, 'cup', x - 0.14, yA + 0.74, z + 0.1, 0, { glaze: '#2f6f73' });
    if (i === 1) prop(s, 'bowl', x - 0.1, yA + 0.74, z + 0.12, 0, { glaze: '#e7b547', r: 0.07 });
  });
  // light: a globe inside the hatch and a lamp at the back corner of the bay
  s.structure(() => { g.mat('diffuser', '#ffe0b0', { emissive: 12 }); g.ball(KX - 0.2, yA + 2.05, zc, 0.12, 0.12, 0.12, { segs: 10, rings: 6 }); });
  s.light({ at: [KX - 0.6, yA + 2.0, zc], color: warm(2600), power: 7, range: 8, radius: 0.12 });
  prop(s, 'lm-hollow-front.post', U.x1 - 0.5, yA + 0.12, U.z0 + 0.5, 0, { h: 3.4 });
  s.structure(() => { g.mat('diffuser', '#ffdcaa', { emissive: 12 }); g.ball(U.x1 - 0.5, yA + 0.12 + 3.72, U.z0 + 0.5, 0.17, 0.21, 0.17, { segs: 10, rings: 7 }); });
  glow.add(U.x1 - 0.5, yA + 0.12 + 3.72, U.z0 + 0.5, 0.17, 0.21, 40);
  s.light({ at: [U.x1 - 0.5, yA + 3.8, U.z0 + 0.5], color: warm(2800), power: 10, range: 12, radius: 0.18, shadow: true });
  lanternLine(s, [U.x1 - 0.5, yA + 3.5, U.z0 + 0.5], [U.x0 + 0.3, yA + 3.6, U.z1 - 0.3], { n: 7, sag: 0.7, offset: 2 });
  // what you can do
  s.interact({ x: KX - 2.2, y: yA + 1.1, z: zc, radius: 1.5, prompt: 'Buy something at the Halfway Urn', kind: 'talk', onUse: async (gm) => {
    const it = await buyFrom(gm, URN_MENU, 'The Halfway Urn');
    if (it) { sfx(gm, it.id === 'broth' ? 'ladle' : 'pour', f, KX - 1.4, yA + 1.2, zc); toast(gm, it.id === 'tea' ? 'The stream bends a little anti on its way down into the cup. The lid goes on before it reaches you.' : it.id === 'walking-cake' ? 'Warm through the paper. The keeper says to eat it walking, toward the wall, the way it is meant.' : 'Under a lid, as everything is.'); }
  } });
  plateStand(s, U.x0 + 0.5, yA, zc + 3.6, 'x', { kind: 'notice', title: 'Evenings on the walk', lines: ['From half past seven.', 'Good clothes if you have', 'them. Walk to the wall on', 'the kerb side, back on', 'the middle. Stop to talk', 'on the stone bands.'] }, { w: 0.46, hh: 0.56, h: 0.95 });
  s.interact({ x: U.x0 + 1.1, y: yA + 1.1, z: zc + 3.6, radius: 1.2, prompt: 'Read the notice by the Urn', onUse: (gm) => say(gm, { name: 'Evenings on the walk', colour: '#e7b547' }, [
    'From half past seven, after the halls have eaten. Good clothes if you have them: this is where the front blocks see each other dressed.',
    'Walk to the wall on the kerb side and back down the middle. Stop to talk on the stone bands between the lamps, not in the middle of a bay.',
    'Under it, in a different hand: the Urn shuts when the last walker goes home, and on Booking Day it does not shut.',
  ]) });
  s.loop('murmur', KX - 2, yA + 1, zc, { vol: 0.22, radius: 14, param: 0.3 });
  s.path([lanePoint(walk, inWalk, 2.7, 375), [U.x0 + 0.4, yA, 375], [KX - 2.6, yA, zc]], { width: 1.8 });
  s.spot('stand', U.x0 + 1.2, yA, zc + 2.6, Math.PI / 2, { tags: ['tea', 'urn', 'promenade'] });
  hfZone(s, ZONES, { id: 'hf-urn', box: [U.x0 - 0.3, -4, U.z0, U.x1 + 0.3, 30, U.z1], name: 'The Halfway Urn', sub: 'tea on the Long Lamps' });
  s.finish();
}

