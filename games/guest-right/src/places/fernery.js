// The fernery: Candlewick spent its bright light on the court and kept one pocket of dim wood. Two decks tall, felt-hung,
// lit low and green: ferns to the knee and the shoulder, two birches, moss on old stone, a rill running from a spout in
// the back wall to a pool by the arch, and benches where nobody raises their voice.
import { floor, ceiling, lamp } from '../world/kit.js';
import { archway } from '../world/kit2.js';
import { prop, defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { deckRadius } from '../core/drum.js';
import { Rng, hashStr, mixHex } from '../core/util.js';
import { read, note, lookYaw, benchSpots } from './street_parts.js';

const X0 = -60, X1 = -36, Z0 = 4, Z1 = 24, FH = 7.2, T = 0.3;
const AX0 = -53, AX1 = -43, AH = 2.75;           // the arch from Ladle Row

// A fern: fronds arching out from a crown. p: { s (height), v (variant), t (tint) }
defineProp('fernery.fern', (g, p) => {
  const r = new Rng(hashStr('fern' + p.v)), n = 9 + (p.v % 4), s = p.s || 1;
  g.mat('fern', p.t || '#ffffff', { sway: 0.35 });
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + r.f(-0.3, 0.3), h = s * r.f(0.7, 1.05);
    g.card(Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04, h * 0.42, h, a + Math.PI / 2, { tilt: r.f(0.45, 0.85) });
  }
  for (let i = 0; i < 3; i++) { const a = r.f(0, 6.28); g.card(0, 0, 0, s * 0.3, s * 0.75, a, { tilt: r.f(0.05, 0.2) }); }
  return { tier: 'd', cast: true };
});

// A mossy boulder. p: { r, v }
defineProp('fernery.stone', (g, p) => {
  const r = p.r || 0.4, rr = new Rng(hashStr('st' + p.v));
  g.mat('stone', mixHex('#8e9484', '#6f7566', rr.next()), { rough: 0.15 }); g.ball(0, r * 0.25, 0, r, r * 0.62, r * rr.f(0.75, 1.0), { segs: 10, rings: 6, bottom: -0.45 });
  g.mat('grass', '#6f8f48'); g.ball(rr.f(-0.05, 0.05) * r, r * 0.42, rr.f(-0.05, 0.05) * r, r * 0.86, r * 0.42, r * 0.8, { segs: 10, rings: 4, bottom: 0.15 });
  return { tier: 's', cast: true, solid: [[-r * 0.8, 0, -r * 0.7, r * 0.8, r * 0.7, r * 0.7]] };
});

