// The choir room: every block has a choir, and Candlewick's rehearses here, off Ladle Row. A room hung deep in felt in
// strong colours (bare rooms ring in heliox; good rooms hang felt), three tiers of benches in a curve round the
// conductor's stand, racks of long heliox flutes, a few plucked instruments and hand drums, shelves of part books, and
// the festival programme: on Booking night they sing in the Long Flight.
import { lamp } from '../world/kit.js';
import { room, shopfront } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { SIGNS } from '../content/signs.js';
import { candlewick, say, choose, found, meet, sfx, seat, rngFor, fy, shade } from './civic_parts.js';

const X0 = -50, X1 = -39, Z0 = -13.5, Z1 = -4, H = 3.2;
const C = [-44.5, -4.9];                         // the centre the tiers curve round (the conductor stands just behind it)
const A = 50 * Math.PI / 180;                    // the tiers' half-angle
const TIERS = [[2.9, 3.9, 0.22], [3.9, 4.85, 0.44], [4.85, 5.8, 0.66]];     // inner radius, outer radius, top
const FELT = ['#8a1f2e', '#2a2f6b', '#d9962a', '#1f6a6a', '#5a2a52', '#b8442e'];
const PAL = { felt: '#7a1c2a', honey: '#a8743f', floor: '#5a3a24', brass: '#c8a45a', ink: '#1d1b2a', cream: '#f1e6cf', gold: '#e8b04a' };

const PROGRAMME = { kind: 'board', title: 'Festival programme', lines: ['Thursday 19:30|Wick Court', 'The Quiet|old songs, slowly', 'Booking Day 12:45|a round before the feast', 'Booking night 22:00|the Long Flight', 'Meet at|the sleeve hire', 'Hand lamps|lit, please'], palette: ['#2a2f6b', '#f1e6cf', '#e8b04a'] };
const PARTS = { kind: 'notice', title: 'Parts', lines: ['Highs: left of Connie', 'Middles: the middle', 'Lows: right, and loud', 'Nobody is too old.', 'Nobody is too flat.'], hand: true };

const AISLE = (2 * A - 0.06) / 18;              // half the width of the aisle, as an angle
const P = (r, a) => [C[0] + r * Math.sin(a), C[1] - r * Math.cos(a)];

