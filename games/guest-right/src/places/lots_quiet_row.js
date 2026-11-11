// The lamp row: fourteen elders pooled their light into one bright strip. Fourteen tiny gardens side by side along the back
// wall, each under its own lamp, each kept by one person whose name is on a stake, with a bench facing each. The front half
// of the room is kept dim, with old chairs turned to face the strip, a potting table, a tap, and tea on the loop.
import { say, note } from '../city/lots.js';
import { room } from '../world/kit2.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { local, pick, sitAWhile, brightFront, wallRailQ, noticeBoard } from './lots_quiet_kit.js';

const GIVEN = ['Odile', 'Ines', 'Tomas', 'Bel', 'Yusuf', 'Mirela', 'Kofi', 'Hana', 'Ilse', 'Ravi', 'Wen', 'Agnes', 'Teo', 'Saba', 'Piet', 'Lior', 'Amara', 'Noor', 'Bruno', 'Edda', 'Kemal', 'Ottilie', 'Sami', 'Juno', 'Halvard', 'Mei', 'Dario', 'Femi', 'Nell', 'Kasimir', 'Rosa', 'Aiko', 'Ingrid', 'Tariq', 'Ludo', 'Maren', 'Esko', 'Viv', 'Anouk', 'Zeno'];
const FAMILY = ['Marsh', 'Okafor', 'Brandt', 'Abara', 'Lind', 'Moreau', 'Tan', 'Kovac', 'Osei', 'Ferrand', 'Nakai', 'Petrov', 'Duarte', 'Haig', 'Sund', 'Achebe', 'Varga', 'Lowe', 'Ishida', 'Pereira', 'Rask', 'Mbeki', 'Coyle', 'Navarro'];
const KINDS = ['tomato', 'herbs', 'flowers', 'lemon', 'chervil', 'strawberry', 'greens', 'chilli', 'bonsai'];
const KIND_LINES = {
  tomato: ['Tomatoes on strings, three trusses. Each one is worth half a kay, and they are all promised to somebody.', 'Tomatoes, the old sort, from seed kept in a twist of paper for forty years.'],
  herbs: ['Herbs: thyme, sage, a mint kept in its own pot so it behaves. A card: "Cut some for your host. Herbs, not gin."', 'Herbs in rows as straight as a ruler. The hall cook comes for the sage on Thursdays.'],
  flowers: ['Flowers and nothing you can eat. A card: "I have eaten enough. These are for looking at."', 'Flowers in every colour the seed library had, crowded in on purpose.'],
  lemon: ['One lemon tree in a pot, waist high, with four lemons on it. A lemon here is a present, not a fruit.', 'A dwarf lemon, older than the bench. The card asks you to smell a leaf and not to pick one.'],
  chervil: ['Chervil, the drum\'s own herb, in a fine green haze. Kept for namings: a sprig goes to every new table.', 'A bed of chervil and nothing else. The card says the first ring counter in the drum served it, and so does this one.'],
  strawberry: ['Strawberries, low under the lamp, a few red ones showing. The children of the block know exactly how many.', 'Strawberries in a ring round a stone. Picked once a week and shared at the hall, one each.'],
  greens: ['Salad greens cut and coming again. They go to the hall, which is why the hall\'s salad is never small.', 'Greens in rows, cut young. The card gives the day each row was sown.'],
  chilli: ['Chillies, small and red. A card: "Ask first. I mean it."', 'A chilli bush trained into a ball. Its keeper dries them on a string at home.'],
  bonsai: ['A small tree in a stone tray, kept small on purpose for sixty years, with moss and three stones round it.', 'An old tree in miniature, wired and patient. The card says it came from the Hollow as a seed in a pocket.'],
  vacant: ['Bare and raked, with a new stake and no name on it yet. A card: "Kept by the one before for thirty years. Apply at the block office."', 'Raked smooth, the lamp left on low. The last keeper\'s name is on the old stake, laid flat in the soil.'],
};
const TAGS = [
  'Under the name, in a different hand: "watered while away".',
  'The stake has been repainted so many times the name stands proud of the wood.',
  'A string tied round the stake, red, for a grandchild\'s naming.',
  'The stake gives an age, crossed out and written again, one higher.',
  'A brass tag on the stake: the lamp is paid from this keeper\'s own wallet.',
  'Somebody has drawn a small sunline over the name, in pencil.',
  'A note tucked behind the stake: "Thank you for the cuttings."',
  'The stake is new; the soil is old.',
];
const LAMP = ['#fff1dc', '#ffe6c0', '#f6fff0', '#ffe9f2', '#fff7e6', '#f0f6ff'];
const PAINT = ['#c9552e', '#2f6f73', '#d6a640', '#5b3a6e', '#6b7a3a', '#a8412b', '#33407a', '#e9dcc0', '#8a2f3c', '#3f7f6a'];
const WOOD = ['#7a5233', '#8a6240', '#6b4a2f', '#9a6a40', '#5b4030', '#a8794f'];