// A birch, white bark with black marks, a light crown of small leaves high under the felt.
function birch(s, x, z, h, seed) {
  const g = s.g, r = new Rng(hashStr('birch' + seed));
  const pts = [], rad = []; let px = x, pz = z;
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([px, t * h, pz]); rad.push(0.14 * (1 - t) + 0.03); px += r.f(-0.08, 0.08); pz += r.f(-0.08, 0.08); }
  g.mat('paint', '#e8e3d6', { rough: 0.25 }); g.tube(pts, rad, { segs: 10 });
  g.mat('grass', '#5f7a3a'); g.lathe(x, z, [[0.24, 0], [0.2, 0.05], [0.15, 0.12]], { segs: 10, capBottom: false });
  // the black marks
  g.mat('plain', '#25221f');
  for (let i = 0; i < 34; i++) {
    const t = r.f(0.03, 0.85), k = Math.floor(t * 8), f = t * 8 - k, a = pts[k], b = pts[Math.min(8, k + 1)];
    const cx = a[0] + (b[0] - a[0]) * f, cz = a[2] + (b[2] - a[2]) * f, cr = rad[k] + (rad[Math.min(8, k + 1)] - rad[k]) * f;
    const th = r.f(0, 6.28), w = r.f(0.03, 0.09);
    g.box(cx + Math.cos(th) * cr - w / 2, t * h - 0.008, cz + Math.sin(th) * cr - w / 2, cx + Math.cos(th) * cr + w / 2, t * h + 0.008, cz + Math.sin(th) * cr + w / 2);
  }
  // branches and the crown
  const tips = [];
  g.mat('bark', '#5a5048');
  for (let i = 0; i < 9; i++) {
    const t = r.f(0.45, 0.92), k = Math.floor(t * 8), a = pts[k];
    const th = r.f(0, 6.28), len = r.f(0.9, 1.8) * (1.1 - t * 0.5);
    const p0 = [a[0], t * h, a[2]], p1 = [a[0] + Math.cos(th) * len * 0.55, t * h + len * 0.45, a[2] + Math.sin(th) * len * 0.55], p2 = [a[0] + Math.cos(th) * len, t * h + len * 0.35, a[2] + Math.sin(th) * len];
    g.tube([p0, p1, p2], [0.03, 0.018, 0.008], { segs: 4 });
    tips.push(p1, p2);
  }
  tips.push([pts[8][0], h, pts[8][2]]);
  for (const tp of tips) {
    for (let j = 0; j < 11; j++) {
      g.mat('leafB', mixHex('#ffffff', '#e2f2a8', r.next()), { sway: 0.4 });
      g.card(tp[0] + r.f(-0.45, 0.45), tp[1] - r.f(0.1, 1.0), tp[2] + r.f(-0.45, 0.45), r.f(0.3, 0.5), r.f(0.4, 0.65), r.f(0, 6.28), { tilt: r.f(-0.3, 0.3) });
    }
  }
  s.flush({ tier: 's', cast: true });
  s.post(x, z, 0.16, 0, h);
}

