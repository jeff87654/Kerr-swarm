// Shared parts for Candlewick's civic rooms: the two lift lobbies, the clinic, the block office, the choir room and the
// laundry. Helpers for talk and seats, a few hand-drawn fittings (ceiling works, wall trims, a live clock), and the
// props these rooms share. Everything here is drawn in the frame of the scope it is given.
import * as THREE from 'three';
import { lamp } from '../world/kit.js';
import { defineProp } from '../world/props.js';
import { signRect } from '../world/signs.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { deckRadius } from '../core/drum.js';
import { Rng, hashStr, shadeHex, mixHex } from '../core/util.js';
import { CAST } from '../content/cast.js';

export const civicParts = true;

export function candlewick(game) { return game.world.frame('candlewick', deckRadius(16), 0, 625); }

// ---------------------------------------------------------------------------------------------------------------
// Talk, reading, seats
// ---------------------------------------------------------------------------------------------------------------
export function speaker(id) {
  const c = CAST[id]; if (!c) return id;
  return { name: c.short || c.name, colour: (c.look && (c.look.lining || c.look.top)) || '#FFE3A8' };
}
export async function say(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(typeof who === 'string' && CAST[who] ? speaker(who) : who, lines); } finally { game.busy--; }
}
export async function choose(game, who, prompt, options) {
  if (!game.ui) return null;
  game.busy++;
  try { return await game.ui.choose(typeof who === 'string' && CAST[who] ? speaker(who) : who, prompt, options); } finally { game.busy--; }
}
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function meet(game, id) { if (game.journal && game.journal.meet) game.journal.meet(id); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
// A sign spec read aloud: its title, then its lines joined into sentences ('a|b' board lines become 'a: b').
export function specText(spec) {
  const ls = (spec.lines || []).map((l) => String(l).split('|').map((p) => p.trim()).filter(Boolean).join(': '));
  return ls;
}
export async function readSpec(game, spec, extra) {
  const lines = specText(spec);
  const out = [];
  let buf = '';
  for (const l of lines) { buf = buf ? buf + ' ' + l : l; if (buf.length > 90) { out.push(buf); buf = ''; } }
  if (buf) out.push(buf);
  if (extra) out.push(...(Array.isArray(extra) ? extra : [extra]));
  await say(game, spec.title || spec.text || 'A notice', out.length ? out : ['(blank)']);
}

// The player's yaw for a facing given in prop convention (prop yaw = atan2(dx, dz)).
export function pyaw(yaw) { return Math.PI - yaw; }
export function fy(dx, dz) { return Math.atan2(dx, dz); }

// A seat the player can take. (x, y, z): the floor under the seat; yaw: the way the seat faces (prop convention).
export function seat(s, x, y, z, yaw, label, o = {}) {
  return s.interact({ x, y: y + 0.5, z, radius: o.radius || 1.1, wide: true, priority: o.priority,
    prompt: (game) => (game.player.seat ? 'Stand up' : label),
    onUse(game) {
      const p = game.player; if (p.seat) { p.stand(); return; }
      p.sit({ x, y, z, yaw: pyaw(yaw), eye: o.eye || 1.12 }); p.yaw = pyaw(yaw); p.pitch = o.pitch || 0;
      if (o.onSit) o.onSit(game);
    } });
}

// ---------------------------------------------------------------------------------------------------------------
// Text on a quad facing any way, or lying on the floor
// ---------------------------------------------------------------------------------------------------------------
export function flatText(s, spec, cx, cy, cz, yaw, w, h, o = {}) {
  const game = s.world.game; if (!game || !game.atlas) return;
  const R = signRect(game.atlas, spec, w, h), r = R.rect, g = s.g;
  const rx = Math.cos(yaw), rz = -Math.sin(yaw), nx = Math.sin(yaw) * 0.004, nz = Math.cos(yaw) * 0.004;
  g.atlas(r.page, { emissive: o.glow || 0, lamp: !!o.glow && o.lamp !== false }); if (R.cutout) g._mat[2] |= 16;
  g.quad([cx - rx * w / 2 + nx, cy - h / 2, cz - rz * w / 2 + nz], [cx + rx * w / 2 + nx, cy - h / 2, cz + rz * w / 2 + nz], [cx + rx * w / 2 + nx, cy + h / 2, cz + rz * w / 2 + nz], [cx - rx * w / 2 + nx, cy + h / 2, cz - rz * w / 2 + nz], { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 'd' });
}
// Text lying on the floor at height y, its top edge pointing (ux, uz) (so a reader standing on the other side reads it).
export function floorText(s, spec, cx, y, cz, ux, uz, w, h, o = {}) {
  const game = s.world.game; if (!game || !game.atlas) return;
  const R = signRect(game.atlas, spec, w, h), r = R.rect, g = s.g;
  const rx = -uz, rz = ux;     // right, seen by a reader whose "up the page" is (ux, uz)
  g.atlas(r.page, { emissive: o.glow || 0 }); if (R.cutout) g._mat[2] |= 16;
  const P = (a, b) => [cx + rx * a + ux * b, y, cz + rz * a + uz * b];
  g.quad(P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2), P(-w / 2, h / 2), { uv: [r.u0, r.v1, r.u1, r.v0] });
  s.flush({ tier: o.tier || 's', cast: false });
}

