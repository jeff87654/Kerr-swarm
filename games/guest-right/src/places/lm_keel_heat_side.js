// The rooms off the Loop Hall's long walls: the Gin Kitchen and the Cookers on the back side, the Salt Pans and the Inlet
// on the front side. Each is the kind of works that wants heat or makes it. Frame 'keel-heat' (see lm_keel_heat.js).
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, GIN, SALT, INLET, COOK, C, say, sfx, tick, lineX, dial, wheel } from './lm_keel_heat_props.js';

export async function buildSide(game, s, f, r) {
  ginKitchen(game, s, f, r);
  await tick(game);
  saltPans(game, s, f, r);
  await tick(game);
  inlet(game, s, f, r);
  cookers(game, s, f, r);
}

// walls of a room that opens off the hall: three walls (the hall's long wall is the fourth, with the openings in it)
function shell3(s, R, o) {
  const front = R.z0 === 15 ? R.z0 : R.z1, back = R.z0 === 15 ? R.z1 : R.z0;
  wall(s, R.x0, back, R.x1, back, 0, R.h, o);
  wall(s, R.x0, front, R.x0, back, 0, R.h, o);
  wall(s, R.x1, front, R.x1, back, 0, R.h, o);
}

// ---------------------------------------------------------------------------------------------------------------
// the Gin Kitchen: two copper vacuum stills on the loop's heat, a spirit safe, churns for the halls, a tasting shelf
// ---------------------------------------------------------------------------------------------------------------
function ginKitchen(game, s, f, r) {
  const g = s.g, R = GIN, clip = [R.x0 - 0.2, -0.3, R.z0 - 0.6, R.x1 + 0.2, R.h + 0.2, R.z1 + 0.2];
  floor(s, R.x0, R.z0, R.x1, R.z1, 0, 'tile', '#6b3a2a', { matOpts: { rough: -0.2 } });
  ceiling(s, R.x0, R.z0, R.x1, R.z1, R.h, 'wood', '#3b2a1e');
  shell3(s, R, { mat: 'plaster', tint: '#c98f5a', dado: { h: 1.2, mat: 'tile', tint: '#2c5a55' }, skirt: '#2a2622' });
  // beams, and the red feed pipes from the loop dropping to each still's jacket
  s.structure(() => {
    g.mat('wood', '#2a1e16'); for (let x = R.x0 + 2; x < R.x1; x += 3) g.box(x - 0.12, R.h - 0.3, R.z0, x + 0.12, R.h, R.z1);
    for (const sx of [-56, -46]) { g.mat('cast', C.loop); g.tube([[sx - 0.95, R.h, 24.5], [sx - 0.95, 1.05, 24.5]], 0.07, { segs: 8 }); g.mat('cast', C.ret); g.tube([[sx + 0.95, R.h, 24.5], [sx + 0.95, 0.75, 24.5]], 0.06, { segs: 8 }); g.mat('cast', C.water); g.tube([[sx + 0.5, R.h, 23.05], [sx + 0.5, 2.3, 23.05]], 0.035, { segs: 6 }); }
    // the vacuum line: a grey pipe along the back wall with a pump in the corner
    g.mat('cast', '#8d877c'); g.tube(lineX(R.x0 + 0.6, R.x1 - 0.6, 3.6, R.z1 - 0.3, 3), 0.06, { segs: 8, caps: false });
    for (const sx of [-56, -46]) g.tube([[sx, 3.6, R.z1 - 0.3], [sx, 3.6, 24.6], [sx, 3.45, 24.6]], 0.05, { segs: 6 });
    g.mat('paint', '#2c5a55'); g.box(R.x1 - 1.6, 0, R.z1 - 1.2, R.x1 - 0.3, 0.9, R.z1 - 0.2, { bevel: 0.03 }); g.mat('cast', C.steel); g.push(); g.move(R.x1 - 0.95, 1.25, R.z1 - 0.7); g.rotZ(PI / 2); g.cyl(0, -0.45, 0, 0.3, 0.9, { segs: 12 }); g.pop();
  });
  s.solid(R.x1 - 1.6, 0, R.z1 - 1.2, R.x1 - 0.3, 1.6, R.z1 - 0.2);
  prop(s, 'keelheat.still', -56, 0, 24.5, PI, { h: 3.6 });
  prop(s, 'keelheat.still', -46, 0, 24.5, PI, { h: 3.4 });
  prop(s, 'keelheat.safe', -51, 0, 21.4, 0, {});
  // churns for the halls along the back wall, each band a ring's colour
  const BANDS = ['#b5532e', '#2f6f73', '#c9962e', '#33407a', '#6b7a3a', '#8a2f3c', '#a8432e', '#5b4060'];
  for (let i = 0; i < 8; i++) prop(s, 'keelheat.churn', -53.6 + i * 0.5 - (i > 3 ? -0.6 : 0), 0, R.z1 - 0.45, 0, { band: BANDS[i] });
  // the tasting shelf on the spinward wall: little lidded glasses in a row, a ledger, the botanicals in crocks above
  s.furniture(() => {
    g.mat('wood', '#5b3a24', { rough: -0.1 }); g.box(R.x1 - 0.45, 1.05, 17.5, R.x1 - 0.1, 1.1, 22.5, { bevel: 0.01 }); g.box(R.x1 - 0.32, 1.8, 17.5, R.x1 - 0.1, 1.84, 22.5, { bevel: 0.01 }); g.box(R.x1 - 0.32, 2.4, 17.5, R.x1 - 0.1, 2.44, 22.5, { bevel: 0.01 });
    g.mat('cast', C.brass); for (const z of [17.6, 20, 22.4]) g.box(R.x1 - 0.42, 0.7, z - 0.02, R.x1 - 0.1, 1.05, z + 0.02);
  });
  for (let i = 0; i < 10; i++) prop(s, 'keelheat.taster', R.x1 - 0.27, 1.1, 17.8 + i * 0.45, 0, {});
  const CROCK = ['#2f4d6e', '#a8432e', '#e9e1cf', '#6b7a3a', '#c9962e', '#5b4060', '#2c5a55'];
  for (let i = 0; i < 9; i++) { prop(s, 'crock', R.x1 - 0.2, 1.84, 17.8 + i * 0.55, 0, { glaze: CROCK[i % 7], h: 0.24, r: 0.09 }); prop(s, 'crock', R.x1 - 0.2, 2.44, 17.9 + i * 0.55, 0, { glaze: CROCK[(i + 3) % 7], h: 0.2, r: 0.08 }); }
  sign(s, { kind: 'label', text: 'juniper · chervil · coriander · lemon peel', ink: '#f3e6c8' }, R.x1 - 0.09, 2.95, 20, { face: 'x', w: 3.6, h: 0.18 });
  // the botanicals table near the door: crates up from the garden racks, a scale, crates stacked in the corner
  prop(s, 'table', -56.5, 0, 18.2, 0, { w: 2.4, d: 0.9, wood: '#6b4a2f', legs: 'trestle' });
  const LEAF = ['#4f7a3a', '#6b8a3a', '#3d5f2c'];
  for (let i = 0; i < 3; i++) {
    prop(s, 'crate', -57.4 + i * 0.8, 0.74, 18.2, 0, { w: 0.6, h: 0.22, d: 0.42, wood: ['#b08d5e', '#9a7a4e', '#c4a272'][i] });
    s.detail(() => { g.mat('leafB', LEAF[i]); g.box(-57.65 + i * 0.8, 0.9, 18.05, -57.15 + i * 0.8, 0.95, 18.35, { faces: 'Y' }); });
  }
  s.detail(() => { g.mat('cast', C.brass, { rough: -0.2 }); g.cyl(-55.6, 0.74, 18.2, 0.16, 0.03, { segs: 14 }); g.box(-55.65, 0.77, 18.15, -55.55, 0.98, 18.25); g.lathe(-55.6, 18.2, [[0.14, 0.98], [0.16, 1.02], [0, 1.03]], { segs: 12 }); });
  for (let i = 0; i < 4; i++) prop(s, 'crate', -60.6, i * 0.4, 16.5, (i - 1.5) * 0.06, { w: 0.6, h: 0.4, d: 0.42, wood: i % 2 ? '#9a7a4e' : '#b08d5e' });
  s.solid(-60.95, 0, 16.2, -60.25, 1.6, 16.8);
  s.spot('work', -56.5, 0, 17.4, 0, { tags: ['cook', 'botanicals'] });
  // the notice: who may buy, and at what price
  const notice = { kind: 'board', title: 'Who may buy', lines: ['A hall with a cook on|by the churn', 'Anybody else|nobody else', 'Every churn|thiamine in it', 'Poured in the halls|after six', 'A glass in a hall|0.18', 'A bottle to a hall|2.80', 'As a gift|bring herbs'], palette: ['#3b2a1e', '#f3e6c8', '#f2b56b'] };
  sign(s, notice, -51, 2.3, R.z1 - 0.1, { face: 'z', w: 2.0, h: 1.4 });
  s.interact({ x: -51, y: 1.6, z: R.z1 - 2.6, radius: 2.0, prompt: 'Read who may buy', onUse: async (gm) => {
    await say(gm, 'The Gin Kitchen', [
      'WHO MAY BUY. A hall with a cook on, by the churn, and nobody else at any price. Every churn is dosed with thiamine before it leaves this room.',
      'Gin in Chervil is poured only in the halls, after six, where someone is always cooking. It is taxed lightly and it is cheap, 0.18 a glass, and Chervil\'s methanol deaths are among the lowest on Herb Row.',
      'Pencilled at the bottom: too cheap to be a gift. If you are going to somebody\'s table, bring herbs, not gin.',
    ]);
  } });
  s.interact({ x: -51, y: 1.3, z: 20.5, radius: 1.5, prompt: 'Look into the spirit safe', onUse: async (gm) => {
    await say(gm, 'The spirit safe', [
      'A brass box with glass sides, locked, and three white bowls inside that the spirit runs through on its way to the churns. Nobody can draw from it, which is the point of it.',
      'The stills run under a vacuum, at about a fifth of the air\'s pressure, so the spirit comes over at forty degrees instead of seventy-eight. The loop\'s own heat is enough to run them: no element, nothing to see but copper and a slow drip.',
      'The wash comes from the brew vats on this ring. The botanicals come up from the garden racks in crates: juniper, chervil, coriander, a little lemon peel.',
    ]);
  } });
  s.interact({ x: R.x1 - 1.0, y: 1.3, z: 20, radius: 1.6, prompt: 'Lift the lid of a tasting glass', onUse: async (gm) => {
    sfx(gm, 'lid-up', f, R.x1 - 0.3, 1.2, 20);
    await say(gm, 'The tasting shelf', [
      'Every glass has its own little glass lid. Heliox carries a scent away four times as fast as air, and the distiller says a spirit left open for a minute is a different spirit.',
      'This one smells of juniper first and then, a long way behind, of the herb the drum is named for. The hall cooks come down to choose by smell. Nobody here drinks before six, the distiller included.',
    ]);
    sfx(gm, 'lid-down', f, R.x1 - 0.3, 1.2, 20);
  } });
  // light: low and gold, over the copper
  for (const x of [-56, -46]) lamp(s, 'globe', x, 2.9, 22.4, { K: 2100, power: 0.9, drop: 1.4, r: 0.17, clip, lampFlag: false });
  lamp(s, 'globe', R.x1 - 1.0, 2.6, 20, { K: 2200, power: 0.7, drop: 1.7, r: 0.14, clip, lampFlag: false });
  lamp(s, 'globe', -51, 2.7, 17.4, { K: 2200, power: 0.6, drop: 1.6, r: 0.14, clip, lampFlag: false });
  s.ambient({ box: clip, sky: '#ffbf7a', ground: '#8a4a2a', power: 0.16, lamp: false });
  // people
  s.spot('work', -51, 0, 20.4, 0, { tags: ['cook', 'still'] });
  s.spot('work', -55.6, 0, 22.2, PI, { tags: ['notes', 'still'] });
  s.spot('stand', R.x1 - 0.9, 0, 19.2, PI / 2, { tags: ['taste'] }); s.spot('stand', R.x1 - 1.0, 0, 21.3, PI / 2, { tags: ['taste'] });
  s.spot('work', -53, 0, R.z1 - 1.1, 0, { tags: ['porter'] });
  s.path([[-48, 12.2], [-51.2, 13.6], [-51.2, 16.5], [-51.2, 19.6], [-43.5, 19.6], [-43.5, 21.5]]);
  s.path([[-51.2, 19.6], [-58.5, 19.6], [-58.5, 21.6]]);
  sign(s, { kind: 'street', text: 'The Gin Kitchen', sub: 'nothing for sale here', palette: ['#3b2a1e', '#f2c879'] }, -51.2, 3.0, 14.9, { face: 'z', w: 2.4, h: 0.5, glow: 0.7 });
  s.zoneBox({ id: 'keel-heat-gin', place: 'keel-heat', box: [R.x0, -0.5, R.z0, R.x1, R.h, R.z1], name: 'The Gin Kitchen', sub: 'The Loop Hall · the halls\' gin, on the loop\'s heat', ambience: 'shop', reverb: 'room', headroom: R.h });
  s.loop('steam', -51, 2, 24, { vol: 0.12, radius: 8 });
  void game; void r;
}

