// Parts for the line decks (lm_line_works.js, lm_line_rides.js): the cab as a drawing, meshes that move, platoons of cabs
// that run along a tube and wrap round, a lift lobby with four berths, rope rails for a queue, and small helpers.
// A cab here is the Lattice's: about 300 kg empty, 3.5 m long, 2 m wide, 2.1 m tall, streamlined at both ends.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { defineProp, prop } from '../world/props.js';
import { room } from '../world/kit2.js';
import { lamp } from '../world/kit.js';
import { sign } from '../world/signs.js';
import { shadeHex } from '../core/util.js';

export const lineParts = true;
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------------------------
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info' }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(who, lines); } finally { game.busy--; }
}
// A seat the player can take: (x, y, z) the floor under it, yaw the way it faces (prop convention: 0 faces +z).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.55, z, radius: o.radius || 1.0,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y: y + (o.lift || 0), z, yaw: PI - yaw, eye: o.eye || 1.12 }); p.yaw = PI - yaw; p.pitch = o.pitch || 0.02;
      if (o.onSit) o.onSit(game);
    } });
}
// Show a little menu and spend from the wallet. items: [{ id, name, desc, price }]. Returns the item or null.
export async function buy(game, menu, kicker) {
  if (!game.ui) return null;
  game.busy++;
  try {
    const items = menu.items.map((it) => Object.assign({}, it, { disabled: game.wallet && it.price > game.wallet.kwh + 1e-6 }));
    const id = await game.ui.menu({ kicker: kicker || '', title: menu.title, note: menu.note, items, wallet: game.wallet ? game.wallet.kwh : 0 });
    if (!id) return null;
    const it = menu.items.find((q) => q.id === id); if (!it) return null;
    if (game.wallet && it.price > 0 && !game.wallet.spend(it.price, it.name)) return null;
    return it;
  } finally { game.busy--; }
}
// Split [a, b] into pieces no longer than `step` and call fn(p0, p1, i): long things along x must bend with the drum.
export function runX(a, b, step, fn) { const n = Math.max(1, Math.ceil((b - a) / step)); for (let i = 0; i < n; i++) fn(a + (b - a) * i / n, a + (b - a) * (i + 1) / n, i); }
export function lineX(a, b, y, z, step = 2) { const n = Math.max(1, Math.ceil(Math.abs(b - a) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a + (b - a) * i / n, y, z]); return out; }

