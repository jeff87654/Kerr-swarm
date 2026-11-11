// The court of a generated block: the atrium where its avenue and its street cross, two to six decks tall under a
// luminous ceiling. The ground floor is walked on; the terraces above are the block's own front doors, seen from below.
// What stands on each side at ground level comes from the plan (the hall's arches, two shops, a room, plain wall).
import { floor } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { street, side, unit, pilaster, bench, noticePillar, chalk, drinkingTap, FIN, LANTERN, read, note } from '../places/street_parts.js';
import { NOTICES } from '../content/city.js';
import { LOT_H } from './plan.js';

const PAL = [
  { field: '#cdbb9a', band: '#3f6f6a', runner: '#b2603f', slab: '#e9dcc0', rail: '#2f4f43', ceilA: '#fff4e2', ceilB: '#ffd0c8', sky: '#fff0de', ground: '#d6bf98', stall: '#2f6f73' },
  { field: '#d8c8a8', band: '#8a2f3c', runner: '#3f6a78', slab: '#efe2c6', rail: '#5a2e22', ceilA: '#fff1d8', ceilB: '#ffe2a2', sky: '#fff0d8', ground: '#d8c0a0', stall: '#8a2f3c' },
  { field: '#c9c0ae', band: '#33407a', runner: '#8a6a2f', slab: '#e3dccb', rail: '#26306b', ceilA: '#f6f4ee', ceilB: '#cfe0f4', sky: '#f4f2ea', ground: '#c9c4b8', stall: '#33407a' },
  { field: '#d2c4a0', band: '#6b7a3a', runner: '#7a3f5a', slab: '#ece0c4', rail: '#3f4f2a', ceilA: '#fbf6e0', ceilB: '#e2eec0', sky: '#f8f4e0', ground: '#c8c49c', stall: '#55662f' },
  { field: '#cbb8a2', band: '#5b3a6e', runner: '#4f7a5a', slab: '#eaddd0', rail: '#3d2a4d', ceilA: '#fff0ea', ceilB: '#ecc8e0', sky: '#fff0ea', ground: '#d0bcc0', stall: '#5b3a6e' },
  { field: '#d8c8a8', band: '#a8412b', runner: '#a04a3a', slab: '#f0e2c4', rail: '#3a2a20', ceilA: '#fff2d8', ceilB: '#ffc890', sky: '#ffecd0', ground: '#d8b890', stall: '#a8412b' },
];
const FEATURES = ['fountain', 'bandstand', 'garden', 'market', 'games', 'tables'];
const STALL_LINES = [
  ['Jars with cloth caps, each with a card: who made it, and which deck the fruit grew on.', 'Nothing has a price on it. The keeper looks at what you carry and names one.'],
  ['Mended things, sorted by what they were. A kettle with a new handle. A drum with an old one.', 'A card: "Bring the pieces. All of the pieces."'],
  ['Cuttings in paper twists, labelled by hand, and a tray of seedlings under a lamp of their own.', 'The keeper says the purple one wants shade and conversation.'],
  ['Felt slippers in every size there is, stacked like bowls.', 'A sign: "Feet change with the deck. Trade down when you move up."'],
];

// A view of a scope whose drawing lands on an upper deck: no colliders, spots or prompts (nobody walks there), lights lifted
// to match. Geometry is lifted by the Geo's own transform: wrap the calls in g.push(); g.move(0, dy, 0) ... g.pop().
function lifted(s, dy, level) {
  const v = Object.create(s);
  v.flush = (o) => s.flush(Object.assign({}, o, { level }));
  v.solid = () => null; v.post = () => null; v.ramp = () => null;
  v.spot = () => ({}); v.interact = () => ({}); v.trigger = () => ({}); v.path = () => v; v.zoneBox = () => ({});
  v.glass = (x0, y0, z0, x1, y1, z1, o) => s.glass(x0, y0, z0, x1, y1, z1, Object.assign({}, o, { level }));
  v.glowCard = (x, y, z, o) => s.glowCard(x, y, z, Object.assign({}, o, { level }));
  v.light = (o) => s.light(Object.assign({}, o, { at: [o.at[0], o.at[1] + dy, o.at[2]], to: o.to ? [o.to[0], o.to[1] + dy, o.to[2]] : undefined, clip: o.clip ? [o.clip[0], o.clip[1] + dy, o.clip[2], o.clip[3], o.clip[4] + dy, o.clip[5]] : undefined }));
  v.ambient = (o) => s.ambient(Object.assign({}, o, { box: [o.box[0], o.box[1] + dy, o.box[2], o.box[3], o.box[4] + dy, o.box[5]] }));
  return v;
}

