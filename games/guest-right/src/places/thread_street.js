// Thread Street: Candlewick's street along the axis, south from Wick Court. The menders' and dyers' street: this week's
// colours hang drying across it overhead, the fronts are doors and workshops, and your weight stays the same whichever
// way you walk. At its far end an arch into Saffron Yard, and the street running on.
import { lamp } from '../world/kit.js';
import { shopfront } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';
import { PLACES } from '../content/places.js';
import {
  street, side, shell, streetGlow, unit, pilaster, pier, thresholdArch, runOn, bench, noticeboard, letterFlaps, chalk,
  streetPlanter, frontWall, rowPath, stations, stitch, signBoard, FIN, CLOTH, read, found,
} from './street_parts.js';

const H = 3.4;
const P = (text, sub) => ({ kind: 'street', text, sub });

// A hand lamp, the kind everyone carries on the Long Flight. p: { c, lit }
defineProp('streets.handlamp', (g, p) => {
  g.mat('cast', p.c || '#b08a45', { rough: -0.2 }); g.lathe(0, 0, [[0.05, 0], [0.052, 0.012], [0.04, 0.03], [0.036, 0.075], [0.044, 0.085]], { segs: 12 });
  g.mat('diffuser', '#fff1d0', p.lit ? { emissive: 3.5, lamp: true } : undefined); g.ball(0, 0.13, 0, 0.045, 0.05, 0.045, { segs: 10, rings: 6 });
  g.mat('cast', p.c || '#b08a45', { rough: -0.2 }); g.lathe(0, 0, [[0.046, 0.17], [0.03, 0.19], [0.012, 0.2]], { segs: 10 });
  const arc = []; for (let i = 0; i <= 8; i++) { const t = Math.PI * i / 8; arc.push([Math.cos(t) * 0.045, 0.2 + Math.sin(t) * 0.06, 0]); } g.tube(arc, 0.004, { segs: 4 });
  g.mat('paper', '#efe6d2'); g.box(0.04, 0.05, -0.001, 0.075, 0.09, 0.001);
  return { tier: 'd', cast: false };
});

