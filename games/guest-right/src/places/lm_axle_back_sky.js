// The two pictures painted for the Window: the River (the sky behind the raft, as the back crews see it) and the view
// along the drum's own radiators from the small side pane. Both are drawn once with the 2D canvas onto the sign atlas.
//
// The big picture is wrapped on a curved screen sixty metres out: across, u = 0..1 is 160 degrees of azimuth; down,
// v = 0..1 is screen height +50 m .. -35 m, so a point's elevation is atan(height / 60). Near the horizon a degree is
// about 12.7 pixels both ways, so one pixel is about a twelfth of a degree: about what an eye resolves.
//
// Everything soft is stamped from a few small pre-drawn sprites (a canvas filter or a new gradient per stroke is far too
// slow for thousands of them).
import { Rng } from '../core/util.js';

export const RIVER_W = 2032, RIVER_H = 1016;
const AZ = 160, YTOP = 50, YSPAN = 85, RAD = 60;

function gauss(r) { let u = 0; for (let i = 0; i < 4; i++) u += r.next(); return (u - 2) * 1.73; }
// a smooth wobble for fraying, made of a few sines
function wob(x, k) { return Math.sin(x * 7.1 + k) * 0.5 + Math.sin(x * 17.3 + k * 2.1) * 0.3 + Math.sin(x * 41.7 + k * 0.7) * 0.2; }

// A soft round sprite of one colour: opaque in the middle, gone at the edge. hard (0..1) holds the middle longer.
function sprite(rgb, hard) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(' + rgb + ',1)'); gr.addColorStop(Math.max(0.05, hard || 0.0) , 'rgba(' + rgb + ',' + (hard ? 0.9 : 0.75) + ')'); gr.addColorStop(0.55, 'rgba(' + rgb + ',0.28)'); gr.addColorStop(1, 'rgba(' + rgb + ',0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return c;
}
function stamp(ctx, sp, x, y, rx, ry, a) { if (a <= 0.002) return; ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sp, x - rx, y - ry, rx * 2, ry * 2); }

