// The still room: three layers of felt and nothing said. A plain front with one deep doorway; a lobby with a shoe rack
// and the rule card; then a low, warm, dark room: felt underfoot, quilted felt on the walls, felt hung over that, and
// felt baffles under the ceiling. Low benches and cushions round the walls, one lamp, a bowl of water under it.
import { say, note } from '../city/lots.js';
import { room } from '../world/kit2.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { local, pick, sitAWhile, deepFront } from './lots_quiet_kit.js';

const FELTS = ['#5b4a3e', '#4d4438', '#5a3f3a', '#3f4a42', '#4a3e4c', '#5c5040'];
const CUSH = ['#7a3a34', '#8a6a3a', '#3d5a52', '#5a4a6a', '#6b5a3a', '#7a4a52', '#4a5a3a'];
const CARDS = [
  ['Nothing is said in here.', 'Shoes on the rack. Devices dark.', 'Sit as long as you like.', 'If you need someone, touch a sleeve and go out together.'],
  ['Three layers of felt and one lamp.', 'No words, no tapping, no humming.', 'Weep if you need to. Nobody will look.', 'The bowl is for looking at.'],
  ['Kept quiet for the whole block.', 'Come in slowly: the curtain is heavy.', 'A cough is forgiven. A sentence is not.', 'Open every hour the lamps are.'],
  ['Held by the block court for anyone.', 'Speak in the lobby or not at all.', 'Leave the cushions where they lie.', 'Ten minutes or ten hours: nobody counts.'],
];
const PENCIL = [
  'Under it, in pencil: "This means you, Aunt Bel."',
  'Somebody has added, very small: "thank you".',
  'A note pinned under it: "Lost: one grey glove, left hand. Found: one grey glove, right hand. Swap at the block office."',
  'Under it, in pencil, a tally of little strokes. Nobody will say what it counts.',
];

