// The Tin: the Measure's spinball hall, beside the home end. One court under a barrel vault whose arch is drawn to the
// drum's own curve: it spans spinward, so looking up you see deck 52's cross-section at a two-hundredth of its size,
// with a lamp strip at the crown for the sunline. Banked seats at the front; targets on the other three walls, one wall
// for each heading of the rule every child knows: along the axis it flies true, spinward it sinks, anti it floats.
//
// x[-28, -4] z[10, 42]; the vault springs at y = 4 from both long walls and reaches 10.8 at the crown.
import { floor, wall, lamp, roomGlow, block } from '../world/kit.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { PI, C, SHEET, say, toast, sfx, find, custom, sub } from './lm_mile_hall_props.js';

const X0 = -28, X1 = -4, XM = -16, Z0 = 10, Z1 = 42, SPRING = 4.0, VR = 14;
const VCY = SPRING - Math.sqrt(VR * VR - 12 * 12);          // the vault's centre, below the floor
const CROWN = VCY + VR;
const COURT = { x0: -26, x1: -6, z0: 16, z1: 40, cz: 28 };
const BANK = { x0: -25.4, x1: -6.6, zf: 15.4, depth: 0.95, rise: 0.4, rows: 4 };
const ARC0 = Math.asin(12 / VR);
const vaultY = (x) => VCY + Math.sqrt(Math.max(0, VR * VR - (x - XM) * (x - XM)));

// A target ring on its backboard. p: { c (ring colour), r }. Front toward +z, flat on the wall at z = 0.
defineProp('mile.ring', (g, p) => {
  const r = p.r || 0.4;
  g.push(); g.rotX(PI / 2);
  g.mat('paint', p.c || '#e9b23c'); g.cyl(0, -0.03, 0, r + 0.36, 0.03, { segs: 28 });
  g.mat('paint', '#2a2622'); g.cyl(0, -0.034, 0, r + 0.2, 0.004, { segs: 28 });
  g.mat('paint', '#f2e8d2'); g.cyl(0, -0.038, 0, r + 0.06, 0.004, { segs: 28 });
  g.mat('paint', '#2a2622'); g.cyl(0, -0.042, 0, 0.06, 0.004, { segs: 12 });
  g.pop();
  const ring = []; for (let i = 0; i < 28; i++) { const a = i / 28 * PI * 2; ring.push([Math.cos(a) * r, Math.sin(a) * r, 0.14]); }
  g.mat('cast', '#c9a24a', { rough: -0.15 }); g.tube(ring, 0.022, { segs: 6, closed: true });
  for (const a of [PI * 0.25, PI * 0.75, PI * 1.25, PI * 1.75]) g.tube([[Math.cos(a) * r, Math.sin(a) * r, 0.14], [Math.cos(a) * (r + 0.06), Math.sin(a) * (r + 0.06), 0.02]], 0.012, { segs: 4 });
  return { tier: 's', cast: false };
});

// A ball rack: a slatted frame with balls in it. Front toward +z.
defineProp('mile.rack', (g) => {
  g.mat('wood', '#7a5233'); for (const x of [-0.6, 0.6]) g.box(x - 0.03, 0, -0.22, x + 0.03, 1.0, 0.22, { bevel: 0.01 });
  for (const y of [0.25, 0.65]) { g.box(-0.6, y, -0.22, 0.6, y + 0.03, 0.22, { bevel: 0.006 }); g.box(-0.6, y + 0.1, 0.19, 0.6, y + 0.13, 0.22); }
  for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) { const x = -0.48 + i * 0.19, y = 0.37 + k * 0.4; g.mat('leather', '#d8b25a'); g.ball(x, y, 0, 0.09, 0.09, 0.09, { segs: 10, rings: 7 }); g.mat('weave', '#b5532e'); g.ball(x, y, 0, 0.092, 0.02, 0.092, { segs: 10, rings: 3 }); }
  return { solid: [[-0.62, 0, -0.22, 0.62, 1.0, 0.22]], tier: 'd', cast: true };
});

