// Shared parts for the four craft shops on Thread Street (the mender, the dyer and tailor, the chair remaker, the flute maker):
// their props (craft.*), the shell every unit is built in, the hanging street sign, and small helpers for talking and buying.
import { block } from '../world/kit.js';
import { room } from '../world/kit2.js';
import { defineProp } from '../world/props.js';
import { sign } from '../world/signs.js';
import { shadeHex, mixHex, Rng, hashStr, hsl } from '../core/util.js';
import { CAST } from '../content/cast.js';
import { MENUS } from '../content/menus.js';

export const craftParts = true;

// ---------------------------------------------------------------------------------------------------------------
// Helpers for use
// ---------------------------------------------------------------------------------------------------------------

// A line or two from a cast member (or a plain description when who is null), safe without a UI.
export async function talk(game, who, lines) {
  if (!game.ui) return;
  const c = who && CAST[who];
  const speaker = c ? { name: c.short || c.name, colour: (c.look && c.look.lining) || '#FFD9A0' } : '';
  const opts = c && game.audio ? { onChar: (ch) => game.audio.voice(c.voice || {}, ch) } : undefined;
  game.busy++;
  try { await game.ui.say(speaker, lines, opts); } finally { game.busy--; }
}

// Show something written (a card on a coat, a tag on a chair).
export async function readCard(game, title, text) {
  if (game.audio) game.audio.play('paper', { vol: 0.5 });
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say({ name: title, colour: '#FFD9A0' }, text); } finally { game.busy--; }
}

export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }

// The shop's menu. Returns the bought item, or null. onBuy(item) runs after a successful spend.
export async function shopMenu(game, id, o = {}) {
  const M = MENUS[id]; if (!M || !game.ui) return null;
  const hr = game.clock ? game.clock.hours : 12;
  const items = M.items.map((it) => Object.assign({}, it, { disabled: !!(it.hours && (hr < it.hours[0] || hr > it.hours[1])) }));
  game.busy++;
  let pick = null;
  try { pick = await game.ui.menu({ kicker: o.kicker || 'Thread Street', title: M.title, note: M.note, items, wallet: game.wallet ? game.wallet.kwh : 0, footer: o.footer }); } finally { game.busy--; }
  if (!pick) return null;
  const it = M.items.find((x) => x.id === pick); if (!it) return null;
  if (it.price > 0 && game.wallet && !game.wallet.spend(it.price, it.name)) { if (game.ui) game.ui.toast('Not enough in your wallet today.', { kind: 'info' }); return null; }
  if (o.onBuy) await o.onBuy(it);
  return it;
}

// Sit somewhere: an interact that seats the player (people use the matching 'sit' spot).
export function seat(s, x, y, z, yaw, prompt) {
  s.interact({ x, y: y + 0.3, z, radius: 1.1, prompt: prompt || 'Sit down', onUse(game) { if (game.player && game.player.sit) game.player.sit({ x, y, z, yaw: yaw }); } });
}

// Loops that should only start once the player first comes in.
export function loopOnEnter(game, place, starts) {
  let on = false;
  game.events.on('zone', (e) => { if (on || !e || !e.zone || e.zone.place !== place || !game.audio) return; on = true; for (const f of starts) f(); });
}

// ---------------------------------------------------------------------------------------------------------------
// The shell: floor, ceiling, three walls with a dado and a picture rail, beams, a duct and pipes, a lintel over the front.
//   o: { x0, x1, z0, z1, front: 'e' | 'w', h, floor: [mat, tint], ceil: [mat, tint], wall, dado, skirt, beam, rail, pipes: [c1, c2], glow }
// Returns the clip box for the room's lamps (reaching a little through the front so window light spills out).
// ---------------------------------------------------------------------------------------------------------------
export function shell(s, o) {
  const { x0, x1, z0, z1 } = o, h = o.h || 3.2, g = s.g, fe = o.front === 'e';
  room(s, { x0, z0, x1, z1, y: 0, h, floor: o.floor, ceil: o.ceil, wall: { tint: o.wall, dado: o.dado, skirt: o.skirt }, open: fe ? { e: false } : { w: false }, glow: o.glow || { power: 0.22 } });
  const X0 = fe ? x0 + 0.16 : x0, X1 = fe ? x1 : x1 - 0.16, Z0 = z0 + 0.16, Z1 = z1 - 0.16;
  const back = fe ? X0 : X1;
  // the lintel between the shop's ceiling and the street's
  block(s, fe ? x1 - 0.14 : x0, h - 0.02, z0, fe ? x1 : x0 + 0.14, 3.44, z1, 'paint', o.lintel || '#3a3430', { noCollide: true });
  s.structure(() => {
    // picture rail on the three walls
    const ry = o.railY || 2.42; g.mat('wood', o.rail || '#4a3424');
    g.box(X0, ry, Z0, X1, ry + 0.045, Z0 + 0.03, { bevel: 0.006 }); g.box(X0, ry, Z1 - 0.03, X1, ry + 0.045, Z1, { bevel: 0.006 });
    if (fe) g.box(X0, ry, Z0, X0 + 0.03, ry + 0.045, Z1, { bevel: 0.006 }); else g.box(X1 - 0.03, ry, Z0, X1, ry + 0.045, Z1, { bevel: 0.006 });
    // a cornice
    g.mat('paint', o.cornice || shadeHex(o.wall || '#e7d9bf', 0.92));
    g.box(X0, h - 0.07, Z0, X1, h, Z0 + 0.06); g.box(X0, h - 0.07, Z1 - 0.06, X1, h, Z1);
    if (fe) g.box(X0, h - 0.07, Z0, X0 + 0.06, h, Z1); else g.box(X1 - 0.06, h - 0.07, Z0, X1, h, Z1);
  });
  s.structure(() => {
    // beams across the room, parallel to the front
    g.mat('wood', o.beam || '#4f3a2a', { rough: 0.05 });
    const n = Math.max(2, Math.round((X1 - X0) / 2.4));
    for (let i = 1; i < n; i++) { const x = X0 + (X1 - X0) * i / n; g.box(x - 0.09, h - 0.2, Z0, x + 0.09, h - 0.005, Z1, { bevel: 0.015 }); }
    // a duct along one side, with a grille every couple of metres
    g.mat('brushed', o.duct || '#8f8778');
    g.box(X0 + 0.1, h - 0.34, Z1 - 0.62, X1 - 0.3, h - 0.06, Z1 - 0.2, { bevel: 0.01 });
    g.mat('grille', '#5c574e');
    for (let x = X0 + 1.2; x < X1 - 0.8; x += 2.6) g.box(x, h - 0.345, Z1 - 0.56, x + 0.42, h - 0.34, Z1 - 0.26, { faces: 'y' });
    // two pipes along the other side, on brackets
    const pc = o.pipes || ['#9a3b2e', '#2f6f73'];
    pc.forEach((c, i) => { g.mat('cast', c, { rough: -0.1 }); const z = Z0 + 0.14 + i * 0.13; g.tube([[X0 + 0.05, h - 0.13, z], [X1 - 0.2, h - 0.13, z]], 0.035, { segs: 10 }); });
    g.mat('cast', '#3a3632');
    for (let x = X0 + 0.6; x < X1 - 0.3; x += 1.6) g.box(x - 0.02, h - 0.2, Z0, x + 0.02, h - 0.005, Z0 + 0.36);
  });
  return fe ? [x0 - 0.05, -0.2, z0 - 0.02, x1 + 0.6, h + 0.1, z1 + 0.02] : [x0 - 0.6, -0.2, z0 - 0.02, x1 + 0.05, h + 0.1, z1 + 0.02];
}

// A hanging sign on a wrought bracket over the street. (x, z) is the wall point; out is +1 / -1 along x (toward the street).
export function streetSign(s, spec, x, z, out, o = {}) {
  const g = s.g, y = o.y || 2.95, reach = o.reach || 0.85, sx = x + out * reach * 0.62;
  s.deco(() => {
    g.mat('cast', o.metal || '#2a2622');
    g.box(x - 0.02, y - 0.25, z - 0.07, x + 0.02, y + 0.08, z + 0.07, { bevel: 0.006 });   // wall plate
    g.tube([[x, y, z], [x + out * reach, y, z]], 0.016, { segs: 6 });
    const sc = []; for (let i = 0; i <= 10; i++) { const a = i / 10 * Math.PI * 0.9; sc.push([x + out * (0.04 + Math.sin(a) * 0.34), y - 0.22 + (1 - Math.cos(a)) * 0.11, z]); }
    g.tube(sc, 0.009, { segs: 5 });
    g.tube([[x, y - 0.22, z], [x + out * 0.04, y - 0.22, z]], 0.009, { segs: 5 });
    g.ball(x + out * reach, y, z, 0.03, 0.03, 0.03, { segs: 8, rings: 5 });
    for (const d of [-0.24, 0.24]) g.tube([[sx + out * d, y, z], [sx + out * d, y - 0.13, z]], 0.005, { segs: 4 });
  });
  sign(s, spec, sx, y - 0.13 - 0.3, z, { face: 'z', double: true, w: 0.62, h: 0.6, back: o.back || '#2a2622' });
}

