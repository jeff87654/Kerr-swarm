// Candlewick's two lift lobbies: Core A on Ladle Row and Core B on Thread Street. Each is a handsome public room in
// front of a lift core: a wall of four berth doors (drum-transport.md: four berths at every lobby) with a lamp over each
// that is lit when a cab is waiting, a call post, the drum in section in enamel, a direction rose in the floor, benches,
// a board of spare rooms and swaps, a stair door nobody uses, plants, and a clock that keeps the drum's time.
// One builder draws both, in a local frame: u runs along the berth wall (left to right, seen from the street), v runs
// from the berth wall out to the street.
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { SIGNS } from '../content/signs.js';
import {
  candlewick, say, found, sfx, seat, flatText, floorText, wallClock, pyaw, rngFor, shade, trims,
} from './civic_parts.js';

// Local (u, v) to the frame: origin (ox, oz) is the berth wall's left end, th the turn (0: v runs +z; -PI/2: v runs -x).
function Xf(ox, oz, th) {
  const c = Math.round(Math.cos(th)), sn = Math.round(Math.sin(th));
  const p = (u, v) => [ox + c * u + sn * v, oz - sn * u + c * v];
  const b = (u0, v0, u1, v1) => { const a = p(u0, v0), q = p(u1, v1); return [Math.min(a[0], q[0]), Math.min(a[1], q[1]), Math.max(a[0], q[0]), Math.max(a[1], q[1])]; };
  const dir = (du, dv) => [c * du + sn * dv, -sn * du + c * dv];
  const face = (F) => { const d = F === 'X' ? dir(1, 0) : F === 'x' ? dir(-1, 0) : F === 'Z' ? dir(0, 1) : dir(0, -1); return d[0] > 0.5 ? 'X' : d[0] < -0.5 ? 'x' : d[1] > 0.5 ? 'Z' : 'z'; };
  const clip = (u0, y0, v0, u1, y1, v1) => { const q = b(u0, v0, u1, v1); return [q[0], y0, q[1], q[2], y1, q[3]]; };
  return { p, b, dir, face, clip, yaw: (a) => a + th, th, ox, oz };
}

const LOBBIES = [
  {
    id: 'lobby-a', core: 'A', ox: 66, oz: -16, th: 0, U: 16, V: 12, H: 3.4,
    name: 'Core A lift lobby', sub: 'Ladle Row', stopSub: 'lift lobby on Ladle Row',
    pal: { enamel: '#1d5552', enamel2: '#2b7470', deep: '#14302f', tile: '#e8dcc2', plaster: '#e6d5b6', floor: '#d6c9ae', border: '#2b6b69', inlay: '#b0563a', inlay2: '#d39b3a', brass: '#c8a45a', wood: '#5b3d27', accent: '#e8743b', pot: '#b0563a', bench: '#7a5233', map: '#162636' },
    berths: [{ u: 4.0, ch: 'C', lit: true }, { u: 6.9, ch: 'D', lit: true }, { u: 11.1, ch: 'H', lit: false }, { u: 14.0, ch: 'I', lit: true }],
    stairs: { title: 'Stairs', lines: ['Stairs. 60 m down to Station Ring 2.', 'Hardly anyone does.'], say: ['A plain door in a handsome wall, painted the colour of the panels round it so it does not argue with the berths.', 'Its plate reads: Stairs. 60 metres down to Station Ring 2. Hardly anyone does.', 'Somebody has scratched a tally beside the handle: four marks, very old.'] },
    board: {
      title: 'Spare rooms and swaps',
      cards: [
        { kind: 'notice', title: 'Swap', lines: ['Our Hollow morning, the 4th,', 'the lawns, for any evening.', 'Two children. Quiet, mostly.', '19 · 5'] },
        { kind: 'notice', title: 'Flight shift', lines: ['Swap our 22:00 for 23:30.', 'Grandmother wants to', 'sleep first.', 'Ask at 20 · 7'] },
        { kind: 'notice', title: 'Wanted, lent', lines: ['A cot. Returned mended.', 'Twins, so two if you have', 'two. 18 · 3'] },
        { kind: 'notice', title: 'Room for a cook', lines: ['A room on deck 21 for a', 'guest who cooks two nights', 'a week at the hall.', 'Ask Rhoswen.'] },
        { kind: 'notice', title: 'Found in a cab', lines: ['One glove, green, left.', 'On the hook below.'], paper: '#e8f0e0' },
        { kind: 'notice', title: 'Room for hours', lines: ['Deck 20. Warm, a herb shelf.', 'Rent: someone to carry', 'the shopping on Tuesdays.', 'Imre, 20 · 12'], paper: '#f3e3d0' },
      ],
      say: ['Swap: our Hollow morning on the 4th, on the lawns, for any evening. Two children. Quiet, mostly. 19 · 5.', 'Flight shift: swap our 22:00 for 23:30. Grandmother wants to sleep first.', 'Wanted, lent: a cot, returned mended. Twins, so two if you have two.', 'A room on deck 21 for a guest who cooks two nights a week at the hall. Ask Rhoswen.', 'Room for hours, deck 20: warm, a herb shelf. The rent is someone to carry the shopping on Tuesdays.', 'Found in a cab: one glove, green, left. It is on the hook below, looking hopeful.'],
    },
  },
  {
    id: 'lobby-b', core: 'B', ox: 17, oz: 41, th: -Math.PI / 2, U: 16, V: 14, H: 3.4,
    name: 'Core B lift lobby', sub: 'Thread Street', stopSub: 'lift lobby on Thread Street',
    pal: { enamel: '#3b5f36', enamel2: '#5f8a4a', deep: '#22351f', tile: '#efe2c2', plaster: '#ead8b2', floor: '#d9cdb0', border: '#b9822e', inlay: '#33406e', inlay2: '#c9552e', brass: '#c8a45a', wood: '#6a4529', accent: '#f2b13c', pot: '#33406e', bench: '#8a5a32', map: '#1e2a22' },
    berths: [{ u: 4.0, ch: 'C', lit: true }, { u: 6.9, ch: 'E', lit: false }, { u: 11.1, ch: 'H', lit: true }, { u: 14.0, ch: 'J', lit: true }],
    stairs: { title: 'Stairs', lines: ['Stairs. Every deck,', 'all the way to the Hollow.', 'One at a time is plenty.'], say: ['The stair door. Its plate reads: Stairs. Every deck, all the way up to the Hollow. One at a time is plenty.', 'Through the little window you can see the first flight going up, lit, swept, and empty.', 'At 0.98 of a g a deck is twenty-four steps. Higher up you weigh less, and the steps get easier the nearer you live to the Hollow.'] },
    board: {
      title: 'The spare room board',
      cards: [
        { kind: 'notice', title: 'A room, deck 21', lines: ['For a student. Rent: an', 'hour a day reading aloud.', 'Good eyes preferred.', 'Mirela, 21 · 4'], hand: true },
        { kind: 'notice', title: 'Two rooms, terrace', lines: ['Lent for the festival to', 'anyone from Hassock who', 'needs a bed. Free.', '20 · 1'] },
        { kind: 'notice', title: 'Swap', lines: ['A lake turn on the 11th', 'for an orchard morning.', 'We burn.', '17 · 22'] },
        { kind: 'notice', title: 'Room for hours', lines: ['An elder with a long', 'sofa and a short memory.', 'Come and be told things.', 'Sami, 19 · 30'], hand: true, paper: '#f3e3d0' },
        { kind: 'notice', title: 'Wanted', lines: ['A second pair of', 'wing-sleeves for the', 'Long Flight. Lent back', 'the same night.'], paper: '#e8f0e0' },
        { kind: 'notice', title: 'Hollow tonight', lines: ['Cab to the Hollow:', 'about ninety seconds.', 'You arrive at half a g.', 'Step short.'] },
      ],
      say: ['A room on deck 21, for a student. The rent is an hour a day reading aloud. Good eyes preferred.', 'Two terrace rooms lent for the festival to anyone from Hassock who needs a bed. Free.', 'Swap: a lake turn on the 11th for an orchard morning. Underneath: "We burn."', 'Room for hours: an elder with a long sofa and a short memory. Come and be told things.', 'Wanted: a second pair of wing-sleeves for the Long Flight, lent back the same night.', 'And a printed card: cab to the Hollow, about ninety seconds. You arrive at half a g. Step short.'],
    },
  },
];