export async function buildLampRow(s, lot, plan, game, tick) {
  const r = new Rng(lot.seed), info = plan.info, H = 3.3;
  const L = local(s, lot, r.chance(0.5)), g = L.g, W = L.W, D = L.D;
  // ---------------- the shell: warm planks, plaster, a dark ceiling so the strip reads ----------------
  room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['planks', '#9a7350'], ceil: ['paint', '#3a3530'], wall: { mat: 'plaster', tint: '#d9cbb0', dado: { h: 0.95, mat: 'wood', tint: '#5b4030' } }, open: { [lot.front]: false }, glow: false });
  const clip = L.clip(0.1, 0.3, W - 0.1, D - 0.1, -0.3, H + 0.1, 0.05);
  await tick();
  const fin = { mat: 'paint', tint: '#3f4f2a', dado: { h: 0.95, mat: 'wood', tint: '#2f2a22' }, trim: '#e3cf98', pil: '#c9bda6', bar: '#2f2a22', step: '#b5aa94', sillT: '#7a5233' };
  const dP = W * 0.5 + r.f(-2.5, 2.5);
  await brightFront(L, plan, { doorP: dP, doorW: 2.4, fin, H, name: 'LAMP ROW', sub: 'fourteen gardens · one strip of light', palette: ['#2f3a22', '#f6ecd0', '#f2c14e'], sill: 0.85, inner: { mat: 'plaster', tint: '#d9cbb0', dado: { h: 0.95, mat: 'wood', tint: '#5b4030' } } }, tick);
  await tick();

  // ---------------- the strip: fourteen gardens on the back wall ----------------
  const N = 14, G0 = 0.3, gw = (W - 0.6) / N, GQ = D - 2.75, KH = 0.68;
  const used = new Set(), keepers = [];
  const vacant = r.chance(0.35) ? r.i(0, N - 1) : -1;
  for (let i = 0; i < N; i++) {
    let gi = r.i(0, GIVEN.length - 1); while (used.has(gi)) gi = (gi + 1) % GIVEN.length; used.add(gi);
    keepers.push({ name: GIVEN[gi] + ' ' + FAMILY[r.i(0, FAMILY.length - 1)], age: r.i(74, 103), kind: i === vacant ? 'vacant' : KINDS[(i * 5 + r.i(0, 8)) % KINDS.length], paint: PAINT[r.i(0, PAINT.length - 1)], lamp: LAMP[r.i(0, LAMP.length - 1)] });
  }
  // the long bed: a kerb along the front, boards between the gardens, fibre to the brim
  g.mat('wood', '#5b4030'); L.box(G0, 0, GQ, W - G0, KH, GQ + 0.08, { bevel: 0.01, faces: 'qQYpP' });
  g.mat('soil', '#5b4a3a'); L.box(G0, KH - 0.04, GQ + 0.08, W - G0, KH - 0.02, D - 0.16, { faces: 'Y' });
  g.mat('wood', '#4a3426'); L.box(G0, 0, GQ, W - G0, KH - 0.04, D - 0.16, { faces: 'q' });
  for (let i = 0; i <= N; i++) { const p = G0 + i * gw; g.mat('paint', i < N ? keepers[i].paint : keepers[N - 1].paint); L.box(p - 0.025, KH - 0.04, GQ, p + 0.025, KH + 0.06, D - 0.16, { bevel: 0.005 }); }
  s.flush({ tier: 's', cast: true }); L.solid(G0, 0, GQ, W - G0, KH, D - 0.16);
  // a painted back for each garden, in its keeper's colour, faded
  for (let i = 0; i < N; i++) { g.mat('plaster', mixHex(keepers[i].paint, '#d9cbb0', 0.6)); L.box(G0 + i * gw + 0.03, KH, D - 0.17, G0 + (i + 1) * gw - 0.03, 2.3, D - 0.165, { faces: 'q' }); }
  s.flush({ tier: 's' });
  await tick();
  for (let i = 0; i < N; i++) {
    const k = keepers[i], c = G0 + (i + 0.5) * gw, gq = (GQ + D - 0.16) / 2, y = KH - 0.02;
    plantGarden(L, r, k.kind, c, gq, gw, y);
    // the stake at the front, the lamp over it
    L.prop('lots-quiet.stake', c + gw * 0.28, y, GQ + 0.18, L.yaw(0, -1), { c: k.paint, wood: '#8a6240' }, { noCollide: true });
    g.mat('cast', '#2a2622'); L.tube([[c, H, gq - 0.3], [c, 2.62, gq - 0.3]], 0.006, { segs: 4, caps: false });
    g.mat('cast', shadeHex(k.paint, 0.8)); L.lathe(c, gq - 0.3, [[0.05, 2.62], [0.08, 2.6], [0.24, 2.46], [0.26, 2.44], [0.23, 2.44], [0.07, 2.56]], { segs: 12 });
    g.mat('diffuser', k.lamp, { emissive: 6, lamp: true }); L.cyl(c, 2.455, gq - 0.3, 0.2, 0.01, { segs: 12 });
    s.flush({ tier: 'd', cast: false });
    const gc = L.clip(G0 + i * gw - 0.02, GQ - 1.6, G0 + (i + 1) * gw + 0.02, D - 0.1, -0.2, H, 0);
    L.light({ at: [c, 2.42, gq - 0.3], type: 'spot', dir: [0, -1, 0.12], cone: [58, 30], color: k.lamp, power: i === vacant ? 3 : 13, range: 4.2, clip: gc, lamp: true, shadow: true });
    await tick();
  }

  // ---------------- a bench facing each garden, every one different ----------------
  const BQ = GQ - 1.45;
  for (let i = 0; i < N; i++) {
    const c = G0 + (i + 0.5) * gw, w = Math.min(1.45, gw - 0.28);
    L.prop('bench', c, 0, BQ, L.yaw(0, 1), { w: +w.toFixed(2), back: (i * 7 + lot.seed) % 3 !== 0, wood: WOOD[(i + r.i(0, 5)) % WOOD.length], metal: i % 4 === 0 ? keepers[i].paint : '#2f3a36' }, { noSpots: true });
    for (const u of [-w / 4, w / 4]) L.spot('sit', c + u, 0.46, BQ, L.yaw(0, 1), { tags: ['lamprow', 'quiet', 'elders'] });
    if (i % 3 === 1) L.prop('cup', c + w / 2 - 0.1, 0.46, BQ + 0.05, 0, { glaze: '#e9e2d0', lid: keepers[i].paint }, { noCollide: true });
  }
  await tick();
  // a handrail along the front of the strip (half a g, and the old of the block)
  g.mat('wood', '#b98a5a', { rough: -0.1 }); L.tube([[G0, 0.98, GQ - 0.1], [W - G0, 0.98, GQ - 0.1]], 0.022, { segs: 7 });
  g.mat('cast', '#2f3a36'); for (let i = 0; i <= N; i += 2) { const p = G0 + i * gw; L.tube([[p, KH - 0.1, GQ - 0.01], [p, 0.9, GQ - 0.1], [p, 0.98, GQ - 0.1]], 0.012, { segs: 5 }); }
  s.flush({ tier: 'd', cast: false });
  wallRailQ(L, 0.16, 1.2, D - 0.5, -1, { y: 0.9 }); wallRailQ(L, W - 0.16, 1.2, D - 0.5, 1, { y: 0.9 });

  // ---------------- the dim half: chairs turned to the strip, the potting table, the tap, tea ----------------
  const chairs = [];
  for (let k = 0; k < 18 && chairs.length < 11; k++) {
    const p = r.f(2.2, W - 2.2), q = r.f(D * 0.3, BQ - 1.6);
    if (Math.abs(p - dP) < 1.4 || chairs.some((c) => Math.hypot(c[0] - p, c[1] - q) < 1.3)) continue;
    const yaw = L.yaw(r.f(-0.3, 0.3), 1);
    L.prop('chair', p, 0, q, yaw, { wood: WOOD[r.i(0, 5)], back: r.chance(0.5) ? 'slat' : 'hoop', seat: ['#d9c08a', '#c9552e', '#2f6f73'][r.i(0, 2)] }, { noSpots: true });
    chairs.push([p, q]); L.spot('sit', p, 0.45, q, yaw, { tags: ['lamprow', 'elders', 'watch'] });
  }
  // rugs under the chairs, small tables with a cup each
  for (let k = 0; k < 2; k++) { const c = chairs[k * 3] || [W * (0.3 + k * 0.4), D * 0.5]; L.prop('rug', c[0], 0, c[1] + 0.4, L.yaw(0, 1), { w: 2.6, d: 1.7, a: PAINT[r.i(0, PAINT.length - 1)], b: '#e9dcc0' }, { noCollide: true }); }
  for (let k = 0; k < 3; k++) { const c = chairs[k * 3 + 1]; if (!c) continue; L.prop('table', c[0] + 0.6, 0, c[1], 0, { w: 0.5, d: 0.5, h: 0.55, wood: WOOD[r.i(0, 5)] }); L.prop('cup', c[0] + 0.6, 0.55, c[1], 0, { glaze: '#e9e2d0', lid: PAINT[r.i(0, 9)] }, { noCollide: true }); }
  for (const pp of [[0.8, 1.2], [W - 0.8, 1.2], [0.8, BQ - 1.2], [W - 0.8, BQ - 1.2]]) L.prop('plant', pp[0], 0, pp[1], r.f(0, 6), { kind: r.chance(0.5) ? 'broad' : 'fern', size: r.f(1.1, 1.5), pot: PAINT[r.i(0, 9)] });
  await tick();
  // the potting table on one side wall: trays of seedlings, pots, labels, a crock of cuttings
  const pt = dP > W / 2 ? 0.55 : W - 0.55, pd = pt < W / 2 ? 1 : -1, ptq = D * 0.42;
  L.prop('counter', pt + pd * 0.15, 0, ptq, L.yaw(pd, 0), { w: 2.6, d: 0.6, h: 0.86, body: '#5b4030', top: '#a8794f' });
  for (let k = 0; k < 4; k++) { const q = ptq - 1.0 + k * 0.65; L.prop('plant', pt + pd * 0.2, 0.86, q, r.f(0, 6), { kind: ['fine', 'fern', 'broad', 'flower'][k], size: 0.32, pot: '#a3563a' }, { noCollide: true }); }
  L.prop('crock', pt + pd * 0.32, 0.86, ptq + 0.2, 0, { glaze: '#3a2a20', h: 0.26, r: 0.11 }, { noCollide: true });
  L.prop('lots-quiet.tools', pt + pd * 0.15, 0.86, ptq + 0.75, r.f(0, 6), {}, { noCollide: true });
  L.prop('lots-quiet.can', pt + pd * 0.5, 0, ptq + 1.6, L.yaw(pd, 0), { c: '#5f7a6a' });
  L.prop('lots-quiet.can', pt + pd * 0.45, 0, ptq + 1.95, L.yaw(pd, 0.3), { c: '#a8412b' });
  L.spot('work', pt + pd * 0.85, 0, ptq, L.yaw(-pd, 0), { tags: ['lamprow', 'notes', 'garden'] });
  // tea on the loop at the other side: a small cupboard with an urn and cups
  const tp = W - pt, td = -pd, tq = D * 0.5;
  L.prop('counter', tp + td * 0.15, 0, tq, L.yaw(td, 0), { w: 1.4, d: 0.55, h: 0.9, body: '#3f4f2a', top: '#b98a5a' });
  g.mat('cast', '#b08a45', { rough: -0.2 }); L.lathe(tp + td * 0.2, tq - 0.3, [[0, 0.9], [0.13, 0.9], [0.14, 1.2], [0.12, 1.32], [0.05, 1.36], [0, 1.37]], { segs: 14 });
  g.mat('cast', '#2a2622'); L.tube([[tp + td * 0.2 + td * 0.13, 0.98, tq - 0.3], [tp + td * 0.2 + td * 0.2, 0.97, tq - 0.3]], 0.012, { segs: 5 });
  s.flush({ tier: 'd' });
  for (let k = 0; k < 5; k++) L.prop('cup', tp + td * 0.25, 0.9, tq + 0.05 + k * 0.1, 0, { glaze: ['#e9e2d0', '#d9c7a6', '#3d6f8a'][k % 3], lid: PAINT[k] }, { noCollide: true });
  // the walk and the strip's light falling on it; the dim half has one low lamp by the door
  L.lamp('globe', dP + (dP > W / 2 ? -2.2 : 2.2), H, 2.6, { drop: 0.7, K: 2600, power: 0.55, clip, range: 6 });
  L.glow(0, 0, 0.4, W, H, D, { sky: '#ffe7c4', ground: '#7a5a3a', power: 0.12 });
  await tick();

  // ---------------- people and paths ----------------
  L.path([[dP, 1.2], [dP, BQ - 0.9], [G0 + 0.5, BQ + 0.75]], { width: 1.2, tags: ['lamprow'] });
  L.path([[dP, BQ - 0.9], [W - G0 - 0.5, BQ + 0.75]], { width: 1.2 });
  L.path([[G0 + 0.5, BQ + 0.75], [W - G0 - 0.5, BQ + 0.75]], { width: 1.0 });
  for (const i of [r.i(0, 4), r.i(5, 9), r.i(10, 13)]) L.spot('work', G0 + (i + 0.5) * gw, 0, GQ - 0.45, L.yaw(0, 1), { tags: ['lamprow', 'garden', i % 2 ? 'notes' : 'sweep'] });
  L.spot('stand', dP, 0, BQ - 2.2, L.yaw(0, 1), { tags: ['lamprow', 'watch'] });
  L.spot('work', W * 0.5, 0, D * 0.3, L.yaw(1, 0), { tags: ['lamprow', 'sweep'] });

  // ---------------- things to do ----------------
  const seed = lot.seed;
  keepers.forEach((k, i) => {
    const c = G0 + (i + 0.5) * gw;
    L.act(c, 0.8, GQ - 0.35, Math.min(0.85, gw * 0.55), 'Read the name stake', (gm) => say(gm, k.kind === 'vacant' ? 'An empty garden' : k.name + ', ' + k.age, [pick(seed, 40 + i, KIND_LINES[k.kind]) + ' ' + pick(seed, 60 + i, TAGS)]), { priority: 0.2 });
  });
  { const i = Math.floor(N / 2), c = G0 + (i + 0.5) * gw; L.act(c, 0.7, BQ, 0.9, 'Sit on the bench a while', (gm) => sitAWhile(L, gm, c, BQ, 0, 1, 15, pick(seed, 31, [
    'A quarter of an hour facing ' + keepers[i].name.split(' ')[0] + '\'s garden. The lamp over it has a slight hum, and then you stop hearing it.',
    'Fifteen minutes. Two keepers swapped a cutting over your head, with a nod each, and went back to their own.',
    'You sit and look. Fourteen lamps, fourteen colours of light, none of them quite the same white.',
    'Fifteen minutes. Somebody sat on the bench next to yours, said "Mine", pointed, and then said nothing else.',
  ]))); }
  await tick();
  noticeBoard(L, pt - pd * 0.38, 1.7, ptq - 2.0, pd, 0, lot.seed);
  await tick();
  L.act(pt + pd * 0.6, 1.5, ptq - 2.0, 1.2, 'Read the notice', (gm) => say(gm, 'Lamp Row', [pick(seed, 32, [
    'Fourteen gardens of about four square metres. A garden that size lit like an overcast day costs nearly two kays a day, paid by its keeper. Pooled in one strip, the walk in front is lit by what spills, free.',
    'When a keeper dies, the garden goes to whoever they named, or to the next on the list at the block office. The list is long.',
    'Keepers water each other\'s gardens when they are away. Write your name on the slate if you have watered one.',
    'The lamps come up at half past six with the homes and go down at eleven. Nothing in here is on a timer of its own.',
  ])]));
  L.act(pt + pd * 0.9, 1.0, ptq + 0.2, 1.2, 'Look at the cuttings', (gm) => note(gm, pick(seed, 33, [
    'A crock of cuttings in water: geranium, mint, a lemon leaf with a root started. A card: take one, leave one.',
    'Seed trays labelled in six hands. One is labelled only "do not".',
    'Cuttings wrapped in damp paper with names on them, waiting to be called for.',
    'Somebody has left a single tomato on the table, under a cup, with a card: "for whoever needs it most". Nobody has taken it.',
  ])));

  L.zone({ place: 'city-special', name: 'Lamp Row', sub: info.name + ' · fourteen gardens · one strip of light', ambience: 'quiet', reverb: 'room', cell: info.key, top: H,
    env: { autoKey: 0.15, autoMax: 1.7, warmth: 0.3, bloom: 0.09, contrast: 1.12 } });
  void note;
  return L;
}