// The River and the Shelf, its dust and its holes. Painted in stages onto a canvas of its own: pause() is awaited between
// them, so the work is spread over several frames (it runs while the cab is on its way).
export async function paintRiver(ctx, w, h, pause) {
  const rest = pause || (() => Promise.resolve());
  const r = new Rng(2049);
  const yOf = (eDeg) => h * (YTOP - RAD * Math.tan(eDeg * Math.PI / 180)) / YSPAN;
  const ppd = w / AZ;                                                                 // pixels a degree, across
  // the band: its middle line, its half-width and its brightness along its length
  const ec = (u) => 6.5 + 8 * (u - 0.5) + 1.3 * Math.sin(u * 6.3 + 0.4);
  const A = (u) => Math.exp(-Math.pow((u - 0.47) / 0.34, 2));
  const sig = (u) => 4.3 * (0.45 + 0.55 * A(u)) * (1 + 0.18 * wob(u, 1.3));           // degrees
  const fray = (u) => 0.55 + 0.45 * Math.max(0, wob(u * 1.4, 4.2));                    // breaks along the band, strongest at the ends
  const S = {
    shelf: sprite('86,68,46'), gold: sprite('255,204,134'), white: sprite('255,226,176'), amber: sprite('240,164,98'),
    dust: sprite('4,2,4'), bruise: sprite('94,60,72'), bruise2: sprite('108,72,62'), bdust: sprite('48,28,36'),
  };

  ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, w, h);

  // ---- the Shelf: a broad faint glow above and below the River, brightest about its middle
  ctx.globalCompositeOperation = 'lighter';
  stamp(ctx, S.shelf, w * 0.5, yOf(ec(0.5)), w * 0.7, 34 * ppd, 0.6);
  stamp(ctx, S.shelf, w * 0.47, yOf(ec(0.47)), w * 0.3, 22 * ppd, 0.75);
  for (let i = 0; i < 300; i++) {
    const u = r.next(), e = ec(u) + gauss(r) * 14, rad = r.f(18, 64);
    stamp(ctx, S.shelf, u * w, yOf(e), rad, rad * r.f(0.5, 0.9), 0.06 * (0.4 + A(u)) * r.next());
  }

  // ---- the River's glow: many soft clouds along the band, thick and bright in the middle and frayed at the ends
  for (let i = 0; i < 1800; i++) {
    let u = r.next(); if (r.next() > 0.25 + 0.75 * A(u)) u = r.next();
    const s = sig(u), fr = fray(u);
    if (r.next() > fr) continue;
    const e = ec(u) + gauss(r) * s * 0.55;
    const rx = s * ppd * r.f(0.35, 1.0);
    const a = (0.02 + 0.045 * A(u)) * r.f(0.5, 1.2) * fr;
    const k = r.next(); const sp = k < 0.7 ? S.gold : k < 0.92 ? S.white : S.amber;
    stamp(ctx, sp, u * w, yOf(e), rx, rx * r.f(0.45, 0.85), a);
  }
  // the bright heart, whiter, narrower
  for (let i = 0; i < 320; i++) {
    const u = 0.47 + gauss(r) * 0.09, s = sig(u), e = ec(u) + gauss(r) * s * 0.3, rx = s * ppd * r.f(0.25, 0.6);
    stamp(ctx, S.white, u * w, yOf(e), rx, rx * 0.6, 0.04);
  }

  // star clouds: fine grain inside the band, so it is made of light rather than painted with it
  for (let i = 0; i < 3200; i++) {
    let u = r.next(); if (r.next() > 0.2 + 0.8 * A(u)) u = r.next(); if (r.next() > fray(u)) continue;
    const e = ec(u) + gauss(r) * sig(u) * 0.6, rx = r.f(1.5, 5.5);
    stamp(ctx, r.next() < 0.75 ? S.gold : S.white, u * w, yOf(e), rx, rx * r.f(0.6, 1), r.f(0.04, 0.12) * (0.4 + A(u)));
  }

  await rest();
  // ---- stars: thousands, most of them faint; the bright ones orange. Crowded in the band, thinner in the Shelf, scattered elsewhere.
  const stars = [];
  for (let i = 0; i < 52000; i++) {
    const k = r.next(); let u, e;
    if (k < 0.62) { u = r.next(); if (r.next() > 0.2 + 0.8 * A(u)) u = r.next(); if (r.next() > fray(u) + 0.25) continue; e = ec(u) + gauss(r) * sig(u) * 0.75; }
    else if (k < 0.8) { u = 0.47 + gauss(r) * 0.22; e = ec(u) + gauss(r) * 13; if (r.next() < 0.5) continue; }
    else { u = r.next(); e = r.f(-32, 40); if (r.next() < 0.78) continue; }
    if (u < 0 || u > 1) continue;
    // brightness: most are faint single points; about one in seventy is bright enough to show a disc
    const bright = r.next() < 0.0045;
    const b = (bright ? 0.4 + 0.6 * Math.pow(r.next(), 2.5) : Math.pow(r.next(), 3)) * (k >= 0.8 ? 0.65 : 1);
    const t = r.next();
    // colour: pale gold for most; the brighter a star, the likelier it is orange (the disk's giants)
    const orange = bright ? t < 0.75 : t < 0.12 + 0.3 * b;
    const c = orange ? (bright && t < 0.25 ? 'deep' : 'orange') : t > 0.97 ? 'blue' : 'gold';
    stars.push({ x: u * w, y: yOf(e), b, c, bright });
  }
  ctx.globalCompositeOperation = 'source-over';
  const COL = { gold: 'rgb(255,236,196)', orange: 'rgb(255,186,112)', deep: 'rgb(255,150,82)', blue: 'rgb(214,226,255)' };
  for (const key in COL) {
    ctx.fillStyle = COL[key];
    for (const s of stars) {
      if (s.bright || s.c !== key) continue;
      ctx.globalAlpha = Math.min(1, 0.03 + s.b * 0.8);
      ctx.fillRect(s.x, s.y, s.b > 0.55 ? 1.25 : 1, s.b > 0.55 ? 1.25 : 1);
    }
  }

  await rest();
  // ---- dust: dark rifts down the middle, and at the frayed edges dust that is not black but brown-violet: bruise
  const lane = (u0, u1, off, wid, sp, alpha, seed) => {
    const n = Math.max(10, Math.round((u1 - u0) * w / 3));
    for (let i = 0; i <= n; i++) {
      const u = u0 + (u1 - u0) * i / n, s = sig(u);
      const e = ec(u) + off * s + wob(u * 3, seed) * s * 0.25;
      const taper = Math.sin(Math.PI * i / n);
      const rw = Math.max(0.8, wid * s * ppd * (0.55 + 0.45 * Math.sin(u * 23 + seed)) * (0.6 + 0.4 * A(u)));
      stamp(ctx, sp, u * w, yOf(e), rw * 1.3, rw, alpha * (0.35 + 0.65 * taper) * 0.5);
    }
  };
  ctx.globalCompositeOperation = 'source-over';
  // the great rift through the bright middle, and its lesser branches
  lane(0.25, 0.74, 0.05, 0.36, S.dust, 0.5, 0.3);
  // the rift is not a line: dark clouds strung along it, some of them across the whole band
  for (let i = 0; i < 220; i++) { const u = r.f(0.18, 0.8), s = sig(u), e = ec(u) + gauss(r) * s * 0.28 + wob(u * 3, 0.3) * s * 0.25, rx = s * ppd * r.f(0.12, 0.45); stamp(ctx, S.dust, u * w, yOf(e), rx * r.f(1, 2.2), rx, r.f(0.1, 0.32) * (0.5 + A(u))); }
  lane(0.33, 0.58, -0.35, 0.18, S.dust, 0.62, 1.7);
  lane(0.44, 0.69, 0.42, 0.14, S.dust, 0.58, 2.9);
  lane(0.12, 0.36, -0.15, 0.22, S.dust, 0.62, 4.4);
  lane(0.62, 0.9, 0.2, 0.2, S.dust, 0.58, 5.2);
  for (let i = 0; i < 26; i++) { const u0 = r.f(0.05, 0.85), u1 = u0 + r.f(0.03, 0.12); lane(u0, u1, r.f(-0.7, 0.7), r.f(0.04, 0.12), S.dust, r.f(0.35, 0.65), r.f(0, 9)); }
  await rest();
  // bruise: the dust at both edges, where the River frays into the Shelf. Brown-violet, lit from behind.
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 650; i++) {
    let u = r.next(); if (r.next() > 0.35 + 0.65 * A(u)) u = r.next();
    const s = sig(u), side = r.next() < 0.5 ? -1 : 1, e = ec(u) + side * s * r.f(0.95, 1.7);
    const rx = s * ppd * r.f(0.2, 0.55), a = r.f(0.04, 0.09) * (0.5 + A(u));
    stamp(ctx, r.next() < 0.6 ? S.bruise : S.bruise2, u * w, yOf(e), rx, rx * r.f(0.35, 0.7), a);
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 18; i++) {
    const u0 = r.f(0.08, 0.86), u1 = u0 + r.f(0.06, 0.16), side = r.next() < 0.5 ? -1 : 1;
    lane(u0, u1, side * r.f(0.95, 1.35), r.f(0.1, 0.2), S.bdust, r.f(0.35, 0.55), r.f(0, 9));
  }

  await rest();
  // ---- the brighter stars, in front of the dust: small soft discs, the brightest orange
  ctx.globalCompositeOperation = 'lighter';
  const SP = { gold: sprite('255,236,196', 0.12), orange: sprite('255,186,112', 0.12), deep: sprite('255,150,82', 0.12), blue: sprite('214,226,255', 0.12) };
  for (const s of stars) {
    if (!s.bright) continue;
    const rr = 1.1 + s.b * 1.7;
    stamp(ctx, SP[s.c], s.x, s.y, rr, rr, 0.8);
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff1dc'; ctx.fillRect(s.x - 0.5, s.y - 0.5, 1, 1);
  }
  // a few very bright giants, with a wider halo
  const giants = [[0.31, 1.6], [0.55, -0.9], [0.7, 2.2], [0.16, -1.4], [0.83, 0.6], [0.43, 2.8], [0.62, -2.1]];
  for (const gq of giants) {
    const u = gq[0], x = u * w, y = yOf(ec(u) + gq[1] * sig(u) * 0.6);
    stamp(ctx, SP.deep, x, y, 6, 6, 0.5); stamp(ctx, SP.orange, x, y, 2.6, 2.6, 1); ctx.globalAlpha = 1; ctx.fillStyle = '#ffe2c0'; ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
  }
  // the red star at the big raft's edge
  const bigU = 0.585, bigE = ec(0.585) + sig(0.585) * 0.95;
  const bx = bigU * w, by = yOf(bigE);
  const red = sprite('235,80,46', 0.15);
  stamp(ctx, red, bx + 7.6, by - 2.6, 4.5, 4.5, 0.95); ctx.globalAlpha = 1; ctx.fillStyle = '#ffc2a0'; ctx.fillRect(bx + 7.0, by - 3.2, 1.3, 1.3);

  await rest();
  // ---- the holes: rafts, black against everything, from specks to the width of a fingernail at arm's length
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000000';
  const blob = (x, y, rad, asp, rot, seed) => {
    if (rad < 0.9) { ctx.fillRect(x - rad, y - rad * asp, rad * 2, Math.max(0.8, rad * 2 * asp)); return; }
    const n = rad < 2.5 ? 6 : 11; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, k = 1 + 0.16 * Math.sin(a * 3 + seed) + 0.08 * Math.sin(a * 5 + seed * 2);
      const lx = Math.cos(a) * rad * k, ly = Math.sin(a) * rad * k * asp;
      const X = x + lx * Math.cos(rot) - ly * Math.sin(rot), Y = y + lx * Math.sin(rot) + ly * Math.cos(rot);
      if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.closePath(); ctx.fill();
  };
  for (let i = 0; i < 3600; i++) {
    let u = r.next(), e;
    if (r.next() < 0.8) { if (r.next() > 0.3 + 0.7 * A(u)) u = r.next(); e = ec(u) + gauss(r) * sig(u) * 1.1; } else e = ec(u) + gauss(r) * 8;
    const k = r.next(), rad = k < 0.85 ? r.f(0.45, 0.9) : k < 0.985 ? r.f(1.0, 2.0) : r.f(2.3, 4.2);
    blob(u * w, yOf(e), rad, r.f(0.35, 1), r.f(0, 3.14), r.f(0, 9));
  }
  blob(bx, by, 7.5, 0.62, -0.35, 2.2);                                                // the big one, by the red star
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