// ---------------------------------------------------------------------------------------------------------------
// Drawing functions (used by the props and directly where a prop cannot be turned the right way)
// ---------------------------------------------------------------------------------------------------------------

// A paper tag on a thread: hangs from (x, y, z) facing +z. Small and pale, with a coloured eyelet.
export function drawTag(g, x, y, z, o = {}) {
  g.mat('weave', o.thread || '#d8cdb8'); g.tube([[x, y, z], [x + 0.01, y - 0.07, z + 0.004]], 0.0018, { segs: 3, caps: false });
  g.mat('paper', o.paper || '#efe4c8');
  g.push(); g.move(x + 0.01, y - 0.07, z + 0.004); g.rotZ(o.tilt || 0.18); g.box(-0.03, -0.075, -0.0015, 0.03, 0, 0.0015); g.pop();
  g.mat('cast', o.eye || '#b08a45'); g.cyl(x + 0.01, y - 0.075, z + 0.004, 0.006, 0.004, { segs: 6 });
}

// A heliox flute standing along +y from the origin: wood body, nickel head joint, brass keys on the +z side.
export function drawFlute(g, len, o = {}) {
  const r = o.r || 0.0165, wood = o.wood || '#6b3f22', metal = o.metal || '#c9b27a', head = o.head || '#cfcac0';
  if (o.body) g.mat('cast', o.body, { rough: -0.3 }); else g.mat('wood', wood, { rough: -0.15 }); g.cyl(0, 0, 0, r * 1.05, len * 0.78, { segs: 8, capBottom: false });
  g.mat('cast', head, { rough: -0.25 }); g.cyl(0, len * 0.78, 0, r * 0.98, len * 0.22, { segs: 8 });
  g.mat('cast', metal, { rough: -0.2 });
  for (const t of [0.02, 0.4, 0.78, 0.995]) g.cyl(0, len * t - 0.012, 0, r * 1.3, 0.024, { segs: 8 });
  // the lip plate and embouchure
  g.box(-0.011, len * 0.9 - 0.022, r * 0.6, 0.011, len * 0.9 + 0.022, r * 1.35, { bevel: 0.003 });
  g.mat('plain', '#140e0a'); g.box(-0.005, len * 0.9 - 0.007, r * 1.35, 0.005, len * 0.9 + 0.007, r * 1.4);
  // keys over the holes, a rod beside them
  g.mat('cast', metal, { rough: -0.2 });
  const n = o.keys || 8;
  for (let i = 0; i < n; i++) { const y = len * (0.1 + 0.55 * i / (n - 1)); g.box(-0.012, y - 0.014, r * 0.95, 0.012, y + 0.014, r * 1.45, { bevel: 0.004 }); }
  g.tube([[r * 1.25, len * 0.08, r * 0.7], [r * 1.25, len * 0.7, r * 0.7]], 0.0025, { segs: 4 });
}

// A sash clamp: a steel bar of length len along +x from the origin, with a fixed jaw, a sliding jaw and a screw.
export function drawClamp(g, len, o = {}) {
  g.mat('cast', o.bar || '#3c4148', { rough: -0.1 }); g.box(0, -0.012, -0.005, len, 0.012, 0.005);
  g.mat('cast', o.jaw || '#c24a2a');
  g.box(0.02, 0.012, -0.018, 0.06, 0.07, 0.018, { bevel: 0.004 }); g.box(len - 0.12, 0.012, -0.018, len - 0.08, 0.07, 0.018, { bevel: 0.004 });
  g.mat('cast', '#9a9488'); g.tube([[-0.06, 0.04, 0], [0.06, 0.04, 0]], 0.006, { segs: 5 }); g.tube([[-0.06, 0.0, 0], [-0.06, 0.08, 0]], 0.004, { segs: 4 });
}

// Shears lying flat at the origin, pointing along +x.
export function drawShears(g, o = {}) {
  g.mat('cast', o.blade || '#b9b6ae', { rough: -0.3 });
  g.prism([[0, -0.006], [0.2, -0.002], [0.2, 0.002], [0, 0.01]], 0.0, 0.004); g.push(); g.rotY(0.12); g.prism([[0, -0.01], [0.19, -0.002], [0.19, 0.002], [0, 0.006]], 0.004, 0.008); g.pop();
  g.mat('cast', o.handle || '#1f1f22');
  const loop = (cx, cz, rr) => { const p = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; p.push([cx + Math.cos(a) * rr * 1.3, 0.005, cz + Math.sin(a) * rr]); } g.tube(p, 0.005, { segs: 4, closed: true }); };
  loop(-0.05, -0.02, 0.022); loop(-0.06, 0.025, 0.026);
  g.ball(0.003, 0.009, 0, 0.006, 0.004, 0.006, { segs: 6, rings: 3 });
}

// A skein of yarn hanging from a rail at (x, y, z): a long twisted loop.
export function drawSkein(g, x, y, z, len, col, along = 'x') {
  g.mat('knit', col);
  const pts = []; const n = 9, W = (t) => 0.03 * Math.min(1, t * 5) * (t > 0.85 ? Math.sqrt(Math.max(0, 1 - (t - 0.85) / 0.15 * 0.7)) : 1);
  for (let i = 0; i <= n; i++) { const t = i / n, w = W(t), tw = 0.012 * Math.sin(t * 7); pts.push(along === 'x' ? [x - w, y - t * len, z + tw] : [x + tw, y - t * len, z - w]); }
  for (let i = n; i >= 0; i--) { const t = i / n, w = W(t), tw = 0.012 * Math.sin(t * 7); pts.push(along === 'x' ? [x + w, y - t * len, z - tw] : [x - tw, y - t * len, z + w]); }
  g.tube(pts, 0.013, { segs: 5, closed: true });
}

// A length of cloth hanging over a rail at height y, running along x from a to b at z (or along z at x when along = 'z'): both halves.
export function drawDrape(g, a, b, y, c, drop, col, o = {}) {
  g.mat(o.mat || 'weave', col);
  const P = (u, yy, off) => o.along === 'z' ? [c + off, yy, u] : [u, yy, c + off];
  for (const sd of [-1, 1]) {
    const d = drop * (sd > 0 ? 1 : (o.back || 0.92));
    g.sheet(P(a, y, sd * 0.014), P(b, y, sd * 0.014), P(b, y - d, sd * 0.035), P(a, y - d, sd * 0.035), { nu: Math.max(6, Math.round(Math.abs(b - a) * 10)), nv: 5, sag: 0.03, ripple: o.ripple === undefined ? 0.035 : o.ripple, rippleN: Math.max(3, Math.round(Math.abs(b - a) * 4.5)) + (sd > 0 ? 0 : 1) });
  }
  // the fold over the rail
  { const p0 = P(a, y + 0.012, 0), p1 = P(b, y + 0.012, 0); g.tube([p0, p1], 0.016, { segs: 6 });
  }
}

// A row of folded cloth piled on a shelf: (x, y, z) is the front-left of the pile, w across, d deep, n layers.
export function drawPile(g, x, y, z, w, d, cols, r) {
  let yy = y;
  for (let i = 0; i < cols.length; i++) {
    const t = r.f(0.022, 0.045), dx = r.f(-0.015, 0.015), dz = r.f(-0.012, 0.012);
    g.mat(['weave', 'knit', 'stripe', 'motif', 'felt', 'weave'][r.i(0, 5)], cols[i]);
    g.box(x + dx, yy, z + dz - d, x + w + dx, yy + t, z + dz, { bevel: Math.min(0.01, t * 0.4) });
    yy += t;
  }
  return yy;
}

