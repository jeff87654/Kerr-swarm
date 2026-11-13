// Sorrel, Herb Row: Ashgrove, a neighbourhood of about 3,000 on decks 73 to 78, where everything weighs nine-tenths.
// The flight goes along the Long Arcade on deck 75, lamp-lit and no higher than a room, past Dace's and the
// greengrocer's case of tomatoes, and out into the Court: an atrium cut up through all six decks, its floor lit like an
// overcast day, its terraces at a grey quarter of that. On the Court's brightest wall are three espaliered pear trees
// older than anyone living; this is a few weeks after their winter, and the school's youngest class is dabbing the
// blossom with brushes. Then up through the terraces to Pear Street on deck 77, and along it to the lift core at its
// end, where a cab's doors open (docs/ashgrove.md, Ashgrove, The pears, Day one; docs/sorrel.md, Low decks).
//
// Not canon (the docs give the places and the Court's size; how they lie is this page's own):
//   - the Court's long side lies spinward; its terraces step back two metres a deck; under the pears the wall is sheer
//     for two decks, with no terrace on deck 74 on that side
//   - two bridges hung from the Court's ceiling carry the Long Arcade (deck 75) and Pear Street (deck 77) across it, and
//     the trolley runs on over the first
//   - which side of the Arcade each named place stands on, and in what order; the Mill Hall and the greengrocer's
//     having a second front on the Court's terrace; the Thiamine's place on Pear Street, and that street running
//     toward the front from the Court to its lift core
//   - the shops the docs do not name (Books, Pots and lids, Flutes, Bread, Tea, Lamps and the trades the kit fills
//     in), the wording of the slates, cards and notices (the dishes, prices and customs are the docs'), door numbers,
//     and the slate that keeps the score of the votes on the Court's light
//   - a direction rose in the Court's floor and in the lift lobby (sorrel.md has one in the Sixty-Two Lobby), and
//     "Cabs" over the lift doors
//   - the ladders at the pears, the stalls and benches on the Court's floor, a cleaning robot crossing it
import { Scene } from 'three';
import { makePath } from '../core/path.js';
import { makeFrame, deckRadius, DEG } from '../kit/drum.js';
import { makeDeck, finish, street, atrium, bridge, hall, lobby, rose, trolley, Run, PALETTES, DOOR_IN } from '../kit/deck.js';
import { makeRng, smoothstep } from '../core/rng.js';
import { shade, mixc } from '../kit/geo.js';

// the Court's floor on deck 73, in the frame of deck 75 (x spinward, z along the axis, y above deck 75's floor)
const CX0 = -45, CX1 = 45, CZ0 = -30, CZ1 = 30, FLOOR = -8;
const ADDRESS75 = 'Seventy-five, Three, Bee', ADDRESS77 = 'Seventy-seven, Three, Bee';