export const place = {
  id: 'choir-room', name: 'The choir room', order: 59,
  build(game) {
    const f = candlewick(game), s = game.world.scope('choir-room', f), g = s.g;
    const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H, floor: ['planks', PAL.floor], ceil: ['felt', '#3a2430'],
      wall: { mat: 'felt', tint: PAL.felt, dado: { h: 0.9, mat: 'wood', tint: '#4a2e1e' }, skirt: '#2a1c14' }, open: { s: false }, glow: { sky: '#ffcf9a', ground: '#7a4a2a', power: 0.18 } });

    // ---------------- the front ----------------
    shopfront(s, { side: 's', a0: X0, a1: X1, c: Z1, y: 0, h: H, door: { at: 8.6, w: 1.1, kind: 'hinge', style: 'glazed', tint: '#2a2f6b' },
      fascia: { kind: 'fascia', text: 'The Candlewick Choir', sub: 'every block has one · come and sing', emblem: 'flute', palette: ['#2a2f6b', '#f1e6cf', '#e8b04a'] },
      palette: { frame: '#2a2f6b', plinth: '#5a2a52', awning: ['#d9962a', '#8a1f2e'] }, awning: { depth: 1.0 }, plinth: 0.55, glow: 0.6 });
    if (SIGNS['poster.choir']) sign(s, SIGNS['poster.choir'], -49.3, 1.5, Z1 - 0.06, { face: 'Z', w: 0.56, h: 0.8 });

    // ---------------- felt hangings: bands of strong colour on every wall, baffles under the ceiling ----------------
    const rr = rngFor('choir-felt');
    s.deco(() => {
      // tall felt panels, each a slightly different length, sagging a little
      const panel = (ax, az, bx, bz, y0, y1, col) => { g.mat('felt', col, { sway: 0.05 }); g.sheet([ax, y1, az], [bx, y1, bz], [bx, y0, bz], [ax, y0, az], { sag: 0.01, ripple: 0.025, nu: 6, nv: 3 }); };
      let i = 0;
      for (let z = Z0 + 0.4; z < Z1 - 1.2; z += 1.25) { panel(X0 + 0.19, z + 1.1, X0 + 0.19, z, 0.95 + rr.f(0, 0.12), H - 0.12, FELT[i++ % FELT.length]); }
      for (let z = Z0 + 0.4; z < Z1 - 1.2; z += 1.25) { panel(X1 - 0.19, z, X1 - 0.19, z + 1.1, 0.95 + rr.f(0, 0.12), H - 0.12, FELT[i++ % FELT.length]); }
      for (let x = X0 + 0.45; x < X1 - 1.0; x += 1.25) { panel(x, Z0 + 0.19, x + 1.1, Z0 + 0.19, 0.95 + rr.f(0, 0.12), H - 0.12, FELT[i++ % FELT.length]); }
      // brass rods the panels hang from
      g.mat('cast', PAL.brass); g.tube([[X0 + 0.22, H - 0.1, Z0 + 0.3], [X0 + 0.22, H - 0.1, Z1 - 0.8]], 0.012, { segs: 6 }); g.tube([[X1 - 0.22, H - 0.1, Z0 + 0.3], [X1 - 0.22, H - 0.1, Z1 - 0.8]], 0.012, { segs: 6 }); g.tube([[X0 + 0.3, H - 0.1, Z0 + 0.22], [X1 - 0.3, H - 0.1, Z0 + 0.22]], 0.012, { segs: 6 });
    });
    s.deco(() => {
      // ceiling baffles: felt sheets hung flat on cords, in rows across the room
      for (let k = 0; k < 5; k++) {
        const z = Z0 + 1.2 + k * 1.75, y = H - 0.38 - (k % 2) * 0.1, col = FELT[(k * 2 + 1) % FELT.length];
        g.mat('felt', col, { sway: 0.1 }); g.sheet([X0 + 0.8, y, z - 0.45], [X1 - 0.8, y, z - 0.45], [X1 - 0.8, y, z + 0.45], [X0 + 0.8, y, z + 0.45], { sag: 0.06, nu: 8, nv: 2 });
        g.mat('weave', '#d8cdb8'); for (const x of [X0 + 1.0, X1 - 1.0]) for (const dz of [-0.4, 0.4]) g.tube([[x, y, z + dz], [x, H, z + dz]], 0.004, { segs: 3, caps: false });
      }
    });

    // ---------------- the tiers: three curved steps of honey wood, benches along each ----------------
    const SEG = 12;
    s.structure(() => {
      for (const T of TIERS) {
        for (let k = 0; k < SEG; k++) {
          const a0 = -A + 2 * A * k / SEG, a1 = -A + 2 * A * (k + 1) / SEG;
          const poly = [P(T[0], a0), P(T[0], a1), P(T[1], a1), P(T[1], a0)];
          g.mat('wood', shade(PAL.honey, 0.92 + (k % 3) * 0.05), { rough: -0.05 }); prismPos(g, poly, 0, T[2]);
        }
        // a dark nosing along each step's front edge
        g.mat('wood', '#3a2418'); const nose = []; for (let k = 0; k <= SEG * 2; k++) { const a = -A + 2 * A * k / (SEG * 2); const p = P(T[0] + 0.02, a); nose.push([p[0], T[2] - 0.012, p[1]]); } g.tube(nose, 0.02, { segs: 5 });
      }
    });
    const benchR = (T) => T[1] - 0.25;
    s.furniture(() => {
      for (const T of TIERS) {
        const rb = benchR(T), n = 9;
        for (let k = 0; k < n; k++) {
          if (k === (n - 1) / 2) continue;           // the aisle up the middle
          const a0 = -A + 0.03 + (2 * A - 0.06) * k / n, a1 = -A + 0.03 + (2 * A - 0.06) * (k + 1) / n, am = (a0 + a1) / 2, L = 2 * rb * Math.sin((a1 - a0) / 2) - 0.03;
          const p = P(rb, am);
          g.at(p[0], T[2], p[1], -am);
          g.mat('wood', '#6a4529', { rough: -0.05 }); g.box(-L / 2, 0.41, -0.17, L / 2, 0.45, 0.17, { bevel: 0.01 });
          g.box(-L / 2 + 0.04, 0, -0.14, -L / 2 + 0.1, 0.41, 0.14, { bevel: 0.006 }); g.box(L / 2 - 0.1, 0, -0.14, L / 2 - 0.04, 0.41, 0.14, { bevel: 0.006 });
          g.mat('felt', FELT[(k + T[2] * 10) % FELT.length | 0]); g.box(-L / 2 + 0.02, 0.45, -0.15, L / 2 - 0.02, 0.48, 0.15, { bevel: 0.012 });
          g.pop();
        }
      }
    });
    // collision: the steps and benches, laid as runs of small boxes
    {
      const cell = 0.25;
      for (let z = Z0 + 0.2; z < Z1 - 0.2; z += cell) {
        let runX = null, runH = 0;
        const flushRun = (xEnd) => { if (runX !== null && runH > 0) s.solid(runX, 0, z, xEnd, runH, z + cell, { surf: 'wood' }); runX = null; runH = 0; };
        for (let x = X0 + 0.2; x < X1 - 0.2; x += cell) {
          const dx = x + cell / 2 - C[0], dz = C[1] - (z + cell / 2), r = Math.hypot(dx, dz), a = Math.atan2(dx, dz);
          let h = 0;
          if (Math.abs(a) <= A) for (const T of TIERS) if (r >= T[0] && r < T[1]) { h = T[2]; if (Math.abs(r - benchR(T)) < 0.17 && Math.abs(a) > AISLE) h = T[2] + 0.45; }
          if (h !== runH) { flushRun(x); if (h > 0) { runX = x; runH = h; } }
        }
        flushRun(X1 - 0.2);
      }
    }
    // the singers' places: they stand on each step in front of its bench, facing the stand; a few sit out on the benches
    const rp = rngFor('choir-spots');
    for (const T of TIERS) {
      const rs = T[0] + 0.32, n = Math.round(rs * 2 * A / 0.8);
      for (let k = 0; k < n; k++) {
        const a = -A + 0.1 + (2 * A - 0.2) * (k + 0.5) / n + rp.f(-0.02, 0.02), p = P(rs, a);
        s.spot('perform', p[0], T[2], p[1], -a, { tags: ['choir', 'sing', 'choir-room'] });
      }
      for (const a of [-A + 0.15, A - 0.15]) { const p = P(benchR(T), a); s.spot('sit', p[0], T[2] + 0.46, p[1], -a, { tags: ['choir', 'rest', 'choir-room'] }); }
    }

    // ---------------- the conductor's stand and the leader's place ----------------
    prop(s, 'civic.stand', C[0], 0, C[1] - 1.08, 0, { metal: '#2a2620', desk: '#6a4529', h: 1.18 });
    s.furniture(() => {
      // a low round podium
      g.mat('wood', '#4a2e1e'); g.cyl(C[0], 0, C[1] - 0.4, 0.55, 0.12, { segs: 24 });
      g.mat('felt', '#8a1f2e'); g.cyl(C[0], 0.12, C[1] - 0.4, 0.5, 0.01, { segs: 24 });
    });
    s.solid(C[0] - 0.5, 0, C[1] - 0.9, C[0] + 0.5, 0.12, C[1] + 0.1, { surf: 'felt' });
    s.spot('work', C[0], 0.12, C[1] - 0.4, Math.PI, { who: 'connie', tags: ['conduct', 'choir-room', 'focus'] });
    lamp(s, 'spot', C[0], H - 0.05, C[1] - 0.6, { K: 2900, power: 0.5, cone: [30, 14], range: 4, clip });
    s.interact({ x: C[0], y: 1.2, z: C[1] - 0.6, radius: 1.3, kind: 'talk', prompt: 'Talk to the choir leader', onUse(gm) { connieTalk(gm); } });

    // ---------------- the flute rack on the west wall, plucked instruments on hooks ----------------
    s.furniture(() => {
      g.mat('wood', '#6a4529'); g.box(X0 + 0.2, 0, -12.9, X0 + 0.5, 0.12, -10.3, { bevel: 0.01 }); g.box(X0 + 0.2, 1.35, -12.9, X0 + 0.42, 1.42, -10.3, { bevel: 0.01 });
      for (const z of [-12.9, -10.36]) g.box(X0 + 0.2, 0, z, X0 + 0.5, 1.45, z + 0.06, { bevel: 0.008 });
      const rf = rngFor('flutes');
      for (let i = 0; i < 11; i++) {
        const z = -12.7 + i * 0.22, len = rf.f(1.1, 1.28), r0 = rf.f(0.014, 0.019);
        g.mat('wood', ['#c9a46a', '#8a5a2e', '#e0c48a', '#6b4a2f'][i % 4], { rough: -0.2 }); g.tube([[X0 + 0.35, 0.12, z], [X0 + 0.33, 0.12 + len, z]], [r0, r0 * 0.8], { segs: 8 });
        g.mat('cast', PAL.brass); g.tube([[X0 + 0.35, 0.12 + len * 0.7, z], [X0 + 0.35, 0.12 + len * 0.72, z]], r0 + 0.003, { segs: 8 });
        g.mat('plain', '#1d1b18'); for (let h = 0; h < 6; h++) g.box(X0 + 0.355 + r0 * 0.6, 0.12 + len * (0.35 + h * 0.06), z - 0.004, X0 + 0.36 + r0 * 0.6, 0.12 + len * (0.35 + h * 0.06) + 0.008, z + 0.004);
      }
    });
    s.solid(X0 + 0.16, 0, -12.9, X0 + 0.55, 1.45, -10.3);
    sign(s, { kind: 'label', text: 'FLUTES · 1.2 m', sub: 'lent to members · tuned at the Long Pipe', ink: '#f1e6cf' }, X0 + 0.2, 1.62, -11.6, { face: 'X', w: 1.2, h: 0.13 });
    prop(s, 'civic.lute', X0 + 0.3, 1.75, -9.4, Math.PI / 2, { body: '#8a5a2e', face: '#d9b57a' }, { tier: 'd' });
    prop(s, 'civic.lute', X0 + 0.3, 1.6, -8.75, Math.PI / 2, { body: '#5a2a1e', face: '#e0c48a' }, { tier: 'd' });
    s.deco(() => { g.mat('cast', PAL.brass); for (const z of [-9.4, -8.75]) g.tube([[X0 + 0.18, 2.72, z], [X0 + 0.3, 2.68, z]], 0.01, { segs: 5 }); });
    s.interact({ x: X0 + 0.9, y: 1.0, z: -11.6, radius: 1.3, prompt: 'Lift down a flute', async onUse(gm) {
      sfx(gm, 'flute-note', f, X0 + 0.5, 1.2, -11.6);
      await say(gm, 'A choir flute', ['It is taller than it looks on the rack: it stands to your chin. In this air sound runs nearly twice as fast, so a pipe sings about ten semitones sharp for its length, and a flute has to be about 1.2 metres long to sing the old notes.', 'You blow one note. The felt takes it and gives nothing back. Someone on the tiers says, kindly, "Again, but meaner."']);
      found(gm, 'long-flute');
    } });

    // ---------------- the east wall: part books, hand drums, the programme ----------------
    prop(s, 'shelving', X1 - 0.36, 0, -11.8, -Math.PI / 2, { w: 2.2, h: 2.0, shelves: 5, wood: '#6a4529' });
    for (let k = 1; k < 5; k++) prop(s, 'civic.books', X1 - 0.36, 0.08 + k * (2.0 - 0.11) / 5 + 0.025, -11.8, -Math.PI / 2, { w: 2.1, seed: 50 + k, cols: ['#f1e6cf', '#e8dcc0', '#d9962a', '#2a2f6b', '#8a1f2e', '#efe4cc'] });
    sign(s, { kind: 'label', text: 'PART BOOKS', sub: 'take one · put it back in its voice', ink: '#f1e6cf' }, X1 - 0.2, 2.2, -11.8, { face: 'x', w: 1.2, h: 0.12 });
    sign(s, PARTS, X1 - 0.2, 1.55, -10.25, { face: 'x', w: 0.3, h: 0.42, board: false });
    for (const d of [[-41.4, -13.0, 'goblet', '#7a3b2e'], [-41.9, -12.9, 'goblet', '#a8743f'], [-42.5, -13.05, 'frame', '#9a6a3a']]) prop(s, 'civic.drum', d[0], 0, d[1], 0, { kind: d[2], body: d[3] });
    s.interact({ x: -41.8, y: 0.8, z: -12.4, radius: 1.0, prompt: 'Tap the hand drum', onUse(gm) { sfx(gm, 'drum-tap', f, -41.6, 0.5, -12.95); if (gm.ui) gm.ui.toast('A dry, quick sound. The felt eats the ring of it.', { kind: 'info' }); } });
    s.interact({ x: X1 - 1.0, y: 1.3, z: -11.8, radius: 1.2, prompt: 'Take down a part book', async onUse(gm) {
      sfx(gm, 'book', f, X1 - 0.4, 1.3, -11.8);
      await say(gm, 'A part book, middles', ['Hand-copied, much rubbed out. The first song is a round in four parts called The Far Bank, and the words are mostly the names of things you can see from the lawns.', 'Pencilled over one bar, in a teacher\'s hand: "Breathe here. Heliox does not care how long your lungs are."', 'On the inside cover, the last six singers who held this copy. One of them has drawn a small flute.']);
    } });
    sign(s, PROGRAMME, X1 - 0.18, 1.7, -6.0, { face: 'x', w: 1.4, h: 1.0, back: '#4a2e1e' });
    s.interact({ x: X1 - 1.0, y: 1.5, z: -6.0, radius: 1.3, prompt: 'Read the festival programme', async onUse(gm) {
      await say(gm, 'Festival programme', ['Thursday, 19:30: Wick Court. The Quiet: old songs, slowly. Booking Day, 12:45: a round before the feast, in the hall.', 'Booking night, 22:00: the Long Flight. Meet at the sleeve hire. Hand lamps lit, please.', 'Underneath, in chalk: "Sleeves are not for singing in. They are for flying in while singing."']);
    } });

    // ---------------- the back wall: a banner, a cabinet, cushions ----------------
    sign(s, { kind: 'banner', text: 'SING THE SPINDLE', palette: ['#2a2f6b', '#e8b04a'] }, -44.5, 2.2, Z0 + 0.24, { face: 'Z', w: 2.6, h: 0.5 });
    prop(s, 'civic.drawers', -46.6, 0, Z0 + 0.42, 0, { w: 1.2, h: 0.9, d: 0.4, rows: 3, cols: 3, wood: '#4a2e1e', pull: PAL.brass });
    s.detail(() => {
      // a heap of cushions in the corner, and lidded cups on the cabinet
      const rc = rngFor('choir-cushions');
      for (let i = 0; i < 7; i++) { g.mat('felt', FELT[i % FELT.length]); const x = -48.6 + rc.f(-0.3, 0.3), z = -12.95 + rc.f(-0.12, 0.12); g.box(x - 0.22, i * 0.07, z - 0.22, x + 0.22, i * 0.07 + 0.08, z + 0.22, { bevel: 0.03 }); }
    });
    for (let i = 0; i < 3; i++) prop(s, 'cup', -46.9 + i * 0.25, 0.9, Z0 + 0.42, 0, { glaze: ['#f1e6cf', '#d9962a', '#1f6a6a'][i], lid: '#f1e6cf' });
    sign(s, { kind: 'notice', title: 'Cushions', lines: ['For the court.', 'It rings like a pot.', 'Bring them back.'], hand: true }, -48.6, 1.35, Z0 + 0.2, { face: 'Z', w: 0.26, h: 0.32, board: false });

    // ---------------- listeners' chairs in the front corners ----------------
    for (const c of [[-48.9, -5.1, fy(0.6, -1)], [-48.0, -4.65, fy(0.4, -1)], [-40.15, -6.9, fy(-0.7, -1)]]) {
      prop(s, 'chair', c[0], 0, c[1], c[2], { wood: '#6a4529', seat: '#d9962a', back: 'slat' }, { spot: { tags: ['listen', 'choir-room'] } });
      seat(s, c[0], 0, c[1], c[2], 'Sit and listen', { onSit(gm) { listen(gm); } });
    }
    prop(s, 'plant', -49.4, 0, -6.6, 0.2, { kind: 'fern', size: 1.1, pot: '#d9962a', seed: 21 });
    prop(s, 'plant', -39.6, 0, -4.6, 0.8, { kind: 'broad', size: 1.4, pot: '#2a2f6b', seed: 22 });

    // ---------------- light: warm globes over the tiers, coloured lanterns, a picture lamp ----------------
    for (const a of [-0.65, 0, 0.65]) { const p = P(4.6, a); lamp(s, 'globe', p[0], 2.35, p[1], { K: 2700, power: 0.75, clip, drop: 0.6, r: 0.17 }); }
    for (const l of [[-48.3, -7.0, '#e8b04a'], [-40.8, -8.2, '#e2574a'], [-44.5, -12.3, '#2f9a95']]) lamp(s, 'lantern', l[0], 2.25, l[1], { tint: l[2], clip, power: 0.55, drop: 0.6 });
    lamp(s, 'strip', X1 - 0.45, 2.55, -6.6, { to: [X1 - 0.45, 2.55, -5.4], K: 2800, power: 0.4, clip, range: 3 });
    lamp(s, 'sconce', X0 + 0.2, 2.1, -11.6, { face: 'X', K: 2700, power: 0.45, clip });

    // ---------------- sound, zone, paths ----------------
    { let on = false; s.world.dynamics.push({ scope: s, update() { if (on || !game.audio || !game.loopAt) return; on = true; game.loopAt('choir', f, C[0], 1.3, C[1] - 4.5, { vol: 0.32, radius: 16 }); } }); }
    s.zoneBox({ id: 'choir-room', place: 'choir-room', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The choir room', sub: 'Ladle Row', ambience: 'shop', reverb: 'felt' });
    s.path([[-40.85, -2.9], [-40.85, -5.0], [-42.0, -6.4], [-44.5, -6.6]]);
    s.path([[-44.5, -6.6], [-47.4, -6.2], [-48.6, -7.6], [-49.0, -9.6], [-48.4, -11.8]], { width: 1.1 });
    s.path([[-42.0, -6.4], [-39.95, -7.6], [-40.2, -10.2], [-41.0, -12.2], [-44.5, -12.5], [-48.4, -11.8]], { width: 1.1 });
    s.spot('chat', -40.6, 0, -12.3, fy(-1, 0.5), { tags: ['chat', 'choir-room'] });
    s.spot('chat', -41.5, 0, -12.6, fy(1, 0.6), { tags: ['chat', 'choir-room'] });
    s.spot('stand', -49.0, 0, -10.2, fy(-1, -0.4), { tags: ['flute', 'choir-room'] });
    s.finish();
    game.spawns['choir-room'] = { frame: f, x: -40.85, y: 0, z: -2.4, yaw: 0 };
  },
};