// ---------------------------------------------------------------------------------------------------------------
// the Salt Pans: brine from the Cookers and the Inlet on warm pans, rakes, a white floor, sacks stamped with rings
// ---------------------------------------------------------------------------------------------------------------
function saltPans(game, s, f, r) {
  const g = s.g, R = SALT, clip = [R.x0 - 0.2, -0.3, R.z0 - 0.2, R.x1 + 0.2, R.h + 0.2, R.z1 + 0.6];
  floor(s, R.x0, R.z0, R.x1, R.z1, 0, 'tile', '#ece9e1', { matOpts: { rough: -0.1 } });
  ceiling(s, R.x0, R.z0, R.x1, R.z1, R.h, 'panel', '#e8e6df');
  shell3(s, R, { mat: 'paint', tint: '#f0ede6', dado: { h: 2.0, mat: 'tile', tint: '#f4f2ec' }, skirt: '#9aa6a2' });
  // the pans, two rows of two, and the brine coming to them along the roof
  const PANS = [[-88.5, -26], [-78.5, -26], [-88.5, -21.6], [-78.5, -21.6]];
  PANS.forEach((p, i) => prop(s, 'keelheat.pan', p[0], 0, p[1], 0, { w: 9, d: 2.4, crust: [0.8, 0.35, 0.55, 0][i] }));
  s.structure(() => {
    g.mat('cast', '#7f9a98'); g.tube(lineX(R.x0 + 0.5, R.x1 - 0.5, 3.9, -23.8, 3), 0.1, { segs: 8, caps: false });
    for (const p of PANS) { const zs = p[1] < -23 ? 1 : -1; g.tube([[p[0] - 3.5, 3.9, -23.8], [p[0] - 3.5, 3.9, p[1] + zs * 0.9], [p[0] - 3.5, 1.0, p[1] + zs * 0.9]], 0.04, { segs: 6 }); g.mat('cast', C.brass); g.cyl(p[0] - 3.5, 2.0, p[1] + zs * 0.9, 0.07, 0.12, { segs: 8 }); g.mat('cast', '#7f9a98'); }
    g.mat('cast', C.loop); g.tube([[R.x0 + 0.3, 0.22, -23.7], [R.x1 - 0.3, 0.22, -23.7]], 0.07, { segs: 8 }); g.mat('cast', C.ret); g.tube([[R.x0 + 0.3, 0.12, -23.9], [R.x1 - 0.3, 0.12, -23.9]], 0.06, { segs: 8 });
  });
  // rakes leaning on the back wall and on a pan, a scoop, a shovel of white
  for (let i = 0; i < 5; i++) prop(s, 'keelheat.rake', -95 + i * 0.55, 0, R.z0 + 0.62, 0, {});
  prop(s, 'keelheat.rake', -83.6, 0, -24.2, PI / 2, {});
  // the dosing drum: thiamine and iodine, weighed into every batch
  s.furniture(() => {
    g.mat('brushed', '#d8d6d0', { rough: -0.2 }); g.cyl(-72, 0, -27.5, 0.55, 1.1, { segs: 16 }); g.lathe(-72, -27.5, [[0.55, 1.1], [0.3, 1.4], [0.12, 1.5]], { segs: 16 });
    for (const q of [[-72.5, '#c9962e'], [-71.5, '#5b4060']]) { g.mat('glaze', q[1]); g.lathe(q[0], -27.4, [[0.08, 1.4], [0.2, 1.75], [0.2, 1.95], [0, 1.96]], { segs: 12 }); }
  });
  s.solid(-72.6, 0, -28.1, -71.4, 1.9, -26.9);
  sign(s, { kind: 'label', text: 'Thiamine · Iodine', ink: '#2b2a26' }, -72, 0.75, -26.93, { face: 'Z', w: 0.9, h: 0.14 });
  sign(s, { kind: 'letters', text: 'SALT', font: 'caps', palette: ['#2f6f8f'] }, -84, 3.3, R.z0 + 0.1, { face: 'Z', w: 4.4, h: 1.1 });
  sign(s, { kind: 'letters', text: 'water · gas · salt · nothing wasted', font: 'caps', palette: ['#2f6f8f'] }, -84, 2.45, R.z0 + 0.1, { face: 'Z', w: 6.4, h: 0.32 });
  // the bagging hopper by the pallets: a steel funnel on legs, a sack under its spout, a weighing plate
  const hx = -82.4, hz = -17.8;
  s.furniture(() => {
    g.mat('brushed', '#cfcdc6', { rough: -0.2 }); g.lathe(hx, hz, [[0.08, 1.05], [0.12, 1.2], [0.7, 2.1], [0.74, 2.2]], { segs: 14, capTop: false, capBottom: false });
    g.mat('cast', C.steel); for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; g.tube([[hx + Math.sin(a) * 0.62, 0, hz + Math.cos(a) * 0.62], [hx + Math.sin(a) * 0.62, 2.2, hz + Math.cos(a) * 0.62]], 0.03, { segs: 5 }); }
    g.mat('plaster', '#f4f2ec'); g.lathe(hx, hz, [[0, 1.95], [0.62, 2.0], [0.3, 2.15], [0, 2.2]], { segs: 12 });
    g.mat('cast', '#3a3430'); g.box(hx - 0.4, 0, hz - 0.4, hx + 0.4, 0.08, hz + 0.4, { bevel: 0.01 });
    g.push(); g.move(hx + 0.42, 0.5, hz); g.rotY(PI / 2); dial(g, 0.12, 1.2); g.pop();
  });
  prop(s, 'keelheat.sack', hx, 0.08, hz, 0, { band: '#a8432e' });
  s.solid(hx - 0.7, 0, hz - 0.7, hx + 0.7, 2.2, hz + 0.7);
  // the sacks: stacked on pallets by the hall wall, each with a ring's colour and name
  const RINGS = [['Ring Seven', '#a8432e'], ['Ring Three', '#2f6f73'], ['Ring Five', '#c9962e'], ['Ring Two', '#33407a']];
  const pallets = [[-94, -17.2], [-90.6, -17.2], [-77.2, -17.2], [-73.8, -17.2]];
  pallets.forEach((p, k) => {
    s.furniture(() => { g.mat('wood', '#8a6d4a'); g.box(p[0] - 1.1, 0, p[1] - 0.75, p[0] + 1.1, 0.14, p[1] + 0.75, { bevel: 0.01 }); });
    const ring = RINGS[k], n = 4 + (k % 2) * 3;
    for (let i = 0; i < n; i++) { const col = i % 4, row = Math.floor(i / 4); prop(s, 'keelheat.sack', p[0] - 0.75 + (col % 2) * 0.52 + (col > 1 ? 0.52 * 0 : 0) + (col > 1 ? 1.0 : 0), 0.14 + row * 0.52, p[1] + (col % 2 ? 0.2 : -0.2), r.f(-0.15, 0.15), { band: ring[1] }); }
    sign(s, { kind: 'label', text: ring[0] + ' · 25 kg', ink: '#2b2a26' }, p[0], 0.45, p[1] + 0.76, { face: 'Z', w: 1.1, h: 0.16 });
    s.solid(p[0] - 1.1, 0, p[1] - 0.75, p[0] + 1.1, 1.2, p[1] + 0.75);
  });
  s.interact({ x: -84, y: 1.0, z: -21.6 + 1.6, radius: 1.6, prompt: 'Take a pinch of salt from the pan', onUse: async (gm) => {
    await say(gm, 'The Salt Pans', [
      'What is left of the drum\'s waste goes through the Cookers next door and comes out as water, gas and salt. The brine comes here and lies on warm pans, kept warm by the loop running under them, until the salt stands up out of it.',
      'The Inlet sends its share as well: whatever the moat\'s water gives up when it is cleaned for the taps.',
      'Before it is bagged it is weighed out with thiamine and iodine, like all the drum\'s salt. You lick your finger. It is salt.',
    ]);
  } });
  s.interact({ x: -92.3, y: 0.9, z: -16.0, radius: 1.5, prompt: 'Read the stamp on a sack', onUse: async (gm) => {
    await say(gm, 'A sack of salt', [
      'RING THREE · 25 KG · THIAMINE AND IODINE · BACK IN THIS SACK, PLEASE.',
      'The sacks go up in idle cabs overnight with the rest of the freight, and come back down empty and folded, to be stamped with the next ring\'s name over the last. This one has been stamped nine times. The oldest name on it is Ring Eight.',
    ]);
  } });
  // light: white, high and even, the brightest room off the hall
  for (const x of [-92, -84, -76]) for (const z of [-25.8, -18.8]) lamp(s, 'panel', x, R.h, z, { w: 2.4, d: 0.8, K: 4600, power: 1.0, clip, lampFlag: false });
  s.ambient({ box: clip, sky: '#eef4ff', ground: '#f4f2ec', power: 0.32, lamp: false });
  s.glowCard(-84, 0.3, -23.8, { face: 'y', color: '#f6f8ff', size: 10, strength: 0.03, follow: 'always' });
  // people
  for (const p of PANS) s.spot('work', p[0] + r.f(-2.5, 2.5), 0, p[1] + (p[1] < -23 ? 1.75 : -1.75), p[1] < -23 ? PI : 0, { tags: ['crew', 'salt'] });
  s.spot('work', -72, 0, -26.4, PI, { tags: ['notes', 'salt'] });
  s.spot('work', -92.3, 0, -16.6, PI, { tags: ['porter'] }); s.spot('work', -75.5, 0, -16.6, PI, { tags: ['porter'] });
  s.spot('work', -80, 0, -23.8, r.f(0, 6), { tags: ['wash'] });
  s.path([[-80, -12.2], [-84, -13.6], [-84, -16.5], [-84, -23.8], [-94, -23.8]]); s.path([[-84, -23.8], [-73.5, -23.8], [-73.5, -26.2]]);
  sign(s, { kind: 'street', text: 'The Salt Pans', sub: 'mind the floor: it is white for a reason', palette: ['#e8e6df', '#2b2a26'] }, -84, 3.1, -14.9, { face: 'Z', w: 2.6, h: 0.52, glow: 0.4 });
  s.zoneBox({ id: 'keel-heat-salt', place: 'keel-heat', box: [R.x0, -0.5, R.z0, R.x1, R.h, R.z1], name: 'The Salt Pans', sub: 'The Loop Hall · salt on warm pans', ambience: 'shop', reverb: 'tile', headroom: R.h });
  s.loop('water-lap', -84, 0.8, -23.8, { vol: 0.12, radius: 10 });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// the Inlet: two great sleeved pipes from the moat coming up through the floor in frost-white collars