// ---------------------------------------------------------------------------------------------------------------
// Ceiling works and wall trims: beams, a duct, a pipe run, a cable tray; a picture rail and a painted band
// ---------------------------------------------------------------------------------------------------------------
// beams run along z (from z0 to z1) every `every` metres across x; o: { beam, duct, pipe, tray, ductZ, every, beamD }
export function ceilingWorks(s, x0, z0, x1, z1, H, o = {}) {
  const g = s.g, every = o.every || 2.4, bd = o.beamD || 0.22;
  const n = Math.max(1, Math.round((x1 - x0) / every));
  s.structure(() => {
    g.mat(o.beamMat || 'wood', o.beam || '#4a3324', { rough: -0.05 });
    for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n; g.box(x - 0.09, H - bd, z0 + 0.08, x + 0.09, H, z1 - 0.08, { bevel: 0.012, faces: 'xXyzZ' }); }
    // a wall plate along both long sides
    g.box(x0 + 0.08, H - 0.12, z0 + 0.08, x1 - 0.08, H, z0 + 0.2, { faces: 'yZ' }); g.box(x0 + 0.08, H - 0.12, z1 - 0.2, x1 - 0.08, H, z1 - 0.08, { faces: 'yz' });
  });
  if (o.duct !== false) {
    const dz = o.ductZ === undefined ? z0 + 0.55 : o.ductZ, dy = H - 0.3, R = 0.14;
    s.deco(() => {
      g.mat('brushed', o.duct || '#a9a49a'); g.tube([[x0 + 0.1, dy, dz], [x1 - 0.1, dy, dz]], R, { segs: 12, caps: false });
      g.mat('brushed', shadeHex(o.duct || '#a9a49a', 0.82));
      for (let x = x0 + 0.9; x < x1 - 0.3; x += 1.8) g.tube([[x - 0.03, dy, dz], [x + 0.03, dy, dz]], R + 0.016, { segs: 12 });
      g.mat('cast', '#34302b'); for (let x = x0 + 1.5; x < x1 - 0.3; x += 3.0) g.box(x - 0.015, dy + R - 0.02, dz - 0.01, x + 0.015, H, dz + 0.01);
    });
  }
  if (o.pipe !== false) {
    const pz = o.pipeZ === undefined ? z0 + 0.95 : o.pipeZ, py = H - 0.12;
    s.deco(() => {
      g.mat('cast', o.pipe || '#b07a45', { rough: -0.15 }); g.tube([[x0 + 0.1, py, pz], [x1 - 0.1, py, pz]], 0.03, { segs: 8, caps: false });
      g.mat('felt', '#cfc4ae'); g.tube([[x0 + 0.1, py, pz + 0.12], [x1 - 0.1, py, pz + 0.12]], 0.045, { segs: 8, caps: false });
      g.mat('cast', '#c8a45a'); for (let x = x0 + 0.7; x < x1 - 0.3; x += 1.4) g.tube([[x - 0.02, py, pz + 0.12], [x + 0.02, py, pz + 0.12]], 0.05, { segs: 8 });
    });
  }
}
// A picture rail and a painted band round the inside of a box room, skipping the sides listed in o.skip ('n','s','w','e').
export function trims(s, x0, z0, x1, z1, o = {}) {
  const g = s.g, t = o.inset || 0.163, skip = o.skip || '', y = o.rail || 2.3, H = o.H || 3.2;
  s.deco(() => {
    g.mat('wood', o.railTint || '#4a3324', { rough: -0.05 });
    if (skip.indexOf('n') < 0) g.box(x0 + t, y - 0.03, z0 + t, x1 - t, y + 0.03, z0 + t + 0.03, { faces: 'yYZxX' });
    if (skip.indexOf('s') < 0) g.box(x0 + t, y - 0.03, z1 - t - 0.03, x1 - t, y + 0.03, z1 - t, { faces: 'yYzxX' });
    if (skip.indexOf('w') < 0) g.box(x0 + t, y - 0.03, z0 + t, x0 + t + 0.03, y + 0.03, z1 - t, { faces: 'yYXzZ' });
    if (skip.indexOf('e') < 0) g.box(x1 - t - 0.03, y - 0.03, z0 + t, x1 - t, y + 0.03, z1 - t, { faces: 'yYxzZ' });
    if (o.band) {
      g.mat('paint', o.band);
      const b0 = H - (o.bandH || 0.32), b1 = H - 0.02;
      if (skip.indexOf('n') < 0) g.box(x0 + t, b0, z0 + t, x1 - t, b1, z0 + t + 0.006, { faces: 'Z' });
      if (skip.indexOf('s') < 0) g.box(x0 + t, b0, z1 - t - 0.006, x1 - t, b1, z1 - t, { faces: 'z' });
      if (skip.indexOf('w') < 0) g.box(x0 + t, b0, z0 + t, x0 + t + 0.006, b1, z1 - t, { faces: 'X' });
      if (skip.indexOf('e') < 0) g.box(x1 - t - 0.006, b0, z0 + t, x1 - t, b1, z1 - t, { faces: 'x' });
    }
  });
}

