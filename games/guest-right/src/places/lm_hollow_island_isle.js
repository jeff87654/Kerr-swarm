// Lid Island: the low round island in Chervil's lake, 450 m out from the jetty. A landing stage for the rope ferry on its
// anti side; a stepped path up through a small old orchard; on the crown the Settle, one bench twenty-two metres long that
// looks spinward down the lake to where the far shore stands up on its side, with a rail along the brow; the Kettle, a tea
// hut; a horseshoe of lanterns open to the lake; and at the back end a pier with the high board over the deepest water.
import { floor, block, stairs, wall, lamp } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt, LAND } from '../world/land.js';
import { Rng, hashStr, shadeHex } from '../core/util.js';
import { gy, maxGround, say, toast, found, sfx, buyFrom, lanternString } from './hollow_parts.js';
import { IP, DYES, openZone, who, card, pick, movingMesh, farMesh, drawColumn, drawCrown, drawSpray, drawFoam } from './lm_hollow_island_parts.js';

const W = LAND.WATER;
// the landing stage (the ferry moors along its low-z side), the Settle, the rail, the Kettle, the pier and the high board
export const STAGE = { x0: 594.5, x1: 605.6, z0: 1754.5, z1: 1757.5, y: 0.42 };
const SX = 627.15, SZ0 = 1747.2, SZ1 = 1769.2, SEC = 2.2;
const RX = 629.7, RZ0 = 1748.4, RZ1 = 1767.6;
const KX0 = 612.4, KX1 = 617.4, KZ0 = 1763.8, KZ1 = 1768.8;
const PX = 620, PZ0 = 1778.4, PY = 0.5, TZ0 = 1787.5, TZ1 = 1790.5, TY = W + 4.5, BZ1 = 1793.6;

const KETTLE_MENU = {
  title: 'The Kettle', note: 'Everything under a lid. The rugs come back folded.',
  items: [
    { id: 'tea', name: 'Long-pour tea', desc: 'Poured from arm’s height into a lidded cup. At half a g the pour takes its time, and so does Ama.', price: 0.15 },
    { id: 'broth', name: 'A lidded cup of broth', desc: 'Mill broth with a sprig from the island’s own pot of chervil. Free on the island.', price: 0 },
    { id: 'bun', name: 'Steamed sugar bun', desc: 'Under a linen lid, warm from the loop under the hut.', price: 0.2 },
    { id: 'rug', name: 'A lap rug for the Settle', desc: 'Lent. Every corner mended in a different colour.', price: 0, tag: 'loan' },
  ],
};
const AMA = who('Ama, at the Kettle');