// ---------------------------------------------------------------------------------------------------------------
function inlet(game, s, f, r) {
  const g = s.g, R = INLET, clip = [R.x0 - 0.2, -0.3, R.z0 - 0.2, R.x1 + 0.2, R.h + 0.2, R.z1 + 0.6];
  floor(s, R.x0, R.z0, R.x1, R.z1, 0, 'deckplate', '#7a7e7c');
  ceiling(s, R.x0, R.z0, R.x1, R.z1, R.h, 'panel', '#2e3436');
  shell3(s, R, { mat: 'panel', tint: '#9fb4b4', dado: { h: 2.4, mat: 'tile', tint: '#2f4d6e' }, skirt: '#2a2622' });
  const PIPES = [24, 37];
  for (const px of PIPES) {
    prop(s, 'keelheat.inletpipe', px, 0, -27.6, 0, {});
    // on from the bend: along toward the hall, through a strainer, and up through the roof to be cleaned
    s.structure(() => {
      g.mat('cast', C.water, { rough: -0.1 }); g.tube([[px, 3.78, -23.4], [px, 3.78, -20.5], [px, 4.6, -19.4], [px, R.h, -19.4]], 0.85, { segs: 20, caps: false });
      g.mat('cast', C.brass, { rough: -0.2 }); for (const y of [5.6, 6.6]) g.tube([[px, y - 0.06, -19.4], [px, y + 0.06, -19.4]], 0.9, { segs: 20, caps: false });
      // the isolating valve on the run: a flanged body, its bolts, a stem and a great wheel on top
      g.mat('cast', '#5a5650'); g.push(); g.move(px, 3.78, -21.9); g.rotX(PI / 2); g.cyl(0, -0.25, 0, 1.08, 0.5, { segs: 22 }); g.pop();
      for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.push(); g.move(px + Math.sin(a) * 1.0, 3.78 + Math.cos(a) * 1.0, -21.9); g.rotX(PI / 2); g.cyl(0, -0.3, 0, 0.04, 0.6, { segs: 5 }); g.pop(); }
      g.tube([[px, 4.8, -21.9], [px, 5.6, -21.9]], 0.06, { segs: 6 });
      g.push(); g.move(px, 5.6, -21.9); g.rotX(-PI / 2); wheel(g, 0.7, '#a63c28'); g.pop();
      // its saddle from the floor
      g.mat('cast', '#6a7476'); g.box(px - 0.7, 0, -22.2, px + 0.7, 2.9, -21.6, { bevel: 0.02 }); g.box(px - 1.0, 0, -22.5, px + 1.0, 0.12, -21.3);
    });
    s.solid(px - 0.7, 0, -22.2, px + 0.7, 4.7, -21.6); s.post(px, -19.4, 0.9, 3.5, R.h);
    s.spot('work', px + 2.0, 0, -26, -PI / 2, { tags: ['notes', 'inlet'] });
  }
  // the plate on the first collar, and the tide board on the end wall
  sign(s, { kind: 'plate', text: 'The Inlet', lines: ['under this floor: the rim and the hull', 'then nothing · then 50 m of hydrogen at 20 K', 'then half a metre of water, the moat', 'then nothing at all'] }, 24 + 1.62, 0.9, -27.6, { face: 'X', w: 0.9, h: 0.42 });
  s.interact({ x: 26.6, y: 1.0, z: -27.6, radius: 1.6, prompt: 'Read the plate on the collar', onUse: async (gm) => {
    await say(gm, 'The Inlet', [
      'Water from the moat: the drum\'s own half metre of water, wrapped round the outside of everything, its shield against the X-rays and its supply. It comes across the jacket in vacuum-sleeved pipes, so the cold of the hydrogen cannot reach it on the way.',
      'Under this floor: deck two, the rim deck, and the hull. Past the hull, a gap of nothing, then fifty metres of liquid hydrogen at twenty kelvin, then the half metre of water. Past that there is nothing at all.',
      'It comes in at about four degrees, and the collars sweat, so they are wrapped thick in white felt and look like frost. From here it is cleaned and goes up to every tap.',
    ]);
  } });
  sign(s, { kind: 'board', title: 'The tide', lines: ['Tide tonight|none', 'Tanks at mid-drum|kept, empty', 'Out by glide this morning|about as many', 'In by glide this morning|as went out', 'So|no tide'], palette: ['#2f4d6e', '#f3e6c8', '#a9d8e8'] }, R.x1 - 0.1, 2.0, -24.5, { face: 'x', w: 2.0, h: 1.3 });
  s.interact({ x: R.x1 - 1.0, y: 1.6, z: -24.5, radius: 1.8, prompt: 'Read the tide board', onUse: async (gm) => {
    await say(gm, 'The tide', [
      'A drum whose commuters glide out each morning sends about three million tonnes out through its rim and slows by about a thousandth. To make it up it pumps three million tonnes of moat water to tanks at mid-drum, and lets it back out through turbines at night. That is a tide.',
      'Chervil hires its own people first, and its visitors come in about as fast as its own people go out. A drum with as many visitors as commuters does not need a tide. The tanks are kept, and the board mostly says none.',
      'Chalked underneath, in an old hand: the tanks are full of nothing and very clean.',
    ]);
  } });
  sign(s, { kind: 'letters', text: 'FROM THE MOAT', font: 'caps', palette: ['#e8f2ff'] }, 30.5, 4.7, R.z0 + 0.1, { face: 'Z', w: 7, h: 0.8, glow: 0.5 });
  s.furniture(() => {
    g.mat('panel', '#2f4d6e'); g.box(28.3, 2.2, R.z0 + 0.08, 32.7, 3.4, R.z0 + 0.18, { bevel: 0.02 });
    for (let i = 0; i < 4; i++) { g.push(); g.move(28.9 + i * 0.95, 2.8, R.z0 + 0.18); dial(g, 0.2, 0.2 + i * 0.6); g.pop(); }
  });
  // light: cool, after the amber of the hall
  lamp(s, 'panel', 24, R.h, -24.5, { w: 2.0, d: 0.8, K: 5200, power: 1.1, clip, lampFlag: false });
  lamp(s, 'panel', 37, R.h, -24.5, { w: 2.0, d: 0.8, K: 5200, power: 1.1, clip, lampFlag: false });
  lamp(s, 'panel', 30.5, R.h, -17.5, { w: 2.0, d: 0.8, K: 4400, power: 0.8, clip, lampFlag: false });
  s.ambient({ box: clip, sky: '#cfe2f0', ground: '#7a8a90', power: 0.22, lamp: false });
  for (const px of PIPES) s.glowCard(px, 0.25, -27.6, { face: 'y', color: '#e8f4ff', size: 4.4, strength: 0.06, follow: 'always' });
  s.spot('stand', R.x1 - 1.4, 0, -24.5, PI / 2, { tags: ['board'] });
  s.spot('work', 30.5, 0, -20.5, r.f(0, 6), { tags: ['sweep'] });
  s.path([[32, -12.2], [29.5, -13.6], [29.5, -17], [30.5, -24], [R.x1 - 1.6, -24.5]]); s.path([[30.5, -24], [26.4, -26]]);
  sign(s, { kind: 'street', text: 'The Inlet', sub: 'water in from the moat', palette: ['#2f4d6e', '#f1ead8'] }, 29.5, 4.1, -14.9, { face: 'Z', w: 2.4, h: 0.52, glow: 0.7 });
  s.zoneBox({ id: 'keel-heat-inlet', place: 'keel-heat', box: [R.x0, -0.5, R.z0, R.x1, R.h, R.z1], name: 'The Inlet', sub: 'The Loop Hall · water in from the moat', ambience: 'station', reverb: 'ring', headroom: R.h });
  s.loop('tide', 30.5, 3.5, -24, { vol: 0.35, radius: 14 });
  void game;
}

