// A block hall's kitchen, in the box the plan keeps behind the hall's back wall (lot.kitchen), open to the hall across
// the pass. A range of hotplates with the big pots held on the 65 degree loop and one plate searing, a hood, the plating
// island, sinks under a rack of numbered lids, crocks and sacks, herbs under a grow-lamp. No flame and no smoke.
import { GLAZES } from './lots_halls_rooms.js';
import { shadeHex } from '../core/util.js';

const STEEL = '#c3beb4';

// C.k = { p0, p1, q0, q1 } (local), C.door (p of the kitchen door's middle), C.pass = [pa, pb], C.pc.
// Returns the clip box of the kitchen (frame coordinates) and its work spots.
export async function kitchen(C, tick) {
  const { L, g, s, r, K } = C, k = C.k, t = C.t, H = 3.2;
  const p0 = k.p0, p1 = k.p1, q0 = k.q0, q1 = k.q1;
  const ip0 = p0 + t, ip1 = p1 - t, iq1 = q1 - t;                   // inner faces
  const doorLo = C.door < (p0 + p1) / 2;                              // the door is at the low-p end
  const enamel = K.enamel || '#2c4a46', tile = K.ktile || '#ebe5d6', dado = K.kdado || '#2f6c66';
  const clip = L.clip(p0, -0.3, q0 - 0.9, p1, H + 0.1, q1, 0.05);
  // ---- the room
  L.floor(p0, q0, p1, q1, 0, 'tile', K.kfloor || '#a2573c');
  L.ceiling(p0, q0, p1, q1, H, 'paint', '#ebe4d6');
  const wo = { t, mat: 'tile', tint: tile, dado: { h: 1.05, mat: 'tile', tint: dado }, skirt: '#2c2a26' };
  L.wallP(q1 - t / 2, p0, p1, 0, H, wo);
  L.wallQ(p0 + t / 2, q0, q1 - t, 0, H, wo);
  L.wallQ(p1 - t / 2, q0, q1 - t, 0, H, wo);
  g.mat('tile', '#d1952c');
  L.box(ip0, 1.05, iq1 - 0.012, ip1, 1.15, iq1, { faces: 'xXzZ' });
  s.flush({ tier: 's' });
  if (tick) await tick();

  // ---- the range on the back wall
  const span = ip1 - ip0, rl = Math.min(14, span - 6.5), rc = (ip0 + ip1) / 2 + (doorLo ? 1.2 : -1.2), ra = rc - rl / 2, rb = rc + rl / 2, rq = iq1 - 0.82;
  g.mat('paint', enamel); L.box(ra, 0.1, rq, rb, 0.86, iq1, { aoBottom: 0.6 });
  g.mat('paint', shadeHex(enamel, 1.25)); for (let p = ra + 0.08; p < rb - 0.5; p += 0.9) L.box(p, 0.18, rq - 0.012, p + 0.82, 0.78, rq);
  g.mat('brushed', STEEL, { rough: 0.3 }); L.box(ra - 0.02, 0.86, rq - 0.02, rb + 0.02, 0.9, iq1, { bevel: 0.008 });
  s.flush({ tier: 's', cast: true });
  L.solid(ra, 0, rq, rb, 0.9, iq1);
  const plates = []; for (let p = ra + 0.45; p < rb - 0.3; p += 0.82) for (const qq of [iq1 - 0.24, iq1 - 0.6]) plates.push([p + (qq < iq1 - 0.4 ? 0.2 : 0), qq]);
  const sear = plates[plates.length - 1];
  g.mat('cast', '#2a2624'); for (const pl of plates) L.cyl(pl[0], 0.9, pl[1], 0.16, 0.012, { segs: 10 });
  g.mat('cast', '#ff6a2a', { emissive: 2.2 }); L.cyl(sear[0], 0.912, sear[1], 0.12, 0.003, { segs: 10 });
  s.flush({ tier: 's' });
  const pots = [];
  for (const pl of plates) {
    if (pl === sear) continue;
    if (pl[1] > iq1 - 0.4 && r.chance(0.8)) { L.prop('lots-halls.pot', pl[0], 0.912, pl[1], r.f(0, 6), { r: 0.22, h: 0.4 }); pots.push(pl); }
    else if (pl[1] < iq1 - 0.4 && r.chance(0.45)) L.prop('lots-halls.pot', pl[0], 0.912, pl[1], r.f(0, 6), { r: 0.15, h: 0.2, metal: r.chance(0.5) ? STEEL : '#b5653a' });
  }
  // the loop: two lagged pipes along the wall, flow and return, banded, with a tap over each big pot
  for (const pp of [[1.32, '#b0442c'], [1.52, '#2f6f8f']]) {
    const pts = []; for (let p = ip0 + 0.3; p <= ip1 - 0.3 + 0.01; p += 2) pts.push([Math.min(p, ip1 - 0.3), pp[0], iq1 - 0.12]);
    g.mat('weave', '#ddd3be', { rough: 0.1 }); L.tube(pts, 0.05, { segs: 8 });
    g.mat('paint', pp[1]); for (let p = ip0 + 1; p < ip1 - 0.5; p += 1.8) L.box(p - 0.04, pp[0] - 0.055, iq1 - 0.175, p + 0.04, pp[0] + 0.055, iq1 - 0.065);
  }
  g.mat('cast', '#b8863b'); for (const p of [ip0 + 0.3, ip1 - 0.3]) L.tube([[p, 1.32, iq1 - 0.12], [p, H, iq1 - 0.12]], 0.055, { segs: 8 });
  for (const pl of pots) L.tube([[pl[0], 1.32, iq1 - 0.16], [pl[0], 1.32, iq1 - 0.26], [pl[0], 1.1, iq1 - 0.26]], 0.013, { segs: 5 });
  s.flush({ tier: 's' });
  // the hood, its strip of light, a rail of ladles
  g.mat('brushed', '#b9b3a8', { rough: -0.05 }); L.box(ra - 0.05, 2.15, iq1 - 1.1, rb + 0.05, 2.6, iq1, { bevel: 0.01 });
  g.mat('diffuser', '#fff1dc', { emissive: 3.2, lamp: true }); L.box(ra + 0.3, 2.14, iq1 - 1.0, rb - 0.3, 2.145, iq1 - 0.9, { faces: 'y' });
  g.mat('brushed', '#a9a39a'); L.box(rc - 0.9, 2.6, iq1 - 0.8, rc + 0.9, H, iq1);
  g.mat('brushed', '#a9a39a'); L.tube([[ra + 0.3, 2.08, iq1 - 1.15], [ra + 4.5, 2.08, iq1 - 1.15]], 0.012, { segs: 5 });
  s.flush({ tier: 's' });
  for (let p = ra + 0.5, i = 0; p < ra + 3.6; p += 0.5, i++) L.prop('kitchen.ladle', p, 2.08, iq1 - 1.15, Math.PI, { len: [0.3, 0.38, 0.26, 0.42][i % 4], kind: i % 3 === 1 ? 'spoon' : 'ladle' });
  L.light({ at: [ra + 0.6, 2.05, iq1 - 0.8], to: [rb - 0.6, 2.05, iq1 - 0.8], type: 'tube', color: '#fff0dc', power: 3.6, range: 3.6, radius: 0.08, lamp: true, clip, shadow: true });
  if (tick) await tick();

  // ---- the plating island
  const il = Math.min(12, span - 7), ic = (ip0 + ip1) / 2, ia = ic - il / 2, ib = ic + il / 2, iqa = q0 + 2.75, iqb = q0 + 3.65;
  g.mat('brushed', STEEL, { rough: 0.3 }); L.box(ia, 0.88, iqa, ib, 0.92, iqb, { bevel: 0.008 });
  g.mat('brushed', '#a9a39a'); for (let p = ia + 0.1; p <= ib - 0.05; p += Math.max(1.5, il / Math.round(il / 3))) for (const qq of [iqa + 0.08, iqb - 0.08]) L.box(p - 0.025, 0, qq - 0.025, p + 0.025, 0.88, qq + 0.025);
  g.mat('brushed', '#b3ada3'); L.box(ia + 0.05, 0.22, iqa + 0.05, ib - 0.05, 0.245, iqb - 0.05);
  g.mat('wood', '#b98a56', { rough: 0.05 }); for (let p = ia + 1; p < ib - 1.4; p += 3.5) L.box(p, 0.92, iqa + 0.2, p + 1.2, 0.955, iqb - 0.2, { bevel: 0.008 });
  s.flush({ tier: 's', cast: true });
  L.solid(ia, 0, iqa, ib, 0.92, iqb);
  for (let p = ia + 0.5, i = 0; p < ib - 0.3; p += 0.95, i++) {
    const kk = (i + C.salt) % 4;
    if (kk === 0) L.prop('lots-halls.stack', p, 0.92, (iqa + iqb) / 2, 0, { n: 6 + (i % 2) * 2, glaze: GLAZES[i % 6] });
    else if (kk === 1) L.prop('bowl', p, 0.92, iqa + 0.25, 0, { glaze: GLAZES[(i + 2) % 6], open: true, food: ['#7aa05a', '#c98f4e', '#e8d8b0'][i % 3], r: 0.12 });
    else if (kk === 2) L.prop('lots-halls.crock', p, 0.92, (iqa + iqb) / 2, 0, { glaze: ['#8a5a3c', '#3a4a7a', '#2f6c66', '#c9a24a'][i % 4], h: 0.2, r: 0.08 });
    else L.prop('lots-halls.bowl', p, 0.92, iqb - 0.25, 0, { glaze: GLAZES[i % 6] });
    if (i % 3 === 0) L.prop('lots-halls.stack', p + 0.2, 0.245, (iqa + iqb) / 2, 0, { n: 6, glaze: GLAZES[(i + 3) % 6], r: 0.1 });
  }
  if (tick) await tick();

  // ---- the wash end: sinks along the end wall, the rack of numbered lids over them
  const we = doorLo ? ip1 : ip0, wd = doorLo ? -1 : 1;              // the wash end's wall face, and the way into the room from it
  const sq0 = q0 + 1.3, sq1 = Math.min(iq1 - 0.2, q0 + 5.2);
  g.mat('brushed', STEEL, { rough: 0.3 }); L.box(we, 0.86, sq0, we + wd * 0.7, 0.92, sq1, { bevel: 0.006 });
  g.mat('paint', '#3a5a6a'); L.box(we, 0.08, sq0 + 0.05, we + wd * 0.66, 0.86, sq1 - 0.05, { aoBottom: 0.6 });
  g.mat('brushed', '#5c5852'); for (const qc of [sq0 + 1.0, sq0 + 2.0]) L.box(we + wd * 0.1, 0.919, qc - 0.38, we + wd * 0.6, 0.921, qc + 0.38, { faces: 'Y' });
  g.mat('cast', '#b8863b', { rough: -0.2 }); for (const qc of [sq0 + 1.0, sq0 + 2.0]) L.tube([[we + wd * 0.02, 1.15, qc], [we + wd * 0.2, 1.22, qc], [we + wd * 0.3, 1.1, qc]], 0.016, { segs: 5 });
  g.mat('wood', '#5a3826'); L.box(we, 1.3, sq0, we + wd * 0.03, 2.75, sq1, { bevel: 0.005 });
  s.flush({ tier: 's', cast: true });
  L.solid(Math.min(we, we + wd * 0.7), 0, sq0, Math.max(we, we + wd * 0.7), 0.92, sq1);
  // the lids on pegs, a gap for every lid out at the table
  g.mat('glaze', '#e9e1cf');
  for (let row = 0; row < 3; row++) for (let i = 0; i < Math.floor((sq1 - sq0 - 0.3) / 0.36); i++) {
    if ((row * 13 + i + C.salt) % 4 === 1) continue;
    const q = sq0 + 0.25 + i * 0.36, y = 1.55 + row * 0.42;
    g.mat('glaze', GLAZES[(row + i * 2 + C.salt) % 6]);
    g.push(); const c = L.P(we + wd * 0.05, q); g.move(c[0], y, c[1]); const dv = L.dirOf(wd, 0); g.rotZ(dv[0] ? -dv[0] * Math.PI / 2 : 0); g.rotX(dv[1] ? dv[1] * Math.PI / 2 : 0);
    g.lathe(0, 0, [[0.13, 0], [0.07, 0.045], [0, 0.07]], { segs: 8 }); g.pop();
  }
  s.flush({ tier: 'd' });
  L.prop('hall.trolley', we + wd * 1.4, 0, Math.min(iq1 - 0.5, sq1 + 0.6), 0, { wood: '#8a6240' });
  if (tick) await tick();

  // ---- the door end: shelves of crocks, sacks of Mill flour and rice, herbs under a grow-lamp
  const de = doorLo ? ip0 : ip1, dd = doorLo ? 1 : -1;
  for (const qc of [q0 + 3.2]) {
    if (qc + 0.6 > iq1 - 0.1) continue;
    L.prop('shelving', de + dd * 0.17, 0, qc, dd > 0 ? Math.PI / 2 : -Math.PI / 2, { w: 1.15, h: 2.1, d: 0.32, shelves: 4, wood: '#6b4a2f' });
    for (let sh = 0; sh < 4; sh++) for (let i = 0; i < 4; i++) if ((sh + i + C.salt) % 5 !== 0) L.prop('lots-halls.crock', de + dd * 0.18, 0.105 + sh * 0.4975, qc - 0.42 + i * 0.28, i, { glaze: ['#8a5a3c', '#3a4a7a', '#2f6c66', '#c9a24a', '#b5653a', '#e9e1cf'][(sh * 4 + i) % 6], h: 0.2 + (i % 3) * 0.04, r: 0.08 });
  }
  for (let i = 0; i < 2; i++) L.prop('kitchen.sack', de + dd * (0.35 + (i % 2) * 0.5), 0, Math.min(iq1 - 0.35, q0 + 4.8 + Math.floor(i / 2) * 0.5), i, { col: i % 2 ? '#e2d8c2' : '#d8ccb0', band: i % 2 ? '#2f6f8f' : '#8c2c26' });
  // herbs on two shelves in the back corner, under a pink grow-lamp
  const ha = doorLo ? ip0 + 0.3 : ip1 - 3.0, hb = ha + 2.7;
  g.mat('wood', '#6b4a2f'); for (const y of [1.1, 1.75]) L.box(ha, y, iq1 - 0.34, hb, y + 0.035, iq1, { bevel: 0.006 });
  g.mat('brushed', '#5c5852'); L.box(ha, 2.38, iq1 - 0.32, hb, 2.42, iq1 - 0.1);
  g.mat('diffuser', '#ffd2f4', { emissive: 5 }); L.box(ha + 0.05, 2.375, iq1 - 0.27, hb - 0.05, 2.38, iq1 - 0.15, { faces: 'y' });
  s.flush({ tier: 's' });
  if (ha < ra - 0.2 || ha > rb + 0.2) for (const y of [1.135, 1.785]) for (let p = ha + 0.2; p < hb - 0.1; p += 0.34) L.prop('lots-halls.herbs', p, y, iq1 - 0.17, p * 3, { seed: Math.round(p * 7) % 3, pot: ['#b4643e', '#a9573a', '#c47a4e', '#2f6c66'][Math.round(p * 3) % 4], leaf: ['#cfe8a0', '#b8d890', '#e0f0b0'][Math.round(p * 5) % 3] });
  // a knife strip on the back wall past the range
  const kx = doorLo ? rb + 0.6 : ra - 2.0;
  g.mat('wood', '#3a2a1e'); L.box(kx, 1.5, iq1 - 0.03, kx + 1.4, 1.56, iq1, { bevel: 0.005 }); s.flush({ tier: 'd' });
  for (let i = 0; i < 8; i++) L.prop('kitchen.knife', kx + 0.12 + i * 0.16, 1.5, iq1 - 0.04, Math.PI, { len: [0.2, 0.26, 0.16, 0.22, 0.3, 0.18][i % 6], handle: ['#3a2a1e', '#6b4a2f', '#2a2a2a'][i % 3] });
  // ducts and a panel of light over the island
  g.mat('brushed', '#b0aaa0'); { const d = []; for (let p = ip0 + 0.8; p <= ip1 - 0.8 + 0.01; p += 2.5) d.push([Math.min(p, ip1 - 0.8), 2.95, iq1 - 0.6]); L.tube(d, 0.18, { segs: 10 }); }
  s.flush({ tier: 's' });
  L.lamp('panel', ic, H, (iqa + iqb) / 2, { w: Math.min(6, il - 1), d: 0.5, K: 4100, power: 1.0, clip });
  L.glowBox(p0, 0, q0, p1, H, q1, { sky: '#fff4e4', ground: '#e2d2bc', power: 0.26 });
  // the kitchen's light spills out through the pass
  L.ambient(C.pass[0], 0, q0 - 2.6, C.pass[1], 2.6, q0, { sky: '#fff0dc', ground: '#c9a57c', power: 0.16, lamp: true, soft: 1.5 });
  if (tick) await tick();

  // ---- people in the kitchen
  const spots = [];
  spots.push(L.spot('work', rc - 1.6, 0, rq - 0.55, 0, { tags: ['hall', 'cook'] }));
  spots.push(L.spot('work', rc + 2.2, 0, rq - 0.55, 0, { tags: ['hall', 'cook'] }));
  spots.push(L.spot('work', ic + 1.0, 0, iqa - 0.55, 0, { tags: ['hall', 'plate'] }));
  spots.push(L.spot('work', ic - 2.5, 0, iqb + 0.55, Math.PI, { tags: ['hall', 'cook', 'chop'] }));
  spots.push(L.spot('work', we + wd * 1.15, 0, sq0 + 1.0, wd > 0 ? -Math.PI / 2 : Math.PI / 2, { tags: ['hall', 'wash'] }));
  // walkways: in at the door, along both sides of the island, round its ends
  const ca = q0 + 1.75, cb = (iqb + rq) / 2, ea = ia - 0.9, eb = ib + 0.9;
  L.path([[C.door, q0 - 0.2], [C.door, ca]], { width: 1.1 });
  L.path([[Math.min(ea, C.door), ca], [C.door, ca], [Math.max(eb, C.door), ca]].sort((u, v) => u[0] - v[0]), { width: 1.1 });
  L.path([[ea, ca], [ea, cb], [eb, cb], [eb, ca]], { width: 1.0 });
  L.path([[C.pc, ca], [C.pc, q0 + 0.85]], { width: 0.9 });
  L.loop('kitchen', ic, 1.2, (q0 + q1) / 2, { vol: 0.55, radius: 10 });
  s.zoneBox({ id: C.lot.id + ':kitchen', place: 'city-hall', box: (() => { const b = L.B(p0, q0, p1, q1); return [b[0], -0.5, b[1], b[2], H, b[3]]; })(), name: C.info.hall, sub: 'the kitchen · ' + C.info.name, ambience: 'hall', reverb: 'tile', cell: C.info.key });
  return { clip, spots };
}
