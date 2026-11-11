// The Pin Room: Chervil's reading decks, beside the lot hall. A tall room of long sloped desks where what came in by
// light today from the other rafts is pinned up in columns, and people stand and read it. Over each column a clock
// shows how old the column is: light takes time, so the news from across the raft is half a minute old when it lands
// and the news from across the Shade is years old. At the far end, long letters waiting to be read aloud.
import { floor, ceiling, wall, lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, TAU, PIN, C, say, find, hour, tick, runX, hand, pickBy } from './lm_lot_hall_props.js';

const ENV_PIN = { exposure: 1.0, autoKey: 0.17, bloom: 0.06, warmth: 0.04 };
// the columns: where it came from, how far by light, how the clock reads (h12: hours, d24: a day, y12: years)
const COLS = [
  { name: 'Herb Row', lag: 'under a second', hours: 0.0001, scale: 'h12', at: 6.0,
    read: ['From the drums of the Row, the same instant. Sorrel: the Orange Hall\'s Thursday steaks are back on. Lovage: its festival Hollow hours went at auction for more kays than last year, as every year.', 'Rue: the Count board reads fourteen years from par, unchanged. Its councillors will be at the Ledger on Booking Day. Somebody has pencilled: bring them tea.'] },
  { name: 'Merrow, the far side', lag: '37 seconds', hours: 37 / 3600, scale: 'h12', at: 6.2,
    read: ['From the far side of this raft, half a minute away, as far as anyone can go and still be here. A drum over there lost its oldest starter to a blight and asks for a spoon of anything near it. Three halls in Chervil have offered.', 'A recipe from Dulse for noodles pulled on a third-g terrace, where a strand can hang three times as long. Someone has written underneath: we have no third-g terrace near a kitchen. Somebody else: yet.'] },
  { name: 'Sedge', lag: '9 minutes', hours: 9 / 60, scale: 'h12', at: 6.4,
    read: ['From the raft Sedge, nine minutes away by light. The score of a painted dusk, eighteen pages, colour by colour and minute by minute, sent for the lamp-painters of any drum that wants to play it.', 'A design for a door hinge that does not squeal in heliox, with drawings. Two of the sheets have been borrowed already and replaced with a note.'] },
  { name: 'Fallow', lag: '41 minutes', hours: 41 / 60, scale: 'h12', at: 6.7,
    read: ['From Fallow, forty-one minutes away. A choir\'s new piece, written to be sung to a raft as it passes, all the parts pinned up so that the block choirs here can learn it before Fallow is gone.', 'The tenor part has been copied out by hand four times, and there are four pencil marks against the same bar.'] },
  { name: 'Tarn, passing', lag: '3 hours 12 minutes', hours: 3.2, scale: 'd24', at: 7.0,
    read: ['From Tarn, passing: three hours away by light, the nearest it will be in anyone\'s life. They are sending everything while the lag is short. A hundred and twelve pages of recipes today.', 'And a request, in their own hand, for the sourdough Chervil is known for. A clerk has pinned beside it, without comment, the address of the Crock, in Lovage.'] },
  { name: 'Corrie', lag: '11 hours', hours: 11, scale: 'd24', at: 7.4,
    read: ['From Corrie, eleven hours away. A paper on why their lake stays clear to the bottom: they keep it starved, as Chervil does, but they say it better.', 'A long letter for a family on deck 233, sealed. It will be read aloud here on Thursday evening, as the family asked.'] },
  { name: 'Hollin', lag: '2 years 4 months', hours: 2.33 * 8766, scale: 'y12', at: 7.9,
    read: ['From Hollin, across the Shade, two years and four months away. Everything in this column was written before last Booking Day, by people who did not know what Chervil would vote.', 'An answer to a question this drum asked nearly five years ago, about a vat strain that kept failing. The strain library has pinned its thank-you underneath, which will reach Hollin in two years and four months.'] },
  { name: 'Osier', lag: '7 years 9 months', hours: 7.75 * 8766, scale: 'y12', at: 8.3,
    read: ['From Osier, on the far side of the Shade, round the Lantern by its relays: seven years and nine months. The oldest column in the room, and the shortest.', 'A song, words and tune, and one line of news: a child named in Osier eight years ago for a wanderer from Chervil who stayed there is now old enough to write herself. She has. Her letter is on the far wall, waiting for her table to come and hear it.'] },
];