// A chair in one of several styles and states, front toward +z, seat at 0.45.
//   p: { style: 'ladder' | 'spindle' | 'arm' | 'slat', state: 'done' | 'webbed' | 'bare', wood, cloth, seat }
export function drawChair(g, p) {
  const style = p.style || 'ladder', state = p.state || 'done', wood = p.wood || '#6b4a2f', cloth = p.cloth || '#a0452e';
  const W = (rough) => g.mat('wood', state === 'bare' ? mixHex(wood, '#d9b98a', 0.45) : wood, { rough: rough === undefined ? -0.05 : rough });
  if (style === 'ladder' || style === 'slat') {
    W();
    for (const sx of [-1, 1]) {
      g.box(sx * 0.21 - 0.018, 0, 0.18, sx * 0.21 + 0.018, 0.44, 0.216, { bevel: 0.005 });
      g.tube([[sx * 0.21, 0, -0.2], [sx * 0.21, 0.44, -0.19], [sx * 0.2, 1.02, -0.27]], [0.021, 0.02, 0.016], { segs: 6 });
      g.ball(sx * 0.2, 1.03, -0.27, 0.022, 0.026, 0.022, { segs: 6, rings: 4 });
    }
    // seat rails and stretchers
    g.box(-0.21, 0.39, 0.18, 0.21, 0.445, 0.21); g.box(-0.21, 0.39, -0.205, 0.21, 0.445, -0.18);
    for (const sx of [-1, 1]) g.box(sx * 0.21 - 0.015, 0.39, -0.19, sx * 0.21 + 0.015, 0.445, 0.19);
    for (const yy of [0.14, 0.24]) { g.tube([[-0.21, yy, 0.2], [0.21, yy, 0.2]], 0.01, { segs: 5 }); for (const sx of [-1, 1]) g.tube([[sx * 0.21, yy + 0.04, 0.19], [sx * 0.21, yy + 0.04, -0.19]], 0.01, { segs: 5 }); }
    // the back: curved ladder slats, or upright slats
    if (style === 'ladder') for (const yy of [0.62, 0.78, 0.94]) { const zz = -0.19 - (yy - 0.44) / 0.58 * 0.075; const pts = []; for (let i = 0; i <= 6; i++) { const u = -0.2 + 0.4 * i / 6; pts.push([u, yy, zz - 0.03 * Math.cos(u / 0.2 * Math.PI / 2)]); } g.tube(pts, [0.012, 0.03, 0.03, 0.03, 0.03, 0.03, 0.012].map((v) => Math.max(0.012, v * 0.9)), { segs: 4 }); }
    else { g.box(-0.2, 0.96, -0.29, 0.2, 1.0, -0.25, { bevel: 0.006 }); for (let i = 0; i < 4; i++) { const u = -0.12 + i * 0.08; g.box(u - 0.016, 0.47, -0.235, u + 0.016, 0.97, -0.215, { bevel: 0.004 }); } }
    if (state === 'done') { g.mat(p.seat === 'cloth' ? 'weave' : 'rush', p.seat === 'cloth' ? cloth : '#c9a35e'); g.box(-0.2, 0.43, -0.185, 0.2, 0.47, 0.205, { bevel: 0.012 }); }
    else if (state === 'webbed') { g.mat('weave', '#cdb07a'); for (const u of [-0.12, 0, 0.12]) { g.box(u - 0.03, 0.445, -0.19, u + 0.03, 0.452, 0.2); g.box(-0.2, 0.452, u - 0.03, 0.2, 0.459, u + 0.03); } }
    return;
  }
  if (style === 'spindle') {
    const seatPoly = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; seatPoly.push([Math.cos(a) * 0.235, Math.sin(a) * (Math.sin(a) > 0 ? 0.22 : 0.2)]); }
    W(-0.1); g.prism(seatPoly, 0.41, 0.455);
    W();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.25, 0, sz * 0.25], [sx * 0.16, 0.415, sz * 0.14]], [0.022, 0.017], { segs: 6 });
    g.tube([[-0.21, 0.17, 0.0], [0.21, 0.17, 0.0]], 0.012, { segs: 5 });
    for (const sx of [-1, 1]) g.tube([[sx * 0.215, 0.18, 0.23], [sx * 0.215, 0.18, -0.23]], 0.011, { segs: 5 });
    const bow = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; bow.push([-Math.cos(a) * 0.21, 0.45 + Math.sin(a) * 0.58, -0.17 - Math.sin(a) * 0.09]); }
    g.tube(bow, 0.017, { segs: 6 });
    for (let i = 1; i < 7; i++) { const a = Math.PI * i / 7; const tx = -Math.cos(a) * 0.21, ty = 0.45 + Math.sin(a) * 0.58; g.tube([[tx * 0.85, 0.45, -0.16], [tx, ty, -0.17 - Math.sin(a) * 0.09]], 0.008, { segs: 4 }); }
    return;
  }
  // 'arm': an upholstered armchair
  W(0);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.cube(sx * 0.31, 0.09, sz * 0.29, 0.045, 0.18, 0.045, { bevel: 0.008 });
  g.box(-0.34, 0.18, -0.32, 0.34, 0.3, -0.27); g.box(-0.34, 0.18, 0.27, 0.34, 0.3, 0.32);
  for (const sx of [-1, 1]) {
    g.box(sx * 0.34 - 0.03, 0.18, -0.32, sx * 0.34 + 0.03, 0.3, 0.32);
    g.box(sx * 0.34 - 0.035, 0.3, 0.24, sx * 0.34 + 0.035, 0.64, 0.3, { bevel: 0.008 });
    g.box(sx * 0.34 - 0.04, 0.6, -0.3, sx * 0.34 + 0.04, 0.66, 0.31, { bevel: 0.012 });
    g.box(sx * 0.32 - 0.025, 0.3, -0.33, sx * 0.32 + 0.025, 0.98, -0.27, { bevel: 0.008 });
  }
  g.box(-0.32, 0.9, -0.34, 0.32, 0.98, -0.27, { bevel: 0.01 });
  if (state === 'done') {
    g.mat('weave', cloth);
    g.box(-0.3, 0.3, -0.26, 0.3, 0.46, 0.33, { bevel: 0.045 });
    g.push(); g.move(0, 0.46, -0.27); g.rotX(-0.14); g.box(-0.3, 0, -0.05, 0.3, 0.52, 0.09, { bevel: 0.04 }); g.pop();
    for (const sx of [-1, 1]) g.box(sx * 0.34 - 0.055, 0.46, -0.28, sx * 0.34 + 0.055, 0.69, 0.32, { bevel: 0.035 });
    g.mat('cast', p.stud || '#b08a45'); for (let i = 0; i < 8; i++) { const u = -0.27 + i * 0.077; g.ball(u, 0.36, 0.335, 0.008, 0.008, 0.006, { segs: 5, rings: 3 }); }
  } else if (state === 'webbed') {
    g.mat('weave', '#cdb07a');
    for (const u of [-0.2, -0.07, 0.07, 0.2]) { g.box(u - 0.035, 0.3, -0.29, u + 0.035, 0.308, 0.3); g.box(-0.33, 0.308, u - 0.035, 0.33, 0.316, u + 0.035); }
    g.mat('cast', '#8c8a84', { rough: -0.2 });
    for (const sx of [-0.13, 0.13]) for (const sz of [-0.12, 0.12]) { const c = []; for (let i = 0; i <= 28; i++) { const a = i / 28 * Math.PI * 2 * 4; const rr = 0.05 + 0.015 * Math.sin(i / 28 * Math.PI); c.push([sx + Math.cos(a) * rr, 0.316 + i / 28 * 0.12, sz + Math.sin(a) * rr]); } g.tube(c, 0.0035, { segs: 3 }); }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------

defineProp('craft.chair', (g, p) => {
  drawChair(g, p);
  const sitY = p.style === 'arm' ? (p.state === 'done' ? 0.46 : 0.31) : 0.46;
  const spots = p.state === 'done' || p.style === 'spindle' ? [{ type: 'sit', x: 0, y: sitY, z: 0.03, yaw: 0 }] : [];
  return p.style === 'arm' ? { solid: [[-0.38, 0, -0.34, 0.38, 0.6, 0.33]], spots, tier: 's' } : { posts: [[0, 0, 0.24, 0, 0.46]], spots, tier: 's' };
});

// A dress form, or a mannequin with a head; with an optional coat full of mends.
//   p: { coat, lining, trim, mends: [{ kind: 'patch' | 'darn' | 'gold', c, a, y, w, h }], head, long, form, stand, tag, sleeves }
defineProp('craft.form', (g, p) => {
  const ZS = 0.74;
  const stand = p.stand || '#3a2c22';
  g.mat('wood', stand, { rough: -0.1 });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.3; g.tube([[Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26], [Math.cos(a) * 0.05, 0.12, Math.sin(a) * 0.05]], [0.016, 0.02], { segs: 6 }); g.ball(Math.cos(a) * 0.26, 0.02, Math.sin(a) * 0.26, 0.02, 0.02, 0.02, { segs: 6, rings: 3 }); }
  g.mat('cast', '#2a2622'); g.cyl(0, 0.1, 0, 0.012, p.coat && p.long ? 0.6 : 0.88, { segs: 6 });
  // the torso
  g.push(); g.scale(1, 1, ZS);
  g.mat('weave', p.form || '#d8c7a6');
  const torso = [[0.0, 0.94], [0.13, 0.95], [0.165, 1.04], [0.14, 1.18], [0.17, 1.32], [0.18, 1.41], [0.15, 1.49], [0.06, 1.53], [0.045, 1.57], [0.045, 1.62], [0.02, 1.63], [0, 1.63]];
  g.lathe(0, 0, torso, { segs: 16 });
  g.pop();
  g.mat('wood', stand); g.cyl(0, 1.62, 0, 0.03, 0.04, { segs: 8 });
  if (p.head) { g.mat('paint', p.form || '#d8c7a6', { rough: -0.2 }); g.cyl(0, 1.56, 0, 0.042, 0.1, { segs: 10 }); g.ball(0, 1.75, 0.01, 0.085, 0.11, 0.095, { segs: 14, rings: 9 }); }
  if (p.coat) {
    const hem = p.long ? 0.62 : 0.92;
    const prof = [[p.long ? 0.27 : 0.235, hem], [0.205, 1.06], [0.175, 1.18], [0.192, 1.32], [0.2, 1.42], [0.17, 1.5], [0.09, 1.55], [0.06, 1.58]];
    const R = (y) => { for (let i = 0; i < prof.length - 1; i++) { const a = prof[i], b = prof[i + 1]; if (y >= a[1] && y <= b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]); } return 0.18; };
    g.push(); g.scale(1, 1, ZS);
    g.mat('weave', p.coat); g.lathe(0, 0, prof, { segs: 18, capBottom: false, capTop: false });
    g.mat('weave', p.lining || shadeHex(p.coat, 0.7)); g.lathe(0, 0, prof.slice().reverse().map((q) => [q[0] - 0.008, q[1]]), { segs: 18, capBottom: false, capTop: false });
    // a contrast band at the hem
    if (p.trim) { g.mat('weave', p.trim); g.lathe(0, 0, [[prof[0][0] + 0.003, hem], [R(hem + 0.05) + 0.003, hem + 0.05]], { segs: 18, capBottom: false, capTop: false }); }
    g.pop();
    // collar, placket, buttons
    g.mat('weave', p.trim || shadeHex(p.coat, 0.75));
    const col = []; for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2; col.push([Math.sin(a) * 0.085, 1.555 + 0.02 * Math.cos(a), Math.cos(a) * 0.085 * 0.85]); }
    g.tube(col, 0.026, { segs: 6, closed: true });
    g.box(-0.018, hem + 0.02, R(1.0) * ZS - 0.004, 0.018, 1.5, R(1.0) * ZS + 0.006);
    g.mat('cast', p.button || '#b08a45');
    for (let i = 0; i < 5; i++) { const y = 1.05 + i * 0.09; g.ball(0, y, R(y) * ZS + 0.012, 0.011, 0.011, 0.007, { segs: 6, rings: 4 }); }
    // sleeves
    if (p.sleeves !== false) {
      g.mat('weave', p.coat);
      for (const sx of [-1, 1]) {
        g.tube([[sx * 0.19, 1.46, 0], [sx * 0.235, 1.2, 0.02], [sx * 0.255, 0.97, 0.05]], [0.06, 0.055, 0.052], { segs: 8, caps: false });
        g.mat('weave', p.trim || shadeHex(p.coat, 0.75)); g.tube([[sx * 0.255, 0.99, 0.05], [sx * 0.258, 0.94, 0.055]], 0.058, { segs: 8 });
        g.mat('weave', p.coat);
      }
    }
    // the mends: on the surface at angle a (0 = straight ahead), height y
    for (const m of (p.mends || [])) {
      const a = m.a || 0, y = m.y, rr = R(y) + 0.004, x = Math.sin(a) * rr, z = Math.cos(a) * rr * ZS;
      g.push(); g.move(x, y, z); g.rotY(Math.atan2(Math.sin(a), Math.cos(a) * ZS));
      const w = m.w || 0.07, h = m.h || 0.06;
      if (m.kind === 'darn') {
        g.mat('knit', m.c);
        for (let i = 0; i < 6; i++) { const u = -w / 2 + w * (i + 0.5) / 6; g.box(u - 0.004, -h / 2, 0, u + 0.004, h / 2, 0.004); }
        g.mat('knit', m.c2 || shadeHex(m.c, 1.3));
        for (let i = 0; i < 5; i++) { const v = -h / 2 + h * (i + 0.5) / 5; g.box(-w / 2, v - 0.004, 0.003, w / 2, v + 0.004, 0.006); }
      } else if (m.kind === 'gold') {
        g.mat('cast', m.c || '#e0b040', { rough: -0.2 });
        const pts = []; const r2 = new Rng(hashStr('g' + y + a));
        for (let i = 0; i <= 8; i++) pts.push([r2.f(-0.012, 0.012) + (i % 2 ? 0.01 : -0.01), -h / 2 + h * i / 8, 0.004]);
        g.tube(pts, 0.004, { segs: 4 });
      } else {
        g.mat(m.mat || 'weave', m.c); g.box(-w / 2, -h / 2, 0, w / 2, h / 2, 0.005, { bevel: 0.002 });
        g.mat('weave', m.stitch || '#e0b040');
        for (let i = 0; i < 7; i++) { const u = -w / 2 + w * i / 6; g.box(u - 0.003, h / 2 - 0.004, 0.005, u + 0.003, h / 2 + 0.006, 0.007); g.box(u - 0.003, -h / 2 - 0.006, 0.005, u + 0.003, -h / 2 + 0.004, 0.007); }
      }
      g.pop();
    }
    if (p.tag) drawTag(g, 0.25, 1.02, 0.08, { eye: p.tag });
  }
  return { posts: [[0, 0, 0.24, 0, 1.6]], tier: 's' };
});