// The greengrocer's window: the nearest thing Ashgrove has to a jeweller's. Tomatoes in a glass case, each on its own
// stand under a small lamp; a few orchard apples behind for people buying a gift.
function tomatoWindow(deck, P, b, run, H) {
  const g = P.g, pal = deck.pal, u0 = b.u0 + 0.24, u1 = b.u1 - 0.24, mid = (u0 + u1) / 2, trim = '#4a3a2a', k = deck.glowK;
  g.box(u0, 0, 0, u1, 0.78, 0.22, '#7e6a52', { skip: 'b' }).box(u0 - 0.02, 0.78, -0.07, u1 + 0.02, 0.84, 0.3, trim);
  g.box(u0, 2.26, -0.02, u1, 2.32, 0.26, trim, { skip: 't' }).box(u0, 2.32, -0.05, u1, 2.8, 0.26, '#2f3b34', { skip: 'tb' }).box(u0, 2.8, -0.11, u1, 2.87, 0.26, trim).box(u0, 2.87, 0, u1, H, 0.26, b.wall, { skip: 'tb' });
  P.gl.quad([u1, 0.84, 0.06], [u0, 0.84, 0.06], [u0, 2.26, 0.06], [u1, 2.26, 0.06], pal.glass);
  // the room behind
  const dep = 3.2, wall = '#e9dcc0', em = 0.55 * k;
  g.floor(b.u0 + 0.12, 0.2, b.u1 - 0.12, dep, 0.015, '#8f7c66');
  g.quad([b.u1 - 0.12, 0, dep], [b.u0 + 0.12, 0, dep], [b.u0 + 0.12, H - 0.22, dep], [b.u1 - 0.12, H - 0.22, dep], wall, em);
  g.quad([b.u1 - 0.12, 0, 0.26], [b.u1 - 0.12, 0, dep], [b.u1 - 0.12, H - 0.22, dep], [b.u1 - 0.12, H - 0.22, 0.26], wall, em * 0.7);
  g.floor(b.u0 + 0.12, 0.26, b.u1 - 0.12, dep, H - 0.22, shade(wall, 0.85), { down: true, emit: em * 0.5 });
  // crates of herbs and salad on a stepped stand at the back
  for (let j = 0; j < 3; j++) {
    g.box(u0 + 0.2, 0, dep - 0.5 - j * 0.45, u1 - 0.2, 0.5 + (2 - j) * 0.32, dep - 0.05 - j * 0.45, '#8a7358', { skip: 'b' });
    for (let x = u0 + 0.55; x < u1 - 0.4; x += 0.62) deck.put('crate', { p: run.pt(x, 0.5 + (2 - j) * 0.32, dep - 0.28 - j * 0.45), yaw: run.yaw, color: ['#7fa860', '#9ab868', '#5f8f50', '#b9c46a', '#86a85a', '#6f9a58'][Math.floor((x * 7 + j * 3) % 6 + 6) % 6] });
  }
  deck.sign('Herbs and salad', { run, at: run.pt(mid, 2.56, -0.056), maxW: u1 - u0 - 0.1, h: 0.4, style: 'board', font: 'italic', ground: '#2f3b34', ink: '#ead9b0' });
  // the case: brass and glass on a draped stand
  const c0 = mid - 1.7, c1 = mid + 1.7, cy = 1.0, cz0 = 0.18, cz1 = 0.8, brass = pal.brass;
  g.box(c0 - 0.06, 0.84, cz0 - 0.04, c1 + 0.06, cy, cz1 + 0.04, '#e9e0cb', { skip: 'b' });
  for (const [x, z] of [[c0, cz0], [c1, cz0], [c0, cz1], [c1, cz1]]) g.box(x - 0.014, cy, z - 0.014, x + 0.014, cy + 0.42, z + 0.014, brass, { skip: 'b' });
  g.box(c0 - 0.014, cy + 0.42, cz0 - 0.014, c1 + 0.014, cy + 0.445, cz0 + 0.014, brass).box(c0 - 0.014, cy + 0.42, cz1 - 0.014, c1 + 0.014, cy + 0.445, cz1 + 0.014, brass);
  g.box(c0 - 0.014, cy + 0.42, cz0, c0 + 0.014, cy + 0.445, cz1, brass).box(c1 - 0.014, cy + 0.42, cz0, c1 + 0.014, cy + 0.445, cz1, brass);
  P.gl.quad([c1, cy, cz0], [c0, cy, cz0], [c0, cy + 0.42, cz0], [c1, cy + 0.42, cz0], '#d9eef0');
  P.gl.quad([c0, cy + 0.43, cz0], [c1, cy + 0.43, cz0], [c1, cy + 0.43, cz1], [c0, cy + 0.43, cz1], '#d9eef0');
  let n = 0;
  for (let x = c0 + 0.2; x < c1 - 0.12; x += 0.26) for (const z of [cz0 + 0.2, cz0 + 0.45]) {
    const yy = cy + (z > cz0 + 0.3 ? 0.13 : 0.04), xx = x + (z > cz0 + 0.3 ? 0.13 : 0);
    if (xx > c1 - 0.12) continue;
    g.cyl(xx, cy, z, 0.04, 0.028, yy - cy, 6, '#f1ead8', { smooth: false });
    g.blob(xx, yy + 0.055, z, [0.068, 0.058, 0.068], 1, n % 7 === 3 ? '#e07a22' : '#d62f18', { emit: 0.7, shadeBottom: 0.72, seed: n });
    g.cyl(xx, yy + 0.106, z, 0.018, 0.005, 0.016, 5, '#4f7a3a', { smooth: false });
    n++;
  }
  for (let x = c0 + 0.3; x < c1; x += 0.62) { g.cube(x, 2.2, 0.45, 0.07, 0.05, 0.07, '#fff3d6', { emit: 5 * k }); deck.glow([{ p: run.pt(x, 2.17, 0.45), color: '#fff0d0', power: 1.5 * k, size: 0.4 }]); }
  deck.sign(['Tomatoes', 'half a kWh each'], { run, at: run.pt(mid, 0.915, cz0 - 0.045), w: 0.92, h: 0.15, style: 'card', font: 'serif', font2: 'cond', head: true });
  // orchard apples on a shelf of their own, up at the back
  g.box(mid - 0.6, 1.7, dep - 0.34, mid + 0.6, 1.74, dep - 0.02, trim);
  for (let i = 0; i < 5; i++) g.blob(mid - 0.4 + i * 0.2, 1.79, dep - 0.18, [0.05, 0.048, 0.05], 1, i % 2 ? '#c9463a' : '#c7743a', { emit: 0.45, shadeBottom: 0.7, seed: i });
  deck.sign(['Orchard apples', '4.4 kWh'], { run, at: run.pt(mid, 1.58, dep - 0.03), w: 0.72, h: 0.19, style: 'card', font: 'serif', font2: 'cond', head: true });
  deck.sign(['Herbs 0.03', 'Side salad 0.59'], { run, at: run.pt(u1 - 0.75, 1.5, dep - 0.03), w: 1.0, h: 0.55, style: 'chalk' });
  deck.people([{ p: run.pt(u0 + 0.55, 0, 1.25), yaw: run.yaw + Math.PI - 0.5 }]);
}