// What grows in one garden, drawn in place (cheap cards; fruit as small balls).
function plantGarden(L, r, kind, c, q, gw, y) {
  const g = L.g, hw = gw / 2 - 0.12, hd = 1.05;
  const rnd = (a) => [c + r.f(-hw, hw) * a, q + r.f(-hd, hd) * a];
  const card = (layer, tint, p, qq, w, h) => { g.mat(layer, tint, { sway: 0.4 }); const a = r.f(0, 3.14); L.card(p, y, qq, w, h, a, { tilt: r.f(-0.2, 0.2) }); L.card(p, y, qq, w, h, a + 1.57, { tilt: r.f(-0.2, 0.2) }); };
  const fruit = (col, p, yy, qq, rad) => { g.mat('glaze', col, { rough: -0.3 }); L.ball(p, yy, qq, rad, rad * 0.95, { segs: 7, rings: 5 }); };
  if (kind === 'tomato') {
    for (let k = 0; k < 3; k++) {
      const p = c - hw * 0.6 + k * hw * 0.6, qq = q + r.f(-0.5, 0.5);
      g.mat('wood', '#b98a5a'); L.tube([[p, y, qq], [p, y + 1.5, qq]], 0.01, { segs: 4 });
      for (let j = 0; j < 6; j++) { g.mat('leafA', '#e8ffd8', { sway: 0.3 }); L.card(p + r.f(-0.12, 0.12), y + 0.1 + j * 0.24, qq, 0.44, 0.46, r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); }
      for (let j = 0; j < 3; j++) fruit(j === 0 ? '#e0a030' : '#c8352a', p + r.f(-0.12, 0.12), y + r.f(0.4, 1.1), qq + r.f(-0.1, 0.1), 0.035);
    }
  } else if (kind === 'herbs' || kind === 'greens' || kind === 'chervil') {
    const rows = 5, per = Math.max(3, Math.floor(gw / 0.3));
    for (let a = 0; a < rows; a++) for (let b = 0; b < per; b++) {
      const p = c - hw + (b + 0.5) * (2 * hw) / per + r.f(-0.05, 0.05), qq = q - hd * 0.8 + a * hd * 0.4;
      if (kind === 'greens') card('leafA', mixHex('#ffffff', '#c8e8a0', r.next()), p, qq, 0.34, 0.26);
      else if (kind === 'chervil') card('leafB', '#eaffd8', p, qq, 0.4, 0.4);
      else card(r.chance(0.5) ? 'leafB' : 'leafA', mixHex('#ffffff', '#cfe8a0', r.next()), p, qq, 0.32, 0.4);
    }
  } else if (kind === 'flowers') {
    for (let k = 0; k < 18; k++) { const v = rnd(0.95); card(k % 3 ? 'blossom' : 'leafA', '#ffffff', v[0], v[1], r.f(0.35, 0.5), r.f(0.4, 0.75)); }
  } else if (kind === 'lemon') {
    L.prop('court.pot', c, y, q, r.f(0, 6), { size: 0.5, kind: 'fine', pot: '#a3563a' }, { noCollide: true });
    L.prop('lots-quiet.tree', c, y + 0.15, q, r.f(0, 6), { h: 1.5, w: 0.55, v: 7, kind: 'fruit', fruit: '#e8c53a', nf: 4, r: 0.035 }, { noCollide: true });
  } else if (kind === 'strawberry') {
    for (let k = 0; k < 16; k++) { const v = rnd(0.9); card('leafA', '#e8ffd8', v[0], v[1], 0.34, 0.22); if (k % 2 === 0) fruit('#d8302a', v[0] + 0.08, y + 0.04, v[1], 0.026); }
  } else if (kind === 'chilli') {
    L.prop('lots-quiet.shrub', c, y, q, r.f(0, 6), { s: 0.7, v: 2, kind: 'leafB' }, { noCollide: true });
    for (let k = 0; k < 7; k++) fruit('#d02a20', c + r.f(-0.25, 0.25), y + r.f(0.25, 0.6), q + r.f(-0.25, 0.25), 0.022);
  } else if (kind === 'bonsai') {
    g.mat('stone', '#8a8676'); L.box(c - 0.35, y, q - 0.25, c + 0.35, y + 0.08, q + 0.25, { bevel: 0.02 });
    g.mat('grass', '#6f8f48'); L.box(c - 0.3, y + 0.08, q - 0.2, c + 0.3, y + 0.095, q + 0.2, { faces: 'Y' });
    L.prop('lots-quiet.tree', c, y + 0.09, q, r.f(0, 6), { h: 0.75, w: 0.4, v: 3, kind: 'fine', r: 0.03 }, { noCollide: true });
    for (let k = 0; k < 3; k++) { g.mat('stone', '#9a937f'); L.ball(c + r.f(-0.25, 0.25), y + 0.1, q + r.f(-0.15, 0.15), 0.05, 0.035, { segs: 6, rings: 4 }); }
  } else if (kind === 'vacant') {
    g.mat('wood', '#8a6240'); L.box(c - 0.3, y, q + 0.3, c + 0.2, y + 0.03, q + 0.36);
  }
  if (kind !== 'vacant' && kind !== 'bonsai') for (let k = 0; k < 6; k++) { const v = [c + r.f(-hw, hw), q + (k % 2 ? 1 : -1) * r.f(hd * 0.7, hd)]; g.mat('leafB', mixHex('#ffffff', '#b9d48a', r.next() * 0.4), { sway: 0.2 }); L.card(v[0], y, v[1], 0.3, 0.16, r.f(0, 6.28), { tilt: 0.5 }); }
  L.s.flush({ tier: 'd', cast: true });
}