// The lamp mender's window: a glazed front, a bench along the glass, hand lamps in every state on the back shelves.
function menderWindow(s, sd, a0, a1, clipSt) {
  const g = s.g, st = sd.st, D = 2.1, ih = 3.0;
  shopfront(s, { side: sd.out > 0 ? 'e' : 'w', a0, a1, c: sd.c, y: 0, h: ih,
    fascia: { text: 'Lamps Mended', sub: 'hand lamps · fittings · ready for the Flight', emblem: 'lamp', palette: ['#2b3566', '#f3e6c8', '#e9c46a'] },
    palette: { frame: '#2b3566', plinth: '#1e2647', awning: ['#e9c46a', '#2b3566'] }, awning: { depth: 0.8 },
    door: { at: a1 - a0 - 1.15, w: 1.0, kind: 'hinge', auto: false, locked: true, lockedText: 'Out on a call', style: 'glazed', label: 'the workshop' } });
  // the frieze above the fascia up to the street ceiling
  g.mat('paint', '#2b3566'); sd.box(g, a0, a1, -0.004, 0.1, ih, H, { faces: 'fy' }); s.flush({ tier: 's' });
  // the room behind: planked floor, walls, ceiling
  g.mat('planks', '#8a6240'); sd.box(g, a0, a1, 0.06, D, -0.02, 0, { faces: 'Y' });
  g.mat('paint', '#e9dcc0'); sd.box(g, a0, a1, 0.06, D, ih, ih + 0.02, { faces: 'y' });
  g.mat('plaster', '#d9c7a0'); sd.box(g, a0, a1, D, D + 0.1, 0, ih, { faces: 'f' });
  g.mat('plaster', '#cdb98f'); sd.box(g, a0 - 0.1, a0, 0.06, D, 0, ih, { faces: 'A' }); sd.box(g, a1, a1 + 0.1, 0.06, D, 0, ih, { faces: 'a' });
  s.flush({ tier: 's' });
  sd.solid(s, a0, a1, 0.06, D + 0.1, -0.5, 0); sd.solid(s, a0, a1, D, D + 0.1, 0, ih);
  // pegboard and shelves on the back wall
  g.mat('wood', '#c9a26a'); sd.box(g, a0 + 0.3, a1 - 1.4, D - 0.03, D, 1.05, 2.3, { faces: 'f' });
  g.mat('cast', '#3a3632'); for (let i = 0; i < 7; i++) { const a = a0 + 0.5 + i * 0.4; if (a > a1 - 1.5) break; sd.box(g, a - 0.01, a + 0.01, D - 0.1, D - 0.03, 1.3 + (i % 3) * 0.3, 1.32 + (i % 3) * 0.3, { faces: 'fyY' }); sd.box(g, a - 0.03, a + 0.03, D - 0.1, D - 0.06, 1.15 + (i % 3) * 0.3, 1.32 + (i % 3) * 0.3, { faces: 'faA' }); }
  g.mat('wood', '#6b4a2f');
  for (const y of [0.9, 1.45, 2.0, 2.55]) sd.box(g, a1 - 1.35, a1 - 0.1, D - 0.32, D, y, y + 0.03, { bevel: 0.005 });
  sd.box(g, a1 - 1.38, a1 - 1.35, D - 0.32, D, 0, 2.6); sd.box(g, a1 - 0.1, a1 - 0.07, D - 0.32, D, 0, 2.6);
  // the bench along the glass
  g.mat('wood', '#8a5634'); sd.box(g, a0 + 0.1, a1 - 1.3, 0.18, 0.8, 0.86, 0.92, { bevel: 0.012 });
  g.mat('paint', '#3a4a45'); sd.box(g, a0 + 0.14, a1 - 1.34, 0.22, 0.76, 0.0, 0.86, { faces: 'fbaAY' });
  for (const k of [0.2, 0.45, 0.7]) { g.mat('wood', '#b08d5e'); sd.box(g, a0 + 0.2, a0 + 0.95, 0.24, 0.32, k, k + 0.2, { faces: 'f' }); g.mat('cast', '#c8a45a'); sd.box(g, a0 + 0.52, a0 + 0.63, 0.23, 0.24, k + 0.08, k + 0.11, { faces: 'f' }); }
  s.flush({ tier: 's', cast: true });
  sd.solid(s, a0 + 0.1, a1 - 1.3, 0.18, 0.8, 0, 0.92);
  // on the bench: a lamp in pieces, a tray of parts, a lidded cup, the magnifier lamp on its arm
  const r = (a, d, y) => sd.pt(a, y, d);
  prop(s, 'streets.handlamp', ...r(a0 + 0.6, 0.45, 0.92), 0.4, { c: '#8a2f3c' });
  prop(s, 'streets.handlamp', ...r(a0 + 1.35, 0.5, 0.92), 1.2, { c: '#b08a45', lit: true });
  g.mat('cast', '#9c978d'); sd.box(g, a0 + 0.85, a0 + 1.15, 0.36, 0.56, 0.92, 0.94, { bevel: 0.005 });
  g.mat('cast', '#c8a45a'); for (let i = 0; i < 9; i++) { const q = r(a0 + 0.88 + (i % 3) * 0.1, 0.4 + Math.floor(i / 3) * 0.06, 0.95); g.ball(q[0], q[1], q[2], 0.012, 0.008, 0.012, { segs: 6, rings: 3 }); }
  g.mat('glaze', '#2f6f73'); { const q = r(a0 + 2.0, 0.62, 0.92); g.lathe(q[0], q[2], [[0, 0], [0.03, 0], [0.04, 0.09], [0.043, 0.095], [0.014, 0.11], [0, 0.112]].map((v) => [v[0], v[1] + 0.92]), { segs: 12 }); }
  g.mat('cast', '#2b2a27'); { const b = r(a0 + 1.9, 0.72, 0.92), m = r(a0 + 1.75, 0.55, 1.42), t = r(a0 + 1.45, 0.42, 1.3); g.cyl(b[0], 0.92, b[2], 0.07, 0.03, { segs: 10 }); g.tube([[b[0], 0.95, b[2]], m, t], 0.012, { segs: 5 }); g.mat('glaze', '#2f5146'); g.lathe(t[0], t[2], [[0.09, 1.22], [0.07, 1.26], [0.03, 1.31]], { segs: 12, capBottom: false }); }
  s.flush({ tier: 'd', cast: true });
  prop(s, 'stool', ...r(a0 + 1.2, 1.2, 0), 0.3, { wood: '#6b4a2f' }, { noSpots: true });
  // the shelves of lamps waiting, each with a tag; some mended and glowing
  const cols = ['#b08a45', '#8a2f3c', '#2f6f73', '#33407a', '#c9962e', '#5f8a3a'];
  let k = 0;
  for (const y of [0.93, 1.48, 2.03, 2.58]) for (let i = 0; i < 4; i++) { const a = a1 - 1.25 + i * 0.3; prop(s, 'streets.handlamp', ...r(a, D - 0.16, y), (k * 1.3) % 6.28, { c: cols[k % cols.length], lit: k % 3 === 0 }); k++; }
  // mended lamps hung on a rail behind the glass, lit, waiting to be collected
  g.mat('cast', '#2b2a27'); st.tube(g, [[a0 + 0.25, 2.3, sd.v(0.3)], [a1 - 1.3, 2.3, sd.v(0.3)]], 0.012, { segs: 5 });
  for (const a of [a0 + 0.25, a1 - 1.3]) st.box(g, a - 0.01, sd.v(0.29), a + 0.01, sd.v(0.31), 2.3, ih);
  s.flush({ tier: 'd', cast: false });
  for (let i = 0; i < 6; i++) { const a = a0 + 0.45 + i * (a1 - a0 - 1.95) / 5; prop(s, 'streets.handlamp', ...r(a, 0.3, 2.04 - (i % 2) * 0.05), i * 0.9, { c: cols[(i + 2) % cols.length], lit: true }); }
  // light: a warm lamp in the room, the magnifier over the work
  const clip = st.bx(a0 - 0.05, sd.v(-0.3), a1 + 0.05, sd.v(D + 0.1), -0.2, ih + 0.1);
  lamp(s, 'globe', ...r((a0 + a1) / 2 + 0.6, 1.2, 2.25), { clip, K: 2700, power: 1.2, drop: 0.7 });
  lamp(s, 'bulb', ...r(a0 + 1.45, 0.42, 1.2), { clip, K: 3600, power: 0.5, range: 2.5 });
  s.ambient({ box: clip, sky: '#ffe2b8', ground: '#b88c64', power: 0.35, lamp: true, soft: 0.3 });
  sign(s, { kind: 'label', text: 'MENDED · COLLECT', lines: ['tags in the tin'] }, ...r(a1 - 0.72, D - 0.335, 2.37), { face: sd.face, w: 0.5, h: 0.14 });
  sign(s, { kind: 'notice', hand: true, title: 'Out on a call', lines: ['Lamps in the box by the', 'door with a tag on. Name,', 'and what it does wrong.'] }, ...sd.pt(a1 - 0.65, 1.4, -0.02), { face: sd.face, w: 0.24, h: 0.32, board: false });
  const ip = sd.pt((a0 + a1) / 2 - 0.5, 1.4, -0.4);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.8, prompt: 'Look into the mender\'s window', wide: true,
    onUse(game) { read(game, 'Lamps Mended', [
      'Hand lamps in every state: whole, opened up, in a tray of their own screws. The Flight is on the night of Booking Day and the shelves are full.',
      'Every lamp has a paper tag with a name and a fault. "Flickers spinward." "Dropped on the Third. Bounced." "Grandad\'s. Do not improve it."',
      'On the bench a lamp lies open under the magnifier, its glass beside it on a folded cloth, like a patient.',
    ]); } });
  s.spot('stand', ...sd.pt((a0 + a1) / 2 - 0.6, 0, -0.75), sd.yaw + Math.PI, { tags: ['window', 'street'] });
  s.spot('stand', ...sd.pt((a0 + a1) / 2 + 0.3, 0, -0.85), sd.yaw + Math.PI, { tags: ['window', 'street'] });
  void clipSt;
}