// A round wall clock whose hands keep the game's time. (x, y, z): the centre of its face; face: 'x'|'X'|'z'|'Z'.
export function wallClock(s, game, x, y, z, face, o = {}) {
  const g = s.g, W = s.world, R = o.r || 0.28;
  const n = face === 'X' ? [1, 0, 0] : face === 'x' ? [-1, 0, 0] : face === 'Z' ? [0, 0, 1] : [0, 0, -1];
  const yaw = Math.atan2(n[0], n[2]);
  s.deco(() => {
    g.at(x, y, z, yaw); g.rotX(Math.PI / 2);         // local y now points out of the wall (+z of the yawed frame)
    g.mat('paint', o.rim || '#1f4f4c', { rough: -0.2 }); g.cyl(0, -0.02, 0, R + 0.045, 0.07, { segs: 28 });
    g.mat('cast', o.brass || '#c8a45a', { rough: -0.2 }); g.cyl(0, 0.045, 0, R + 0.02, 0.012, { segs: 28 });
    g.mat('paint', o.dial || '#f3ead4', { emissive: o.glow === undefined ? 0.45 : o.glow, lamp: true }); g.cyl(0, 0.05, 0, R, 0.006, { segs: 28 });
    g.pop();
    g.at(x, y, z, yaw);
    g.mat('plain', '#1d1b18');
    for (let k = 0; k < 12; k++) {
      const t = k / 12 * Math.PI * 2, rr = R * 0.84, big = k % 3 === 0 ? 1.9 : 1;
      g.box(Math.sin(t) * rr - 0.011 * big, Math.cos(t) * rr - 0.011 * big, 0.056, Math.sin(t) * rr + 0.011 * big, Math.cos(t) * rr + 0.011 * big, 0.06);
    }
    g.pop();
  });
  const hands = [];
  for (const kind of ['h', 'm']) {
    const hg = new Geo(new MeshBuf(64, 128));
    hg.mat('cast', '#1d1b18', { rough: -0.2 });
    if (kind === 'h') hg.box(-0.016, -0.05, 0, 0.016, R * 0.55, 0.006); else hg.box(-0.01, -0.06, 0.007, 0.01, R * 0.84, 0.013);
    const mesh = new THREE.Mesh(hg.buf.toGeometry(), W.mats.opaque);
    const origin = [x + n[0] * 0.062, y, z + n[2] * 0.062];
    W.addRenderable(mesh, { frame: s.frame, origin, center: [0, 0, 0], radius: R + 0.1, far: 120, caster: false, scope: s });
    s.meshes.push(mesh); hands.push({ mesh, kind });
  }
  const right = [n[2], 0, -n[0]];      // up x n
  const upd = () => {
    const h = game && game.clock ? game.clock.hours : 12;
    for (const hd of hands) {
      const th = hd.kind === 'h' ? ((h % 12) / 12) * Math.PI * 2 : (h % 1) * Math.PI * 2;
      const hv = [Math.sin(th) * right[0], Math.cos(th), Math.sin(th) * right[2]];
      const x0 = hv[1] * n[2] - hv[2] * n[1], x1 = hv[2] * n[0] - hv[0] * n[2], x2 = hv[0] * n[1] - hv[1] * n[0];
      const e = hd.mesh.matrixWorld.elements;
      e[0] = x0; e[1] = x1; e[2] = x2; e[4] = hv[0]; e[5] = hv[1]; e[6] = hv[2]; e[8] = n[0]; e[9] = n[1]; e[10] = n[2];
    }
  };
  upd();
  W.dynamics.push({ scope: s, t: 0, update(dt) { this.t += dt; if (this.t > 0.5) { this.t = 0; upd(); } } });
}

