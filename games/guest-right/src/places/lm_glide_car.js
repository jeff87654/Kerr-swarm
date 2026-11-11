// The Glide: the inside of a glide car. A small low room padded all over, six deep seats with harnesses facing aft, a
// small lamp on a cord, a counter board, and at the aft end the port: an embrasure through the armour, 1.3 m of clear
// water between two panes. Its own frame, far out (radius 200 km), so the field of drums behind the glass does not bend.
// The things that show you weigh nothing: the loose strap ends of the empty seats, a water flask on a tether, the lamp.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { lamp, roomGlow } from '../world/kit.js';
import { signRect } from '../world/signs.js';
import { drawSeat, PAL } from './station_parts.js';
import { EYE } from './lm_glide_field.js';

export const CARX = 1.45, CARZ0 = -2.35, CARZ1 = 1.35, CARH = 2.15;
// the port: the inner aperture in the padding, the outer one through the armour 1.3 m aft
export const PORT = { x0: 0.7, y0: EYE - 0.5, y1: EYE + 0.5, X1: 1.3, Y0: EYE - 0.95, Y1: EYE + 0.95, z0: CARZ1, z1: CARZ1 + 1.3 };
export const SEAT = { x: 0, z: 0.0 };              // the player's: front row, middle, facing the port
const CUSH = ['#2f6f73', '#8a2f3c', '#c08a2e', '#3b4a7a', '#6b8f4e', '#a8543a'];

// A small mesh of the scope's that can turn about its own pivot every frame.
function pivotMesh(s, draw, pivot) {
  const g = new Geo(new MeshBuf(512, 1024)); draw(g);
  const mesh = new THREE.Mesh(g.buf.toGeometry(), s.world.mats.opaque);
  s.world.addRenderable(mesh, { frame: s.frame, origin: pivot.slice(), center: [0, 0, 0], radius: 0.8, far: 40, caster: false, scope: s });
  s.meshes.push(mesh);
  return mesh;
}
// Turn a pivot mesh: ax about x (a hanging thing swings toward +z), then ay about y.
export function turn(mesh, ax, ay) {
  const c = Math.cos(ax), s = Math.sin(ax), cb = Math.cos(ay), sb = Math.sin(ay), e = mesh.matrixWorld.elements;
  e[0] = cb; e[1] = 0; e[2] = -sb; e[4] = sb * s; e[5] = c; e[6] = cb * s; e[8] = sb * c; e[9] = -s; e[10] = cb * c; e[12] = 0; e[13] = 0; e[14] = 0;
}