export const place = {
  id: 'fernery', name: 'The fernery', order: 72,
  build(game) {
    const W = game.world, f = W.frame('candlewick', deckRadius(16), 0, 625);
    const s = W.scope('fernery', f);
    const g = s.g;
    const clip = [X0 - 0.05, -0.3, Z0 - 0.2, X1 + 0.05, FH + 0.1, Z1 + 0.05];
    const rng = new Rng(hashStr('fernery'));

    // ---------------- the shell: soil floor, felt walls over old stone, a dark felt ceiling two decks up ----------------
    floor(s, X0, Z0, X1, Z1, 0, 'soil', '#5b4a3a', { surf: 'gravel' });
    ceiling(s, X0, Z0, X1, Z1, FH, 'felt', '#1a2622');
    const wallRun = (x0, z0, x1, z1, face) => {
      // stone to 1.3 m, felt above with battens; face: the inward face letter
      g.mat('stone', '#7f8576'); g.box(x0, 0, z0, x1, 1.3, z1, { faces: face, aoBottom: 0.6 });
      g.mat('felt', '#22403a'); g.box(x0, 1.3, z0, x1, FH, z1, { faces: face });
      g.mat('grass', '#5f7a3a'); g.box(x0, 1.3, z0, x1, 1.36, z1, { faces: face + 'Y' });
      s.flush({ tier: 's' });
      s.solid(Math.min(x0, x1), 0, Math.min(z0, z1), Math.max(x0, x1), FH, Math.max(z0, z1));
    };
    wallRun(X0, Z0, X0 + T, Z1, 'X'); wallRun(X1 - T, Z0, X1, Z1, 'x'); wallRun(X0, Z1 - T, X1, Z1, 'z');
    // battens on the felt, and dark beams across the ceiling
    g.mat('wood', '#2e2620');
    for (let z = Z0 + 1.5; z < Z1 - 0.5; z += 1.6) { g.box(X0 + T, 1.36, z - 0.03, X0 + T + 0.04, FH, z + 0.03, { faces: 'XzZ' }); g.box(X1 - T - 0.04, 1.36, z - 0.03, X1 - T, FH, z + 0.03, { faces: 'xzZ' }); }
    for (let x = X0 + 1.4; x < X1 - 0.5; x += 1.6) g.box(x - 0.03, 1.36, Z1 - T - 0.04, x + 0.03, FH, Z1 - T, { faces: 'zxX' });
    s.flush({ tier: 's' });
    g.mat('paint', '#2b2f2a'); for (let z = Z0 + 4; z < Z1; z += 4) { g.box(X0, FH - 0.4, z - 0.12, X1, FH, z + 0.12, { faces: 'yzZ' }); s.flush({ tier: 's' }); }

    // ---------------- the front on Ladle Row: stone, an arch, troughs of fern, the name ----------------
    const fz0 = Z0, fz1 = Z0 + T;
    g.mat('stone', '#a99f8a');
    g.box(X0, 0, fz0, AX0, FH, fz1, { faces: 'zxX', aoBottom: 0.7 }); g.box(AX1, 0, fz0, X1, FH, fz1, { faces: 'zxX', aoBottom: 0.7 });
    g.box(AX0, AH, fz0, AX1, FH, fz1, { faces: 'zy' });
    g.mat('felt', '#22403a'); g.box(X0, 1.3, fz0, AX0, FH, fz1, { faces: 'Z' }); g.box(AX1, 1.3, fz0, X1, FH, fz1, { faces: 'Z' }); g.box(AX0, AH, fz0, AX1, FH, fz1, { faces: 'Z' });
    g.mat('stone', '#7f8576'); g.box(X0, 0, fz0, AX0, 1.3, fz1, { faces: 'Z' }); g.box(AX1, 0, fz0, X1, 1.3, fz1, { faces: 'Z' });
    // ashlar courses on the street face
    g.mat('stone', '#8f8572'); for (let y = 0.45; y < 3.3; y += 0.45) { g.box(X0, y - 0.012, fz0 - 0.006, AX0, y + 0.012, fz0, { faces: 'zyY' }); g.box(AX1, y - 0.012, fz0 - 0.006, X1, y + 0.012, fz0, { faces: 'zyY' }); }
    g.box(X0, 0, fz0 - 0.08, AX0, 0.22, fz0, { bevel: 0.01 }); g.box(AX1, 0, fz0 - 0.08, X1, 0.22, fz0, { bevel: 0.01 });
    s.flush({ tier: 's' });
    s.solid(X0, 0, fz0, AX0, FH, fz1); s.solid(AX1, 0, fz0, X1, FH, fz1); s.solid(AX0, AH, fz0, AX1, FH, fz1);
    archway(s, (AX0 + AX1) / 2, 0, (fz0 + fz1) / 2, AX1 - AX0, AH, 'x', { depth: T + 0.16, tint: '#b8ad96' });
    sign(s, { kind: 'letters', text: 'THE FERNERY', font: 'caps', palette: ['#d9efc0'] }, (AX0 + AX1) / 2, 3.1, fz0 - 0.09, { face: 'z', w: 3.2, h: 0.3, glow: 1.2 });
    sign(s, { kind: 'plate', text: 'THE FERNERY', lines: ["Candlewick's dim wood · kept dim by vote"] }, AX1 + 0.6, 1.5, fz0 - 0.004, { face: 'z', w: 0.4, h: 0.17 });
    // troughs of fern along the street face, under a lamp each side of the arch
    for (const tx of [[X0 + 0.6, AX0 - 0.6], [AX1 + 1.2, X1 - 0.6]]) {
      g.mat('stone', '#9b917c'); g.box(tx[0], 0, fz0 - 0.55, tx[1], 0.55, fz0, { bevel: 0.02, aoBottom: 0.65 });
      g.mat('soil', '#ffffff'); g.box(tx[0] + 0.05, 0.53, fz0 - 0.5, tx[1] - 0.05, 0.56, fz0 - 0.05, { faces: 'Y' });
      s.flush({ tier: 's', cast: true }); s.solid(tx[0], 0, fz0 - 0.55, tx[1], 0.55, fz0);
      for (let x = tx[0] + 0.3; x < tx[1] - 0.2; x += 0.55) prop(s, 'fernery.fern', x + rng.f(-0.1, 0.1), 0.55, fz0 - 0.28, rng.f(0, 6.28), { s: 0.8, v: Math.floor(rng.f(0, 4)) });
    }
    const street = [-61, -0.3, -4.5, -35, 3.7, 4.2];
    lamp(s, 'sconce', AX0 - 0.35, 2.3, fz0 - 0.005, { face: 'z', clip: street, power: 0.9, K: 2600, range: 4 });
    lamp(s, 'sconce', AX1 + 0.35, 2.3, fz0 - 0.005, { face: 'z', clip: street, power: 0.9, K: 2600, range: 4 });
    // a bench on the street, against the front
    prop(s, 'bench', X0 + 3.4, 0, fz0 - 0.95, Math.PI, { w: 1.6, back: false, wood: '#5b4636', metal: '#2a3530' }, { noSpots: true });
    benchSpots(s, X0 + 3.4, fz0 - 0.95, Math.PI, 1.6, ['street', 'fernery']);
    s.interact({ x: X0 + 3.4, y: 0.7, z: fz0 - 0.95, radius: 1.3, prompt: 'Sit on the bench', onUse(g2) { if (g2.player && g2.player.sit) g2.player.sit({ x: X0 + 3.4, y: 0, z: fz0 - 0.95, yaw: lookYaw(Math.PI) }); } });

    // ---------------- the rill: from a spout in the back wall, round the west bed, to a pool by the arch ----------------
    const rill = [[-57, Z1 - T - 0.5], [-57, 15], [-51, 15], [-51, 9.3]];
    const ch = (a, b) => {
      const x0 = Math.min(a[0], b[0]) - 0.3, x1 = Math.max(a[0], b[0]) + 0.3, z0 = Math.min(a[1], b[1]) - 0.3, z1 = Math.max(a[1], b[1]) + 0.3;
      g.mat('stone', '#7a8070', { rough: 0.1 });
      if (a[0] === b[0]) { g.box(x0, 0, z0, x0 + 0.12, 0.16, z1, { bevel: 0.015 }); g.box(x1 - 0.12, 0, z0, x1, 0.16, z1, { bevel: 0.015 }); }
      else { g.box(x0, 0, z0, x1, 0.16, z0 + 0.12, { bevel: 0.015 }); g.box(x0, 0, z1 - 0.12, x1, 0.16, z1, { bevel: 0.015 }); }
      g.mat('stone', '#4d5248'); g.box(x0 + 0.1, 0, z0 + 0.1, x1 - 0.1, 0.03, z1 - 0.1, { faces: 'Y' });
      g.mat('plain', '#1f3d38', { rough: -0.48 }); g.box(x0 + 0.11, 0.09, z0 + 0.11, x1 - 0.11, 0.095, z1 - 0.11, { faces: 'Y' });
      g.mat('grass', '#5f7a3a'); if (a[0] === b[0]) g.box(x0 - 0.02, 0.16, z0 + 0.4, x0 + 0.1, 0.18, (z0 + z1) / 2, { faces: 'YxX' }); else g.box((x0 + x1) / 2, 0.16, z1 - 0.1, x1 - 0.4, 0.18, z1 + 0.02, { faces: 'YzZ' });
      s.flush({ tier: 's', cast: false });
    };
    for (let i = 0; i < rill.length - 1; i++) ch(rill[i], rill[i + 1]);
    // the pool
    const PX = -51, PZ = 7.6, PR = 1.25;
    g.mat('stone', '#7a8070'); g.lathe(PX, PZ, [[PR + 0.2, 0], [PR + 0.22, 0.14], [PR + 0.15, 0.2], [PR, 0.18], [PR - 0.02, 0.05]], { segs: 28, capBottom: false, capTop: false });
    g.mat('stone', '#4d5248'); g.cyl(PX, 0, PZ, PR, 0.02, { segs: 24 });
    g.mat('plain', '#1a3833', { rough: -0.5 }); g.cyl(PX, 0.06, PZ, PR, 0.045, { segs: 28 });
    s.flush({ tier: 's', cast: false });
    s.post(PX, PZ, PR + 0.15, 0, 0.2);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.5; prop(s, 'fernery.stone', PX + Math.cos(a) * (PR + 0.4), 0, PZ + Math.sin(a) * (PR + 0.4), rng.f(0, 6.28), { r: rng.f(0.18, 0.32), v: i }); }
    // the spout: a stone surround in the back wall, a brass pipe, a thin fall of water into a basin
    const SX = -57, SZ = Z1 - T;
    g.mat('stone', '#9b917c'); g.box(SX - 0.7, 0, SZ - 0.12, SX + 0.7, 1.7, SZ, { bevel: 0.02, faces: 'zxXY' });
    g.mat('stone', '#6f7566'); g.box(SX - 0.55, 0.2, SZ - 0.14, SX + 0.55, 1.5, SZ - 0.12, { faces: 'z' });
    g.mat('grass', '#5f7a3a'); g.box(SX - 0.72, 1.7, SZ - 0.14, SX + 0.72, 1.76, SZ, { faces: 'YzxX' }); g.box(SX - 0.7, 0.9, SZ - 0.13, SX - 0.45, 1.5, SZ - 0.11, { faces: 'z' });
    g.mat('cast', '#a8823f', { rough: -0.2 }); g.tube([[SX, 0.95, SZ - 0.12], [SX, 0.95, SZ - 0.32], [SX, 0.9, SZ - 0.38]], 0.028, { segs: 8 });
    g.mat('plain', '#d6efe6', { rough: -0.5, emissive: 0.25 }); g.box(SX - 0.012, 0.16, SZ - 0.4, SX + 0.012, 0.9, SZ - 0.37);
    g.mat('stone', '#7a8070'); g.box(SX - 0.5, 0, SZ - 0.75, SX + 0.5, 0.25, SZ - 0.12, { bevel: 0.02, faces: 'xXzY' });
    g.mat('plain', '#1f3d38', { rough: -0.48 }); g.box(SX - 0.4, 0.2, SZ - 0.68, SX + 0.4, 0.205, SZ - 0.18, { faces: 'Y' });
    s.flush({ tier: 's', cast: false });
    s.solid(SX - 0.5, 0, SZ - 0.75, SX + 0.5, 0.25, SZ);
    let rillOn = false;
    game.events.on('zone', (e) => {
      const z = e && e.zone; if (rillOn || !z || z.scope !== s || !game.audio) return; rillOn = true;
      game.loopAt('fountain', f, SX, 0.6, SZ - 0.4, { vol: 0.45, radius: 9 });
      game.loopAt('fountain', f, PX, 0.2, PZ, { vol: 0.2, radius: 6 });
    });

    // ---------------- the walk: stepping stones from the arch, round past the birches ----------------
    const walk = [[-48, 4.4], [-47.6, 7.6], [-45.4, 11.4], [-45.6, 15.6], [-48.6, 19.4], [-53.2, 19.6]];
    const branch = [[-45.4, 11.4], [-41.4, 13.6], [-40.2, 18.2]];
    const stones = (pts) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 0.62));
        for (let k = 0; k < n; k++) {
          const t = (k + 0.5) / n, x = a[0] + (b[0] - a[0]) * t + rng.f(-0.12, 0.12), z = a[1] + (b[1] - a[1]) * t + rng.f(-0.12, 0.12);
          g.mat('stone', mixHex('#9a937f', '#7c7a6a', rng.next()), { rough: 0.1 });
          g.lathe(x, z, [[0, 0.01], [rng.f(0.24, 0.32), 0.012], [rng.f(0.25, 0.33), 0.04], [0.2, 0.05], [0, 0.052]], { segs: 9 });
        }
        s.flush({ tier: 's', cast: false });
      }
    };
    stones(walk); stones(branch);
    // gravel under the benches and moss in the beds
    g.mat('gravel', '#ffffff'); g.box(-49.4, 0, 7.2, -47.9, 0.012, 9.2, { faces: 'Y' }); g.box(-54.4, 0, 19.0, -52.0, 0.012, 20.8, { faces: 'Y' }); g.box(-40.0, 0, 17.6, -38.6, 0.012, 20.2, { faces: 'Y' });
    s.flush({ tier: 's', cast: false });
    const moss = [[-59.6, 5.0, -55.4, 14.6], [-50.5, 9.6, -46.6, 14.6], [-44.0, 4.5, -36.4, 11.0], [-44.0, 15.0, -41.0, 23.5], [-59.6, 15.6, -50.0, 18.8], [-50.4, 20.4, -42.0, 23.6]];
    g.mat('grass', '#6c8a46'); for (const m of moss) { g.box(m[0], 0, m[1], m[2], 0.015, m[3], { faces: 'Y' }); s.flush({ tier: 's', cast: false }); }

    // ---------------- birches, old stone, ferns ----------------
    birch(s, -42.2, 16.6, 6.6, 1); birch(s, -54.6, 11.4, 6.2, 2); birch(s, -38.6, 8.4, 4.6, 3);
    // the stones of an older wall, mossed over
    g.mat('stone', '#8a8676', { rough: 0.15 });
    const ruin = [[-49.4, 22.2, 2.4, 0.9], [-46.8, 22.4, 1.4, 0.55], [-45.2, 22.3, 1.0, 0.35]];
    for (const r of ruin) { g.box(r[0] - r[2] / 2, 0, r[1] - 0.3, r[0] + r[2] / 2, r[3], r[1] + 0.3, { bevel: 0.03, aoBottom: 0.6 }); }
    g.mat('grass', '#6f8f48'); for (const r of ruin) g.box(r[0] - r[2] / 2 + 0.02, r[3], r[1] - 0.28, r[0] + r[2] / 2 - 0.1, r[3] + 0.05, r[1] + 0.28, { bevel: 0.02 });
    s.flush({ tier: 's', cast: true });
    for (const r of ruin) s.solid(r[0] - r[2] / 2, 0, r[1] - 0.3, r[0] + r[2] / 2, r[3], r[1] + 0.3);
    const boulders = [[-58.8, 6.2, 0.5], [-55.6, 21.6, 0.42], [-37.4, 22.6, 0.55], [-43.2, 5.6, 0.36], [-52.6, 13.0, 0.3], [-37.0, 13.0, 0.45], [-59.0, 17.0, 0.4], [-44.0, 20.6, 0.32]];
    boulders.forEach((b, i) => prop(s, 'fernery.stone', b[0], 0, b[1], rng.f(0, 6.28), { r: b[2], v: 10 + i }));
    // ferns: scattered thick everywhere the walk, the rill, the benches and the trees leave room
    const keepOut = (x, z) => {
      const segD = (pts) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; const dx = b[0] - a[0], dz = b[1] - a[1]; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz))); d = Math.min(d, Math.hypot(x - a[0] - dx * t, z - a[1] - dz * t)); } return d; };
      if (segD(walk) < 0.75 || segD(branch) < 0.75 || segD(rill) < 0.65) return true;
      if (Math.hypot(x - PX, z - PZ) < PR + 0.55) return true;
      if (z < Z0 + 1.0 && x > AX0 - 0.5 && x < AX1 + 0.5) return true;
      for (const b of [[-48.6, 8.2], [-53.2, 20.0], [-39.3, 18.9]]) if (Math.hypot(x - b[0], z - b[1]) < 1.2) return true;
      if (z > Z1 - 1.2 && Math.abs(x - SX) < 1.1) return true;
      for (const r of ruin) if (Math.abs(x - r[0]) < r[2] / 2 + 0.2 && Math.abs(z - r[1]) < 0.5) return true;
      return x < X0 + 0.45 || x > X1 - 0.45 || z < Z0 + 0.5 || z > Z1 - 0.5;
    };
    let nf = 0;
    for (let i = 0; i < 900 && nf < 300; i++) {
      const x = rng.f(X0 + 0.4, X1 - 0.4), z = rng.f(Z0 + 0.5, Z1 - 0.4);
      if (keepOut(x, z)) continue;
      const near = Math.min(Math.abs(x - X0), Math.abs(x - X1), Math.abs(z - Z1));
      const sz = near < 2 ? rng.f(1.1, 1.75) : rng.f(0.55, 1.2);
      prop(s, 'fernery.fern', x, 0, z, rng.f(0, 6.28), { s: +sz.toFixed(1), v: Math.floor(rng.f(0, 4)) }, { tint: [rng.f(0.75, 1), rng.f(0.85, 1), rng.f(0.7, 0.95)], noCollide: true });
      nf++;
    }

    // ---------------- benches ----------------
    const benchAt = (x, z, yaw) => {
      prop(s, 'bench', x, 0, z, yaw, { w: 1.5, back: true, wood: '#5b4636', metal: '#2a3530' }, { noSpots: true });
      benchSpots(s, x, z, yaw, 1.5, ['fernery', 'quiet']);
      s.interact({ x, y: 0.7, z, radius: 1.3, prompt: 'Sit on the bench', onUse(g2) { if (g2.player && g2.player.sit) g2.player.sit({ x, y: 0, z, yaw: lookYaw(yaw) }); } });
    };
    benchAt(-48.5, 8.2, -Math.PI / 2);
    benchAt(-53.2, 20.0, 0);
    benchAt(-39.3, 18.9, -Math.PI / 2);

    // ---------------- light: low grow-lamps, green and dim; one warm lamp by the spout bench ----------------
    const strip = (x0, z0, x1, z1, y) => {
      g.mat('cast', '#2a2622'); for (const p of [[x0, z0], [x1, z1]]) g.tube([[p[0], y + 0.03, p[1]], [p[0], FH, p[1]]], 0.006, { segs: 4, caps: false });
      g.mat('brushed', '#3a3d36'); g.box(Math.min(x0, x1) - 0.06, y, Math.min(z0, z1) - 0.06, Math.max(x0, x1) + 0.06, y + 0.06, Math.max(z0, z1) + 0.06, { faces: 'xXzZY' });
      s.flush({ tier: 's', cast: false });
      lamp(s, 'strip', x0, y, z0, { to: [x1, y, z1], color: '#c9f0b0', power: 0.32, range: 5, clip, glow: 1.3 });
    };
    strip(-58.2, 7.0, -58.2, 13.0, 3.1); strip(-56.0, 17.2, -50.0, 17.2, 3.4); strip(-38.2, 6.0, -38.2, 12.0, 3.2);
    strip(-42.6, 19.5, -42.6, 23.0, 3.6); strip(-50.0, 22.6, -44.0, 22.6, 3.0);
    // a low uplight on each birch
    for (const b of [[-42.2, 16.6], [-54.6, 11.4]]) {
      g.mat('cast', '#2a2622'); g.cyl(b[0] + 0.5, 0, b[1] + 0.3, 0.07, 0.12, { segs: 8 }); s.flush({ tier: 'd' });
      s.light({ at: [b[0] + 0.45, 0.2, b[1] + 0.27], type: 'spot', dir: [-0.25, 0.95, -0.15], cone: [40, 18], color: '#e6f5c8', power: 2.2, range: 7.5, clip, lamp: true });
    }
    // the warm lamp by the spout, the one bright thing at the end of the view through the arch
    lamp(s, 'lantern', -55.6, 1.6, 19.3, { tint: '#f2b56b', clip, power: 0.45, drop: 0.12, range: 4 });
    g.mat('cast', '#2a2622'); g.tube([[-55.6, 0, 19.3], [-55.6, 1.95, 19.3]], 0.02, { segs: 6 }); g.box(-55.75, 1.93, 19.25, -55.45, 1.97, 19.35); s.flush({ tier: 's', cast: true }); s.post(-55.6, 19.3, 0.05, 0, 1.95);
    s.light({ at: [SX, 0.5, SZ - 0.6], color: '#cfe8ff', power: 0.5, range: 2.5, clip, lamp: true, nospec: false });
    s.ambient({ box: [X0, 0, Z0, X1, FH, Z1], sky: '#5c7a68', ground: '#3a3a2c', power: 0.11, lamp: true, soft: 0.6, spec: 0.3 });
    // the street's light spilling in through the arch
    s.ambient({ box: [AX0 - 1, 0, Z0, AX1 + 1, AH, Z0 + 3.5], sky: '#ffd9a8', ground: '#8a6a4a', power: 0.08, lamp: true, soft: 2.5 });

    // ---------------- notices, things to do, people ----------------
    sign(s, { kind: 'notice', title: 'The fernery', lines: ['Kept dim by vote,', 'every time it is asked.', 'Speak low: the felt', 'is listening.', 'Ferns, not flowers.'] }, AX1 + 0.5, 1.5, fz1 + 0.004, { face: 'Z', w: 0.3, h: 0.42 });
    s.interact({ x: AX1 + 0.5, y: 1.5, z: fz1 + 0.4, radius: 1.4, prompt: 'Read the notice', onUse(g2) { read(g2, 'The fernery', [
      'Kept dim by vote, every time it is asked. Speak low: the felt is listening. Ferns, not flowers.',
      'Underneath, in pencil: "A bright square makes a good court. A dim wood makes a good walk. We have both. Stop asking."',
    ]); } });
    s.interact({ x: PX + 1.2, y: 0.5, z: PZ + 0.6, radius: 1.5, prompt: 'Put a hand in the pool', onUse(g2) { g2.sfxAt('splash', f, PX + 0.8, 0.1, PZ + 0.4, { vol: 0.25 }); note(g2, 'Cold, and barely moving. It comes off the deck main by the spout and goes back into it under your feet.'); } });
    s.interact({ x: -42.2, y: 1.7, z: 15.6, radius: 1.7, prompt: 'Look up at the birch', wide: true, onUse(g2) { read(g2, 'The birch', [
      'White bark, black marks, and a crown of small leaves two decks up, nearly at the felt.',
      'Under lamps this dim it grows slowly. Nobody here is in a hurry for it.',
    ]); } });
    s.interact({ x: SX, y: 1.0, z: SZ - 0.9, radius: 1.5, prompt: 'Listen to the spout', onUse(g2) { note(g2, 'In here, with the felt, the water is the loudest thing. Out on Ladle Row you would not hear it at all.'); } });
    const paths = walk.map((p) => [p[0] + 0.25, p[1]]);
    s.path(paths, { width: 1.0, tags: ['fernery'] });
    s.path([[-45.15, 11.4], [-41.4, 13.6], [-40.2, 18.2], [-39.9, 18.9]], { width: 1.0, tags: ['fernery'] });
    s.path([[-47.35, 7.6], [-48.0, 8.2]], { width: 0.9 });
    s.spot('stand', PX + 1.6, 0, PZ + 0.2, -Math.PI / 2 - 0.2, { tags: ['fernery', 'quiet'] });
    s.spot('stand', -45.2, 0, 16.2, Math.PI * 0.75, { tags: ['fernery', 'quiet'] });
    s.spot('stand', SX + 0.9, 0, SZ - 1.3, Math.PI * 0.85, { tags: ['fernery', 'quiet'] });
    s.spot('chat', -46.4, 0, 12.4, -2.2, { tags: ['fernery', 'quiet'] }); s.spot('chat', -45.0, 0, 13.1, 2.6, { tags: ['fernery', 'quiet'] });
    s.spot('play', -55.8, 0, 16.4, 0.5, { tags: ['kids', 'hide', 'fernery'] }); s.spot('play', -37.6, 0, 15.8, -1.8, { tags: ['kids', 'hide', 'fernery'] });
    s.spot('work', -41.0, 0, 6.2, Math.PI * 0.8, { tags: ['garden', 'fernery'] });

    s.zoneBox({ id: 'fernery', place: 'fernery', box: [X0, -0.5, Z0, X1, FH, Z1], name: 'The Fernery', sub: "Candlewick's dim wood · off Ladle Row",
      ambience: 'quiet', reverb: 'felt', headroom: 3.6, env: { autoKey: 0.1, warmth: 0.1 } });
    s.finish();
    game.spawns.fernery = { frame: f, x: -48, y: 0, z: 2.2, yaw: Math.PI };
    game.spawns['fernery-in'] = { frame: f, x: -46.8, y: 0, z: 10.5, yaw: Math.PI * 0.85 };
  },
};