// The dyers' drying room: a glazed front on lengths of this week's colours hung from rails, lit warm from above.
function dryingRoom(s, sd, a0, a1) {
  const g = s.g, st = sd.st, D = 2.1, ih = 3.0;
  shopfront(s, { side: sd.out > 0 ? 'e' : 'w', a0, a1, c: sd.c, y: 0, h: ih, plinth: 0.35,
    fascia: { text: 'The Drying Room', sub: 'Fast Colour · keep the door shut', emblem: 'thread', palette: ['#5b3a6e', '#f3e6c8', '#e0b04a'] },
    palette: { frame: '#5b3a6e', plinth: '#3d2749' }, awning: false,
    door: { at: 0.25, w: 1.0, kind: 'slide', auto: false, locked: true, lockedText: 'Keep the door shut: cloth drying', style: 'glazed' } });
  g.mat('paint', '#5b3a6e'); sd.box(g, a0, a1, -0.004, 0.1, ih, H, { faces: 'fy' }); s.flush({ tier: 's' });
  g.mat('tile', '#d8d2c2'); sd.box(g, a0, a1, 0.06, D, -0.02, 0, { faces: 'Y' });
  g.mat('paint', '#efe6d2'); sd.box(g, a0, a1, 0.06, D, ih, ih + 0.02, { faces: 'y' });
  g.mat('tile', '#e8e2d2'); sd.box(g, a0, a1, D, D + 0.1, 0, ih, { faces: 'f' });
  g.mat('tile', '#c9c2b0'); sd.box(g, a0 - 0.1, a0, 0.06, D, 0, ih, { faces: 'A' }); sd.box(g, a1, a1 + 0.1, 0.06, D, 0, ih, { faces: 'a' });
  // a drain channel and the rails
  g.mat('cast', '#3a3632'); sd.box(g, a0 + 0.1, a1 - 0.1, D - 0.3, D - 0.2, 0, 0.003, { faces: 'Y' });
  g.mat('brushed', '#9c978d'); for (const d of [0.75, 1.3, 1.8]) st.tube(g, [[a0 + 0.05, 2.65, sd.v(d)], [a1 - 0.05, 2.65, sd.v(d)]], 0.016, { segs: 6 });
  s.flush({ tier: 's' });
  sd.solid(s, a0, a1, 0.06, D + 0.1, -0.5, 0); sd.solid(s, a0, a1, D, D + 0.1, 0, ih);
  // the cloth: long lengths folded over the rails, both halves hanging
  let k = 0;
  for (const d of [0.75, 1.3, 1.8]) {
    let a = a0 + 0.2 + (k % 2) * 0.25;
    while (a < a1 - 0.9) {
      const w = 0.55 + ((k * 7) % 5) * 0.08, drop = 1.5 + ((k * 3) % 4) * 0.2, c = CLOTH[(k * 3) % CLOTH.length];
      g.mat(k % 4 === 2 ? 'motif' : 'weave', c, { sway: 0.25 });
      for (const sgn of [-1, 1]) g.sheet(sd.pt(a, 2.66, d), sd.pt(a + w, 2.66, d), sd.pt(a + w, 2.66 - drop + (sgn > 0 ? 0.15 : 0), d + sgn * 0.05), sd.pt(a, 2.66 - drop + (sgn > 0 ? 0.15 : 0), d + sgn * 0.05), { nu: 3, nv: 4, ripple: 0.03, rippleN: 3 });
      s.flush({ tier: 'd', cast: true });
      a += w + 0.12; k++;
    }
  }
  // a basket of folded lengths and a lidded vat by the door
  g.mat('cane', '#b8935a'); sd.box(g, a0 + 0.3, a0 + 0.9, 0.3, 0.7, 0, 0.35, { faces: 'fbaAY' });
  for (let i = 0; i < 4; i++) { g.mat('weave', CLOTH[(i * 2 + 1) % CLOTH.length]); sd.box(g, a0 + 0.34, a0 + 0.86, 0.34, 0.66, 0.35 + i * 0.05, 0.4 + i * 0.05, { bevel: 0.015 }); }
  g.mat('glaze', '#2f4f6f'); { const q = sd.pt(a1 - 0.45, 0, 0.5); g.lathe(q[0], q[2], [[0, 0], [0.26, 0], [0.3, 0.1], [0.3, 0.62], [0.32, 0.66], [0.2, 0.7], [0.05, 0.74], [0, 0.75]], { segs: 18 }); s.post(q[0], q[2], 0.3, 0, 0.75); }
  s.flush({ tier: 'd', cast: true });
  const clip = st.bx(a0 - 0.05, sd.v(-0.3), a1 + 0.05, sd.v(D + 0.1), -0.2, ih + 0.1);
  lamp(s, 'strip', ...sd.pt(a0 + 0.4, ih - 0.02, 1.05), { to: sd.pt(a1 - 0.4, ih - 0.02, 1.05), clip, K: 3300, power: 1.4 });
  s.ambient({ box: clip, sky: '#fff0d8', ground: '#c9b89a', power: 0.4, lamp: true, soft: 0.3 });
  const ip = sd.pt((a0 + a1) / 2 + 0.4, 1.5, -0.4);
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.8, prompt: 'Look at the cloth drying', wide: true,
    onUse(game) { read(game, 'The Drying Room', [
      "This week's colours, hung to dry over the rails: Bruise, Dawn Rose, Far-Bank Gold, Flight Indigo, Chervil Green, Lid Copper.",
      'A coat re-dyed for the festival costs about a tenth of a kay. The cloth itself has been other coats before.',
    ]); } });
  s.spot('stand', ...sd.pt((a0 + a1) / 2 + 0.6, 0, -0.75), sd.yaw + Math.PI, { tags: ['window', 'street'] });
}