export function buildCar(game, s) {
  const g = s.g;
  const X = CARX, Z0 = CARZ0, Z1 = CARZ1, H = CARH, P = PORT;
  const clip = [-X - 0.1, -0.2, Z0 - 0.1, X + 0.1, H + 0.1, Z1 + 1.4];

  // ---- the shell: rubber floor, quilted padding on every wall and the ceiling
  s.structure(() => {
    g.mat('speckle', '#2c3634'); g.box(-X, -0.05, Z0, X, 0, Z1, { faces: 'Y' });
    g.mat('weave', '#3c342a', { rough: 0.1 });
    g.box(-X - 0.05, 0, Z0, -X, H, Z1, { faces: 'X' }); g.box(X, 0, Z0, X + 0.05, H, Z1, { faces: 'x' });
    g.box(-X, 0, Z0 - 0.05, X, H, Z0, { faces: 'Z' });
    g.box(-X, H, Z0, X, H + 0.05, Z1, { faces: 'y' });
    // the aft wall round the port
    const A = (x0, x1, y0, y1) => g.box(x0, y0, Z1, x1, y1, Z1 + 0.05, { faces: 'z' });
    A(-X, -P.x0, 0, H); A(P.x0, X, 0, H); A(-P.x0, P.x0, 0, P.y0); A(-P.x0, P.x0, P.y1, H);
  });
  // quilting: raised ribs in a diamond-ish grid on the side walls, the ceiling and the aft wall
  s.structure(() => {
    g.mat('weave', '#4a4033', { rough: 0.1 });
    for (const sx of [-1, 1]) for (let z = Z0 + 0.3; z < Z1 - 0.1; z += 0.42) g.box(sx * X - 0.035, 0.45, z - 0.025, sx * X + 0.035, H - 0.08, z + 0.025, { bevel: 0.012 });
    for (const sx of [-1, 1]) for (let y = 0.55; y < H - 0.1; y += 0.42) g.box(sx * X - 0.03, y - 0.02, Z0 + 0.1, sx * X + 0.03, y + 0.02, Z1 - 0.05, { bevel: 0.01 });
    for (let x = -X + 0.25; x < X; x += 0.45) g.box(x - 0.025, H - 0.035, Z0, x + 0.025, H, Z1, { bevel: 0.01 });
    for (let x = -X + 0.2; x < X; x += 0.4) if (Math.abs(x) > P.x0 + 0.05) g.box(x - 0.02, 0.5, Z1 - 0.03, x + 0.02, H - 0.08, Z1, { bevel: 0.008 });
    g.mat('leather', '#3a2318'); g.box(-X, 0, Z0, X, 0.42, Z0 + 0.05, { faces: 'ZY' });
    for (const sx of [-1, 1]) g.box(sx > 0 ? X - 0.05 : -X, 0, Z0, sx > 0 ? X : -X + 0.05, 0.42, Z1, { faces: sx > 0 ? 'xY' : 'XY' });
  });
  // the back row stands on a step
  s.structure(() => { g.mat('speckle', '#283230'); g.box(-X, 0, Z0, X, 0.22, -0.95, { faces: 'YZ' }); g.mat('cast', PAL.brass, { rough: -0.2 }); g.box(-X, 0.2, -0.97, X, 0.225, -0.93, { faces: 'YZ' }); });

  // ---- the port: an embrasure through the armour, flaring outward, lined with the water's glass
  s.structure(() => {
    const zi = P.z0 + 0.05, zo = P.z1;
    g.mat('glaze', '#ffffff', { emissive: 0.6, rough: -0.35 });
    // each face of the tunnel, darker at the inner pane and catching more of the outside toward the outer one
    const face = (a, b, c, d) => {
      const ids = []; for (const [p, t] of [[a, '#06100f'], [b, '#06100f'], [c, '#1f5a52'], [d, '#1f5a52']]) { g.tint(t); ids.push(g.v(p[0], p[1], p[2], 0, 0, -1, 0, 0)); }
      g.quadI(ids[0], ids[1], ids[2], ids[3]); g.quadI(ids[0], ids[3], ids[2], ids[1]);
    };
    face([-P.x0, P.y0, zi], [P.x0, P.y0, zi], [P.X1, P.Y0, zo], [-P.X1, P.Y0, zo]);
    face([-P.x0, P.y1, zi], [P.x0, P.y1, zi], [P.X1, P.Y1, zo], [-P.X1, P.Y1, zo]);
    face([-P.x0, P.y0, zi], [-P.x0, P.y1, zi], [-P.X1, P.Y1, zo], [-P.X1, P.Y0, zo]);
    face([P.x0, P.y0, zi], [P.x0, P.y1, zi], [P.X1, P.Y1, zo], [P.X1, P.Y0, zo]);
  });
  // the seams of the glass blocks in the tunnel walls, faintly lit by whatever is outside
  s.deco(() => {
    g.mat('glaze', '#4fa89a', { emissive: 0.3 });
    const zi = P.z0 + 0.05, zo = P.z1;
    for (let k = 1; k < 4; k++) {
      const t = k / 4, z = zi + (zo - zi) * t, x = P.x0 + (P.X1 - P.x0) * t, y0 = P.y0 + (P.Y0 - P.y0) * t, y1 = P.y1 + (P.Y1 - P.y1) * t;
      g.tube([[-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z]], 0.006, { segs: 3, closed: true });
    }
    // the outer pane's rim, a little brighter
    g.mat('glaze', '#6fd0c0', { emissive: 0.45 });
    g.tube([[-P.X1, P.Y0, zo], [P.X1, P.Y0, zo], [P.X1, P.Y1, zo], [-P.X1, P.Y1, zo]], 0.012, { segs: 4, closed: true });
  });
  // a heavy bezel round the inner pane, bolted, with a brass lip
  s.furniture(() => {
    const zi = P.z0, b = 0.11;
    g.mat('cast', '#2a2f31', { rough: 0.1 });
    g.box(-P.x0 - b, P.y0 - b, zi - 0.07, P.x0 + b, P.y0, zi + 0.05, { bevel: 0.02 }); g.box(-P.x0 - b, P.y1, zi - 0.07, P.x0 + b, P.y1 + b, zi + 0.05, { bevel: 0.02 });
    g.box(-P.x0 - b, P.y0, zi - 0.07, -P.x0, P.y1, zi + 0.05, { bevel: 0.02 }); g.box(P.x0, P.y0, zi - 0.07, P.x0 + b, P.y1, zi + 0.05, { bevel: 0.02 });
    g.mat('cast', PAL.brass, { rough: -0.2 });
    for (let i = 0; i <= 6; i++) { const x = -P.x0 - 0.055 + (2 * P.x0 + 0.11) * i / 6; for (const y of [P.y0 - 0.055, P.y1 + 0.055]) { g.push(); g.move(x, y, zi - 0.07); g.rotX(Math.PI / 2); g.cyl(0, -0.012, 0, 0.018, 0.012, { segs: 6 }); g.pop(); } }
    for (let i = 1; i < 4; i++) { const y = P.y0 + (P.y1 - P.y0) * i / 4; for (const x of [-P.x0 - 0.055, P.x0 + 0.055]) { g.push(); g.move(x, y, zi - 0.07); g.rotX(Math.PI / 2); g.cyl(0, -0.012, 0, 0.018, 0.012, { segs: 6 }); g.pop(); } }
    g.box(-P.x0 - 0.01, P.y0 - 0.012, zi - 0.075, P.x0 + 0.01, P.y0, zi - 0.06); g.box(-P.x0 - 0.01, P.y1, zi - 0.075, P.x0 + 0.01, P.y1 + 0.012, zi - 0.06);
  });
  s.solid(-X, 0, Z1 - 0.05, X, H, Z1 + 1.3);

  // ---- the seats: six, in two rows, all facing the port
  const seats = [];
  s.furniture(() => {
    let k = 0;
    for (const row of [{ z: SEAT.z, y: 0 }, { z: -1.45, y: 0.22 }]) for (const x of [-0.82, 0, 0.82]) {
      g.push(); g.move(0, row.y, 0); drawSeat(g, x, row.z, CUSH[(k++ * 2 + 1) % CUSH.length], 0); g.pop();
      seats.push([x, row.y, row.z]);
    }
  });
  // grab rails along the side walls, a rail over the back row
  s.furniture(() => {
    g.mat('cast', PAL.brass, { rough: -0.2 });
    for (const sx of [-1, 1]) { g.tube([[sx * (X - 0.08), 1.25, Z0 + 0.3], [sx * (X - 0.08), 1.25, Z1 - 0.3]], 0.018, { segs: 6 }); for (const z of [Z0 + 0.3, -0.6, Z1 - 0.3]) g.tube([[sx * (X - 0.08), 1.25, z], [sx * X, 1.25, z]], 0.012, { segs: 4 }); }
    g.tube([[-X + 0.2, H - 0.2, -0.85], [X - 0.2, H - 0.2, -0.85]], 0.018, { segs: 6 });
  });
  // cargo nets on the front wall behind the back row, with two bags strapped in
  s.detail(() => {
    g.mat('weave', '#8a7a5a');
    for (let k = 0; k <= 4; k++) { const y = 0.5 + k * 0.26; g.tube([[-X + 0.1, y, Z0 + 0.08], [X - 0.1, y, Z0 + 0.08]], 0.007, { segs: 3, caps: false }); }
    for (let x = -X + 0.1; x <= X - 0.05; x += 0.24) g.tube([[x, 0.5, Z0 + 0.08], [x, 1.55, Z0 + 0.08]], 0.007, { segs: 3, caps: false });
    g.mat('weave', '#6b3a2a'); g.box(-1.1, 0.55, Z0 + 0.0, -0.55, 0.92, Z0 + 0.06, { bevel: 0.05 });
    g.mat('weave', '#2f5d5a'); g.box(0.4, 0.55, Z0 + 0.0, 1.0, 1.05, Z0 + 0.065, { bevel: 0.05 });
  });
  // the hatch behind the back row: a round door in the front wall, shut and dogged
  s.furniture(() => {
    g.mat('cast', '#3a3f41');
    g.push(); g.move(0, 1.0, Z0 + 0.06); g.rotX(Math.PI / 2); g.cyl(0, -0.03, 0, 0.55, 0.05, { segs: 28 }); g.pop();
    g.mat('cast', PAL.brass, { rough: -0.2 });
    const ring = []; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; ring.push([Math.cos(a) * 0.16, 1.0 + Math.sin(a) * 0.16, Z0 + 0.13]); } g.tube(ring, 0.014, { segs: 5, closed: true });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4; g.tube([[0, 1.0, Z0 + 0.13], [Math.cos(a) * 0.16, 1.0 + Math.sin(a) * 0.16, Z0 + 0.13]], 0.01, { segs: 4 }); }
    g.mat('paint', PAL.yellow); const r2 = []; for (let k = 0; k < 28; k++) { const a = k / 28 * Math.PI * 2; r2.push([Math.cos(a) * 0.58, 1.0 + Math.sin(a) * 0.58, Z0 + 0.04]); } g.tube(r2, 0.02, { segs: 4, closed: true });
  });

  // ---- the counter board over the port, redrawn as the ride goes
  const BW = 1.16, BH = 0.26, by = P.y1 + 0.26;
  const R = signRect(game.atlas, { kind: 'board', title: 'GLIDE', lines: ['to Sorrel'], palette: ['#0d1210', '#f3e6c8', '#3fe0d0'], w: BW, h: BH }, BW, BH);
  s.deco(() => {
    g.mat('cast', '#1c1f20'); g.box(-BW / 2 - 0.04, by - BH / 2 - 0.04, Z1 - 0.06, BW / 2 + 0.04, by + BH / 2 + 0.04, Z1, { bevel: 0.01 });
    g.atlas(R.rect.page, { emissive: 1.5 });
    const r = R.rect; g.quad([BW / 2, by - BH / 2, Z1 - 0.062], [-BW / 2, by - BH / 2, Z1 - 0.062], [-BW / 2, by + BH / 2, Z1 - 0.062], [BW / 2, by + BH / 2, Z1 - 0.062], { uv: [r.u0, r.v1, r.u1, r.v0] });
  });
  let last = '';
  const board = (big, sub, right, foot) => {
    const key = big + '|' + sub + '|' + right + '|' + (foot || ''); if (key === last || !game.atlas) return; last = key;
    game.atlas.redraw(R.rect, (ctx, w, h) => {
      ctx.fillStyle = '#0d1210'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(243,230,200,0.18)'; ctx.lineWidth = Math.max(1, h * 0.012); ctx.strokeRect(w * 0.012, h * 0.04, w * 0.976, h * 0.92);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'left'; ctx.font = "600 " + Math.round(h * 0.46) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(big, w * 0.04, h * 0.37);
      ctx.fillStyle = '#3fe0d0'; ctx.font = "500 " + Math.round(h * 0.2) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(sub, w * 0.04, h * 0.78);
      ctx.fillStyle = '#ffd9a0'; ctx.textAlign = 'right'; ctx.font = "600 " + Math.round(h * 0.3) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(right, w * 0.96, h * 0.34);
      if (foot) { ctx.fillStyle = '#a99f90'; ctx.font = "500 " + Math.round(h * 0.17) + "px 'Barlow Condensed', sans-serif"; ctx.fillText(foot, w * 0.96, h * 0.78); }
    });
  };
  board('GLIDE', 'CHERVIL · STATION RING 2', 'SORREL', 'the car is standing');
  // two small plates under the board
  const plate = (spec, x) => { const Rp = signRect(game.atlas, spec, 0.32, 0.12); s.deco(() => { g.atlas(Rp.rect.page, { emissive: 0.25 }); const r = Rp.rect, y = P.y0 - 0.2, z = Z1 - 0.004; g.quad([x + 0.16, y - 0.06, z], [x - 0.16, y - 0.06, z], [x - 0.16, y + 0.06, z], [x + 0.16, y + 0.06, z], { uv: [r.u0, r.v1, r.u1, r.v0] }); }); };
  plate({ kind: 'plate', text: 'WATER 1.3 m', sub: 'look aft, the one safe way' }, -0.95);
  plate({ kind: 'plate', text: 'KEEP THE HARNESS ON', sub: 'until the catch' }, 0.95);

  // ---- the lamp: a small shaded lamp on a short cord over the aisle. Nearly dark in here, so the view can read.
  const LP = [0, H - 0.02, -0.55];
  const lampMesh = pivotMesh(s, (gg) => {
    gg.mat('weave', '#2a2420'); gg.tube([[0, 0, 0], [0, -0.26, 0]], 0.006, { segs: 4, caps: false });
    gg.mat('cast', PAL.brass, { rough: -0.2 }); gg.lathe(0, 0, [[0.02, -0.26], [0.09, -0.3], [0.1, -0.33]], { segs: 12, capBottom: false });
    gg.mat('diffuser', '#ffc98a', { emissive: 2.4 }); gg.ball(0, -0.33, 0, 0.045, 0.035, 0.045, { segs: 10, rings: 6 });
  }, LP);
  s.light({ at: [LP[0], LP[1] - 0.36, LP[2]], color: [1.0, 0.62, 0.32], power: 0.55, range: 3.2, clip, radius: 0.05 });
  roomGlow(s, -X, 0, Z0, X, H, Z1, { sky: '#4a7a72', ground: '#3a2c20', power: 0.05, lamp: false });

  // ---- what floats: the loose strap ends of the two empty front seats, a flask on a tether, (and the lamp)
  const floaters = [];
  for (const sx of [-1, 1]) {
    const x = sx * 0.82 + sx * 0.12, pv = [x, 0.47, SEAT.z + 0.2];
    const m = pivotMesh(s, (gg) => { gg.mat('weave', '#23282b'); gg.box(-0.02, -0.34, -0.004, 0.02, 0, 0.004); gg.mat('cast', PAL.brass, { rough: -0.2 }); gg.box(-0.028, -0.4, -0.008, 0.028, -0.33, 0.008, { bevel: 0.004 }); }, pv);
    floaters.push({ mesh: m, kind: 'strap', ph: sx > 0 ? 1.3 : 0, side: sx });
  }
  { const pv = [-0.82 + 0.25, 0.6, SEAT.z + 0.05];
    const m = pivotMesh(s, (gg) => {
      gg.mat('weave', '#c9a24a'); gg.tube([[0, 0, 0], [0, -0.12, 0.01], [0, -0.26, 0]], 0.004, { segs: 3, caps: false });
      gg.mat('cast', '#2f5f5a', { rough: 0.5 }); gg.lathe(0, 0, [[0.03, -0.42], [0.035, -0.4], [0.036, -0.3], [0.03, -0.27]], { segs: 10 });
      gg.mat('cast', PAL.brass); gg.cyl(0, -0.275, 0, 0.032, 0.02, { segs: 10 });
    }, pv);
    floaters.push({ mesh: m, kind: 'flask', ph: 2.1 }); }
  floaters.push({ mesh: lampMesh, kind: 'lamp', ph: 0.7 });
  // k0: how weightless (0 = a full g, 1 = nothing at all); jolt: a kick at the catch
  const st = floaters.map(() => ({ a: 0, v: 0, b: 0, w: 0 }));
  const float = (dt, k0, t) => {
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i], q = st[i];
      // where each would drift to with no weight, wandering slowly
      const free = f.kind === 'strap' ? -(1.9 + 0.5 * Math.sin(t * 0.37 + f.ph)) : f.kind === 'flask' ? -(2.5 + 0.35 * Math.sin(t * 0.23 + f.ph)) : 0.45 + 0.35 * Math.sin(t * 0.19 + f.ph);
      const target = k0 * free;
      // a spring that is strong under weight and nearly nothing without it
      const kS = 2 + 30 * (1 - k0), damp = 0.6 + 4 * (1 - k0);
      q.v += ((target - q.a) * kS - q.v * damp) * dt; q.a += q.v * dt;
      const yw = k0 * (f.kind === 'lamp' ? 0.6 * Math.sin(t * 0.13 + f.ph) : 0.4 * Math.sin(t * 0.29 + f.ph));
      q.b += (yw - q.b) * Math.min(1, dt * 0.8);
      turn(f.mesh, q.a, q.b);
    }
  };
  const kick = (amt) => { for (const q of st) q.v += amt * (0.5 + Math.random()); };
  const reset = () => { for (let i = 0; i < st.length; i++) { st[i].a = 0; st[i].v = 0; st[i].b = 0; turn(floaters[i].mesh, 0, 0); } };
  reset();
  return { board, float, kick, reset, seats };
}