// A coat on a hanger, hanger hook at y = 0: front toward +z. p: { coat, lining, trim, mend, tag, child }
defineProp('craft.coat', (g, p) => {
  const k = p.child ? 0.68 : 1, ZS = 0.32;
  g.mat('wood', '#7a5a3a'); g.tube([[-0.2 * k, -0.06 * k, 0], [0, -0.005, 0], [0.2 * k, -0.06 * k, 0]], 0.009, { segs: 5 });
  g.mat('cast', '#9a9488'); const hk = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 1.3; hk.push([Math.sin(a) * 0.022, 0.03 + Math.cos(a) * 0.022 - 0.022 + 0.022, 0]); } g.tube([[0, -0.005, 0], [0, 0.03, 0]].concat(hk), 0.0028, { segs: 4 });
  const prof = [[0.2, -0.96], [0.185, -0.58], [0.17, -0.36], [0.19, -0.16], [0.19, -0.07], [0.12, -0.03], [0.05, -0.01]].map((q) => [q[0] * k, q[1] * k]);
  g.push(); g.scale(1, 1, ZS);
  g.mat('weave', p.coat); g.lathe(0, 0, prof, { segs: 14, capBottom: false, capTop: false });
  g.mat('weave', p.lining || shadeHex(p.coat, 0.7)); g.lathe(0, 0, prof.slice().reverse().map((q) => [q[0] - 0.006, q[1]]), { segs: 14, capBottom: false, capTop: false });
  g.pop();
  g.mat('weave', p.coat);
  for (const sx of [-1, 1]) g.tube([[sx * 0.18 * k, -0.08 * k, 0.0], [sx * 0.2 * k, -0.4 * k, 0.03], [sx * 0.19 * k, -0.68 * k, 0.05]], [0.05 * k, 0.046 * k, 0.044 * k], { segs: 7 });
  g.mat('weave', p.trim || shadeHex(p.coat, 0.75));
  for (const sx of [-1, 1]) g.tube([[sx * 0.19 * k, -0.66 * k, 0.05], [sx * 0.19 * k, -0.72 * k, 0.052]], 0.05 * k, { segs: 7 });
  g.box(-0.016, -0.94 * k, 0.185 * k * ZS - 0.002, 0.016, -0.06 * k, 0.185 * k * ZS + 0.006);
  if (p.mend) { g.mat('weave', p.mend); g.box(0.05 * k, -0.5 * k, 0.18 * k * ZS + 0.004, 0.12 * k, -0.42 * k, 0.18 * k * ZS + 0.009); g.mat('weave', '#e0b040'); g.box(0.045 * k, -0.425 * k, 0.18 * k * ZS + 0.009, 0.125 * k, -0.415 * k, 0.18 * k * ZS + 0.011); }
  if (p.tag) drawTag(g, 0.2 * k, -0.7 * k, 0.07, { eye: p.tag });
  return { cast: true, tier: 'd' };
});