// A drying rack on pulleys: two long rails at height y from (x0, z) to (x1, z), cords up to the ceiling pulleys, and
// whatever hangs on it. clothes: [{ at (0..1), w, drop, colour, mat }]
export function dryingRack(s, x0, x1, z, y, H, clothes, o = {}) {
  const g = s.g, wood = o.wood || '#9a7448';
  s.furniture(() => {
    g.mat('wood', wood, { rough: -0.05 });
    for (const dz of [-0.22, 0.22]) g.tube([[x0, y, z + dz], [x1, y, z + dz]], 0.018, { segs: 6 });
    for (const x of [x0 + 0.08, x1 - 0.08]) g.box(x - 0.03, y - 0.03, z - 0.27, x + 0.03, y + 0.03, z + 0.27, { bevel: 0.01 });
    g.mat('weave', '#e6dcc6');
    for (const x of [x0 + 0.08, x1 - 0.08]) { g.tube([[x, y + 0.03, z - 0.25], [x, H - 0.1, z]], 0.005, { segs: 4, caps: false }); g.tube([[x, y + 0.03, z + 0.25], [x, H - 0.1, z]], 0.005, { segs: 4, caps: false }); }
    g.mat('cast', '#5a5046'); for (const x of [x0 + 0.08, x1 - 0.08]) { g.cyl(x, H - 0.16, z, 0.05, 0.14, { segs: 10 }); }
  });
  s.detail(() => {
    for (const c of clothes) {
      const xa = x0 + (x1 - x0) * c.at, w = c.w || 0.5, d = c.drop || 0.6, dz = c.side || 0.22;
      g.mat(c.mat || 'weave', c.colour, { sway: 0.35 });
      g.sheet([xa - w / 2, y, z + dz], [xa + w / 2, y, z + dz], [xa + w / 2, y - d, z + dz + 0.02], [xa - w / 2, y - d, z + dz + 0.02], { sag: 0.02, ripple: 0.02, nu: 4, nv: 3 });
      if (c.fold) g.sheet([xa - w / 2, y, z + dz], [xa + w / 2, y, z + dz], [xa + w / 2, y - d * 0.6, z + dz - 0.12], [xa - w / 2, y - d * 0.6, z + dz - 0.12], { sag: 0.02, nu: 4, nv: 2 });
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------------------------------------------
// A berth door: a steel surround, two closed sliding leaves, a lamp over it that is lit when a cab waits behind.
// p: { surround, leaf, lit, enamel }
defineProp('civic.berth', (g, p) => {
  const sur = p.surround || '#2b3a38', leaf = p.leaf || '#b9b5ab';
  g.mat('paint', sur, { rough: -0.1 });
  g.box(-0.86, 0, -0.04, -0.62, 2.18, 0.08, { bevel: 0.015 }); g.box(0.62, 0, -0.04, 0.86, 2.18, 0.08, { bevel: 0.015 });
  g.box(-0.86, 2.18, -0.04, 0.86, 2.5, 0.09, { bevel: 0.015 });
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(-0.86, 2.47, 0.06, 0.86, 2.5, 0.1, { bevel: 0.006 }); g.box(-0.9, 0, -0.02, 0.9, 0.012, 0.22, { bevel: 0.004 });
  // the leaves, closed: brushed steel, a dark seam, vertical slots that show the cab's light when one is in
  g.mat('paint', leaf, { rough: 0.05, shade: 'metal' });
  g.box(-0.62, 0.012, -0.03, -0.006, 2.18, 0.0); g.box(0.006, 0.012, -0.03, 0.62, 2.18, 0.0);
  g.mat('paint', shadeHex(leaf, 0.75), { shade: 'metal' }); for (const sx of [-1, 1]) { g.box(sx * 0.6, 0.9, 0.0, sx * 0.08, 0.95, 0.008); g.box(sx * 0.6, 0.1, 0.0, sx * 0.08, 0.16, 0.008); }
  g.mat('plain', '#1b1a18'); g.box(-0.006, 0.012, -0.03, 0.006, 2.18, -0.004);
  g.mat('diffuser', p.lit ? '#ffd9a0' : '#3a3f40', p.lit ? { emissive: 1.4 } : { rough: -0.3 });
  for (const sx of [-1, 1]) g.box(sx * 0.33 - 0.035, 1.25, -0.004, sx * 0.33 + 0.035, 1.85, 0.003);
  g.mat('cast', '#2f2c28'); for (const sx of [-1, 1]) g.box(sx * 0.33 - 0.05, 1.23, -0.002, sx * 0.33 + 0.05, 1.87, 0.0);
  // the lamp housing over the door
  g.mat('cast', '#2f2c28'); g.box(-0.2, 2.66, 0.0, 0.2, 2.72, 0.16, { bevel: 0.01 });
  g.mat('diffuser', p.lit ? '#ffb347' : '#6a5a40', p.lit ? { emissive: 7 } : { rough: -0.2 });
  g.ball(0, 2.665, 0.08, 0.16, 0.12, 0.075, { segs: 14, rings: 6, top: 0 });
  return { solid: [[-0.9, 0, -0.06, 0.9, 2.6, 0.1]], tier: 's', cast: false };
});

// A call post: a turned column with a brass head, a lit panel and one big button. p: { body }
defineProp('civic.callpost', (g, p) => {
  const body = p.body || '#1f4f4c';
  g.mat('cast', '#3a3630'); g.lathe(0, 0, [[0.2, 0], [0.19, 0.04], [0.11, 0.08], [0.07, 0.14]], { segs: 18 });
  g.mat('paint', body, { rough: -0.2 }); g.lathe(0, 0, [[0.07, 0.14], [0.06, 0.9], [0.075, 0.96], [0.09, 1.0]], { segs: 16 });
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.box(-0.13, 1.0, -0.09, 0.13, 1.24, 0.09, { bevel: 0.03 });
  g.mat('paint', body); g.box(-0.11, 1.03, 0.07, 0.11, 1.21, 0.095, { bevel: 0.01 });
  g.mat('diffuser', '#9fe8d8', { emissive: 1.6 }); g.box(-0.08, 1.15, 0.094, 0.08, 1.19, 0.099);
  g.mat('cast', '#e8d9b0', { rough: -0.3 }); g.push(); g.move(0, 1.09, 0.095); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.035, 0.02, { segs: 14 }); g.pop();
  g.mat('cast', '#c8a45a'); g.push(); g.move(0, 1.09, 0.094); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.048, 0.008, { segs: 14 }); g.pop();
  return { posts: [[0, 0, 0.14, 0, 1.24]], tier: 's' };
});

// A drum washer with a round door, a little spinning drum (the locals stopped noticing). p: { body, load (cloth colour), open }
defineProp('civic.washer', (g, p) => {
  const body = p.body || '#e8e2d4';
  g.mat('paint', body, { rough: -0.25 }); g.box(-0.33, 0.04, -0.32, 0.33, 0.86, 0.32, { bevel: 0.035, aoBottom: 0.6 });
  g.mat('paint', shadeHex(body, 0.55)); g.box(-0.31, 0, -0.3, 0.31, 0.05, 0.3);
  // the control strip
  g.mat('paint', shadeHex(body, 0.85)); g.box(-0.31, 0.74, 0.3, 0.31, 0.84, 0.325, { bevel: 0.008 });
  g.mat('cast', '#c8a45a', { rough: -0.2 }); g.push(); g.move(0.2, 0.79, 0.322); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.03, 0.03, { segs: 12 }); g.pop();
  g.mat('diffuser', '#ffcf7a', { emissive: 2.2, lamp: false }); g.box(-0.24, 0.775, 0.323, -0.2, 0.8, 0.328);
  // the door: a chrome ring, dark glass, and the load behind it
  g.push(); g.move(0, 0.4, 0.32); g.rotX(Math.PI / 2);
  g.mat('plain', '#26292a'); g.cyl(0, -0.02, 0, 0.215, 0.02, { segs: 24 });
  g.mat(p.loadMat || 'weave', p.load || '#c9552e'); g.cyl(0, -0.012, 0, 0.17, 0.012, { segs: 20 });
  g.mat('brushed', '#d6d2c8', { rough: -0.3 }); g.lathe(0, 0, [[0.2, 0], [0.215, 0.01], [0.215, 0.035], [0.19, 0.045], [0.17, 0.04]], { segs: 24, capBottom: false, capTop: false });
  g.mat('diffuser', '#9fb4b8', { rough: -0.45 }); g.cyl(0, 0.0, 0, 0.17, 0.03, { segs: 20, capBottom: false });
  g.pop();
  g.mat('brushed', '#d6d2c8'); g.box(0.2, 0.36, 0.33, 0.24, 0.44, 0.37, { bevel: 0.008 });
  return { solid: [[-0.33, 0, -0.32, 0.33, 0.86, 0.32]], tier: 's', surf: 'metal' };
});

// A woven basket with a name tag. p: { cane, r, h, tag, fill }
defineProp('civic.basket', (g, p) => {
  const r = p.r || 0.22, h = p.h || 0.26;
  g.mat('cane', p.cane || '#c9a46a'); g.lathe(0, 0, [[0, 0.005], [r * 0.82, 0.005], [r * 0.9, 0.02], [r, h * 0.9], [r * 1.04, h], [r * 0.96, h], [r * 0.9, h * 0.92]], { segs: 18, capTop: false });
  if (p.fill) { g.mat('weave', p.fill, { rough: 0.1 }); g.ball(0, h * 0.85, 0, r * 0.86, h * 0.35, r * 0.86, { segs: 12, rings: 5, bottom: 0 }); }
  g.mat('wood', '#7a5233'); for (const sx of [-1, 1]) g.box(sx * r - 0.02, h * 0.7, -0.03, sx * r + 0.02, h + 0.02, 0.03, { bevel: 0.006 });
  g.mat('paper', p.tag || '#f1e6cf'); g.box(-0.05, h * 0.55, r * 0.96, 0.05, h * 0.8, r * 0.98);
  return { cast: false };
});

// A stack of folded clothes. p: { cols: [...], n }
defineProp('civic.folded', (g, p) => {
  const cols = p.cols || ['#c9552e', '#2f6f73', '#e7b547'], n = p.n || 4; let y = 0;
  const r = new Rng(hashStr(cols.join('') + n));
  for (let i = 0; i < n; i++) { const t = 0.035 + r.f(0, 0.025), dx = r.f(-0.02, 0.02), dz = r.f(-0.02, 0.02); g.mat(r.chance(0.3) ? 'stripe' : r.chance(0.3) ? 'knit' : 'weave', cols[i % cols.length]); g.box(-0.17 + dx, y, -0.13 + dz, 0.17 + dx, y + t, 0.13 + dz, { bevel: 0.012 }); y += t; }
  return { cast: false };
});

// Drawers: a cabinet of small drawers with brass pulls and label frames. p: { w, h, d, rows, cols, wood, pull }
defineProp('civic.drawers', (g, p) => {
  const w = p.w || 1, h = p.h || 1.2, d = p.d || 0.42, rows = p.rows || 6, cols = p.cols || 4, wood = p.wood || '#6b4a2f';
  g.mat('wood', wood, { rough: -0.05 }); g.box(-w / 2, 0.06, -d / 2, w / 2, h, d / 2, { bevel: 0.012, aoBottom: 0.6 });
  g.mat('wood', shadeHex(wood, 0.6)); g.box(-w / 2 + 0.03, 0, -d / 2 + 0.03, w / 2 - 0.03, 0.06, d / 2 - 0.03);
  g.mat('wood', shadeHex(wood, 0.85)); g.box(-w / 2 - 0.015, h, -d / 2 - 0.015, w / 2 + 0.015, h + 0.03, d / 2 + 0.015, { bevel: 0.01 });
  const cw = (w - 0.08) / cols, rh = (h - 0.14) / rows;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = -w / 2 + 0.04 + i * cw, y0 = 0.1 + j * rh;
    g.mat('wood', shadeHex(wood, 1.12 + ((i * 7 + j * 3) % 5) * 0.03)); g.box(x0 + 0.008, y0 + 0.008, d / 2, x0 + cw - 0.008, y0 + rh - 0.008, d / 2 + 0.012, { bevel: 0.004 });
    g.mat('cast', p.pull || '#c8a45a', { rough: -0.2 }); g.box(x0 + cw / 2 - 0.025, y0 + rh * 0.35, d / 2 + 0.012, x0 + cw / 2 + 0.025, y0 + rh * 0.45, d / 2 + 0.025, { bevel: 0.004 });
    g.mat('paper', '#efe6d2'); g.box(x0 + cw / 2 - 0.035, y0 + rh * 0.55, d / 2 + 0.012, x0 + cw / 2 + 0.035, y0 + rh * 0.8, d / 2 + 0.014);
  }
  return { solid: [[-w / 2, 0, -d / 2, w / 2, h + 0.03, d / 2 + 0.02]], tier: 's' };
});