export function buildIsland(game, f, zones) {
  const s = game.world.scope('lmhi-isle', f), g = s.g;
  const r = new Rng(hashStr('lid-island'));

  // ---- the landing stage: planks on posts, a step down at the shore end, a bench and a lamp
  const ST = STAGE;
  floor(s, ST.x0, ST.z0, ST.x1, ST.z1, ST.y, 'planks', '#b3a58e', { surf: 'wood' });
  s.structure(() => {
    g.mat('wood', '#6f6252'); for (const z of [ST.z0, ST.z1]) g.box(ST.x0, ST.y - 0.3, z - 0.08, ST.x1, ST.y - 0.01, z + 0.08, { bevel: 0.01 });
    g.mat('wood', '#5a4e40'); for (let x = ST.x0 + 0.6; x < ST.x1; x += 2.2) g.box(x - 0.08, ST.y - 0.28, ST.z0, x + 0.08, ST.y - 0.12, ST.z1);
    // a fender of old rope along the mooring side
    g.mat('weave', '#8a7656'); for (let x = ST.x0 + 0.8; x < ST.x1 - 2; x += 1.6) g.lathe(x, ST.z0 - 0.14, [[0.0, ST.y - 0.42], [0.09, ST.y - 0.38], [0.11, ST.y - 0.25], [0.09, ST.y - 0.12], [0.0, ST.y - 0.08]], { segs: 8 });
  });
  for (let x = ST.x0 + 0.6; x <= ST.x1 - 1.2; x += 2.2) for (const z of [ST.z0 + 0.05, ST.z1 - 0.05]) {
    const yb = Math.min(gy(x, z), W - 1.0) - 0.3;
    s.furniture(() => { g.mat('wood', '#4f4438'); g.lathe(x, z, [[0.12, yb], [0.12, ST.y + 0.1], [0.1, ST.y + 0.16]], { segs: 8 }); });
    s.post(x, z, 0.12, yb, ST.y + 0.15);
  }
  prop(s, 'bench', ST.x0 + 3.2, ST.y, ST.z1 - 0.35, Math.PI, { w: 1.8, back: true, wood: '#8a5a33', metal: IP.iron });
  lamp(s, 'pole', ST.x0 + 0.4, ST.y, ST.z1 - 0.3, { h: 2.6, K: 2900, power: 0.8, range: 10, night: true });
  s.spot('chat', ST.x0 + 6.2, ST.y, ST.z0 + 1.6, -2.2, { tags: ['island', 'ferry'] }); s.spot('chat', ST.x0 + 7.3, ST.y, ST.z0 + 1.0, 1.9, { tags: ['island', 'ferry'] }); s.spot('queue', ST.x0 + 4.0, ST.y, ST.z0 + 1.1, -Math.PI / 2, { tags: ['island', 'ferry'] });
  s.loop('water-lap', ST.x0 + 2, W, ST.z0 - 1, { vol: 0.45, radius: 22 });

  // ---- the path up: stone slabs set into the slope, a rope rail on posts up the steep part
  const route = [[ST.x1 - 0.2, 1756], [608, 1754.6], [611, 1753.7], [614, 1754.3], [617.5, 1756.3], [621.5, 1757.6], [625.4, 1758.0]];
  const slabs = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.62));
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; slabs.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1])]); }
  }
  s.structure(() => {
    slabs.forEach(([x, z, yaw], i) => {
      const y = gy(x, z) + 0.035, steep = Math.abs(gy(x + 0.4, z) - gy(x - 0.4, z)) > 0.15;
      g.mat('stone', pick(['#bfb4a2', '#b3a690', '#c9bda6', '#a99c86'], i));
      g.at(x, 0, z, yaw); g.box(-0.5 + (i % 3) * 0.04, y - (steep ? 0.22 : 0.08), -0.27, 0.48, y, 0.27, { bevel: 0.03 }); g.pop();
    });
  });
  const railPts = [];
  for (let x = ST.x1 + 0.3; x <= 613.2; x += 1.6) { const t = (x - ST.x1) / (613.2 - ST.x1), z = 1756 + (1753.7 - 1756) * Math.min(1, t * 1.5) + 0.95; railPts.push([x, z]); }
  s.furniture(() => {
    g.mat('wood', '#5a4a3a'); for (const [x, z] of railPts) g.box(x - 0.05, gy(x, z) - 0.2, z - 0.05, x + 0.05, gy(x, z) + 0.95, z + 0.05, { bevel: 0.01 });
    g.mat('weave', '#c9b48a'); g.tube(railPts.map(([x, z]) => [x, gy(x, z) + 0.9, z]), 0.022, { segs: 5 });
  });
  for (const [x, z] of railPts) s.post(x, z, 0.06, gy(x, z), gy(x, z) + 0.95);

  // ---- the old orchard: a dozen trees older than anyone on the Settle, propped and mended
  const OLD = [[608.4, 1747.6], [610.2, 1742.2], [614.6, 1739.6], [619.6, 1740.8], [623.2, 1741.8], [607.6, 1761.2], [610.6, 1765.2], [609.4, 1770.6], [614.2, 1773.8], [613.6, 1748.6], [617.6, 1750.4], [619.6, 1773.0]];
  OLD.forEach(([x, z], i) => prop(s, 'lmhi.apple', x, gy(x, z), z, r.f(0, 6.283), { kind: 'old', seed: i % 6 }, { scale: 0.95 + (i % 3) * 0.08 }));
  for (const [x, z] of [[611.5, 1745.2], [616.2, 1771.6]]) s.spot('work', x, gy(x, z), z, r.f(0, 6.28), { tags: ['orchard', 'island', 'pick'] });
  // a windfall crate and a ladder against the biggest tree
  prop(s, 'hollow.applecrate', 612.0, gy(612, 1749.8), 1749.8, 0.3, { seed: 7, full: true });
  prop(s, 'hollow.stepladder', 611.2, gy(611.2, 1741.0), 1741.0, 2.4, { h: 2.0, brush: false });
  s.interact({ x: 610.2, y: gy(610.2, 1742.2) + 1.4, z: 1742.2, radius: 2.0, prompt: 'Look at the old trees', onUse: (gm) => say(gm, { name: 'The island’s trees', colour: '#cfe0a0' }, [
    'Twelve apple trees, low and wide, leaning on forked props where their limbs got too heavy. Each prop is newer than its tree; some trees are on their fourth.',
    'A band of bright cloth is tied wherever a limb split and was bound. Nobody prunes these for fruit any more. They are pruned so there is somewhere to sit in the shade.',
    'A tag on the nearest, in old ink under new: planted by the first block court, a long time before the Count.',
  ]) });

  // ---- the Settle: one long bench in sections, each on its own level as the crown falls away, every section a different
  //      wood where it has been remade; iron ends with brass hand-hoops; names cut into the top rail
  const secs = [];
  for (let z0 = SZ0; z0 < SZ1 - 0.01; z0 += SEC) {
    const z1 = z0 + SEC, gmax = maxGround(SX - 0.55, z0, SX + 0.35, z1, 0.5), y = gmax + 0.45;
    secs.push({ z0, z1, y, g: gmax });
  }
  const woods = ['#9a6f48', '#b8875a', '#8a5a33', '#a87a50', '#c49a68', '#7a5233'];
  secs.forEach((sc, i) => {
    const wd = woods[(i * 5) % woods.length], wd2 = woods[(i * 5 + 2) % woods.length], y = sc.y;
    s.furniture(() => {
      // seat slats, the back boards (leaning), the top rail
      g.mat('wood', wd, { rough: -0.05 });
      for (let k = 0; k < 3; k++) { const x0 = SX - 0.25 + k * 0.17; g.box(x0, y - 0.045, sc.z0 + 0.03, x0 + 0.155, y, sc.z1 - 0.03, { bevel: 0.01 }); }
      g.push(); g.move(SX - 0.32, y + 0.08, 0); g.rotZ(0.16);
      for (let k = 0; k < 2; k++) g.box(-0.025, k * 0.22, sc.z0 + 0.03, 0.025, k * 0.22 + 0.17, sc.z1 - 0.03, { bevel: 0.01 });
      g.mat('wood', wd2, { rough: -0.05 }); g.box(-0.04, 0.46, sc.z0, 0.04, 0.6, sc.z1, { bevel: 0.015 });
      g.pop();
      // the cut names: small dark nicks along the top rail, close as print
      g.mat('wood', shadeHex(wd2, 0.45));
      for (let k = 0; k < 9; k++) { const zz = sc.z0 + 0.15 + k * 0.23 + r.f(-0.04, 0.04), w = r.f(0.08, 0.18); g.box(SX - 0.32 + Math.sin(0.16) * 0.53 + 0.04, y + 0.08 + 0.52 + r.f(-0.03, 0.03), zz, SX - 0.32 + Math.sin(0.16) * 0.53 + 0.045, y + 0.08 + 0.535 + r.f(-0.03, 0.03), zz + w); }
    });
    s.solid(SX - 0.45, sc.g - 0.2, sc.z0, SX + 0.27, y, sc.z1, { surf: 'wood' });
    s.solid(SX - 0.45, y, sc.z0, SX - 0.25, y + 0.75, sc.z1);
  });
  // the iron ends between sections: legs to the ground, an arm with a brass hoop to hold when you get up
  for (let i = 0; i <= secs.length; i++) {
    const z = i < secs.length ? secs[i].z0 : secs[secs.length - 1].z1, a = secs[Math.max(0, i - 1)], b = secs[Math.min(secs.length - 1, i)], y = Math.max(a.y, b.y), gg = Math.min(a.g, b.g);
    s.furniture(() => {
      g.mat('cast', IP.iron);
      g.tube([[SX + 0.2, gg - 0.1, z], [SX + 0.18, y - 0.04, z], [SX + 0.15, y + 0.22, z]], 0.035, { segs: 6 });
      g.tube([[SX - 0.38, gg - 0.1, z], [SX - 0.3, y - 0.04, z], [SX - 0.36, y + 0.66, z]], 0.035, { segs: 6 });
      g.tube([[SX + 0.15, y + 0.22, z], [SX - 0.1, y + 0.25, z], [SX - 0.33, y + 0.3, z]], 0.03, { segs: 5 });
      g.mat('cast', IP.brass); g.tube([[SX + 0.15, y + 0.22, z], [SX + 0.3, y + 0.32, z], [SX + 0.26, y + 0.48, z], [SX + 0.12, y + 0.44, z]], 0.018, { segs: 6 });
    });
  }
  // the plate at the north end
  sign(s, { kind: 'plate', text: 'THE SETTLE', sub: 'for a hundred and over, and whoever they bring', palette: ['#b08a45', '#2a2018', '#6b4a2f'] }, SX - 0.05, secs[0].y + 0.25, SZ0 - 0.06, { face: 'z', w: 0.62, h: 0.22 });
  // four names a person can read from the rail, cut deeper than the rest and inked
  const NAMES = [['ABENI SATO', '104 · every Tuesday'], ['JOSS AND ILKA', '101 and 99 · and the lake'], ['TEODOR', 'who said he would not come, and came'], ['MARA OF THE LOW DECKS', '111 · first boat, always']];
  NAMES.forEach(([t, sub], i) => { const sc = secs[2 + i * 2]; sign(s, { kind: 'plate', text: t, sub, palette: ['#8a6a48', '#2a1d14', '#5a4030'] }, SX - 0.32 + Math.sin(0.16) * 0.53 + 0.05, sc.y + 0.08 + 0.53, (sc.z0 + sc.z1) / 2 + 0.3, { face: 'X', w: 0.56, h: 0.12, board: false }); });
  // people on it: the oldest in the drum, and whoever they brought
  secs.forEach((sc) => { for (let k = 0; k < 3; k++) s.spot('sit', SX + 0.02, sc.y, sc.z0 + 0.37 + k * 0.73, Math.PI / 2, { tags: ['settle', 'island', 'elders', 'look'] }); });
  for (const zz of [1751.5, 1758.2, 1764.9]) {
    const sc = secs.find((q) => zz >= q.z0 && zz < q.z1) || secs[0];
    s.interact({ x: SX + 0.6, y: sc.y + 0.6, z: zz, radius: 1.3, prompt: 'Sit on the Settle', onUse: (gm) => {
      if (gm.player && gm.player.sit) { gm.player.sit({ x: SX + 0.02, y: sc.y, z: zz, yaw: Math.PI / 2, eye: 1.1 }); gm.player.yaw = Math.PI / 2; gm.player.pitch = -0.04; }
      gm.flags = gm.flags || {};
      if (!gm.flags.satSettle) { gm.flags.satSettle = true; card(gm, 'Lid Island', 'The Settle', 'Twenty-two metres of bench, for anyone a hundred or over and whoever they bring. From here the lake runs spinward and climbs, and the far shore stands up on its side.'); }
      else toast(gm, pick(['The lake climbs away spinward until the shore over there is a wall of orchard, standing on its side.', 'Somebody further along is naming the blocks on the far bank, one by one, from memory.', 'The waves come in slow and tall below the brow, and take their time about falling over.', 'Nobody on the Settle is in a hurry. That is rather the point of it.'], (gm.flags.satSettleN = (gm.flags.satSettleN || 0) + 1)));
    } });
  }
  s.interact({ x: SX - 0.9, y: secs[3].y + 0.6, z: 1755.6, radius: 1.5, prompt: 'Read the names on the Settle', onUse: (gm) => say(gm, { name: 'The Settle', colour: '#e2c486' }, [
    'Names cut into the top rail, hundreds of them, small and close, in every hand there is. The oldest are worn nearly smooth by shoulders.',
    'The plate at the end says the Settle is for anyone a hundred or over, and whoever they bring. You cut your name when you have sat a hundred mornings. The knife hangs on a hook at the Kettle.',
    'Newer ones, inked: Abeni Sato, 104, every Tuesday. Joss and Ilka, 101 and 99, and the lake. Teodor, who said he would not come, and came.',
    'Each section is a different wood. When one wears through, the block court that holds the oldest name on it pays to have it remade. There is a waiting list for the privilege.',
  ]) });

  // ---- the rail along the brow: brass on iron posts, following the ground, with people standing at it
  const rail = []; for (let z = RZ0; z <= RZ1 + 0.01; z += 1.6) rail.push([RX, z]);
  s.furniture(() => {
    g.mat('cast', IP.iron); for (const [x, z] of rail) g.box(x - 0.035, gy(x, z) - 0.25, z - 0.035, x + 0.035, gy(x, z) + 0.98, z + 0.035, { bevel: 0.01 });
    g.mat('cast', IP.brass); g.tube(rail.map(([x, z]) => [x, gy(x, z) + 1.0, z]), 0.03, { segs: 6 });
    g.mat('cast', IP.iron); g.tube(rail.map(([x, z]) => [x, gy(x, z) + 0.5, z]), 0.014, { segs: 4 });
  });
  for (let i = 0; i < rail.length - 1; i++) { const a = rail[i], b = rail[i + 1], y = Math.min(gy(a[0], a[1]), gy(b[0], b[1])); s.solid(RX - 0.05, y - 0.3, a[1], RX + 0.05, y + 1.0, b[1]); }
  for (let z = RZ0 + 1.2; z < RZ1; z += 3.1) s.spot('stand', RX - 0.42, gy(RX - 0.42, z), z, Math.PI / 2, { tags: ['rail', 'island', 'look'] });
  s.interact({ x: RX - 0.4, y: gy(RX, 1758) + 1.1, z: 1758.6, radius: 1.6, prompt: 'Hold the rail and look down the lake', onUse: (gm) => {
    if (gm.player) { gm.player.yaw = Math.PI / 2; gm.player.pitch = 0.12; }
    found(gm, 'far-bank');
    return say(gm, { name: 'Down the lake', colour: '#9fd0e0' }, [
      'The lake runs spinward from your feet and does not lie flat: it climbs. A kilometre off the water is tilted up like a plate held to show you the pattern, and the far shore above it stands on its side.',
      'Past that the orchards keep rising, and keep rising, until they are overhead and hanging, three kilometres up, with people on them the size of seeds.',
      'Below the brow the waves come in slow and tall. At half a g they have time to stand up before they fall over.',
    ]);
  } });

  // ---- the Kettle: a little tea hut, teal with cream trim, a rust-red roof, a hatch toward the Settle
  const KY = maxGround(KX0, KZ0, KX1, KZ1, 0.5) + 0.14, KH = 2.35;
  block(s, KX0 - 0.15, KY - 0.6, KZ0 - 0.15, KX1 + 0.9, KY, KZ1 + 0.15, 'planks', '#a8916f', { surf: 'wood' });
  const wopt = { tint: '#2f6f73', tintA: '#2f6f73', tintB: '#e9dcc0', mat: 'flute', matB: 'plaster', skirt: '#6b4a2f', t: 0.12 };
  wall(s, KX0, KZ0, KX1, KZ0, KY, KH, wopt);
  wall(s, KX0, KZ1, KX1, KZ1, KY, KH, Object.assign({}, wopt, { openings: [{ at: 1.7, w: 1.0, h: 0.75, sill: 1.05 }] }));
  wall(s, KX0, KZ0, KX0, KZ1, KY, KH, Object.assign({}, wopt, { openings: [{ at: 1.9, w: 0.9, h: 2.0 }] }));
  wall(s, KX1, KZ0, KX1, KZ1, KY, KH, Object.assign({}, wopt, { openings: [{ at: 1.0, w: 3.0, h: 0.95, sill: 1.0 }] }));
  const KR = KY + KH, KM = (KX0 + KX1) / 2, KP = KR + 0.95;
  s.furniture(() => {
    // the roof: pitched along z, overhanging, corrugated, with a cream barge board and a little lidded vent for the kettle's steam
    g.mat('flute', '#a8503a');
    g.quad([KX0 - 0.45, KR - 0.1, KZ0 - 0.4], [KX0 - 0.45, KR - 0.1, KZ1 + 0.4], [KM, KP, KZ1 + 0.4], [KM, KP, KZ0 - 0.4], { double: true });
    g.quad([KM, KP, KZ0 - 0.4], [KM, KP, KZ1 + 0.4], [KX1 + 0.45, KR - 0.1, KZ1 + 0.4], [KX1 + 0.45, KR - 0.1, KZ0 - 0.4], { double: true });
    g.mat('paint', '#e9dcc0'); for (const z of [KZ0, KZ1]) g.quad([KX0, KR, z], [KX1, KR, z], [KM, KP - 0.06, z], [KM, KP - 0.06, z], { double: true });
    g.mat('paint', '#efe2c8'); for (const z of [KZ0 - 0.42, KZ1 + 0.42]) { g.tube([[KX0 - 0.45, KR - 0.12, z], [KM, KP + 0.02, z], [KX1 + 0.45, KR - 0.12, z]], 0.04, { segs: 4 }); }
    g.mat('cast', '#3a3a36'); g.cyl(KM + 0.6, KP - 0.3, KZ0 + 1.2, 0.09, 0.75, { segs: 8 }); g.mat('cast', IP.brass); g.lathe(KM + 0.6, KZ0 + 1.2, [[0.0, KP + 0.45], [0.16, KP + 0.47], [0.12, KP + 0.55], [0, KP + 0.6]], { segs: 8 });
    // the hatch flap, propped open as an awning, striped
    for (let k = 0; k < 6; k++) { g.mat('weave', k % 2 ? '#efe6d2' : '#e7b547'); const z0 = KZ0 + 1.0 + k * 0.5, z1 = z0 + 0.5; g.quad([KX1, KY + 1.95, z0], [KX1, KY + 1.95, z1], [KX1 + 0.85, KY + 1.7, z1], [KX1 + 0.85, KY + 1.7, z0], { double: true }); }
    g.mat('wood', '#6b4a2f'); for (const z of [KZ0 + 1.05, KZ0 + 3.95]) g.tube([[KX1 + 0.05, KY + 1.0, z], [KX1 + 0.82, KY + 1.68, z]], 0.02, { segs: 4 });
    // the serving shelf outside the hatch, the back door (shut), a water butt
    g.mat('wood', '#c49a68', { rough: -0.05 }); g.box(KX1, KY + 0.98, KZ0 + 0.95, KX1 + 0.42, KY + 1.03, KZ0 + 4.05, { bevel: 0.01 });
    g.mat('paint', '#e7b547'); g.box(KX0 - 0.07, KY, KZ0 + 1.9, KX0 - 0.03, KY + 2.0, KZ0 + 2.8, { bevel: 0.01 });
    g.mat('cast', IP.brass); g.box(KX0 - 0.1, KY + 1.0, KZ0 + 2.65, KX0 - 0.07, KY + 1.08, KZ0 + 2.72);
  });
  s.solid(KX1, KY, KZ0 + 0.95, KX1 + 0.42, KY + 1.03, KZ0 + 4.05);
  // inside: the urns on the warm shelf, lidded cups in rows, the knife on its hook, a lamp
  block(s, KX0 + 0.15, KY, KZ0 + 0.2, KX0 + 0.75, KY + 0.92, KZ1 - 0.2, 'tile', '#b5653a', { bevel: 0.01 });
  prop(s, 'hollow.urn', KX0 + 0.45, KY + 0.92, KZ0 + 1.0, 0, {}); prop(s, 'hollow.urn', KX0 + 0.45, KY + 0.92, KZ0 + 1.7, 0, { col: '#7a6a5a' });
  for (let i = 0; i < 14; i++) prop(s, 'hollow.cup', KX1 + 0.12 + (i % 2) * 0.16, KY + 1.03, KZ0 + 1.15 + Math.floor(i / 2) * 0.4, 0, { c: pick(['#e9e1cf', '#3d6f8a', '#c9552e', '#e7b547', '#6b9f3e'], i) });
  prop(s, 'counter', KX1 - 0.55, KY, KZ0 + 2.5, -Math.PI / 2, { w: 3.0, d: 0.55, body: '#2f6f73', top: '#a8875a' }, { noSpots: true });
  for (let i = 0; i < 6; i++) prop(s, 'crock', KX1 - 0.6, KY + 0.92, KZ0 + 1.3 + i * 0.42, 0, { glaze: pick(['#e8d9b8', '#2f6f73', '#b5653a'], i), h: 0.2, r: 0.08 });
  s.spot('counter', KX1 - 1.15, KY, KZ0 + 2.5, Math.PI / 2, { tags: ['kettle', 'island', 'keeper'] });
  s.spot('customer', KX1 + 0.85, KY, KZ0 + 2.2, -Math.PI / 2, { tags: ['kettle', 'island'] }); s.spot('queue', KX1 + 1.5, KY, KZ0 + 3.4, -Math.PI / 2, { tags: ['kettle', 'island'] });
  lamp(s, 'globe', KM, KR - 0.25, (KZ0 + KZ1) / 2, { drop: 0.35, K: 2700, power: 0.7, range: 5, clip: [KX0, KY - 0.2, KZ0, KX1 + 0.3, KP, KZ1], lamp: true });
  lamp(s, 'lantern', KX1 + 0.65, KY + 1.65, KZ0 + 2.5, { tint: '#f2b56b', power: 0.7, drop: 0.2, night: true });
  sign(s, { kind: 'fascia', text: 'The Kettle', sub: 'tea · broth · lap rugs', palette: ['#2f6f73', '#f6ead0', '#e7b547'], emblem: 'cup' }, KX1 + 0.07, KY + 2.15, KZ0 + 2.5, { face: 'X', w: 2.4, h: 0.4 });
  sign(s, { kind: 'chalk', title: 'The Kettle', lines: ['Long-pour tea · 0.15', 'Broth, lidded · free', 'Sugar bun · 0.20', 'Lap rugs · lent', 'The knife is on the hook.'] }, KX1 + 0.07, KY + 1.45, KZ0 + 4.5, { face: 'X', w: 0.55, h: 0.7 });
  s.interact({ x: KX1 + 0.85, y: KY + 1.2, z: KZ0 + 2.5, radius: 1.6, kind: 'talk', prompt: 'Ask Ama for tea', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    if (!gm.flags.metAma) {
      gm.flags.metAma = true;
      await say(gm, AMA, ['Where did you sleep, and have you eaten? Guest, I can tell by the way you sat down. Have the broth, it is free out here.', 'The first boats are for the old ones, lamp-dawn to nine. After nine it is anybody. Most of them stay anyway. I keep the urns on the loop and the cups in rows and I do not hurry anyone.']);
    }
    const it = await buyFrom(gm, KETTLE_MENU, 'Ama');
    if (it) { sfx(gm, it.id === 'rug' ? 'paper' : 'cup', f, KX1 + 0.3, KY + 1.1, KZ0 + 2.5); if (it.id === 'rug') gm.flags.lmhiRug = true; if (it.id === 'tea') toast(gm, 'She pours from arm’s height. The tea takes its time coming down, and lands in the cup without a splash.'); }
  } });
  // tables and stools on the grass in front of the hatch
  for (const [x, z, n] of [[620.4, 1764.6, 0], [620.8, 1768.4, 1]]) {
    const y = gy(x, z); prop(s, 'table', x, y, z, n * 0.3, { w: 0.8, d: 0.8, wood: '#8a5a33' });
    prop(s, 'hollow.cup', x + 0.1, y + 0.74, z - 0.1, 0, { c: '#3d6f8a' });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + n; const sx = x + Math.cos(a) * 0.7, sz = z + Math.sin(a) * 0.7; prop(s, 'stool', sx, gy(sx, sz), sz, -a, {}, { spot: { tags: ['kettle', 'island', 'tea'] } }); }
  }
  for (const [x, z] of [[622.4, 1762.3], [623.5, 1762.9], [622.6, 1763.9]]) s.spot('chat', x, gy(x, z), z, Math.atan2(622.83 - x, 1763.03 - z), { tags: ['kettle', 'island', 'tea'] });

  // ---- the ring of lanterns round the crown: posts in a horseshoe, open on the lake side so the Settle can see out
  const LC = [619.0, 1758.0], LRX = 11.0, LRZ = 16.2, ring = [];
  for (let k = 0; k < 13; k++) {
    const a = Math.PI * 0.32 + k * (Math.PI * 1.36 / 12), x = LC[0] + Math.cos(a) * LRX, z = LC[1] + Math.sin(a) * LRZ;
    ring.push([x, z, k]);
  }
  ring.forEach(([x, z, k]) => {
    const y = gy(x, z); prop(s, 'lmhi.lanternpost', x, y, z, 0, { h: 2.6, band: pick(DYES, k) });
    s.light({ at: [x + 0.32, y + 2.35, z], color: [1, 0.68, 0.38], power: 1.3, range: 9, night: true, radius: 0.15 });
  });
  for (let k = 0; k < ring.length - 1; k++) {
    const a = ring[k], b = ring[k + 1];
    lanternString(s, [a[0], gy(a[0], a[1]) + 2.62, a[1]], [b[0], gy(b[0], b[1]) + 2.62, b[1]], { offset: k * 3, sag: 0.55, r: 0.12 });
  }
  // the mast in the middle of the ring: lantern strings run down from its crown to every post, so the ring is a tent of
  // lanterns you can see from the jetty, and the lake side is left open
  {
    const MX = 618.6, MZ = 1759.6, my = gy(MX, MZ), MH = 8.5, crown = [MX, my + MH - 0.35, MZ];
    s.furniture(() => {
      g.mat('stone', '#bfb4a2'); g.lathe(MX, MZ, [[0.55, my - 0.3], [0.55, my + 0.3], [0.45, my + 0.36], [0, my + 0.36]], { segs: 10 });
      g.mat('paint', '#8a2f3c'); g.lathe(MX, MZ, [[0.15, my + 0.36], [0.12, my + 1.0], [0.09, my + MH - 0.2], [0.1, my + MH]], { segs: 10 });
      ['#e7b547', '#2f8f8a', '#efe6d2', '#e7b547', '#3b4a8f'].forEach((c, i) => { g.mat('paint', c); g.cyl(MX, my + 1.4 + i * 1.3, MZ, 0.13 - i * 0.008, 0.24, { segs: 10 }); });
      g.mat('cast', IP.brass); g.lathe(MX, MZ, [[0.11, my + MH], [0.2, my + MH + 0.06], [0.12, my + MH + 0.22], [0.03, my + MH + 0.6], [0, my + MH + 0.65]], { segs: 10 });
      g.mat('cast', IP.iron); g.lathe(MX, MZ, [[0.5, my + MH - 0.42], [0.52, my + MH - 0.36], [0.5, my + MH - 0.3]], { segs: 14, capTop: false, capBottom: false });
    });
    s.post(MX, MZ, 0.2, my, my + MH);
    ring.forEach(([x, z, k]) => { if (k % 2) return; lanternString(s, crown, [x, gy(x, z) + 2.66, z], { offset: k, sag: 0.35, r: 0.11, n: 7 }); });
    s.light({ at: [MX, my + 3.2, MZ], color: [1, 0.7, 0.42], power: 2.0, range: 12, night: true, radius: 0.3 });
    s.interact({ x: MX + 0.6, y: my + 1.2, z: MZ, radius: 1.2, prompt: 'Read the plate on the mast', onUse: (gm) => say(gm, { name: 'The lantern mast', colour: '#e7b547' }, [
      'A brass plate at eye height: the lanterns are lit at lamp-night for whoever is still on the Settle, and taken down and mended every Knotnight by the blocks whose elders sat here that year.',
      'The ring is left open on the lake side, it says, so that nobody has to look at the lake through a string of lanterns.',
    ]) });
  }
  // the lanterns of the posts themselves, cloth over a wire frame, lit at night
  s.deco(() => { ring.forEach(([x, z, k]) => { const y = gy(x, z); g.mat('weave', '#3a332c'); g.tube([[x + 0.32, y + 2.86, z], [x + 0.32, y + 2.62, z]], 0.005, { segs: 3, caps: false }); g.mat('paper', pick(['#f2b56b', '#e07a6a', '#e7b547', '#f4e2c0'], k), { emissive: 3.2, night: true }); g.lathe(x + 0.32, z, [[0.05, y + 2.18], [0.15, y + 2.27], [0.17, y + 2.4], [0.15, y + 2.53], [0.05, y + 2.62]], { segs: 10 }); }); });

  // ---- the pier and the high board at the back end of the island, over the deepest water
  floor(s, PX - 0.95, PZ0, PX + 0.95, TZ1 + 0.4, PY, 'planks', '#b3a58e', { surf: 'wood' });
  s.structure(() => { g.mat('wood', '#6f6252'); for (const sx of [-1, 1]) g.box(PX + sx * 0.95 - 0.07, PY - 0.3, PZ0, PX + sx * 0.95 + 0.07, PY - 0.01, TZ1 + 0.4, { bevel: 0.01 }); });
  for (let z = PZ0 + 1.2; z <= TZ1 + 0.3; z += 2.2) for (const sx of [-1, 1]) { const x = PX + sx * 1.0, yb = Math.min(gy(x, z), W - 1) - 0.3; s.furniture(() => { g.mat('wood', '#4f4438'); g.lathe(x, z, [[0.11, yb], [0.11, PY + 0.1], [0.09, PY + 0.15]], { segs: 8 }); }); s.post(x, z, 0.11, yb, PY + 0.12); }
  // the stair up, the platform on four tall legs, rails, the board itself
  const SZ = 1781.0, run = TZ0 - SZ;
  stairs(s, PX - 0.48, PY, SZ, 'Z', TY - PY, run, 0.92, { mat: 'planks', tint: '#b3a58e', nosing: '#6f6252' });
  floor(s, PX - 1.1, TZ0, PX + 1.1, TZ1, TY, 'planks', '#b3a58e', { surf: 'wood' });
  s.structure(() => { g.mat('wood', '#6f6252'); g.box(PX - 1.1, TY - 0.28, TZ0, PX + 1.1, TY - 0.02, TZ1, { faces: 'xXzZy' }); });
  for (const [x, z] of [[PX - 1.0, TZ0 + 0.1], [PX + 1.0, TZ0 + 0.1], [PX - 1.0, TZ1 - 0.1], [PX + 1.0, TZ1 - 0.1]]) { s.furniture(() => { g.mat('wood', '#4f4438'); g.box(x - 0.1, PY - 0.2, z - 0.1, x + 0.1, TY - 0.02, z + 0.1, { bevel: 0.01 }); g.mat('wood', '#5a4e40'); }); s.post(x, z, 0.12, PY, TY); }
  s.furniture(() => { g.mat('wood', '#5a4e40'); for (const sx of [-1, 1]) { g.tube([[PX + sx * 1.0, PY + 0.2, TZ0 + 0.1], [PX + sx * 1.0, TY - 0.3, TZ1 - 0.1]], 0.05, { segs: 5 }); g.tube([[PX + sx * 1.0, PY + 0.2, TZ1 - 0.1], [PX + sx * 1.0, TY - 0.3, TZ0 + 0.1]], 0.05, { segs: 5 }); } });
  railing(s, [[PX - 1.05, TZ0], [PX - 1.05, TZ1]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[PX + 1.05, TZ0], [PX + 1.05, TZ1]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[PX - 1.05, TZ0 + 0.05], [PX - 0.5, TZ0 + 0.05]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' }); railing(s, [[PX + 0.5, TZ0 + 0.05], [PX + 1.05, TZ0 + 0.05]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  railing(s, [[PX - 1.05, TZ1 - 0.05], [PX - 0.4, TZ1 - 0.05]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' }); railing(s, [[PX + 0.4, TZ1 - 0.05], [PX + 1.05, TZ1 - 0.05]], TY, { h: 1.0, tint: '#b9bcb6', rail: '#b9bcb6', railMat: 'brushed' });
  s.furniture(() => { g.mat('brushed', '#b9bcb6'); for (const sx of [-1, 1]) g.tube([[PX + sx * 0.52, PY + 1.0, SZ], [PX + sx * 0.52, TY + 1.0, TZ0]], 0.024, { segs: 6 }); });
  for (const sx of [-1, 1]) s.solid(PX + sx * 0.52 - 0.04, PY + 0.4, SZ, PX + sx * 0.52 + 0.04, TY + 1.0, TZ0);
  block(s, PX - 0.3, TY - 0.06, TZ1 - 0.4, PX + 0.3, TY + 0.05, BZ1, 'wood', '#d9b25c', { bevel: 0.02, surf: 'wood' });
  s.structure(() => { g.mat('speckle', '#c4472c'); g.box(PX - 0.26, TY + 0.05, TZ1 + 0.3, PX + 0.26, TY + 0.058, BZ1 - 0.1, { faces: 'Y' }); g.mat('cast', '#3a3a36'); g.box(PX - 0.3, TY - 0.32, TZ1 - 0.2, PX + 0.3, TY - 0.06, TZ1 + 0.3); });
  // the ladder back out of the water, at the side of the pier
  s.furniture(() => { g.mat('brushed', '#b9bcb6'); for (const dz of [-0.25, 0.25]) g.tube([[PX + 1.08, W - 1.3, PZ0 + 6.5 + dz], [PX + 1.08, PY + 0.02, PZ0 + 6.5 + dz], [PX + 0.85, PY + 0.75, PZ0 + 6.5 + dz]], 0.022, { segs: 6 }); for (let y = W - 1.1; y < PY; y += 0.3) g.tube([[PX + 1.08, y, PZ0 + 6.25], [PX + 1.08, y, PZ0 + 6.75]], 0.016, { segs: 5 }); });
  s.interact({ x: PX + 1.6, y: W - 0.2, z: PZ0 + 6.5, radius: 1.5, prompt: 'Climb the ladder', onUse: (gm) => { if (gm.player) gm.player.place(f, PX + 0.4, PY + 0.02, PZ0 + 6.5, -Math.PI / 2, 0); sfx(gm, 'splash', f, PX + 1.2, W, PZ0 + 6.5); } });
  sign(s, { kind: 'notice', title: 'The high board', lines: ['Four and a half metres.', 'Deep water below, as deep', 'as this lake goes.', 'One at a time. Wait for', 'the splash to come down:', 'here it takes a while.', 'Robes at the Kettle.'] }, PX + 0.55, PY + 1.3, SZ - 0.06, { face: 'z', w: 0.5, h: 0.66 });
  lamp(s, 'pole', PX + 0.8, PY, PZ0 + 0.6, { h: 2.6, K: 2900, power: 0.8, range: 10, night: true });
  lamp(s, 'pole', PX + 0.9, TY, TZ1 - 0.25, { h: 1.6, K: 2900, power: 0.5, range: 8, night: true });
  s.spot('stand', PX - 0.6, TY, TZ0 + 0.6, Math.PI, { tags: ['island', 'dive', 'look'] }); s.spot('queue', PX - 0.2, PY, SZ - 0.8, Math.PI, { tags: ['island', 'dive'] });
  s.spot('sit', PX - 0.75, PY, PZ0 + 4.0, -Math.PI / 2, { tags: ['island', 'dangle'], low: true }); s.spot('sit', PX + 0.75, PY, PZ0 + 2.6, Math.PI / 2, { tags: ['island', 'dangle'], low: true });
  s.loop('water-lap', PX + 2, W, PZ0 + 6, { vol: 0.45, radius: 20 });
  // the dive: a real fall at the island's weight, a splash that rises slow and tall, and back up onto the pier
  const splash = buildSplash(s);
  let dive = null;
  s.interact({ x: PX, y: TY + 1.0, z: BZ1 - 0.5, radius: 1.1, prompt: 'Dive off the high board', enabled: () => !dive, onUse: (gm) => {
    const p = gm.player; if (!p || dive) return;
    gm.busy = (gm.busy || 0) + 1;
    p.place(f, PX, TY + 0.07, BZ1 + 0.3, Math.PI, -0.5);
    p.locked = true; p.onGround = false; p.vel.y = 2.4; p.vel.z = 2.3;
    dive = { t: 0, phase: 'air', tIn: 0, h: TY + 0.07 - W };
    sfx(gm, 'dive', f, PX, TY, BZ1);
  } });
  s.every((dt, gm) => {
    splash.update(dt);
    if (!dive) return;
    const p = gm.player; dive.t += dt;
    if (dive.phase === 'air' && (p.pos.y <= W + 0.02 || dive.t > 4)) {
      dive.phase = 'in'; dive.tIn = dive.t;
      splash.start(p.pos.x, p.pos.z + 0.8);
      sfx(gm, 'splash', f, p.pos.x, W, p.pos.z);
    } else if (dive.phase === 'in' && dive.t - dive.tIn > 0.7) {
      dive.phase = 'out';
      finishDive(gm, dive);
    }
  });
  async function finishDive(gm, d) {
    const p = gm.player;
    try {
      if (gm.ui) await gm.ui.fade(true, 0.35);
      p.place(f, PX - 0.1, PY + 0.02, TZ1 - 0.5, Math.PI, 0.22);
      if (gm.ui) await gm.ui.fade(false, 0.5);
    } finally {
      p.locked = false; gm.busy = Math.max(0, (gm.busy || 1) - 1); dive = null;
    }
    gm.flags = gm.flags || {}; const first = !gm.flags.dived_island; gm.flags.dived_island = true;
    const t1 = (2.4 + Math.sqrt(2.4 * 2.4 + 2 * 9.81 * d.h)) / 9.81;
    toast(gm, 'In the air ' + d.tIn.toFixed(1) + ' seconds. Off the same board at the rim it would be ' + t1.toFixed(1) + '. Half again as long, and you were awake for all of it.' + (first ? ' Back on the pier, the splash is still coming down.' : ''));
    found(gm, 'slow-dive');
  }

  // ---- paths for people
  s.path(route.map(([x, z]) => [x, gy(x, z), z]).concat([[SX + 1.4, gy(SX + 1.4, 1758), 1758]]));
  s.path([[ST.x0 + 1.0, ST.y, ST.z0 + 1.5], [ST.x1 - 0.2, ST.y, 1756]]);
  s.path([[SX + 1.4, gy(SX + 1.4, 1758), 1758], [SX + 1.4, gy(SX + 1.4, 1748.6), 1748.6]]);
  s.path([[SX + 1.4, gy(SX + 1.4, 1758), 1758], [SX + 1.3, gy(SX + 1.3, 1768.2), 1768.2], [623.5, gy(623.5, 1772.5), 1772.5], [PX, gy(PX, PZ0 - 0.6), PZ0 - 0.6], [PX, PY, PZ0 + 0.6], [PX, PY, SZ - 0.8]]);
  s.path([[621.5, gy(621.5, 1757.6), 1757.6], [KX1 + 1.4, gy(KX1 + 1.4, KZ0 + 2.5), KZ0 + 2.5]]);
  s.spot('work', 622.5, gy(622.5, 1760.8), 1760.8, 0.4, { tags: ['island', 'sweep'] });

  // ---- seen from the shore: the trees, the mast, the hut and the board as plain shapes, once the real ones have faded
  farMesh(s, (fg) => {
    for (const [x, z] of OLD) { const y = gy(x, z); fg.mat('bark', '#6a5848'); fg.cyl(x, y, z, 0.16, 1.9, { segs: 5, r1: 0.1 }); fg.mat('grass', '#a6c48c', { shade: 'foliage' }); fg.ball(x, y + 2.3, z, 1.7, 1.1, 1.7, { segs: 7, rings: 4 }); }
    const MX = 618.6, MZ = 1759.6, my = gy(MX, MZ); fg.mat('paint', '#8a2f3c'); fg.cyl(MX, my, MZ, 0.13, 8.6, { segs: 6 });
    fg.mat('paint', '#2f6f73'); fg.box(KX0, KY, KZ0, KX1, KY + 2.3, KZ1); fg.mat('flute', '#a8503a'); fg.prism([[KX0 - 0.4, KZ0 - 0.4], [KX1 + 0.4, KZ0 - 0.4], [KX1 + 0.4, KZ1 + 0.4], [KX0 - 0.4, KZ1 + 0.4]], KY + 2.3, KY + 2.6);
    fg.mat('wood', '#8a5a33'); fg.box(SX - 0.4, gy(SX, 1758) + 0.3, SZ0, SX + 0.3, gy(SX, 1758) + 1.1, SZ1);
    fg.mat('wood', '#5a4e40'); fg.box(PX - 1.0, PY - 0.3, TZ0, PX + 1.0, TY, TZ1); fg.box(PX - 0.95, PY - 0.3, PZ0, PX + 0.95, PY, TZ0); fg.mat('wood', '#d9b25c'); fg.box(PX - 0.3, TY - 0.05, TZ1, PX + 0.3, TY + 0.05, BZ1);
    fg.mat('planks', '#b3a58e'); fg.box(ST.x0, ST.y - 0.3, ST.z0, ST.x1, ST.y, ST.z1);
  }, 619, 1758, 70, 45);

  // ---- zones
  openZone(s, zones, { id: 'lmhi-island', place: 'lid-island', box: [588, -4, 1724, 648, 30, 1796], name: 'Lid Island', sub: 'the lake · the Settle, the Kettle, the high board' });
  openZone(s, zones, { id: 'lmhi-settle', place: 'lid-island', box: [SX - 3.5, -2, SZ0 - 1, RX + 1.5, 30, SZ1 + 1], name: 'The Settle', sub: 'Lid Island · for a hundred and over' });
  openZone(s, zones, { id: 'lmhi-kettle', place: 'lid-island', box: [KX0 - 0.6, -2, KZ0 - 0.6, KX1 + 4.5, 30, KZ1 + 0.8], name: 'The Kettle', sub: 'Lid Island · tea under a lid' });
  openZone(s, zones, { id: 'lmhi-board', place: 'lid-island', box: [PX - 3, -4, PZ0 - 0.5, PX + 3, 30, BZ1 + 3], name: 'The high board', sub: 'Lid Island · four and a half metres' });
  s.finish();
  return s;
}