// A convex footprint pulled up, with its corners turned the way the prism wants them (positive area in x, z).
function prismPos(g, poly, y0, y1) {
  let a = 0; for (let i = 0; i < poly.length; i++) { const p = poly[i], q = poly[(i + 1) % poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
  g.prism(a >= 0 ? poly : poly.slice().reverse(), y0, y1);
}

async function listen(gm) {
  const h = gm.clock ? gm.clock.hours : 12;
  if (h >= 23 || h < 7) { await say(gm, 'The choir room', ['Nobody is singing now. The felt holds the room so quiet you can hear the lamp.']); return; }
  await say(gm, 'Listening', ['They are working on a round. Each voice comes in a bar behind the last, and in this air the voices are bright and edged, the throat\'s resonances lifted, though every note is where it should be.', 'Nobody here hears it as strange. To them the old recordings from before sound as if they were sung through a blanket.', 'The felt on every wall drinks the echo. In a bare room heliox rings like a pot; in here it sounds close enough to touch.']);
  found(gm, 'bright-voices');
}

async function connieTalk(gm) {
  meet(gm, 'connie');
  const pick = await choose(gm, 'connie', 'Connie lowers her hands, and twenty people stop at once.', [
    { label: 'Can a guest sing?', value: 'sing' },
    { label: 'Why so much felt?', value: 'felt' },
    { label: 'What do you sing on the Long Flight?', value: 'flight' },
  ]);
  if (pick === 'sing') {
    await say(gm, 'connie', ['Where did you sleep last night? Have you eaten? Good. Then yes. Stand with the middles; they will carry you.', 'Every block has a choir. You can tell a block by its choir the way you can tell it by its hall. Ours is loud and slightly sharp, and proud of both.']);
  } else if (pick === 'felt') {
    await say(gm, 'connie', ['Sound runs nearly twice as fast in this air. A bare room rings like a struck pan and every consonant comes back at you three times.', 'So good rooms hang felt. Mags from Sorrel hung this lot. We sing in the court on Thursdays to remind ourselves why.']);
    found(gm, 'bright-voices');
  } else if (pick === 'flight') {
    await say(gm, 'connie', ['On Booking night the sunline stays dark and the whole Spindle opens, end to end. We go up in the first shift, at ten, and sing as we fly.', 'Nothing to stand on, nothing near to bounce off: the sound goes, and the floor sends it back late and faint. It is the only night of the year we do not need the felt. Come. Meet us at the sleeve hire. Bring a hand lamp.']);
  }
}