// A row of books standing on a shelf. p: { w, seed, cols, lean }
defineProp('civic.books', (g, p) => {
  const w = p.w || 0.8, r = new Rng(hashStr('bk' + (p.seed || 0) + w));
  const cols = p.cols || ['#7a2a3a', '#2f4f6b', '#6b8f4e', '#c9962e', '#3a2a20', '#b5653a', '#e8dcc0', '#26306b'];
  let x = -w / 2;
  while (x < w / 2 - 0.03) {
    const t = r.f(0.022, 0.05), h = r.f(0.19, 0.29), d = r.f(0.15, 0.22);
    if (x + t > w / 2) break;
    if (r.chance(0.06)) { x += r.f(0.03, 0.08); continue; }
    const c = cols[r.i(0, cols.length - 1)];
    g.mat(r.chance(0.5) ? 'leather' : 'paper', c); g.box(x, 0, -d / 2, x + t, h, d / 2, { bevel: 0.004 });
    if (r.chance(0.4)) { g.mat('cast', '#c8a45a'); g.box(x + 0.002, h * 0.75, d / 2, x + t - 0.002, h * 0.78, d / 2 + 0.002); }
    x += t + 0.002;
  }
  return { cast: false };
});

// A brass counter bell. p: {}
defineProp('civic.bell', (g) => {
  g.mat('wood', '#3a2a20'); g.cyl(0, 0, 0, 0.065, 0.02, { segs: 16 });
  g.mat('cast', '#d4b062', { rough: -0.35 }); g.lathe(0, 0, [[0.055, 0.02], [0.058, 0.03], [0.05, 0.06], [0.03, 0.08], [0.0, 0.087]], { segs: 18 });
  g.mat('cast', '#a8853e'); g.cyl(0, 0.085, 0, 0.008, 0.02, { segs: 8 }); g.ball(0, 0.108, 0, 0.012, 0.008, 0.012, { segs: 8, rings: 4 });
  return { cast: false };
});