// A wall of thread: spools on narrow shelves on a board, a rainbow across and light to dark down. Board w x h, front toward +z.
defineProp('craft.spoolwall', (g, p) => {
  const w = p.w || 3.4, h = p.h || 1.5, cols = p.cols || 24, rows = p.rows || 9, r = new Rng(hashStr('spools' + w + h));
  g.mat('wood', p.board || '#5a3d28'); g.box(-w / 2 - 0.04, 0, -0.03, w / 2 + 0.04, h + 0.06, 0, { bevel: 0.01 });
  g.mat('wood', shadeHex(p.board || '#5a3d28', 1.25)); g.box(-w / 2 - 0.06, h + 0.06, -0.035, w / 2 + 0.06, h + 0.1, 0.04, { bevel: 0.01 });
  const dx = w / cols, dy = h / rows;
  for (let j = 0; j < rows; j++) {
    const y = j * dy + 0.03;
    g.mat('wood', p.shelf || '#7a5a3a'); g.box(-w / 2, y - 0.012, 0, w / 2, y, 0.095, { bevel: 0.003 });
    for (let i = 0; i < cols; i++) {
      if (r.chance(0.035)) continue;          // a gap where a spool is out on the table
      const x = -w / 2 + (i + 0.5) * dx + r.f(-0.006, 0.006), z = 0.045;
      let hue = (i + r.f(-0.3, 0.3)) / cols * 0.92 + 0.98, sat = 0.62 + r.f(-0.12, 0.12), li = 0.78 - j / rows * 0.55 + r.f(-0.04, 0.04);
      if (i >= cols - 2) { sat = 0.04; li = 0.9 - j / rows * 0.8; }
      const c = hsl(hue % 1, sat, Math.max(0.12, Math.min(0.88, li)));
      const sh = Math.min(dy * 0.62, 0.085) + r.f(-0.008, 0.006), sr = Math.min(dx * 0.4, 0.042);
      g.mat('knit', c, { rough: -0.1 }); g.cyl(x, y + 0.004, z, sr, sh - 0.006, { segs: 7, capBottom: false });
      g.mat('wood', '#c9a06a'); g.cyl(x, y + sh - 0.003, z, sr * 1.14, 0.006, { segs: 7, capBottom: false });
    }
  }
  return { tier: 's', cast: false };
});

// A treadle sewing machine on its iron stand, front toward +z (the sewer sits at +z).
defineProp('craft.treadle', (g, p) => {
  const iron = '#1d1c1e', top = p.top || '#6b4428';
  g.mat('cast', iron, { rough: 0.1 });
  for (const sx of [-1, 1]) {
    const x = sx * 0.36;
    g.tube([[x, 0.02, -0.2], [x, 0.4, -0.12], [x, 0.72, -0.18]], 0.018, { segs: 6 });
    g.tube([[x, 0.02, 0.2], [x, 0.4, 0.12], [x, 0.72, 0.18]], 0.018, { segs: 6 });
    g.box(x - 0.03, 0, -0.24, x + 0.03, 0.04, 0.24, { bevel: 0.008 });
    const ring = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ring.push([x, 0.4 + Math.sin(a) * 0.09, Math.cos(a) * 0.09]); } g.tube(ring, 0.012, { segs: 5, closed: true });
  }
  g.box(-0.36, 0.7, -0.02, 0.36, 0.73, 0.02);
  // the flywheel and the treadle plate
  const fw = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; fw.push([0.3, 0.42 + Math.sin(a) * 0.2, Math.cos(a) * 0.2]); } g.tube(fw, 0.016, { segs: 6, closed: true });
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.tube([[0.3, 0.42, 0], [0.3, 0.42 + Math.sin(a) * 0.19, Math.cos(a) * 0.19]], 0.007, { segs: 4 }); }
  g.push(); g.move(0, 0.1, 0.06); g.rotX(-0.18); g.mat('grille', '#2a2826'); g.box(-0.26, -0.008, -0.12, 0.26, 0.008, 0.12); g.pop();
  g.mat('cast', iron); g.tube([[0, 0.1, 0.0], [0.3, 0.42, 0]], 0.006, { segs: 4 });
  // the cabinet top and its drawers
  g.mat('wood', top, { rough: -0.1 }); g.box(-0.46, 0.73, -0.24, 0.46, 0.765, 0.24, { bevel: 0.01 });
  g.mat('wood', shadeHex(top, 0.85)); g.box(-0.44, 0.52, -0.2, -0.24, 0.73, 0.22, { bevel: 0.008 });
  g.mat('cast', '#b08a45'); for (const y of [0.58, 0.67]) g.ball(-0.34, y, 0.225, 0.01, 0.01, 0.008, { segs: 6, rings: 3 });
  g.mat('wood', shadeHex(top, 1.1)); g.box(-0.43, 0.535, 0.215, -0.25, 0.62, 0.222); g.box(-0.43, 0.63, 0.215, -0.25, 0.715, 0.222);
  // the machine head
  const H = '#16161a'; g.mat('paint', H, { rough: -0.25 });
  g.box(-0.2, 0.765, -0.09, 0.2, 0.795, 0.09, { bevel: 0.006 });
  g.box(0.1, 0.795, -0.05, 0.18, 1.0, 0.04, { bevel: 0.02 });
  g.box(-0.2, 0.96, -0.045, 0.18, 1.04, 0.035, { bevel: 0.025 });
  g.box(-0.22, 0.86, -0.04, -0.15, 1.04, 0.04, { bevel: 0.015 });
  g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.tube([[-0.19, 0.86, 0.0], [-0.19, 0.81, 0.0]], 0.003, { segs: 4 }); g.box(-0.23, 0.795, -0.03, -0.15, 0.8, 0.03);
  g.mat('cast', '#c9a050', { rough: -0.2 });
  g.box(-0.14, 1.0, 0.035, 0.09, 1.012, 0.037); g.box(-0.14, 0.968, 0.035, 0.09, 0.974, 0.037); g.box(0.11, 0.82, 0.04, 0.17, 0.83, 0.042);
  g.mat('cast', '#3a3a3e'); g.push(); g.move(0.2, 0.95, -0.005); g.rotZ(Math.PI / 2); g.cyl(0, -0.02, 0, 0.07, 0.03, { segs: 14 }); g.pop();
  g.mat('weave', '#b8a888'); g.tube([[0.21, 0.92, -0.005], [0.29, 0.42 + 0.2, 0]], 0.003, { segs: 3 });
  g.mat('knit', p.thread || '#c8402e'); g.cyl(0.02, 1.04, -0.01, 0.016, 0.04, { segs: 7 });
  g.mat('weave', p.cloth || '#2f6f8f'); g.box(-0.34, 0.795, -0.05, -0.02, 0.802, 0.21, { bevel: 0.002 });
  return { solid: [[-0.46, 0, -0.24, 0.46, 0.78, 0.24]], spots: [{ type: 'work', x: 0, y: 0, z: 0.55, yaw: Math.PI, tags: ['sew'] }], tier: 's' };
});

// An ironing board with an iron on its rest, along x, front toward +z.
defineProp('craft.ironing', (g, p) => {
  g.mat('cast', '#7a7670'); for (const s of [-1, 1]) g.tube([[-0.35 * s, 0, -0.12], [0.3 * s, 0.86, -0.05]], 0.01, { segs: 5 }); for (const s of [-1, 1]) g.tube([[-0.35 * s, 0, 0.12], [0.3 * s, 0.86, 0.05]], 0.01, { segs: 5 });
  g.mat('stripe', p.cover || '#2f6f8f');
  g.prism([[-0.6, -0.17], [0.42, -0.17], [0.6, -0.08], [0.66, 0], [0.6, 0.08], [0.42, 0.17], [-0.6, 0.17]], 0.86, 0.885);
  g.mat('cast', '#8a8680'); g.box(-0.72, 0.86, -0.1, -0.6, 0.875, 0.1);
  g.mat('cast', '#b9b6ae', { rough: -0.3 }); g.prism([[-0.69, -0.06], [-0.69, 0.06], [-0.5, 0.0]].map((q) => [q[0], -q[1]]), 0.875, 0.895);
  g.mat('paint', '#7a2d22'); g.box(-0.67, 0.895, -0.012, -0.57, 0.95, 0.012, { bevel: 0.01 });
  g.mat('weave', '#2a2622'); g.tube([[-0.68, 0.92, 0], [-0.78, 0.6, 0.05], [-0.8, 0.02, 0.1]], 0.004, { segs: 4 });
  return { solid: [[-0.72, 0, -0.18, 0.66, 0.9, 0.18]] };
});