const MAP_LEGEND = (core) => ({ kind: 'board', title: 'Chervil in section', lines: ['The Keel|decks 1 to 15 · 1 g', 'The Low decks|16 to 113', 'The Middle decks|114 to 301', 'The High decks|302 to 375', 'The Hollow|half a g', 'You are here|deck 16 · core ' + core, 'Anywhere|about 12 minutes'], palette: ['#162636', '#f3e6c8', '#e8a24a'] });
const CHANNELS = (core) => ({ kind: 'board', title: 'Core ' + core + ' · ten channels', lines: ['Express up|A · B', 'Collectors up|C · D · E', 'Express down|F · G', 'Collectors down|H · I · J', 'One party a cab'], palette: ['#14201e', '#f3e6c8', '#e8a24a'] });

function buildLobby(game, s, f, L) {
  const g = s.g, X = Xf(L.ox, L.oz, L.th), U = L.U, V = L.V, H = L.H, P = L.pal;
  const at = (fn) => { g.at(L.ox, 0, L.oz, L.th); fn(); g.pop(); };
  const clip = X.clip(-0.05, -0.3, -0.05, U + 0.05, H + 0.2, V + 0.6);
  const W3 = (u, y, v) => { const q = X.p(u, v); return [q[0], y, q[1]]; };
  const wl = (u0, v0, u1, v1, o) => { const a = X.p(u0, v0), b = X.p(u1, v1); wall(s, a[0], a[1], b[0], b[1], 0, H, o); };

  // ---------------- shell: floor, ceiling, walls ----------------
  { const q = X.b(0, 0, U, V); floor(s, q[0], q[1], q[2], q[3], 0, 'terrazzo', P.floor); ceiling(s, q[0], q[1], q[2], q[3], H, 'paint', '#efe4cf'); }
  wl(0, 0.08, U, 0.08, { mat: 'panel', tint: P.enamel, dado: { h: 1.05, mat: 'tile', tint: P.enamel2 }, skirt: P.deep });
  wl(0.08, 0, 0.08, V, { mat: 'plaster', tint: P.plaster, dado: { h: 1.1, mat: 'tile', tint: P.tile }, skirt: P.wood });
  wl(U - 0.08, 0, U - 0.08, V, { mat: 'plaster', tint: P.plaster, dado: { h: 1.1, mat: 'tile', tint: P.tile }, skirt: P.wood });
  // the front: two square piers and a deep lintel; the rest is open to the street
  s.structure(() => at(() => {
    g.mat('panel', P.enamel); g.box(0, 0, V - 0.5, 0.5, H, V, { bevel: 0.02 }); g.box(U - 0.5, 0, V - 0.5, U, H, V, { bevel: 0.02 });
    g.mat('cast', P.brass, { rough: -0.2 }); for (const u of [0, U - 0.5]) { g.box(u - 0.01, 1.08, V - 0.51, u + 0.51, 1.12, V + 0.01); g.box(u - 0.02, 0, V - 0.52, u + 0.52, 0.14, V + 0.02, { bevel: 0.01 }); }
    g.mat('panel', P.deep); g.box(0.5, 2.86, V - 0.45, U - 0.5, H, V, { bevel: 0.02 });
    g.mat('cast', P.brass, { rough: -0.2 }); g.box(0.5, 2.84, V - 0.47, U - 0.5, 2.87, V + 0.01);
    // a brass threshold strip and a border band in the floor
    g.mat('cast', P.brass); g.box(0.5, 0, V - 0.06, U - 0.5, 0.006, V - 0.02);
  }));
  { const a = X.b(0, V - 0.5, 0.5, V), b2 = X.b(U - 0.5, V - 0.5, U, V), c = X.b(0.5, V - 0.45, U - 0.5, V); s.solid(a[0], 0, a[1], a[2], H, a[3]); s.solid(b2[0], 0, b2[1], b2[2], H, b2[3]); s.solid(c[0], 2.86, c[1], c[2], H, c[3]); }
  sign(s, { kind: 'fascia', text: 'LIFT · STAIRS', sub: 'core ' + L.core + ' · cab berths · decks 16 to 21', font: 'caps', palette: [P.deep, '#f3e6c8', P.accent] }, ...W3(U / 2, 3.13, V + 0.005), { face: X.face('Z'), w: 4.4, h: 0.48, board: false, glow: 0.6 });
  sign(s, { kind: 'fascia', text: 'CAB BERTHS', sub: 'one party a cab', font: 'caps', palette: [P.deep, '#f3e6c8', P.accent] }, ...W3(U / 2, 3.13, V - 0.455), { face: X.face('z'), w: 3.4, h: 0.44, board: false, glow: 0.4 });
  sign(s, SIGNS['lobby-' + L.core.toLowerCase() + '.plate'] || { kind: 'plate', text: 'CORE ' + L.core }, ...W3(0.25, 1.55, V + 0.005), { face: X.face('Z'), w: 0.42, h: 0.2 });
  sign(s, { kind: 'plate', text: 'DECK 16 · RING TWO', lines: ['Candlewick'] }, ...W3(U - 0.25, 1.55, V + 0.005), { face: X.face('Z'), w: 0.42, h: 0.2 });

  // floor: a border band round the room and a finer brass line
  s.structure(() => at(() => {
    g.mat('terrazzo', P.border); for (const r of [[0.35, 0.35, U - 0.35, 0.6], [0.35, V - 0.95, U - 0.35, V - 0.7], [0.35, 0.6, 0.6, V - 0.95], [U - 0.6, 0.6, U - 0.35, V - 0.95]]) g.box(r[0], 0, r[1], r[2], 0.003, r[3], { faces: 'Y' });
    g.mat('cast', P.brass); for (const r of [[0.75, 0.75, U - 0.75, 0.77], [0.75, V - 1.12, U - 0.75, V - 1.1], [0.75, 0.75, 0.77, V - 1.1], [U - 0.77, 0.75, U - 0.75, V - 1.1]]) g.box(r[0], 0, r[1], r[2], 0.004, r[3], { faces: 'Y' });
  }));

  // ---------------- ceiling: coffers round a laylight ----------------
  s.structure(() => at(() => {
    g.mat('paint', P.deep, { rough: 0.15 });
    for (const u of [4.5, 12.5]) g.box(u - 0.14, H - 0.3, 0.16, u + 0.14, H, V - 0.45, { bevel: 0.015, faces: 'xXyzZ' });
    for (const v of [3.5, 9.5]) g.box(0.16, H - 0.3, v - 0.14, U - 0.16, H, v + 0.14, { bevel: 0.015, faces: 'xXyzZ' });
    g.mat('cast', P.brass); for (const v of [3.5, 9.5]) g.box(0.16, H - 0.31, v - 0.02, U - 0.16, H - 0.295, v + 0.02);
    // the laylight's frame: a moulded tray with a lit glass panel in it (the lamp below supplies the glass)
    g.mat('paint', '#f3ead4'); g.box(6.1, H - 0.12, 4.95, 10.9, H, 5.15); g.box(6.1, H - 0.12, 7.85, 10.9, H, 8.05); g.box(6.1, H - 0.12, 5.15, 6.3, H, 7.85); g.box(10.7, H - 0.12, 5.15, 10.9, H, 7.85);
    // glazing bars across the laylight, and a brass rosette where they cross
    g.mat('paint', P.deep, { rough: 0.1 });
    for (let k = 1; k < 6; k++) { const u = 6.3 + k * 4.4 / 6; g.box(u - 0.025, H - 0.075, 5.15, u + 0.025, H - 0.035, 7.85); }
    for (let k = 1; k < 3; k++) { const v = 5.15 + k * 2.7 / 3; g.box(6.3, H - 0.075, v - 0.025, 10.7, H - 0.035, v + 0.025); }
    g.mat('cast', P.brass); g.box(8.45, H - 0.1, 6.45, 8.55, H - 0.07, 6.55, { bevel: 0.01 });
    // a duct and the core's cable trays along the berth wall
    g.mat('brushed', '#a9a49a'); g.tube([[0.3, H - 0.24, 1.0], [U - 0.3, H - 0.24, 1.0]], 0.12, { segs: 12, caps: false });
    g.mat('brushed', '#8d897f'); for (let u = 1.2; u < U - 0.5; u += 2.4) g.tube([[u - 0.03, H - 0.24, 1.0], [u + 0.03, H - 0.24, 1.0]], 0.135, { segs: 12 });
    g.mat('cast', '#3a3630'); g.box(0.3, H - 0.1, 1.45, U - 0.3, H - 0.08, 1.75); g.box(0.3, H - 0.1, 1.45, U - 0.3, H - 0.02, 1.47); g.box(0.3, H - 0.1, 1.73, U - 0.3, H - 0.02, 1.75);
    g.mat('plain', '#2a2622'); for (const dz of [1.52, 1.58, 1.64, 1.69]) g.tube([[0.3, H - 0.07, dz], [U - 0.3, H - 0.07, dz]], 0.012, { segs: 4, caps: false });
  }));

  // ---------------- the berth wall ----------------
  const panelTop = 2.95;
  s.deco(() => at(() => {
    // a dark enamel band above the berths and a brass rule under it
    g.mat('paint', P.deep, { rough: -0.25 }); g.box(0.16, panelTop, 0.16, U - 0.16, H - 0.02, 0.19, { faces: 'Z' });
    g.mat('cast', P.brass); g.box(0.16, panelTop - 0.03, 0.16, U - 0.16, panelTop, 0.2, { bevel: 0.004 });
    // enamel pilasters between the berths, each with a brass cap
    for (const u of [2.48, 5.45, 8.4, 9.6, 12.55, 15.45]) { g.mat('paint', P.enamel2, { rough: -0.2 }); g.box(u - 0.11, 0, 0.16, u + 0.11, panelTop - 0.03, 0.24, { bevel: 0.012 }); g.mat('cast', P.brass); g.box(u - 0.13, panelTop - 0.12, 0.15, u + 0.13, panelTop - 0.04, 0.27, { bevel: 0.008 }); }
  }));
  const rb = rngFor(L.id + 'berths');
  for (const B of L.berths) {
    prop(s, 'civic.berth', ...W3(B.u, 0, 0.16), X.yaw(0), { surround: P.deep, leaf: '#bdb8ac', lit: B.lit });
    sign(s, { kind: 'street', text: '16 · ' + B.ch, sub: B.lit ? 'cab waiting' : 'cab coming', palette: [P.deep, '#f3e6c8'] }, ...W3(B.u, 2.86, 0.265), { face: X.face('Z'), w: 0.56, h: 0.15, board: false });
    if (B.lit) { lamp(s, 'bulb', ...W3(B.u, 2.5, 0.55), { color: '#ffb347', power: 0.3, range: 3.4, clip, lampFlag: false }); const h = W3(B.u, 2.6, 0.32); s.glowCard(h[0], h[1], h[2], { face: X.face('Z'), color: '#ffb347', size: 0.9, strength: 0.35, follow: 'always' }); }
    lamp(s, 'spot', ...W3(B.u, H, 1.1), { K: 3000, power: 0.55, clip, dir: [0, -1, 0], cone: [38, 16], range: 5 });
    const cp = W3(B.u, 1.2, 0.75);
    s.interact({ x: cp[0], y: 1.2, z: cp[2], radius: 1.25, prompt: 'Call a cab', onUse(gm) { sfx(gm, 'berth-door', f, cp[0], 1.2, cp[2]); found(gm, 'one-party'); if (gm.cab) gm.cab.open(L.id); } });
    s.spot('stand', ...W3(B.u + rb.f(-0.3, 0.3), 0, 1.05 + rb.f(0, 0.3)), X.yaw(Math.PI), { tags: ['wait', 'lobby'] });
  }
  // the clock and the channels board in the gap between the second and third berths
  wallClock(s, game, ...W3(9.0, 2.47, 0.2), X.face('Z'), { r: 0.3, rim: P.deep, glow: 0.5 });
  sign(s, CHANNELS(L.core), ...W3(9.0, 1.45, 0.205), { face: X.face('Z'), w: 1.0, h: 0.86, back: P.deep });
  { const q = W3(9.0, 1.4, 0.9); s.interact({ x: q[0], y: 1.4, z: q[2], radius: 1.1, prompt: 'Read the channels board', async onUse(gm) { await say(gm, 'Core ' + L.core, ['Ten channels run up and down this core, past every deck: two express channels and three collectors each way.', 'The berths here open off collectors C, D, H and I, give or take whichever cab came. About 38,000 people use this core, and on this deck about a hundred.', 'One party a cab. Nobody changes on the way.']); found(gm, 'lift-cores'); } }); }
  { const q = W3(9.0, 2.4, 0.8); s.interact({ x: q[0], y: 2.2, z: q[2], radius: 1.4, prompt: 'Read the clock', onUse(gm) { const t = gm.clock && gm.clock.label ? gm.clock.label() : ''; say(gm, 'The lobby clock', ['It says ' + t + '. It is set from the core, so every lobby clock in Chervil agrees to the second, and people still check it against the hall.']); } }); }
  // the call post
  prop(s, 'civic.callpost', ...W3(9.0, 0, 1.75), X.yaw(0), { body: P.enamel });
  sign(s, SIGNS['lobby.calling'], ...W3(9.0, 0.62, 1.86), { face: X.face('Z'), w: 0.17, h: 0.24, board: false });
  { const q = W3(9.0, 1.1, 2.2); s.interact({ x: q[0], y: 1.1, z: q[2], radius: 1.1, prompt: 'Press the call button', onUse(gm) { sfx(gm, 'chime', f, q[0], 1.1, q[2]); found(gm, 'one-party'); if (gm.cab) gm.cab.open(L.id); } }); }

  // the stair door at the left end of the berth wall: a plain hinged door painted to match, with a wired window
  s.furniture(() => at(() => {
    g.mat('wood', '#4a3324'); g.box(0.62, 0, 0.16, 0.72, 2.2, 0.26, { bevel: 0.01 }); g.box(1.78, 0, 0.16, 1.88, 2.2, 0.26, { bevel: 0.01 }); g.box(0.62, 2.12, 0.16, 1.88, 2.24, 0.26, { bevel: 0.01 });
    g.mat('paint', shade(P.enamel, 1.15), { rough: -0.1 }); g.box(0.72, 0, 0.16, 1.78, 2.12, 0.21, { bevel: 0.008 });
    g.mat('paint', shade(P.enamel, 1.3)); g.box(0.82, 0.18, 0.21, 1.68, 0.95, 0.225, { bevel: 0.006 });
    g.mat('diffuser', '#d9e2dc', { rough: -0.3 }); g.box(1.05, 1.35, 0.21, 1.45, 1.85, 0.222);
    g.mat('cast', '#3a3630'); for (let k = 0; k <= 4; k++) { g.box(1.05 + k * 0.1 - 0.003, 1.35, 0.222, 1.05 + k * 0.1 + 0.003, 1.85, 0.226); g.box(1.05, 1.35 + k * 0.125 - 0.003, 0.222, 1.45, 1.35 + k * 0.125 + 0.003, 0.226); }
    g.mat('cast', P.brass); g.box(0.86, 0.98, 0.21, 0.92, 1.12, 0.25, { bevel: 0.01 }); g.tube([[0.89, 1.05, 0.25], [1.05, 1.05, 0.26]], 0.012, { segs: 6 });
    g.mat('plain', '#cfc6b6'); for (let k = 0; k < 4; k++) g.box(1.62 + k * 0.025, 1.0, 0.215, 1.632 + k * 0.025, 1.09, 0.218);
  }));
  sign(s, { kind: 'plate', text: L.stairs.title.toUpperCase(), lines: L.stairs.lines }, ...W3(1.25, 2.42, 0.27), { face: X.face('Z'), w: 0.62, h: 0.3 });
  lamp(s, 'sconce', ...W3(2.12, 2.15, 0.17), { face: X.face('Z'), K: 2900, power: 0.5, clip });
  { const q = W3(1.25, 1.1, 0.75); s.interact({ x: q[0], y: 1.1, z: q[2], radius: 1.2, prompt: 'Try the stair door', async onUse(gm) { sfx(gm, 'door', f, q[0], 1.1, q[2]); await say(gm, 'The stair door', L.stairs.say); found(gm, 'stairs-too'); } }); }
  s.spot('stand', ...W3(2.5, 0, 1.4), X.yaw(-2.4), { tags: ['wait', 'lobby'] });

  // ---------------- the drum in section, in enamel, on the left wall ----------------
  const mv = 5.6, my = 1.78;           // the panel's centre along the wall, and its height
  s.deco(() => at(() => {
    g.mat('cast', P.brass, { rough: -0.15 }); g.box(0.16, my - 1.0, mv - 1.95, 0.205, my + 1.0, mv + 1.95, { bevel: 0.01 });
    g.mat('paint', P.map, { rough: -0.25 }); g.box(0.2, my - 0.96, mv - 1.91, 0.215, my + 0.96, mv + 1.91, { faces: 'X' });
  }));
  { // concentric enamel discs, out from the wall: the rim, the Keel, the Low, Middle and High decks, the Hollow, the Spindle
    const c = W3(0.215, my, mv - 0.85), d = X.dir(1, 0), yw = Math.atan2(d[0], d[1]), R = 0.82;
    const rings = [[1.0, '#e6dcc6', 0.0], [0.985, '#4a4640', 0.004], [2944 / 3000, '#c9552e', 0.008], [2552 / 3000, '#d39b3a', 0.012], [1800 / 3000, '#e8dcbc', 0.016], [1504 / 3000, '#5f8a4a', 0.02], [1230 / 3000, '#4f7a40', 0.024]];
    s.deco(() => {
      g.at(c[0], c[1], c[2], yw); g.rotX(Math.PI / 2);
      for (const r of rings) { g.mat('paint', r[1], { rough: -0.3 }); g.cyl(0, r[2], 0, R * r[0], 0.006, { segs: 48 }); }
      g.mat('paint', '#1b1f3a'); g.cyl(0, 0.03, 0, R * 75 / 3000 * 4, 0.004, { segs: 20 });
      g.mat('paint', '#f2c879', { emissive: 1.4 }); g.cyl(0, 0.034, 0, 0.012, 0.004, { segs: 10 });
      g.pop();
      // the far bank and the lake drawn as little marks on the Hollow's floor; deck lines on the Low band
      g.at(c[0], c[1], c[2], yw);
      g.mat('paint', '#7fb0c8'); g.box(-0.16, R * 1504 / 3000 - 0.03, 0.034, 0.06, R * 1504 / 3000 - 0.012, 0.038);
      g.mat('paint', '#2f4f6b'); g.box(-0.08, -R * 1504 / 3000 + 0.012, 0.034, 0.12, -R * 1504 / 3000 + 0.03, 0.038);
      g.mat('paint', '#e8443a', { emissive: 4 }); g.ball(0, -R * 0.972, 0.04, 0.022, 0.022, 0.012, { segs: 10, rings: 5 });
      g.pop();
    });
    flatText(s, { kind: 'label', text: 'YOU ARE HERE', sub: 'deck 16', ink: '#ffe3a8' }, c[0] + d[0] * 0.041, c[1] - R * 0.972 - 0.075, c[2] + d[1] * 0.041, yw, 0.32, 0.09, { tier: 's' });
    for (const lb of [['THE HOLLOW', 0.0, 0.24], ['SUNLINE', 0.0, 0.05]]) flatText(s, { kind: 'label', text: lb[0], ink: '#f3e6c8' }, c[0] + d[0] * 0.042, c[1] + lb[2], c[2] + d[1] * 0.042, yw, 0.28, 0.06, { tier: 's' });
  }
  sign(s, MAP_LEGEND(L.core), ...W3(0.217, my - 0.04, mv + 1.0), { face: X.face('X'), w: 1.55, h: 1.55, board: false });
  sign(s, { kind: 'label', text: 'OUT IS DOWN · THE MIDDLE IS UP', ink: '#f3e6c8' }, ...W3(0.219, my + 0.9, mv - 0.85), { face: X.face('X'), w: 1.5, h: 0.08 });
  lamp(s, 'strip', ...W3(0.45, H - 0.42, mv - 1.8), { to: W3(0.45, H - 0.42, mv + 1.8), K: 3000, power: 0.75, clip, range: 4 });
  s.deco(() => at(() => { g.mat('cast', P.brass); for (const v of [mv - 1.6, mv + 1.6]) g.tube([[0.17, H - 0.3, v], [0.45, H - 0.42, v]], 0.012, { segs: 6 }); }));
  { const q = W3(1.0, 1.4, mv); s.interact({ x: q[0], y: 1.4, z: q[2], radius: 1.6, prompt: 'Look at the drum in section', async onUse(gm) {
    await say(gm, 'Chervil in section', ['The whole drum, cut across, in enamel. Out is down; the middle is up.', 'The thin dark ring at the rim is the Keel, decks 1 to 15, at a full g: food plant, water, freight and the nine station rings. Nobody lives there.', 'Then the Low decks, where the families are, then the Middle and the High, and in the middle the Hollow, three kilometres across, with the sunline down its axis as a gold dot.', 'A red bead near the bottom says you are here: deck 16, Candlewick. Somebody has rubbed it bright with a thumb. Anywhere on this map is about twelve minutes away by cab.']);
    found(gm, 'lift-cores');
  } }); }
  s.spot('stand', ...W3(1.3, 0, mv - 0.6), X.yaw(-Math.PI / 2), { tags: ['read', 'lobby'] });
  s.spot('stand', ...W3(1.5, 0, mv + 0.9), X.yaw(-Math.PI / 2 - 0.2), { tags: ['read', 'lobby'] });

  // ---------------- the right wall: the board of spare rooms and swaps, a bench under the sconces ----------------
  const bv = 4.4;
  s.deco(() => at(() => {
    g.mat('wood', P.wood); g.box(U - 0.2, 0.95, bv - 1.25, U - 0.16, 2.25, bv + 1.25, { bevel: 0.01 });
    g.mat('felt', '#b08a5e'); g.box(U - 0.215, 1.0, bv - 1.2, U - 0.2, 2.2, bv + 1.2, { faces: 'x' });
    g.mat('wood', P.wood); g.box(U - 0.32, 0.92, bv - 1.25, U - 0.16, 0.96, bv + 1.25, { bevel: 0.006 });
    g.mat('cast', '#3a3630'); g.box(U - 0.26, 1.22, bv + 1.35, U - 0.16, 1.25, bv + 1.38); g.tube([[U - 0.2, 1.24, bv + 1.36], [U - 0.27, 1.22, bv + 1.36]], 0.008, { segs: 5 });
    g.mat('knit', '#4f8a3a'); g.box(U - 0.29, 1.0, bv + 1.31, U - 0.25, 1.2, bv + 1.42, { bevel: 0.015 });     // the green glove on its hook
  }));
  sign(s, { kind: 'label', text: L.board.title.toUpperCase(), ink: '#2a2622' }, ...W3(U - 0.214, 2.32, bv), { face: X.face('x'), w: 1.6, h: 0.12 });
  { const rc = rngFor(L.id + 'cards');
    L.board.cards.forEach((c, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const v = bv - 0.8 + col * 0.8 + rc.f(-0.06, 0.06), y = 1.82 - row * 0.52 + rc.f(-0.04, 0.04);
      sign(s, c, ...W3(U - 0.218, y, v), { face: X.face('x'), w: 0.3, h: 0.4, board: false });
    });
  }
  { const q = W3(U - 1.0, 1.4, bv); s.interact({ x: q[0], y: 1.4, z: q[2], radius: 1.5, prompt: 'Read the ' + (L.core === 'A' ? 'board of rooms and swaps' : 'spare room board'), onUse(gm) { say(gm, L.board.title, L.board.say); } }); }
  s.spot('stand', ...W3(U - 1.1, 0, bv - 0.4), X.yaw(Math.PI / 2), { tags: ['read', 'lobby'] });
  s.spot('stand', ...W3(U - 1.2, 0, bv + 0.6), X.yaw(Math.PI / 2 + 0.3), { tags: ['read', 'lobby'] });
  for (const v of [1.6, 9.9]) lamp(s, 'sconce', ...W3(U - 0.17, 2.1, v), { face: X.face('x'), K: 2800, power: 0.7, clip });
  for (const v of [1.9, 9.4]) lamp(s, 'sconce', ...W3(0.17, 2.1, v), { face: X.face('X'), K: 2800, power: 0.7, clip });
  // a long bench against the right wall nearer the street
  prop(s, 'bench', ...W3(U - 0.5, 0, 8.4), X.yaw(-Math.PI / 2), { w: 2.4, back: true, wood: P.bench, metal: P.deep }, { tier: 's' });
  seatAt(s, W3(U - 0.55, 0, 8.4), X.yaw(-Math.PI / 2), 'Sit on the bench');

  // ---------------- the direction rose, inlaid in the floor, true to the drum ----------------
  const rc = W3(8.6, 0, 6.5), R = 1.55;
  s.structure(() => {
    g.mat('terrazzo', shade(P.floor, 0.86)); g.cyl(rc[0], 0.0, rc[2], R + 0.12, 0.003, { segs: 48 });
    g.mat('terrazzo', '#efe6d2'); g.cyl(rc[0], 0.0, rc[2], R, 0.004, { segs: 48 });
    g.mat('terrazzo', P.border); g.cyl(rc[0], 0.0, rc[2], R * 0.42, 0.005, { segs: 32 });
    g.mat('cast', P.brass, { rough: -0.2 });
    for (const rr of [R + 0.06, R - 0.02, R * 0.42]) { const pts = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; pts.push([rc[0] + Math.cos(a) * rr, 0.005, rc[2] + Math.sin(a) * rr]); } g.tube(pts, 0.012, { segs: 4, closed: true }); }
    // eight points: the four long ones in the inlay colours, four short ones in brass
    const pt = (a, len, wd, mat, tint, y) => {
      g.mat(mat, tint, { rough: -0.1 });
      const dx = Math.cos(a), dz = Math.sin(a), px = -dz, pz = dx;
      const tip = [rc[0] + dx * len, y, rc[2] + dz * len], l = [rc[0] + px * wd, y, rc[2] + pz * wd], r = [rc[0] - px * wd, y, rc[2] - pz * wd], c0 = [rc[0], y, rc[2]];
      flatQ(g, r, tip, l, c0);
    };
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; pt(a, R * 0.8, 0.13, 'cast', P.brass, 0.0065); }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; pt(a, R * 0.98, 0.2, 'terrazzo', k % 2 ? P.inlay : P.inlay2, 0.007); }
    g.mat('cast', P.brass); g.cyl(rc[0], 0.0, rc[2], 0.09, 0.012, { segs: 16 });
  });
  // the four words, each lying just outside its point and reading from the middle (spinward = +x, front = -z)
  for (const d of [['SPINWARD', 1, 0], ['ANTI', -1, 0], ['FRONT', 0, -1], ['BACK', 0, 1]]) floorText(s, { kind: 'label', text: d[0], ink: '#3a2a20' }, rc[0] + d[1] * (R + 0.34), 0.008, rc[2] + d[2] * (R + 0.34), d[1], d[2], 0.9, 0.2);
  { s.interact({ x: rc[0], y: 0.4, z: rc[2], radius: 1.4, prompt: 'Look down at the rose', async onUse(gm) {
    await say(gm, 'The rose in the floor', ['A direction rose in brass and terrazzo, worn pale in the middle where people stop to wait.', 'Spinward is the way the drum turns: walk it and you are a little heavier. Anti is the other way, and lighter. Front and back run along the axis, toward the two end walls, and there your weight does not change at all.', 'Somebody has chalked small feet on the anti point, heels together, as if to say: stand here for the lightest wait.']);
    found(gm, 'spin-heavier');
  } }); }
  s.spot('chat', rc[0] + 1.0, 0, rc[2] + 0.4, -Math.PI / 2 - 0.4, { tags: ['chat', 'lobby'] });
  s.spot('chat', rc[0] + 0.3, 0, rc[2] + 1.05, Math.PI + 0.3, { tags: ['chat', 'lobby'] });
  s.spot('chat', rc[0] + 1.15, 0, rc[2] + 1.35, -2.5, { tags: ['chat', 'lobby'] });

  // ---------------- benches facing the berths, plants, a lamp over each ----------------
  for (const u of [3.4, 13.4]) {
    prop(s, 'bench', ...W3(u, 0, 10.0), X.yaw(Math.PI), { w: 2.2, back: true, wood: P.bench, metal: P.deep }, { tier: 's' });
    seatAt(s, W3(u, 0, 10.0 - 0.05), X.yaw(Math.PI), 'Sit and wait');
  }
  const pots = [[0.7, 0.75, 'broad', 1.5], [U - 0.7, 0.75, 'fern', 1.2], [0.9, V - 0.85, 'fine', 1.7], [U - 0.95, V - 0.8, 'broad', 1.6], [0.7, 7.85, 'flower', 0.9]];
  for (const p of pots) prop(s, 'plant', ...W3(p[0], 0, p[1]), rb.f(0, 6.28), { kind: p[2], size: p[3], pot: L.core === 'A' ? (p[2] === 'fern' ? '#2b6b69' : P.pot) : (p[2] === 'flower' ? '#c9552e' : P.pot), seed: p[0] + p[1] });
  // a low trough of plants along the left wall under the map's lamp, and one against the right wall by the bench
  planter(s, ...W3(0.5, 0, 9.2), { w: X.th ? 1.8 : 0.5, d: X.th ? 0.5 : 1.8, h: 0.45, plants: L.core === 'B' ? 'flower' : 'fern', tint: P.tile, seed: 3 });
  planter(s, ...W3(U - 0.45, 0, 10.4), { w: X.th ? 1.0 : 0.4, d: X.th ? 0.4 : 1.0, h: 0.45, plants: 'herbs', tint: P.tile, seed: 4 });

  // why the cab leans, pinned by the last berth; a drinking tap on the left wall with lidded cups on hooks
  if (SIGNS['station-lobby.lean']) sign(s, SIGNS['station-lobby.lean'], ...W3(U - 0.17, 1.55, 1.9), { face: X.face('x'), w: 0.3, h: 0.42, board: false });
  { const q = W3(U - 0.9, 1.4, 1.9); s.interact({ x: q[0], y: 1.4, z: q[2], radius: 0.9, prompt: 'Read why the cab leans', async onUse(gm) { await say(gm, 'Why the cab leans', ['Going up, the drum pushes you sideways. The cabin hangs on a gimbal and swings three-quarters of the way against the push. It is meant to.', 'Underneath, in pencil: "All the way makes you sick. Ask my brother."']); found(gm, 'cab-lean'); } }); }
  s.furniture(() => at(() => {
    g.mat('tile', P.enamel2); g.box(0.16, 0.0, 2.75, 0.5, 0.82, 3.45, { bevel: 0.02 });
    g.mat('glaze', '#f1e6cf'); g.box(0.2, 0.82, 2.7, 0.58, 0.92, 3.5, { bevel: 0.03 });
    g.mat('cast', P.brass, { rough: -0.25 }); g.tube([[0.17, 1.25, 3.1], [0.38, 1.25, 3.1], [0.4, 1.12, 3.1]], 0.016, { segs: 8 }); g.box(0.16, 1.18, 3.02, 0.2, 1.32, 3.18, { bevel: 0.01 });
    g.tube([[0.17, 1.55, 2.82], [0.3, 1.55, 2.82], [0.3, 1.5, 2.82]], 0.006, { segs: 5 }); g.tube([[0.17, 1.55, 3.38], [0.3, 1.55, 3.38], [0.3, 1.5, 3.38]], 0.006, { segs: 5 });
  }));
  { const a = X.b(0.16, 2.7, 0.58, 3.5); s.solid(a[0], 0, a[1], a[2], 0.92, a[3]); }
  for (const v of [2.82, 3.38]) prop(s, 'cup', ...W3(0.3, 1.38, v), 0, { glaze: v < 3 ? P.accent : P.enamel2, lid: '#f1e6cf' });
  { const q = W3(0.9, 1.0, 3.1); s.interact({ x: q[0], y: 1.0, z: q[2], radius: 0.9, prompt: 'Drink from the tap', onUse(gm) { sfx(gm, 'pour', f, q[0], 1.0, q[2]); say(gm, 'The tap', ['Cold, and tasting faintly of nothing, which in a drum means very well looked after. The cups on the hooks have lids, like everything else.']); } }); }

  // two potted trees flanking the walk in, under their own lamps
  for (const t of [[4.6, 7.8, 0], [12.6, 7.8, 1]]) {
    prop(s, 'plant', ...W3(t[0], 0, t[1]), t[2] * 2.1, { kind: L.core === 'A' ? 'fine' : 'broad', size: 2.3, pot: P.enamel2, seed: 11 + t[2] });
    const q = W3(t[0], 0, t[1]); lamp(s, 'spot', q[0], H, q[2], { K: 2900, power: 0.45, clip, cone: [40, 20], range: 4.5 });
    seatAt(s, W3(t[0], 0, t[1] + 0.62), X.yaw(Math.PI), 'Sit on the edge of the planter');
  }
  // posters on the right wall, nearer the street
  { const pz = L.core === 'A' ? ['poster.booking', 'poster.feast', 'poster.quiet'] : ['poster.flight', 'poster.dawn', 'poster.reels'];
    pz.forEach((id, i) => { if (SIGNS[id]) sign(s, SIGNS[id], ...W3(U - 0.17, 1.78, 6.05 + i * 0.7), { face: X.face('x'), w: 0.56, h: 0.8 }); }); }
  // trims: a picture rail and an enamel band round the two side walls
  { const q = X.b(0, 0, U, V); trims(s, q[0], q[1], q[2], q[3], { skip: L.core === 'A' ? 'ns' : 'we', rail: 2.42, railTint: P.wood, band: P.enamel, bandH: 0.34, H }); }
  if (L.core === 'B') {
    // the Hollow lobby: ferns in baskets hung from the coffer beams
    const rr = rngFor('lb-ferns');
    for (const hp of [[4.5, 2.2], [4.5, 5.0], [4.5, 8.2], [12.5, 2.2], [12.5, 5.0], [12.5, 8.2]]) {
      const q = W3(hp[0], 0, hp[1]), y = H - 0.95;
      s.detail(() => {
        g.mat('weave', '#d8cdb8'); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI * 2; g.tube([[q[0] + Math.cos(a) * 0.17, y + 0.2, q[2] + Math.sin(a) * 0.17], [q[0], H - 0.3, q[2]]], 0.004, { segs: 3, caps: false }); }
        g.mat('cane', '#b98f55'); g.lathe(q[0], q[2], [[0.05, y], [0.15, y + 0.04], [0.19, y + 0.2], [0.17, y + 0.2]], { segs: 14 });
        for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2 + rr.f(0, 0.5); g.mat('fern', '#ffffff', { sway: 0.6 }); g.card(q[0] + Math.cos(a) * 0.08, y + 0.16, q[2] + Math.sin(a) * 0.08, 0.32, rr.f(0.45, 0.65), a + Math.PI / 2, { tilt: rr.f(0.9, 1.4) }); }
      });
    }
  }

  // ---------------- light ----------------
  { const q = W3(8.5, H - 0.02, 6.5); const d = X.dir(1, 0); lamp(s, 'panel', q[0], H - 0.03, q[2], { w: Math.abs(d[0]) > 0.5 ? 4.4 : 2.7, d: Math.abs(d[0]) > 0.5 ? 2.7 : 4.4, K: 3200, power: 0.8, clip, range: 9 }); }
  for (const u of [2.5, 14.5]) { const q = W3(u, H - 0.3, 6.5); lamp(s, 'globe', q[0], 2.62, q[2], { K: 2800, power: 0.6, clip, drop: H - 2.62 - 0.02, r: 0.2 }); }
  { const q = X.b(0, 0, U, V); roomGlow(s, q[0], 0, q[1], q[2], H, q[3], { sky: '#ffe2b8', ground: P.floor, power: 0.2 }); }

  // ---------------- sound, zone, people, the cab stop ----------------
  { const q = W3(U / 2, 1.5, -0.6); let on = false; s.world.dynamics.push({ scope: s, update() { if (on || !game.audio || !game.loopAt) return; on = true; game.loopAt('cab-hum', f, q[0], 1.5, q[2], { vol: 0.18, radius: 10 }); } }); }
  { const q = X.b(0, 0, U, V + 0.02); s.zoneBox({ id: L.id, place: L.id, box: [q[0], -0.5, q[1], q[2], H, q[3]], name: L.name, sub: L.sub, ambience: 'arcade', reverb: 'hall' }); }
  // walkways: in from the street, to the berths, the rose, the map, the board and the stair door
  const P2 = (u, v) => X.p(u, v);
  s.path([P2(8.6, V + 0.9), P2(8.6, V - 1.0), P2(8.6, 8.6)]);
  s.path([P2(8.6, 8.6), P2(9.8, 6.5), P2(9.0, 3.0)]);
  s.path([P2(8.6, 8.6), P2(6.8, 6.6), P2(6.0, 3.0)]);
  s.path([P2(9.0, 3.0), P2(9.6, 2.6), P2(11.1, 1.6), P2(14.0, 1.6)]);
  s.path([P2(6.0, 3.0), P2(6.9, 1.6), P2(4.0, 1.6), P2(2.5, 1.6), P2(1.25, 1.2)]);
  s.path([P2(6.0, 3.0), P2(3.0, 4.6), P2(1.6, 5.6)]);
  s.path([P2(9.8, 6.5), P2(13.0, 5.0), P2(U - 1.4, bv)]);
  s.path([P2(5.8, V + 0.9), P2(5.8, V - 1.6), P2(6.8, 6.6)], { width: 1.4 });
  s.path([P2(11.4, V + 0.9), P2(11.4, V - 1.6), P2(9.8, 6.5)], { width: 1.4 });
  const stop = W3(9.0, 0, 2.6);
  if (game.cab) game.cab.addStop({ id: L.id, name: 'Candlewick', sub: L.stopSub, frame: f, x: stop[0], y: 0, z: stop[2], yaw: pyaw(X.yaw(0)) });
  const sp = W3(U / 2, 0, V + 0.8);
  game.spawns[L.id] = { frame: f, x: sp[0], y: 0, z: sp[2], yaw: pyaw(X.yaw(Math.PI)) };
}

// A quad lying flat on the floor, turned up whichever way the corners come.
function flatQ(g, a, b, c, d) {
  const ux = b[0] - a[0], uz = b[2] - a[2], vx = d[0] - a[0], vz = d[2] - a[2];
  const ny = uz * vx - ux * vz;
  if (ny >= 0) g.quad(a, b, c, d); else g.quad(a, d, c, b);
}
function lerpXZ(p) { return [p[0], p[1], p[2]]; }
function seatAt(s, p, yaw, label) { return seat(s, p[0], 0, p[2], yaw, label, { radius: 1.2 }); }

export const place = {
  id: 'lobby-a', name: 'The lift lobbies (Core A and Core B)', order: 58,
  build(game) {
    const f = candlewick(game);
    for (const L of LOBBIES) {
      const s = game.world.scope(L.id, f);
      buildLobby(game, s, f, L);
      s.finish();
    }
    game.places['lobby-b'] = place;
  },
};