// Dace's window: offcuts sorted by colour along the back wall, a chair in for new springs, a coat with this season's
// hard algae blue in its lining.
function dacesWindow(deck, row) {
  const b = row.find('daces');
  if (!b) return;
  const run = row.run, P = deck.pen(run, (b.u0 + b.u1) / 2, 'av'), g = P.g, a = b.u0 + 1.5, z = b.u1 - 0.4, dep = 3.2;
  const lin = (v) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  const wheel = (h, s, l) => { const f = (n) => { const q = (n + h * 12) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(q - 3, 9 - q, 1)); }; return [lin(f(0)), lin(f(8)), lin(f(4))]; };
  for (let k = 0; k < 4; k++) for (let x = a, i = 0; x < z - 0.2; x += 0.19, i++) g.box(x, 0.5 + k * 0.52, dep - 0.34, x + 0.17, 0.5 + k * 0.52 + 0.3 + 0.1 * ((i * 5 + k) % 3) / 2, dep - 0.04, wheel((x - a) / (z - a) * 0.86 + 0.02, 0.5 - 0.07 * k, 0.33 + 0.09 * k), { skip: 'bs', emit: 0.3 });
  // a coat on a stand, its lining showing
  const cu = z - 0.9;
  g.cyl(cu, 0.62, 0.72, 0.03, 0.03, 0.8, 5, '#5f4630').cyl(cu, 0.62, 0.72, 0.2, 0.02, 0.05, 6, '#5f4630', { smooth: false });
  g.cyl(cu, 1.0, 0.72, 0.26, 0.2, 0.62, 8, '#4a4038', { smooth: false, squash: [1, 0.6] });
  g.quad([cu + 0.07, 1.02, 0.56], [cu - 0.07, 1.02, 0.56], [cu - 0.1, 1.6, 0.6], [cu + 0.1, 1.6, 0.6], '#1f6f9c', 0.35);
  // the sewing machine on its table
  g.box(a + 0.1, 0.62, 0.38, a + 1.2, 0.66, 0.92, '#8a7358').box(a + 0.3, 0.66, 0.55, a + 0.9, 0.72, 0.75, '#2f2f30').box(a + 0.3, 0.72, 0.6, a + 0.42, 0.98, 0.7, '#2f2f30').box(a + 0.3, 0.9, 0.6, a + 0.88, 0.99, 0.7, '#2f2f30').box(a + 0.8, 0.76, 0.62, a + 0.86, 0.9, 0.68, '#b9b6aa');
  for (const x of [a + 0.16, a + 1.14]) g.box(x - 0.02, 0, 0.42, x + 0.02, 0.62, 0.46, '#5f4630', { skip: 'tb' }).box(x - 0.02, 0, 0.84, x + 0.02, 0.62, 0.88, '#5f4630', { skip: 'tb' });
  P.done();
  deck.put('armchair', { p: run.pt((a + z) / 2 + 0.2, 0.62, 0.62), yaw: run.yaw + 0.5, color: '#7c8052', scale: 0.9 });
  deck.people([{ p: run.pt(a - 0.2, 0, 1.9), yaw: run.yaw + Math.PI + 0.4 }]);
}