// A basket of things waiting to be mended. p: { cols }
defineProp('craft.basket', (g, p) => {
  const cols = p.cols || ['#2f6f8f', '#c8402e', '#d6a640', '#4a6b3a'], r = new Rng(hashStr('bk' + cols.join()));
  g.mat('cane', p.cane || '#b58a52'); g.lathe(0, 0, [[0, 0], [0.2, 0], [0.24, 0.04], [0.27, 0.32], [0.28, 0.34], [0.26, 0.34], [0.25, 0.32], [0.22, 0.04], [0, 0.03]], { segs: 16 });
  g.tube([[-0.26, 0.33, 0], [-0.18, 0.55, 0], [0, 0.6, 0], [0.18, 0.55, 0], [0.26, 0.33, 0]], 0.012, { segs: 5 });
  for (let i = 0; i < 5; i++) { g.mat(i % 2 ? 'knit' : 'weave', cols[i % cols.length]); g.ball(r.f(-0.12, 0.12), 0.3 + r.f(0, 0.05), r.f(-0.12, 0.12), r.f(0.08, 0.12), r.f(0.05, 0.08), r.f(0.07, 0.11), { segs: 8, rings: 5 }); }
  g.mat('weave', cols[0]); g.sheet([0.15, 0.34, 0.1], [0.27, 0.34, 0.18], [0.3, 0.12, 0.22], [0.17, 0.08, 0.14], { nu: 3, nv: 3, ripple: 0.01 });
  return { posts: [[0, 0, 0.28, 0, 0.34]] };
});

// A shallow box of buttons with compartments.
defineProp('craft.buttons', (g, p) => {
  const r = new Rng(hashStr('btn')), cols = ['#b08a45', '#2a2622', '#e9e1cf', '#7a2d22', '#2f6f8f', '#6c9a4c', '#d6a640', '#5b4060', '#c9c4bb'];
  g.mat('wood', p.wood || '#7a5233'); g.box(-0.2, 0, -0.13, 0.2, 0.012, 0.13);
  for (const x of [-0.2, -0.067, 0.067, 0.2]) g.box(x - 0.006, 0, -0.13, x + 0.006, 0.05, 0.13);
  for (const z of [-0.13, 0, 0.13]) g.box(-0.2, 0, z - 0.006, 0.2, 0.05, z + 0.006);
  for (let cx = 0; cx < 3; cx++) for (let cz = 0; cz < 2; cz++) {
    const n = r.i(9, 14);
    for (let i = 0; i < n; i++) { g.mat(r.chance(0.3) ? 'cast' : 'glaze', cols[r.i(0, cols.length - 1)], { rough: -0.2 }); g.cyl(-0.133 + cx * 0.133 + r.f(-0.045, 0.045), 0.012 + r.f(0, 0.02), -0.065 + cz * 0.13 + r.f(-0.045, 0.045), r.f(0.007, 0.012), 0.004, { segs: 6 }); }
  }
  return { cast: false };
});

// A bolt of cloth lying along x on a surface. p: { c, len, r, mat }
defineProp('craft.bolt', (g, p) => {
  const len = p.len || 0.9, r = p.r || 0.07;
  g.mat(p.mat || 'weave', p.c || '#2f6f8f'); g.tube([[-len / 2, r, 0], [len / 2, r, 0]], r, { segs: 12 });
  g.mat('paper', '#8a6a4a'); g.tube([[-len / 2 - 0.02, r, 0], [len / 2 + 0.02, r, 0]], 0.022, { segs: 8 });
  g.mat(p.mat || 'weave', p.c || '#2f6f8f'); g.sheet([-len / 2, r * 2 - 0.004, 0.0], [len / 2, r * 2 - 0.004, 0.0], [len / 2, r * 1.2, r + 0.07], [-len / 2, r * 1.2, r + 0.07], { nu: 4, nv: 2, ripple: 0.006 });
  return { cast: true };
});

// A dye vat: a steel tub on a drip tray, lidded, electric (a controller and a cable), its rim stained by years of one colour.
//   p: { dye, open: bool, r, h }
defineProp('craft.vat', (g, p) => {
  const r = p.r || 0.42, h = p.h || 0.86, dye = p.dye || '#26306b', rr = new Rng(hashStr('vat' + dye));
  g.mat('cast', '#4a4740'); g.box(-r - 0.1, 0, -r - 0.1, r + 0.1, 0.06, r + 0.1, { bevel: 0.012 });
  g.mat('plain', shadeHex(dye, 0.7), { rough: -0.3 }); g.box(-r - 0.06, 0.06, -r - 0.06, r + 0.06, 0.064, r + 0.06, { faces: 'Y' });
  g.mat('glaze', p.enamel || '#e6e1d5', { rough: -0.1 }); g.lathe(0, 0, [[0, 0.06], [r * 0.94, 0.06], [r, 0.12], [r, h - 0.05], [r * 1.04, h - 0.03], [r * 1.04, h], [r * 0.97, h], [r * 0.96, h - 0.04], [r * 0.96, 0.2]], { segs: 22, capTop: false });
  // the stain: a band of colour under the rim and drips down the side
  g.mat('glaze', mixHex('#e6e1d5', dye, 0.8), { rough: 0.05 }); g.lathe(0, 0, [[r + 0.002, h - 0.2], [r + 0.002, h - 0.05], [r * 1.042, h - 0.03], [r * 1.042, h + 0.001]], { segs: 22, capBottom: false, capTop: false });
  g.mat('glaze', mixHex('#e6e1d5', dye, 0.6), { rough: 0.1 }); for (let i = 0; i < 9; i++) { const a = rr.f(0, Math.PI * 2), L = rr.f(0.12, 0.5); g.push(); g.rotY(a); g.box(-0.012, h - 0.2 - L, r - 0.002, 0.012, h - 0.2, r + 0.004); g.ball(0, h - 0.2 - L, r + 0.001, 0.014, 0.02, 0.006, { segs: 5, rings: 3 }); g.pop(); }
  g.mat('cast', '#3a3632'); for (const y of [0.3, h - 0.25]) g.lathe(0, 0, [[r + 0.012, y], [r + 0.012, y + 0.03]], { segs: 22, capBottom: false, capTop: false });
  if (p.open) {
    g.mat('plain', dye, { rough: -0.45 }); g.cyl(0, h - 0.12, 0, r * 0.95, 0.002, { segs: 22, capBottom: false });
    g.mat('weave', mixHex(dye, '#ffffff', 0.15)); g.sheet([-0.1, h + 0.01, -r * 0.6], [0.1, h + 0.01, -r * 0.6], [0.1, h - 0.11, -r * 0.2], [-0.1, h - 0.11, -r * 0.2], { nu: 2, nv: 2, ripple: 0.01 });
    // the lid stands on its hinge at the back
    g.push(); g.move(0, h + 0.01, -r); g.rotX(-1.15); g.mat('glaze', p.enamel || '#e6e1d5', { rough: -0.1 }); g.lathe(0, r, [[r * 1.06, 0], [r * 0.9, 0.04], [r * 0.3, 0.08], [0, 0.085]], { segs: 22 }); g.pop();
  } else {
    g.mat('glaze', p.enamel || '#e6e1d5', { rough: -0.1 }); g.lathe(0, 0, [[r * 1.06, h], [r * 1.06, h + 0.02], [r * 0.85, h + 0.07], [r * 0.25, h + 0.1], [0, h + 0.1]], { segs: 22, capBottom: false });
    g.mat('wood', '#2a2622'); g.box(-0.08, h + 0.1, -0.018, 0.08, h + 0.13, 0.018, { bevel: 0.01 });
  }
  // the controller: a box with a dial and a small amber lamp, and its cable to the wall
  g.mat('paint', '#d9d2c2', { rough: -0.1 }); g.box(r - 0.04, h - 0.42, -0.08, r + 0.08, h - 0.22, 0.08, { bevel: 0.01 });
  g.mat('cast', '#2a2622'); g.push(); g.move(r + 0.08, h - 0.3, 0.02); g.rotZ(Math.PI / 2); g.cyl(0, 0, 0, 0.025, 0.02, { segs: 10 }); g.pop();
  g.mat('plain', '#ffb347', { emissive: 3 }); g.ball(r + 0.082, h - 0.36, -0.04, 0.008, 0.008, 0.008, { segs: 6, rings: 3 });
  g.mat('cast', '#2a2622'); g.tube([[r + 0.02, h - 0.42, 0], [r + 0.04, 0.3, -0.05], [r * 0.6, 0.07, -r - 0.05], [0, 0.07, -r - 0.12]], 0.01, { segs: 5 });
  return { posts: [[0, 0, r + 0.05, 0, h + 0.1]], tier: 's' };
});