// A kettle (electric base, enamel body, lid). p: { enamel }
defineProp('civic.kettle', (g, p) => {
  g.mat('paint', '#2f2c28'); g.cyl(0, 0, 0, 0.09, 0.025, { segs: 16 });
  g.mat('paint', p.enamel || '#c9552e', { rough: -0.3 }); g.lathe(0, 0, [[0.085, 0.025], [0.095, 0.08], [0.09, 0.16], [0.06, 0.2], [0.05, 0.205]], { segs: 18, capBottom: false });
  g.mat('paint', '#e9e1cf'); g.lathe(0, 0, [[0.05, 0.205], [0.04, 0.215], [0.012, 0.22], [0.015, 0.235], [0, 0.236]], { segs: 14, capBottom: false });
  g.mat('paint', p.enamel || '#c9552e'); g.tube([[0.08, 0.06, 0], [0.13, 0.12, 0], [0.15, 0.18, 0]], [0.018, 0.014, 0.01], { segs: 8 });
  g.mat('wood', '#3a2a20'); g.tube([[-0.07, 0.2, 0], [-0.11, 0.22, 0], [-0.12, 0.15, 0], [-0.09, 0.09, 0]], 0.012, { segs: 6 });
  return { cast: false };
});

// An upholstered armchair. p: { cloth, wood, mend }
defineProp('civic.armchair', (g, p) => {
  const cl = p.cloth || '#8a2f3c', wood = p.wood || '#5b3d27';
  g.mat('wood', wood); for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.3, 0, sz * 0.28], [sx * 0.29, 0.14, sz * 0.27]], [0.022, 0.026], { segs: 6 });
  g.mat('weave', cl); g.box(-0.36, 0.14, -0.33, 0.36, 0.3, 0.33, { bevel: 0.04 });
  g.mat('weave', shadeHex(cl, 1.12)); g.box(-0.27, 0.3, -0.22, 0.27, 0.43, 0.32, { bevel: 0.05 });
  g.mat('weave', cl); g.box(-0.36, 0.3, -0.36, 0.36, 0.95, -0.2, { bevel: 0.06 });
  for (const sx of [-1, 1]) g.box(sx * 0.36 - (sx > 0 ? 0.1 : 0), 0.3, -0.3, sx * 0.36 + (sx > 0 ? 0 : 0.1), 0.62, 0.33, { bevel: 0.04 });
  if (p.mend) { g.mat('weave', p.mend); g.box(0.1, 0.62, 0.02, 0.24, 0.64, 0.2, { bevel: 0.01 }); g.box(-0.3, 0.7, -0.205, -0.12, 0.82, -0.195); }
  return { solid: [[-0.36, 0, -0.36, 0.36, 0.55, 0.33]], spots: [{ type: 'sit', x: 0, y: 0.43, z: 0.05, yaw: 0 }], tier: 's' };
});

