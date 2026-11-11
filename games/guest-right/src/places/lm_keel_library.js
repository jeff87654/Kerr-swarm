// The strain library: Chervil's cold copy of everything it eats that is alive, in the Keel, deck 11, under Ring Three.
//
// Every yeast, fungus, cell line and tomato in the drum descends from stock kept here, frozen, in duplicate, with its
// history written down. When a blight takes a line in the vat halls, the line is regrown from a vial out of these stacks.
//
// The big view is the stacks: one cold room from deck 9 to deck 13, thirty-six carousels of frosted tins in three rows,
// two stacker cranes fetching tins at walking pace and less, seen through the long window of a warm reading gallery.
// The cold walk is a glazed bridge out among the carousels. Round the gallery (lm_keel_library_rooms.js): the cab lobby,
// the coat room with the blight board, the reading room and its files, the cooks' doors, and the receiving bench.
//
// Frame 'keel-library': x spinward, z toward the back cap, y up; deck 11 at y = 0. The stacks are x[-30, 30] z[-30, -8],
// y[-8, 11.6]; the gallery is x[-30, 30] z[-8, 0], 7.8 m tall.
import { floor, ceiling, wall } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng } from '../core/util.js';
import { PI, C, REGION, VAULT, WALK, WIN, ROWS, COLS, CAR, TURNING, LIDS, MAST_H, say, toast, tick, runX, lineX, movable, turn, glyphAtlas, glyphWord, glyphRing, carouselLabel, drawCarousel, drawMast, drawCarriage, drawForks, drawTin } from './lm_keel_library_props.js';
import { buildRooms } from './lm_keel_library_rooms.js';

const VY0 = VAULT.y0, VY1 = VAULT.y1;
const VCLIP = [VAULT.x0 - 0.3, VY0 - 0.3, VAULT.z0 - 0.3, VAULT.x1 + 0.3, VY1 + 0.2, VAULT.z1 - 0.1];
const COLD = { exposure: 1.0, autoKey: 0.16, bloom: 0.06, warmth: -0.12, contrast: 1.06, saturation: 0.95 };