export const place = {
  id: 'thread-street', name: 'Thread Street', order: 71,
  build(game) {
    const W = game.world, f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('thread-street', f);
    const st = street('z', 3, H);
    const Wd = side(st, -3, 1), E = side(st, 3, -1);
    const clip = [-3.5, -0.3, 19.5, 3.5, H + 0.3, 104.5];
    const nb = PLACES.neighbours || [];
    const sy = nb.find((q) => q.name === 'Saffron Yard');
    const doorsW = [], doorsE = [];
    const keep = (arr, o) => { for (const d of o.doors) arr.push(d); };

    // ---------------- the shell, with cloth drying overhead instead of baffles ----------------
    const plain = { '-1': [[61, 65], [70, 77.5], [83, 103.6]], '1': [[57, 103.6]] };
    const corbel = (a, sg) => plain[String(sg)].some((r) => a >= r[0] - 0.2 && a <= r[1] + 0.2);
    const lines = shell(s, st, 20, 104, { n: 14, clip, festive: true, bunting: false, cloth: true, endBeam: false, seed: 1, runner: 0.7, runnerTint: '#3f6a78', band: '#b5653a', corbel });
    streetGlow(s, st, 20, 104, { power: 0.12 });

    // ---------------- the stretch by the court: the side walls of the book room and the studio ----------------
    bench(s, -2.55, 24.2, Math.PI / 2, { tags: ['street', 'thread-street'] });
    streetPlanter(s, -2.68, 27.6, 0.45, 1.6, 'fern'); streetPlanter(s, 2.68, 22.6, 0.45, 1.4, 'flower');
    prop(s, 'streets.bicycle', 2.6, 0, 26.0, -Math.PI / 2, { c: '#8a2f3c', basket: '#e0b04a' });
    prop(s, 'streets.bicycle', 2.62, 0, 28.1, Math.PI / 2, { c: '#33407a' });
    sign(s, SIGNS['thread-street.street'], ...st.pt(20.6, 2.4, -2.95), { face: 'X', w: 0.9, h: 0.2 });
    sign(s, SIGNS['deck16.plate'], ...st.pt(20.6, 1.85, -2.95), { face: 'X', w: 0.36, h: 0.16 });
    sign(s, SIGNS['thread-street.street'], ...st.pt(102.8, 2.35, 2.99 - 0.05), { face: 'x', w: 0.9, h: 0.2 });

    // ---------------- west side, from the chair remaker to the arch ----------------
    pilaster(s, Wd, 61, H);
    keep(doorsW, unit(s, Wd, 61, 65, { fin: 3, name: 'Jory', num: 'letters and books', clip,
      knock: (g2) => { const h = g2.clock ? g2.clock.hours : 12; return h > 9 && h < 21 ? 'Nobody answers: Jory will be at the letter room. Through the letter slot, books in piles, each pile with a tape measure on it.' : 'Through the door, somebody reading aloud to nobody, to practise. Then: "Come back tomorrow, I\'m mid-letter."'; } }));
    pilaster(s, Wd, 65, H);
    menderWindow(s, Wd, 65.15, 69.85, clip);
    pilaster(s, Wd, 70, H);
    keep(doorsW, unit(s, Wd, 70, 74, { fin: 7, name: 'Castellane', num: 'Priya · Lumi', clip,
      knock: () => 'A child\'s voice: "Mum\'s at the vats." A pause. "Have you eaten?"' }));
    pilaster(s, Wd, 74, H);
    keep(doorsW, unit(s, Wd, 74, 77.5, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks 17 to 21', clip, prompt: 'Try the stair door', knock: 'Locked. A note on the glass: "Lift for prams, stair for legs. Core B is just up the street."' }));
    pilaster(s, Wd, 77.5, H);
    dryingRoom(s, Wd, 77.65, 82.85);
    pilaster(s, Wd, 83, H);
    keep(doorsW, unit(s, Wd, 83, 87, { fin: 5, name: 'Petrova', num: '16 · 83', clip }));
    pilaster(s, Wd, 87, H);
    keep(doorsW, unit(s, Wd, 87, 91, { fin: 8, name: 'Amari', num: '16 · 87', clip }));
    pilaster(s, Wd, 91, H);
    frontWall(s, Wd, 91, 96, H, [], FIN[6]);
    letterFlaps(s, Wd, 91.15, 93.75, { plate: { kind: 'plate', text: 'LETTERS', lines: ['Thread Street · 57 to 104'] }, who: 'Letter flaps',
      lines: ['Castellane. Jory, in a careful hand, with "and Marit, soon" added in pencil and rubbed out.', 'Petrova. Amari. Holt. Nakashima. A flap marked "Lamps Mended: tags only, not lamps".'] });
    noticeboard(s, Wd, 94.0, 95.85, 0.92, 2.08, [
      { spec: { kind: 'notice', title: 'Dye swap', lines: ['Bring a coat, take a colour.', 'Bruise and Dawn Rose are', 'nearly gone. Ask Priya', 'at Fast Colour.'] }, a: 94.35, y: 1.65, w: 0.3, h: 0.42 },
      { spec: { kind: 'notice', hand: true, title: 'Lost', lines: ['One knitting needle,', 'bamboo, on Ladle Row.', 'The other one misses it.'] }, a: 94.78, y: 1.3, w: 0.28, h: 0.38 },
      { spec: { kind: 'notice', title: 'Quiet hours', lines: ['Thread Street asks for no', 'sewing machines after ten.', 'Hand sewing is fine.', 'It is very quiet.'] }, a: 95.2, y: 1.7, w: 0.28, h: 0.38 },
      { spec: SIGNS['poster.homecoming'], a: 95.55, y: 1.3, w: 0.26, h: 0.38 },
    ], { title: 'THREAD STREET', who: 'Noticeboard' });
    pilaster(s, Wd, 96, H);
    keep(doorsW, unit(s, Wd, 96, 100, { fin: 1, name: 'Holt', num: '16 · 96', clip }));
    pilaster(s, Wd, 100, H);
    keep(doorsW, unit(s, Wd, 100, 103.55, { fin: 6, name: 'Nakashima', num: '16 · 100', clip }));

    // ---------------- east side, from the lift lobby to the arch ----------------
    const runE = [
      [57, 61, { fin: 8, name: 'Oyelaran', num: '16 · 57' }],
      [61, 65.5, { fin: 2, name: 'Silva', num: '16 · 61' }],
      [65.5, 68.5, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks 17 to 21', prompt: 'Try the stair door', knock: 'Locked. Through the glass, on every landing, a pot of something green under a lamp.' }],
      [68.5, 73, { fin: 0, name: 'Moreau', num: '16 · 68' }],
      [73, 77, { fin: 5, name: 'Kowal', num: '16 · 73' }],
      [77, 81, { fin: 6, name: 'Abara', num: '16 · 77' }],
      [81, 86, { fin: 7, name: 'Lund', num: '16 · 81', win2: 3.6, door: 1.25, win: false }],
      [86, 90, { fin: 1, name: 'Quiroga', num: '16 · 86' }],
      [90, 95, { fin: 3, name: 'Bakshi', num: '16 · 90' }],
      [95, 99, { fin: 0, name: 'Okoro', num: '16 · 95' }],
      [99, 103.55, { fin: 2, name: 'Wynn', num: '16 · 99' }],
    ];
    for (const u of runE) { pilaster(s, E, u[0], H); keep(doorsE, unit(s, E, u[0], u[1], Object.assign({ clip }, u[2]))); }

    // ---------------- furniture ----------------
    bench(s, 2.55, 63.4, -Math.PI / 2, { tags: ['street', 'thread-street'], w: 1.4 });
    bench(s, -2.55, 89.5, Math.PI / 2, { tags: ['street', 'thread-street'], w: 1.4 });
    bench(s, 2.55, 85.0, -Math.PI / 2, { tags: ['street', 'thread-street'], w: 1.4, knitting: '#5b3a6e' });
    chalk(s, st, 70.3, -1.0, {});
    streetPlanter(s, 2.68, 89.2, 0.42, 1.2, 'flower'); streetPlanter(s, -2.68, 102.6, 0.42, 1.2, 'herbs');
    prop(s, 'streets.bicycle', 2.6, 0, 92.8, -Math.PI / 2, { c: '#5f8a3a', basket: '#d4878a' });
    prop(s, 'streets.bicycle', -2.6, 0, 86.0, Math.PI / 2, { c: '#c9962e' });
    prop(s, 'streets.handcart', -2.42, 0, 29.9, Math.PI / 2, { c: '#5b3a6e', load: 'cloth' });
    signBoard(s, st, 20 + 6, 1.4,
      [P('WICK COURT', 'toward the front · the hall'), P('LADLE ROW', 'through the court · the baths'), SIGNS['pointer.lindenhall']],
      [P('CORE B · CABS', 'back · to the Hollow'), P('THE MENDERS', 'back · Thread Street'), SIGNS['pointer.saffron']]);
    signBoard(s, st, 20 + 6 * 12, -1.4,
      [P('CORE B · CABS', 'toward the front · the Hollow'), P('WICK COURT', 'toward the front'), P('THE SCHOOL', 'by Ladle Row, spinward')],
      [SIGNS['pointer.saffron']]);

    // ---------------- the far end: the arch into Saffron Yard, and the street running on ----------------
    thresholdArch(s, st, 104, 1, 'SAFFRON YARD', sy ? sy.note : 'decks 16 to 22', 'CANDLEWICK', [-3.5, -0.3, 98, 3.5, H + 0.3, 110]);
    if (!game.city) runOn(s, st, { a0: 104, a1: 144, dir: 1, clip: [-3.5, -0.3, 103.6, 3.5, H + 0.3, 144.2], name: 'Saffron Yard', seed: 2,
      lobbySub: 'lifts · stairs · decks 16 to 22',
      lobbyPlate: { kind: 'plate', text: 'SAFFRON YARD CORE', lines: ['cabs · decks 16 to 22'] },
      cabText: 'A Saffron Yard cab hums in its berth. Candlewick is back up the street, under the arch.' });

    // ---------------- people ----------------
    const vS = 1.6;
    const far = game.city ? 104 : 144;        // with the city, Saffron Yard is a real block that begins at the arch
    const mid = stations(20, far, 3, lines);
    rowPath(s, st, 0, mid);
    rowPath(s, st, -vS, stations(21, far - 2.5, 3, lines.concat(doorsW)));
    rowPath(s, st, vS, stations(21, far - 2.5, 3, lines.concat(doorsE)));
    for (const a of lines) s.path([st.xz(a, -vS), st.xz(a, 0), st.xz(a, vS)]);
    for (const a of doorsW) s.path([st.xz(a, -2.4), st.xz(a, -vS)], { width: 1.0 });
    for (const a of doorsE) s.path([st.xz(a, 2.4), st.xz(a, vS)], { width: 1.0 });
    const group = (x, z, n, r) => { for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + 0.3; const px = x + Math.cos(t) * r, pz = z + Math.sin(t) * r; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags: ['street', 'thread-street'] }); } };
    group(0.8, 33.5, 3, 0.6); group(-0.9, 58.8, 3, 0.6); group(1.0, 75.6, 2, 0.55); group(-0.6, 96.6, 4, 0.7);

    // ---------------- zones, sound, discoveries ----------------
    s.zoneBox({ id: 'thread-street', place: 'thread-street', box: [-3, -0.5, 20, 3, H, 104], name: 'Thread Street', sub: 'Candlewick · deck 16 · runs along the axis', ambience: 'arcade', reverb: 'felt' });
    if (!game.city) s.zoneBox({ id: 'saffron-street', box: [-3, -0.5, 104, 3, H, 147.6], name: 'Saffron Yard', sub: 'the next block · Thread Street runs on', ambience: 'arcade', reverb: 'felt' });
    W.dynamics.push({ scope: s, t: 0, update(dt) {
      const p = game.player; if (!p || p.frame !== f || Math.abs(p.pos.x) > 3 || p.pos.z < 20 || p.pos.z > 144) { this.t = 0; return; }
      if (Math.abs(p.vel.z) > 4.2) { this.t += dt; if (this.t > 1.6) { found(game, 'axis-street'); this.t = -1e9; } } else if (this.t > 0) this.t = 0;
    } });

    s.finish();
    stitch(s, st, [20, 104], [1.5, 4.8]);
    let stitched = false;
    game.events.on('update', () => { if (stitched) return; stitched = true; stitch(s, st, [20, 104], [1.5, 4.8]); });

    game.spawns['thread-street'] = { frame: f, x: 0.6, y: 0, z: 22, yaw: Math.PI };
    game.spawns['thread-far'] = { frame: f, x: 0, y: 0, z: 100, yaw: 0 };
  },
};
