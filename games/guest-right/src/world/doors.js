// Doors that move: hinged leaves and sliding panels. Each is its own small mesh, turned or slid by the world every frame.
import * as THREE from 'three';
import { Geo, MeshBuf } from './meshbuilder.js';
import { damp, shadeHex } from '../core/util.js';

// door(s, { x, y, z, w, h, along: 'x' | 'z', ... }) : (x, y, z) is the bottom of the hinge edge (for a slider: the bottom of the edge it slides away from).
//   along: the wall's direction; dir: +1 or -1, which way along it the leaf lies when closed (default +1)
//   swing: +1 or -1, which side it opens toward (default +1)      kind: 'hinge' (default) | 'slide'
//   tint, mat ('wood'), style: 'panel' | 'plain' | 'glazed' | 'slat', handle: '#hex'
//   open: start open; auto: open by itself when the player is near (shops, lobbies); locked: true or a function(game) -> bool;
//   lockedText: what the prompt says when locked; label: text after "Open"/"Close" (e.g. 'the baths'); onOpen(game), level
export function door(s, o) {
  const W = s.world, w = o.w || 0.9, h = o.h || 2.05, t = 0.045, dir = o.dir || 1, swing = o.swing || 1, slide = o.kind === 'slide';
  const g = new Geo(new MeshBuf(256, 512));
  const tint = o.tint || '#7a5233', mat = o.mat || 'wood';
  // the leaf, in its own space: hinge on the local y axis, leaf along +x
  g.mat(mat, tint, { rough: -0.03 });
  if (o.style === 'glazed') {
    g.box(0, 0, -t / 2, w, 0.75, t / 2, { bevel: 0.008 }); g.box(0, h - 0.14, -t / 2, w, h, t / 2, { bevel: 0.008 });
    g.box(0, 0.75, -t / 2, 0.1, h - 0.14, t / 2, { bevel: 0.008 }); g.box(w - 0.1, 0.75, -t / 2, w, h - 0.14, t / 2, { bevel: 0.008 });
    g.mat('diffuser', '#dfeae6', { rough: -0.3 }); g.box(0.1, 0.75, -0.006, w - 0.1, h - 0.14, 0.006, { faces: 'zZ' });
  } else if (o.style === 'slat') {
    g.box(0, 0, -t / 2, 0.07, h, t / 2, { bevel: 0.006 }); g.box(w - 0.07, 0, -t / 2, w, h, t / 2, { bevel: 0.006 }); g.box(0.07, 0, -t / 2, w - 0.07, 0.1, t / 2); g.box(0.07, h - 0.1, -t / 2, w - 0.07, h, t / 2);
    const n = Math.round((h - 0.2) / 0.09); for (let i = 0; i < n; i++) { const yy = 0.1 + i * (h - 0.2) / n; g.box(0.07, yy + 0.012, -0.012, w - 0.07, yy + (h - 0.2) / n - 0.012, 0.012); }
  } else {
    g.box(0, 0, -t / 2, w, h, t / 2, { bevel: 0.006 });
    if (o.style !== 'plain') { g.mat(mat, shadeHex(tint, 1.14)); for (const zz of [-1, 1]) for (const pn of [[0.12, 0.14, w - 0.12, 0.95], [0.12, 1.08, w - 0.12, h - 0.14]]) g.box(pn[0], pn[1], zz * (t / 2 + 0.004) - 0.004, pn[2], pn[3], zz * (t / 2 + 0.004) + 0.004, { bevel: 0.006 }); }
  }
  g.mat('cast', o.handle || '#c8a45a');
  for (const zz of [-1, 1]) { g.tube([[w - 0.09, 1.0, zz * t / 2], [w - 0.09, 1.0, zz * (t / 2 + 0.045)], [w - 0.2, 1.0, zz * (t / 2 + 0.045)]], 0.009, { segs: 6 }); g.cyl(w - 0.09, 0.985, zz * (t / 2 + 0.002), 0.024, 0.03, { segs: 8 }); }
  const mesh = new THREE.Mesh(g.buf.toGeometry(), W.mats.opaque);
  const base = o.along === 'z' ? (dir > 0 ? -Math.PI / 2 : Math.PI / 2) : (dir > 0 ? 0 : Math.PI);     // local +x -> along the wall
  const origin = [o.x, o.y, o.z];
  W.addRenderable(mesh, { frame: s.frame, origin, center: [0, h / 2, 0], radius: Math.max(w, h) * 0.8 + 0.5, far: 70, caster: false, scope: s });
  s.meshes.push(mesh);
  const st = { mesh, open: !!o.open, amt: o.open ? 1 : 0, scope: s, collider: null, locked: o.locked || false, auto: !!o.auto, o };
  const cx = o.along === 'z' ? o.x : o.x + dir * w / 2, cz = o.along === 'z' ? o.z + dir * w / 2 : o.z;
  const setCollider = (on) => {
    if (on && !st.collider) st.collider = o.along === 'z' ? s.solid(o.x - 0.05, o.y, Math.min(o.z, o.z + dir * w), o.x + 0.05, o.y + h, Math.max(o.z, o.z + dir * w)) : s.solid(Math.min(o.x, o.x + dir * w), o.y, o.z - 0.05, Math.max(o.x, o.x + dir * w), o.y + h, o.z + 0.05);
    else if (!on && st.collider) { s.col.remove(st.collider); st.collider = null; }
  };
  const apply = () => {
    const e = mesh.matrixWorld.elements;
    if (slide) {
      const k = st.amt * (w - 0.06);
      if (o.along === 'z') origin[2] = o.z - dir * k; else origin[0] = o.x - dir * k;
      const c = Math.cos(base), sn = Math.sin(base); e[0] = c; e[8] = sn; e[2] = -sn; e[10] = c;
    } else {
      const a = base + st.amt * 1.75 * swing * (o.along === 'z' ? 1 : 1);
      const c = Math.cos(a), sn = Math.sin(a); e[0] = c; e[8] = sn; e[2] = -sn; e[10] = c;
    }
  };
  st.set = (open, game) => {
    if (st.open === open) return; st.open = open;
    if (game && game.audio) game.sfxAt(slide ? 'door-slide' : 'door', s.frame, cx, o.y + 1, cz);
    if (open) { setCollider(false); if (o.onOpen && game) o.onOpen(game); }
  };
  st.update = (dt) => {
    const game = W.game;
    if (st.auto && game && game.player.frame === s.frame) {
      const p = game.player.pos; const near = Math.hypot(p.x - cx, p.z - cz) < 2.3 && Math.abs(p.y - o.y) < 2;
      const lk = typeof st.locked === 'function' ? st.locked(game) : st.locked;
      if (near && !st.open && !lk) st.set(true, game); else if (!near && st.open && st.amt > 0.98) st.set(false, game);
    }
    const target = st.open ? 1 : 0;
    if (Math.abs(st.amt - target) > 0.001) { st.amt = damp(st.amt, target, 7, dt); if (Math.abs(st.amt - target) < 0.004) st.amt = target; apply(); if (!st.open && st.amt < 0.06) setCollider(true); }
  };
  apply(); setCollider(!st.open);
  W.dynamics.push(st);
  if (!st.auto) {
    s.interact({ x: cx, y: o.y + 1.05, z: cz, radius: 1.5, kind: 'use',
      prompt: (game) => { const lk = typeof st.locked === 'function' ? st.locked(game) : st.locked; return lk ? (o.lockedText || 'Locked') : (st.open ? 'Close' : 'Open') + (o.label ? ' ' + o.label : ' the door'); },
      onUse: (game) => { const lk = typeof st.locked === 'function' ? st.locked(game) : st.locked; if (lk) { if (game.audio) game.audio.ui('deny'); if (o.onLocked) o.onLocked(game); return; } st.set(!st.open, game); } });
  }
  return st;
}