// The splash: four pieces that rise and fall at the island's own weight (slowly), hidden under the lake between dives.
function buildSplash(s) {
  const G = 0.5 * 9.81, HIDE = -60;
  const parts = [
    { mm: movingMesh(s, drawColumn, { radius: 4 }), vy: 6.2, y0: -0.4, x: 0, z: 0 },
    { mm: movingMesh(s, drawCrown, { radius: 3 }), vy: 2.6, y0: -0.15, x: 0, z: 0 },
    { mm: movingMesh(s, drawSpray, { radius: 3 }), vy: 4.6, y0: -0.3, x: 0, z: 0.2 },
    { mm: movingMesh(s, drawFoam, { radius: 3 }), foam: true, x: 0, z: 0 },
  ];
  for (const q of parts) q.mm.origin[1] = HIDE;
  let t = -1, cx = 0, cz = 0;
  return {
    start(x, z) { t = 0; cx = x; cz = z; },
    update(dt) {
      if (t < 0) return;
      t += dt;
      for (const q of parts) {
        const o = q.mm.origin; o[0] = cx + q.x; o[2] = cz + q.z;
        if (q.foam) { o[1] = t < 7 ? W + 0.01 - Math.max(0, t - 5.5) * 0.04 : HIDE; continue; }
        const y = W + q.y0 + q.vy * t - 0.5 * G * t * t;
        o[1] = y < W - 3.6 ? HIDE : y;
      }
      if (t > 7.5) { t = -1; for (const q of parts) q.mm.origin[1] = HIDE; }
    },
  };
}
