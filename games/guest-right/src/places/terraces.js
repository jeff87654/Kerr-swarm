// The court terraces: walkways 3.2 m wide round Wick Court's void on decks 17 to 21, planted to overflowing. Flats open
// onto them with doors and, rarest of things in a drum, windows. Five flats' interiors belong to other builders; their
// doorways are left open here (see FLATS below).
import { floor, wall, lamp } from '../world/kit.js';
import { railing, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { COURT, CPAL, LANTERN_COLS, lvOf, fy, seatUse, lanternMesh } from './court.js';

// Doorways left open for flats other builders furnish: deck y, side, centre along the wall, place id, plate.
const FLATS = [
  { y: 12, side: 'S', at: 9, id: 'flat-guest', plate: SIGNS['flat-guest.plate'] },
  { y: 12, side: 'S', at: -9, id: 'flat-family', plate: SIGNS['flat-family.plate'] },
  { y: 4, side: 'S', at: 9, id: 'flat-oona', plate: { text: '17 · 4', sub: 'Oona · lamp-painter' } },
  { y: 8, side: 'N', at: -6, id: 'flat-marit', plate: SIGNS['flat-marit.plate'] },
  { y: 16, side: 'E', at: 4, id: 'flat-elders', plate: { text: '20 · 24', sub: 'Quist · rooms let' } },
];
// Door centres along each wall, and which way the flat's window lies from its door.
const DOORS = {
  S: [[29.4, -1], [23.5, -1], [17.5, -1], [9, 1], [-9, -1], [-17.5, 1], [-23.5, 1], [-29.4, 1]],
  W: [[16, 1], [10, 1], [4, 1], [-4, 1], [-10, 1], [-15.6, 1]],
  N: [[-24, 1], [-15, 1], [-6, 1], [3, 1], [12, 1], [21, 1]],
  E: [[-15.6, 1], [-10, 1], [-4, 1], [4, 1], [10, 1], [16, 1]],
};
const DECKCOL = { 4: '#2b6b69', 8: '#c98a2e', 12: '#b0563a', 16: '#3a4a7a', 20: '#4f7a3e' };
const DOORCOL = ['#7a2f2a', '#2f5d50', '#33406e', '#c98a2e', '#5b4060', '#2b6b69', '#8a3b2a', '#3d5a3a', '#a24a5a', '#1f3b4d', '#b8862e', '#6e2f3f'];
const NAMES = ['Okonjo', 'Lindgren', 'Ilunga', 'Nwosu', 'Batista', 'Achterberg', 'Sato', 'Farrow', 'Nakamura', 'Bakker', 'Rasmussen', 'Oduya', 'Reyes', 'Tamm',
  'Adebayo', 'Castellane', 'Erdem', 'Danso', 'Lomu', 'Tagaloa', 'Mwangi', 'Kurt', 'Sorensen', 'Halloway', 'Fane', 'Ferro', 'Brandvold', 'Brennan', 'Oyelaran',
  'Tran', 'Osei', 'Lindqvist', 'Mbaye', 'Adeyemi', 'Vos', 'Kowalczyk', 'Nwachukwu', 'Mendel', 'Rautio', 'Aaltonen', 'Begum', 'Carvalho', 'Dahl', 'Eze', 'Fontaine',
  'Gallo', 'Haddad', 'Ishikawa', 'Kamau', 'Larsen', 'Moreau', 'Obi', 'Petrov', 'Quaye', 'Rossi', 'Silva', 'Tanaka', 'Uddin', 'Varga', 'Wong', 'Yilmaz', 'Abara',
  'Bianchi', 'Chen', 'Diallo', 'Fofana', 'Grieg', 'Ibarra', 'Juma', 'Koch', 'Lund', 'Mensah', 'Novak', 'Okafor', 'Pereira', 'Rahman', 'Sauer', 'Tembo', 'Ueda'];
const SUBS = ['', '', '', 'and family', 'rooms let', 'knock loudly', '', 'and Nan', '', 'Margin flat · guest', 'please knock', '', 'two flats knocked through'];
const KNOCK = [
  'Nobody answers. A chalked note on the door says: at the hall.',
  'A voice inside says they are in the bath, and to come back after.',
  'Someone inside asks where you slept, and whether you have eaten. You say yes to both. They seem relieved.',
  'Nobody answers. On the other side of the door a kettle is coming to the boil.',
  'A child opens the door, looks at you for a while, and closes it again.',
  'Nobody in. A note on the mat: Gone up to the Hollow. Water the basil if it looks sad.',
  'Nobody answers. Somebody in there is practising a flute, slowly, and stops to listen.',
];

export const place = {
  id: 'terraces', name: 'The court terraces', order: 31,
  build(game) {
    const W = game.world;
    const f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('terraces', f);
    const g = s.g;
    const { x0: X0, x1: X1, z0: Z0, z1: Z1 } = COURT;
    const TW = COURT.tw, XO = X1 + TW, ZS = Z1 + TW, ZN = Z0 - TW;      // outer lines: x = ±31.2, z = 23.2 and -17.2
    const r = new Rng('terraces');
    let nameI = 0;
    const flatAt = (y, side, at) => FLATS.find((q) => q.y === y && q.side === side && Math.abs(q.at - at) < 0.01);
    const plateOf = (p) => ({ kind: 'plate', text: p.text, lines: p.sub ? [p.sub] : (p.lines || []) });

    for (const L of COURT.decks) {
      const deck = 16 + L / 4, lv = lvOf(L), hasN = L >= COURT.hallTop, yC = L === 20 ? COURT.top : L + 3.55, H = yC - L;
      const zA = hasN ? ZN : Z0;               // where the east and west walkways begin
      const col = DECKCOL[L];
      const CLIPT = [-XO - 0.1, L - 0.2, ZN - 0.1, XO + 0.1, yC + 0.1, ZS + 0.1];
      const reserved = FLATS.filter((q) => q.y === L).map((q) => q.plate && q.plate.text);
      let num = 0;
      const nextNum = () => { do { num++; } while (reserved.indexOf(deck + ' · ' + num) >= 0); return deck + ' · ' + num; };

      // ---------------------------------------------------------------- walkway floors and ceilings
      const rects = [['E', X1, zA, XO, ZS], ['W', -XO, zA, X0, ZS], ['S', X0, Z1, X1, ZS]];
      if (hasN) rects.push(['N', X0, ZN, X1, Z0]);
      for (const q of rects) {
        floor(s, q[1], q[2], q[3], q[4], L, 'tile', '#b9764f', { level: lv });
        const nX = Math.ceil((q[3] - q[1]) / 16), nZ = Math.ceil((q[4] - q[2]) / 16);
        for (let i = 0; i < nX; i++) for (let j = 0; j < nZ; j++) {
          const a0 = q[1] + (q[3] - q[1]) * i / nX, a1 = q[1] + (q[3] - q[1]) * (i + 1) / nX, b0 = q[2] + (q[4] - q[2]) * j / nZ, b1 = q[2] + (q[4] - q[2]) * (j + 1) / nZ;
          g.mat('paint', '#ece0c8'); g.box(a0, yC, b0, a1, yC + 0.38, b1, { faces: 'yY' });
          s.flush({ tier: 's', cast: true, level: lv });
        }
        s.solid(q[1], yC, q[2], q[3], yC + 0.45, q[4]);
      }
      // beams across the walkways, a cable tray along the wall side
      g.mat('wood', '#5a3d28');
      for (let z = zA + 1.2; z < ZS - 0.5; z += 2.4) { g.box(X1 + 0.1, yC - 0.2, z - 0.07, XO - 0.16, yC, z + 0.07, { faces: 'yzZ' }); g.box(-XO + 0.16, yC - 0.2, z - 0.07, X0 - 0.1, yC, z + 0.07, { faces: 'yzZ' }); }
      s.flush({ tier: 's', level: lv });
      for (let x = X0 + 1.2; x < X1 - 0.5; x += 2.4) { g.box(x - 0.07, yC - 0.2, Z1 + 0.1, x + 0.07, yC, ZS - 0.16, { faces: 'yxX' }); if (hasN) g.box(x - 0.07, yC - 0.2, ZN + 0.16, x + 0.07, yC, Z0 - 0.1, { faces: 'yxX' }); if ((x - X0) % 16 < 2.4) s.flush({ tier: 's', level: lv }); }
      s.flush({ tier: 's', level: lv });

      // ---------------------------------------------------------------- the slab edge at the void: a painted band with a deck stripe
      const bands = [[X1 - 0.22, X1 + 0.12, Z0 - 0.12, Z1 + 0.12], [X0 - 0.12, X0 + 0.22, Z0 - 0.12, Z1 + 0.12], [X0 - 0.12, X1 + 0.12, Z1 - 0.22, Z1 + 0.12]];
      if (hasN) bands.push([X0 - 0.12, X1 + 0.12, Z0 - 0.12, Z0 + 0.22]);
      bands.forEach((b, i) => {
        const yb = (i === 3 && L === 8) ? COURT.hallTop : L - 0.6;
        const long = Math.max(b[1] - b[0], b[3] - b[2]); const nseg = Math.ceil(long / 16);
        for (let k = 0; k < nseg; k++) {
          const alongX = b[1] - b[0] > b[3] - b[2];
          const a0 = (alongX ? b[0] : b[2]) + long * k / nseg, a1 = (alongX ? b[0] : b[2]) + long * (k + 1) / nseg;
          const B = (y0, y1, grow, mat, tint, faces) => { g.mat(mat, tint); if (alongX) g.box(a0, y0, b[2] - grow, a1, y1, b[3] + grow, { faces }); else g.box(b[0] - grow, y0, a0, b[1] + grow, y1, a1, { faces }); };
          B(yb, L + 0.1, 0, 'paint', '#b4603f', 'xXzZy');
          B(L - 0.32, L - 0.2, 0.012, 'paint', col, alongX ? 'zZ' : 'xX');
          B(yb - 0.06, yb + 0.05, 0.05, 'paint', CPAL.cream, 'xXzZy');
          B(L + 0.04, L + 0.12, 0.03, 'paint', CPAL.cream, 'xXzZ'); B(L + 0.118, L + 0.121, 0.03, 'tile', '#9a5638', 'Y');
          s.flush({ tier: 's', level: lv });
        }
        s.solid(b[0], yb, b[2], b[1], L + 0.1, b[3]);
      });

      // ---------------------------------------------------------------- rails on the void side, with planters hung over them
      const gapsE = [[Z1, 12.5], [11.9, 4.6], [4.0, -4.0], [-4.6, -8.9], [-9.5, Z0]];
      const segs = [];
      for (const q of gapsE) { segs.push([[X1 + 0.02, q[0]], [X1 + 0.02, q[1]]]); }
      for (const q of gapsE) { if (q[0] <= 13) segs.push([[X0 - 0.02, q[0]], [X0 - 0.02, q[1]]]); }
      segs.push([[X0 - 0.02, 13], [X0 - 0.02, 12.5]]);
      for (const q of [[-21, -17.55], [-17.05, -3.5], [-3.0, 3.0], [3.5, 17.05], [17.55, 24.2], [24.8, X1]]) segs.push([[q[0], Z1 + 0.02], [q[1], Z1 + 0.02]]);
      if (hasN) for (const q of [[X0, -21.3], [-20.7, -7.3], [-6.7, 6.7], [7.3, 20.7], [21.3, X1]]) segs.push([[q[0], Z0 - 0.02], [q[1], Z0 - 0.02]]);
      for (const sg of segs) {
        const [a, b] = sg; if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 0.2) continue;
        railing(s, [a, b], L + 0.1, { tint: CPAL.teal, rail: '#7a5233', h: 1.0, level: lv });
        // planters hooked over the rail on the void side, trailing
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(len / 2.6);
        const dx = (b[0] - a[0]) / len, dz = (b[1] - a[1]) / len;
        const ox = Math.abs(dx) < 0.5 ? (a[0] > 0 ? -1 : 1) : 0, oz = Math.abs(dz) < 0.5 ? (a[1] > 0 ? -1 : 1) : 0;     // toward the void
        for (let i = 0; i < n; i++) {
          if (r.chance(0.18)) continue;
          // a trough on brackets on the slab's face, below the rail, overflowing
          const t = (i + 0.5) / n, cx = a[0] + (b[0] - a[0]) * t + ox * 0.37, cz = a[1] + (b[1] - a[1]) * t + oz * 0.37, w = r.f(0.9, 1.4);
          const hx = Math.abs(dx) * w / 2 + Math.abs(ox) * 0.13, hz = Math.abs(dz) * w / 2 + Math.abs(oz) * 0.13, yt = L - 0.14;
          g.mat('paint', r.pick(['#a3563a', '#2b6b69', '#c98a2e', '#7a2f2a', '#3a4a7a', '#5a3d28'])); g.box(cx - hx, yt - 0.26, cz - hz, cx + hx, yt, cz + hz);
          g.mat('soil', '#ffffff'); g.box(cx - hx + 0.02, yt - 0.03, cz - hz + 0.02, cx + hx - 0.02, yt - 0.02, cz + hz - 0.02, { faces: 'Y' });
          s.flush({ tier: 's', cast: false, level: lv });
          const kind = r.next();
          for (let k = 0; k < 8; k++) {
            const px = cx + (Math.abs(dx) > 0.5 ? r.f(-w / 2, w / 2) : r.f(-0.08, 0.08)), pz = cz + (Math.abs(dz) > 0.5 ? r.f(-w / 2, w / 2) : r.f(-0.08, 0.08)), sz = r.f(0.3, 0.5);
            const bl = kind > 0.6 && r.chance(0.5);
            g.mat(bl ? 'blossom' : kind < 0.35 ? 'fern' : 'leafA', bl ? '#ffffff' : mixHex('#ffffff', '#cfe3a6', r.next() * 0.5), { sway: 0.35 });
            g.card(px, yt - 0.04, pz, sz, sz * 0.9, r.f(0, 6.28), { tilt: r.f(-0.4, 0.4) });
            // trailing down the slab's face
            if (k < 5) { const tl = r.f(0.7, 1.6); g.mat(kind < 0.5 ? 'leafB' : 'fern', '#ffffff', { sway: 0.5 }); g.card(px + ox * 0.14, yt - tl, pz + oz * 0.14, sz * 0.8, tl, (ox ? Math.PI / 2 : 0) + r.f(-0.4, 0.4), { tilt: 0.04 }); }
          }
          s.flush({ tier: 'd', cast: false, level: lv });
        }
      }

      // ---------------------------------------------------------------- the outer walls and every flat's front
      // each side: wall line, along axis, inward normal (toward the walkway), the run
      const sides = [
        { k: 'S', alongX: true, c: ZS, n: -1, a0: -XO, a1: XO },
        { k: 'W', alongX: false, c: -XO, n: 1, a0: zA, a1: ZS },
        { k: 'E', alongX: false, c: XO, n: -1, a0: zA, a1: ZS },
      ];
      if (hasN) sides.push({ k: 'N', alongX: true, c: ZN, n: 1, a0: -XO, a1: XO });
      const T = 0.16;
      for (const sd of sides) {
        const wc = sd.c + sd.n * (T / 2);            // the wall's centre line, just inside the footprint
        const face = sd.c + sd.n * T;                 // the walkway face
        const doors = DOORS[sd.k].filter((d) => d[0] > sd.a0 + 0.8 && d[0] < sd.a1 - 0.8);
        const ops = [];
        for (const d of doors) {
          ops.push({ at: d[0] - 0.5 - sd.a0, w: 1.0, h: 2.1 });
          ops.push({ at: d[0] + d[1] * 2.3 - 0.65 - sd.a0, w: 1.3, h: 1.3, sill: 0.95 });
        }
        if (sd.k === 'S') ops.push({ at: -1.6 - sd.a0, w: 3.2, h: 1.5, sill: 0.95 });      // the bay's long window in the middle
        const towardA = sd.n > 0;          // wall face A looks toward +x / +z
        const wo = { tintA: towardA ? CPAL.plaster : '#cdbb9c', tintB: towardA ? '#cdbb9c' : CPAL.plaster, dado: { h: 1.0, mat: 'paint', tint: col }, openings: ops, level: lv };
        if (sd.alongX) wall(s, sd.a0, wc, sd.a1, wc, L, H, wo); else wall(s, wc, sd.a0, wc, sd.a1, L, H, wo);
        // dado rail and a picture rail on the walkway face
        const P = (u, off) => sd.alongX ? [u, face + sd.n * off] : [face + sd.n * off, u];
        const strip = (u0, u1, y0, y1, out, mat, tint) => { const p = P(u0, 0), q = P(u1, out); g.mat(mat, tint); g.box(Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1]), { faces: sd.alongX ? (sd.n > 0 ? 'ZyYxX' : 'zyYxX') : (sd.n > 0 ? 'XyYzZ' : 'xyYzZ') }); };
        let u = sd.a0; const cuts = ops.map((o) => [sd.a0 + o.at, sd.a0 + o.at + o.w]).sort((p, q) => p[0] - q[0]);
        for (const c of cuts) { if (c[0] - u > 0.05) strip(u, c[0], L + 0.98, L + 1.04, 0.025, 'wood', '#5a3d28'); u = Math.max(u, c[1]); }
        if (sd.a1 - u > 0.05) strip(u, sd.a1, L + 0.98, L + 1.04, 0.025, 'wood', '#5a3d28');
        strip(sd.a0, sd.a1, yC - 0.34, yC - 0.26, 0.015, 'paint', CPAL.terracotta);
        s.flush({ tier: 's', level: lv });

        for (const d of doors) {
          const at = d[0], wd = d[1], dc = P(at, 0), flat = flatAt(L, sd.k, at);
          const yawOut = sd.alongX ? (sd.n > 0 ? 0 : Math.PI) : (sd.n > 0 ? Math.PI / 2 : -Math.PI / 2);      // facing the walkway
          const ff = sd.alongX ? (sd.n > 0 ? 'Z' : 'z') : (sd.n > 0 ? 'X' : 'x');
          const dcol = DOORCOL[(nameI * 5 + L) % DOORCOL.length];
          // frame and threshold
          const fc = sd.alongX ? [at, wc] : [wc, at];
          doorFrame(s, fc[0], L, fc[1], 1.0, 2.1, sd.alongX ? 'x' : 'z', { depth: 0.24, tint: shadeHex(dcol, 0.7), level: lv });
          { const p = P(at - 0.55, -0.02), q = P(at + 0.55, 0.16); g.mat('stone', '#cbbd9f'); g.box(Math.min(p[0], q[0]), L, Math.min(p[1], q[1]), Math.max(p[0], q[0]), L + 0.03, Math.max(p[1], q[1])); }
          let label;
          if (flat) {
            label = plateOf(flat.plate);
          } else {
            // a closed door, painted, panelled, with a brass knob and a letter slot
            const lp = (u0, u1, y0, y1, o0, o1) => { const p = P(u0, o0), q = P(u1, o1); return [Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1])]; };
            g.mat('wood', dcol, { rough: -0.05 }); g.box(...lp(at - 0.5, at + 0.5, L + 0.02, L + 2.1, -0.1, -0.05), { bevel: 0.008 });
            g.mat('wood', shadeHex(dcol, 1.15));
            g.box(...lp(at - 0.38, at + 0.38, L + 0.16, L + 0.95, -0.05, -0.035)); g.box(...lp(at - 0.38, at + 0.38, L + 1.1, L + 1.96, -0.05, -0.035));
            g.mat('cast', '#c8a45a'); const kn = P(at + 0.36 * (wd > 0 ? -1 : 1), -0.02); g.ball(kn[0], L + 1.0, kn[1], 0.03, 0.03, 0.03, { segs: 8, rings: 5 });
            g.box(...lp(at - 0.13, at + 0.13, L + 0.99, L + 1.03, -0.035, -0.025));
            s.flush({ tier: 's', level: lv });
            s.solid(...lp(at - 0.5, at + 0.5, L, L + 2.1, -0.12, 0));
            const nm = NAMES[nameI % NAMES.length]; const sub = SUBS[(nameI * 7) % SUBS.length];
            label = { kind: 'plate', text: nextNum(), lines: [sub ? nm + ' · ' + sub : nm] };
            nameI++;
            const kp = P(at, 0.55), lab = label.text;
            s.interact({ x: kp[0], y: L + 1.3, z: kp[1], radius: 1.1, prompt: 'Knock at ' + lab, onUse: (gm) => {
              gm.sfxAt('knock', f, kp[0], L + 1.3, kp[1]);
              const k = (gm.flags && gm.flags['knock:' + lab]) || 0; gm.flags = gm.flags || {}; gm.flags['knock:' + lab] = k + 1;
              const i = (Math.abs(Math.round(kp[0] * 3 + kp[1] * 7)) + L + k) % KNOCK.length;
              if (gm.ui) gm.ui.toast(KNOCK[i], { kind: 'info', dur: 5 });
            } });
          }
          // the plate on the wall beside the door, on the side away from the window
          const pp = P(at - wd * 0.78, 0.004);
          sign(s, label, pp[0], L + 1.5, pp[1], { face: ff, w: 0.24, h: label.lines.length ? 0.12 : 0.09, level: lv });
          // a mat, a lamp, pots
          const mp = P(at, 0.42); g.mat(r.chance(0.5) ? 'rush' : 'carpet', r.pick(['#b89a6a', '#8a2f3c', '#2f5d50', '#c98a2e', '#5b4060'])); g.box(mp[0] - (sd.alongX ? 0.42 : 0.26), L + 0.004, mp[1] - (sd.alongX ? 0.26 : 0.42), mp[0] + (sd.alongX ? 0.42 : 0.26), L + 0.018, mp[1] + (sd.alongX ? 0.26 : 0.42), { faces: 'YxXzZ' });
          s.flush({ tier: 'd', cast: false, level: lv });
          const lpz = P(at + wd * 0.82, 0);
          if ((nameI + L / 4) % 2 === 0) lamp(s, 'sconce', lpz[0], L + 2.05, lpz[1], { face: ff, clip: CLIPT, K: 2700, power: 0.5, range: 4.2, level: lv });
          else {
            g.mat('cast', '#8a6d3b'); g.cube(lpz[0] + (sd.alongX ? 0 : sd.n * 0.02), L + 2.05, lpz[1] + (sd.alongX ? sd.n * 0.02 : 0), sd.alongX ? 0.12 : 0.04, 0.2, sd.alongX ? 0.04 : 0.12);
            g.mat('diffuser', '#ffd9a0', { emissive: 4, lamp: true }); g.ball(lpz[0] + (sd.alongX ? 0 : sd.n * 0.1), L + 2.07, lpz[1] + (sd.alongX ? sd.n * 0.1 : 0), 0.075, 0.1, 0.075, { segs: 10, rings: 7 });
            s.flush({ tier: 'd', cast: false, level: lv });
          }
          const kinds = ['broad', 'fine', 'fern', 'flower'], pots = ['#a3563a', '#2b6b69', '#d39b3a', '#5b4060', '#e8d8bb', '#7a2f2a', '#3a4a7a'];
          const np = 1 + Math.floor(r.next() * 3);
          for (let i = 0; i < np; i++) {
            const pu = at - wd * (0.9 + i * 0.5 + r.f(0, 0.15)), pp2 = P(pu, 0.28 + r.f(0, 0.12));
            prop(s, 'court.pot', pp2[0], L, pp2[1], r.f(0, 6.28), { kind: r.pick(kinds), size: r.pick([0.6, 0.9, 1.2, 1.6]), pot: r.pick(pots), seed: i % 2 }, { level: lv });
          }
          s.spot('stand', P(at, 0.7)[0], L, P(at, 0.7)[1], yawOut + Math.PI, { tags: ['terraces', 'door', 'deck' + deck] });
          // the window: frame, sill, glass, a curtain lit from within, and a box of herbs
          const wcU = at + wd * 2.3; const w0 = wcU - 0.65, w1 = wcU + 0.65;
          {
            const lp = (u0, u1, y0, y1, o0, o1) => { const p = P(u0, o0), q = P(u1, o1); return [Math.min(p[0], q[0]), y0, Math.min(p[1], q[1]), Math.max(p[0], q[0]), y1, Math.max(p[1], q[1])]; };
            const wf = flat ? '#efe6d2' : r.pick(['#efe6d2', '#2b6b69', '#5a3d28', '#c98a2e', '#7a2f2a']);
            g.mat('wood', wf); g.box(...lp(w0 - 0.07, w0, L + 0.95, L + 2.25, -0.04, 0.03)); g.box(...lp(w1, w1 + 0.07, L + 0.95, L + 2.25, -0.04, 0.03));
            g.box(...lp(w0 - 0.07, w1 + 0.07, L + 2.25, L + 2.33, -0.04, 0.03)); g.box(...lp(wcU - 0.025, wcU + 0.025, L + 0.95, L + 2.25, -0.12, -0.06));
            g.mat('stone', '#d4c6aa'); g.box(...lp(w0 - 0.1, w1 + 0.1, L + 0.89, L + 0.95, -0.02, 0.14));
            s.flush({ tier: 's', level: lv });
            const gl = sd.alongX ? [w0, L + 0.95, wc + sd.n * 0.0, w1, L + 2.25, wc + sd.n * 0.0] : [wc, L + 0.95, w0, wc, L + 2.25, w1];
            s.glass(gl[0], gl[1], gl[2], gl[3], gl[4], gl[5], { tint: '#d9e6e0', opacity: 0.16, level: lv });
            const cc = r.pick(['#e8c27a', '#d98a6a', '#f0dcb0', '#c96a5a', '#b8c890', '#e0b0a0', '#9fb8c8']);
            const cb = sd.c + sd.n * 0.03;
            g.mat('weave', cc, { emissive: 0.75, lamp: true });
            if (flat) { /* the flats hang their own curtains inside */ } else if (sd.alongX) g.sheet([w0, L + 2.25, cb], [w1, L + 2.25, cb], [w1, L + 0.95, cb], [w0, L + 0.95, cb], { nu: 8, nv: 2, ripple: 0.025, rippleN: 7 });
            else g.sheet([cb, L + 2.25, w0], [cb, L + 2.25, w1], [cb, L + 0.95, w1], [cb, L + 0.95, w0], { nu: 8, nv: 2, ripple: 0.025, rippleN: 7 });
            s.flush({ tier: 's', cast: false, level: lv });
            if (r.chance(0.7)) {
              const bc = P(wcU, 0.1), hx = sd.alongX ? 0.5 : 0.09, hz = sd.alongX ? 0.09 : 0.5;
              g.mat('paint', r.pick(['#a3563a', '#2b6b69', '#5a3d28', '#c98a2e'])); g.box(bc[0] - hx, L + 0.95, bc[1] - hz, bc[0] + hx, L + 1.1, bc[1] + hz);
              s.flush({ tier: 'd', cast: false, level: lv });
              const fl = r.chance(0.4);
              for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5 - 0.5; g.mat(fl && k % 2 ? 'blossom' : (k % 2 ? 'leafB' : 'leafA'), mixHex('#ffffff', '#cfe8a0', r.next() * 0.6), { sway: 0.5 }); g.card(bc[0] + (sd.alongX ? t * 0.9 : 0), L + 1.08, bc[1] + (sd.alongX ? 0 : t * 0.9), 0.36, r.f(0.25, 0.4), r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) }); }
              s.flush({ tier: 'd', cast: false, level: lv });
            }
            s.solid(...lp(w0 - 0.1, w1 + 0.1, L, L + 0.95, -0.02, 0.14));
            if (r.chance(0.3) || flat) {
              const ip = P(wcU, 0.7);
              s.interact({ x: ip[0], y: L + 1.5, z: ip[1], radius: 1.1, prompt: 'Look at the window', onUse: (gm) => {
                if (gm.journal && gm.journal.find) gm.journal.find('terrace-windows');
                else if (gm.ui) gm.ui.card({ kicker: 'The terraces', title: 'Homes with windows', text: 'Almost no home in a drum has a window. The flats on the terraces round a court do, and those on the Hollow\'s end walls, and that is all.', dur: 6 });
              } });
            }
          }
          // now and then: a bench, a chair and a little table, shoes, washing, a watering can
          const roll = r.next(), bu = at - wd * 3.6;
          if (roll < 0.28 && Math.abs(bu - sd.a0) > 1.5 && Math.abs(bu - sd.a1) > 1.5) {
            const bp = P(bu, 0.32); prop(s, 'bench', bp[0], L, bp[1], yawOut, { w: 1.4, back: true, wood: r.pick(['#7a5233', '#2b6b69', '#5a3d28']) }, { level: lv, cast: false, spot: { tags: ['terraces', 'bench', 'deck' + deck] } });
            seatUse(s, bp[0], L + 0.46, bp[1], yawOut, 'Sit on the bench');
          } else if (roll < 0.45) {
            const bp = P(bu, 0.5); prop(s, 'table', bp[0], L, bp[1], 0, { round: true, w: 0.55, h: 0.7, wood: '#3a2a20', top: r.pick(['#2b6b69', '#a3563a', '#e8d8bb']) }, { level: lv, cast: false });
            const cp = P(bu + 0.6, 0.55); prop(s, 'court.chair', cp[0], L, cp[1], yawOut + (sd.alongX ? -Math.PI / 2 : Math.PI / 2), { wood: '#5a3d28', seat: r.pick(['#c9552e', '#2f6f8f', '#d9c08a']) }, { level: lv, cast: false, spot: { tags: ['terraces', 'deck' + deck] } });
            prop(s, 'cup', bp[0], L + 0.7, bp[1], 0, { glaze: r.pick(['#c9552e', '#2f6f8f', '#e9c46a']) }, { level: lv });
          } else if (roll < 0.62) {
            // a washing line along the wall with the week's things on it
            const u0 = at - wd * 2.8, u1 = at - wd * 5.2; if (Math.min(u0, u1) > sd.a0 + 0.5 && Math.max(u0, u1) < sd.a1 - 0.5) {
              const p0 = P(u0, 0.45), p1 = P(u1, 0.45); g.mat('weave', '#e8e0d0'); g.tube([[p0[0], L + 2.15, p0[1]], [(p0[0] + p1[0]) / 2, L + 2.05, (p0[1] + p1[1]) / 2], [p1[0], L + 2.15, p1[1]]], 0.005, { segs: 3 });
              const nG = 4 + Math.floor(r.next() * 3);
              for (let i = 0; i < nG; i++) {
                const t = (i + 0.5) / nG, cx = p0[0] + (p1[0] - p0[0]) * t, cz = p0[1] + (p1[1] - p0[1]) * t, gw = r.f(0.28, 0.5), gh = r.f(0.35, 0.7);
                const ex = sd.alongX ? gw / 2 : 0, ez = sd.alongX ? 0 : gw / 2;
                g.mat(r.pick(['weave', 'stripe', 'knit', 'motif']), r.pick(['#c9552e', '#e9c46a', '#2f6f8f', '#efe6d2', '#8a2f3c', '#6b8f4e', '#d0687a', '#33406e']), { sway: 0.6 });
                g.sheet([cx - ex, L + 2.08, cz - ez], [cx + ex, L + 2.08, cz + ez], [cx + ex, L + 2.08 - gh, cz + ez], [cx - ex, L + 2.08 - gh, cz - ez], { nu: 3, nv: 3, ripple: 0.02 });
              }
              s.flush({ tier: 'd', cast: false, level: lv });
              s.spot('work', P((u0 + u1) / 2, 0.9)[0], L, P((u0 + u1) / 2, 0.9)[1], yawOut + Math.PI, { tags: ['terraces', 'washing', 'deck' + deck] });
            }
          } else if (roll < 0.72) {
            const sp = P(at - wd * 0.9, 0.2); g.mat('wood', '#7a5233'); g.box(sp[0] - (sd.alongX ? 0.4 : 0.15), L, sp[1] - (sd.alongX ? 0.15 : 0.4), sp[0] + (sd.alongX ? 0.4 : 0.15), L + 0.35, sp[1] + (sd.alongX ? 0.15 : 0.4), { bevel: 0.01 });
            for (let i = 0; i < 3; i++) { const sh = P(at - wd * (0.7 + i * 0.22), 0.5); g.mat('leather', r.pick(['#3a2a20', '#7a2f2a', '#2f4f6f', '#c98a2e'])); g.box(sh[0] - 0.05, L, sh[1] - 0.05, sh[0] + 0.05, L + 0.09, sh[1] + 0.05, { bevel: 0.02 }); }
            s.flush({ tier: 'd', level: lv });
          }
          if (r.chance(0.18)) { const wp = P(at + wd * 1.1, 0.3); g.mat('brushed', r.pick(['#5f8a4a', '#2b6b69', '#b0563a'])); g.lathe(wp[0], wp[1], [[0.1, L], [0.11, L + 0.05], [0.11, L + 0.26], [0.06, L + 0.3]], { segs: 10 }); g.tube([[wp[0], L + 0.1, wp[1]], [wp[0] + 0.12, L + 0.32, wp[1] + 0.06]], 0.012, { segs: 5 }); s.flush({ tier: 'd', level: lv }); s.spot('work', P(at + wd * 1.4, 0.7)[0], L, P(at + wd * 1.4, 0.7)[1], yawOut + Math.PI, { tags: ['terraces', 'garden', 'water', 'deck' + deck] }); }
        }
      }

      // ---------------------------------------------------------------- the middle bay on the south side: a bench under a long window
      {
        const zf = ZS - 0.16;
        g.mat('wood', '#7a5233'); g.box(-1.6, L, zf - 0.5, 1.6, L + 0.44, zf, { bevel: 0.015 });
        g.mat('weave', col); g.box(-1.5, L + 0.44, zf - 0.46, 1.5, L + 0.5, zf - 0.04, { bevel: 0.02 });
        g.mat('wood', '#efe6d2'); g.box(-1.67, L + 0.95, zf - 0.03, -1.6, L + 2.45, zf + 0.04); g.box(1.6, L + 0.95, zf - 0.03, 1.67, L + 2.45, zf + 0.04); g.box(-1.67, L + 2.45, zf - 0.03, 1.67, L + 2.52, zf + 0.04);
        for (const x of [-0.55, 0.55]) g.box(x - 0.025, L + 0.95, zf + 0.02, x + 0.025, L + 2.45, zf + 0.06);
        s.flush({ tier: 's', level: lv });
        s.solid(-1.6, L, zf - 0.5, 1.6, L + 0.44, zf);
        s.glass(-1.6, L + 0.95, ZS - 0.08, 1.6, L + 2.45, ZS - 0.08, { opacity: 0.16, level: lv });
        g.mat('weave', mixHex(col, '#efe6d2', 0.55), { emissive: 0.6, lamp: true }); g.sheet([-1.6, L + 2.45, ZS - 0.02], [1.6, L + 2.45, ZS - 0.02], [1.6, L + 0.95, ZS - 0.02], [-1.6, L + 0.95, ZS - 0.02], { nu: 12, nv: 2, ripple: 0.03, rippleN: 11 });
        s.flush({ tier: 's', cast: false, level: lv });
        for (const x of [-2.6, 2.6]) prop(s, 'plant', x, L, zf - 0.35, x, { kind: x < 0 ? 'fine' : 'broad', size: 1.7, pot: CPAL.terracotta }, { level: lv, cast: false });
        const dp = SIGNS['deck' + deck + '.plate']; if (dp) sign(s, { kind: 'plate', text: dp.text, lines: [dp.sub] }, 0, L + 2.85, zf - 0.005, { face: 'z', w: 0.5, h: 0.2, level: lv });
        for (let i = 0; i < 4; i++) s.spot('sit', -1.2 + i * 0.8, L + 0.44, zf - 0.28, Math.PI, { tags: ['terraces', 'bench', 'deck' + deck] });
        seatUse(s, 0, L + 0.44, zf - 0.28, Math.PI, 'Sit on the bay bench');
      }
      // the west walkway by the stair: the terraces' own plate
      if (SIGNS['terraces.plate']) sign(s, plateOf(SIGNS['terraces.plate']), -XO + T + 0.004, L + 1.6, 14.2, { face: 'X', w: 0.4, h: 0.17, level: lv });
      // on deck 17 the east and west walkways stop at the hall: an end wall with a bench and a planter
      if (!hasN) {
        for (const sx of [1, -1]) {
          const xa = sx > 0 ? X1 : -XO, xb = sx > 0 ? XO : X0;
          wall(s, xa, Z0 + 0.08, xb, Z0 + 0.08, L, H, { tint: CPAL.plaster, dado: { h: 1.0, mat: 'paint', tint: col }, level: lv });
          planter(s, sx * 29.6, L, Z0 + 0.5, { w: 2.6, d: 0.6, h: 0.5, plants: 'broad', tint: CPAL.terracotta, level: lv });
          prop(s, 'bench', sx * 29.6, L, Z0 + 1.3, 0, { w: 1.6, back: false }, { level: lv, cast: false, spot: { tags: ['terraces', 'bench', 'deck' + deck] } });
          lamp(s, 'sconce', sx * 29.6, L + 2.3, Z0 + 0.17, { face: 'Z', clip: CLIPT, K: 2700, power: 0.5, level: lv });
        }
      }

      // ---------------------------------------------------------------- bedding airing over the rails, lanterns under the ceilings
      for (let i = 0; i < 5; i++) {
        const sd = r.pick(hasN ? ['E', 'W', 'S', 'N'] : ['E', 'W', 'S']);
        let a, b, alongX, c, v;
        if (sd === 'E' || sd === 'W') { alongX = false; c = sd === 'E' ? X1 + 0.02 : X0 - 0.02; v = sd === 'E' ? -1 : 1; const z = r.pick([-11.5, -6.5, 0, 8, 16]); a = z - 0.7; b = z + 0.7; }
        else { alongX = true; c = sd === 'S' ? Z1 + 0.02 : Z0 - 0.02; v = sd === 'S' ? -1 : 1; const x = r.pick([-12, -6, 6, 11, 21]); a = x - 0.75; b = x + 0.75; }
        const yt = L + 1.13, cl = r.pick(['#8a2f3c', '#2f6f8f', '#e9c46a', '#efe6d2', '#6b8f4e', '#c9552e', '#5b4060']);
        g.mat(r.pick(['motif', 'stripe', 'knit', 'weave']), cl);
        const Q = (u, off, y) => alongX ? [u, y, c + v * off] : [c + v * off, y, u];
        g.sheet(Q(a, 0.03, yt), Q(b, 0.03, yt), Q(b, 0.07, L + 0.15), Q(a, 0.07, L + 0.15), { nu: 5, nv: 4, ripple: 0.03, rippleN: 4 });
        g.sheet(Q(a, -0.03, yt), Q(b, -0.03, yt), Q(b, -0.06, L + 0.62), Q(a, -0.06, L + 0.62), { nu: 5, nv: 2, ripple: 0.02, rippleN: 4 });
        s.flush({ tier: 'd', cast: false, level: lv });
      }
      // a paper lantern hanging under every few beams, toward the void
      const hang = [];
      for (let z = zA + 3.6; z < ZS - 1; z += 7.2) { hang.push([X1 + 0.7, z]); hang.push([X0 - 0.7, z]); }
      for (let x = X0 + 4.8; x < X1 - 1; x += 7.2) { hang.push([x, Z1 + 0.7]); if (hasN) hang.push([x, Z0 - 0.7]); }
      hang.forEach((h, i) => {
        g.mat('weave', '#3e3228'); g.tube([[h[0], yC, h[1]], [h[0], yC - 0.55, h[1]]], 0.004, { segs: 3, caps: false });
        lanternMesh(g, h[0], yC - 0.75, h[1], LANTERN_COLS[(i + L) % LANTERN_COLS.length], i % 3 === 0 ? 1 : 0, 2.8);
        s.flush({ tier: 's', cast: false, level: lv });
      });
      

      // ---------------------------------------------------------------- leaning on the rail, chat groups, paths, zones
      const lean = [[X1 - 0.5, 0, -Math.PI / 2], [X0 + 0.5 - 0, -0.1, Math.PI / 2], [0, Z1 + 0.5, Math.PI], [9, Z1 + 0.5, Math.PI], [X1 + 0.5, 8.2, -Math.PI / 2]];
      if (hasN) lean.push([0, Z0 - 0.5, 0], [-14, Z0 - 0.5, 0]);
      for (const q of lean) {
        let x = q[0], z = q[1]; if (Math.abs(x) === X1 - 0.5) x = Math.sign(x) * (X1 + 0.5); if (x === X0 + 0.5) x = X0 - 0.5;
        seatUse(s, x, L, z, q[2], 'Lean on the rail', { eye: 1.55, pitch: -0.42, hy: 1.1, radius: 1.3 });
        s.spot('stand', x, L, z, q[2], { tags: ['terraces', 'rail', 'look', 'deck' + deck] });
      }
      const chats = [[29.6, -1.0], [-29.6, 6.8], [12.8, 21.6], [-20.6, 21.6]]; if (hasN) chats.push([8.6, -15.6]);
      chats.forEach((c, k) => { const n = 2 + ((k + L) % 3); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + k; s.spot('chat', c[0] + Math.cos(a) * 0.6, L, c[1] + Math.sin(a) * 0.6, fy(-Math.cos(a), -Math.sin(a)), { tags: ['terraces', 'chat', 'deck' + deck] }); } });
      if (L === 12) for (const p of [[-12.5, 21.4], [-13.4, 22.2], [-6.2, 21.2]]) s.spot('play', p[0], L, p[1], r.f(0, 6), { tags: ['terraces', 'kids', 'deck19'] });

      // walkway centrelines, with a spur to every door
      const cx = X1 + TW / 2, cz = Z1 + TW / 2, nz = Z0 - TW / 2;
      const eN = hasN ? nz : Z0 + 0.8;
      const along = (pts) => s.path(pts.map((p) => [p[0], L, p[1]]), { width: 1.6 });
      const ez = [eN].concat(DOORS.E.map((d) => d[0]).filter((z) => z > eN && z < cz)).concat([cz]).sort((a, b) => a - b);
      along(ez.map((z) => [cx, z]));
      const wz = [eN].concat(DOORS.W.map((d) => d[0]).filter((z) => z > eN && z < cz)).concat([14.0, cz]).sort((a, b) => a - b);
      along(wz.map((z) => [-cx, z]));
      const sx = [-cx, -27.2].concat(DOORS.S.map((d) => d[0]).filter((x) => Math.abs(x) < cx)).concat([0, cx]).sort((a, b) => a - b);
      along(sx.map((x) => [x, cz]));
      if (hasN) { const nx = [-cx].concat(DOORS.N.map((d) => d[0])).concat([cx]).sort((a, b) => a - b); along(nx.map((x) => [x, nz])); }
      for (const sd of ['S', 'W', 'E', 'N']) {
        if (sd === 'N' && !hasN) continue;
        for (const d of DOORS[sd]) {
          const a = d[0];
          if (sd === 'S' && Math.abs(a) < cx) s.path([[a, L, cz], [a, L, ZS - 0.5]], { width: 1.0 });
          if (sd === 'N') s.path([[a, L, nz], [a, L, ZN + 0.5]], { width: 1.0 });
          if ((sd === 'E' || sd === 'W') && a > eN && a < cz) { const xx = sd === 'E' ? cx : -cx; s.path([[xx, L, a], [sd === 'E' ? XO - 0.5 : -XO + 0.5, L, a]], { width: 1.0 }); }
        }
      }
      const zones = [['E', [X1 - 0.1, L - 0.3, zA, XO, yC - 0.1, ZS]], ['W', [-XO, L - 0.3, zA, X0 + 0.1, yC - 0.1, ZS]], ['S', [X0, L - 0.3, Z1 - 0.1, X1, yC - 0.1, ZS]]];
      if (hasN) zones.push(['N', [X0, L - 0.3, ZN, X1, yC - 0.1, Z0 + 0.1]]);
      for (const z of zones) s.zoneBox({ id: 'terraces-' + deck + z[0], place: 'terraces', box: z[1], name: 'The terraces', sub: 'Wick Court · deck ' + deck, ambience: 'terrace', reverb: 'hall', env: { exposure: 0.95, warmth: 0.3 }, headroom: H - 0.1, sky: true, skyTop: 23 });
    }

    // the terraces' own light: the court's glow carried in under the slabs, warm, all day and evening
    s.ambient({ box: [-XO, COURT.decks[0], ZN, XO, COURT.top, ZS], sky: '#ffe6c8', ground: '#c9a57c', power: 1.35, lamp: true, soft: 0.6 });
    s.finish();
    game.spawns.terraces = { frame: f, x: 0, y: 12, z: 21.0, yaw: 0, pitch: -0.25 };
    game.spawns['terrace-top'] = { frame: f, x: 29.4, y: 20, z: 2, yaw: -Math.PI / 2, pitch: -0.45 };
  },
};