// A cheval mirror on feet, front toward +z.
defineProp('craft.mirror', (g, p) => {
  const w = 0.62, h = 1.6, wood = p.wood || '#4a3020';
  g.mat('wood', wood, { rough: -0.1 });
  for (const sx of [-1, 1]) { g.box(sx * (w / 2 + 0.06) - 0.025, 0, -0.025, sx * (w / 2 + 0.06) + 0.025, 1.62, 0.025, { bevel: 0.008 }); g.box(sx * (w / 2 + 0.06) - 0.03, 0, -0.26, sx * (w / 2 + 0.06) + 0.03, 0.05, 0.26, { bevel: 0.012 }); g.ball(sx * (w / 2 + 0.06), 1.64, 0, 0.03, 0.03, 0.03, { segs: 8, rings: 5 }); }
  g.push(); g.move(0, 0.2, 0); g.rotX(-0.06);
  g.mat('wood', wood); g.box(-w / 2 - 0.04, 0, -0.025, w / 2 + 0.04, h - 0.1, 0.02, { bevel: 0.012 });
  g.mat('brushed', '#e8eef0', { rough: -0.5 }); g.box(-w / 2, 0.04, 0.02, w / 2, h - 0.14, 0.024, { faces: 'Z' });
  g.pop();
  return { solid: [[-w / 2 - 0.1, 0, -0.26, w / 2 + 0.1, 1.65, 0.26]], tier: 's' };
});

// A bench vise-and-all workbench: thick top, legs, a shelf below with offcuts. p: { w, d, wood }
defineProp('craft.bench', (g, p) => {
  const w = p.w || 2.2, d = p.d || 0.7, h = 0.86, wood = p.wood || '#8a6a44', r = new Rng(hashStr('bench' + w));
  g.mat('wood', wood, { rough: 0.05 }); g.box(-w / 2, h - 0.07, -d / 2, w / 2, h, d / 2, { bevel: 0.012 });
  g.mat('wood', shadeHex(wood, 0.8));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.box(sx * (w / 2 - 0.1) - 0.04, 0, sz * (d / 2 - 0.08) - 0.04, sx * (w / 2 - 0.1) + 0.04, h - 0.07, sz * (d / 2 - 0.08) + 0.04, { bevel: 0.008 });
  g.box(-w / 2 + 0.06, 0.18, -d / 2 + 0.06, w / 2 - 0.06, 0.21, d / 2 - 0.06, { bevel: 0.006 });
  g.box(-w / 2 + 0.06, 0.62, -d / 2 + 0.04, w / 2 - 0.06, 0.79, -d / 2 + 0.07);
  // the front vise
  g.mat('wood', shadeHex(wood, 1.12)); g.box(w / 2 - 0.5, h - 0.25, d / 2, w / 2 - 0.1, h - 0.01, d / 2 + 0.06, { bevel: 0.01 });
  g.mat('cast', '#3c4148'); g.tube([[w / 2 - 0.3, h - 0.12, d / 2 + 0.06], [w / 2 - 0.3, h - 0.12, d / 2 + 0.14]], 0.012, { segs: 6 }); g.tube([[w / 2 - 0.4, h - 0.12, d / 2 + 0.14], [w / 2 - 0.2, h - 0.12, d / 2 + 0.14]], 0.008, { segs: 5 });
  // offcuts on the shelf
  for (let i = 0; i < 7; i++) { g.mat('wood', mixHex(wood, ['#c9a06a', '#6b4a2f', '#a07850'][i % 3], 0.6)); const x = -w / 2 + 0.2 + i * (w - 0.4) / 7; g.box(x, 0.21, -d / 2 + 0.1 + r.f(0, 0.1), x + r.f(0.12, 0.25), 0.21 + r.f(0.04, 0.09), d / 2 - 0.12, { bevel: 0.005 }); }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h, d / 2]], spots: [{ type: 'work', x: 0, y: 0, z: d / 2 + 0.45, yaw: Math.PI }], tier: 's' };
});

// A woodturning lathe with a long bore in it (a flute half made). p: { len, piece }
defineProp('craft.lathe', (g, p) => {
  const len = p.len || 1.5;
  g.mat('cast', '#2f4a44', { rough: 0.05 });
  for (const sx of [-1, 1]) { g.box(sx * len / 2 - 0.06, 0, -0.18, sx * len / 2 + 0.06, 0.82, 0.18, { bevel: 0.012 }); }
  g.mat('cast', '#3c4148', { rough: -0.15 }); g.box(-len / 2, 0.82, -0.1, len / 2, 0.88, -0.02); g.box(-len / 2, 0.82, 0.02, len / 2, 0.88, 0.1);
  g.mat('cast', '#2f4a44'); g.box(-len / 2 - 0.05, 0.88, -0.11, -len / 2 + 0.2, 1.12, 0.11, { bevel: 0.025 });
  g.box(len / 2 - 0.22, 0.88, -0.08, len / 2 - 0.08, 1.06, 0.08, { bevel: 0.02 });
  g.mat('cast', '#c9c4bb', { rough: -0.3 }); g.push(); g.move(-len / 2 + 0.2, 1.0, 0); g.rotZ(-Math.PI / 2); g.cyl(0, 0, 0, 0.05, 0.04, { segs: 12 }); g.pop();
  g.push(); g.move(len / 2 - 0.22, 1.0, 0); g.rotZ(Math.PI / 2); g.cyl(0, 0, 0, 0.012, 0.06, { segs: 8, r1: 0.002 }); g.pop();
  // the tool rest
  g.mat('cast', '#3c4148'); g.box(-0.05, 0.88, 0.1, 0.05, 0.96, 0.16); g.box(-0.3, 0.96, 0.1, 0.3, 0.98, 0.13);
  // the piece: a long bore, rough at one end and turned smooth at the other
  g.mat('wood', p.piece || '#b07a42', { rough: -0.05 }); g.tube([[-len / 2 + 0.24, 1.0, 0], [-0.1, 1.0, 0]], 0.028, { segs: 10 }); g.tube([[-0.1, 1.0, 0], [len / 2 - 0.26, 1.0, 0]], 0.02, { segs: 10 });
  g.mat('wood', '#d9b98a'); const r = new Rng(hashStr('shav' + len));
  for (let i = 0; i < 26; i++) { const x = r.f(-len / 2 + 0.1, len / 2 - 0.1), z = r.f(-0.25, 0.3); const pts = []; for (let k = 0; k <= 5; k++) { const a = k / 5 * Math.PI * 1.6; pts.push([x + Math.cos(a) * 0.015 + k * 0.006, 0.006 + Math.sin(a) * 0.012 + 0.012, z]); } g.tube(pts, 0.003, { segs: 3, caps: false }); }
  // a motor and its switch
  g.mat('paint', '#7a2d22'); g.box(-len / 2 + 0.02, 0.45, -0.17, -len / 2 + 0.22, 0.65, 0.05, { bevel: 0.02 });
  g.mat('plain', '#9fe08a', { emissive: 2 }); g.ball(-len / 2 + 0.08, 1.05, 0.112, 0.008, 0.008, 0.006, { segs: 6, rings: 3 });
  return { solid: [[-len / 2 - 0.06, 0, -0.18, len / 2 + 0.06, 1.1, 0.18]], spots: [{ type: 'work', x: 0, y: 0, z: 0.6, yaw: Math.PI, tags: ['carve'] }], tier: 's' };
});

// A heliox flute standing upright (rack or stand use). p: { len, wood, metal, head }
defineProp('craft.flute', (g, p) => { drawFlute(g, p.len || 1.2, p); return { cast: true }; });