// Three espaliered pears on the Court's brightest wall, in blossom: a trunk, eight tiers of old arms tied to wires.
function pearWall(deck, run, rng) {
  deck.proto('blossom', (g) => { g.tint(1).blob(0, 0, 0, [0.15, 0.12, 0.09], 0, '#ffffff', { lump: 0.3, seed: 2, shadeBottom: 0.86 }).tint(0); }, { leafy: true });
  const P = deck.pen(run, 0, 'pears'), g = P.g, bark = '#5a4939', stone = '#b9ad96';
  for (const c of [-19.2, 0, 19.2]) {
    g.box(c - 7.4, 0, -0.8, c + 7.4, 0.42, -0.02, stone, { top: '#57493c', skip: 'b' });
    for (let i = 0; i < 4; i++) g.box(c - 0.13 + i * 0.022, i * 1.7, -0.22, c + 0.13 - i * 0.022, i * 1.7 + 1.72, -0.03, shade(bark, 1 - i * 0.03), { skip: 'b' });
    for (let k = 0; k < 8; k++) {
      const y = 0.95 + k * 0.78, half = 7.0 - k * 0.22, t = 0.075 - k * 0.004;
      g.box(c - 7.3, y - 0.008, -0.035, c + 7.3, y + 0.008, -0.018, '#8f8e88');
      for (const sd of [-1, 1]) {
        let u = 0.1, yy = y;
        while (u < half) { const u1 = Math.min(half, u + 1.1 + rng() * 0.9), y1 = y + rng.f(-0.045, 0.045); g.quad([c + sd * u, yy - t, -0.13], [c + sd * u1, y1 - t, -0.13], [c + sd * u1, y1 + t, -0.13], [c + sd * u, yy + t, -0.13], bark); g.quad([c + sd * u1, y1 - t, -0.13], [c + sd * u, yy - t, -0.13], [c + sd * u, yy + t, -0.13], [c + sd * u1, y1 + t, -0.13], bark); g.box(Math.min(c + sd * u, c + sd * u1), Math.min(yy, y1) + t - 0.02, -0.13, Math.max(c + sd * u, c + sd * u1), Math.max(yy, y1) + t, -0.04, shade(bark, 1.12), { skip: 'bn' }); u = u1; yy = y1; }
        for (let x = 0.36; x < half + 0.1; x += 0.2 + 0.1 * rng()) {
          const leafy = rng() < 0.22;
          deck.put('blossom', { p: run.pt(c + sd * x, y + 0.1 + rng.f(-0.04, 0.13), -0.19 - 0.05 * rng()), yaw: rng() * 6.28, scale: [rng.f(0.7, 1.3), rng.f(0.7, 1.4), 1], color: leafy ? mixc('#8fae6a', '#a9c080', rng()) : mixc('#f7efe9', '#f0d3d2', rng() * rng()) });
        }
      }
    }
  }
  for (let u = -29; u < 30; u += 7.3) g.box(u - 0.03, 0, -0.03, u + 0.03, 7.3, -0.012, '#8f8e88', { skip: 'b' });
  P.done();
  // the youngest class, a few on ladders, and two grown-ups
  const spots = [];
  for (const [u, ladder] of [[-5.6, 1], [-3.9, 0], [-2.7, 1], [-1.5, 0], [1.4, 0], [2.6, 1], [3.8, 0], [5.2, 1], [6.4, 0], [-6.9, 0]]) {
    if (ladder) { deck.put('ladder', { p: run.pt(u, 0, -1.02), yaw: run.yaw, scale: 0.8 }); spots.push({ p: run.pt(u, 0.82, -1.2), yaw: run.yaw, child: true }); }
    else spots.push({ p: run.pt(u, 0, -1.05 - 0.3 * rng()), yaw: run.yaw + rng.f(-0.3, 0.3), child: true });
  }
  spots.push({ p: run.pt(0.2, 0, -2.1), yaw: run.yaw + 0.2 }, { p: run.pt(-8.4, 0, -1.7), yaw: run.yaw - 0.5 });
  for (const [u, v] of [[-3.2, -3.0], [-2.6, -3.3], [4.4, -2.9]]) spots.push({ p: run.pt(u, 0, v), yaw: run.yaw + rng.f(-0.6, 0.6), child: true });
  deck.people(spots);
  deck.put('cart', { p: run.pt(8.4, 0, -1.9), yaw: run.yaw + 1.2, color: '#51627a' });
}