// buildCourt(s, plan, game, tick): tick() is awaited between parts so the work can be spread over frames.
export async function buildCourt(s, plan, game, tick) {
  const info = plan.info, c = plan.court, r = new Rng(info.seed ^ 0x6c8e9cf5), g = s.g;
  const X0 = c.x0, X1 = c.x1, Z0 = c.z0, Z1 = c.z1, D = c.decks, TOP = c.top, H = plan.H, pal = PAL[c.style % PAL.length];
  const CX = plan.cx, CZ = plan.cz, WX = X1 - X0, WZ = Z1 - Z0;
  const festive = game.clock ? game.clock.day <= 3 : true;
  const feature = FEATURES[(info.seed >>> 5) % FEATURES.length];
  const stX = street('x', WZ / 2, H, (Z0 + Z1) / 2), stZ = street('z', WX / 2, H, (X0 + X1) / 2);
  const SD = { n: side(stX, -WZ / 2, 1), s: side(stX, WZ / 2, -1), w: side(stZ, -WX / 2, 1), e: side(stZ, WX / 2, -1) };
  const CLIP = [X0 - 2.5, -0.3, Z0 - 2.5, X1 + 2.5, TOP + 0.3, Z1 + 2.5];

  // ---------------------------------------------------------------- the floor
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', shadeHex(pal.field, 0.8));
  // bands of darker stone every few metres, so the floor reads as paving and not as a sheet
  g.mat('terrazzo', shadeHex(pal.field, 0.56));
  for (let x = CX - 6 * Math.floor((CX - X0 - 1) / 6); x < X1 - 0.6; x += 6) if (Math.abs(x - CX) > 1) g.box(x - 0.16, 0, Z0 + 0.5, x + 0.16, 0.003, Z1 - 0.5, { faces: 'Y' });
  s.flush({ tier: 's' });
  for (let z = CZ - 6 * Math.floor((CZ - Z0 - 1) / 6); z < Z1 - 0.6; z += 6) if (Math.abs(z - CZ) > 1) g.box(X0 + 0.5, 0, z - 0.16, X1 - 0.5, 0.0035, z + 0.16, { faces: 'Y' });
  s.flush({ tier: 's' });
  // the avenue's and the street's runners carry on across, a dark border runs round, and the crossing has its own round of mosaic
  g.mat('pattern', pal.runner); g.box(X0, 0, CZ - 0.85, X1, 0.004, CZ + 0.85, { faces: 'Y' }); s.flush({ tier: 's' });
  g.mat('pattern', mixHex(pal.runner, pal.band, 0.5)); g.box(CX - 0.7, 0, Z0, CX + 0.7, 0.005, Z1, { faces: 'Y' }); s.flush({ tier: 's' });
  g.mat('cast', '#b8914a', { rough: -0.2 });
  for (const dz of [-0.885, 0.85]) g.box(X0, 0, CZ + dz, X1, 0.006, CZ + dz + 0.035, { faces: 'Y' });
  for (const dx of [-0.735, 0.7]) g.box(CX + dx, 0, Z0, CX + dx + 0.035, 0.007, Z1, { faces: 'Y' });
  s.flush({ tier: 's' });
  g.mat('hex', '#58625b');
  g.box(X0, 0, Z0, X1, 0.008, Z0 + 0.5, { faces: 'Y' }); g.box(X0, 0, Z1 - 0.5, X1, 0.008, Z1, { faces: 'Y' }); s.flush({ tier: 's' });
  g.box(X0, 0, Z0 + 0.5, X0 + 0.5, 0.008, Z1 - 0.5, { faces: 'Y' }); g.box(X1 - 0.5, 0, Z0 + 0.5, X1, 0.008, Z1 - 0.5, { faces: 'Y' }); s.flush({ tier: 's' });
  g.mat('mosaic', pal.band); g.lathe(CX, CZ, [[5.2, 0.01], [3.9, 0.01]], { segs: 48 });
  g.mat('cast', '#b8914a', { rough: -0.2 }); g.lathe(CX, CZ, [[5.26, 0.012], [5.2, 0.012]], { segs: 48 }); g.lathe(CX, CZ, [[3.9, 0.012], [3.84, 0.012]], { segs: 48 });
  g.mat('terrazzo', mixHex(pal.field, '#ffffff', 0.25)); g.lathe(CX, CZ, [[3.84, 0.011], [0, 0.011]], { segs: 48 });
  s.flush({ tier: 's' });
  await tick();

  // ---------------------------------------------------------------- the ground storey: plain wall between the lots, a band over them
  const fin = FIN[(c.style * 2 + 1) % FIN.length];
  const blanks = [];                               // plain wall spans, for benches and boards: { sd, a0, a1 }
  for (const k of ['n', 's', 'w', 'e']) {
    const sd = SD[k];
    for (const sp of c.sides[k]) {
      if (sp.kind === 'wall') { if (sp.a1 - sp.a0 > 0.05) { unit(s, sd, sp.a0, sp.a1, { kind: 'blank', fin }); blanks.push({ sd, a0: sp.a0, a1: sp.a1, k }); } }
      else if (sp.kind === 'lot') { g.mat('paint', mixHex(fin.tint, fin.trim, 0.35)); sd.box(g, sp.a0, sp.a1, -0.004, 0.2, LOT_H, H, { faces: 'fy' }); s.flush({ tier: 's' }); }
    }
  }
  // corner posts, so the four walls meet in stone
  g.mat('stone', '#bdb29e');
  for (const x of [X0, X1]) for (const z of [Z0, Z1]) g.box(x - 0.22, 0, z - 0.22, x + 0.22, H, z + 0.22, { bevel: 0.015, aoBottom: 0.7 });
  s.flush({ tier: 's' });
  for (const x of [X0, X1]) for (const z of [Z0, Z1]) s.solid(x - 0.22, 0, z - 0.22, x + 0.22, H, z + 0.22);
  await tick();

  // ---------------------------------------------------------------- the terraces above: a balcony all round on every deck, front doors behind it
  const B = 1.8;
  for (let k = 1; k < D; k++) {
    const y1 = 4 * k, y0 = y1 - 0.6;
    g.mat('plaster', pal.slab);
    g.box(X0, y0, Z0, X1, y1, Z0 + B, { faces: 'yYZ' }); s.flush({ tier: 's', level: k });
    g.box(X0, y0, Z1 - B, X1, y1, Z1, { faces: 'yYz' }); s.flush({ tier: 's', level: k });
    g.box(X0, y0, Z0 + B, X0 + B, y1, Z1 - B, { faces: 'yYX' }); s.flush({ tier: 's', level: k });
    g.box(X1 - B, y0, Z0 + B, X1, y1, Z1 - B, { faces: 'yYx' }); s.flush({ tier: 's', level: k });
    // a brass line and a painted band along the balcony's edge, and brackets under it
    g.mat('paint', pal.band);
    g.box(X0 + B, y0 + 0.2, Z0 + B, X1 - B, y0 + 0.42, Z0 + B + 0.012, { faces: 'Z' }); g.box(X0 + B, y0 + 0.2, Z1 - B - 0.012, X1 - B, y0 + 0.42, Z1 - B, { faces: 'z' });
    g.box(X0 + B, y0 + 0.2, Z0 + B, X0 + B + 0.012, y0 + 0.42, Z1 - B, { faces: 'X' }); g.box(X1 - B - 0.012, y0 + 0.2, Z0 + B, X1 - B, y0 + 0.42, Z1 - B, { faces: 'x' });
    g.mat('cast', '#b08a45');
    g.box(X0 + B, y0 - 0.02, Z0 + B, X1 - B, y0 + 0.02, Z0 + B + 0.03); g.box(X0 + B, y0 - 0.02, Z1 - B - 0.03, X1 - B, y0 + 0.02, Z1 - B);
    g.box(X0 + B, y0 - 0.02, Z0 + B, X0 + B + 0.03, y0 + 0.02, Z1 - B); g.box(X1 - B - 0.03, y0 - 0.02, Z0 + B, X1 - B, y0 + 0.02, Z1 - B);
    s.flush({ tier: 's', level: k });
    g.mat('plaster', shadeHex(pal.slab, 0.88));
    const nbx = Math.round(WX / 5), nbz = Math.round(WZ / 5);
    for (let i = 0; i <= nbx; i++) { const x = X0 + 0.4 + (WX - 0.8) * i / nbx; g.box(x - 0.12, y0 - 0.4, Z0, x + 0.12, y0, Z0 + B - 0.2, { bevel: 0.02 }); g.box(x - 0.12, y0 - 0.4, Z1 - B + 0.2, x + 0.12, y0, Z1, { bevel: 0.02 }); }
    for (let i = 1; i < nbz; i++) { const z = Z0 + WZ * i / nbz; g.box(X0, y0 - 0.4, z - 0.12, X0 + B - 0.2, y0, z + 0.12, { bevel: 0.02 }); g.box(X1 - B + 0.2, y0 - 0.4, z - 0.12, X1, y0, z + 0.12, { bevel: 0.02 }); }
    s.flush({ tier: 's', level: k });
    await tick();
    // everything else on this deck is drawn lifted
    const vs = lifted(s, y1, k);
    g.push(); g.move(0, y1, 0);
    try {
      railing(vs, [[X0 + B, Z0 + B], [X1 - B, Z0 + B], [X1 - B, Z1 - B], [X0 + B, Z1 - B], [X0 + B, Z0 + B]], 0, { h: 1.05, tint: pal.rail, posts: 2.2 });
      for (const kk of ['n', 's', 'w', 'e']) {
        const sd = SD[kk], lo = (kk === 'n' || kk === 's' ? X0 : Z0) + 0.3, hi = (kk === 'n' || kk === 's' ? X1 : Z1) - 0.3;
        let a = lo, i = r.i(0, 8);
        while (hi - a > 0.05) {
          let w = r.f(3.8, 5.4); if (hi - (a + w) < 3.0) w = hi - a;
          pilaster(vs, sd, a, H);
          unit(vs, sd, a, a + w, { fin: (i * 4 + c.style + k) % FIN.length, win: true, plants: r.chance(0.45), lit: r.chance(0.72), lamp: false, knock: false, spots: false, sillPots: r.chance(0.5) });
          a += w; i++;
          await tick();
        }
        pilaster(vs, sd, hi, H);
        await tick();
        // pots along the railing, a chair or two
        const n = Math.round((hi - lo) / 7);
        for (let q = 0; q < n; q++) { const aa = lo + (hi - lo) * (q + r.f(0.2, 0.8)) / n; const p = sd.xz(aa, -(B - 0.35)); prop(vs, 'court.pot', p[0], 0, p[1], r.f(0, 6), { kind: ['broad', 'fern', 'flower', 'fine'][r.i(0, 3)], size: r.f(0.7, 1.2), pot: ['#a3563a', '#3d6f8a', '#d9c7a6', '#6b7a3a'][r.i(0, 3)], seed: q % 4 }, { noCollide: true, noSpots: true }); }
      }
    } finally { g.pop(); }
    await tick();
  }
  // lanterns hung under the first balcony for Booking Day
  if (festive) {
    const y = 3.34, sag = 0.3;
    const string = (ax, az, bx, bz, i) => {
      const P = (t) => [ax + (bx - ax) * t, y - sag * 4 * t * (1 - t), az + (bz - az) * t];
      const line = []; for (let q = 0; q <= 8; q++) line.push(P(q / 8));
      g.mat('weave', '#d8cdb8'); g.tube(line, 0.005, { segs: 4, caps: false }); s.flush({ tier: 's', cast: false });
      for (let q = 0; q < 3; q++) { const p = P((q + 0.5) / 3); prop(s, 'streets.lantern', p[0], p[1], p[2], r.f(0, 3), { c: LANTERN[(i * 3 + q) % LANTERN.length], r: q % 2 ? 0.11 : 0.14 }, { tier: 's', cast: false }); }
    };
    const nx = Math.round((WX - 2 * B) / 6), nz = Math.round((WZ - 2 * B) / 6); let i = 0;
    for (let q = 0; q < nx; q++) { const xa = X0 + B + (WX - 2 * B) * q / nx, xb = X0 + B + (WX - 2 * B) * (q + 1) / nx; string(xa, Z0 + B - 0.1, xb, Z0 + B - 0.1, i++); string(xa, Z1 - B + 0.1, xb, Z1 - B + 0.1, i++); }
    for (let q = 0; q < nz; q++) { const za = Z0 + B + (WZ - 2 * B) * q / nz, zb = Z0 + B + (WZ - 2 * B) * (q + 1) / nz; string(X0 + B - 0.1, za, X0 + B - 0.1, zb, i++); string(X1 - B + 0.1, za, X1 - B + 0.1, zb, i++); }
    for (const p of [[X0 + B, Z0 + B], [X1 - B, Z0 + B], [X1 - B, Z1 - B], [X0 + B, Z1 - B]]) s.light({ at: [p[0], 3.0, p[1]], color: LANTERN[i++ % LANTERN.length], power: 1.6, range: 6, radius: 0.15, clip: CLIP, lamp: true, nospec: true });
  }
  // the streets' names on the balcony's edge, facing the court
  {
    const yN = 3.71, o = { h: 0.3, glow: 2.2 };
    const L = (text, x, z, face, w) => sign(s, { kind: 'letters', text, font: 'caps', palette: ['#ffe3a8'] }, x, yN, z, Object.assign({ face, w: Math.min(w, 0.36 * text.length + 0.4) }, o));
    L(info.avenue.toUpperCase(), X0 + B + 0.014, CZ, 'X', 7); L(info.avenue.toUpperCase(), X1 - B - 0.014, CZ, 'x', 7);
    L(info.street.toUpperCase(), CX, Z0 + B + 0.014, 'Z', 5.6); L(info.street.toUpperCase(), CX, Z1 - B - 0.014, 'z', 5.6);
  }
  await tick();

  // ---------------------------------------------------------------- the luminous ceiling
  {
    const Y = TOP, LV = D - 1, NX = Math.max(4, Math.round(WX / 4)), NZ = Math.max(3, Math.round(WZ / 4)), cw = WX / NX, cd = WZ / NZ;
    g.mat('plaster', pal.slab);
    g.box(X0, Y - 0.85, Z0, X1, Y, Z0 + 0.3, { faces: 'yZ' }); g.box(X0, Y - 0.85, Z1 - 0.3, X1, Y, Z1, { faces: 'yz' }); s.flush({ tier: 's', level: LV });
    g.box(X0, Y - 0.85, Z0 + 0.3, X0 + 0.3, Y, Z1 - 0.3, { faces: 'yX' }); g.box(X1 - 0.3, Y - 0.85, Z0 + 0.3, X1, Y, Z1 - 0.3, { faces: 'yx' }); s.flush({ tier: 's', level: LV });
    g.mat('paint', '#efe5d1');
    for (let i = 1; i < NX; i++) { const x = X0 + i * cw; g.box(x - 0.14, Y - 0.5, Z0 + 0.3, x + 0.14, Y, Z1 - 0.3, { faces: 'yxX' }); }
    s.flush({ tier: 's', level: LV });
    for (let j = 1; j < NZ; j++) { const z = Z0 + j * cd; g.box(X0 + 0.3, Y - 0.5, z - 0.14, X1 - 0.3, Y, z + 0.14, { faces: 'yzZ' }); }
    s.flush({ tier: 's', level: LV });
    const ang = r.f(0, Math.PI), ca = Math.cos(ang), sa = Math.sin(ang);
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NZ; j++) {
        const t = (i + 0.5) / NX - 0.5, u = (j + 0.5) / NZ - 0.5, wash = Math.exp(-Math.pow((t * ca + u * sa) * 2.4, 2) / 0.5);
        const col = mixHex(pal.ceilA, pal.ceilB, 0.8 * wash);
        g.mat('diffuser', col, { emissive: 3.0, lamp: true });
        g.box(X0 + i * cw + (i ? 0.14 : 0.3), Y - 0.1, Z0 + j * cd + (j ? 0.14 : 0.3), X0 + (i + 1) * cw - (i === NX - 1 ? 0.3 : 0.14), Y - 0.08, Z0 + (j + 1) * cd - (j === NZ - 1 ? 0.3 : 0.14), { faces: 'y' });
      }
      s.flush({ tier: 's', level: LV });
      if (i % 3 === 2) await tick();
    }
    // its light: an overcast day on the floor, and big soft downlights that follow the lamp clock
    s.ambient({ box: [X0 + 0.6, 0, Z0 + 0.6, X1 - 0.6, TOP, Z1 - 0.6], sky: pal.sky, ground: pal.ground, power: 2.4, skylit: true, lamp: true, soft: 2.2 });
    s.ambient({ box: [X0 + 0.6, 0, Z0 + 0.6, X1 - 0.6, TOP, Z1 - 0.6], sky: '#ffd8b0', ground: '#c9a57c', power: 0.35, soft: 2.2 });
    const nlx = WX > 50 ? 3 : 2, pw = Math.min(420, 0.42 * TOP * TOP + 10);
    for (let i = 0; i < nlx; i++) for (const lz of [Z0 + WZ * 0.3, Z0 + WZ * 0.72]) {
      s.light({ at: [X0 + WX * (i + 0.5) / nlx, Y - 0.5, lz], type: 'spot', dir: [0, -1, 0], cone: [72, 38], color: pal.sky, power: pw, range: TOP + 11, shadow: true, radius: 2.2, clip: CLIP, lamp: true });
    }
  }
  await tick();

  // ---------------------------------------------------------------- walkways: a ring inside the walls, a ring round the middle, four ways in
  const ri = 2.6, ro = 5.9;
  const R1 = [X0 + ri, Z0 + ri, X1 - ri, Z1 - ri], R2 = [CX - ro, Math.max(Z0 + ri + 2.2, CZ - ro), CX + ro, Math.min(Z1 - ri - 2.2, CZ + ro)];
  const rect = (b, step, extraX, extraZ) => {
    const xs = [], zs = [];
    for (let i = 0, n = Math.max(1, Math.round((b[2] - b[0]) / step)); i <= n; i++) xs.push(b[0] + (b[2] - b[0]) * i / n);
    for (let i = 0, n = Math.max(1, Math.round((b[3] - b[1]) / step)); i <= n; i++) zs.push(b[1] + (b[3] - b[1]) * i / n);
    const merge = (arr, ex) => { const a = arr.concat(ex).sort((p, q) => p - q), out = []; for (const v of a) if (!out.length || v - out[out.length - 1] > 0.9) out.push(v); else if (ex.indexOf(v) >= 0) out[out.length - 1] = v; return out; };
    const X = merge(xs, extraX), Z = merge(zs, extraZ);
    s.path(X.map((x) => [x, b[1]]), { width: 1.8 }); s.path(X.map((x) => [x, b[3]]), { width: 1.8 });
    s.path(Z.map((z) => [b[0], z]), { width: 1.8 }); s.path(Z.map((z) => [b[2], z]), { width: 1.8 });
  };
  await tick();
  rect(R1, 4, [CX], [CZ]); rect(R2, 4, [CX], [CZ]);
  s.path([[X1, CZ], [R1[2], CZ], [R2[2], CZ]], { width: 2.4 }); s.path([[X0, CZ], [R1[0], CZ], [R2[0], CZ]], { width: 2.4 });
  s.path([[CX, Z1], [CX, R1[3]], [CX, R2[3]]], { width: 2.0 }); s.path([[CX, Z0], [CX, R1[1]], [CX, R2[1]]], { width: 2.0 });

  // ---------------------------------------------------------------- the middle
  const say = (who, lines) => (gm) => read(gm, who, lines);
  if (feature === 'fountain') {
    g.mat('stone', '#c9bda6'); g.lathe(CX, CZ, [[2.3, 0], [2.3, 0.42], [2.12, 0.46], [2.0, 0.46], [1.96, 0.22], [0, 0.2]], { segs: 32 });
    g.mat('mosaic', pal.band); g.lathe(CX, CZ, [[1.96, 0.22], [0, 0.2]], { segs: 32 });
    s.flush({ tier: 's', cast: true }); s.post(CX, CZ, 2.3, 0, 0.46);
    s.glass(CX - 1.9, 0.36, CZ - 1.9, CX + 1.9, 0.36, CZ + 1.9, { tint: '#bfe6e0', opacity: 0.22, rough: 0.02 });
    prop(s, 'court.fountain', CX, 0.2, CZ, 0, {}, { noCollide: true });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; bench(s, CX + Math.sin(a) * 3.3, CZ + Math.cos(a) * 3.3, a, { tags: ['court'], w: 1.6 }); }
    s.loop('fountain', CX, 0.8, CZ, { vol: 0.5, radius: 18 });
    s.interact({ x: CX + 2.5, y: 0.9, z: CZ, radius: 1.6, prompt: 'Look into the basin', onUse: say(info.name + ' Court', ['The water goes round. It has been going round since the block was fitted out, and it will be drunk before the year ends.', 'Somebody has dropped a button in. Nobody has taken it out.']) });
  } else if (feature === 'bandstand') {
    g.mat('planks', '#a8794f'); g.lathe(CX, CZ, [[3.1, 0], [3.1, 0.36], [3.0, 0.4], [0, 0.4]], { segs: 8 });
    g.mat('paint', pal.rail);
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; g.tube([[CX + Math.sin(a) * 2.8, 0.4, CZ + Math.cos(a) * 2.8], [CX + Math.sin(a) * 2.8, 3.0, CZ + Math.cos(a) * 2.8]], 0.05, { segs: 8 }); }
    g.mat('paint', pal.band); g.lathe(CX, CZ, [[3.3, 3.0], [3.2, 3.12], [0.3, 3.7], [0.1, 3.9]], { segs: 8 });
    g.mat('paint', '#efe5d1'); g.lathe(CX, CZ, [[0.3, 3.68], [3.2, 3.1], [3.3, 2.98]], { segs: 8 });
    s.flush({ tier: 's', cast: true });
    s.solid(CX - 2.2, 0, CZ - 2.2, CX + 2.2, 0.4, CZ + 2.2, { surf: 'wood' });
    s.light({ at: [CX, 2.9, CZ], color: '#ffd9a0', power: 5, range: 7, clip: CLIP, lamp: true });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; s.spot('perform', CX + Math.sin(a) * 1.2, 0.4, CZ + Math.cos(a) * 1.2, a, { tags: [['flute', 'drum', 'sing'][k], 'court', 'focus'] }); }
    prop(s, 'court.stand', CX + 0.4, 0.4, CZ + 1.9, 0, {}, { noCollide: true });
    for (let k = 0; k < 10; k++) { const a = -1.2 + k * 0.27, rr = 5.0 + (k % 2) * 0.9; const x = CX + Math.sin(a) * rr, z = CZ + Math.cos(a) * rr; prop(s, 'court.chair', x, 0, z, a + Math.PI, { wood: '#6b4a2f', back: 'hoop' }, { noSpots: true }); s.spot('sit', x, 0.45, z, a + Math.PI, { tags: ['court', 'listen'] }); }
    s.interact({ x: CX, y: 1.2, z: CZ + 3.4, radius: 1.8, prompt: 'Read the bandstand card', onUse: say('The bandstand', ['"Evenings from half past five. Anyone may play. Nobody may play loudly."', 'Under it, in another hand: "The drum is loud by nature. Take it up with the drum."']) });
  } else if (feature === 'garden') {
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; planter(s, CX + Math.sin(a) * 2.5, 0, CZ + Math.cos(a) * 2.5, { w: 2.4, d: 2.4, h: 0.6, plants: ['broad', 'flower', 'fern', 'herbs'][k], tint: '#a99c86', density: 26 }); }
    g.mat('cast', '#2f3a36'); g.tube([[CX, 0, CZ], [CX, 4.4, CZ]], [0.09, 0.06], { segs: 10 });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.tube([[CX, 4.2, CZ], [CX + Math.sin(a) * 0.9, 4.5, CZ + Math.cos(a) * 0.9], [CX + Math.sin(a) * 1.1, 4.2, CZ + Math.cos(a) * 1.1]], 0.025, { segs: 6 }); }
    g.mat('diffuser', '#ffe9c0', { emissive: 7, lamp: true }); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.ball(CX + Math.sin(a) * 1.1, 4.05, CZ + Math.cos(a) * 1.1, 0.17, 0.17, 0.17, { segs: 12, rings: 8 }); }
    s.flush({ tier: 's', cast: true }); s.post(CX, CZ, 0.12, 0, 4.4);
    s.light({ at: [CX, 4.0, CZ], color: '#ffe0b0', power: 16, range: 12, clip: CLIP, lamp: true, shadow: true });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; bench(s, CX + Math.sin(a) * 4.3, CZ + Math.cos(a) * 4.3, a, { tags: ['court'], w: 1.8 }); }
    s.interact({ x: CX + 1.2, y: 1.2, z: CZ + 1.2, radius: 1.8, prompt: 'Read the planters’ card', onUse: say(info.name + ' Court', ['"These four beds belong to the block. Pick what is labelled. Water what is not."', 'The herbs have been picked hard on one side, the side nearest the hall.']) });
  } else if (feature === 'market') {
    let k = 0;
    for (const sx of [-1, 1]) for (const dz of [-2.6, 0, 2.6]) {
      const x = CX + sx * 2.3, z = CZ + dz, yaw = sx > 0 ? Math.PI / 2 : -Math.PI / 2, fx = Math.sin(yaw), fz = Math.cos(yaw);
      prop(s, 'station.stall', x, 0, z, yaw, { w: 2.2, body: [pal.stall, '#b98a5a', shadeHex(pal.stall, 1.3)][k % 3], top: '#b98a5a' });
      for (let q = 0; q < 3; q++) prop(s, q % 2 ? 'crock' : 'crate', x + fx * 0.05 - fz * (q - 1) * 0.6, 0.92, z + fz * 0.05 + fx * (q - 1) * 0.6, r.f(0, 3), q % 2 ? { glaze: ['#e9e2d0', '#a3563a', '#3d6f8a'][r.i(0, 2)], h: 0.22, r: 0.1 } : { w: 0.42, h: 0.2, d: 0.3, wood: '#a8794f' }, { noCollide: true });
      s.spot('counter', x - fx * 0.75, 0, z - fz * 0.75, yaw, { tags: ['stall', 'court'] });
      s.spot('customer', x + fx * 1.15, 0, z + fz * 1.15, yaw + Math.PI, { tags: ['shop', 'court'] });
      const lines = STALL_LINES[(k + c.style) % STALL_LINES.length];
      s.interact({ x: x + fx * 0.9, y: 1.0, z: z + fz * 0.9, radius: 1.5, prompt: 'Look over the stall', onUse: say('A stall in ' + info.name + ' Court', lines) });
      k++;
    }
    s.light({ at: [CX, 3.0, CZ], color: '#ffd9a0', power: 4, range: 8, clip: CLIP, lamp: true, nospec: true });
  } else if (feature === 'games') {
    for (let k = 0; k < 4; k++) {
      const a = k * Math.PI / 2 + Math.PI / 4, x = CX + Math.sin(a) * 2.6, z = CZ + Math.cos(a) * 2.6;
      prop(s, 'table', x, 0, z, a, { w: 0.9, h: 0.72, round: true, legs: 'pedestal', wood: '#6b4a2f', top: k % 2 ? '#d8c8a8' : '#3a2a20' });
      for (const sg of [-1, 1]) { const cx2 = x + Math.cos(a) * sg * 0.78, cz2 = z - Math.sin(a) * sg * 0.78, yaw = a + (sg > 0 ? -Math.PI / 2 : Math.PI / 2); prop(s, 'court.chair', cx2, 0, cz2, yaw, { wood: '#6b4a2f', back: 'slat' }, { noSpots: true }); s.spot('sit', cx2, 0.45, cz2, yaw, { tags: ['court', 'game'] }); }
    }
    chalk(s, stX, CX - 1.4, CZ - (Z0 + Z1) / 2 - 0.2, { flip: r.chance(0.5) });
    s.interact({ x: CX, y: 1.0, z: CZ + 2.0, radius: 1.8, prompt: 'Look at the boards', onUse: say(info.name + ' Court', ['Four tables, each with a board inlaid in the top. Two of the games are older than the drum.', 'The fourth has a card: "Adjourned. White to move. Do not help."']) });
  } else {
    for (const dz of [-1.7, 1.7]) {
      prop(s, 'hollow.longtable', CX, 0, CZ + dz, Math.PI / 2, { len: 7, top: '#8a6240', leg: '#5a3a26', cloth: pal.band });
      for (const sg of [-1, 1]) { prop(s, 'hollow.longbench', CX, 0, CZ + dz + sg * 0.72, Math.PI / 2, { len: 7, wood: '#7a5233' }, { noSpots: true }); for (let q = 0; q < 8; q++) s.spot('sit', CX - 3.1 + q * 0.88, 0.45, CZ + dz + sg * 0.72, sg > 0 ? Math.PI : 0, { tags: ['court', 'eat', 'table'] }); }
    }
    s.interact({ x: CX + 3.9, y: 1.0, z: CZ, radius: 1.8, prompt: 'Read the card on the table', onUse: say(info.name + ' Court', ['"Overflow from the hall. Bring your bowl back in. The lids are counted."', 'Somebody has left a lid behind anyway, upside down, with a spoon in it.']) });
  }
  await tick();

  // ---------------------------------------------------------------- along the walls: benches, the tap, the board; in the corners, planters and talk
  let tapped = false, boarded = false;
  for (const b of blanks) {
    const len = b.a1 - b.a0; if (len < 2.4) continue;
    const mid = (b.a0 + b.a1) / 2;
    if (!boarded && len > 3.2) {
      boarded = true;
      const p = b.sd.pt(mid, 1.62, -0.02);
      sign(s, { kind: 'board', title: info.name, lines: ['decks ' + info.d0 + ' to ' + info.d1 + '|' + info.g.toFixed(2) + ' g', 'Ring ' + info.ringName + '|' + info.bandName, 'the hall|' + info.cook, 'today|' + info.dish[0]], palette: ['#22362b', '#f3e6c8', '#d6a640'] }, p[0], p[1], p[2], { face: b.sd.face, w: 1.5, h: 1.0 });
      const ip = b.sd.pt(mid, 1.5, -0.7);
      s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.7, prompt: 'Read the court board', onUse: say(info.name, [info.name + ': ' + info.address + ', ' + info.g.toFixed(2) + ' of a g, about ' + Math.round(info.people / 100) * 100 + ' people.', info.pride, 'The hall is ' + info.hall + '. Today: ' + info.dish[0] + '.']) });
      const q = b.sd.xz(mid + 0.5, -0.9); s.spot('stand', q[0], 0, q[1], b.sd.yaw + Math.PI, { tags: ['read', 'board', 'court'] });
    } else if (!tapped) { tapped = true; drinkingTap(s, b.sd, mid); }
    else { const p = b.sd.xz(mid, -0.45); bench(s, p[0], p[1], b.sd.yaw, { tags: ['court'], w: Math.min(1.8, len - 0.6) }); }
  }
  await tick();
  const corners = [[X0 + 1.5, Z0 + 1.5], [X1 - 1.5, Z0 + 1.5], [X1 - 1.5, Z1 - 1.5], [X0 + 1.5, Z1 - 1.5]];
  corners.forEach((p, i) => { planter(s, p[0], 0, p[1], { w: 1.8, d: 1.8, h: 0.6, plants: ['broad', 'fern', 'flower', 'broad'][(i + c.style) % 4], tint: '#a99c86', density: 22 }); });
  // people standing about in the four quarters, children in one of them
  const quarters = [[(R1[0] + R2[0]) / 2, (R1[1] + R2[1]) / 2], [(R1[2] + R2[2]) / 2, (R1[1] + R2[1]) / 2], [(R1[2] + R2[2]) / 2, (R1[3] + R2[3]) / 2], [(R1[0] + R2[0]) / 2, (R1[3] + R2[3]) / 2]];
  quarters.forEach((q, i) => {
    const n = 3 + r.i(0, 2), rad = 0.6 + n * 0.05, ox = r.f(-1.5, 1.5), oz = r.f(-0.6, 0.6);
    for (let k = 0; k < n; k++) { const t = k / n * Math.PI * 2 + 0.5, px = q[0] + ox + Math.cos(t) * rad, pz = q[1] + oz + Math.sin(t) * rad; s.spot(i === 2 ? 'play' : 'chat', px, 0, pz, Math.atan2(q[0] + ox - px, q[1] + oz - pz), { tags: i === 2 ? ['kids', 'run', 'court'] : ['court'] }); }
  });
  // a pillar of notices near the avenue's spinward mouth
  {
    const px = X1 - 4.2, pz = CZ + 2.9;
    const notes = [NOTICES[r.i(0, NOTICES.length - 1)], NOTICES[r.i(0, NOTICES.length - 1)], NOTICES[r.i(0, NOTICES.length - 1)]];
    const fill = (t) => t.replace('{block}', plan.exits.spin.name || 'the next block').replace('{avenue}', info.avenue);
    noticePillar(s, px, pz, notes.map((nn) => ({ kind: 'notice', title: nn[0], lines: nn.slice(1).map(fill) })), { tint: pal.rail });
    s.interact({ x: px, y: 1.4, z: pz, radius: 1.7, prompt: 'Read the notice pillar', onUse: say('The notice pillar', notes.map((nn) => nn[0] + ': ' + nn.slice(1).map(fill).join(' '))) });
    s.spot('stand', px - 0.9, 0, pz, Math.PI / 2, { tags: ['read', 'court'] });
  }

  // ---------------------------------------------------------------- the zone, and the court as something seen through several decks
  s.zoneBox({ id: info.key + ':court', place: 'city-court', box: [X0, -0.5, Z0, X1, TOP, Z1], name: info.name + ' Court', sub: info.address + ' · ' + D + ' decks tall', ambience: 'court', reverb: 'hall',
    env: { exposure: 0.82, bloom: 0.07, warmth: 0.2 }, headroom: Math.max(3, TOP - 1), sky: true, skyTop: TOP + 0.5, cell: info.key });
  s.court(X0 - 3, Z0 - 3, X1 + 3, Z1 + 3);
  void note;
  return { feature };
}