// A music stand with a page of music. p: { metal }
defineProp('craft.stand', (g, p) => {
  g.mat('cast', p.metal || '#2a2622');
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5; g.tube([[Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26], [0, 0.32, 0]], 0.008, { segs: 4 }); }
  g.tube([[0, 0.32, 0], [0, 1.12, 0]], 0.011, { segs: 6 });
  g.push(); g.move(0, 1.12, 0.0); g.rotX(-0.35);
  g.box(-0.25, 0, -0.012, 0.25, 0.34, 0.0); g.box(-0.25, -0.01, -0.012, 0.25, 0.02, 0.05);
  g.mat('paper', '#efe6d2'); g.box(-0.22, 0.02, 0.0, 0.0, 0.33, 0.004); g.box(0.0, 0.02, 0.0, 0.22, 0.33, 0.004);
  g.mat('plain', '#3a3430');
  for (let s = 0; s < 6; s++) { const y0 = 0.3 - s * 0.045; for (let l = 0; l < 5; l++) { const y = y0 - l * 0.006; g.box(-0.2, y, 0.004, -0.02, y + 0.0012, 0.005); g.box(0.02, y, 0.004, 0.2, y + 0.0012, 0.005); } }
  const r = new Rng(hashStr('notes')); for (let i = 0; i < 40; i++) { const sx = r.chance(0.5) ? -0.2 : 0.02; const s = r.i(0, 5); g.box(sx + r.f(0.01, 0.17), 0.3 - s * 0.045 - r.f(0, 0.024), 0.004, sx + r.f(0.01, 0.17) + 0.006, 0.3 - s * 0.045 - r.f(0, 0.024) + 0.005, 0.006); }
  g.pop();
  return { posts: [[0, 0, 0.12, 0, 1.3]] };
});

// A cabinet of small drawers with brass pulls and paper labels. p: { w, h, d, cols, rows, wood, top }
defineProp('craft.drawers', (g, p) => {
  const w = p.w || 1.2, h = p.h || 1.0, d = p.d || 0.42, cols = p.cols || 6, rows = p.rows || 7, wood = p.wood || '#6b4428', r = new Rng(hashStr('dr' + w + h + cols));
  g.mat('wood', wood, { rough: -0.05 }); g.box(-w / 2, 0.06, -d / 2, w / 2, h, d / 2 - 0.02, { aoBottom: 0.6 });
  g.mat('wood', shadeHex(wood, 0.7)); g.box(-w / 2 + 0.02, 0, -d / 2 + 0.03, w / 2 - 0.02, 0.06, d / 2 - 0.05);
  g.mat('wood', p.top || shadeHex(wood, 1.15)); g.box(-w / 2 - 0.02, h, -d / 2, w / 2 + 0.02, h + 0.03, d / 2 + 0.01, { bevel: 0.008 });
  const cw = (w - 0.06) / cols, rh = (h - 0.12) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -w / 2 + 0.03 + i * cw, y0 = 0.09 + j * rh, out = r.chance(0.06) ? r.f(0.04, 0.12) : 0;
    g.mat('wood', mixHex(wood, '#c9a06a', r.f(0, 0.25))); g.box(x0 + 0.006, y0 + 0.006, d / 2 - 0.03 + out, x0 + cw - 0.006, y0 + rh - 0.006, d / 2 - 0.005 + out, { bevel: 0.004 });
    g.mat('paper', '#efe4c8'); g.box(x0 + cw * 0.3, y0 + rh * 0.55, d / 2 - 0.005 + out, x0 + cw * 0.7, y0 + rh * 0.8, d / 2 - 0.002 + out);
    g.mat('cast', '#b08a45', { rough: -0.2 }); g.ball(x0 + cw / 2, y0 + rh * 0.32, d / 2 - 0.0 + out, 0.009, 0.009, 0.01, { segs: 6, rings: 3 });
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.03, d / 2]], tier: 's' };
});

// A shadow board for tools, flat on a wall, front toward +z: painted outlines and the tools on their pegs (one missing: in use).
defineProp('craft.toolboard', (g, p) => {
  const w = p.w || 1.8, h = p.h || 0.9, r = new Rng(hashStr('tb' + w));
  g.mat('paint', p.board || '#2f4a3a', { rough: 0.1 }); g.box(-w / 2, 0, -0.02, w / 2, h, 0, { bevel: 0.008 });
  g.mat('wood', '#4a3424'); g.box(-w / 2 - 0.03, -0.03, -0.022, w / 2 + 0.03, 0.0, 0.01); g.box(-w / 2 - 0.03, h, -0.022, w / 2 + 0.03, h + 0.03, 0.01);
  const sil = '#e8dcc0';
  // saws, chisels, a mallet, a square, a spokeshave, a brace
  const chisel = (x, y, ghost, L) => { if (ghost) { g.mat('paint', sil); g.box(x - 0.012, y, 0, x + 0.012, y + L, 0.002); return; } g.mat('cast', '#b9b6ae', { rough: -0.2 }); g.box(x - 0.009, y, 0.01, x + 0.009, y + L * 0.55, 0.016); g.mat('wood', '#9a6a3a'); g.tube([[x, y + L * 0.55, 0.018], [x, y + L, 0.018]], 0.014, { segs: 6 }); };
  void r;
  // saw (top left)
  g.mat('paint', sil); g.box(-w / 2 + 0.08, h - 0.32, 0.0, -w / 2 + 0.55, h - 0.12, 0.002);
  g.mat('cast', '#b9b6ae', { rough: -0.2 });
  g.box(-w / 2 + 0.12, h - 0.29, 0.006, -w / 2 + 0.47, h - 0.15, 0.009);
  g.mat('wood', '#7a4a2a'); g.box(-w / 2 + 0.45, h - 0.3, 0.004, -w / 2 + 0.56, h - 0.13, 0.03, { bevel: 0.012 });
  // chisels in a row, one missing
  for (let i = 0; i < 6; i++) chisel(-w / 2 + 0.7 + i * 0.07, h - 0.36, i === 3, 0.26 - i * 0.012);
  // mallet
  g.mat('paint', sil); g.box(w / 2 - 0.5, h - 0.2, 0, w / 2 - 0.3, h - 0.1, 0.002);
  g.mat('wood', '#c9a06a'); g.box(w / 2 - 0.5, h - 0.2, 0.004, w / 2 - 0.3, h - 0.1, 0.09, { bevel: 0.01 }); g.mat('wood', '#7a4a2a'); g.tube([[w / 2 - 0.4, h - 0.2, 0.05], [w / 2 - 0.4, h - 0.5, 0.05]], 0.014, { segs: 6 });
  // a square and a spokeshave
  g.mat('cast', '#9a9488'); g.box(-w / 2 + 0.1, 0.1, 0.004, -w / 2 + 0.13, 0.4, 0.01); g.mat('wood', '#5a3d28'); g.box(-w / 2 + 0.1, 0.1, 0.004, -w / 2 + 0.3, 0.14, 0.03);
  g.mat('paint', sil); g.box(-w / 2 + 0.42, 0.14, 0, -w / 2 + 0.78, 0.2, 0.002);
  g.mat('cast', '#3c4148'); g.box(-w / 2 + 0.52, 0.15, 0.004, -w / 2 + 0.68, 0.19, 0.03); g.mat('wood', '#9a6a3a'); g.tube([[-w / 2 + 0.42, 0.17, 0.02], [-w / 2 + 0.53, 0.17, 0.02]], 0.012, { segs: 5 }); g.tube([[-w / 2 + 0.67, 0.17, 0.02], [-w / 2 + 0.78, 0.17, 0.02]], 0.012, { segs: 5 });
  // brace
  g.mat('cast', '#7a7670'); g.tube([[0.1, 0.42, 0.02], [0.1, 0.32, 0.02], [0.2, 0.3, 0.02], [0.2, 0.18, 0.02], [0.1, 0.16, 0.02], [0.1, 0.06, 0.02]], 0.008, { segs: 5 });
  g.mat('wood', '#9a6a3a'); g.ball(0.1, 0.44, 0.02, 0.03, 0.02, 0.03, { segs: 8, rings: 4 }); g.tube([[0.2, 0.2, 0.02], [0.2, 0.28, 0.02]], 0.016, { segs: 6 });
  // pegs
  g.mat('wood', '#c9a06a'); for (let i = 0; i < 6; i++) g.tube([[w / 2 - 0.65 + i * 0.1, 0.35, 0], [w / 2 - 0.65 + i * 0.1, 0.37, 0.07]], 0.008, { segs: 4 });
  return { tier: 's', cast: false };
});

// A glue pot with a brush. p: { glaze }
defineProp('craft.gluepot', (g, p) => {
  g.mat('glaze', p.glaze || '#6b4a2f'); g.lathe(0, 0, [[0, 0], [0.055, 0], [0.06, 0.02], [0.062, 0.1], [0.066, 0.11], [0.06, 0.112], [0.056, 0.1], [0.05, 0.015], [0, 0.012]], { segs: 12 });
  g.mat('plain', '#8a5a1a', { rough: -0.4 }); g.cyl(0, 0.085, 0, 0.054, 0.002, { segs: 12, capBottom: false });
  g.mat('wood', '#c9a06a'); g.tube([[0.01, 0.07, 0], [0.05, 0.24, 0.02]], 0.006, { segs: 5 });
  return { cast: false };
});
