// The Cold Rows: four winter tents on the meadow above the lake's near shore, each a long white tunnel of quilted cloth on
// galvanised hoops over two rows of apple trees, held at four degrees for six weeks while the trees count their cold. A
// porch at each door with coats on loan; a chiller at each closed end blowing through a cloth duct along the ridge; frost on
// the ground, bare trees with their row tags, a thermometer and a pencilled card. The tent moves on two rows every six
// weeks: beside the last one, the rows just out of winter are in blossom and the brush crew are up their ladders.
import { lamp } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { heightAt } from '../world/land.js';
import { Rng, hashStr, hash2i } from '../core/util.js';
import { gy, say, toast, found, sfx } from './hollow_parts.js';
import { IP, DYES, openZone, who, card, pick } from './lm_hollow_island_parts.js';

const Z0 = 1520, Z1 = 1550, TW = 4.7, WALL = 1.1, ARCH = 3.8, RIB = 2.5, NA = 18;
const PW = 1.7, PWALL = 1.05, PARCH = 1.6, PL = 2.5;
// the four tents: centre x, the rows under it, the day of its six weeks, the thermometer's reading
const TENTS = [
  { x: 180, rows: [3, 4], day: 37, temp: '4.0', lo: '3.6', hi: '4.3' },
  { x: 192, rows: [5, 6], day: 23, temp: '3.9', lo: '3.7', hi: '4.2' },
  { x: 208.5, rows: [7, 8], day: 9, temp: '4.1', lo: '3.5', hi: '4.4' },
  { x: 220.5, rows: [11, 12], day: 2, temp: '4.6', lo: '4.0', hi: '6.8' },
];
const BLOOM_X = [230.6, 234.6];

const COLD_ENV = { exposure: 1.0, autoKey: 0.17, autoMin: 0.05, autoMax: 4, bloom: 0.05, warmth: -0.34, contrast: 1.04, saturation: 0.8 };

// the arch of a tent, as offsets [dx, dy] from the centre of its floor: straight walls, then a half ellipse
function archPts(w, wall, arch, n) {
  const pts = [[-w, 0], [-w, wall]];
  for (let k = 1; k < n; k++) { const a = Math.PI - k / n * Math.PI; pts.push([Math.cos(a) * w, wall + Math.sin(a) * arch]); }
  pts.push([w, wall], [w, 0]);
  return pts;
}
// height of an arch above its floor at offset dx (for cutting the porch out of the end wall)
function archH(dx, w, wall, arch) { if (Math.abs(dx) >= w) return 0; return wall + Math.sqrt(Math.max(0, 1 - (dx / w) * (dx / w))) * arch; }