// The frame round a doorway: two jambs and a head, proud of the wall. (x, y, z) = the centre of the opening at floor level.
export function doorFrame(s, x, y, z, w, h, along, o = {}) {
  const g = s.g, d = o.depth || 0.2, f = o.f || 0.07;
  g.mat(o.mat || 'wood', o.tint || '#5b4636', { rough: -0.03 });
  if (along === 'z') {
    g.box(x - d / 2, y, z - w / 2 - f, x + d / 2, y + h, z - w / 2, { bevel: 0.008 }); g.box(x - d / 2, y, z + w / 2, x + d / 2, y + h, z + w / 2 + f, { bevel: 0.008 });
    g.box(x - d / 2, y + h, z - w / 2 - f, x + d / 2, y + h + f, z + w / 2 + f, { bevel: 0.008 });
  } else {
    g.box(x - w / 2 - f, y, z - d / 2, x - w / 2, y + h, z + d / 2, { bevel: 0.008 }); g.box(x + w / 2, y, z - d / 2, x + w / 2 + f, y + h, z + d / 2, { bevel: 0.008 });
    g.box(x - w / 2 - f, y + h, z - d / 2, x + w / 2 + f, y + h + f, z + d / 2, { bevel: 0.008 });
  }
  return s.flush({ tier: 's', level: o.level });
}