// The view from the small side pane: along the aft face of the radiator layer, rows of panels running off into the dark,
// the River's frayed edge above, and one closed sled's lamp far down the rows.
export function paintRadiators(ctx, w, h) {
  const r = new Rng(1024);
  ctx.fillStyle = '#010103'; ctx.fillRect(0, 0, w, h);
  const gold = sprite('240,206,150'), bruise = sprite('104,60,88'), lamp = sprite('255,170,90', 0.2);
  // sky: the edge of the River, frayed, and its bruise
  ctx.globalCompositeOperation = 'lighter';
  // the River's frayed end crossing the top of the view, gold with bruise along its edges
  for (let i = 0; i < 420; i++) {
    const x = r.f(-0.1, 1.1) * w, yc = h * (0.2 + 0.1 * x / w), edge = r.next() < 0.35;
    const y = yc + (edge ? (r.next() < 0.5 ? -1 : 1) * h * r.f(0.07, 0.12) : gauss(r) * h * 0.04), rad = r.f(8, 30);
    stamp(ctx, edge ? bruise : gold, x, y, rad, rad * 0.6, edge ? r.f(0.05, 0.1) : r.f(0.03, 0.08) * (0.5 + x / w));
  }
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 5200; i++) {
    const x = r.next() * w, band = r.next() < 0.6, y = band ? h * (0.2 + 0.1 * x / w) + gauss(r) * h * 0.05 : r.next() * h * 0.48, b = Math.pow(r.next(), 3.5);
    if (y > h * 0.5) continue;
    ctx.globalAlpha = Math.min(1, 0.05 + b * 0.9); ctx.fillStyle = b > 0.5 ? 'rgb(255,186,112)' : 'rgb(255,232,190)';
    ctx.fillRect(x, y, b > 0.6 ? 1.4 : 1, b > 0.6 ? 1.4 : 1);
  }
  ctx.globalAlpha = 1;
  // the panels: long rows converging on a point far off to the right, just below the middle
  const vx = w * 0.86, vy = h * 0.47;
  for (let row = 0; row < 14; row++) {
    const yA = h * (0.52 + row * 0.055 + row * row * 0.004);
    const yB = yA + h * (0.03 + row * 0.004);
    const shade = 24 + row * 2.6, sheen = 0.09 + 0.03 * (row % 3);
    ctx.fillStyle = 'rgb(' + Math.round(shade * 0.95) + ',' + Math.round(shade * 0.88) + ',' + Math.round(shade * 1.05) + ')';
    ctx.beginPath(); ctx.moveTo(-10, yA); ctx.lineTo(vx, vy); ctx.lineTo(-10, yB); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(232,196,140,' + sheen.toFixed(3) + ')'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-10, yA); ctx.lineTo(vx, vy); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1;
    for (let k = 1; k < 26; k++) {
      const t = 1 - Math.pow(0.86, k), x = -10 + (vx + 10) * t;
      const y0 = yA + (vy - yA) * t, y1 = yB + (vy - yB) * t;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    }
  }
  // the manifold: a pipe running along under the panels
  ctx.strokeStyle = 'rgba(70,58,62,1)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-10, h * 0.98); ctx.lineTo(vx, vy + 4); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,170,120,0.12)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, h * 0.965); ctx.lineTo(vx, vy + 3); ctx.stroke();
  // a closed sled far down the rows: a small dark box with one warm lamp, and its light on the panels round it
  const sx = w * 0.58, sy = h * 0.6;
  ctx.globalCompositeOperation = 'lighter'; stamp(ctx, lamp, sx, sy, 60, 22, 0.3);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#16120f'; ctx.fillRect(sx - 9, sy - 9, 18, 9);
  ctx.globalCompositeOperation = 'lighter'; stamp(ctx, lamp, sx + 6, sy - 5, 8, 8, 1); ctx.globalAlpha = 1; ctx.fillStyle = '#ffe6c8'; ctx.fillRect(sx + 5, sy - 6, 2, 2);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}