export function buildWinter(game, f, zones) {
  const s = game.world.scope('lmhi-winter', f), g = s.g;
  const r = new Rng(hashStr('cold-rows'));
  const A = archPts(TW, WALL, ARCH, NA), AP = archPts(PW, PWALL, PARCH, 10);
  TENTS.forEach((T, ti) => buildTent(game, s, f, T, ti, A, AP, r, zones));

  // ---- the yard between the second and third tents: the board of which rows are in winter, crates, a barrow of brushes
  {
    const x = 200.25, z = 1554.2, y = gy(x, z);
    s.furniture(() => {
      g.mat('wood', '#4a3a2c'); for (const sx of [-1, 1]) g.box(x + sx * 0.84 - 0.045, y - 0.2, z - 0.09, x + sx * 0.84 + 0.045, y + 1.95, z, { bevel: 0.01 });
      g.mat('wood', '#2f6f73'); g.box(x - 1.0, y + 1.95, z - 0.3, x + 1.0, y + 2.0, z + 0.12, { bevel: 0.01 });
    });
    sign(s, { kind: 'board', title: 'The Cold Rows · this six weeks', lines: ['Rows 3 · 4|day 37 of 42', 'Rows 5 · 6|day 23 of 42', 'Rows 7 · 8|day 9 of 42', 'Rows 11 · 12|day 2 of 42', 'Out next|rows 3 · 4, in five days', 'Just out|rows 9 · 10, in blossom', 'Four degrees|close the inner flap'], palette: ['#1e2c3a', '#eef3f6', '#8fc7e0'] }, x, y + 1.3, z + 0.01, { face: 'Z', w: 1.6, h: 1.1, back: '#2a2420' });
    s.solid(x - 0.95, y, z - 0.12, x + 0.95, y + 2.0, z + 0.02);
    s.interact({ x, y: y + 1.2, z: z + 0.8, radius: 1.5, prompt: 'Read which rows are in winter', onUse: async (gm) => {
      await say(gm, { name: 'The Cold Rows', colour: '#8fc7e0' }, [
        'Four tents, eight rows. Rows 3 and 4 are on day 37 of 42, and come out in five days. Rows 5 and 6 are on day 23; 7 and 8 on day 9. Rows 11 and 12 went under cloth two days ago and are still coming down to temperature.',
        'Just out: rows 9 and 10, beside the last tent, in blossom. The tent that had them was carried two rows along. It takes forty people a morning and nobody is excused.',
        'Underneath: an apple tree counts its cold. Six weeks under seven degrees and it wakes all at once; less and it blooms late and ragged, a few flowers at a time, and the brush crew are up the ladders for a month instead of a week.',
      ]);
    } });
    for (const [bx, bz, n] of [[198.0, 1556.3, 2], [198.6, 1557.4, 1]]) for (let k = 0; k < n; k++) prop(s, 'hollow.applecrate', bx, gy(bx, bz) + k * 0.33, bz, 0.1 * k, { seed: 50 + k, full: false });
    s.spot('stand', x + 0.4, y, z + 1.2, Math.PI, { tags: ['winter', 'read'] });
    s.spot('chat', 202.4, gy(202.4, 1556.2), 1556.2, -2.0, { tags: ['winter', 'orchard'] }); s.spot('chat', 203.4, gy(203.4, 1555.4), 1555.4, -1.0, { tags: ['winter', 'orchard'] }); s.spot('chat', 203.0, gy(203, 1557.0), 1557.0, -2.6, { tags: ['winter', 'orchard'] });
  }

  // ---- the rows just out of winter, in blossom, and the brush crew up their ladders
  const bloom = [];
  for (const bx of BLOOM_X) for (let k = 0; k < 8; k++) { const z = Z0 + 2.4 + k * 3.65 + (bx > 232 ? 1.2 : 0), x = bx + r.f(-0.15, 0.15); bloom.push([x, z]); prop(s, 'lmhi.apple', x, gy(x, z), z, r.f(0, 6.28), { kind: 'blossom', seed: (k + (bx > 232 ? 3 : 0)) % 6 }, { scale: r.f(0.92, 1.08) }); }
  // fallen petals under them
  s.deco(() => {
    g.mat('plain', '#f8e8ea', { rough: 0.3 });
    for (const [x, z] of bloom) for (let k = 0; k < 22; k++) { const a = r.f(0, 6.283), d = r.f(0.2, 1.7), px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d, py = gy(px, pz) + 0.012; g.box(px - 0.025, py, pz - 0.02, px + 0.025, py + 0.004, pz + 0.02, { faces: 'Y' }); }
  });
  const LADDERS = [[232.6, 1531.0, 0.3, 'Odile'], [232.5, 1542.2, Math.PI + 0.2, null]];
  for (const [x, z, yaw, nm] of LADDERS) {
    const y = gy(x, z);
    prop(s, 'hollow.stepladder', x, y, z, yaw, { h: 2.2, brush: true }, { noSpots: true });
    const st = [x + Math.sin(yaw) * 0.22, z + Math.cos(yaw) * 0.22];
    s.spot('work', st[0], y + 0.95, st[1], yaw + Math.PI, { tags: ['sweep', 'notes', 'brush', 'orchard', 'ladder'] });
    s.spot('work', x + Math.sin(yaw) * 1.1, y, z + Math.cos(yaw) * 1.1, yaw + Math.PI, { tags: ['brush', 'orchard', 'hold-ladder'] });
  }
  // a basket of soft brushes and a slate of the trees done
  {
    const x = 232.7, z = 1536.6, y = gy(x, z);
    prop(s, 'hollow.basket', x, y, z, 0.4, { col: '#c9a46e' });
    s.detail(() => { for (let k = 0; k < 6; k++) { const a = k * 1.05, bx = x + Math.cos(a) * 0.1, bz = z + Math.sin(a) * 0.07; g.mat('wood', '#d9b25c'); g.tube([[bx, y + 0.18, bz], [bx + Math.cos(a) * 0.05, y + 0.44, bz]], 0.011, { segs: 4 }); g.mat('felt', pick(['#f1e2c0', '#e8d8b8', '#f5e8cc'], k)); g.ball(bx + Math.cos(a) * 0.06, y + 0.49, bz, 0.035, 0.05, 0.035, { segs: 6, rings: 4 }); } });
    sign(s, { kind: 'chalk', title: 'Rows 9 · 10', lines: ['Out of winter: day 4', 'Open: about half', 'Brushed today: 11 trees', 'Odile, Kwame, Pip'] }, 232.7, y + 1.15, 1537.4, { face: 'Z', w: 0.5, h: 0.5 });
    s.furniture(() => { g.mat('wood', '#4a3a2c'); g.box(232.66, y - 0.2, 1537.32, 232.74, y + 1.42, 1537.38); });
  }
  s.interact({ x: 232.6, y: gy(232.6, 1531) + 1.3, z: 1532.4, radius: 2.2, kind: 'talk', prompt: 'Ask the brush crew about the blossom', onUse: async (gm) => {
    gm.flags = gm.flags || {};
    const n = gm.flags.lmhiBrush = (gm.flags.lmhiBrush || 0) + 1;
    await say(gm, who('Odile, up a ladder'), n === 1 ? [
      'Mind the ladder. Where did you sleep, and have you eaten? Good. Hold that leg, then, it walks at half a g.',
      'A touch to every open flower with the soft brush, then the next. That carries the pollen. Nobody here has ever seen a bee. My grandmother had a picture of one and we thought it was a sweet.',
      'Six weeks in the cold tent, and now they all open in one week, which is the whole point of the cold. Out of season you would be up here for a month.',
    ] : pick([
      ['Eleven trees today. Each flower is a possible apple, and each apple is four point four kays on somebody’s table. So you count.'],
      ['The pink ones open first. By the end of the week the rows look like somebody spilt milk on them, and then the petals come down slow as anything.'],
      ['Next six weeks they move the tent to thirteen and fourteen. Forty of us carry it. You could come.'],
    ], n));
    found(gm, 'hand-pollinated');
  } });
  s.interact({ x: 234.6, y: gy(234.6, 1546) + 1.4, z: 1546, radius: 2.0, prompt: 'Look at the blossom', onUse: (gm) => say(gm, { name: 'Rows 9 and 10', colour: '#f6c9d2' }, [
    'Four days out of the cold, and every tree is half open at once: white, edged with pink, a few small new leaves. The petals that fall come down slowly enough to watch the whole way.',
    'Each tree carries a tag from its winter: day 42 of 42, initialled. Beside it, the tent that held them stands two rows along, already cold, already white.',
  ]) });

  // ---- paths: along the doors, through the yard, into each tent down its duckboards, up to the blossom rows
  s.path([[244, gy(244, 1556), 1556], [236, gy(236, 1554.8), 1554.8], [TENTS[3].x, gy(TENTS[3].x, 1554.5), 1554.5], [TENTS[2].x, gy(TENTS[2].x, 1554.5), 1554.5], [200.25, gy(200.25, 1555.4), 1555.4], [TENTS[1].x, gy(TENTS[1].x, 1554.5), 1554.5], [TENTS[0].x, gy(TENTS[0].x, 1554.5), 1554.5], [174.5, gy(174.5, 1572), 1572]]);
  s.path([[236, gy(236, 1554.8), 1554.8], [232.6, gy(232.6, 1546), 1546], [232.6, gy(232.6, 1524), 1524]]);
  openZone(s, zones, { id: 'lmhi-rows', box: [172, -3, 1512, 240, 30, 1560], name: 'The Cold Rows', sub: 'winter tents · four degrees, six weeks' });
  openZone(s, zones, { id: 'lmhi-bloom', box: [227, -3, 1518, 238.5, 30, 1552], name: 'Rows 9 and 10', sub: 'just out of winter · in blossom' });
  s.finish();
  return s;
}