export async function buildTin(ctx) {
  const { s, f, game } = ctx, g = s.g, R = ctx.sheet;
  const clip = [X0 - 0.1, -0.3, Z0 - 0.1, X1 + 0.1, CROWN + 0.2, Z1 + 0.1];
  const r = new Rng(4242);

  // ---- shell: floor, long walls to the springing, the vault, the lunettes
  floor(s, X0, Z0, X1, Z1, 0, 'planks', '#b98a5a');
  const W = { tint: '#e6d6b8', dado: { h: 1.4, mat: 'weave', tint: '#2f6f73' } };
  wall(s, X0 - 0.08, Z0, X0 - 0.08, Z1, 0, SPRING, W);
  wall(s, X1 + 0.08, Z0, X1 + 0.08, Z1, 0, SPRING, Object.assign({}, W, { dado: { h: 1.4, mat: 'weave', tint: '#7a2f3c' } }));
  s.structure(() => {
    const NA = 24, NZ = 8;
    for (let i = 0; i < NA; i++) {
      const a0 = -ARC0 + 2 * ARC0 * i / NA, a1 = -ARC0 + 2 * ARC0 * (i + 1) / NA, d = Math.abs(i - (NA - 1) / 2);
      const col = d > 10 ? C.teal : d < 1 ? '#7a2f3c' : (i % 2 ? '#e9dcc0' : '#dccb9f');
      g.mat(d < 1 || d > 10 ? 'paint' : 'plaster', col);
      for (let j = 0; j < NZ; j++) {
        const z0 = Z0 + (Z1 - Z0) * j / NZ, z1 = Z0 + (Z1 - Z0) * (j + 1) / NZ;
        const P = (a, z) => [XM + VR * Math.sin(a), VCY + VR * Math.cos(a), z];
        g.quad(P(a0, z0), P(a1, z0), P(a1, z1), P(a0, z1));
      }
    }
    // the back lunette (whole wall) and the front one (above the concourse's wall at six metres)
    const arc = (xa, xb, n) => { const out = []; for (let i = 0; i <= n; i++) { const x = xb + (xa - xb) * i / n; out.push([x, vaultY(x)]); } return out; };
    g.mat('plaster', '#e6d6b8');
    g.extrude([[X0, 0], [X1, 0]].concat(arc(X0, X1, 20)), Z1, Z1 + 0.25, 'z');
    const xs = Math.sqrt(VR * VR - (6 - VCY) * (6 - VCY));
    g.extrude([[XM - xs, 6], [XM + xs, 6]].concat(arc(XM - xs, XM + xs, 16)), Z0 + 0.08, Z0 + 0.2, 'z');
    // a painted band on the back wall at the springing, and a teal dado
    g.mat('paint', C.teal); g.box(X0, SPRING - 0.25, Z1 - 0.01, X1, SPRING, Z1, { faces: 'z' });
    g.mat('weave', '#33407a'); g.box(X0, 0.1, Z1 - 0.06, X1, 1.4, Z1, { faces: 'zY' });
    g.mat('wood', '#3a2d22'); g.box(X0, 0, Z1 - 0.07, X1, 0.1, Z1, { faces: 'zY' });
  });
  s.solid(X0, 0, Z1, X1, CROWN, Z1 + 0.4);
  // the vault in steps of two metres, so a ball thrown up comes back down
  for (let x = X0; x < X1 - 0.01; x += 2) { const y = Math.min(vaultY(x), vaultY(x + 2)); s.solid(x, y, Z0, x + 2, CROWN + 1, Z1); }
  // the ribs: a gilded arch every four metres, and the sunline along the crown
  s.structure(() => {
    g.mat('cast', '#c9a24a', { rough: -0.1 });
    for (let z = Z0 + 4; z < Z1 - 0.1; z += 4) { const pts = []; for (let i = 0; i <= 24; i++) { const a = -ARC0 + 2 * ARC0 * i / 24; pts.push([XM + (VR - 0.06) * Math.sin(a), VCY + (VR - 0.06) * Math.cos(a), z]); } g.tube(pts, 0.07, { segs: 6 }); }
    g.mat('cast', '#3a3f3d'); g.box(XM - 0.22, CROWN - 0.16, Z0 + 0.3, XM + 0.22, CROWN - 0.04, Z1 - 0.3, { faces: 'xXyzZ' });
    g.mat('diffuser', '#ffe2b4', { emissive: 6, lamp: true }); g.box(XM - 0.12, CROWN - 0.18, Z0 + 0.4, XM + 0.12, CROWN - 0.16, Z1 - 0.4, { faces: 'y' });
  });
  s.light({ at: [XM, CROWN - 0.5, Z0 + 2], to: [XM, CROWN - 0.5, Z1 - 2], type: 'tube', color: [1.0, 0.93, 0.82], power: 26, range: 16, clip, lamp: true, radius: 0.2, shadow: true });
  for (const x of [-21.5, -10.5]) for (const z of [21, 35]) lamp(s, 'globe', x, 6.2, z, { K: 2900, power: 1.6, range: 11, drop: vaultY(x) - 6.2, r: 0.3, clip });
  roomGlow(s, X0, 0, Z0, X1, CROWN, Z1, { sky: '#ffe2b8', ground: '#b98a5a', power: 0.3 });
  bunting(s, [X0 + 0.3, SPRING - 0.3, 20], [X1 - 0.3, SPRING - 0.3, 20], { colors: [C.teal, C.red, C.saffron, C.indigo, C.cream], sag: 0.9 });
  bunting(s, [X0 + 0.3, SPRING - 0.3, 36], [X1 - 0.3, SPRING - 0.3, 36], { colors: [C.saffron, C.cream, C.red, C.teal], sag: 0.9 });

  // ---- the court: lines, centre ring, the three arrows
  s.structure(() => {
    g.mat('paint', '#f3ecdc', { rough: -0.1 });
    const L = (a, b, c, d) => g.box(a, 0, b, c, 0.004, d, { faces: 'Y' });
    L(COURT.x0, COURT.z0, COURT.x1, COURT.z0 + 0.08); L(COURT.x0, COURT.z1 - 0.08, COURT.x1, COURT.z1);
    L(COURT.x0, COURT.z0, COURT.x0 + 0.08, COURT.z1); L(COURT.x1 - 0.08, COURT.z0, COURT.x1, COURT.z1);
    L(COURT.x0, COURT.cz - 0.04, COURT.x1, COURT.cz + 0.04);
    g.mat('paint', '#7a2f3c'); g.box(COURT.x0 + 0.08, 0, COURT.z0 + 0.08, COURT.x1 - 0.08, 0.002, COURT.z0 + 2.2, { faces: 'Y' }); g.box(COURT.x0 + 0.08, 0, COURT.z1 - 2.2, COURT.x1 - 0.08, 0.002, COURT.z1 - 0.08, { faces: 'Y' });
  });
  if (R) {
    g.atlas(R.page, { rough: 0.5 }); g._mat[2] |= 16;
    const cell = (i) => { const x = (i % 2) * SHEET.arrowW, y = SHEET.arrowY + Math.floor(i / 2) * (SHEET.arrowH + 8); return sub(R, SHEET.W, SHEET.H, x + 2, y + 2, i === 3 ? 124 : SHEET.arrowW - 4, SHEET.arrowH - 4); };
    // an arrow on the floor centred at (cx, cz), pointing along d, image up along n (d x n = +y)
    const arrow = (i, cx, cz, dx, dz, nx, nz, L, Wd) => {
      const u = cell(i), uv = [u.u0, u.v1, u.u1, u.v0], y = 0.005;
      const P = (a, b) => [cx + dx * a + nx * b, y, cz + dz * a + nz * b];
      g.quad(P(-L / 2, -Wd / 2), P(L / 2, -Wd / 2), P(L / 2, Wd / 2), P(-L / 2, Wd / 2), { uv });
    };
    arrow(0, XM, COURT.cz + 4.6, 0, 1, 1, 0, 5.6, 1.4);         // TRUE, toward the back wall, along the axis
    arrow(1, XM + 4.6, COURT.cz, 1, 0, 0, -1, 5.6, 1.4);        // SINKS, spinward
    arrow(2, XM - 4.6, COURT.cz, -1, 0, 0, 1, 5.6, 1.4);        // FLOATS, anti
    arrow(3, XM, COURT.cz, 1, 0, 0, -1, 1.7, 1.7);              // the centre ring
    s.flush({ tier: 's', cast: false });
  }

  // ---- the bank: four rows of 0.4, cushions, cheeks at the ends
  const RISER = [C.red, C.saffron, C.teal, C.indigo];
  for (let k = 0; k < BANK.rows; k++) {
    const zf = BANK.zf - BANK.depth * k, zb = k === BANK.rows - 1 ? Z0 + 0.1 : zf - BANK.depth, top = BANK.rise * (k + 1);
    block(s, BANK.x0, 0, zb, BANK.x1, top, zf, 'wood', '#8a6440');
    s.structure(() => { g.mat('paint', RISER[k]); g.box(BANK.x0, top - BANK.rise, zf, BANK.x1, top - 0.03, zf + 0.005, { faces: 'Z' }); g.mat('wood', '#5b4030'); g.box(BANK.x0, top - 0.03, zf - 0.06, BANK.x1, top + 0.005, zf + 0.01, { faces: 'yYZ' }); });
    for (const x of [BANK.x0 - 0.18, BANK.x1]) block(s, x, 0, zb, x + 0.18, top + 0.85, zf, 'paint', '#3a2d22');
    if (k < 3) {
      s.detail(() => { for (let x = BANK.x0 + 0.4; x < BANK.x1 - 0.5; x += 0.75) { if (r.chance(0.3)) continue; g.mat(r.chance(0.5) ? 'knit' : 'motif', r.pick([C.red, C.teal, C.saffron, C.indigo, '#5b4060'])); g.box(x - 0.24, top, zf - 0.42, x + 0.24, top + 0.05, zf - 0.08, { bevel: 0.02 }); } });
      for (let x = BANK.x0 + 0.5; x < BANK.x1 - 0.3; x += 0.75) s.spot('sit', x, top, zf - 0.3, 0, { tags: ['watch', 'spinball', 'mile', k === 0 ? 'parent' : 'chat'] });
    } else for (let x = BANK.x0 + 1; x < BANK.x1 - 0.5; x += 1.6) s.spot('stand', x + r.f(-0.3, 0.3), top, zb + 0.5, 0, { tags: ['watch', 'spinball', 'mile'] });
  }
  for (const x of [-20, -12]) seat_(s, x, BANK.rise, BANK.zf - 0.3, 'Sit on the bank');
  for (const p of [[-24.2, 15.4 - 0.3, 0.4], [-9.2, 15.4 - 1.25, 0.8]]) { prop(s, 'cup', p[0], p[2], p[1] - 0.3, 0, { glaze: '#e9e1cf' }); }

  // ---- the targets: three on each of the three walls, registered for throwing
  const T = [];
  const ringAt = (x, y, z, yaw, nx, nz, c, wallId) => {
    prop(s, 'mile.ring', x, y, z, yaw, { c, r: 0.4 }, { noCollide: true });
    T.push({ frame: f, x: x + nx * 0.14, y, z: z + nz * 0.14, r: 0.4, owner: 'mile-hall', end: wallId, points: 3 });
  };
  for (const p of [[-20.5, 2.6], [-16, 3.6], [-11.5, 2.6]]) ringAt(p[0], p[1], Z1 - 0.01, PI, 0, -1, '#7a2f3c', 'true');
  for (const p of [[22, 2.2], [28, 3.0], [34, 2.2]]) ringAt(X1 - 0.01, p[1], p[0], -PI / 2, -1, 0, '#c98a2e', 'spin');
  for (const p of [[22, 2.2], [28, 3.0], [34, 2.2]]) ringAt(X0 + 0.01, p[1], p[0], PI / 2, 1, 0, '#2f6f73', 'anti');
  game.spinballTargets = (game.spinballTargets || []).filter((t) => t.owner !== 'mile-hall').concat(T);
  s.onDispose(() => { if (game.spinballTargets) game.spinballTargets = game.spinballTargets.filter((t) => t.owner !== 'mile-hall'); });
  // the three words over the walls
  sign(s, { kind: 'letters', text: 'TRUE', font: 'caps', palette: ['#7a2f3c'] }, XM, 5.4, Z1 - 0.02, { face: 'z', w: 4.2, h: 1.1 });
  sign(s, { kind: 'letters', text: 'SINKS', font: 'caps', palette: ['#a8661e'] }, X1 - 0.02, 3.4, COURT.cz + 6.2, { face: 'x', w: 2.6, h: 0.6 });
  sign(s, { kind: 'letters', text: 'FLOATS', font: 'caps', palette: ['#2f6f73'] }, X0 + 0.02, 3.4, COURT.cz - 6.2, { face: 'X', w: 2.8, h: 0.6 });

  // ---- how a throw broke: watch every throw made in here
  const TH = { cur: null, last: null };
  const off = game.events.on('ball:throw', (b) => { if (!b || b.frame !== f || b.x < X0 || b.x > X1 || b.z < Z0 || b.z > Z1) return; TH.cur = { b, y0: b.y, vy: b.vy, vx: b.vx, vz: b.vz, g0: f.weight(b.y, 0) * 9.81 }; });
  if (typeof off === 'function') s.onDispose(off);
  const offS = game.events.on('ball:score', (t) => { if (!t || t.owner !== 'mile-hall') return; game.flags['mile.rings'] = (game.flags['mile.rings'] || 0) + 1; if (TH.cur) TH.cur.ring = t.end; });
  if (typeof offS === 'function') s.onDispose(offS);
  s.every((dt, gm) => {
    const c = TH.cur; if (!c) return;
    const b = c.b; if (!(b.bounces > 0 || b.scored || b.t > 2.4)) return;
    TH.cur = null;
    const t = b.t, pred = c.y0 + c.vy * t - 0.5 * c.g0 * t * t, dy = b.y - pred;
    const hv = Math.hypot(c.vx, c.vz) || 1, sp = c.vx / hv, pct = Math.round((f.weight(c.y0, c.vx) / f.weight(c.y0, 0) - 1) * 100);
    const kind = Math.abs(sp) < 0.38 ? 'true' : sp > 0 ? 'spin' : 'anti';
    const m = Math.abs(dy) < 0.05 ? 'less than five centimetres' : Math.abs(dy) < 1 ? Math.round(Math.abs(dy) * 100) + ' cm' : Math.abs(dy).toFixed(1) + ' m';
    let text;
    if (kind === 'true') text = 'Along the axis at ' + hv.toFixed(0) + ' m/s: it flew true, within ' + m + ' of where you sent it.';
    else if (kind === 'spin') text = 'Spinward at ' + hv.toFixed(0) + ' m/s: ' + Math.abs(pct) + ' per cent heavier, it came down ' + m + ' below a true throw.';
    else text = 'Anti at ' + hv.toFixed(0) + ' m/s: ' + Math.abs(pct) + ' per cent lighter, it held up ' + m + ' above a true throw.';
    TH.last = { kind, text, dy, pct, ring: c.ring || (b.scored ? 'yes' : null) };
    toast(gm, text, 'info', 6);
    custom(gm, 'Spinball');
    if (!gm.flags['mile.thrown.' + kind]) { gm.flags['mile.thrown.' + kind] = true; if (gm.flags['mile.thrown.true'] && gm.flags['mile.thrown.spin'] && gm.flags['mile.thrown.anti']) find(gm, 'spinball'); }
  });
  // a prompt at each target wall that says how the last throw broke
  const WALLS = [
    { id: 'true', x: XM, z: Z1 - 1.2, name: 'The true wall', lesson: ['This is the wall you throw at along the axis. Across the drum\'s turn, not with it or against it, so the ball weighs what it weighs standing still and goes where you aim.', 'The small ones start here. It is the only wall that does what you expect.'] },
    { id: 'spin', x: X1 - 1.2, z: COURT.cz, name: 'The sinking wall', lesson: ['Throw at this wall and you throw spinward, with the turn. The ball goes round faster than the floor does and gets heavier: at a child\'s hard throw, about a sixth heavier, and it dives.', 'Aim high. Higher than that.'] },
    { id: 'anti', x: X0 + 1.2, z: COURT.cz, name: 'The floating wall', lesson: ['Throw at this wall and you throw anti, against the turn. The ball goes round slower than the floor and loses about a sixth of its weight, so it sails.', 'Aim low. The small ones who throw anti win most of the games, which is why they all want to be small.'] },
  ];
  for (const w of WALLS) {
    s.interact({ x: w.x, y: 1.2, z: w.z, radius: 1.6, prompt: () => TH.last ? 'Your last throw: ' + (TH.last.kind === 'true' ? 'flew true' : TH.last.kind === 'spin' ? 'sank ' + Math.abs(TH.last.dy).toFixed(1) + ' m' : 'floated ' + Math.abs(TH.last.dy).toFixed(1) + ' m') : 'Read the ' + (w.id === 'true' ? 'true' : w.id === 'spin' ? 'sinking' : 'floating') + ' wall', onUse: async (gm) => {
      const lines = w.lesson.slice();
      if (TH.last) lines.unshift(TH.last.text + (TH.last.ring ? ' And through a ring.' : ''));
      else if (!gm.flags.hasBall) lines.push('The keeper lends balls at the counter outside, and there is a rack by the door.');
      await say(gm, w.name, lines);
    } });
  }

  // ---- the rack by the door, the plaque about the vault, the kids
  prop(s, 'mile.rack', X0 + 0.5, 0, 13.4, PI / 2, {});
  s.interact({ x: X0 + 1.2, y: 0.9, z: 13.4, radius: 1.3, prompt: (gm) => gm.flags.hasBall ? 'You have a ball already' : 'Take a ball from the rack', onUse: async (gm) => {
    if (gm.flags.hasBall) { toast(gm, 'You have one. Throw it at the floating wall and watch it sail.', 'info'); return; }
    gm.flags.hasBall = true; sfx(gm, 'ball-catch', f, X0 + 0.6, 0.9, 13.4);
    toast(gm, 'A spinball from the rack. F, or the right mouse button, to throw.', 'gain', 6); custom(gm, 'Spinball');
    await say(gm, 'The rack', ['Painted on the end of it: Lent, like everything. Back in the rack, please, not on the bank.', 'Under it, in chalk, in a child\'s hand: AXIS FLIES TRUE SPIN SINKS ANTI FLOATS.']);
  } });
  sign(s, { kind: 'plate', text: 'The vault', sub: 'drawn to the drum\'s own curve' }, X0 + 0.02, 1.6, 15.2, { face: 'X', w: 0.42, h: 0.18 });
  s.interact({ x: X0 + 0.8, y: 1.5, z: 15.2, radius: 1.1, prompt: 'Read the plate', onUse: async (gm) => {
    await say(gm, 'The vault', ['A brass plate: The vault of the Tin is an arc of deck 52 at one two-hundredth. Its radius is fourteen metres; the deck\'s is two thousand seven hundred and ninety-six.', 'Stand on the centre ring and look up. The lamp along the crown is where the sunline would be. The floor you are standing on is the rim. Everything you throw in here is going round that lamp at a hundred and sixty metres a second, which is the whole of the game.']);
  } });
  for (let i = 0; i < 18; i++) {
    const x = COURT.x0 + 1.5 + (i % 6) * 3.4 + r.f(-0.8, 0.8), z = COURT.z0 + 3 + Math.floor(i / 6) * 7.5 + r.f(-1.2, 1.2);
    s.spot('play', x, 0, z, r.f(-PI, PI), { tags: ['kids', 'spinball', i % 3 === 0 ? 'run' : 'catch'] });
  }
  for (const p of [[-24.6, 24, PI / 2], [-7.4, 32, -PI / 2], [-16, 38.6, PI]]) s.spot('play', p[0], 0, p[1], p[2], { tags: ['kids', 'catch', 'spinball'] });
  s.spot('stand', -16, 0, 17.2, PI, { tags: ['teach', 'spinball', 'coach', 'mile'] });
  s.spot('stand', -25.8, 0, 16.6, PI * 0.75, { tags: ['watch', 'spinball', 'parent'] });
  s.path([[-26.6, 9.2], [-26.6, 12.5], [-26.6, 16.4], [-22, 18], [-16, 18], [-10, 18], [-5.4, 16.4], [-5.4, 12.5], [-5.4, 9.2]], { width: 1.4 });
  s.trigger({ box: [COURT.x0, -0.5, COURT.z0, COURT.x1, 3, COURT.z1], once: true, onEnter(gm) { custom(gm, 'Spinball'); toast(gm, 'The Tin. Look up: the vault is the drum\'s own curve, small.', 'found', 6); } });
  s.zoneBox({ id: 'mile-tin', box: [X0, -0.5, Z0, X1, CROWN, Z1], name: 'The Tin', sub: 'Spinball · axis flies true, spin sinks, anti floats', ambience: 'school', reverb: 'hall', headroom: CROWN });
  s.loop('kids', XM, 1.2, COURT.cz, { vol: 0.42, radius: 26 });
}

function seat_(s, x, y, z, label) {
  return s.interact({ x, y: y + 0.55, z, radius: 1.2, prompt: (game) => (game.player.seat ? 'Stand up' : label), onUse(game) {
    const p = game.player; if (p.seat) { p.stand(); return; }
    p.sit({ x, y, z, yaw: PI, eye: 1.12 }); p.yaw = PI; p.pitch = 0.05;
  } });
}