export async function buildPins(game, s, f, r) {
  const g = s.g, { x0, x1, z0, z1, h } = PIN;
  const clip = [x0 - 0.1, -0.2, z0 - 0.1, x1 + 0.1, h + 0.1, z1 + 0.1];
  floor(s, x0, z0, x1, z1, 0, 'planks', '#8a6240');
  ceiling(s, x0, z0, x1, z1, h, 'paint', '#e9dfc8');
  const wo = { tint: '#4f6b62', t: 0.24, dado: { h: 1.0, mat: 'flute', tint: C.walnut }, skirt: '#2a1c14' };
  // walls: the long board wall (x = 44), the ends, and the short pieces beside the foyer's wall at x = 18
  for (const [a, b] of [[z0, 20], [38, z1]]) wall(s, x0, a, x0, b, 0, h, wo);
  wall(s, x1, z0, x1, z1, 0, h, Object.assign({}, wo, { dado: { h: 0.9, mat: 'flute', tint: C.walnut } }));
  wall(s, x0, z0, x1, z0, 0, h, wo);
  wall(s, x0, z1, x1, z1, 0, h, wo);
  // the floor: a long felt runner between the desks; the ceiling: a long laylight of lamp glass between dark beams
  s.deco(() => { g.mat('felt', C.indigo); runX(z0 + 1, z1 - 1, 8, (a, b) => g.box(29.6, 0, a, 30.6, 0.008, b, { faces: 'Y' })); g.mat('felt', C.saffron); runX(z0 + 1, z1 - 1, 8, (a, b) => { g.box(29.5, 0, a, 29.6, 0.01, b, { faces: 'Y' }); g.box(30.6, 0, a, 30.7, 0.01, b, { faces: 'Y' }); }); });
  s.structure(() => {
    g.mat('wood', '#4a2e1e'); for (let z = z0 + 2; z < z1; z += 4) g.box(x0 + 0.1, h - 0.6, z - 0.16, x1 - 0.1, h, z + 0.16, { faces: 'yzZ' });
    g.mat('diffuser', '#fff2dc', { emissive: 0.6, lamp: true }); runX(z0 + 2.4, z1 - 2.4, 8, (a, b) => g.box(24.5, h - 0.04, a, 37.5, h - 0.02, b, { faces: 'y' }));
    g.mat('cast', C.gilt, { rough: -0.1 }); runX(z0 + 2.2, z1 - 2.2, 8, (a, b) => { g.box(24.3, h - 0.08, a, 24.5, h - 0.02, b, { faces: 'y' }); g.box(37.5, h - 0.08, a, 37.7, h - 0.02, b, { faces: 'y' }); });
  }, 2);
  // a frieze high on the walls, the room's name painted across the board wall's top
  s.structure(() => { g.mat('paint', C.teal); g.box(x1 - 0.14, 9.7, z0 + 0.15, x1 - 0.12, 10.4, z1 - 0.15, { faces: 'x' }); g.mat('cast', C.gilt, { rough: -0.2 }); g.box(x1 - 0.15, 9.66, z0 + 0.15, x1 - 0.13, 9.7, z1 - 0.15, { faces: 'x' }); }, 2);
  sign(s, { kind: 'letters', text: 'WHAT CAME IN BY LIGHT TODAY', palette: [C.cream] }, x1 - 0.16, 10.05, (z0 + z1) / 2, { face: 'x', w: 9.0, h: 0.5, level: 2 });
  await tick(game);

  // ---------------- the columns: a felt board each, sheets pinned in rows, today's at the bottom, a clock on top ----------------
  const n = COLS.length, cw = (z1 - z0 - 1.2) / n;
  let R = null;
  if (game.atlas) {
    R = game.atlas.add(2000, 500, (ctx) => {
      ctx.save(); ctx.scale(2000 / 2048, 500 / 512);
      for (let i = 0; i < n; i++) {
        const c = COLS[i], x = i * 256;
        ctx.fillStyle = '#1f2a26'; ctx.fillRect(x, 0, 256, 512);
        ctx.strokeStyle = 'rgba(240,226,190,0.22)'; ctx.lineWidth = 3; ctx.strokeRect(x + 8, 8, 240, 496);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f3e6c8'; ctx.font = 'italic 600 38px "Cormorant Garamond"';
        let fs = 38; while (ctx.measureText(c.name).width > 228 && fs > 20) { fs -= 2; ctx.font = 'italic 600 ' + fs + 'px "Cormorant Garamond"'; }
        ctx.fillText(c.name, x + 128, 60);
        ctx.fillStyle = '#e0a040'; ctx.font = '600 24px "Barlow Condensed"'; ctx.fillText(c.lag.toUpperCase() + ' BY LIGHT', x + 128, 98);
        // the dial
        const cx = x + 128, cy = 300, rr = 104;
        ctx.fillStyle = '#efe4c8'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c9a24a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, rr + 4, 0, TAU); ctx.stroke();
        const N = 12;
        ctx.fillStyle = '#22302c'; ctx.font = '600 20px "Barlow Condensed"';
        for (let k = 0; k < N * 4; k++) {
          const a = k / (N * 4) * TAU, big = k % 4 === 0, r0 = rr - (big ? 16 : 8);
          ctx.strokeStyle = '#22302c'; ctx.lineWidth = big ? 3 : 1.4; ctx.beginPath(); ctx.moveTo(cx + Math.sin(a) * r0, cy - Math.cos(a) * r0); ctx.lineTo(cx + Math.sin(a) * (rr - 3), cy - Math.cos(a) * (rr - 3)); ctx.stroke();
          if (big) { const lbl = c.scale === 'd24' ? String((k / 4) * 2) : String(k / 4); ctx.fillText(k === 0 ? (c.scale === 'd24' ? '24' : '12') : lbl, cx + Math.sin(a) * (rr - 32), cy - Math.cos(a) * (rr - 32) + 7); }
        }
        ctx.fillStyle = '#7a2a3a'; ctx.font = 'italic 600 22px "Cormorant Garamond"'; ctx.fillText(c.scale === 'y12' ? 'years old' : 'hours old', cx, cy + 46);
        ctx.fillStyle = '#c9a24a'; ctx.beginPath(); ctx.arc(cx, cy, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(243,230,200,0.75)'; ctx.font = '20px "Barlow"'; ctx.fillText(c.scale === 'y12' ? 'across the Shade' : c.scale === 'd24' ? 'a raft away' : i < 2 ? 'this raft' : 'a raft away', x + 128, 470);
      }
      ctx.restore();
    }, 'lothall-pins');
  }
  const dials = [];
  for (let i = 0; i < n; i++) {
    const zc = z0 + 0.6 + cw * (i + 0.5), c = COLS[i], xw = x1 - 0.12;
    // the board
    s.structure(() => {
      g.mat('wood', C.walnut); g.box(xw - 0.08, 0.92, zc - cw / 2 + 0.08, xw, 6.2, zc + cw / 2 - 0.08, { faces: 'xyY' });
      g.mat('felt', pickBy(['#5a4636', '#4a3a2e', '#5e4a3a'], i)); g.box(xw - 0.1, 1.0, zc - cw / 2 + 0.16, xw - 0.08, 6.1, zc + cw / 2 - 0.16, { faces: 'x' });
    });
    // the sheets: rows from the bottom up, yellower and more crowded higher up (older), a pin in each
    const rk = (i * 9301 + 49297) % 233280;
    s.detail(() => {
      for (let row = 0; row < 8; row++) for (let j = 0; j < 3; j++) {
        const k = rk + row * 7 + j * 13; if (k % 11 === 0) continue;
        const zz = zc - cw / 2 + 0.42 + j * (cw - 0.8) / 2 + ((k % 5) - 2) * 0.02, yy = 1.12 + row * 0.62, w2 = 0.2 + (k % 3) * 0.02, h2 = 0.27, x = xw - 0.105 - (j % 2) * 0.004;
        const old = row / 7;
        g.mat('paper', old > 0.6 ? '#e2cfa2' : old > 0.3 ? '#ebdcb8' : C.paper);
        g.box(x - 0.002, yy, zz - w2, x, yy + h2 * 2, zz + w2, { faces: 'x' });
        if (k % 4 === 1) { g.mat('paint', pickBy([C.madder, C.tealL, C.saffron, C.indigo], k)); g.box(x - 0.003, yy + h2 * 2 - 0.1, zz - w2 + 0.03, x - 0.002, yy + h2 * 2 - 0.04, zz + w2 - 0.03, { faces: 'x' }); }
        g.mat('plain', '#4a3a2e'); for (let l = 0; l < 7; l++) { const ly = yy + 0.06 + l * 0.055; g.box(x - 0.003, ly, zz - w2 + 0.03, x - 0.0025, ly + 0.012, zz + w2 - 0.03 - ((l + k) % 3) * 0.04, { faces: 'x' }); }
        g.mat('cast', '#c9a24a'); g.box(x - 0.012, yy + h2 * 2 - 0.03, zz - 0.008, x - 0.003, yy + h2 * 2 - 0.014, zz + 0.008);
      }
    });
    // the header and its clock, painted, with a hand that keeps the column's age
    const top = 9.3, hh = 3.0, ww = hh / 2;
    if (R) s.deco((gg) => {
      const u0 = R.u0 + (R.u1 - R.u0) * i / n, u1 = R.u0 + (R.u1 - R.u0) * (i + 1) / n;
      gg.atlas(R.page, { emissive: 0.55, lamp: true });
      gg.quad([xw - 0.066, top - hh, zc - ww / 2], [xw - 0.066, top - hh, zc + ww / 2], [xw - 0.066, top, zc + ww / 2], [xw - 0.066, top, zc - ww / 2], { uv: [u0, R.v1, u1, R.v0] });
    }, 1);
    s.structure(() => { g.mat('wood', C.walnut); g.box(xw - 0.06, top - hh - 0.1, zc - ww / 2 - 0.08, xw, top + 0.1, zc + ww / 2 + 0.08, { faces: 'xyY' }); g.mat('cast', C.gilt, { rough: -0.2 }); g.box(xw - 0.07, top + 0.06, zc - ww / 2 - 0.08, xw - 0.06, top + 0.1, zc + ww / 2 + 0.08, { faces: 'x' }); }, 1);
    const dialY = top - hh * (300 / 512);
    dials.push({ c, set: hand(s, xw - 0.075, dialY, zc, 'x', 0.32, 0.03, '#7a2a3a') });
    s.deco((gg) => { gg.mat('cast', C.gilt, { rough: -0.2 }); gg.push(); gg.move(xw - 0.09, dialY, zc); gg.rotZ(PI / 2); gg.cyl(0, 0, 0, 0.035, 0.02, { segs: 10 }); gg.pop(); }, 1);
    // a picture lamp over each board
    lamp(s, 'strip', xw - 0.35, 6.45, zc - cw / 2 + 0.3, { to: [xw - 0.35, 6.45, zc + cw / 2 - 0.3], K: 3200, power: 0.55, range: 5, clip });
    s.deco((gg) => { gg.mat('cast', '#2c2a26'); gg.tube([[xw, 6.3, zc], [xw - 0.38, 6.5, zc]], 0.012, { segs: 5 }); }, 1);
    // read it, and stand to read it
    s.interact({ x: xw - 1.0, y: 1.5, z: zc, radius: 1.1, prompt: 'Read the column from ' + c.name, onUse(gm) { say(gm, c.name + ', ' + c.lag + ' by light', c.read); find(gm, 'drawn-by-lot'); } });
    s.spot('stand', xw - 0.9, 0, zc + (i % 2 ? 0.5 : -0.5), -PI / 2, { tags: ['read', 'board'] });
  }
  // the clocks keep the age of each column: the time the light took, plus the hours since it was pinned this morning
  let t = 0;
  const upd = (gm) => {
    const now = hour(gm);
    for (const d of dials) {
      const since = now >= d.c.at ? now - d.c.at : now + 24 - d.c.at, age = d.c.hours + since;
      const a = d.c.scale === 'y12' ? (age / 8766) / 12 * TAU : d.c.scale === 'd24' ? (age % 24) / 24 * TAU : (age % 12) / 12 * TAU;
      d.set(a);
    }
  };
  upd(game);
  s.every((dt, gm) => { t += dt; if (t > 0.5) { t = 0; upd(gm || game); } });
  // a rolling ladder on a rail for pinning high
  s.furniture(() => {
    const zl = z0 + 0.6 + cw * 3.0;
    g.mat('cast', C.brass, { rough: -0.2 }); runX(z0 + 0.6, z1 - 0.6, 8, (a, b) => g.box(x1 - 0.2, 5.2, a, x1 - 0.16, 5.24, b, { faces: 'xyY' }));
    g.mat('wood', '#7a5233'); for (const dz of [-0.24, 0.24]) g.tube([[x1 - 0.2, 5.22, zl + dz], [x1 - 1.6, 0, zl + dz]], 0.03, { segs: 6 });
    for (let k = 1; k < 16; k++) { const tt = k / 16; g.box(x1 - 0.2 - 1.4 * tt - 0.02, 5.22 * (1 - tt) - 0.015, zl - 0.24, x1 - 0.2 - 1.4 * tt + 0.02, 5.22 * (1 - tt) + 0.015, zl + 0.24, { faces: 'yYzZ' }); }
  });
  s.solid(x1 - 1.65, 0, z0 + 0.6 + cw * 3.0 - 0.28, x1 - 1.2, 1.5, z0 + 0.6 + cw * 3.0 + 0.28);
  await tick(game);

  // ---------------- the desks: three rows of long sloped desks, sheets laid along them, lamps low over each ----------------
  for (const x of [26.6, 33.4]) for (const [za, zb] of [[20.6, 28.4], [30.6, 38.4]]) {
    const zc = (za + zb) / 2, L = zb - za;
    prop(s, 'lothall.readdesk', x, 0, zc, PI / 2, { L });
    for (const zz of [za + 1.4, zb - 1.4]) for (const sx of [-1, 1]) s.spot('stand', x + sx * 0.75, 0, zz + (sx > 0 ? 0.4 : -0.4), sx > 0 ? -PI / 2 : PI / 2, { tags: ['read', 'board'] });
    for (const zz of [za + 1.8, zb - 1.8]) lamp(s, 'globe', x, 2.5, zz, { K: 2900, power: 0.9, range: 5, drop: h - 2.5 - 0.3, r: 0.17, clip });
  }
  s.interact({ x: 26.6, y: 1.2, z: 24.5, radius: 1.6, prompt: 'Read along the desk', onUse(gm) {
    say(gm, 'The desks', ['Today\'s sheets, laid flat in order of arrival, the oldest light at the far end. People read standing, moving along, and pass each other with a nod. A brass rod holds each row down: the air moves here, the vents are strong.', 'A woman beside you is copying a recipe from Tarn onto the back of her hand.']);
  } });
  // ---------------- where the post comes in: the clerks' long counter, the press, the pigeonholes ----------------
  const cx = 20.6;
  s.furniture(() => {
    g.mat('paint', C.teal); g.box(cx - 0.35, 0.06, 21.0, cx + 0.35, 1.0, 30.0, { aoBottom: 0.6 });
    g.mat('wood', '#8a5a32', { rough: -0.15 }); g.box(cx - 0.42, 1.0, 20.9, cx + 0.45, 1.05, 30.1, { bevel: 0.01 });
    g.mat('cast', C.brass); g.box(cx + 0.42, 0.9, 20.9, cx + 0.45, 0.93, 30.1);
    // the press: a cabinet that takes the light in and puts paper out, its tray full
    g.mat('paint', '#3a3632'); g.box(18.3, 0, 22.0, 19.3, 1.5, 23.4, { bevel: 0.02 });
    g.mat('diffuser', '#9fe8d8', { emissive: 1.4 }); g.box(19.3, 1.2, 22.3, 19.31, 1.3, 22.6);
    g.mat('cast', '#a9a49a'); g.box(19.3, 0.9, 22.3, 19.65, 0.93, 23.1);
    g.mat('paper', C.paper); for (let i = 0; i < 6; i++) g.box(19.35, 0.93 + i * 0.006, 22.35, 19.62, 0.934 + i * 0.006, 23.05);
  });
  s.solid(cx - 0.42, 0, 20.9, cx + 0.45, 1.05, 30.1); s.solid(18.3, 0, 22.0, 19.3, 1.5, 23.4);
  s.detail(() => {
    g.mat('paper', C.paper); for (let i = 0; i < 9; i++) { const z = 21.6 + i * 0.9; g.box(cx - 0.25, 1.05, z, cx + 0.15, 1.05 + 0.01 + (i % 3) * 0.02, z + 0.3); }
    g.mat('cast', C.brass, { rough: -0.2 }); for (let i = 0; i < 3; i++) g.cyl(cx - 0.1, 1.05, 25.0 + i * 0.12, 0.02, 0.02, { segs: 8 });
  });
  prop(s, 'civic.desklamp', cx, 1.05, 23.6, 1.2, { shade: '#2f6f4a' });
  prop(s, 'civic.desklamp', cx, 1.05, 28.0, 1.6, { shade: '#2f6f4a' });
  lamp(s, 'bulb', cx + 0.1, 1.4, 23.6, { K: 2800, power: 0.5, range: 3.5, clip }); lamp(s, 'bulb', cx + 0.1, 1.4, 28.0, { K: 2800, power: 0.5, range: 3.5, clip });
  prop(s, 'cup', cx + 0.2, 1.05, 26.2, 0, { glaze: C.saffron, lid: '#efe4cc' });
  s.spot('work', cx - 0.75, 0, 23.6, PI / 2, { tags: ['write', 'notes', 'clerk', 'pin'] });
  s.spot('work', cx - 0.75, 0, 27.8, PI / 2, { tags: ['write', 'notes', 'clerk', 'pin'] });
  s.spot('customer', cx + 0.95, 0, 25.6, -PI / 2, { tags: ['ask', 'pin'] });
  s.interact({ x: cx + 1.0, y: 1.2, z: 25.6, radius: 1.3, kind: 'talk', prompt: 'Ask the clerk about the clocks', onUse(gm) {
    say(gm, { name: 'The Pin Room clerk', colour: '#3fa7a3' }, [
      'Every column has its clock, because people forget. Light takes time. Across this raft, half a minute. To the rafts round us, minutes or hours. Across the Shade, years: Osier\'s column was written before most of the children in this room were born.',
      'The clock is the age of the column: the time the light took, and the hours since we pinned it this morning. When a column from across the Shade says somebody is well, it means they were.',
      'So you read it, and you write back long, and carefully, to be read once. Nobody here sends a quick answer to Osier.',
    ]);
  } });
  sign(s, { kind: 'notice', title: 'The Pin Room', lines: ['Read standing.', 'Copy what you like.', 'Borrow a sheet: leave a note.', 'Answers to the far rafts', 'at the counter, by Thursday.', 'Letters read aloud: Thursdays, 20:00.'], palette: [C.cream, C.ink, C.tealL] }, 18.14, 1.6, 30.9, { face: 'X', w: 0.4, h: 0.56 });

  // ---------------- the far end: letters waiting to be read aloud, a lectern and a chair, the bound years ----------------
  const LET = { kind: 'board', title: 'Waiting to be read aloud', lines: ['For the Achterbergs, 207|from Hollin, 2 years', 'For deck 233|from Corrie, 11 hours', 'For the table of Ines Vale|from Osier, 8 years', 'For anyone who knew Teodor|from Sedge, 9 minutes', 'For the choir of Ring Five|from Fallow', 'Thursdays|20:00, here'], palette: ['#2a1e14', '#f3e6c8', '#e0a040'] };
  sign(s, LET, 31, 2.1, z1 - 0.14, { face: 'z', w: 2.2, h: 1.5, back: C.walnut });
  s.detail(() => {
    // envelopes pinned round the board, some sealed in colour
    for (let i = 0; i < 18; i++) { const x = 28.6 + (i % 9) * 0.6 + ((i * 7) % 3) * 0.04, y = i < 9 ? 3.15 : 1.0; g.mat('paper', i % 3 ? '#efe4c8' : '#e2cfa2'); g.box(x - 0.16, y, z1 - 0.15, x + 0.16, y + 0.22, z1 - 0.144, { faces: 'z' }); g.mat('glaze', pickBy([C.madder, C.tealL, C.saffron], i)); g.cyl(x, y + 0.08, z1 - 0.15, 0.025, 0.004, { segs: 8 }); }
  });
  // a lectern and a chair for the reader, a ring of chairs for the table that will come and listen
  s.furniture(() => {
    const lx = 31, lz = z1 - 2.6;
    g.mat('wood', C.walnut); g.box(lx - 0.06, 0, lz - 0.06, lx + 0.06, 1.05, lz + 0.06, { faces: 'xXzZ' }); g.box(lx - 0.3, 0, lz - 0.3, lx + 0.3, 0.05, lz + 0.3, { bevel: 0.01 });
    g.push(); g.move(lx, 1.1, lz); g.rotX(-0.45); g.box(-0.32, -0.02, -0.22, 0.32, 0.02, 0.22, { bevel: 0.01 }); g.mat('paper', C.paper); g.box(-0.26, 0.02, -0.17, -0.005, 0.03, 0.17); g.box(0.005, 0.02, -0.17, 0.26, 0.03, 0.17); g.pop();
  });
  s.post(31, z1 - 2.6, 0.32, 0, 1.2);
  for (let i = 0; i < 7; i++) {
    const a = PI + (i - 3) * 0.32, rr = 2.4, x = 31 + Math.sin(a) * rr, z = z1 - 2.6 + Math.cos(a) * rr;
    prop(s, 'chair', x, 0, z, Math.atan2(31 - x, z1 - 2.6 - z), { wood: pickBy(['#6b4a2f', '#3a2a20', '#8a5a32'], i), back: pickBy(['hoop', 'slat'], i), seat: pickBy([C.madder, C.saffron, C.tealL, C.plum], i) });
  }
  lamp(s, 'globe', 31, 2.6, z1 - 2.6, { K: 2600, power: 1.0, range: 5, drop: h - 2.6 - 0.3, r: 0.2, clip });
  s.interact({ x: 31, y: 1.2, z: z1 - 3.4, radius: 1.3, prompt: 'Read the letter on the lectern', onUse(gm) {
    say(gm, 'A long letter', [
      'Left open on the lectern for Thursday, the first page only, in a careful hand: To the table of Ines Vale, deck 241. I am the child Osier named for her. She stayed with us forty years and told us your names.',
      'By the time this reaches you I will be sixteen, and you will be eight years older than you are as I write it, which is a strange thing to write to people. So I will not tell you any news. I will tell you what she cooked.',
      'The rest is folded under. It is eleven pages long, and none of them, as far as you can see, is in a hurry.',
    ]);
  } });
  // the bound years along the near end: every column ever pinned, bound at Knotnight
  for (let i = 0; i < 6; i++) {
    const x = 21.5 + i * 2.1;
    prop(s, 'shelving', x, 0, z0 + 0.22, 0, { w: 2.0, h: 2.6, shelves: 6, wood: C.walnut });
    for (let k = 1; k < 6; k++) prop(s, 'civic.books', x, 0.08 + k * (2.6 - 0.11) / 6 + 0.025, z0 + 0.24, 0, { w: 1.9, seed: 200 + i * 7 + k, cols: ['#3a2a20', '#5a3a24', C.madder, '#2f4f6b', '#6b4a2f', '#e8dcc0', C.walnut] });
  }
  sign(s, { kind: 'label', text: 'THE BOUND YEARS', sub: 'every column since the Count', ink: '#efe4cc' }, 26.8, 2.85, z0 + 0.4, { face: 'Z', w: 2.2, h: 0.2 });

  // ---------------- light, walkways, the zone ----------------
  for (const z of [22, 29, 36]) lamp(s, 'panel', 31, h - 0.05, z, { w: 4.0, d: 2.0, K: 3600, power: 2.2, range: 14, clip });
  s.ambient({ box: clip, sky: '#fff0d8', ground: '#9a7a58', power: 0.14, lamp: true });
  s.path([[16, 33.5], [x0 + 0.6, 33.5], [23, 33.5], [30, 33.5], [30, 29.5], [30, 21], [30, 33.5], [30, 38.0]], { width: 1.6 });
  s.path([[30, 29.5], [40, 29.5], [42.4, 29.5], [42.4, 20.5], [42.4, 38.5]], { width: 1.4 });
  s.path([[23, 33.5], [23, 25.6], [cx + 1.0, 25.6]], { width: 1.2 });
  for (const x of [26.6, 33.4]) for (const sx of [-1, 1]) s.path([[30, 29.5], [x + sx * 0.8, 29.5], [x + sx * 0.8, 21.0], [x + sx * 0.8, 38.0]], { width: 0.9 });
  s.path([[cx - 0.75, 21.0], [cx - 0.75, 30.6], [x0 + 0.8, 30.6], [x0 + 0.8, 33.5]], { width: 0.9 });
  s.spot('chat', 36.6, 0, 29.6, 0.4, { tags: ['read'] }); s.spot('chat', 37.4, 0, 30.4, -2.2, { tags: ['read'] });
  s.zoneBox({ id: 'lh-pins', place: 'lot-hall', box: [x0, -0.5, z0, x1, h, z1], name: 'The Pin Room', sub: 'what came in by light · ' + 'deck 200 · Ring Five', ambience: 'quiet', reverb: 'room', headroom: h, env: ENV_PIN });
  s.loop('murmur', 31, 1.4, 29, { vol: 0.07, radius: 12, param: 0.1 });
  s.loop('air', 31, h - 1, 29, { vol: 0.06, radius: 14 });
  void f; void r;
}