export const sorrelAshgrove = {
  id: 'sorrel-ashgrove',
  title: 'The Court at Ashgrove', drum: 'Sorrel', row: 'Herb Row', kind: 'a steady drum', light: 0.0,
  line: 'The arcade is no higher than a room. Then the ceiling goes up six decks, and on the bright wall are three pear trees older than anyone, with the youngest class dabbing the blossom with brushes.',
  tone: '#f2e6cc', source: 'ashgrove.md (Ashgrove; The pears)',
  sound: { root: 53, scale: 'major', pad: 0.45, air: 0.3, hum: 0.25, crowd: 0.55, bells: 0.12, bright: 0.5 },
  *build(ctx) {
    const frame = makeFrame(105 * DEG, 1042, deckRadius(75));       // the Hour of the Bee, Ring Three, deck 75
    const rng = makeRng('ashgrove');
    // along the Long Arcade; out over the Court; down to the pears and along their wall; up through the terraces to
    // Pear Street's bridge; and along Pear Street to the cab doors at its end
    const path = makePath([
      { t: 0, p: [-120, 1.6, 1.9] },
      { t: 5.5, p: [-104, 1.6, 2.0], look: [-60, 1.5, 3.0] },
      { t: 9.5, p: [-86, 1.6, 2.0], look: [-62, 1.35, 3.8] },
      { t: 13, p: [-72, 1.6, 1.7], look: [-61, 1.25, 4.3] },
      { t: 16, p: [-62.5, 1.58, 1.3], look: [-56, 1.5, 3.4] },
      { t: 18.5, p: [-53, 1.75, 1.0], look: [10, 0.5, 2] },
      { t: 23, p: [-30, 3.0, 1.4], look: [45, 2, 10] },
      { t: 27.5, p: [-4, 1.2, 10], look: [45, -4.5, 16] },
      { t: 33, p: [25, -5.3, 17], look: [45.5, -4.8, 6] },
      { t: 37.5, p: [36.5, -6.2, 3], look: [45, -5.2, -12] },
      { t: 41.5, p: [33, -4.6, -14], look: [10, 0, -44] },
      { t: 45.5, p: [18, 8.6, -22], look: [-30, 7, 2] },
      { t: 49, p: [1.0, 10.7, -33], look: [0.5, 9.6, -60] },
      { t: 52, p: [1.0, 9.65, -47] },
      { t: 56, p: [1.0, 9.6, -70] },
      { t: 59, p: [1.3, 9.35, -88] },
      { t: 62, p: [1.3, 9.1, -99] },
    ], { frame, entryRadius: 1.1, exitRadius: 1.1 });
    const ex = path.exit.flat, ZW = ex.z + DOOR_IN, ZL = ZW + 5.6;       // the wall of cab doors, and where the lobby begins
    const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'ashgrove', palette: PALETTES.warm, light: { level: 0.85 }, floor: { shine: 1 }, clock: 'flight' });
    yield 'ashgrove: path';

    // ---- the Long Arcade, deck 75: the stretch the flight goes along, and the stretch beyond the Court
    const menu = ['Mill table', 'Morning: jook', 'Noon: glass noodles', 'and starch jellies', 'Night: stew', 'with a swallow'];
    const school = { kind: 'shop', goods: 'drawings', awning: false, blade: false, ground: '#51627a', ink: '#efe6cf', door: '#b98a3a', wall: '#d8c6a6', lit: 1, open: false, props: false };
    const west = yield* street(deck, {
      axis: 'x', from: -236, to: -55, at: 0, y: 0, width: 8, rails: true, cloth: 0.5,
      lamps: { every: 6, grid: -237, lattice: { from: -236, to: 236 }, power: 0.9, kind: 'globe' },
      plates: [{ at: -111, lines: ['The Long Arcade', ADDRESS75] }],
      folk: { stand: 7, stroll: 5, walk: 0, kids: 0 },
      fronts: {
        back: [
          { from: -132, to: -126, kind: 'home' },
          { from: -126, to: -120, kind: 'shop', name: 'Books', goods: 'books', awning: false, blade: true, lit: 1 },
          { from: -120, to: -114, kind: 'shop', name: 'Pots and lids', goods: 'pots', awning: true, lit: 1, props: false },
          { from: -114, to: -108, kind: 'shop', name: 'Flutes', goods: 'flutes', awning: false, blade: true, lit: 1 },
          { from: -108, to: -100, kind: 'shop', id: 'clinic', name: 'Clinic', frosted: true, goods: 'none', awning: false, blade: 'Clinic', font: 'cond', ground: '#e7e3d6', ink: '#2f5a5a', door: '#3f6f73', lit: 1, open: false, doorSide: 1 },
          { from: -100, to: -91, kind: 'shop', id: 'daces', name: "Dace's", sub: ['Coats relined', 'Chairs re-sprung', 'Shoes resoled'], goods: 'none', awning: false, blade: true, font: 'serif', ground: '#2f3b34', ink: '#ead9b0', door: '#5d7a62', open: true, lit: 1, doorSide: 0, props: false },
          { from: -91, to: -87, kind: 'stair', sub: 'Up 76, down 74' },
          { from: -87, to: -81, kind: 'shop', name: 'Bread', goods: 'bread', awning: true, lit: 1 },
          { from: -81, to: -77.5, kind: 'wall', bench: false, notice: ['Knotnight', "The Court's lamps go down.", 'We make the larder together.'] },
          { from: -77.5, to: -71.5, kind: 'stall', name: 'Tea', goods: 'tea', lit: 1 },
          { from: -71.5, to: -66, kind: 'shop', id: 'greens', name: 'Greengrocer', goods: 'greens', awning: ['#6f8a5a', '#e6dcc4'], ground: '#2f3b34', ink: '#ead9b0', font: 'serif', door: '#5d7a62', open: true, lit: 1, doorSide: 0, props: false },
          { from: -66, to: -59.5, kind: 'custom', id: 'tomatoes', draw: (P, b, run, H) => tomatoWindow(deck, P, b, run, H) },
          { from: -59.5, to: -55, kind: 'wall', bench: false, notice: ["The Court's light", 'The Court,', 'six times running'], noticeStyle: 'chalk' },
        ],
        front: [
          { ...school, from: -128, to: -121 }, { ...school, from: -121, to: -113, name: 'Ashgrove School', font: 'cond' }, { ...school, from: -113, to: -106 },
          { from: -106, to: -96, kind: 'hall', id: 'baths', name: 'Ashgrove Baths', bays: 2, ground: '#3f6f73', ink: '#efe6cf', font: 'serif' },
          { from: -96, to: -90, kind: 'shop', name: 'Lamps', goods: 'lamps', awning: false, lit: 1 },
          { from: -90, to: -85, kind: 'home' },
          { from: -85, to: -55, kind: 'hall', id: 'mill', name: 'Mill Hall', bays: 5, ground: '#4a2f26', ink: '#f0dcb4', font: 'serif' },
        ],
      },
      fill: { mix: { shop: 2, home: 2, wall: 0.3, stall: 0.4 }, numbers: 12 },
    });
    dacesWindow(deck, west.sides.back);
    deck.put('noticeboard', { p: [-84.2, 0, -3.0], yaw: 2.618, color: '#5f4630' });
    deck.sign(menu, { at: [-84.215, 1.375, -2.974], n: [-0.5, 0.866], w: 1.2, h: 0.98, style: 'chalk' });
    yield 'ashgrove: arcade';
    yield* street(deck, { axis: 'x', from: 51, to: 236, at: 0, y: 0, width: 8, rails: true, lamps: { every: 6, grid: -237, lattice: false, kind: 'globe' }, folk: { stand: 3, stroll: 2, walk: 0 }, fill: { mix: { shop: 2, home: 2, wall: 0.3 }, numbers: 60 } });
    // the trolley keeps the flight's own clock: one car ahead in the Arcade to be overtaken by the stair, and one
    // going out over the bridge as the flight comes to the Court
    trolley(deck, { axis: 'x', from: -236, to: 236, at: 0, y: 0, speed: 1.5, cars: [-100, -52, -186, 62, 150], rng });
    deck.walkersAlong({ from: [-236, 0, -1.25], to: [236, 0, -1.25], n: Math.round(40 * ctx.density), spread: 0.25, rng });
    deck.walkersAlong({ from: [236, 0, -2.0], to: [-236, 0, -2.0], n: Math.round(32 * ctx.density), spread: 0.22, rng });
    // children race anti: that way they weigh a little less. One pack passes early in the Arcade, one on the bridge
    for (const x0 of [-95, 37]) deck.walkersAlong({ from: [236, 0, -1.7], to: [-236, 0, -1.7], n: 4, spread: 0.45, speed: 3.6, child: 1, start: 236 - x0, rng });
    for (let i = 0; i < 2; i++) deck.walkersAlong({ from: [236, 0, -1.7], to: [-236, 0, -1.7], n: 3, spread: 0.4, speed: 3.6, child: 1, phase: rng(), rng });

    // ---- the Mill Hall and the baths, off the Arcade's front side
    yield* hall(deck, { x0: -85, x1: -55.3, z0: -22, z1: -4.3, y: 0, open: { back: true, spin: [[-21.6, -4.7]] }, wall: '#d9cbb0', dado: '#8f7a66', tables: { axis: 'x', rows: 3, from: -82.5, to: -58.5, taken: 0.62 }, lamps: { spacing: [4.2, 5.9], kind: 'globe', power: 1.0 } });
    for (let i = 0; i < 4; i++) deck.put('pan', { p: [-83.4, 0.95, -19 + i * 3.6], yaw: 0, scale: 1.1, color: '#c9c8c2' });
    deck.put('counter', { p: [-83.4, 0, -13.6], yaw: Math.PI / 2, scale: [6.2, 1, 1.2], color: '#a58a66' });
    yield* hall(deck, { x0: -106, x1: -96, z0: -17.5, z1: -4.3, y: 0, open: { back: true }, wall: '#cfdcd6', dado: '#5f8f8a', floor: '#b9c9c2', pool: { x0: -104.6, x1: -97.4, z0: -16, z1: -7.6, color: '#4fa39f', bathers: 9 }, lamps: { spacing: [5, 6.6], kind: 'panel', color: '#ffc98a', power: 1.25 } });
    // steam comes out under the beam of the baths' doorway and up along the Arcade's ceiling
    for (let i = 0; i < 46; i++) deck.glow([{ p: [rng.f(-105.5, -96.5), rng.f(1.5, 2.3), rng.f(-7, -3.2)], color: '#fff0de', power: rng.f(0.12, 0.26), size: rng.f(1.1, 2.4), move: [rng.f(-0.04, 0.04), rng.f(0.05, 0.12), rng.f(0.03, 0.12)], loop: rng.f(7, 12), phase: rng() }]);
    yield 'ashgrove: halls';

    // ---- the Court
    const beds = [[-30, -9, 10], [-29, 11, 9], [-11, -19, 10], [5, -13, 9], [21, -20, 10], [-13, 26.5, 9], [15, 26.5, 8], [-22, -1, 7]];      // troughs of planting on its floor: x, z, length
    const court = yield* atrium(deck, {
      x0: CX0, x1: CX1, z0: CZ0, z1: CZ1, y: FLOOR, storeys: 6, step: 2, depth: 6,
      sides: {
        spin: { wall: 2, color: '#c9a585' },
        anti: { fronts: { 2: [{ from: -21.8, to: -4.5, kind: 'hall', glazed: true, bays: 3, wall: '#d8c6a6' }, { from: 4.5, to: 11.5, kind: 'shop', name: 'Greengrocer', goods: 'greens', awning: ['#6f8a5a', '#e6dcc4'], ground: '#2f3b34', ink: '#ead9b0', font: 'serif', lit: 1 }] } },
      },
      mouths: [
        { side: 'anti', storey: 2, at: 0, width: 8, bridge: 5 }, { side: 'spin', storey: 2, at: 0, width: 8, bridge: 5 },
        { side: 'front', storey: 4, at: 0, width: 7, bridge: 4 }, { side: 'back', storey: 4, at: 0, width: 7, bridge: 4 },
      ],
      folk: { rail: 6, stroll: 3, floor: 1.3 }, floor: { bands: 11 },
      keep: (x, z) => x < 36 && !beds.some((b) => Math.abs(x - b[0]) < b[2] / 2 + 1 && Math.abs(z - b[1]) < 2.6),
    });
    yield 'ashgrove: court';
    yield* bridge(deck, { axis: 'x', from: -49, to: 45, at: 0, y: 0, width: 5, hang: 16, rails: true, bare: [[-4, 4]] });
    yield* bridge(deck, { axis: 'z', from: -38, to: 38, at: 0, y: 8, width: 4, hang: 16 });
    {
      // the trolley's rails across the two terraces the Arcade comes out onto
      const P = deck.pen(new Run(0, 0, 0, 0), 0, 'av');
      for (const [a, b] of [[-55, -49], [45, 51]]) for (const v of [-0.5, 0.5]) P.g.box(a, 0, v - 0.03, b, 0.012, v + 0.03, deck.pal.metal, { skip: 'b' });
      P.done();
    }
    deck.zone({ min: [44.3, FLOOR - 0.5, CZ0 - 1], max: [45.5, 0.4, CZ1 + 1], soft: 0.9, color: '#fff5e4', power: 0.6, side: 1, under: 1 });
    pearWall(deck, court.sideRun('spin', 0), rng);
    deck.put('noticeboard', { p: [40.2, FLOOR, -7.5], yaw: 2.447, color: '#5f4630' });
    deck.sign(['The pears', 'First two: our oldest', 'and our newest.', 'The rest by lottery.'], { at: [40.18, FLOOR + 1.375, -7.477], n: [-0.64, 0.77], w: 1.2, h: 0.98, style: 'paper', font2: 'serif' });
    rose(deck, { at: [6, 6], y: FLOOR, r: 4.2 });
    // on the Court's floor: a few stalls and tables at the Arcade end, benches, tubs
    for (let i = 0; i < 5; i++) { const x = -37 + i * 4.6, z = -16 + (i % 2) * 2.4; if (deck.clear(x, FLOOR + 1.4, z, 2.6)) { deck.put('stall', { p: [x, FLOOR, z], yaw: (i % 2) * Math.PI, color: deck.pal.awnings[i % 5][0] }); for (let k = 0; k < 3; k++) deck.put('crate', { p: [x - 0.7 + k * 0.7, FLOOR + 0.83, z], yaw: 0, color: ['#7fa860', '#c9914e', '#b9c46a', '#d9c48a', '#8f5f30'][(i + k) % 5] }); deck.people([{ p: [x + 0.2, FLOOR, z + (i % 2 ? -1 : 1) * 1.0], yaw: i % 2 ? 0 : Math.PI }]); } }
    for (let i = 0; i < 7; i++) {
      const x = -30 + i * 7.5 + rng.f(-1, 1), z = 19 + rng.f(-3, 3);
      if (!deck.clear(x, FLOOR + 1.3, z, 2.6)) continue;
      deck.put('tableRound', { p: [x, FLOOR, z], yaw: 0, color: '#d0c0a4' });
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + i, cx = x + Math.sin(a) * 0.78, cz = z + Math.cos(a) * 0.78; deck.put('chair', { p: [cx, FLOOR, cz], yaw: a, color: deck.pal.doors[(i * 3 + k) % 8] }); if (rng() < 0.7) deck.people([{ p: [cx, FLOOR + 0.48, cz], sit: true, yaw: a + Math.PI }]); }
      deck.put('dish', { p: [x, FLOOR + 0.755, z], yaw: 0, color: '#c9c8c2' });
    }
    for (const [x, z, yaw] of [[-20, 6, 0], [-36, 2, Math.PI / 2], [30, -8, -Math.PI / 2]]) if (deck.clear(x, FLOOR + 1.3, z, 2.2)) { deck.put('bench', { p: [x, FLOOR, z], yaw, color: '#5d7a62' }); if (rng() < 0.8) deck.people([{ p: [x + rng.f(-0.4, 0.4) * Math.cos(yaw), FLOOR + 0.45, z], sit: true, yaw: yaw + Math.PI }]); }
    for (const [x, z] of [[-41, -26], [-41, 26], [41, -27.5], [41, 27.5], [-14, -27], [0, 27], [22, -9]]) if (deck.clear(x, FLOOR + 1.3, z, 2.2)) deck.put('tub', { p: [x, FLOOR, z], yaw: rng() * 6.28, scale: rng.f(1.5, 2.1), color: deck.pal.leaf[Math.floor(rng() * 6)] });
    for (let i = 0; i < 2; i++) deck.put('robot', { p: [-52, FLOOR, -8 + i * 17], yaw: Math.PI / 2, drift: [0.55, 0, 0, 190], phase: 0.3 + i * 0.25, color: '#d9d4c8' });
    // long troughs of low planting, with a bench on each side
    {
      const P = deck.pen(new Run(0, FLOOR, 0, 0), 0, 'beds');
      for (const [bx, bz, len] of beds) {
        let free = true;
        for (let x = bx - len / 2 - 1; x <= bx + len / 2 + 1 && free; x += 1) free = deck.clear(x, FLOOR + 1.6, bz, 2.6);
        if (!free) continue;
        P.g.box(bx - len / 2, 0, bz - 1.1, bx + len / 2, 0.46, bz + 1.1, '#a89c86', { top: '#57493c', skip: 'b' });
        for (let x = bx - len / 2 + 0.6; x < bx + len / 2 - 0.3; x += rng.f(0.7, 1.1)) for (const dz of [-0.45, 0.45]) {
          deck.put('bush', { p: [x + rng.f(-0.2, 0.2), FLOOR + 0.42, bz + dz + rng.f(-0.15, 0.15)], yaw: rng() * 6.28, scale: [rng.f(1.2, 1.9), rng.f(1.1, 2.4), rng.f(1.2, 1.8)], color: shade(deck.pal.leaf[Math.floor(rng() * 6)], rng.f(0.85, 1.15)) });
          if (rng() < 0.3) deck.put('flower', { p: [x, FLOOR + 1.0 + rng.f(0, 0.3), bz + dz * 1.4], yaw: rng() * 6.28, scale: rng.f(1.2, 1.9), color: deck.pal.bloom[Math.floor(rng() * 5)] });
        }
        for (const sd of [-1, 1]) { deck.put('bench', { p: [bx + rng.f(-2, 2), FLOOR, bz + sd * 1.5], yaw: sd > 0 ? Math.PI : 0, color: '#5d7a62' }); if (rng() < 0.75) deck.people([{ p: [bx + rng.f(-2.4, 2.4), FLOOR + 0.45, bz + sd * 1.46], sit: true, yaw: sd > 0 ? 0 : Math.PI }]); }
      }
      P.done();
    }
    yield 'ashgrove: the pears';

    // ---- Pear Street, deck 77: toward the front to the lift core, and the other way beyond the Court
    const homes = { mix: { home: 3, wall: 0.25, shop: 0.5 }, bay: [3.8, 5.2], numbers: 201, blades: 0.6 };
    const C1 = -60.75, C2 = -78.75, CW = 3.5;                              // the two corners
    const corner = (c) => ({ from: c - CW / 2, to: c + CW / 2, kind: 'gap' });
    yield* street(deck, {
      axis: 'z', from: ZL, to: -44, at: 0, y: 8, width: 7, cloth: 0.35,
      lamps: { every: 6, grid: -47, lattice: { from: -236, to: 236 }, power: 1.0 },
      plates: [{ at: -49.5, lines: ['Pear Street', ADDRESS77] }],
      folk: { stand: 5, stroll: 3, walk: 6 },
      fronts: {
        anti: [corner(C1), corner(C2), { from: C2 - CW / 2 - 7.5, to: C2 - CW / 2, kind: 'shop', id: 'thiamine', name: 'The Thiamine', sub: ['Fortified,', 'like our salt.'], goods: 'bottles', awning: false, blade: 'Gin', ground: '#27394a', ink: '#e6dcc6', font: 'italic', door: '#7e3f33', open: true, lit: 1 }],
        spin: [corner(C1), corner(C2), { from: -72, to: -68, kind: 'stair', sub: 'Up 78, down 76' }],
      },
      fill: homes,
    });
    yield* street(deck, { axis: 'z', from: 44, to: 236, at: 0, y: 8, width: 7, lamps: { every: 6, grid: -47, lattice: false }, folk: { stand: 3, stroll: 2, walk: 3 }, fill: { ...homes, numbers: 301 } });
    deck.lattice({ origin: [-20.5, 10.9, C2], spacing: [6, C1 - C2], count: [8, 2], power: 0.9, reach: 4.2, drop: 3.92 });
    for (const c of [C1, C2]) for (const sd of [-1, 1]) yield* street(deck, { axis: 'x', from: sd < 0 ? -23.5 : 3.5, to: sd < 0 ? -3.5 : 23.5, at: c, y: 8, width: CW, ribs: false, lamps: { every: 6, grid: -20.5, lattice: false }, folk: { stand: 0, stroll: 0, walk: 0 }, fill: { mix: { home: 1 }, bay: [4.4, 5.6], numbers: 240 }, ends: sd < 0 ? ['wall', 'open'] : ['open', 'wall'], part: 'side' });
    // the lift core at the end: a lobby, four cab doors, one of them the way out
    yield* hall(deck, { x0: -6.5, x1: 6.5, z0: ZW, z1: ZL, y: 8, open: { back: [[-3.5, 3.5]], front: 'none' }, wall: '#d6cbb4', dado: '#6d6c68', floor: deck.pal.court, lamps: { spacing: [4.3, 5.6], kind: 'panel', power: 1.15 }, part: 'lobby' });
    const lifts = lobby(deck, { at: [0, ZW], y: 8, face: 'back', doors: 4, pitch: 2.6, width: 13, hole: 1, open: [3], lines: [ADDRESS77], door: '#51627a', wall: '#d6cbb4' });
    rose(deck, { at: [0, ZW + 2.9], y: 8, r: 1.25, words: false });
    yield 'ashgrove: pear street';

    yield* finish(deck);
    const scene = new Scene();
    scene.add(deck.group);
    const open0 = path.tCross - 6.5, open1 = path.tCross - 3.0;
    lifts.slide(0);
    return {
      scene, path, deck, near: 0.12, far: 700,
      look: { exposure: 1.3, bloom: 0.22, threshold: 1.0, saturation: 1.04, vignette: 0.5, contrast: 1.04 },
      portal: { shape: 'rect', width: 1.5, height: 2.2, rim: false, mist: '#ffe6bc' },
      update(t) { deck.tick(t); lifts.slide(smoothstep(open0, open1, t)); },
    };
  },
};