// A hand drum (a frame drum or a goblet drum). p: { kind: 'goblet' | 'frame', skin, body }
defineProp('civic.drum', (g, p) => {
  if (p.kind === 'frame') {
    g.push(); g.move(0, 0.28, 0); g.rotX(Math.PI / 2 - 0.25);
    g.mat('wood', p.body || '#9a6a3a'); g.lathe(0, 0, [[0.24, -0.03], [0.25, -0.03], [0.25, 0.03], [0.24, 0.03]], { segs: 22, capBottom: false, capTop: false });
    g.mat('leather', p.skin || '#e8d6b0'); g.cyl(0, 0.025, 0, 0.24, 0.004, { segs: 22 });
    g.pop();
    return { cast: false };
  }
  g.mat('wood', p.body || '#7a3b2e', { rough: -0.1 }); g.lathe(0, 0, [[0.11, 0], [0.09, 0.05], [0.07, 0.2], [0.1, 0.34], [0.15, 0.44], [0.16, 0.5]], { segs: 16, capTop: false });
  g.mat('leather', p.skin || '#e8d6b0'); g.cyl(0, 0.49, 0, 0.16, 0.012, { segs: 16 });
  g.mat('weave', '#c9962e'); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g.tube([[Math.cos(a) * 0.16, 0.48, Math.sin(a) * 0.16], [Math.cos(a + 0.4) * 0.09, 0.12, Math.sin(a + 0.4) * 0.09]], 0.004, { segs: 3, caps: false }); }
  return { posts: [[0, 0, 0.16, 0, 0.5]] };
});

// A long-necked plucked instrument, lying or hanging. p: { body, face }
defineProp('civic.lute', (g, p) => {
  g.mat('wood', p.body || '#8a5a2e', { rough: -0.2 });
  g.ball(0, 0, 0, 0.17, 0.24, 0.07, { segs: 16, rings: 8, top: 1, bottom: -1 });
  g.mat('wood', p.face || '#d9b57a'); g.box(-0.13, -0.18, 0.066, 0.13, 0.18, 0.07);
  g.mat('plain', '#2a1c14'); g.push(); g.move(0, 0.04, 0.07); g.rotX(Math.PI / 2); g.cyl(0, 0, 0, 0.045, 0.004, { segs: 14 }); g.pop();
  g.mat('wood', '#3a2a20'); g.box(-0.025, 0.2, 0.03, 0.025, 0.78, 0.065, { bevel: 0.006 }); g.box(-0.04, 0.78, 0.02, 0.04, 0.92, 0.06, { bevel: 0.008 });
  g.mat('cast', '#d6cfbd'); for (const sx of [-0.012, 0, 0.012]) g.tube([[sx, -0.14, 0.074], [sx, 0.8, 0.068]], 0.0015, { segs: 3, caps: false });
  return { cast: false };
});