// ---------------------------------------------------------------------------------------------------------------
// meshes that move: drawn once into their own buffer, placed by the world every frame from userData.origin
// ---------------------------------------------------------------------------------------------------------------
export function movable(s, draw, origin, o = {}) {
  const g = new Geo(new MeshBuf(1024, 2048)); draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: o.center || [0, 0, 0], radius: o.radius || 6, far: o.far || 150, caster: !!o.caster, scope: s });
  s.meshes.push(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// The cab. Drawn along x, centred on the origin, its guide shoes on y = 0. o: { body, band, roof, skirt, lit (window glow,
// 0 for dark glass), lamp (nose lamps glow, 0 for none), sleep (one small amber lamp only), open (the near side panel off) }
// ---------------------------------------------------------------------------------------------------------------
export const CAB = { L: 3.5, W: 2.0, H: 2.1 };
export function capsule(L, y0, y1, r, n) {
  const pts = [], h = L / 2;
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (PI / 2) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(h - r, y0 + r, -PI / 2); corner(h - r, y1 - r, 0); corner(-h + r, y1 - r, PI / 2); corner(-h + r, y0 + r, PI);
  return pts;
}
export function drawCab(g, o = {}) {
  const body = o.body || '#e2d6bc', band = o.band || '#b0502c', roof = o.roof || shadeHex(body, 1.06), skirt = o.skirt || '#2c5a56';
  const hz = 0.94;
  // the shell: a rounded box in side view, faired top and bottom
  g.mat('paint', body, { rough: -0.25 }); g.extrude(capsule(3.5, 0.14, 2.1, 0.46, 3), -hz, hz, 'z');
  // a slightly lighter roof fairing and a teal skirt
  g.mat('paint', roof, { rough: -0.2 }); g.box(-1.25, 2.08, -0.7, 1.25, 2.13, 0.7, { bevel: 0.02 });
  g.mat('paint', skirt, { rough: -0.1 }); g.box(-1.45, 0.16, -hz - 0.012, 1.45, 0.42, hz + 0.012, { faces: 'zZ' });
  // the livery band and the window strip, both sides
  for (const sz of o.open ? [-1] : [-1, 1]) {
    const z0 = sz * hz, z1 = sz * (hz + 0.014);
    g.mat('paint', band, { rough: -0.1 }); g.box(-1.6, 0.9, Math.min(z0, z1), 1.6, 1.02, Math.max(z0, z1), { faces: sz > 0 ? 'Z' : 'z' });
    if (o.lit) g.mat('diffuser', '#ffd9a0', { emissive: o.lit }); else g.mat('plain', '#1d2426', { rough: -0.45 });
    g.box(-1.05, 1.18, Math.min(z0, z1), 1.05, 1.72, Math.max(z0, z1), { faces: sz > 0 ? 'Z' : 'z' });
    g.mat('cast', '#b08a45', { rough: -0.1 });
    for (const x of [-1.07, -0.36, 0.36, 1.07]) g.box(x - 0.025, 1.16, Math.min(z0, z1) - 0.004 * sz, x + 0.025, 1.74, Math.max(z0, z1) + 0.004 * sz, { faces: sz > 0 ? 'Z' : 'z' });
    // the door's seams on this side
    g.mat('plain', '#2a2622'); for (const x of [-0.5, 0.5]) g.box(x - 0.008, 0.45, Math.min(z0, z1) - 0.003 * sz, x + 0.008, 2.0, Math.max(z0, z1) + 0.003 * sz, { faces: sz > 0 ? 'Z' : 'z' });
  }
  if (o.open) {
    // the near panel is off: the felt lining and the benches show
    g.mat('felt', '#8a7a5c'); g.box(-1.5, 0.45, -0.85, 1.5, 1.95, -0.8, { faces: 'Z' });
    g.mat('carpet', '#5a2f3a'); g.box(-1.5, 0.42, -0.8, 1.5, 0.45, 0.9, { faces: 'Y' });
    g.mat('wood', '#7a5233'); for (const x of [-1.05, 1.05]) g.box(x - 0.22, 0.45, -0.75, x + 0.22, 0.88, 0.75, { bevel: 0.02 });
    g.mat('cast', '#b08a45'); g.tube([[-1.5, 1.95, 0.9], [1.5, 1.95, 0.9]], 0.02, { segs: 5 }); g.tube([[-1.5, 0.43, 0.9], [1.5, 0.43, 0.9]], 0.02, { segs: 5 });
  }
  // nose lamps at both ends, or one small amber lamp for a cab that is asleep
  for (const sx of [-1, 1]) {
    const x = sx * 1.75;
    if (o.sleep) { if (sx > 0) { g.mat('diffuser', '#ffb45a', { emissive: o.sleep }); g.box(x - 0.02, 1.62, -0.06, x + 0.012, 1.74, 0.06); } }
    else if (o.lamp) { g.mat('diffuser', sx > 0 ? '#fff1d6' : '#ff8a5a', { emissive: o.lamp }); g.box(x - 0.03, 1.5, -0.42, x + 0.01, 1.6, 0.42); }
    else { g.mat('plain', '#3a3430'); g.box(x - 0.03, 1.5, -0.42, x + 0.005, 1.6, 0.42); }
  }
  // guide shoes underneath
  g.mat('cast', '#2b2e30'); for (const sx of [-1, 1]) g.box(sx * 1.1 - 0.35, 0, -0.55, sx * 1.1 + 0.35, 0.16, 0.55);
}
defineProp('lmline.cab', (g, p) => { drawCab(g, p); return { solid: [[-1.75, 0, -1, 1.75, 2.1, 1]], tier: 's', cast: true }; });

// ---------------------------------------------------------------------------------------------------------------
// A platoon of cabs running along a tube and wrapping round: along x (o.axis 'x') or along z ('z').
// o: { n, dir (+1 or -1), speed (m/s), a0, a1 (the wrap range along the axis), at (start), y, c (the other coordinate),
//      colours: [[body, band], ...], light: { color, power, range, clip }, whoosh: true }
// ---------------------------------------------------------------------------------------------------------------
export function platoon(s, o) {
  const game = s.world.game, f = s.frame, n = o.n || 3, pitch = 3.62, len = n * pitch, alongX = o.axis !== 'z';
  const cols = o.colours || [['#e2d6bc', '#b0502c']];
  const mesh = movable(s, (g) => {
    for (let i = 0; i < n; i++) {
      const u = (i - (n - 1) / 2) * pitch, c = cols[(i + (o.seed || 0)) % cols.length];
      g.at(alongX ? u : 0, 0, alongX ? 0 : u, alongX ? 0 : PI / 2);
      drawCab(g, { body: c[0], band: c[1], lit: 2.2, lamp: 5 });
      g.pop();
    }
  }, alongX ? [o.at, o.y, o.c] : [o.c, o.y, o.at], { center: [0, 1, 0], radius: len / 2 + 1.5, far: 260 });
  let a = o.at;
  const l = o.light ? s.light({ at: alongX ? [a, o.y + 1.4, o.c] : [o.c, o.y + 1.4, a], color: o.light.color || '#ffe2b8', power: o.light.power || 3, range: o.light.range || 7, clip: o.light.clip, radius: 0.6 }) : null;
  const span = o.a1 - o.a0;
  let side = 0;
  s.every((dt) => {
    a += o.dir * o.speed * dt;
    if (a > o.a1) a -= span; else if (a < o.a0) a += span;
    if (alongX) mesh.userData.origin[0] = a; else mesh.userData.origin[2] = a;
    if (l) { if (alongX) l.theta = f.theta(a); else l.z = f.zd(a); }
    if (o.whoosh && game && game.player && game.player.frame === f) {
      const P = game.player.pos, d = (alongX ? P.x : P.z) - a, near = Math.abs((alongX ? P.z : P.x) - o.c) < (o.near || 9) && Math.abs(P.y - o.y) < 6;
      const sd = d > 0 ? 1 : -1;
      if (near && side && sd !== side && Math.abs(d) < 8) sfx(game, 'whoosh', f, alongX ? a : o.c, o.y + 1, alongX ? o.c : a);
      side = sd;
    }
  });
  return { mesh, get pos() { return a; } };
}

// ---------------------------------------------------------------------------------------------------------------
// A lift lobby: a room open on its front (z0, toward lower z) with four berth doors on its back wall (z1), a call
// button, a bench, a lamp and its sign. o: { x0, x1, z0, z1, h, stop, title, sub, board: spec, tint, accent, floor }
// Returns the room's clip box.
// ---------------------------------------------------------------------------------------------------------------
export function lobby(game, s, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, z0 = o.z0, z1 = o.z1, h = o.h || 4.2, cx = (x0 + x1) / 2, W = x1 - x0;
  const front = o.front || { at: 1.2, w: W - 2.4, h: 3.6 };
  const clip = room(s, { x0, z0, x1, z1, y: 0, h, floor: o.floor || ['terrazzo', '#b9ae98'], ceil: ['paint', '#e4dccb'],
    wall: { tint: o.tint || '#d9cdb2', dado: { h: 1.1, mat: 'tile', tint: o.accent || '#2c5a56' } }, open: { n: o.front === false ? false : [front] }, glow: { sky: '#ffe2b8', ground: '#b9a27a', power: 0.32 } });
  // a coffered ceiling with a long lit panel down the middle
  g.mat('paint', '#cfc5b0'); for (let x = x0 + 2; x < x1 - 1; x += 2.6) g.box(x - 0.08, h - 0.32, z0 + 0.2, x + 0.08, h, z1 - 0.2);
  s.flush({ tier: 's' });
  lamp(s, 'panel', cx, h - 0.02, (z0 + z1) / 2 + 1, { w: Math.min(6, W - 4), d: 0.6, K: 3300, power: 1.2, clip });
  // the berths: brass doors in stone frames on the back wall, each with a lit indicator and a call plate
  const bw = 1.4, n = 4, gap = (W - n * bw) / (n + 1), berths = [];
  for (let i = 0; i < n; i++) {
    const bx = x0 + gap * (i + 1) + bw * (i + 0.5); berths.push(bx);
    g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.2, 0, z1 - 0.26, bx + bw / 2 + 0.2, 2.62, z1 - 0.08, { faces: 'xXzY', bevel: 0.01 });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(bx - bw / 2, 0.02, z1 - 0.3, bx - 0.008, 2.36, z1 - 0.26); g.box(bx + 0.008, 0.02, z1 - 0.3, bx + bw / 2, 2.36, z1 - 0.26);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, z1 - 0.315, bx + bw / 2 - 0.06, yy + 0.03, z1 - 0.3);
    // a worn kick-plate where everyone stands
    g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(bx - bw / 2 - 0.1, 0.0, z1 - 0.95, bx + bw / 2 + 0.1, 0.008, z1 - 0.32, { faces: 'Y' });
    g.mat('diffuser', i === 1 ? '#3fe0d0' : '#ffd9a0', { emissive: i === 1 ? 3 : 2.2, lamp: true }); g.box(bx - 0.22, 2.46, z1 - 0.29, bx + 0.22, 2.54, z1 - 0.27);
    g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.26, 1.02, z1 - 0.13, bx + bw / 2 + 0.42, 1.3, z1 - 0.07, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.cyl(bx + bw / 2 + 0.34, 1.14, z1 - 0.14, 0.032, 0.012, { segs: 8 });
  }
  s.flush({ tier: 's' });
  // the stop's name over the berths, and the call
  sign(s, { kind: 'street', text: o.title, sub: o.sub, palette: ['#22302c', '#f1ead8'] }, cx, 3.1, z1 - 0.1, { face: 'z', w: Math.min(5, W - 2), h: 0.42, glow: 1.2 });
  for (const half of [0, 1]) {
    const bx = (berths[half * 2] + berths[half * 2 + 1]) / 2;
    s.interact({ x: bx, y: 1.2, z: z1 - 0.8, radius: 2.0, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(o.stop); } });
  }
  // a bench against one side wall, a plant in the corner, a mat at the front
  prop(s, 'bench', x0 + 0.45, 0, (z0 + z1) / 2, PI / 2, { w: Math.min(2.6, z1 - z0 - 3), back: true, wood: '#7a5233' });
  prop(s, 'plant', x1 - 0.6, 0, z1 - 0.7, 0, { kind: 'broad', size: 1.4, pot: '#2f6f73' });
  prop(s, 'plant', x0 + 0.6, 0, z1 - 0.7, 0, { kind: 'fern', size: 1.0, pot: '#a3563a' });
  g.mat('rush', '#8a7a5a'); g.box(cx - 2.2, 0.002, z0 + 0.2, cx + 2.2, 0.014, z0 + 1.6, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  if (o.board) sign(s, o.board, x1 - 0.1, 1.55, (z0 + z1) / 2 - 0.4, { face: 'x', w: 1.5, h: 1.05 });
  for (let i = 0; i < 4; i++) s.spot('stand', berths[i] + 0.2, 0, z1 - 1.5 - (i % 2) * 0.4, PI * (0.9 + i * 0.05), { tags: ['wait'] });
  s.spot('sit', x0 + 0.5, 0.46, (z0 + z1) / 2 - 0.6, PI / 2, { tags: ['wait'] });
  s.spot('sit', x0 + 0.5, 0.46, (z0 + z1) / 2 + 0.6, PI / 2, { tags: ['wait'] });
  s.path([[cx, z0 - 1.5], [cx, z0 + 1], [cx, z1 - 1.6]]);
  return clip;
}

// Brass posts with a sagging rope between them: a queue lane. pts: [[x, z], ...]
export function ropeRail(s, pts, rope, y = 0) {
  const g = s.g;
  g.mat('cast', '#b08a45', { rough: -0.1 });
  for (const p of pts) g.lathe(p[0], p[1], [[0.14, 0], [0.13, 0.03], [0.03, 0.06], [0.025, 0.9], [0.04, 0.93], [0.045, 0.98], [0, 1.0]].map((q) => [q[0], q[1] + y]), { segs: 10 });
  g.mat('weave', rope || '#8a2f3c');
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], line = []; for (let k = 0; k <= 8; k++) { const t = k / 8; line.push([a[0] + (b[0] - a[0]) * t, y + 0.88 - 0.16 * 4 * t * (1 - t), a[1] + (b[1] - a[1]) * t]); } g.tube(line, 0.018, { segs: 5 }); }
  s.flush({ tier: 'd' });
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; s.solid(Math.min(a[0], b[0]) - 0.05, y, Math.min(a[1], b[1]) - 0.05, Math.max(a[0], b[0]) + 0.05, y + 0.95, Math.max(a[1], b[1]) + 0.05); }
}

// A wait for the next frame between big parts of a build.
export function frameWait() { return new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); }); }
