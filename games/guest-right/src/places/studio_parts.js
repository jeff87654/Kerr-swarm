// Shared helpers for the studio, the letter room and the toy library: meshes that can be shown or hidden after the
// world is built, small talk and gift helpers, and a filled bookshelf.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';
import { CAST } from '../content/cast.js';
import { ITEMS } from '../content/items.js';

export const studioParts = true;

// A mesh of its own, drawn by draw(g) in the scope's flat coordinates, that can be hidden later (mesh.userData.hidden = true).
// The geometry is stored relative to `origin` (default: the first point you give), which keeps it tight for culling.
// o: { origin: [x, y, z], radius (2), far (60), hidden }
export function dynMesh(s, origin, draw, o = {}) {
  const W = s.world, g = new Geo(new MeshBuf(512, 1024));
  g.push(); g.move(-origin[0], -origin[1], -origin[2]);
  draw(g);
  g.pop();
  if (!g.buf.ni) return null;
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  W.addRenderable(mesh, { frame: s.frame, origin: origin.slice(), center: [0, 0, 0], radius: o.radius || 2, far: o.far || 60, caster: false, scope: s });
  s.meshes.push(mesh);
  mesh.userData.hidden = !!o.hidden;
  return mesh;
}

// A stand-in scope that lets kit functions that draw into s.g (sign(), for one) draw into another Geo instead.
export function proxyScope(s, g) {
  return { world: s.world, frame: s.frame, g, flush() { return this; }, light() { return null; }, solid() { return null; }, meshes: s.meshes };
}

// Something to run every frame while the place is loaded. fn(dt, game)
export function every(s, fn) {
  const d = { scope: s, update(dt) { const game = s.world.game; if (game) fn(dt, game); } };
  s.world.dynamics.push(d);
  return d;
}

// A cast member as a speaker for game.ui.say.
export function speaker(id) {
  const c = CAST[id]; if (!c) return id;
  return { name: c.short || c.name, colour: (c.look && (c.look.lining || c.look.top)) || '#FFE3A8' };
}

// Say some lines as someone (a cast id or a plain name), holding the player while they are said. Safe without a UI.
export async function talk(game, who, lines) {
  if (!game.ui) return;
  game.busy++;
  try { await game.ui.say(CAST[who] ? speaker(who) : who, lines); } finally { game.busy--; }
}

// Mark a discovery found (when the journal exists).
export function found(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }

// Give the player an item from content/items.js: a flag, an inventory call if the game has one, and a toast.
export function give(game, id) {
  game.flags = game.flags || {};
  if (game.flags['item:' + id]) return false;
  game.flags['item:' + id] = true;
  if (game.inv && game.inv.give && !game.inv.has(id)) game.inv.give(id, 1, true);      // into the bag, quietly: the toast is below
  const it = ITEMS[id];
  if (game.ui) game.ui.toast(it ? it.name : id, { kind: 'gain' });
  if (game.audio) game.audio.ui('coin');
  return true;
}

// A shelf's worth of books standing on a board. Runs along x (facing +z or -z) or along z (facing +x or -x).
// (a0, a1) along the run, `y` the board's top, `c` the back of the shelf, `face` 'z'|'Z'|'x'|'X' the way the spines look,
// depth (0.24), hmax (0.3), cols (spine colours), lean (chance of a leaning book), gap (chance of a gap), seed.
export function bookRow(g, a0, a1, y, c, face, o = {}) {
  const r = new Rng(o.seed || ((a0 * 131 + y * 17 + c * 7) | 0));
  const cols = o.cols || ['#7a2f2a', '#2f4f6f', '#3d5a3a', '#8a6a2f', '#5b4060', '#a0522d', '#2b3a4a', '#6e2f3f', '#c9a96a', '#40504a', '#8c3b26', '#1f3b4d'];
  const depth = o.depth || 0.24, hmax = o.hmax || 0.3, alongX = face === 'z' || face === 'Z', out = (face === 'Z' || face === 'X') ? 1 : -1;
  let a = a0 + 0.01;
  while (a < a1 - 0.03) {
    if (r.chance(o.gap === undefined ? 0.04 : o.gap)) { a += r.f(0.04, 0.12); continue; }
    const t = r.f(0.018, 0.055), h = hmax * r.f(0.62, 1), d = depth * r.f(0.7, 1);
    if (a + t > a1) break;
    const col = r.pick(cols), tint = mixHex(col, r.chance(0.5) ? '#2a2018' : '#e8dcc4', r.f(0, 0.25));
    const lean = r.chance(o.lean === undefined ? 0.06 : o.lean) && a + h * 0.5 < a1;
    g.mat(r.chance(0.25) ? 'leather' : 'paper', tint, { rough: r.f(-0.1, 0.15) });
    if (lean) {
      // a book leaning on its neighbour: tipped about the bottom corner
      g.push(); g.move(alongX ? a : c + out * 0.01, y, alongX ? c + out * 0.01 : a);
      if (alongX) g.rotZ(-0.38); else g.rotX(0.38);
      if (alongX) g.box(0, 0, out > 0 ? 0 : -d, t, h, out > 0 ? d : 0, { bevel: 0.003 }); else g.box(out > 0 ? 0 : -d, 0, 0, out > 0 ? d : 0, h, t, { bevel: 0.003 });
      g.pop(); a += h * 0.4 + t;
      continue;
    }
    if (alongX) g.box(a, y, out > 0 ? c : c - d, a + t, y + h, out > 0 ? c + d : c, { bevel: 0.003 });
    else g.box(out > 0 ? c : c - d, y, a, out > 0 ? c + d : c, y + h, a + t, { bevel: 0.003 });
    // a band or two on the spine
    if (r.chance(0.55)) {
      g.mat('paper', r.chance(0.6) ? '#d8b860' : shadeHex(tint, 1.6), { rough: -0.2 });
      const sp = alongX ? (out > 0 ? c + d : c - d) : (out > 0 ? c + d : c - d), yy = y + h * r.f(0.7, 0.85);
      if (alongX) g.box(a + 0.002, yy, sp - 0.002 * out - 0.001, a + t - 0.002, yy + 0.012, sp + 0.002 * out + 0.001, { faces: out > 0 ? 'Z' : 'z' });
      else g.box(sp - 0.002 * out - 0.001, yy, a + 0.002, sp + 0.002 * out + 0.001, yy + 0.012, a + t - 0.002, { faces: out > 0 ? 'X' : 'x' });
    }
    a += t + 0.002;
  }
}