function buildTent(game, s, f, T, ti, A, AP, r, zones) {
  const g = s.g, cx = T.x, ribs = [];
  for (let z = Z0; z <= Z1 + 0.01; z += RIB) ribs.push(z);
  const base = (z) => gy(cx, z) + 0.02;
  const P = (k, z, w) => { const p = A[k]; const yb = base(z); const foot = (k === 0 || k === A.length - 1) ? gy(cx + p[0], z) - 0.05 : yb + p[1]; return [cx + p[0] * (w || 1), foot, z]; };
  const label = 'Rows ' + T.rows[0] + ' · ' + T.rows[1];
  // ---- the cloth: quilted panels between the hoops, sagging a hand's width; a liner inside, lit by the day through it
  s.furniture(() => {
    for (let b = 0; b < ribs.length - 1; b++) {
      const z0 = ribs[b], z1 = ribs[b + 1], zm = (z0 + z1) / 2;
      for (let k = 0; k < A.length - 1; k++) {
        const p0 = P(k, z0), q0 = P(k + 1, z0), p1 = P(k, z1), q1 = P(k + 1, z1);
        const sag = (k > 0 && k < A.length - 2) ? 0.1 : 0.0;
        const pm = [cx + (p0[0] - cx) * (1 - sag / TW), (p0[1] + p1[1]) / 2 - (k === 0 ? 0 : sag * 0.6), zm], qm = [cx + (q0[0] - cx) * (1 - sag / TW), (q0[1] + q1[1]) / 2 - (k + 1 === A.length - 1 ? 0 : sag * 0.6), zm];
        g.mat('weave', k % 2 ? '#f2f3ef' : '#e9ece8', { emissive: 0.55, night: true });
        g.quad(p0, q0, qm, pm, { double: true }); g.quad(pm, qm, q1, p1, { double: true });
      }
    }
  });
  // the liner: one face, inward, faintly bright (day through cloth); its seams are the quilting
  s.structure(() => {
    for (let b = 0; b < ribs.length - 1; b++) {
      const z0 = ribs[b] + 0.04, z1 = ribs[b + 1] - 0.04;
      for (let k = 1; k < A.length - 2; k++) {
        const a = A[k], c = A[k + 1], i0 = 0.12;
        const pa = (z) => [cx + a[0] * (1 - i0 / TW), base(z) + a[1] - i0 * 0.5, z], pc = (z) => [cx + c[0] * (1 - i0 / TW), base(z) + c[1] - i0 * 0.5, z];
        g.mat('felt', k % 2 ? '#e4ecf0' : '#dde6eb', { emissive: 0.32, lamp: true });
        g.quad(pa(z0), pa(z1), pc(z1), pc(z0));
      }
    }
  });
  // ---- the hoops, the purlins, the weighted skirt, guy ropes and pegs
  s.furniture(() => {
    g.mat('cast', '#c9ccc8', { rough: -0.1 });
    for (const z of ribs) g.tube(A.map((p, k) => { const q = P(k, z); return [q[0], q[1] + (k === 0 || k === A.length - 1 ? 0 : 0.03), z]; }), 0.045, { segs: 5 });
    for (const k of [4, Math.floor(A.length / 2), A.length - 5]) g.tube(ribs.map((z) => { const q = P(k, z); return [q[0], q[1] + 0.05, z]; }), 0.03, { segs: 4 });
    g.mat('felt', '#7d8c6a');
    for (const sx of [-1, 1]) for (let b = 0; b < ribs.length - 1; b++) {
      const z0 = ribs[b], z1 = ribs[b + 1], x = cx + sx * (TW + 0.04);
      g.quad([x, gy(x, z0) - 0.05, z0], [x, gy(x, z1) - 0.05, z1], [x, gy(x, z1) + 0.5, z1], [x, gy(x, z0) + 0.5, z0], { double: true });
    }
    g.mat('weave', '#cfc6b0');
    for (const z of ribs) for (const sx of [-1, 1]) { const p = P(sx < 0 ? 5 : A.length - 6, z), px = cx + sx * (TW + 1.6); g.tube([p, [px, gy(px, z) + 0.12, z]], 0.008, { segs: 3, caps: false }); }
    g.mat('wood', '#8a6a48'); for (const z of ribs) for (const sx of [-1, 1]) { const px = cx + sx * (TW + 1.6); g.box(px - 0.03, gy(px, z) - 0.1, z - 0.03, px + 0.03, gy(px, z) + 0.16, z + 0.03); }
  });
  for (const sx of [-1, 1]) for (let b = 0; b < ribs.length - 1; b++) { const z0 = ribs[b], z1 = ribs[b + 1], x = cx + sx * TW; s.solid(x - 0.12, Math.min(gy(x, z0), gy(x, z1)) - 0.5, z0, x + 0.12, Math.max(gy(x, z0), gy(x, z1)) + 2.0, z1); }
  // ---- the closed end, and the door end with the porch cut out of it
  const yE0 = base(Z0), yE1 = base(Z1), yP = base(Z1 + PL / 2);
  s.furniture(() => {
    for (const [z, door] of [[Z0, false], [Z1, true]]) {
      const yb = base(z);
      for (let k = 0; k < A.length - 1; k++) {
        const p = A[k], q = A[k + 1];
        const bot = (dx) => door ? Math.max(gy(cx + dx, z) - 0.05, Math.abs(dx) < PW ? yb + archH(dx, PW, PWALL, PARCH) : -9) : gy(cx + dx, z) - 0.05;
        const yTop = (pp, kk) => (kk === 0 || kk === A.length - 1) ? gy(cx + pp[0], z) - 0.05 : yb + pp[1];
        // split each strip in two so the porch's arch can cut it cleanly
        for (const [u0, u1] of [[0, 0.5], [0.5, 1]]) {
          const x0 = p[0] + (q[0] - p[0]) * u0, x1 = p[0] + (q[0] - p[0]) * u1, t0 = yTop(p, k) + (yTop(q, k + 1) - yTop(p, k)) * u0, t1 = yTop(p, k) + (yTop(q, k + 1) - yTop(p, k)) * u1;
          const b0 = bot(x0), b1 = bot(x1); if (t0 <= b0 + 0.01 && t1 <= b1 + 0.01) continue;
          g.mat('weave', (k + (u0 > 0 ? 1 : 0)) % 2 ? '#f2f3ef' : '#e6e9e4', { emissive: 0.55, night: true });
          g.quad([cx + x0, Math.min(b0, t0), z], [cx + x1, Math.min(b1, t1), z], [cx + x1, t1, z], [cx + x0, t0, z], { double: true });
        }
      }
    }
    // the porch: a short arched vestibule on its own hoops, the outer flaps tied back in teal
    const pz = [Z1, Z1 + PL / 2, Z1 + PL];
    for (let b = 0; b < 2; b++) for (let k = 0; k < AP.length - 1; k++) {
      const z0 = pz[b], z1 = pz[b + 1], p = AP[k], q = AP[k + 1];
      const y = (pp, kk, z) => (kk === 0 || kk === AP.length - 1) ? gy(cx + pp[0], z) - 0.05 : base(z) + pp[1];
      g.mat('weave', k % 2 ? '#f2f3ef' : '#e6e9e4', { emissive: 0.55, night: true });
      g.quad([cx + p[0], y(p, k, z0), z0], [cx + q[0], y(q, k + 1, z0), z0], [cx + q[0], y(q, k + 1, z1), z1], [cx + p[0], y(p, k, z1), z1], { double: true });
    }
    g.mat('cast', '#c9ccc8'); for (const z of pz) g.tube(AP.map((p, k) => [cx + p[0], (k === 0 || k === AP.length - 1) ? gy(cx + p[0], z) - 0.05 : base(z) + p[1] + 0.03, z]), 0.035, { segs: 5 });
    const zf = Z1 + PL;
    g.mat('weave', '#e6e9e4', { sway: 0.3 });
    for (const sx of [-1, 1]) g.sheet([cx + sx * 0.95, base(zf) + 2.15, zf + 0.02], [cx + sx * (PW - 0.05), base(zf) + PWALL + 0.3, zf + 0.04], [cx + sx * (PW + 0.1), base(zf), zf + 0.12], [cx + sx * 0.75, base(zf), zf + 0.06], { nu: 3, nv: 4, ripple: 0.04, rippleN: 3 });
    g.mat('weave', IP.teal); for (const sx of [-1, 1]) g.tube([[cx + sx * 0.82, base(zf) + 1.1, zf + 0.08], [cx + sx * (PW + 0.05), base(zf) + 1.15, zf + 0.1]], 0.02, { segs: 4 });
    // the inner flap, rolled up over the doorway into the tent
    g.mat('felt', '#dfe6ea'); g.tube([[cx - 1.0, yE1 + 2.05, Z1 - 0.06], [cx + 1.0, yE1 + 2.05, Z1 - 0.06]], 0.12, { segs: 8 });
    g.mat('weave', IP.verm); for (const sx of [-0.6, 0.6]) g.tube([[cx + sx, yE1 + 2.2, Z1 - 0.1], [cx + sx, yE1 + 1.9, Z1 - 0.1]], 0.012, { segs: 3 });
    // the duct: a fat cloth sock along the ridge from the chiller, with a row of holes letting the cold down
    const dz = []; for (let z = Z0 + 0.3; z <= Z1 - 1.5; z += 2.5) dz.push([cx, base(z) + WALL + ARCH - 0.75, z]);
    g.mat('weave', '#cfe0ea'); g.tube(dz, 0.27, { segs: 10 });
    g.mat('plain', '#5a6a72'); for (const p of dz) for (const sx of [-1, 1]) g.box(p[0] + sx * 0.26 - 0.01, p[1] - 0.06, p[2] - 0.05, p[0] + sx * 0.26 + 0.01, p[1] + 0.02, p[2] + 0.05);
  });
  for (const sx of [-1, 1]) s.solid(cx + sx * (TW + PW) / 2 - (TW - PW) / 2, yE1 - 0.5, Z1 - 0.12, cx + sx * (TW + PW) / 2 + (TW - PW) / 2, yE1 + 2.5, Z1 + 0.12);
  s.solid(cx - TW, yE0 - 0.5, Z0 - 0.12, cx + TW, yE0 + 2.5, Z0 + 0.12);
  for (const sx of [-1, 1]) s.solid(cx + sx * PW - 0.1, yP - 0.5, Z1, cx + sx * PW + 0.1, yP + 2.0, Z1 + PL);
  sign(s, { kind: 'plate', text: label.toUpperCase(), sub: 'in winter · day ' + T.day + ' of 42', palette: ['#eef3f6', '#1e2c3a', '#5f9fc8'] }, cx, yE1 + 3.15, Z1 + 0.05, { face: 'Z', w: 1.5, h: 0.42 });

  // ---- inside: frost, the duckboards, two rows of bare trees, a thermometer, a pruning ladder
  s.detail(() => {
    g.mat('sand', '#eaf1f4', { rough: 0.25 });
    const cs = 0.9;
    for (let z = Z0 + 0.25; z < Z1 - 0.3; z += cs) for (let x = cx - TW + 0.3; x < cx + TW - 0.3; x += cs) {
      const near = Math.min(Math.abs(x + cs / 2 - (cx - 2.2)), Math.abs(x + cs / 2 - (cx + 2.2))) < 1.3;
      if (!near && hash2i(Math.round(x * 3), Math.round(z * 3), 17 + ti) < 0.35) continue;
      if (Math.abs(x + cs / 2 - cx) < 0.75) continue;
      const x1 = Math.min(x + cs, cx + TW - 0.3), z1 = Math.min(z + cs, Z1 - 0.3);
      g.quad([x, gy(x, z) + 0.03, z], [x, gy(x, z1) + 0.03, z1], [x1, gy(x1, z1) + 0.03, z1], [x1, gy(x1, z) + 0.03, z]);
    }
    g.mat('wood', '#8f8270');
    for (let z = Z0 + 0.7; z < Z1 + PL - 0.2; z += 0.52) { const y = gy(cx, z) + 0.05; g.box(cx - 0.62, y, z - 0.2, cx + 0.62, y + 0.035, z + 0.2, { bevel: 0.006 }); }
    g.mat('wood', '#5f5546'); for (const sx of [-0.45, 0.45]) g.tube([[cx + sx, gy(cx, Z0 + 0.6) + 0.03, Z0 + 0.6], [cx + sx, gy(cx, (Z0 + Z1) / 2) + 0.03, (Z0 + Z1) / 2], [cx + sx, gy(cx, Z1 + PL - 0.2) + 0.03, Z1 + PL - 0.2]], 0.03, { segs: 4 });
  });
  for (const sx of [-1, 1]) for (let k = 0; k < 8; k++) {
    const z = Z0 + 2.2 + k * 3.65 + (sx > 0 ? 0.5 : 0), x = cx + sx * 2.25 + r.f(-0.12, 0.12);
    prop(s, 'lmhi.bare', x, gy(x, z), z, r.f(0, 6.28), { seed: (k * 2 + (sx > 0 ? 1 : 0) + ti) % 5 }, { scale: r.f(0.95, 1.12) });
  }
  prop(s, 'lmhi.thermo', cx + 1.0, gy(cx + 1.0, Z1 - 1.2), Z1 - 1.2, 0, {});
  if (ti === 1) { prop(s, 'hollow.stepladder', cx - 1.0, gy(cx - 1, Z0 + 12), Z0 + 12, -Math.PI / 2 + 0.2, { h: 2.0, brush: false }, { noSpots: true }); s.spot('work', cx - 1.4, gy(cx - 1.4, Z0 + 12.6), Z0 + 12.6, -Math.PI / 2, { tags: ['prune', 'orchard', 'winter'] }); }
  s.spot('work', cx + 1.5, gy(cx + 1.5, Z0 + 6.0), Z0 + 6.0, Math.PI / 2, { tags: ['prune', 'orchard', 'winter'] });
  s.spot('stand', cx - 0.3, gy(cx, Z1 - 3.5), Z1 - 3.5, 0.2, { tags: ['winter', 'look'] });
  // ---- the porch: coats on loan on the anti side, a boot bench on the other
  const crx = cx - PW + 0.3, crz = Z1 + PL / 2;
  prop(s, 'lmhi.coatrack', crx, gy(crx, crz), crz, Math.PI / 2, { n: 5, seed: ti });
  prop(s, 'bench', cx + PW - 0.35, gy(cx + 1.3, crz), crz, -Math.PI / 2, { w: 1.6, wood: '#8a6a48' });
  sign(s, { kind: 'label', text: 'COATS ON LOAN', sub: 'back on the hook, please' }, crx + 0.2, gy(crx, crz) + 2.05, crz, { face: 'X', w: 0.6, h: 0.16 });
  s.interact({ x: crx + 0.6, y: gy(crx, crz) + 1.2, z: crz, radius: 1.3, prompt: (gm) => gm.flags && gm.flags.lmhiCoat ? 'Hang the coat back up' : 'Borrow a coat', onUse: (gm) => {
    gm.flags = gm.flags || {};
    if (gm.flags.lmhiCoat) { gm.flags.lmhiCoat = false; toast(gm, 'You hang the coat back on its hook and button it, as the label asks.'); sfx(gm, 'paper', f, crx, 1.2, crz); return; }
    gm.flags.lmhiCoat = true; sfx(gm, 'paper', f, crx, 1.2, crz);
    toast(gm, pick(['A long quilted coat, on loan. The cuffs are mended in four colours and there are six names inside the collar, the oldest nearly washed out.', 'A coat off the rack, heavy and warm, smelling of cold cloth. A patch on the elbow in bright saffron, the stitches proud of it.', 'The coat is too long for you and has been, by the look of the hem, too long for a great many people.', 'A coat in faded indigo with a teal mend down one seam. In the pocket, a soft brush and a tag that says day 30.'], ti));
  } });
  // ---- light: cold strips along the shoulders, the bounce of the white cloth
  const clip = [cx - TW - 0.2, base(Z0) - 0.6, Z0 - 0.2, cx + TW + 0.2, base(Z0) + WALL + ARCH + 0.5, Z1 + PL + 0.3];
  for (const sx of [-1, 1]) lamp(s, 'strip', cx + sx * 1.9, base((Z0 + Z1) / 2) + WALL + ARCH - 1.05, Z0 + 2.5, { to: [cx + sx * 1.9, base((Z0 + Z1) / 2) + WALL + ARCH - 1.05, Z1 - 2.5], K: 6500, power: 1.0, range: 7.5, clip });
  s.ambient({ box: [cx - TW, base(Z0) - 0.4, Z0, cx + TW, base(Z0) + WALL + ARCH, Z1], sky: '#dcecff', ground: '#c0d4e2', power: 0.85, soft: 0.6, spec: 0.3 });
  // ---- the chiller at the closed end, its pipe into the duct
  const chx = cx + 2.3, chz = Z0 - 1.5, chy = gy(chx, chz);
  prop(s, 'lmhi.chiller', chx, chy, chz, Math.PI, {});
  s.furniture(() => { g.mat('weave', '#cfd6d8'); g.tube([[chx - 0.5, chy + 1.9, chz - 0.6 + 1.35], [chx - 0.5, base(Z0) + 3.2, Z0 - 0.4], [cx, base(Z0) + WALL + ARCH - 0.75, Z0 + 0.3]], 0.22, { segs: 10 }); });
  if (ti === 0 || ti === 2) s.loop('air', chx, chy + 1, chz, { vol: 0.35, radius: 16 });
  // ---- reading the thermometer; walking in
  s.interact({ x: cx + 1.0, y: gy(cx + 1, Z1 - 1.2) + 1.3, z: Z1 - 0.7, radius: 1.3, prompt: 'Read the thermometer', onUse: (gm) => say(gm, { name: label + ', the thermometer', colour: '#8fc7e0' }, [
    T.temp + ' degrees. A brass dial with a red needle, and under it a card ruled in pencil: day ' + T.day + ' of 42, never above ' + T.hi + ', never below ' + T.lo + '. Initials every morning, different hands.',
    ti === 3 ? 'The first days run warm while the chiller pulls the cloth and the ground down. By tomorrow it will hold at four, and the trees will start counting.' : T.day > 35 ? 'Five more days. Then the tent comes off these rows and the trees go out into the light, and wake all at once.' : 'Four degrees is cold enough for the trees to count and warm enough not to hurt them. Below seven counts; below freezing does not count double.',
  ]) });
  s.interact({ x: cx - 2.25, y: gy(cx - 2.25, Z0 + 9.5) + 1.5, z: Z0 + 9.5, radius: 2.0, prompt: 'Look at the bare trees', onUse: (gm) => say(gm, { name: label, colour: '#cfd8e0' }, [
    'Bare apple trees in two rows, every leaf down, frost on the ground between them and rime along the upper twigs. Each has a white tag tied at shoulder height: its row, its number, its winter.',
    'An apple will not flower without a winter. It needs about six weeks of cold to know the cold is over; then it wakes. In a drum with no seasons the orchard takes its winters a tent at a time.',
  ]) });
  let nIn = 0;
  s.trigger({ box: [cx - TW + 0.3, base(Z1) - 1.5, Z0 + 0.3, cx + TW - 0.3, base(Z1) + 3.5, Z1 - 0.2], onEnter: (gm) => {
    gm.flags = gm.flags || {};
    if (!gm.flags.lmhiWinter) { gm.flags.lmhiWinter = true; card(gm, 'The Cold Rows', 'Four degrees, six weeks', 'The only winter in Chervil you can walk into. Apple trees will not bloom without six weeks of cold, so the orchard takes its winters a tent at a time, two rows to a tent.'); return; }
    toast(gm, pick(['Four degrees. Your breath shows, and hangs in front of you, and takes its time going.', 'Cold enough to see your breath. The cloth glows white overhead; the trees stand bare in their two rows.', 'Your breath shows in the white light. Somebody has drawn a face in the frost by the duckboards.', 'The cold comes through your shoes first. Your breath shows. Everybody in here talks a little more quietly.'], ti + (nIn++)) + (gm.flags.lmhiCoat ? '' : ' A coat would help: there are some on the rack in the porch.'));
  } });
  openZone(s, zones, { id: 'lmhi-tent-' + (ti + 1), box: [cx - TW + 0.15, -3, Z0, cx + TW - 0.15, base(Z0) + WALL + ARCH, Z1 + PL], name: 'The Cold Rows · ' + label, sub: 'four degrees · day ' + T.day + ' of 42', reverb: 'felt', sky: false, sun: false, headroom: 4.5, env: Object.assign({}, COLD_ENV) });
  // a path down the duckboards
  s.path([[cx, gy(cx, Z1 + 4.5), Z1 + 4.5], [cx, gy(cx, Z1 + PL - 0.3), Z1 + PL - 0.3], [cx, gy(cx, Z1 - 1.5), Z1 - 1.5], [cx, gy(cx, Z0 + 1.5), Z0 + 1.5]]);
}