// ---------------------------------------------------------------------------------------------------------------
// the Cookers: the oxidisers, seen through a glass screen. Water past 374 degrees, no flame.
// ---------------------------------------------------------------------------------------------------------------
function cookers(game, s, f, r) {
  const g = s.g, R = COOK, sc = R.screen, clip = [R.x0 - 0.2, -0.3, R.z0 - 0.6, R.x1 + 0.2, R.h + 0.2, R.z1 + 0.2];
  floor(s, R.x0, R.z0, R.x1, sc, 0, 'speckle', '#4a4f50');
  floor(s, R.x0, sc, R.x1, R.z1, 0, 'deckplate', '#6a6e6c');
  ceiling(s, R.x0, R.z0, R.x1, R.z1, R.h, 'panel', '#2e3436');
  shell3(s, R, { mat: 'panel', tint: '#8a8f86', dado: { h: 2.4, mat: 'tile', tint: '#3a4a48' }, skirt: '#2a2622' });
  // the screen: a low wall, thick glass to 3.2, panels above
  wall(s, R.x0, sc, R.x1, sc, 0, R.h, { mat: 'panel', tintA: '#7a807a', tintB: '#3a4a48', skirt: '#2a2622', openings: [{ at: 1.0, w: R.x1 - R.x0 - 2.0, h: 2.3, sill: 0.9 }] });
  s.glass(R.x0 + 1.0, 0.9, sc, R.x1 - 1.0, 3.2, sc, { tint: '#d8e6e0', opacity: 0.12 });
  s.structure(() => { g.mat('cast', C.steel); for (let x = R.x0 + 1.0; x <= R.x1 - 0.99; x += 2.8) g.box(x - 0.06, 0.9, sc - 0.08, x + 0.06, 3.2, sc + 0.08); g.mat('wood', '#4a3424'); g.box(R.x0 + 1, 0.86, sc - 0.35, R.x1 - 1, 0.92, sc + 0.08); });
  // four vessels, their pipes, a red lamp that says they are at pressure
  const XS = [46, 52.5, 59, 65.5];
  for (const x of XS) prop(s, 'keelheat.oxidiser', x, 0, 24.5, 0, {});
  s.structure(() => {
    g.mat('cast', C.steel); g.tube(lineX(R.x0 + 1.5, R.x1 - 1.5, 6.6, 24.5, 3), 0.18, { segs: 10, caps: false });
    g.mat('cast', '#7f9a98'); g.tube(lineX(R.x0 + 1.5, R.x1 - 1.5, 1.3, 27.6, 3), 0.12, { segs: 8, caps: false });
    for (const x of XS) { g.tube([[x, 0.6, 25.4], [x, 1.3, 26.8], [x, 1.3, 27.6]], 0.08, { segs: 6 }); g.mat('cast', C.loop); g.tube([[x + 0.95, 1.0, 24.5], [x + 1.4, 1.0, 24.5], [x + 1.4, R.h, 24.5]], 0.1, { segs: 8 }); g.mat('cast', '#7f9a98'); }
    g.mat('diffuser', '#ff5040', { emissive: 4 }); for (const x of XS) g.ball(x, 4.0, 25.42, 0.07, 0.07, 0.07, { segs: 8, rings: 5 });
  });
  s.light({ at: [56, 3.6, 25.6], color: [1.0, 0.25, 0.18], power: 3, range: 6, radius: 0.1, clip: [R.x0, 0, sc, R.x1, R.h, R.z1] });
  sign(s, { kind: 'letters', text: 'AT PRESSURE · 221 BAR · 380 DEGREES', font: 'caps', palette: ['#ff8a70'] }, 56, 6.75, R.z1 - 0.1, { face: 'z', w: 10, h: 0.6, glow: 3.0 });
  // a gantry along the vessels' heads, for the crews who change the seals
  s.structure(() => {
    const y = 4.6, z0 = 25.5, z1 = 27.0;
    g.mat('grille', '#6a6a62'); g.box(R.x0 + 2, y - 0.04, z0, R.x1 - 2, y, z1, { faces: 'Yy' });
    g.mat('cast', C.warn); g.tube(lineX(R.x0 + 2, R.x1 - 2, y + 1.05, z0, 4), 0.03, { segs: 6, caps: false });
    g.mat('cast', C.steel); for (let x = R.x0 + 2; x <= R.x1 - 1.9; x += 2) { g.tube([[x, y, z0], [x, y + 1.05, z0]], 0.022, { segs: 4 }); g.tube([[x, 0, z1 - 0.05], [x, y, z1 - 0.05]], 0.05, { segs: 6 }); }
    g.box(R.x0 + 2, y - 0.22, z0 - 0.05, R.x1 - 2, y - 0.04, z0);
  });
  sign(s, { kind: 'plate', text: 'The Cookers', lines: ['oxidisers 1 to 4', 'no entry at pressure', 'water, gas and salt'] }, 51.5, 1.55, sc - 0.1, { face: 'z', w: 0.62, h: 0.34 });
  s.interact({ x: 51.5, y: 1.4, z: sc - 1.0, radius: 1.8, prompt: 'Read the plate on the glass', onUse: async (gm) => {
    await say(gm, 'The Cookers', [
      'THE COOKERS, which the plans call the oxidisers. What is left of the drum\'s waste, after everything that can be used has been, comes here in water.',
      'The water is taken past 374 degrees and 221 times the air\'s pressure, where it is neither liquid nor steam. In water like that, anything that can burn is oxidised in seconds, to water, gas and salt. There is no flame. There is none anywhere in the drum, and least of all here.',
      'The heat goes back into the loop. The salt goes next door to the pans. The water goes back to the taps. Everything comes home this way in the end.',
    ]);
  } });
  // the viewing strip: a bench, a lamp
  prop(s, 'bench', 62, 0, R.z0 + 0.7, 0, { w: 2.4, wood: '#6b4a2f', back: false });
  lamp(s, 'sconce', R.x1 - 0.1, 2.4, 16.8, { K: 2700, power: 0.7, face: 'x', clip: [R.x0, -0.3, R.z0 - 0.6, R.x1, R.h, sc + 0.1] });
  // inside: hard white light on grey steel
  s.light({ at: [R.x0 + 2, 6.4, 22], to: [R.x1 - 2, 6.4, 22], type: 'tube', color: [0.86, 0.92, 1.0], power: 16, range: 10, radius: 0.12, shadow: true, clip: [R.x0, 0, sc, R.x1, R.h, R.z1] });
  s.structure(() => { g.mat('diffuser', '#e8f2ff', { emissive: 4 }); g.box(R.x0 + 2, 6.5, 21.95, R.x1 - 2, 6.56, 22.05); });
  s.ambient({ box: [R.x0, 0, sc, R.x1, R.h, R.z1], sky: '#d8e4f0', ground: '#6a6e6c', power: 0.16, lamp: false });
  s.ambient({ box: [R.x0, 0, R.z0 - 0.4, R.x1, R.h, sc], sky: '#ffd8a8', ground: '#5a4a3a', power: 0.12, lamp: false });
  // people: watchers at the glass, one crew inside at a vessel
  s.spot('stand', 49, 0, sc - 0.9, 0, { tags: ['look'] }); s.spot('stand', 57.5, 0, sc - 0.8, 0, { tags: ['look'] });
  s.spot('work', 52.5, 0, 22.6, 0, { tags: ['crew', 'cookers'] });
  s.path([[48, 12.2], [51.5, 13.6], [51.5, 16.8], [45, 16.8]]); s.path([[51.5, 16.8], [66, 16.8]]);
  sign(s, { kind: 'street', text: 'The Cookers', sub: 'look, do not knock', palette: ['#3a4a48', '#f1ead8'] }, 51.5, 3.6, 14.9, { face: 'z', w: 2.4, h: 0.52, glow: 0.7 });
  s.zoneBox({ id: 'keel-heat-cookers', place: 'keel-heat', box: [R.x0, -0.5, R.z0, R.x1, R.h, R.z1], name: 'The Cookers', sub: 'The Loop Hall · the oxidisers, behind glass', ambience: 'station', reverb: 'room', headroom: R.h });
  s.loop('air', 56, 4, 25, { vol: 0.22, radius: 12 });
  void game;
}