export const place = {
  id: 'lm-keel-library', name: 'The strain library', order: 10,
  region: REGION,
  stops: [
    { id: 'keel-library', name: 'The strain library', sub: 'the Keel · deck 11 · Ring Three', group: 'The Keel', spawn: 'keel-library', deck: 11, zd: 1040 },
  ],
  async build(game) {
    const t0 = performance.now();
    const W = game.world;
    const f = W.frame('keel-library', deckRadius(11), -1.2, 1040);
    const s = W.scope('keel-library', f);
    if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
    const R = glyphAtlas(game);
    const r = new Rng(11040);

    vaultShell(s, R);
    await tick(game);
    carousels(s, R);
    await tick(game);
    cranes(game, s, f, r);
    coldWalk(game, s, f);
    await tick(game);
    await buildRooms(game, s, f, r);

    let left = s.finish(48);
    while (left) { await tick(game); left = s.finish(48); }
    game.spawns['keel-library'] = { frame: f, x: -48.6, y: 0, z: 0, yaw: PI / 2 };
    console.log('[lm-keel-library] built in ' + (performance.now() - t0).toFixed(0) + ' ms');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// the stacks: the cold room's floor, walls and roof, the deck walkways on the back wall, the lamps
// ---------------------------------------------------------------------------------------------------------------
function vaultShell(s, R) {
  const g = s.g, X0 = VAULT.x0, X1 = VAULT.x1, Z0 = VAULT.z0, Z1 = VAULT.z1, H = VY1 - VY0;
  floor(s, X0, Z0, X1, Z1, VY0, 'deckplate', '#56646c', { noCollide: true });
  ceiling(s, X0, Z0, X1, Z1, VY1, 'panel', '#6f8598', { noCollide: true });
  const cold = { mat: 'panel', tint: '#647d92', skirt: false, noCollide: true };
  wall(s, X0, Z0, X0, Z1, VY0, H, cold);
  wall(s, X1, Z0, X1, Z1, VY0, H, cold);
  runX(X0, X1, 12, (a, b) => wall(s, a, Z0, b, Z0, VY0, H, cold));
  // the window wall: plaster on the gallery side, cold panels on the stacks' side; two long windows and the cold walk's door
  const ops = WIN.spans.map((sp) => ({ at: sp[0] - X0, w: sp[1] - sp[0], sill: WIN.y0 - VY0, h: WIN.y1 - WIN.y0 }));
  ops.push({ at: -1.1 - X0, w: 2.2, sill: -VY0, h: 2.3 });
  wall(s, X0, Z1, X1, Z1, VY0, H, { matA: 'plaster', tintA: C.plaster, matB: 'panel', tintB: '#647d92', openings: ops, skirt: false });
  for (const sp of WIN.spans) s.solid(sp[0], WIN.y0, Z1 - 0.06, sp[1], WIN.y1, Z1 + 0.06);
  // panel joints and the deck ledgers on the three cold walls: the scale of the room, deck by deck
  s.structure(() => {
    g.mat('cast', '#7f9099');
    for (let z = Z0 + 2.4; z < Z1 - 0.2; z += 2.4) for (const x of [X0 + 0.09, X1 - 0.09]) g.box(x - 0.012, VY0, z - 0.02, x + 0.012, VY1, z + 0.02, { faces: x < 0 ? 'XzZ' : 'xzZ' });
  });
  runX(X0, X1, 12, (a, b) => s.structure(() => {
    g.mat('cast', '#7f9099'); for (let x = a + 1.2; x < b - 0.1; x += 2.4) g.box(x - 0.02, VY0, Z0 + 0.08, x + 0.02, VY1, Z0 + 0.1, { faces: 'xXZ' });
    g.mat('cast', '#5d6e78'); for (let y = VY0 + 4; y < VY1 - 1; y += 4) { g.box(a, y - 0.12, Z0 + 0.08, b, y + 0.12, Z0 + 0.16, { faces: 'yYZ' }); g.box(a, y - 0.12, Z1 - 0.16, b, y + 0.12, Z1 - 0.08, { faces: 'yYz' }); }
  }));
  s.structure(() => { g.mat('cast', '#5d6e78'); for (let y = VY0 + 4; y < VY1 - 1; y += 4) for (const x of [X0 + 0.08, X1 - 0.16]) g.box(x, y - 0.12, Z0, x + 0.08, y + 0.12, Z1, { faces: 'yYxX' }); });
  // walkways along the back wall at every deck, with rails and ladders between them
  for (let y = VY0 + 4; y < VY1 - 1; y += 4) {
    runX(X0, X1, 10, (a, b) => s.structure(() => {
      g.mat('grille', '#7a868c'); g.box(a, y - 0.04, Z0, b, y, Z0 + 1.3, { faces: 'Yy' });
      g.mat('cast', '#4f5e66'); g.box(a, y - 0.2, Z0 + 1.26, b, y, Z0 + 1.32);
      for (let x = a; x < b - 0.1; x += 2) g.tube([[x, y, Z0 + 1.3], [x, y + 1.05, Z0 + 1.3]], 0.02, { segs: 4 });
      g.mat('paint', '#d6a640', { rough: -0.1 }); g.tube(lineX(a, b, y + 1.05, Z0 + 1.3, 4), 0.025, { segs: 6, caps: false });
      g.mat('cast', '#4f5e66'); g.tube(lineX(a, b, y + 0.55, Z0 + 1.3, 4), 0.014, { segs: 4, caps: false });
    }));
  }
  s.structure(() => {
    g.mat('cast', '#4f5e66');
    for (const x of [X0 + 1.2, X1 - 1.2]) {
      for (const dx of [-0.22, 0.22]) g.box(x + dx - 0.02, VY0, Z0 + 0.12, x + dx + 0.02, VY1 - 2.6, Z0 + 0.16);
      for (let y = VY0 + 0.3; y < VY1 - 2.8; y += 0.3) g.box(x - 0.22, y - 0.012, Z0 + 0.12, x + 0.22, y + 0.012, Z0 + 0.16);
    }
  });
  // painted deck numbers on the back wall, and the row letters on the anti wall
  s.deco(() => {
    for (let y = VY0, d = 9; y < VY1 - 1; y += 4, d++) for (const x of [-15, 15]) { g.at(x, 0, Z0 + 0.1, 0); glyphWord(g, R, 'DECK ' + d, 1, y + 2.3, 0.004, 0.42, 0.7); g.pop(); }
    ROWS.forEach((z, i) => { g.at(X0 + 0.1, 0, z, PI / 2); glyphWord(g, R, 'ABC'[i], 1, 9.7, 0.004, 1.3, 2.0); g.pop(); g.at(X1 - 0.1, 0, z, -PI / 2); glyphWord(g, R, 'ABC'[i], 1, 9.7, 0.004, 1.3, 2.0); g.pop(); });
  });
  // the lamps: cold strips under the roof over every aisle, low lamps by the window for the depth, the room's bounce
  const aisles = [-9.6, -15, -21, -27];
  for (const z of aisles) {
    runX(X0 + 1, X1 - 1, 14, (a, b) => s.deco(() => {
      g.mat('cast', '#4f5e66'); g.box(a, VY1 - 0.5, z - 0.12, b, VY1 - 0.42, z + 0.12); for (let x = a + 1; x < b; x += 5) g.box(x - 0.015, VY1 - 0.42, z - 0.015, x + 0.015, VY1, z + 0.015);
      g.mat('diffuser', '#e6f4ff', { emissive: 5 }); g.box(a, VY1 - 0.54, z - 0.08, b, VY1 - 0.5, z + 0.08, { faces: 'yxXzZ' });
    }));
    for (const h of [[X0 + 1, -0.5], [0.5, X1 - 1]]) s.light({ at: [h[0], VY1 - 0.7, z], to: [h[1], VY1 - 0.7, z], type: 'tube', color: [0.58, 0.8, 1.0], power: z === -9.6 ? 7 : 4.5, range: 16, radius: 0.1, shadow: z === -9.6, clip: VCLIP });
  }
  for (const x of [-16, 0, 16]) {
    s.light({ at: [x, VY0 + 1.6, -9.0], color: [0.5, 0.8, 1.0], power: 5, range: 11, clip: VCLIP });
    s.deco(() => { g.mat('cast', '#4f5e66'); g.box(x - 0.3, VY0 + 1.5, Z1 - 0.2, x + 0.3, VY0 + 1.75, Z1 - 0.08); g.mat('diffuser', '#d8f0ff', { emissive: 4 }); g.box(x - 0.26, VY0 + 1.48, Z1 - 0.19, x + 0.26, VY0 + 1.52, Z1 - 0.09, { faces: 'y' }); });
  }
  s.ambient({ box: [X0, VY0, Z0, X1, VY1, Z1], sky: '#9ccdf2', ground: '#22303c', power: 0.2, soft: 1.2, spec: 0.5, lamp: false });
  // cold air pooling on the floor and a haze of frost on the window's cold face
  for (let x = -24; x <= 24; x += 12) for (const z of [-10.4, -21]) s.glowCard(x, VY0 + 0.25, z, { face: 'y', color: '#dcefff', size: 9, strength: 0.05, follow: 'always' });
  for (const sp of WIN.spans) for (let x = sp[0] + 1.5; x < sp[1]; x += 4.5) s.glowCard(x, WIN.y0 + 0.25, Z1 - 0.1, { face: 'Z', color: '#eaf6ff', size: 1.4, strength: 0.03, follow: 'always' });
}

// ---------------------------------------------------------------------------------------------------------------
// the carousels: three rows of twelve, three of them turning; each numbered on its drive band
// ---------------------------------------------------------------------------------------------------------------
function carousels(s, R) {
  const g = s.g, turning = [];
  ROWS.forEach((z, row) => {
    for (const x of COLS) {
      const label = carouselLabel(row, x);
      const tc = TURNING.find((t) => t[0] === x && t[1] === row);
      if (tc) {
        const m = movable(s, (gg) => drawCarousel(gg, row, R, label), [x, VY0, z], { center: [0, 8.5, 0], radius: 9.5, far: 220 });
        if (m) turning.push({ m, a: 0, w: tc[2] });
        s.post(x, z, CAR.r, VY0, VY0 + CAR.top);
        continue;
      }
      prop(s, 'keellib.carousel', x, VY0, z, 0, { row }, { tier: 's', cast: false, tint: [1, 1 - ((x * 7 + row) % 3) * 0.015, 1 - ((x * 3 + row) % 4) * 0.012] });
      s.structure(() => { g.at(x, VY0, z, 0); glyphRing(g, R, label, 1, CAR.top + 0.25, 0.565, 0.17, 0.36); g.pop(); });
    }
  });
  if (turning.length) s.every((dt) => { const d = Math.min(dt, 0.1); for (const t of turning) { t.a += t.w * d; turn(t.m, t.a); } });
  // the floor rails of the two cranes, their top rails hung from the roof, and their ports
  s.structure(() => {
    for (const rl of [[VAULT.x0 + 0.5, -2.2, -9.3], [2.2, VAULT.x1 - 0.5, -15]]) {
      g.mat('cast', '#3a4248'); g.box(rl[0], VY0, rl[2] - 0.14, rl[1], VY0 + 0.1, rl[2] + 0.14, { faces: 'yYzZxX' });
      g.mat('brushed', '#b7c3c9', { rough: -0.2 }); g.box(rl[0], VY0 + 0.1, rl[2] - 0.04, rl[1], VY0 + 0.14, rl[2] + 0.04, { faces: 'YzZ' });
      g.mat('paint', '#d6a640'); g.box(rl[0], VY0 + 0.002, rl[2] - 0.6, rl[1], VY0 + 0.006, rl[2] - 0.5, { faces: 'Y' }); g.box(rl[0], VY0 + 0.002, rl[2] + 0.5, rl[1], VY0 + 0.006, rl[2] + 0.6, { faces: 'Y' });
      const yt = VY0 + MAST_H + 0.25;
      g.mat('cast', '#4f5e66'); g.box(rl[0], yt, rl[2] - 0.12, rl[1], yt + 0.3, rl[2] + 0.12);
      for (let x = rl[0] + 1; x < rl[1]; x += 4) g.box(x - 0.03, yt + 0.3, rl[2] - 0.03, x + 0.03, VY1, rl[2] + 0.03);
    }
  });
  for (const p of PORTS) {
    s.furniture(() => {
      g.mat('panel', '#5d6e78'); g.box(p.x - 0.5, VY0, p.z - 0.5, p.x + 0.5, p.y - 0.06, p.z + 0.5, { bevel: 0.02 });
      g.mat('brushed', '#b7c3c9'); g.box(p.x - 0.45, p.y - 0.06, p.z - 0.45, p.x + 0.45, p.y, p.z + 0.45, { bevel: 0.01 });
      g.mat('cast', '#3a4248'); g.box(p.x - 0.5, p.y, p.z - 0.5, p.x + 0.5, p.y + 0.7, p.z - 0.4); g.box(p.x - 0.5, p.y + 0.6, p.z - 0.5, p.x + 0.5, p.y + 0.7, p.z + 0.2);
      g.mat('diffuser', '#ffb040', { emissive: 3 }); g.box(p.x - 0.3, p.y + 0.58, p.z + 0.18, p.x + 0.3, p.y + 0.6, p.z + 0.2, { faces: 'yZ' });
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the two stacker cranes: each runs its aisle at walking pace and less, climbs, reaches, takes a tin, carries it to
// its port, and brings another back. Robots are appliances: this is a machine fetching a tin.
// ---------------------------------------------------------------------------------------------------------------
// ports: where tins go out to the receiving bench and the seed rooms, and come back (x, z of the hatch; y its sill)
const PORTS = [{ x: VAULT.x0 + 1.1, z: -11.0, y: 0.95 }, { x: VAULT.x1 - 1.1, z: -17.0, y: -3.05 }];
function cranes(game, s, f, r) {
  const defs = [
    { z: -9.3, x0: VAULT.x0 + 1.4, x1: -3.0, row: 0, port: PORTS[0], reach: 0.55 },
    { z: -15, x0: 3.0, x1: VAULT.x1 - 1.4, row: 1, port: PORTS[1], reach: 0.72 },
  ];
  const all = [];
  defs.forEach((d, i) => {
    const lid = LIDS[d.row][i + 1];
    const st = { d, x: i ? 14 : -15, y: VY0 + 5, e: 0, vx: 0, vy: 0, phase: 'wait', t: 1 + i * 4, carry: false, job: 0, tx: 0, ty: 0, lift: 0 };
    st.mast = movable(s, (g) => drawMast(g), [st.x, VY0, d.z], { center: [0, MAST_H / 2, 0], radius: MAST_H / 2 + 1, far: 220 });
    st.car = movable(s, (g) => drawCarriage(g), [st.x, st.y, d.z], { center: [0, 0, 0], radius: 1, far: 160 });
    st.fork = movable(s, (g) => drawForks(g), [st.x, st.y, d.z - 0.42], { center: [0, 0, -0.4], radius: 0.9, far: 120 });
    st.tin = movable(s, (g) => drawTin(g, lid), [st.x, st.y, d.z - 1.0], { center: [0, 0.2, 0], radius: 0.4, far: 90 });
    if (st.tin) st.tin.userData.hidden = true;
    st.light = s.light({ at: [st.x, st.y - 0.5, d.z], color: [0.8, 0.92, 1.0], power: 2.2, range: 6, radius: 0.2, clip: VCLIP });
    all.push(st);
  });
  const rng = new Rng(r.i(1, 1e6));
  const nextJob = (st) => {
    const d = st.d; st.job++;
    const atPort = st.job % 2 === 0;
    if (atPort) { st.tx = d.port.x; st.ty = d.port.y; }
    else {
      const xs = COLS.filter((x) => x > d.x0 - 0.5 && x < d.x1 + 0.5);
      st.tx = xs[rng.i(0, xs.length - 1)]; st.ty = VY0 + CAR.y0 + rng.i(1, CAR.shelves - 2) * CAR.dy;
    }
    st.tx = Math.max(d.x0, Math.min(d.x1, st.tx));
    st.lift = st.carry ? 0.04 : -0.05;          // carrying: come in above the shelf and set it down; empty: come in under the tin
    st.phase = 'travel';
  };
  // a velocity-limited move toward a target, easing in and out
  const ax = (st, k, target, vmax, acc, dt) => {
    const vk = 'v' + k, dist = target - st[k], dir = Math.sign(dist);
    if (Math.abs(dist) < 0.002) { st[k] = target; st[vk] = 0; return true; }
    const want = dir * Math.min(vmax, Math.sqrt(2 * acc * Math.abs(dist)));
    let v = st[vk]; v = v < want ? Math.min(want, v + acc * dt) : Math.max(want, v - acc * dt);
    st[k] += v * dt; st[vk] = v;
    if (Math.sign(target - st[k]) !== dir) { st[k] = target; st[vk] = 0; return true; }
    return false;
  };
  const place1 = (st) => {
    const d = st.d, x = st.x, y = st.y;
    if (st.mast) st.mast.userData.origin[0] = x;
    if (st.car) { const o = st.car.userData.origin; o[0] = x; o[1] = y; }
    if (st.fork) { const o = st.fork.userData.origin; o[0] = x; o[1] = y - 0.05; o[2] = d.z - 0.42 - st.e; }
    if (st.tin) { const o = st.tin.userData.origin; o[0] = x; o[1] = y - 0.02; o[2] = d.z - 1.04 - st.e; st.tin.userData.hidden = !st.carry; }
    if (st.light) { st.light.theta = f.theta(x); st.light.rho = f.rho(y - 0.6); st.light.z = f.zd(d.z - 0.3); }
  };
  all.forEach(place1);
  s.every((dt0) => {
    const dt = Math.min(dt0, 0.1);
    for (const st of all) {
      if (st.phase === 'wait') { st.t -= dt; if (st.t <= 0) nextJob(st); }
      else if (st.phase === 'travel') {
        const a = ax(st, 'x', st.tx, 0.45, 0.12, dt), b = ax(st, 'y', st.ty + st.lift, 0.35, 0.12, dt);
        if (a && b) st.phase = 'reach';
      } else if (st.phase === 'reach') { st.e = Math.min(st.d.reach, st.e + 0.16 * dt); if (st.e >= st.d.reach) { st.phase = 'lift'; st.t = 0.8; } }
      else if (st.phase === 'lift') {
        st.t -= dt;
        if (st.t <= 0 && ax(st, 'y', st.ty - st.lift, 0.05, 0.1, dt)) { st.carry = !st.carry; st.phase = 'back'; }
      } else if (st.phase === 'back') { st.e = Math.max(0, st.e - 0.16 * dt); if (st.e <= 0) { st.phase = 'wait'; st.t = 1.5 + rng.f(0, 2.5); } }
      place1(st);
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the cold walk: a glazed bridge from the gallery out among the carousels, through a two-door lock, at minus twenty
// ---------------------------------------------------------------------------------------------------------------
function coldWalk(game, s, f) {
  const g = s.g, X = WALK.x, Z0 = WALK.z0, Z1 = WALK.z1, L = WALK.lock, H = WALK.h;
  // the lock: a short insulated box with a glazed sliding pair at each end
  floor(s, -X, L, X, Z1 + 0.08, 0, 'speckle', '#3d5a5a');
  ceiling(s, -X, L, X, Z1, H, 'panel', '#d9dfdc');
  for (const sx of [-1, 1]) wall(s, sx * X, L, sx * X, Z1, 0, H, { mat: 'panel', tintA: sx < 0 ? '#e6ebe8' : C.panel, tintB: sx < 0 ? C.panel : '#e6ebe8', skirt: false, cap: true });
  s.structure(() => { g.mat('panel', C.panel); g.box(-X - 0.08, H, L, X + 0.08, H + 0.25, Z1 - 0.08, { faces: 'YxXz' }); });
  for (const z of [Z1, L]) {
    door(s, { x: -1.1, y: 0, z, w: 1.1, h: 2.3, along: 'x', dir: 1, kind: 'slide', style: 'glazed', auto: true, tint: z === Z1 ? C.walnut : '#5d6e78', mat: z === Z1 ? 'wood' : 'panel' });
    door(s, { x: 1.1, y: 0, z, w: 1.1, h: 2.3, along: 'x', dir: -1, kind: 'slide', style: 'glazed', auto: true, tint: z === Z1 ? C.walnut : '#5d6e78', mat: z === Z1 ? 'wood' : 'panel' });
  }
  // the inner door's frame, and breath-fog at its seals
  s.structure(() => { g.mat('panel', '#5d6e78'); g.box(-X, 2.3, L - 0.1, X, H, L + 0.1); for (const sx of [-1, 1]) g.box(sx * 1.1, 0, L - 0.1, sx * X, 2.3, L + 0.1); });
  for (const sx of [-1, 1]) for (let y = 0.3; y < 2.3; y += 0.5) s.glowCard(sx * 1.08, y, L - 0.14, { face: 'Z', color: '#f2f8ff', size: 0.55, strength: 0.14, follow: 'always' });
  for (let x = -0.8; x <= 0.8; x += 0.8) s.glowCard(x, 2.28, L - 0.14, { face: 'Z', color: '#f2f8ff', size: 0.5, strength: 0.12, follow: 'always' });
  s.glowCard(0, 0.15, L - 0.6, { face: 'y', color: '#eaf6ff', size: 2.2, strength: 0.1, follow: 'always' });
  lockLamp(s, L, Z1);
  // the walk: grating on two beams, glass sides and roof on a steel frame, a brass handrail
  runX(Z0, L, 4.1, (a, b) => {
    s.structure(() => {
      g.mat('grille', '#7a868c'); g.box(-X, -0.05, a, X, 0, b, { faces: 'Yy' });
      g.mat('cast', '#4f5e66'); for (const x of [-0.9, 0.9]) { g.box(x - 0.08, -0.5, a, x + 0.08, -0.05, b, { faces: 'xXy' }); g.box(x - 0.14, -0.5, a, x + 0.14, -0.44, b, { faces: 'yYxX' }); }
      g.box(-X - 0.06, -0.12, a, -X + 0.04, 0.06, b); g.box(X - 0.04, -0.12, a, X + 0.06, 0.06, b);
    });
  });
  s.solid(-X, -0.4, Z0, X, 0, L, { surf: 'metal' });
  const nPost = 7;
  for (let i = 0; i <= nPost; i++) {
    const z = L + (Z0 - L) * i / nPost;
    s.structure(() => {
      g.mat('paint', '#5a6a72', { rough: -0.1 });
      for (const sx of [-1, 1]) g.box(sx * X - 0.04, 0, z - 0.04, sx * X + 0.04, H, z + 0.04);
      g.box(-X - 0.04, H - 0.06, z - 0.04, X + 0.04, H + 0.04, z + 0.04);
      if (i % 2 === 0 && i < nPost) for (const x of [-0.9, 0.9]) g.box(x - 0.1, VY0, z - 2.33 - 0.1, x + 0.1, -0.5, z - 2.33 + 0.1, { faces: 'xXzZ' });
    });
  }
  s.structure(() => {
    g.mat('paint', '#5a6a72', { rough: -0.1 });
    for (const sx of [-1, 1]) { g.box(sx * X - 0.04, H - 0.06, Z0, sx * X + 0.04, H + 0.04, L); g.box(sx * X - 0.04, 0, Z0, sx * X + 0.04, 0.1, L); }
    g.box(-X, 0, Z0 - 0.04, X, 0.1, Z0 + 0.04); g.box(-X, H - 0.06, Z0 - 0.04, X, H + 0.04, Z0 + 0.04);
    g.box(-0.04, 0, Z0 - 0.04, 0.04, H, Z0 + 0.04);
  });
  for (const sx of [-1, 1]) {
    s.detail(() => {
      g.mat('cast', C.brass, { rough: -0.25 }); g.tube([[sx * (X - 0.1), 1.0, L - 0.1], [sx * (X - 0.1), 1.0, Z0 + 0.15]], 0.022, { segs: 8 });
      for (let i = 0; i <= nPost; i++) { const z = L + (Z0 - L) * i / nPost; g.tube([[sx * X, 1.0, z], [sx * (X - 0.1), 1.0, z]], 0.012, { segs: 5 }); }
      // a warm strip under the rail, for the feet
      g.mat('diffuser', '#ffe6c0', { emissive: 2.2 }); g.box(sx * (X - 0.12) - 0.012, 0.95, Z0 + 0.2, sx * (X - 0.12) + 0.012, 0.965, L - 0.2, { faces: 'y' });
    });
  }
  // glass: both sides, the roof, the end
  s.glass(-X, 0.06, Z0, -X, H, L, { tint: '#d6ecf6', opacity: 0.09 });
  s.glass(X, 0.06, Z0, X, H, L, { tint: '#d6ecf6', opacity: 0.09 });
  s.glass(-X, H, Z0, X, H, L, { tint: '#d6ecf6', opacity: 0.08 });
  s.glass(-X, 0.06, Z0, X, H, Z0, { tint: '#d6ecf6', opacity: 0.09 });
  s.solid(-X - 0.06, 0, Z0, -X, H, L); s.solid(X, 0, Z0, X + 0.06, H, L); s.solid(-X, 0, Z0 - 0.06, X, H, Z0);
  for (let z = L - 1.5; z > Z0; z -= 3.2) for (const sx of [-1, 1]) s.glowCard(sx * (X - 0.03), 0.35, z, { face: sx < 0 ? 'X' : 'x', color: '#eef8ff', size: 0.9, strength: 0.06, follow: 'always' });
  s.light({ at: [0, 0.9, L - 0.4], to: [0, 0.9, Z0 + 0.4], type: 'tube', color: [1.0, 0.86, 0.7], power: 2.4, range: 2.6, radius: 0.05, clip: [-X, -0.1, Z0, X, H, L] });
  // row plates on the rail where the walk passes each row, and the plate at the end
  const rowPlates = [['Row A', 'vat cultures · flour · yeasts · dairy'], ['Row B', 'fungi · algae · plant cells'], ['Row C', 'cell lines · registered starters']];
  ROWS.forEach((z, i) => sign(s, { kind: 'plate', text: rowPlates[i][0], lines: [rowPlates[i][1]] }, X - 0.08, 1.12, z, { face: 'x', w: 0.42, h: 0.18 }));
  sign(s, { kind: 'notice', title: 'The cold walk', lines: ['The walk: minus twenty.', 'The stacks: minus eighty.', 'Stay as long as your coat lets you.', 'Tins out of their carousel', 'more than four minutes go back', 'and are written down as warmed.'] }, -0.65, 1.35, Z0 + 0.05, { face: 'Z', w: 0.5, h: 0.62 });
  s.interact({ x: -0.6, y: 1.2, z: Z0 + 0.6, radius: 1.4, prompt: 'Read the plate at the end of the walk', onUse: async (gm) => {
    await say(gm, 'The cold walk', [
      'THE COLD WALK. The air in here is kept at minus twenty. On the other side of the glass the stacks are at minus eighty. Stay as long as your coat lets you.',
      'The cranes go at a quarter of walking pace so the air round the tins is never stirred. A tin out of its carousel for more than four minutes goes back, and every vial in it is written down as warmed.',
      'Row A holds the vat cultures: flour, the yeasts, the dairy. Row B, fungi, algae and plant cells, coffee and cocoa among them, and the Garden\'s seed lines. Row C, the cell lines for the steak halls, and every registered starter in the drum.',
    ]);
  } });
  s.spot('stand', 0.6, 0, -16.2, -PI / 2 + 0.2, { tags: ['rail'] });
  s.spot('stand', -0.6, 0, -22.4, PI / 2 - 0.2, { tags: ['rail'] });
  s.path([[0, -3.2], [0, -7.0], [0, -9.6], [0, -12.4], [0, -19.5], [0, -26.6]], { width: 1.0 });
  // the cold, felt on the way in
  let warned = false;
  s.trigger({ box: [-X, -0.2, L - 0.8, X, 2.4, L + 0.4], onEnter(gm) {
    if (warned) return; warned = true;
    toast(gm, gm.flags && gm.flags.keelLibCoat ? 'Your breath shows the moment the inner door opens. Minus twenty, and the coat earns its peg.' : 'The cold comes through the inner door like a wall. The coats are on the pegs in the coat room.');
  } });
  s.zoneBox({ id: 'keel-library-walk', place: 'keel-library', box: [-X, -0.5, Z0, X, H, Z1], name: 'The cold walk', sub: 'The strain library · out among the stacks', ambience: 'quiet', reverb: 'room', headroom: H, env: COLD });
}
// the lock's own light: a small panel, cool
function lockLamp(s, L, Z1) {
  const g = s.g;
  s.deco(() => { g.mat('brushed', '#8d8478'); g.box(-0.4, WALK.h - 0.04, (L + Z1) / 2 - 0.25, 0.4, WALK.h, (L + Z1) / 2 + 0.25); g.mat('diffuser', '#e8f4ff', { emissive: 4 }); g.box(-0.36, WALK.h - 0.05, (L + Z1) / 2 - 0.21, 0.36, WALK.h - 0.04, (L + Z1) / 2 + 0.21, { faces: 'y' }); });
  s.light({ at: [0, WALK.h - 0.2, (L + Z1) / 2], color: [0.82, 0.92, 1.0], power: 3, range: 4, clip: [-WALK.x, -0.1, L - 0.1, WALK.x, WALK.h, Z1 + 0.1] });
}