export async function buildStillRoom(s, lot, plan, game, tick) {
  const r = new Rng(lot.seed), info = plan.info, H = 3.0;
  const L = local(s, lot, r.chance(0.5)), g = L.g, W = L.W, D = L.D;
  const fw = FELTS[r.i(0, FELTS.length - 1)];
  // ---------------- the shell: felt floor, felt walls, felt ceiling ----------------
  room(s, { x0: lot.x0, z0: lot.z0, x1: lot.x1, z1: lot.z1, y: 0, h: H, floor: ['felt', '#4a3f36'], ceil: ['felt', '#2e2824'], wall: { mat: 'felt', tint: '#3a3330' }, open: { [lot.front]: false }, glow: false });
  const clip = L.clip(0.1, 3.0, W - 0.1, D - 0.1, -0.3, H + 0.1, 0.05);
  await tick();

  // ---------------- the front: plain plaster, one deep doorway, small pale letters ----------------
  const fin = { mat: 'plaster', tint: '#8a7f70', dado: { h: 1.0, mat: 'plaster', tint: '#6e6458' }, trim: '#3a3330', pil: '#9b9080', arch: '#a89c88', step: '#7f7566' };
  const dP = W * 0.5 + r.f(-3, 1);
  const F = await deepFront(L, plan, { doorP: dP, doorW: 1.5, fin, H, name: 'STILL ROOM', letters: '#efe2c8', lettersGlow: 0.5, plate: ['STILL ROOM', 'felt · nothing said'],
    inner: { mat: 'felt', tint: '#3a3330' }, lobby: { tint: '#3d3530', felt: '#5a3f3a', floor: ['felt', '#5b4a3e'] }, lobbyPower: 0.45, lampK: 2400 }, tick);
  const Q0 = F.Q1;
  // the rule card on the lobby's back curtain, a shoe rack on its far wall, a stool to sit on while you take them off
  const card = CARDS[r.i(0, CARDS.length - 1)];
  await tick();
  L.sign({ kind: 'notice', title: 'THE STILL ROOM', lines: card }, dP, 1.45, Q0 - 0.18, [0, -1], { w: 0.5, h: 0.62 });
  await tick();
  L.block(dP - 1.75, 0, 0.75, dP - 1.42, 0.85, 2.85, 'wood', '#4a3426', { bevel: 0.01 });
  g.mat('wood', '#5b4030'); for (const y of [0.3, 0.58]) L.box(dP - 1.74, y, 0.76, dP - 1.42, y + 0.025, 2.84);
  s.flush({ tier: 'd' });
  for (let k = 0; k < 9; k++) { const y = [0.025, 0.325, 0.605][k % 3], q = 0.95 + Math.floor(k / 3) * 0.62 + (k % 3) * 0.08; L.prop('lots-quiet.shoes', dP - 1.58, y + (y > 0.1 ? 0 : 0.85 - 0.85), q, L.yaw(1, 0), { c: CUSH[(k + r.i(0, 3)) % CUSH.length] }); }
  L.prop('stool', dP - 0.9, 0, 1.4, 0, { wood: '#5b4030' }, { noSpots: true });
  await tick();

  // ---------------- layer two: quilted felt panels on every wall ----------------
  const panelRun = (along, c, a0, a1, dir) => {
    const n = Math.max(1, Math.round((a1 - a0) / 1.25));
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * i / n + 0.03, u1 = a0 + (a1 - a0) * (i + 1) / n - 0.03, tint = mixHex(fw, FELTS[(i + 2) % FELTS.length], 0.35);
      g.mat('felt', tint);
      if (along === 'p') L.box(u0, 0.12, c, u1, 2.62, c + dir * 0.07, { faces: dir > 0 ? 'QpPY' : 'qpPY', bevel: 0.02 });
      else L.box(c, 0.12, u0, c + dir * 0.07, 2.62, u1, { faces: dir > 0 ? 'PqQY' : 'pqQY', bevel: 0.02 });
      // the quilting: three stitched lines across, a shade darker
      g.mat('felt', shadeHex(tint, 0.7));
      for (const y of [0.75, 1.4, 2.05]) { if (along === 'p') L.box(u0 + 0.05, y - 0.01, c + dir * 0.07, u1 - 0.05, y + 0.01, c + dir * 0.075, { faces: dir > 0 ? 'Q' : 'q' }); else L.box(c + dir * 0.07, y - 0.01, u0 + 0.05, c + dir * 0.075, y + 0.01, u1 - 0.05, { faces: dir > 0 ? 'P' : 'p' }); }
    }
    s.flush({ tier: 's' });
  };
  panelRun('p', D - 0.16, 0.2, W - 0.2, -1);
  panelRun('q', 0.16, Q0 + 0.2, D - 0.2, 1); panelRun('q', W - 0.16, Q0 + 0.2, D - 0.2, -1);
  panelRun('p', 0.48, 0.2, dP - 1.95, 1); panelRun('p', 0.48, dP + 2.05, W - 0.2, 1);
  await tick();

  // ---------------- benches and cushions round the walls, in bays between felt screens ----------------
  const seats = [], CY = 0.4;
  const bay = (along, c, a0, a1, dir) => {
    const n = Math.max(1, Math.round((a1 - a0) / 3.4));
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * i / n, u1 = a0 + (a1 - a0) * (i + 1) / n, mid = (u0 + u1) / 2, w = u1 - u0 - 0.7;
      const at = along === 'p' ? [mid, c + dir * 0.4] : [c + dir * 0.4, mid], face = along === 'p' ? [0, dir] : [dir, 0];
      L.prop('lots-quiet.lowbench', at[0], 0, at[1], L.yaw(face[0], face[1]), { w: +w.toFixed(2), wood: '#3f2e22', felt: shadeHex(fw, 1.1) });
      const ns = Math.max(1, Math.floor(w / 0.7));
      for (let k = 0; k < ns; k++) {
        const u = mid - w / 2 + (k + 0.5) * w / ns, sp = along === 'p' ? [u, c + dir * 0.4] : [c + dir * 0.4, u];
        L.prop('lots-quiet.cushion', sp[0], CY, sp[1], L.yaw(face[0], face[1]) + r.f(-0.15, 0.15), { c: CUSH[(i * 3 + k + r.i(0, 6)) % CUSH.length], w: 0.48, d: 0.44, t: 0.09 }, { noCollide: true });
        // a back cushion leaning on the panel
        const bp = along === 'p' ? [u, c + dir * 0.14] : [c + dir * 0.14, u];
        g.mat('weave', CUSH[(i + k * 2 + 3) % CUSH.length]); L.box(bp[0] - (along === 'p' ? 0.22 : 0.06), CY + 0.05, bp[1] - (along === 'p' ? 0.06 : 0.22), bp[0] + (along === 'p' ? 0.22 : 0.06), CY + 0.5, bp[1] + (along === 'p' ? 0.06 : 0.22), { bevel: 0.04 });
        seats.push([sp[0], sp[1], face[0], face[1]]);
      }
      s.flush({ tier: 'd', cast: true });
      // a felt screen between bays, and felt hung either side of it (layer three)
      if (i > 0) {
        const sc = along === 'p' ? [u0, c] : [c, u0];
        g.mat('felt', shadeHex(fw, 0.85));
        if (along === 'p') L.box(u0 - 0.05, 0, c, u0 + 0.05, 2.3, c + dir * 0.85, { bevel: 0.02 }); else L.box(c, 0, u0 - 0.05, c + dir * 0.85, 2.3, u0 + 0.05, { bevel: 0.02 });
        s.flush({ tier: 's', cast: true });
        if (along === 'p') L.solid(u0 - 0.05, 0, Math.min(c, c + dir * 0.85), u0 + 0.05, 2.3, Math.max(c, c + dir * 0.85)); else L.solid(Math.min(c, c + dir * 0.85), 0, u0 - 0.05, Math.max(c, c + dir * 0.85), 2.3, u0 + 0.05);
        void sc;
      }
      const hang = mixHex(CUSH[(i + 1) % CUSH.length], '#2e2824', 0.45);
      g.mat('felt', hang, { sway: 0.08 });
      for (const e of [u0 + 0.05, u1 - 0.55]) {
        if (along === 'p') L.sheet([e, H - 0.12, c + dir * 0.2], [e + 0.5, H - 0.12, c + dir * 0.2], [e + 0.5, 0.05, c + dir * 0.24], [e, 0.05, c + dir * 0.24], { sag: 0.02, ripple: 0.07, nu: 5, nv: 3 });
        else L.sheet([c + dir * 0.2, H - 0.12, e], [c + dir * 0.2, H - 0.12, e + 0.5], [c + dir * 0.24, 0.05, e + 0.5], [c + dir * 0.24, 0.05, e], { sag: 0.02, ripple: 0.07, nu: 5, nv: 3 });
      }
      g.mat('cast', '#3a3330'); if (along === 'p') L.tube([[u0, H - 0.1, c + dir * 0.2], [u1, H - 0.1, c + dir * 0.2]], 0.012, { segs: 5 }); else L.tube([[c + dir * 0.2, H - 0.1, u0], [c + dir * 0.2, H - 0.1, u1]], 0.012, { segs: 5 });
      s.flush({ tier: 'd', cast: false });
    }
  };
  bay('p', D - 0.23, 0.3, W - 0.3, -1); await tick();
  bay('q', 0.23, Q0 + 0.6, D - 1.2, 1); bay('q', W - 0.23, Q0 + 0.6, D - 1.2, -1); await tick();
  if (dP - 2.2 > 3.6) bay('p', 0.55, 0.3, dP - 2.2, 1);
  if (W - dP - 2.4 > 3.6 + 2.6) bay('p', 0.55, dP + 4.8, W - 0.3, 1);
  await tick();

  // ---------------- felt baffles under the ceiling ----------------
  for (let q = Q0 + 1.0; q < D - 0.6; q += 1.1) { g.mat('felt', q % 2.2 < 1.1 ? '#3a322c' : '#433a32'); L.box(1.0, H - 0.62, q - 0.03, W - 1.0, H, q + 0.03, { faces: 'yqQpP' }); s.flush({ tier: 's' }); }
  await tick();

  // ---------------- the middle: a felt plinth, a stone bowl of water, cushions round it, one lamp ----------------
  const mc = [W / 2, (Q0 + D) / 2 + 0.3];
  g.mat('felt', shadeHex(fw, 0.9)); L.lathe(mc[0], mc[1], [[0.95, 0], [0.97, 0.3], [0.9, 0.34], [0, 0.34]], { segs: 28 });
  g.mat('stone', '#8e877a', { rough: 0.1 }); L.lathe(mc[0], mc[1], [[0.22, 0.34], [0.38, 0.38], [0.5, 0.5], [0.52, 0.55], [0.47, 0.555], [0.44, 0.47], [0, 0.44]], { segs: 28 });
  g.mat('plain', '#16201e', { rough: -0.5 }); L.cyl(mc[0], 0.5, mc[1], 0.46, 0.012, { segs: 24 });
  g.mat('cast', '#c8a45a', { rough: -0.3 }); L.box(mc[0] + 0.47, 0.5, mc[1] - 0.025, mc[0] + 0.52, 0.556, mc[1] + 0.025);
  s.flush({ tier: 's', cast: true }); L.post(mc[0], mc[1], 0.97, 0, 0.55);
  const ringR = 2.4, nC = 10, floorSeats = [];
  for (let k = 0; k < nC; k++) {
    const a = k / nC * Math.PI * 2 + r.f(-0.08, 0.08), p = mc[0] + Math.cos(a) * ringR, q = mc[1] + Math.sin(a) * ringR;
    L.prop('lots-quiet.cushion', p, 0, q, r.f(0, 6.28), { c: CUSH[(k + r.i(0, 6)) % CUSH.length], c2: CUSH[(k + 3) % CUSH.length], w: 0.62, d: 0.62, t: 0.2, mat: 'felt', round: true }, { noCollide: true });
    floorSeats.push([p, q, mc[0] - p, mc[1] - q]);
  }
  // the one lamp: a paper lantern low over the bowl
  g.mat('cast', '#2a2622'); L.tube([[mc[0], H, mc[1]], [mc[0], 2.15, mc[1]]], 0.005, { segs: 4, caps: false }); s.flush({ tier: 'd' });
  L.lamp('lantern', mc[0], 1.95, mc[1], { tint: '#f0c890', clip, power: 1.4, drop: 0.2, range: 14, r: 0.26, hh: 0.4, K: 2400 });
  L.glow(0, 0, Q0, W, H, D, { sky: '#d8b890', ground: '#5a4a3e', power: 0.13 });
  await tick();

  // ---------------- people: sitting round the walls and the bowl, somebody brushing the felt ----------------
  seats.forEach((st) => L.spot('sit', st[0], 0.47, st[1], L.yaw(st[2], st[3]), { tags: ['stillroom', 'quiet', 'still'] }));
  floorSeats.forEach((st, k) => { if (k % 2 === 0) L.spot('sit', st[0], 0.15, st[1], L.yaw(st[2], st[3]), { tags: ['stillroom', 'quiet', 'still', 'floor'] }); });
  L.spot('work', dP - 0.6, 0, 2.3, L.yaw(-1, 0), { tags: ['stillroom', 'sweep'] });
  L.spot('stand', mc[0] - 1.4, 0, mc[1] - 1.2, L.yaw(1, 1), { tags: ['stillroom', 'quiet'] });
  L.path([[F.exitP, F.exitQ], [F.exitP + 0.8, Q0 + 1.2], [mc[0], mc[1] - ringR - 0.7]], { width: 1.0, tags: ['stillroom'] });
  L.path([[mc[0], mc[1] - ringR - 0.7], [mc[0] - ringR - 0.8, mc[1]], [mc[0], mc[1] + ringR + 0.7], [mc[0] + ringR + 0.8, mc[1]], [mc[0], mc[1] - ringR - 0.7]], { width: 0.9 });

  // ---------------- things to do ----------------
  const seed = lot.seed, gS = info.g.toFixed(2);
  L.act(dP, 1.4, Q0 - 0.7, 1.3, 'Read the card', (gm) => say(gm, 'The still room', [card.join(' '), pick(seed, 21, PENCIL)]));
  L.act(dP - 1.4, 0.6, 1.8, 1.2, 'Take your shoes off', (gm) => note(gm, pick(seed, 22, [
    'You put your shoes on the rack beside a dozen other pairs. Felt underfoot from here in.',
    'Shoes off. The felt is warm from the loop under the floor.',
    'On the rack: a child\'s pair, mended at the toe in bright red, beside a pair that must be ninety years old.',
    'You leave your shoes with the others. Nobody has ever taken the wrong pair, the card on the rack says, except once.',
  ])));
  { const st = floorSeats[Math.floor(nC * 0.75)]; L.act(st[0], 0.5, st[1], 1.0, 'Sit on a cushion', (gm) => sitAWhile(L, gm, st[0], st[1], st[2], st[3], 20, pick(seed, 23, [
    'Twenty minutes. Under the floor the drum turns, and for once you can hear it: a long low note under everything.',
    'Twenty minutes. Nobody moved, except an old man who took his shoes off again, having forgotten he had put them on.',
    'You sit with the lamp and the bowl and nothing else. Twenty minutes go by the way they used to when you were small.',
    'Twenty minutes. Your own heart is the loudest thing in the room, and then it is not.',
  ]), -0.4)); }
  L.act(mc[0], 0.7, mc[1], 1.6, 'Look into the bowl', (gm) => note(gm, pick(seed, 24, [
    'Water in a stone bowl, perfectly still. The lamp sits in it upside down.',
    'Still enough to show the felt overhead. At ' + gS + ' of a g it takes a long time to settle when somebody sits down near it.',
    'A chip in the rim, mended in brass. The water is changed at lamp-dawn by whoever is first in.',
    'You look in. Your own face looks back, tired, with the lamp behind it.',
  ])));

  L.zone({ place: 'city-special', name: 'The still room', sub: info.name + ' · three layers of felt · nothing said', ambience: 'quiet', reverb: 'felt', cell: info.key, top: H,
    env: { autoKey: 0.12, autoMax: 2.8, warmth: 0.35, bloom: 0.07, vignette: 0.34 } });
  void note;
  return L;
}