// A music stand: a tripod, a column and a tilted desk. p: { metal, h }
defineProp('civic.stand', (g, p) => {
  const m = p.metal || '#2f2c28', h = p.h || 1.15;
  g.mat('cast', m);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; g.tube([[Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26], [0, 0.25, 0]], 0.009, { segs: 5 }); }
  g.tube([[0, 0.2, 0], [0, h - 0.1, 0]], 0.012, { segs: 6 });
  g.push(); g.move(0, h, 0.02); g.rotX(-0.35);
  g.mat('wood', p.desk || '#5b3d27'); g.box(-0.26, -0.18, -0.01, 0.26, 0.18, 0.01, { bevel: 0.004 }); g.box(-0.26, -0.2, 0.0, 0.26, -0.18, 0.05);
  g.mat('paper', '#efe6d2'); g.box(-0.22, -0.16, 0.01, 0.0, 0.15, 0.014); g.box(0.005, -0.16, 0.01, 0.22, 0.15, 0.013);
  g.pop();
  return { posts: [[0, 0, 0.2, 0, h]] };
});

// A high-backed rush stool, seat 0.45. p: { wood, seat }
defineProp('civic.rushstool', (g, p) => {
  g.mat('wood', p.wood || '#6b4a2f');
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.tube([[sx * 0.17, 0, sz * 0.17], [sx * 0.15, 0.44, sz * 0.15]], 0.018, { segs: 6 });
  for (const y of [0.16, 0.3]) { g.box(-0.16, y, 0.15, 0.16, y + 0.02, 0.17); g.box(-0.16, y, -0.17, 0.16, y + 0.02, -0.15); }
  g.mat('rush', p.seat || '#c9a85a'); g.box(-0.17, 0.42, -0.17, 0.17, 0.46, 0.17, { bevel: 0.015 });
  return { posts: [[0, 0, 0.2, 0, 0.46]], spots: [{ type: 'sit', x: 0, y: 0.46, z: 0, yaw: 0 }] };
});

// A potted plant on a stand: a taller look for corners. Uses the exemplar plant shape. (drawn by the caller with prop 'plant')

// A glass-shaded desk lamp body (no light: the caller adds one). p: { shade }
defineProp('civic.desklamp', (g, p) => {
  g.mat('cast', '#b08a45', { rough: -0.2 }); g.cyl(0, 0, 0, 0.08, 0.025, { segs: 14 }); g.tube([[0, 0.02, 0], [0, 0.32, 0]], 0.009, { segs: 6 });
  g.mat('diffuser', p.shade || '#2f6f4a', { emissive: 0.6, lamp: true }); g.lathe(0, 0.03, [[0.15, 0.3], [0.13, 0.34], [0.05, 0.38], [0.0, 0.385]], { segs: 16 });
  g.mat('diffuser', '#ffe2b0', { emissive: 4, lamp: true }); g.ball(0, 0.31, 0.03, 0.03, 0.02, 0.03, { segs: 8, rings: 4 });
  return { cast: false };
});

// A lamp on a folding arm, clamped to a wall or a table edge (body only). p: { shade }
defineProp('civic.armlamp', (g, p) => {
  g.mat('cast', '#3a3630'); g.box(-0.05, 0, -0.05, 0.05, 0.06, 0.05, { bevel: 0.01 });
  g.tube([[0, 0.05, 0], [0, 0.45, 0.18], [0, 0.6, 0.5]], 0.012, { segs: 6 });
  g.mat('cast', p.shade || '#e8e2d4', { rough: -0.2 }); g.push(); g.move(0, 0.58, 0.55); g.rotX(-0.5); g.lathe(0, 0, [[0.11, -0.08], [0.09, -0.02], [0.04, 0.05], [0.025, 0.07]], { segs: 14, capBottom: false }); g.pop();
  g.mat('diffuser', '#fff2dc', { emissive: 5, lamp: true }); g.ball(0, 0.55, 0.58, 0.035, 0.025, 0.035, { segs: 8, rings: 4 });
  return { cast: false };
});

// A cheap little helper for a lidded glass jar on a shelf (drawn in place, no prop needed).
export function jar(g, x, y, z, r, h, glass, lid, fill) {
  if (fill) { g.mat('plain', fill, { rough: 0.2 }); g.cyl(x, y + 0.006, z, r * 0.85, h * 0.6, { segs: 10 }); }
  g.mat('diffuser', glass || '#dfeae6', { rough: -0.4 }); g.lathe(x, z, [[r * 0.9, y], [r, y + 0.01], [r, y + h * 0.85], [r * 0.8, y + h * 0.92]], { segs: 12, capTop: false });
  g.mat('glaze', lid || '#e8e2d4'); g.lathe(x, z, [[r * 0.84, y + h * 0.9], [r * 0.86, y + h], [r * 0.3, y + h * 1.04], [r * 0.3, y + h * 1.1], [0, y + h * 1.1]], { segs: 12, capBottom: false });
}
export function rngFor(key) { return new Rng(hashStr(key)); }
export function mix(a, b, t) { return mixHex(a, b, t); }
export function shade(a, k) { return shadeHex(a, k); }

// A lamp with the usual clip, colour temperature and power, as a one-liner. kind as in kit.lamp.
export function lampIn(s, kind, x, y, z, clip, o) { return lamp(s, kind, x, y, z, Object.assign({ clip }, o)); }
