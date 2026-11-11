// People: the public face. createPeople(game) builds a population for every frame that has spots or walkways,
// runs their days, draws them (one InstancedMesh per part shape, with levels of detail) and lets story code direct
// the named cast. See people_rig.js (bodies), people_poses.js (poses) and people_mind.js (decisions).
import * as THREE from 'three';
import { createPartMeshes, makeLook, makeBody, solve, shiftBones, emitParts, emitOne, CH, BONE, NBONES, bonePoint, eulerYXZ } from './people_rig.js';
import { poseTarget, emitItems, ITEM_COL } from './people_poses.js';
import { indexWorld, indexScope, indexSpots, unindexScope, refreshFrame, MAGNETS, castPlan, findSpot, crowdPoints, takeSpot, releaseSpot, poseForSpot, stayFor, nowMin, planRoute, activeMagnet, spotFree, isMeal, wantsFor, pickKey } from './people_mind.js';
import { CAST } from '../content/cast.js';
import { CHATTER } from '../content/chatter.js';
import { PLACES } from '../content/places.js';
import { flatToRender } from '../core/drum.js';
import { Rng, clamp, lerp, damp, wrapPi, hashStr, hexLin } from '../core/util.js';

const TAU = Math.PI * 2;
let LOD0 = 18, LOD1 = 90, LOD2 = 400, CAP0 = 40, CAP1 = 150, SHADOW = 25;
// full figures to d0 m (at most cap0), middle figures to d1 m (at most cap1), shadow stand-ins within s m
const LOD_BY_QUALITY = { low: [10, 50, 20, 80, 14], medium: [14, 70, 30, 120, 20], high: [18, 90, 40, 150, 25], ultra: [24, 110, 60, 200, 32] };
const _r = { x: 0, y: 0, z: 0 }, _v4 = new THREE.Vector4(), _p = [0, 0, 0], _R = new Float64Array(9), ID3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function createPeople(game) {
  const W = game.world, player = game.player;
  const meshes = createPartMeshes(game);
  const origin = [0, 0, 0];
  // only the big shapes of the near figures cast overhead shadows (the shadow maps draw everything again)
  // nothing people show casts a shadow: cheap stand-ins (a body and two legs) for the near ones are drawn into the shadow maps only
  for (const pm of meshes.list) {
    const sh = pm.name === 'sh-body' || pm.name === 'sh-leg';
    if (sh) W.addRenderable(pm.mesh, { frame: null, origin, center: [0, 1, 0], radius: 6, far: -1e9, caster: true, always: false });
    else W.addRenderable(pm.mesh, { frame: null, origin, center: [0, 1, 0], radius: 6, far: LOD2, caster: false, always: true });
    pm.mesh.userData.hidden = true;
  }
  const M = {
    game, meshes, origin, frames: null, people: [], byId: new Map(), cast: new Map(), density: 1, magnets: MAGNETS, rng: new Rng(hashStr('chervil')),
    frameId: null, lastNow: 0, grid: new Map(), nextId: 1, cleared: false, spotCount: -1, tickList: [], dirty: new Set(), fill: [],
  };
  const stats = { people: 0, present: 0, drawn: 0, lod0: 0, lod1: 0, lod2: 0, parts: 0, tris: 0, ms: 0, msMind: 0, msPose: 0, msDraw: 0, walkers: 0 };

  // ------------------------------------------------------------------ people
  function newPerson(fi, kind, seed, spec, castId) {
    const L = makeLook(seed, spec);
    const body = makeBody(L, meshes.byName);
    const rng = new Rng((seed ^ 0x9e3779b9) >>> 0);
    const p = {
      id: castId || 'p' + (M.nextId++), kind, castId: castId || null, name: castId ? CAST[castId].name : null, fi, frame: fi ? fi.frame : null, body, rng,
      x: 0, y: 0, z: 0, yaw: rng.f(-3, 3), vx: 0, vz: 0, spd: 0, g: 1, state: 'away', backAt: 0, route: null, ri: 0, goal: null, spot: null, cat: null, until: 0, spotT: 0,
      cur: new Float32Array(CH.N), tgt: new Float32Array(CH.N), bones: new Float64Array(NBONES * 12), items: [], carry: null,
      t: rng.f(0, 100), phase: rng.next(), r1: rng.next(), r2: rng.next(), r3: rng.next(),
      lookYaw: 0, lookPitch: 0, lookT: 0, lookCD: 0, glance: 0, talking: 0, talkT: rng.f(1, 6), lookAt: null,
      seatH: 0, tableH: 0, workH: 0.9, pose: 'stand', tag: null, sit: false, override: null, directed: false, idleT: 0,
      walkSpd: (L.child ? 1.42 : L.elder ? (L.age > 95 ? 0.82 : 1.0) : 1.34) * rng.f(0.88, 1.12), waitT: 0, side: 0,
      lod: 3, dist: 1e9, visible: false, adt: 0, tacc: 0, slot: M.nextId % 12, gq: M.nextId % 3, sx: 0, sy: 0, sz: 0, wasGround: true, blocked: 0, faceYaw: null, snap: 0, talkingToPlayer: false,
      voice: L.voice,
      // filled in as they live (declared here so every person has the same shape)
      idleLook: 0, idleLookP: 0, gy: 0, ball: null, circle: null, hurry: 1, lingerAway: 0, onArrive: null, directedPose: null, anchorFn: null, bubbleOn: false,
      tmpPose: null, tmpUntil: 0, sweeping: false, poseKey: null,
      chatLock: false, near: false, api: null, interact: null, pin: null, minReal: 0, lift: 0, noLook: false, say: null,
    };
    p.say = { name: castId ? CAST[castId].name : 'Someone', colour: castId ? (CAST[castId].look && CAST[castId].look.top) || '#FFD9A0' : '#FFD9A0' };
    p.cur[CH.GROUND] = 1; p.tgt[CH.GROUND] = 1;
    if (fi) fi.people.push(p);
    M.people.push(p);
    return p;
  }
  function moveToFrame(p, fi) {
    if (p.fi === fi) return;
    releaseSpot(p);
    if (p.fi) { const a = p.fi.people, i = a.indexOf(p); if (i >= 0) a.splice(i, 1); }
    p.fi = fi; p.frame = fi ? fi.frame : null; if (fi) fi.people.push(p);
    if (p.interact) p.interact.frame = p.frame;
  }
  function removePerson(p) {
    releaseSpot(p); if (p.ball) p.ball = null;
    if (p.fi) { const a = p.fi.people, i = a.indexOf(p); if (i >= 0) a.splice(i, 1); }
    const i = M.people.indexOf(p); if (i >= 0) M.people.splice(i, 1);
    if (p.interact) W.removeInteract(p.interact);
    bubbleOff(p);
  }

  // ------------------------------------------------------------------ the clock
  const clockNow = () => nowMin(game);
  const hourNow = () => game.clock.hours;
  const dayNow = () => game.clock.day;                 // day 4 and after: no festival, an ordinary day

  // ------------------------------------------------------------------ what the player can see
  const eye = { x: 0, y: 0, z: 0 };
  function seenBy(p, margin) {
    if (!player.frame || p.frame !== player.frame) return false;
    const dx = p.x - eye.x, dz = p.z - eye.z, d = Math.hypot(dx, dz);
    if (d < 6) return true; if (d > 70 + (margin || 0)) return false;
    const fx = Math.sin(player.yaw), fz = -Math.cos(player.yaw);
    return (dx * fx + dz * fz) / d > 0.25;
  }
  const seenAt = (fi, x, z) => fi.frame === player.frame && (() => { const dx = x - eye.x, dz = z - eye.z, d = Math.hypot(dx, dz); if (d < 8) return true; if (d > 60) return false; return (dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw)) / d > 0.2; })();

  // ------------------------------------------------------------------ decisions
  function setCarry(p, kind) {
    const L = p.body.L, u = p.rng.next(), h = hourNow();
    p.carry = null;
    if (L.accents.indexOf('cane') >= 0) { p.carry = 'cane'; return; }
    if (kind === 'away' && (h >= 21 || h < 6.5) && u < 0.45) { p.carry = 'lamp'; return; }
    const st = p.fi.id === 'station';
    if (u < (st ? 0.1 : 0.03)) p.carry = 'crate';
    else if (u < (st ? 0.14 : 0.09) && h < 14) p.carry = 'basket';
    else if (u < 0.13 && !L.child) p.carry = 'book';
    else if (u < 0.16 && !L.child) p.carry = 'cup';
    else if (u < 0.175 && !L.child) p.carry = 'board';
    else if (u < 0.18 && !L.child && p.fi.places.has('flutes')) p.carry = 'flute';
  }
  function think(p) {
    p.goal = null; p.route = null; p.override = p.directed ? p.override : null;
    if (p.directed) { p.state = 'idle'; p.idleT = 1.5; p.pose = p.directedPose || 'stand'; return; }
    if (p.kind === 'cast') { thinkCast(p); return; }
    if (p.kind === 'crowd' && p.pin) { const s = findSpot(M, p, null, p.pin); if (s && goToSpot(p, s, 'magnet')) return; p.state = 'idle'; p.idleT = 5; p.pose = 'stand'; return; }
    const fi = p.fi, hour = hourNow(), day = dayNow();
    const mag = activeMagnet(fi, day, hour, M.magnets);
    const Wt = wantsFor(p, hour, day, fi, mag);
    for (let tries = 0; tries < 4; tries++) {
      const cat = pickKey(M.rng, Wt);
      if (cat === 'away') { goAway(p); return; }
      if (cat === 'wander') { wander(p); return; }
      if (cat === 'sweep') { wander(p); if (p.state === 'walk') { p.carry = 'broom'; p.hurry = 0.42; } return; }
      const s = cat === 'magnet' ? findSpot(M, p, null, mag.place) : findSpot(M, p, cat, null);
      if (s && goToSpot(p, s, cat)) return;
      Wt[cat] = 0;
    }
    wander(p);
  }
  function thinkCast(p) {
    const plan = castPlan(p.castId, dayNow(), hourNow());
    if (!plan) { goAway(p); return; }
    const target = castTarget(p, plan.place) || (plan.alt && castTarget(p, plan.alt));
    if (!target) { goAway(p); return; }
    if (target.fi !== p.fi) {
      if (seenBy(p)) { goAway(p, target.fi); return; }
      moveToFrame(p, target.fi); p.state = 'away'; p.backAt = clockNow(); return;
    }
    if (!goToSpot(p, target.s, plan.kind === 'work' ? 'work' : 'cast')) { p.state = 'idle'; p.idleT = 10; p.pose = 'stand'; }
  }
  // the spot a named person should take in a place: their own (who), else a keeper's post, else any free one
  function castTarget(p, place) {
    let best = null, bs = -1;
    for (const fi of M.frames.values()) {
      if (!fi.places.has(place)) continue;
      for (const s of fi.spots) {
        if (s.pp.place !== place || !spotFree(s, p) || s.pp.blocked) continue;
        let sc = s.who === p.castId ? 100 : (s.type === 'counter' || s.type === 'work') ? 20 : s.type === 'chat' || s.type === 'sit' ? 8 : s.type === 'bed' ? 0 : 4;
        if (s.type === 'bed' && !(hourNow() >= 23 || hourNow() < 6.5)) continue;
        if (s.type === 'play' && !p.body.L.child) continue;
        sc += Math.random();
        if (sc > bs) { bs = sc; best = { fi, s }; }
      }
      if (!best) { const cp = crowdPoints(M, fi, place); const s = cp.find((q) => !q.taken); if (s) best = { fi, s }; }
    }
    return best;
  }
  function goToSpot(p, s, cat) {
    const fi = p.fi;
    if (p.state === 'away') {
      // coming back: straight to the spot when nobody sees it, else in from a walkway end out of sight
      if (!seenAt(fi, s.x, s.z)) { occupy(p, s, cat, true); return true; }
      const n = hiddenPortal(fi); if (!n) return false;
      p.x = n.x; p.y = n.y; p.z = n.z; p.state = 'idle'; p.cur.set(p.tgt); p.cur[CH.GROUND] = 1;
    }
    const pts = planRoute(fi, p, s.x, s.pp.floor, s.z, s.pp.link && s.pp.nodeD < 12 ? s.pp.link : null);
    if (!pts) { if (!seenBy(p) && !seenAt(fi, s.x, s.z)) { occupy(p, s, cat, true); return true; } return false; }
    releaseSpot(p); takeSpot(p, s); p.cat = cat; p.route = pts; p.ri = 0; p.goal = { kind: 'spot', s }; p.state = 'walk'; p.pose = 'walk'; p.waitT = 0;
    setCarry(p, cat);
    if (p.body.L.child && cat === 'play' && Math.random() < 0.5) p.hurry = 1.75; else p.hurry = 1;
    return true;
  }
  function occupy(p, s, cat, place) {
    const hour = hourNow(), day = dayNow();
    releaseSpot(p); takeSpot(p, s);
    p.cat = cat; p.state = 'spot'; p.route = null; p.goal = null; p.spotT = p.t; p.ball = null; p.circle = null;
    if (place) { p.x = s.x; p.z = s.z; p.y = s.pp.floor; p.yaw = s.pp.face; p.snap = 0; } else p.snap = 1;
    p.vx = p.vz = 0; p.spd = 0;
    p.pose = poseForSpot(p, s, hour, day);
    const stay = cat === 'cast' || cat === 'work' && p.kind === 'cast' ? 60 + Math.random() * 60 : stayFor(p, s, cat, hour);
    p.until = clockNow() + (place ? stay * (0.25 + 0.75 * Math.random()) : stay);
    p.minReal = 10 + Math.random() * 10;
    if (p.carry !== 'cane') p.carry = null;
    if (p.pose === 'play') setupPlay(p, s);
    if (p.pose === 'dance') { p.circle = { cx: s.x + Math.sin(s.pp.face) * 1.2, cz: s.z + Math.cos(s.pp.face) * 1.2, r: 1.2, a: Math.atan2(s.x - (s.x + Math.sin(s.pp.face) * 1.2), s.z - (s.z + Math.cos(s.pp.face) * 1.2)), w: 0.35 }; }
  }
  function setupPlay(p, s) {
    if (p.tag === 'run') p.circle = { cx: s.x, cz: s.z, r: 1.6 + p.r1 * 1.2, a: p.r2 * TAU, w: (2.2 + p.r3) / (1.6 + p.r1 * 1.2) * (p.r1 > 0.5 ? 1 : -1) };
    if (p.tag === 'catch') {
      // find another child at play nearby to throw with
      let mate = null;
      for (const o of p.fi.people) if (o !== p && o.state === 'spot' && o.pose === 'play' && o.body.L.child && !o.ball && Math.hypot(o.x - s.x, o.z - s.z) < 7 && Math.hypot(o.x - s.x, o.z - s.z) > 1.5) { mate = o; break; }
      if (mate) { const b = { holder: p, to: mate, hold: 0, holdT: 1.2, fly: 0, flyT: 1.0, from: [0, 0, 0], col: ITEM_COL.ball }; p.ball = b; mate.ball = b; mate.tag = 'catch'; mate.circle = null; }
      else p.tag = 'hop';
    }
  }
  function leaveSpot(p) {
    if (p.ball) { const b = p.ball; if (b.holder) b.holder.ball = null; if (b.to) b.to.ball = null; }
    p.circle = null; p.override = p.directed ? p.override : null; p.talking = 0;
    releaseSpot(p);
  }
  function goAway(p, toFi) {
    leaveSpot(p);
    const fi = p.fi; const portals = fi.portals;
    if (!portals.length || !player.frame || fi.frame !== player.frame) { vanish(p, toFi); return; }
    let best = null, bs = 1e9;
    for (let i = 0; i < Math.min(portals.length, 24); i++) {
      const n = portals[(Math.random() * portals.length) | 0];
      const d = Math.hypot(n.x - p.x, n.z - p.z) + (Math.hypot(n.x - eye.x, n.z - eye.z) < 14 ? 80 : 0);
      if (d < bs) { bs = d; best = n; }
    }
    const pts = best && planRoute(fi, p, best.x, best.y, best.z, best);
    if (!pts) { if (!seenBy(p)) vanish(p, toFi); else { p.state = 'idle'; p.idleT = 6; p.pose = 'stand'; } return; }
    p.route = pts; p.ri = 0; p.goal = { kind: 'away', fi: toFi || null }; p.state = 'walk'; p.pose = 'walk'; p.waitT = 0; p.hurry = 1;
    setCarry(p, 'away');
  }
  function vanish(p, toFi) {
    leaveSpot(p);
    p.state = 'away'; p.route = null;
    if (toFi && toFi !== p.fi) { moveToFrame(p, toFi); p.backAt = clockNow() + 2; return; }
    const h = hourNow();
    const night = h >= 23 || h < 6.4;
    p.backAt = clockNow() + (night ? (((6.5 - (h < 12 ? h : h - 24)) * 60) + Math.random() * 90) : 15 + Math.random() * 120);
    if (p.kind === 'crowd') p.backAt = clockNow() + 1e6;
  }
  function hiddenPortal(fi) {
    const portals = fi.portals;
    for (let i = 0; i < 16 && portals.length; i++) { const q = portals[(Math.random() * portals.length) | 0]; if (!seenAt(fi, q.x, q.z) || Math.hypot(q.x - eye.x, q.z - eye.z) > 45) return q; }
    return null;
  }
  function arrive(p) {
    // come in from a walkway end the player cannot see
    const fi = p.fi;
    const n = hiddenPortal(fi);
    if (!n) { p.backAt = clockNow() + 3 + Math.random() * 8; return; }
    p.x = n.x + (Math.random() - 0.5) * 0.6; p.y = n.y; p.z = n.z + (Math.random() - 0.5) * 0.6; p.state = 'idle'; p.idleT = 0; p.pose = 'stand';
    const nb = n.links[0] && n.links[0].to; if (nb) p.yaw = Math.atan2(nb.x - n.x, nb.z - n.z);
    p.cur.set(p.tgt); p.cur[CH.GROUND] = 1;
    think(p);
    if (p.state === 'idle') { p.state = 'away'; p.backAt = clockNow() + 20; }
  }
  // homes are private: only the people who live there go in
  function privateNode(n) { const P = n._place && PLACES[n._place]; return !!(P && P.kind === 'flat'); }
  function wander(p) {
    const fi = p.fi, nodes = fi.nav.nodes;
    leaveSpot(p);
    if (!nodes.length) { p.state = 'idle'; p.idleT = 8; p.pose = 'stand'; return; }
    for (let i = 0; i < 6; i++) {
      const n = nodes[(Math.random() * nodes.length) | 0];
      if (privateNode(n)) continue;
      const d = Math.hypot(n.x - p.x, n.z - p.z); if (d < 4 || d > 70) continue;
      const pts = planRoute(fi, p, n.x, n.y, n.z, n);
      if (pts) { p.route = pts; p.ri = 0; p.goal = { kind: 'node' }; p.state = 'walk'; p.pose = 'walk'; p.waitT = 0; p.hurry = 1; setCarry(p, 'wander'); return; }
    }
    p.state = 'idle'; p.idleT = 4 + Math.random() * 8; p.pose = 'stand';
  }

  // ------------------------------------------------------------------ moving
  const _nb = [];
  function neighbours(p, r) {
    _nb.length = 0; const G = M.grid;
    const ix0 = Math.floor((p.x - r) / 2), ix1 = Math.floor((p.x + r) / 2), iz0 = Math.floor((p.z - r) / 2), iz1 = Math.floor((p.z + r) / 2);
    for (let ix = ix0; ix <= ix1; ix++) for (let iz = iz0; iz <= iz1; iz++) { const a = G.get(ix * 92821 + iz); if (a) for (const o of a) if (o !== p) _nb.push(o); }
    return _nb;
  }
  function walkStep(p, dt, near) {
    const R = p.route; if (!R || p.ri >= R.length) { arrived(p); return; }
    const wp = R[p.ri];
    let ax = wp.x, az = wp.z;
    const prev = p.ri > 0 ? R[p.ri - 1] : null;
    if (!wp.last && prev) {
      const lx = wp.x - prev.x, lz = wp.z - prev.z, ll = Math.hypot(lx, lz);
      if (ll > 0.4) { const off = Math.min(0.55, (wp.w || 1.6) * 0.24) + p.side; ax += (-lz / ll) * off; az += (lx / ll) * off; }
    }
    const dx = ax - p.x, dz = az - p.z, d = Math.hypot(dx, dz);
    // reached it, or passed it
    let passed = false;
    if (prev && !wp.last) { const lx = wp.x - prev.x, lz = wp.z - prev.z; passed = ((p.x - wp.x) * lx + (p.z - wp.z) * lz) > 0 && d < 2.5; }
    if (d < (wp.last ? 0.22 : 0.7) || passed) { p.ri++; if (p.ri >= R.length) { arrived(p); } return; }
    let sp = p.walkSpd * (p.hurry || 1) * (0.85 + 0.15 * clamp(p.g, 0.3, 1));
    if (p.talkingToPlayer) sp = 0;
    if (wp.last && d < 1.4) sp *= 0.35 + 0.65 * d / 1.4;
    const nxt = R[p.ri + 1];
    if (prev && wp.zone !== prev.zone && d < 1.6) sp *= 0.72;          // a doorway: ease through it
    let ux = dx / (d || 1), uz = dz / (d || 1);
    let wx = ux * sp, wz = uz * sp;
    if (near) {
      // give way: to the player most of all, then to each other
      const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
      let slow = 1;
      const others = neighbours(p, 1.8);
      for (let i = -1; i < others.length; i++) {
        let ox, oz, ovx, ovz, rad, still;
        if (i < 0) { if (player.frame !== p.frame || Math.abs(player.pos.y - p.y) > 1.5) continue; ox = player.pos.x; oz = player.pos.z; ovx = player.vel.x; ovz = player.vel.z; rad = 0.95; still = Math.hypot(ovx, ovz) < 0.3; }
        else { const o = others[i]; if (Math.abs(o.y - p.y) > 1.5) continue; ox = o.x; oz = o.z; ovx = o.vx; ovz = o.vz; rad = o.state === 'walk' ? 0.62 : 0.55; still = o.state !== 'walk'; }
        const rx = p.x - ox, rz = p.z - oz; if (rx > 2.2 || rx < -2.2 || rz > 2.2 || rz < -2.2) continue; const rd = Math.sqrt(rx * rx + rz * rz); if (rd < 1e-3 || rd > 2.2) continue;
        const ahead = -(rx * fx + rz * fz) / rd;
        if (rd < rad + 0.25) { wx += rx / rd * (rad + 0.25 - rd) * 3.2; wz += rz / rd * (rad + 0.25 - rd) * 3.2; }
        if (ahead > 0.35 && rd < 1.9) {
          // step to the right of them; if they are close in front and not moving out of the way, wait
          const side = ((-fz) * (-rx) + fx * (-rz)) > 0 ? -1 : 1;
          const k = (1.9 - rd) / 1.9 * sp * 1.15 * (i < 0 ? 1.4 : 1);
          wx += -fz * k * (side > 0 ? 1 : 0.6) * (side > 0 ? 1 : -1) * -1; wz += fx * k * (side > 0 ? 1 : 0.6) * (side > 0 ? 1 : -1) * -1;
          const closing = (ovx * fx + ovz * fz) < 0.4 * sp;
          if (rd < rad + 0.35 && (still || closing)) slow = Math.min(slow, clamp((rd - rad) / 0.35, 0.05, 1));
        }
      }
      wx *= slow; wz *= slow;
      if (slow < 0.3) { p.waitT += dt; if (p.waitT > 1.6) { p.side = clamp(p.side + (p.r1 > 0.5 ? 0.5 : -0.5), -0.9, 0.9); p.waitT = 0; } }
      else { p.waitT = Math.max(0, p.waitT - dt); p.side = damp(p.side, 0, 0.4, dt); }
    }
    const rate = near ? 5 : 20;
    p.vx = damp(p.vx, wx, rate, dt); p.vz = damp(p.vz, wz, rate, dt);
    p.x += p.vx * dt; p.z += p.vz * dt;
    p.spd = Math.hypot(p.vx, p.vz);
    if (p.spd > 0.08) { const ty = Math.atan2(p.vx, p.vz); p.yaw += wrapPi(ty - p.yaw) * (1 - Math.exp(-dt * 7)); }
    // height: along the link, and on the real floor when close enough to see
    let y = wp.y;
    if (prev) { const lx = wp.x - prev.x, lz = wp.z - prev.z, l2 = lx * lx + lz * lz; const t = l2 > 1e-6 ? clamp(((p.x - prev.x) * lx + (p.z - prev.z) * lz) / l2, 0, 1) : 1; y = prev.y + (wp.y - prev.y) * t; }
    else if (Math.abs(wp.y - p.y) < 0.6) y = p.y + (wp.y - p.y) * Math.min(1, dt * 3);
    if (near && ++p.gq % 3 === 0) { const gr = p.fi.col.ground(p.x, p.z, Math.max(y, p.y) + 0.45, 0.08); p.gy = gr && Math.abs(gr.y - y) < 1.0 ? gr.y - y : 0; }
    if (near && p.gy) y += p.gy;
    p.y = near ? damp(p.y, y, 18, dt) : y;
  }
  function arrived(p) {
    const g = p.goal; p.route = null;
    if (!g) { think(p); return; }
    if (g.kind === 'spot') { if (g.s.taken && g.s.taken !== p) { think(p); return; } occupy(p, g.s, p.cat, false); if (p.onArrive) { const f = p.onArrive; p.onArrive = null; f(true); } return; }
    if (g.kind === 'away') { if (seenBy(p) && Math.hypot(p.x - eye.x, p.z - eye.z) < 22) { p.state = 'idle'; p.idleT = 3; p.pose = 'stand'; p.goal = g; p.lingerAway = (p.lingerAway || 0) + 1; if (p.lingerAway < 6) return; } p.lingerAway = 0; vanish(p, g.fi); return; }
    if (g.kind === 'point') { p.state = 'idle'; p.idleT = 1e9; p.pose = p.directedPose || 'stand'; if (g.yaw !== undefined) p.faceYaw = g.yaw; if (p.onArrive) { const f = p.onArrive; p.onArrive = null; f(true); } return; }
    p.state = 'idle'; p.idleT = 2 + Math.random() * 7; p.pose = 'stand';
  }
  function atSpot(p, dt, near, now) {
    const s = p.spot;
    if (!s) { think(p); return; }
    if (p.snap > 0) {
      const k = 1 - Math.exp(-dt * 5); p.x += (s.x - p.x) * k; p.z += (s.z - p.z) * k; p.y += (s.pp.floor - p.y) * k;
      if (Math.hypot(s.x - p.x, s.z - p.z) < 0.02) p.snap = 0;
    }
    if (p.faceYaw === null && !p.circle && !p.talkingToPlayer) { const fy = s.pp.face; p.yaw += wrapPi(fy - p.yaw) * (1 - Math.exp(-dt * 4)); }
    p.spd = 0;
    // things that move about their spot
    if (p.circle) {
      const c = p.circle; c.a += c.w * dt;
      const tx = c.cx + Math.sin(c.a) * c.r, tz = c.cz + Math.cos(c.a) * c.r;
      const vx = (tx - p.x) / Math.max(dt, 1e-3), vz = (tz - p.z) / Math.max(dt, 1e-3);
      p.x = tx; p.z = tz; p.spd = p.pose === 'dance' ? 0 : Math.hypot(vx, vz);
      if (p.pose === 'dance') p.yaw = c.a + Math.PI / 2 * Math.sign(c.w) + Math.PI;
      else if (p.spd > 0.1) p.yaw = Math.atan2(vx, vz);
      if (p.pose === 'play') { p.override = 'walk'; }
    }
    if (p.ball && p.ball.holder === p) {
      const b = p.ball, o = b.to;
      if (o.state !== 'spot' || o.ball !== b) { p.ball = null; p.tag = 'hop'; }
      else {
        p.faceYaw = Math.atan2(o.x - p.x, o.z - p.z);
        if (b.fly <= 0) { b.hold += dt; if (b.hold >= b.holdT) { b.fly = 1e-4; bonePoint(p.bones, BONE.HA_R, 0, -0.1, 0.05, b.from); if (near && game.sfxAt) game.sfxAt('ball-throw', p.frame, p.x, p.y + 1, p.z, { vol: 0.5 }); } }
        else {
          b.fly += dt; const t = clamp(b.fly / b.flyT, 0, 1);
          const to = [0, 0, 0]; bonePoint(o.bones, BONE.HA_R, 0, -0.1, 0.05, to);
          const x = lerp(b.from[0], to[0], t), z = lerp(b.from[2], to[2], t), y = lerp(b.from[1], to[1], t) + 4 * 0.9 * t * (1 - t);
          b.pos = [x, y, z];
          if (t >= 1) { b.holder = o; b.to = p; b.hold = 0; b.fly = 0; b.holdT = 0.8 + Math.random() * 1.2; if (near && game.sfxAt) game.sfxAt('ball-catch', o.frame, o.x, o.y + 1, o.z, { vol: 0.5 }); }
        }
      }
    } else if (p.ball && p.ball.to === p) p.faceYaw = Math.atan2(p.ball.holder.x - p.x, p.ball.holder.z - p.z);
    if (p.faceYaw !== null && !p.circle && !p.talkingToPlayer) { const sitting = p.pose === 'sit' || p.pose === 'eat' || p.pose === 'sittalk'; if (!sitting) p.yaw += wrapPi(p.faceYaw - p.yaw) * (1 - Math.exp(-dt * 4)); }
    // conversations among neighbours
    if (near) social(p, dt);
    // time to go?
    if (p.directed) return;
    const pose = p.pose;
    if (pose === 'eat' && !isMeal(hourNow()) && now < p.until - 10) p.until = now + 5 + Math.random() * 10;
    if (s.pp.blocked) { leaveSpot(p); think(p); return; }
    if (now >= p.until && p.t - p.spotT > p.minReal) { if (p.kind === 'crowd' && p.pin) { p.until = now + 30; return; } leaveSpot(p); think(p); }
  }
  function social(p, dt) {
    const s = p.spot; if (!s) return;
    const pose = p.pose; if (pose !== 'talk' && pose !== 'sittalk' && pose !== 'eat' && pose !== 'drink' && pose !== 'stand' && pose !== 'queue' && pose !== 'customer' && pose !== 'clap') return;
    p.talkT -= dt;
    if (p.talkT <= 0 && !p.chatLock) {
      let mates = 0, talkingMate = null;
      for (const o of s.pp.nbr) { const q = o.taken; if (q && q !== p && q.state === 'spot') { mates++; if (q.talking) talkingMate = q; } }
      if (!mates) { p.talking = 0; p.lookAt = null; p.talkT = 4 + Math.random() * 6; return; }
      p.talking = !talkingMate && Math.random() < 1.4 / (mates + 1) ? 1 : 0;
      p.talkT = p.talking ? 2 + Math.random() * 4 : 2.5 + Math.random() * 5;
      if (talkingMate) p.lookAt = talkingMate;
      else { const cand = s.pp.nbr.filter((o) => o.taken && o.taken !== p && o.taken.state === 'spot'); p.lookAt = cand.length ? cand[(Math.random() * cand.length) | 0].taken : null; }
      if (p.talking && (pose === 'stand' || pose === 'queue')) p.pose = 'talk';
    }
  }
  // where a person looks: at the player passing close, at whoever is speaking, or about
  function look(p, dt) {
    let ly = null, lp = 0;
    const dx = eye.x - p.x, dz = eye.z - p.z, d = Math.hypot(dx, dz);
    // spoken to: turn to face the player (the seated just turn their heads)
    if (p.talkingToPlayer && !p.sit && d > 0.2) p.yaw += wrapPi(Math.atan2(dx, dz) - p.yaw) * (1 - Math.exp(-dt * 5));
    const headY = p.y + p.body.D.H * 0.93;
    if (p.talkingToPlayer || (d < 4.4 && d > 0.25 && player.frame === p.frame)) {
      const rel = wrapPi(Math.atan2(dx, dz) - p.yaw);
      if (p.talkingToPlayer || Math.abs(rel) < 1.85) {
        if (p.talkingToPlayer || p.glance > 0 || (p.lookCD <= 0 && Math.random() < dt * 2.5)) {
          if (p.glance <= 0 && !p.talkingToPlayer) {
            p.glance = 1.5 + Math.random() * 2.5;
            const standing = p.state === 'idle' || (p.state === 'spot' && (p.pose === 'stand' || p.pose === 'talk' || p.pose === 'play' || p.pose === 'queue'));
            if (standing && Math.random() < (p.body.L.child ? 0.35 : p.kind === 'cast' ? 0.2 : 0.06)) { p.tmpPose = 'wave'; p.tmpUntil = p.t + 1.8; }
          }
          ly = rel; lp = -Math.atan2(eye.y - headY, Math.max(d, 0.3)) * 0.8;
        }
      }
    }
    if (p.glance > 0) { p.glance -= dt; if (p.glance <= 0) p.lookCD = 4 + Math.random() * 6; }
    else p.lookCD -= dt;
    if (ly === null && p.lookAt && p.lookAt.frame === p.frame) {
      const o = p.lookAt; ly = wrapPi(Math.atan2(o.x - p.x, o.z - p.z) - p.yaw); lp = 0.05;
      if (Math.abs(ly) > 1.7) ly = Math.sign(ly) * 1.7;
    }
    if (ly === null) {
      p.lookT -= dt;
      if (p.lookT <= 0) { const wide = p.state === 'walk' ? 0.35 : p.sit ? 0.45 : 0.8; p.idleLook = (Math.random() - 0.5) * 2 * wide * (Math.random() < 0.4 ? 0 : 1); p.idleLookP = (Math.random() - 0.4) * 0.2; p.lookT = 2 + Math.random() * 5; }
      ly = p.idleLook || 0; lp = p.idleLookP || 0;
    }
    p.lookYaw = clamp(ly, -1.7, 1.7); p.lookPitch = lp;
  }

  // ------------------------------------------------------------------ settling a frame (start, arrival in a frame, a jump in time)
  function targetCount(fi) {
    let spots = 0; for (const s of fi.spots) if (!s.who && s.pp.cat !== 'bed') spots++;
    // each city block that is loaded brings its own people, up to what the machine can carry
    return Math.round(clamp((spots * 0.72 + fi.pathLen / 7.5) * M.density, 0, Math.min(1500, 900 + 200 * (fi.managed || 0))));
  }
  function populate(fi) {
    const want = M.cleared ? 0 : targetCount(fi);
    let anon = fi.people.filter((p) => p.kind === 'anon');
    while (anon.length < want) { const p = newPerson(fi, 'anon', hashStr(fi.id + ':' + M.nextId) ^ (M.nextId * 2654435761), null, null); anon.push(p); }
    if (anon.length > want) {
      anon.sort((a, b) => (a.state === 'away' ? 0 : 1) - (b.state === 'away' ? 0 : 1) || (seenBy(a) ? 1 : 0) - (seenBy(b) ? 1 : 0));
      for (let i = 0; i < anon.length - want; i++) removePerson(anon[i]);
    }
  }
  function settle(fi) {
    const now = clockNow(), hour = hourNow(), day = dayNow();
    for (const p of fi.people) { leaveSpot(p); p.route = null; p.goal = null; }
    for (const p of fi.people.slice()) settleOne(p, fi, now, hour, day, null);
  }
  // Put one person somewhere sensible for the hour. only: { spots, nodes } keeps them to one scope (a block that has just loaded).
  function settleOne(p, fi, now, hour, day, only) {
    {
      if (p.directed) return;
      if (p.kind === 'cast') {
        const plan = castPlan(p.castId, day, hour);
        const tg = plan && (castTarget(p, plan.place) || (plan.alt && castTarget(p, plan.alt)));
        if (!tg) { p.state = 'away'; p.backAt = now + 30; return; }
        if (tg.fi !== p.fi) { moveToFrame(p, tg.fi); }
        occupy(p, tg.s, plan.kind === 'work' ? 'work' : 'cast', true); snapPose(p); return;
      }
      if (p.kind === 'crowd') { const s = findSpot(M, p, null, p.pin); if (s) { occupy(p, s, 'magnet', true); snapPose(p); } return; }
      const mag = only ? null : activeMagnet(fi, day, hour, M.magnets);
      const Wt = wantsFor(p, hour, day, fi, mag);
      let tot = 0; for (const k in Wt) tot += Wt[k];
      if (M.rng.next() < Wt.away / (tot || 1)) { p.state = 'away'; p.backAt = now + Math.random() * (hour >= 23 || hour < 6.4 ? 400 : 60); return; }
      Wt.away = 0;
      let placed = false;
      for (let tries = 0; tries < 4 && !placed; tries++) {
        const cat = pickKey(M.rng, Wt);
        if (cat === 'wander') { placeOnPath(p, only && only.nodes); placed = true; break; }
        let s = null;
        if (only) { for (let k = 0; k < 10 && !s; k++) { const q = only.spots[(Math.random() * only.spots.length) | 0]; if (q && q.pp && q.pp.cat === cat && spotFree(q, p) && !q.pp.blocked && !(cat === 'play' && !p.body.L.child)) s = q; } }
        else s = cat === 'magnet' ? findSpot(M, p, null, mag.place) : findSpot(M, p, cat, null);
        if (s && !(seenAt(fi, s.x, s.z) && Math.hypot(s.x - eye.x, s.z - eye.z) < 2.5)) { occupy(p, s, cat, true); snapPose(p); placed = true; }
        else Wt[cat] = 0;
      }
      if (!placed) placeOnPath(p, only && only.nodes);
    }
  }
  function placeOnPath(p, among) {
    const nodes = among && among.length ? among : p.fi.nav.nodes;
    if (!nodes.length) { p.state = 'away'; p.backAt = clockNow() + 30; return; }
    for (let i = 0; i < 8; i++) {
      const n = nodes[(Math.random() * nodes.length) | 0]; if (!n.links.length || privateNode(n)) continue;
      const l = n.links[(Math.random() * n.links.length) | 0], t = Math.random();
      const x = lerp(n.x, l.to.x, t), z = lerp(n.z, l.to.z, t);
      if (Math.hypot(x - eye.x, z - eye.z) < 2 && p.frame === player.frame) continue;
      p.x = x; p.z = z; p.y = lerp(n.y, l.to.y, t); p.state = 'idle'; p.idleT = 0; p.yaw = Math.atan2(l.to.x - n.x, l.to.z - n.z);
      wander(p); snapPose(p); return;
    }
    p.state = 'away'; p.backAt = clockNow() + 20;
  }
  function snapPose(p) { p.g = p.frame.weight(p.y); p.items.length = 0; poseTarget(p, 0, p.tgt); p.cur.set(p.tgt); p.wasGround = p.cur[CH.GROUND] > 0.5; }

  // ------------------------------------------------------------------ setting up
  function init() {
    M.frames = indexWorld(game);
    M.spotCount = W.spots.length - W.managedSpots;
    for (const fi of M.frames.values()) populate(fi);
    // the named cast
    for (const id in CAST) {
      const c = CAST[id]; if (c.offstage) continue;
      const spec = Object.assign({}, c.look, { age: c.age, voice: c.voice });
      if (c.look && c.look.apron && !c.look.garment) spec.garment = c.age > 70 ? 'long' : 'short';
      // the cast start in the frame of their first place that exists
      let fi = null;
      for (const pl of [c.work, c.home, 'court']) { if (!pl) continue; for (const f of M.frames.values()) if (f.places.has(pl)) { fi = f; break; } if (fi) break; }
      if (!fi && game.params && game.params.peoplecast && player.frame) fi = M.frames.get(player.frame.id) || null;     // testing: everyone, wherever we are
      if (!fi) continue;
      const p = newPerson(fi, 'cast', hashStr(id), spec, id);
      M.cast.set(id, p);
      addTalk(p);
    }
    for (const fi of M.frames.values()) settle(fi);
    M.frameId = player.frame ? player.frame.id : null;
    M.ready = true;
    console.log('[people] ' + M.people.length + ' people in ' + M.frames.size + ' frames (' + [...M.frames.values()].map((f) => f.id + ' ' + f.people.length + ' / ' + f.spots.length + ' spots / ' + Math.round(f.pathLen) + ' m of walkway').join(', ') + ')');
  }
  function addTalk(p) {
    const id = p.castId, c = CAST[id];
    const pos = [0, 0, 0];
    p.interact = W.addInteract({
      frame: p.frame, radius: 2.2, kind: 'talk', prompt: 'Talk to ' + c.short, priority: 0.2,
      pos: () => { if (p.state === 'away' || p.lod > 1) return null; pos[0] = p.x; pos[1] = p.y + p.body.D.H * 0.82; pos[2] = p.z; return pos; },
      enabled: () => p.state !== 'away' && p.frame === player.frame,
      onUse: async () => {
        if (p.talkingToPlayer) return;
        p.talkingToPlayer = true; p.glance = 0;
        try {
          if (game.story && game.story.talk) await game.story.talk(id);
          else if (game.ui) {
            game.busy++;
            try { await game.ui.say(p.say, [c.line], { onChar: (ch) => voiceChar(p, ch) }); } finally { game.busy--; }
          }
        } catch (e) { console.error('[people] talk ' + id + ': ' + (e && e.stack ? e.stack : e)); }
        finally { p.talkingToPlayer = false; }
      },
    });
  }
  let vcN = 0;
  function voiceChar(p, ch) { if (!game.audio || !game.audio.voice) return; if (/[aeiouy]/i.test(ch) && (vcN++ % 2 === 0)) { try { game.audio.voice(p.voice, ch); } catch (e) { /* ignore */ } } }

  // ------------------------------------------------------------------ overheard talk
  const chat = { next: 4, active: null, recent: [], last: null };
  const FIXED = { day1: 1, day2: 1, day3: 1, morning: 1, midday: 1, evening: 1, night: 1, kids: 1, elders: 1, any: 1 };
  function chatterFor(a, b) {
    const zn = W.zoneAt(a.frame, a.x, a.y + 1, a.z);
    const keys = new Set(); if (zn) { if (zn.place) keys.add(zn.place); if (zn.id) keys.add(zn.id); const P = zn.place && PLACES[zn.place]; if (P && P.area) keys.add(P.area); }
    // where talk comes from: the place's own area if it has one; otherwise the frame's (Candlewick is one block of its frame;
    // the rest of the indoor city is 'city'; a landmark is known by its region's id)
    const P0 = zn && zn.place && PLACES[zn.place];
    if (!(P0 && P0.area)) keys.add(a.frame.id === 'station' ? 'station' : a.frame.id === 'hollow' ? 'hollow' : a.frame.id === 'candlewick' && Math.abs(a.x) < 106 && Math.abs(a.z) < 105 ? 'candlewick' : a.frame.city ? 'city' : a.frame.id);
    const rid = game.regions && game.regions.ofFrame ? game.regions.ofFrame(a.frame.id) : null; if (rid) keys.add(rid);
    const day = 'day' + dayNow(), part = game.clock.part();
    const kids = a.body.L.child || (b && b.body.L.child), elders = a.body.L.elder || (b && b.body.L.elder);
    const pool = [];
    for (const e of CHATTER) {
      let place = false, any = false, ok = true, score = 0;
      for (const t of e.tags) {
        if (t === 'any') { any = true; continue; }
        if (FIXED[t]) continue;
        if (keys.has(t)) { place = true; score += 2; }
      }
      const hasPlaceTag = e.tags.some((t) => !FIXED[t]);
      if (hasPlaceTag && !place) ok = false; if (!hasPlaceTag && !any) ok = ok && true;
      const days = e.tags.filter((t) => t.startsWith('day')); if (days.length && days.indexOf(day) < 0) ok = false; else if (days.length) score += 1;
      const parts = e.tags.filter((t) => t === 'morning' || t === 'midday' || t === 'evening' || t === 'night'); if (parts.length && parts.indexOf(part) < 0) ok = false; else if (parts.length) score += 1;
      if (e.tags.indexOf('kids') >= 0 && !kids) ok = false;
      if (e.tags.indexOf('elders') >= 0 && !elders) ok = false;
      if (!ok) continue;
      for (const ln of e.lines) {
        const two = Array.isArray(ln); if (two && !b) continue;
        const key = two ? ln[0] : ln; if (chat.recent.indexOf(key) >= 0 || key === chat.last) continue;
        pool.push({ ln, w: 1 + score });
      }
    }
    if (!pool.length) return null;
    let sum = 0; for (const q of pool) sum += q.w; let u = Math.random() * sum;
    for (const q of pool) { u -= q.w; if (u <= 0) return q.ln; }
    return pool[pool.length - 1].ln;
  }
  function anchorFor(p) {
    if (p.anchorFn) return p.anchorFn;
    const out = { x: 0, y: 0, visible: false, dist: 99 };
    p.anchorFn = () => {
      const f = p.frame;
      if (!f || f !== player.frame || p.state === 'away' || p.lod > 1) { out.visible = false; return out; }
      bonePoint(p.bones, BONE.HEAD, 0, 0.36, 0, _p);
      flatToRender(f, _p[0], _p[1], _p[2], W.anchor, _r);
      _v4.set(_r.x, _r.y, _r.z, 1).applyMatrix4(game.camera.matrixWorldInverse).applyMatrix4(game.camera.projectionMatrix);
      if (_v4.w <= 0.05) { out.visible = false; return out; }
      const nx = _v4.x / _v4.w, ny = _v4.y / _v4.w;
      out.x = (nx * 0.5 + 0.5) * window.innerWidth; out.y = (0.5 - ny * 0.5) * window.innerHeight;
      out.visible = Math.abs(nx) < 1.15 && Math.abs(ny) < 1.15;
      out.dist = Math.hypot(_p[0] - eye.x, _p[1] - eye.y, _p[2] - eye.z);
      return out;
    };
    return p.anchorFn;
  }
  function bubbleOff(p) { if (game.ui && p.bubbleOn) { game.ui.bubble('say:' + p.id, null); p.bubbleOn = false; } }
  function sayLine(p, text, dur) {
    if (game.ui) { game.ui.bubble('say:' + p.id, text, anchorFor(p)); p.bubbleOn = true; }
    p.talking = 1; p.chatLock = true;
    return { p, text, t: 0, dur, ci: 0 };
  }
  function updateChatter(dt, fi) {
    const c = chat;
    if (c.active) {
      const a = c.active, ln = a.cur;
      ln.t += dt;
      // a voice under the words
      const want = Math.floor(ln.t * 15);
      while (ln.ci < Math.min(want, ln.text.length)) { const ch = ln.text[ln.ci++]; if (game.audio && game.audio.voice && /[aeiouy]/i.test(ch) && ln.ci % 2 === 0 && Math.hypot(ln.p.x - eye.x, ln.p.z - eye.z) < 11) { try { game.audio.voice(ln.p.voice, ch); } catch (e) { /* ignore */ } } }
      if (ln.listener) ln.listener.lookAt = ln.p;
      if (ln.t >= ln.dur || ln.p.state === 'away' || ln.p.frame !== player.frame) {
        bubbleOff(ln.p); ln.p.talking = 0; ln.p.chatLock = false;
        if (a.queue.length && a.queue[0].p.state !== 'away') { const nx = a.queue.shift(); a.gap = 0.35; a.pending = nx; a.cur = { t: -1, dur: 0, text: '', p: ln.p, ci: 0 }; }
        else { if (a.listener) a.listener.chatLock = false; c.active = null; c.next = 5 + Math.random() * 9; }
      }
      if (a.pending) { a.gap -= dt; if (a.gap <= 0) { const nx = a.pending; a.pending = null; a.cur = sayLine(nx.p, nx.text, nx.dur); a.cur.listener = nx.listener; } }
      return;
    }
    c.next -= dt; if (c.next > 0) return;
    c.next = 2 + Math.random() * 3;
    // two people near the player who could be talking: a group, a table, or someone standing near someone
    const cands = [];
    for (const p of fi.people) {
      if (p.state !== 'spot' || p.lod > 0 || p.talkingToPlayer || p.kind === 'cast' && p.directed) continue;
      const d = Math.hypot(p.x - eye.x, p.z - eye.z); if (d > 11 || !seenBy(p)) continue;
      if (p.pose === 'perform' || p.pose === 'bed' || p.pose === 'read') continue;
      cands.push(p);
    }
    if (!cands.length) return;
    const a = cands[(Math.random() * cands.length) | 0];
    let b = null;
    if (a.spot) for (const o of a.spot.pp.nbr) if (o.taken && o.taken !== a && o.taken.state === 'spot' && !o.taken.talkingToPlayer) { b = o.taken; break; }
    if (!b) for (const o of cands) if (o !== a && Math.hypot(o.x - a.x, o.z - a.z) < 2.6) { b = o; break; }
    const ln = chatterFor(a, b); if (!ln) { c.next = 8; return; }
    const durOf = (t) => 1.7 + t.length / 13;
    chat.last = Array.isArray(ln) ? ln[0] : ln; chat.recent.push(chat.last); if (chat.recent.length > 18) chat.recent.shift();
    const act = { queue: [], listener: b, gap: 0, pending: null };
    if (Array.isArray(ln)) { act.cur = sayLine(a, ln[0], durOf(ln[0])); act.cur.listener = b; act.queue.push({ p: b, text: ln[1], dur: durOf(ln[1]), listener: a }); if (b) b.chatLock = true; }
    else { act.cur = sayLine(a, ln, durOf(ln)); act.cur.listener = b; }
    c.active = act;
  }
  // when a band plays, the people round it clap at the end of a tune
  let clapT = 30;
  function applause(dt, fi) {
    clapT -= dt; if (clapT > 0) return;
    clapT = 40 + Math.random() * 40;
    const band = fi.people.filter((p) => p.state === 'spot' && p.pose === 'perform' && Math.hypot(p.x - eye.x, p.z - eye.z) < 40);
    if (!band.length) return;
    const b0 = band[0]; let n = 0;
    for (const p of fi.people) {
      if (p.state !== 'spot' || p.pose === 'perform' || p.pose === 'eat' || p.pose === 'bed' || p.pose === 'work' || p.pose === 'counter') continue;
      if (Math.hypot(p.x - b0.x, p.z - b0.z) > 16) continue;
      p.tmpPose = 'clap'; p.tmpUntil = p.t + 2.5 + Math.random(); p.lookAt = b0; n++;
    }
    if (n && game.sfxAt) game.sfxAt('applause', b0.frame, b0.x, b0.y + 1.5, b0.z, { vol: Math.min(1, 0.3 + n * 0.05) });
  }
  // a name over a named person near the player
  let nameShown = null;
  function updateNames() {
    if (!game.ui) return;
    let best = null, bd = 3.6;
    for (const p of M.cast.values()) {
      if (p.frame !== player.frame || p.state === 'away' || p.lod > 0 || p.bubbleOn) continue;
      const d = Math.hypot(p.x - eye.x, p.z - eye.z); if (d < bd && seenBy(p)) { bd = d; best = p; }
    }
    if (best !== nameShown) {
      if (nameShown) game.ui.bubble('name:' + nameShown.id, null);
      if (best) game.ui.bubble('name:' + best.id, CAST[best.castId].short, anchorFor(best));
      nameShown = best;
    }
  }

  // ------------------------------------------------------------------ the frame loop
  let frameNo = 0, coarseT = 0, castT = 0;
  let errT = 0;
  function update(dt) {
    try { update1(dt); } catch (e) { errT -= dt; if (errT <= 0) { errT = 5; console.error('[people] ' + (e && e.stack ? e.stack : e)); } }
  }
  function update1(dt) {
    const t0 = performance.now();
    M.thinks = 0; M.thinkBy = t0 + 3.5;              // see tick(): at most a few milliseconds a frame go on choosing where to go next
    if (!player.frame) return;
    if (!M.ready) init();
    if (W.spots.length - W.managedSpots !== M.spotCount) { reindex(); }
    if (M.dirty.size) {
      const log = game.params && game.params.citylog;
      for (const f of M.dirty) {
        if (M.frames.get(f.id) !== f) continue;
        const a = log ? performance.now() : 0; refreshFrame(game, f); const b = log ? performance.now() : 0;
        if (!M.fill.some((j) => j.fi === f)) populate(f);
        if (log) console.log('[city] people, after a scope went from ' + f.id + ': walkways ' + (b - a).toFixed(0) + ' ms, people ' + (performance.now() - b).toFixed(0) + ' ms');
      }
      M.dirty.clear();
    }
    if (M.fill.length) fillSome();
    player.eyePos(eye);
    frameNo++;
    // the player's seat is nobody else's
    blockPlayerSeat();
    const pf = player.frame;
    const fi = M.frames.get(pf.id);
    if (M.frameId !== pf.id) { M.frameId = pf.id; if (fi) settle(fi); }
    const now = clockNow(), hour = hourNow();
    if (Math.abs(now - M.lastNow) > 20) { for (const f of M.frames.values()) settle(f); }
    M.lastNow = now;
    // minds
    const tm = performance.now();
    if (fi) {
      // a grid of everyone near, for giving way
      const G = M.grid; for (const a of G.values()) a.length = 0;
      for (const p of fi.people) { if (p.state === 'away') continue; const d = Math.abs(p.x - eye.x) + Math.abs(p.z - eye.z); p.near = d < 75; if (!p.near) continue; const k = Math.floor(p.x / 2) * 92821 + Math.floor(p.z / 2); let a = G.get(k); if (!a) G.set(k, a = []); a.push(p); }
      let walkers = 0;
      const arr = M.tickList; arr.length = 0; for (let i = 0; i < fi.people.length; i++) arr.push(fi.people[i]);
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i]; if (p.fi !== fi) continue;
        p.t += dt; p.tacc += dt;
        // the far and the still think less often
        const md = Math.abs(p.x - eye.x) + Math.abs(p.z - eye.z);
        const every = p.state === 'walk' ? (md < 40 ? 1 : 2) : p.state === 'away' ? 8 : md < 18 ? 1 : md < 50 ? 3 : 6;
        if (every > 1 && ((frameNo + p.slot) % every) !== 0) { if (p.state === 'walk') { p.x += p.vx * dt; p.z += p.vz * dt; } continue; }
        if (every > 1 && p.state === 'walk') { p.x -= p.vx * (p.tacc - dt); p.z -= p.vz * (p.tacc - dt); }
        p.g = p.frame.weight(p.y);
        tick(p, p.tacc, now); p.tacc = 0;
        if (p.state === 'walk') walkers++;
      }
      stats.walkers = walkers;
      updateChatter(dt, fi);
      applause(dt, fi);
      updateNames();
    }
    // other frames, coarsely: only the named cast move between them
    castT -= dt;
    if (castT <= 0) {
      castT = 4;
      for (const p of M.cast.values()) {
        if (p.directed || p.fi === fi) continue;
        if (p.state === 'away' && now >= p.backAt) { p.backAt = now + 10; const plan = castPlan(p.castId, dayNow(), hour); const tg = plan && (castTarget(p, plan.place) || (plan.alt && castTarget(p, plan.alt))); if (tg) { moveToFrame(p, tg.fi); if (tg.fi !== fi) occupy(p, tg.s, 'cast', true); else p.backAt = now; } }
      }
    }
    stats.msMind = stats.msMind * 0.9 + (performance.now() - tm) * 0.1;
    draw(dt, fi);
    stats.ms = stats.ms * 0.9 + (performance.now() - t0) * 0.1;
  }
  function tick(p, dt, now) {
    if (p.idleLookP === undefined) p.idleLookP = 0;
    switch (p.state) {
      case 'away': if (now >= p.backAt) { if (p.kind === 'cast') { thinkCast(p); if (p.state === 'away') p.backAt = now + 10; else if (p.state === 'walk') { /* came in */ } } else if (M.thinks < 2 || performance.now() < M.thinkBy) { M.thinks++; arrive(p); } } return;      // (within the frame's budget for making up minds)
      case 'walk': walkStep(p, dt, p.near); if (p.near) look(p, dt); return;
      case 'spot': atSpot(p, dt, p.near, now); if (p.near) look(p, dt); return;
      case 'idle': p.spd = 0; p.idleT -= dt; if (p.faceYaw !== null) p.yaw += wrapPi(p.faceYaw - p.yaw) * (1 - Math.exp(-dt * 4)); if (p.near) look(p, dt);
        if (p.idleT <= 0) {
          if (p.goal && p.goal.kind === 'away') arrived(p);
          else if (p.kind === 'cast' || M.thinks < 2 || performance.now() < M.thinkBy) { M.thinks++; think(p); }
          else p.idleT = 0.08 + Math.random() * 0.3;            // enough minds made up for one frame: this one waits a moment
        }
        return;
      default: think(p);
    }
  }
  function blockPlayerSeat() {
    const st = player.seat;
    if (M.blockedSpots) for (const s of M.blockedSpots) s.pp.blocked = false;
    M.blockedSpots = null;
    if (!st || !M.frames) return;
    const fi = M.frames.get(player.frame.id); if (!fi) return;
    M.blockedSpots = [];
    for (const s of fi.spots) if (Math.abs(s.x - st.x) < 0.45 && Math.abs(s.z - st.z) < 0.45 && Math.abs(s.y - st.y) < 0.8) { s.pp.blocked = true; M.blockedSpots.push(s); }
  }
  function reindex() {
    // places were (re)built: keep everyone, but re-read the world
    const old = M.frames;
    for (const p of M.people) { leaveSpot(p); }
    M.frames = indexWorld(game); M.spotCount = W.spots.length - W.managedSpots; M.dirty.clear(); M.fill.length = 0;
    for (const p of M.people) { const fi = M.frames.get(p.frame ? p.frame.id : ''); p.fi = fi || null; }
    for (const fi of M.frames.values()) fi.people = M.people.filter((p) => p.fi === fi);
    for (const p of M.people.slice()) if (!p.fi) removePerson(p);
    for (const fi of M.frames.values()) { populate(fi); settle(fi); }
    void old;
  }
  // A scope that manages itself (a city block) has finished building: read it in, and people it, without disturbing anyone else.
  function addScope(scope) {
    scope.live = true;
    if (!M.ready || !M.frames) return;
    const r = indexScope(game, M.frames, scope);
    let cx = 0, cz = 0; for (const n of r.nodes) { cx += n.x; cz += n.z; } if (r.nodes.length) { cx /= r.nodes.length; cz /= r.nodes.length; }
    // its spots are read in, and then its people come, a few a frame (see fillSome): nothing stops while a block is peopled
    M.fill.push({ fi: r.fi, scope, r, cx, cz, left: -1 });
  }
  function fillSome() {
    const job = M.fill[0], fi = job.fi;
    if (M.frames.get(fi.id) !== fi || !job.scope.live || !job.scope.active || M.cleared) { M.fill.shift(); return; }
    if (job.left < 0) {
      if (!indexSpots(game, job.r, 36)) return;
      let anon0 = 0; for (const p of fi.people) if (p.kind === 'anon') anon0++;
      job.left = job.r.spots.length || job.r.nodes.length ? Math.max(0, targetCount(fi) - anon0) : 0;
    }
    const want = targetCount(fi); let anon = 0; for (const p of fi.people) if (p.kind === 'anon') anon++;
    const now = clockNow(), hour = hourNow(), day = dayNow();
    for (let n = 0; n < 6 && anon < want && job.left > 0; n++) {
      const p = newPerson(fi, 'anon', hashStr(fi.id + ':' + M.nextId) ^ (M.nextId * 2654435761), null, null);
      p.x = job.cx; p.z = job.cz; p.y = 0; settleOne(p, fi, now, hour, day, job.r); anon++; job.left--;
    }
    if (anon >= want || job.left <= 0) M.fill.shift();
  }
  // ...and is about to go: nobody may be left standing in it, or walking toward it.
  function removeScope(scope) {
    scope.live = false;
    if (!M.ready || !M.frames) return;
    const fi = M.frames.get(scope.frame.id); if (!fi) return;
    // the scope's own zones: only somebody standing in one of them can be inside it (asking the world which zone every
    // person in the frame is in costs tens of milliseconds)
    const own = W.zones.filter((zn) => zn.scope === scope);
    const within = (p) => { const y = p.y + 0.6; for (const zn of own) if ((zn.allRound || (p.x >= zn.x0 && p.x <= zn.x1)) && y >= zn.y0 && y <= zn.y1 && p.z >= zn.z0 && p.z <= zn.z1) return true; return false; };
    for (const p of fi.people.slice()) {
      const sp = p.spot, inSpot = !!sp && (sp.scope === scope || !!(sp.pp && sp.pp.zone && sp.pp.zone.scope === scope));
      const onPath = !!p.route && p.route.some((w) => w.node && w.node.owner === scope);
      let inside = false; if (p.state !== 'away' && within(p)) { const zn = W.zoneAt(fi.frame, p.x, p.y + 0.6, p.z); inside = !!zn && zn.scope === scope; }
      if (!inSpot && !onPath && !inside) continue;
      if (p.kind === 'anon' && !p.directed && (inside || inSpot)) { removePerson(p); continue; }
      leaveSpot(p); p.route = null; p.goal = null; p.state = 'idle'; p.idleT = 0.5 + Math.random() * 4; p.pose = 'stand';
    }
    unindexScope(game, M.frames, scope);
    // a crowd called to a place that has just gone (spawnCrowd) goes with it
    for (const p of fi.people.slice()) if (p.kind === 'crowd' && p.pin && !fi.places.has(p.pin)) removePerson(p);
    M.dirty.add(fi);
  }

  // ------------------------------------------------------------------ drawing
  const near0 = [], near1 = [], far2 = [];
  function draw(dt, fi) {
    const tp = performance.now();
    const list = meshes.list;
    for (const pm of list) pm.count = 0;
    stats.parts = 0; stats.lod0 = stats.lod1 = stats.lod2 = 0;
    const pf = player.frame;
    origin[0] = Math.round(player.pos.x); origin[1] = Math.round(player.pos.y); origin[2] = Math.round(player.pos.z);
    near0.length = 0; near1.length = 0; far2.length = 0;
    if (fi) {
      const fx = Math.sin(player.yaw), fz = -Math.cos(player.yaw);
      for (const p of fi.people) {
        if (p.state === 'away') { p.lod = 3; continue; }
        if (!(p.x === p.x && p.z === p.z && p.y === p.y && p.yaw === p.yaw)) { leaveSpot(p); p.state = 'away'; p.backAt = clockNow() + 5; p.x = p.y = p.z = 0; p.yaw = 0; p.vx = p.vz = 0; p.lod = 3; continue; }
        const dx = p.x - eye.x, dz = p.z - eye.z, dy = p.y - eye.y;
        const d = Math.sqrt(dx * dx + dz * dz + dy * dy * 0.36); p.dist = d;
        const front = d < 7 || (dx * fx + dz * fz) / (d || 1) > 0.32 - Math.min(0.25, 3 / Math.max(d, 1));
        if (!front || d > LOD2) { p.lod = 3; continue; }
        const h0 = p.lod === 0 ? 2 : 0, h1 = p.lod === 1 ? 4 : 0;
        if (d < LOD0 + h0) near0.push(p); else if (d < LOD1 + h1) near1.push(p); else far2.push(p);
      }
      // keep within what the buffers hold: the nearest get the most detail
      const cap0 = CAP0, cap1 = CAP1, cap2 = 690;
      if (near0.length > cap0) { near0.sort((a, b) => a.dist - b.dist); while (near0.length > cap0) near1.push(near0.pop()); }
      if (near1.length > cap1) { near1.sort((a, b) => a.dist - b.dist); while (near1.length > cap1) far2.push(near1.pop()); }
      if (far2.length > cap2) { far2.sort((a, b) => a.dist - b.dist); far2.length = cap2; }
      const tq0 = performance.now();
      for (const p of near0) {
        const was = p.lod; p.lod = 0; p.adt += dt;
        if (!prof.noAnim && (was > 0 || p.dist < 9 || ((frameNo + p.slot) % (p.dist < 16 ? 2 : 3)) === 0)) { animate(p, p.adt, was > 1); p.adt = 0; } else shiftBones(p);
        if (!prof.noEmit) emitParts(list, p.bones, p.body.parts, p.sit, origin, stats, p.cur[CH.FLARE]); emitItems(p, list, meshes.byName, origin, stats);
        emitParts(list, p.bones, p.body.sh, false, origin, null);
        if (p.ball && p.ball.holder === p) {
          const b = p.ball, pm = meshes.byName.get('item-ball');
          if (b.fly > 0 && b.pos) emitOne(pm, ID3, 1, 1, 1, b.pos[0], b.pos[1], b.pos[2], b.col, origin);
          else { bonePoint(p.bones, BONE.HA_R, 0.0, -0.12, 0.06, _p); emitOne(pm, ID3, 1, 1, 1, _p[0], _p[1], _p[2], b.col, origin); }
        }
      }
      const tq1 = performance.now(); prof.l0 = (prof.l0 || 0) * 0.95 + (tq1 - tq0) * 0.05;
      for (const p of near1) {
        const was = p.lod; p.lod = 1; p.adt += dt;
        const key = p.override || (p.tmpUntil > p.t ? p.tmpPose : null) || p.pose, moving = p.state === 'walk' || p.circle !== null || p.pose === 'dance';
        const due = was > 1 || key !== p.poseKey || ((frameNo + p.slot) % (moving ? (p.dist < 50 ? 4 : 8) : 36)) === 0;
        if (due) { p.poseKey = key; animate(p, p.adt, was > 1 || !moving); p.adt = 0; } else shiftBones(p);
        emitParts(list, p.bones, p.body.l1, false, origin, stats);
        if (p.dist < SHADOW) emitParts(list, p.bones, p.body.sh, false, origin, null);
      }
      prof.l1 = (prof.l1 || 0) * 0.95 + (performance.now() - tq1) * 0.05;
      for (const p of far2) {
        p.lod = 2; eulerYXZ(p.yaw, 0, 0, _R);
        const L2 = p.body.l2, sitting = p.state === 'spot' && (p.pose === 'sit' || p.pose === 'eat' || p.pose === 'sittalk' || p.pose === 'drink' || p.pose === 'read' && p.seatH > 0.2);
        const bob = p.state === 'walk' ? Math.abs(Math.sin(p.t * 7.5)) * 0.03 : 0, k = sitting ? 0.72 : 1;
        emitOne(list[L2[0].pm], _R, L2[0].s[0], L2[0].s[1] * k, L2[0].s[2], p.x, p.y + bob, p.z, L2[0].c, origin);
        emitOne(list[L2[1].pm], _R, L2[1].s[0], L2[1].s[1], L2[1].s[2], p.x, p.y + bob + L2[1].y - (1 - k) * p.body.D.H, p.z, L2[1].c, origin);
        stats.parts += 2;
      }
      stats.lod0 = near0.length; stats.lod1 = near1.length; stats.lod2 = far2.length;
    }
    let tris = 0;
    for (const pm of list) {
      const m = pm.mesh;
      m.count = pm.count; m.userData.frame = pf; m.userData.hidden = pm.count === 0;
      if (pm.count) {
        const im = m.instanceMatrix; im.clearUpdateRanges(); im.addUpdateRange(0, pm.count * 16); im.needsUpdate = true;
        const ia = m.geometry.attributes.aInst; ia.clearUpdateRanges(); ia.addUpdateRange(0, pm.count * 4); ia.needsUpdate = true;
        tris += pm.tris * pm.count * (pm.mesh.userData.caster ? 3 : 1);
      }
    }
    stats.tris = tris; stats.drawn = near0.length + near1.length + far2.length;
    stats.people = M.people.length; let present = 0; for (const p of M.people) if (p.state !== 'away') present++; stats.present = present;
    stats.msDraw = stats.msDraw * 0.9 + (performance.now() - tp) * 0.1;
  }
  const prof = { pose: 0, damp: 0, solve: 0, emit: 0, n: 0 };
  function animate(p, dt, snap) {
    poseTarget(p, dt, p.tgt);
    const c = p.cur, t = p.tgt;
    const g = t[CH.GROUND] > 0.5;
    if (g !== p.wasGround) {
      // changing between standing (feet on the floor) and seated (pelvis at a height): keep the pelvis where it is
      if (!g) c[CH.RY] = p.bones[BONE.PELVIS * 12 + 10] - p.y; else c[CH.RY] = 0;
      c[CH.GROUND] = t[CH.GROUND]; p.wasGround = g;
    }
    const walking = p.pose === 'walk' || p.override === 'walk' || p.pose === 'dance' || (p.pose === 'play' && p.tag !== 'floor');
    const kf = snap ? 1 : 1 - Math.exp(-dt * (walking ? 16 : 7)), kr = snap ? 1 : 1 - Math.exp(-dt * 5), ky = g && !snap ? 1 - Math.exp(-dt * 12) : kr;
    for (let i = 0; i <= CH.RPITCH; i++) c[i] += (t[i] - c[i]) * kr;
    c[CH.RY] += (t[CH.RY] - c[CH.RY]) * (ky - kr) / (1 - kr || 1);
    for (let i = CH.RPITCH + 1; i < CH.GROUND; i++) c[i] += (t[i] - c[i]) * kf;
    solve(p, p.lod === 1);
    prof.n++;
  }

  // ------------------------------------------------------------------ the public face
  function resolveTarget(p, target) {
    if (!target) return null;
    if (typeof target === 'string') { const tg = castTarget(p, target) || (() => { for (const fi of M.frames.values()) { const cp = crowdPoints(M, fi, target); const s = cp.find((q) => !q.taken); if (s) return { fi, s }; } return null; })(); return tg ? { fi: tg.fi, s: tg.s } : null; }
    if (target.pp || target.type) { const fi = M.frames.get(target.frame.id); return fi ? { fi, s: target } : null; }
    const fid = target.frame ? (typeof target.frame === 'string' ? target.frame : target.frame.id) : p.frame.id;
    const fi = M.frames.get(fid); return fi ? { fi, pt: target } : null;
  }
  function handle(p) {
    if (p.api) return p.api;
    const api = p.api = {
      get id() { return p.id; }, get name() { return p.name; }, get frame() { return p.frame; },
      get x() { return p.x; }, get y() { return p.y; }, get z() { return p.z; }, get yaw() { return p.yaw; },
      get pos() { return [p.x, p.y, p.z]; }, get present() { return p.state !== 'away'; }, get state() { return p.state; }, get pose() { return p.override || p.pose; },
      say: p.say, colour: p.say.colour, person: p,
      head() { bonePoint(p.bones, BONE.HEAD, 0, 0.2, 0, _p); return [_p[0], _p[1], _p[2]]; },
      // walk to a spot, a place id, or { x, y, z, yaw, frame }; resolves true on arrival (false if there is no way)
      goTo(target, opts = {}) {
        const tg = resolveTarget(p, target);
        p.directed = true; p.directedPose = opts.pose || null;
        if (!tg) return Promise.resolve(false);
        return new Promise((res) => {
          if (p.onArrive) { const f = p.onArrive; p.onArrive = null; f(false); }
          p.onArrive = res;
          if (tg.fi !== p.fi || p.state === 'away') {
            moveToFrame(p, tg.fi);
            if (tg.s) { occupy(p, tg.s, 'cast', true); snapPose(p); } else { p.x = tg.pt.x; p.y = tg.pt.y || 0; p.z = tg.pt.z; p.state = 'idle'; p.idleT = 1e9; p.pose = p.directedPose || 'stand'; if (tg.pt.yaw !== undefined) { p.yaw = tg.pt.yaw; p.faceYaw = tg.pt.yaw; } snapPose(p); }
            p.onArrive = null; res(true); return;
          }
          leaveSpot(p);
          if (tg.s) { if (!goToSpot(p, tg.s, 'cast')) { occupy(p, tg.s, 'cast', true); snapPose(p); p.onArrive = null; res(true); } return; }
          const pt = tg.pt, pts = planRoute(p.fi, p, pt.x, pt.y || p.y, pt.z, null);
          if (!pts) { if (opts.teleport !== false) { p.x = pt.x; p.y = pt.y || p.y; p.z = pt.z; } p.state = 'idle'; p.idleT = 1e9; p.pose = p.directedPose || 'stand'; if (pt.yaw !== undefined) p.faceYaw = pt.yaw; p.onArrive = null; res(!!(opts.teleport !== false)); return; }
          p.route = pts; p.ri = 0; p.goal = { kind: 'point', yaw: pt.yaw }; p.state = 'walk'; p.pose = 'walk'; p.hurry = opts.hurry || 1;
        });
      },
      face(x, z) { p.faceYaw = Math.atan2(x - p.x, z - p.z); return api; },
      facePlayer() { return api.face(player.pos.x, player.pos.z); },
      setPose(name) { p.override = name || null; p.directedPose = name || null; return api; },
      release() { p.directed = false; p.override = null; p.directedPose = null; p.faceYaw = null; if (p.state === 'idle') p.idleT = 0; return api; },
      hide() { leaveSpot(p); p.state = 'away'; p.backAt = 1e12; p.directed = true; return api; },
    };
    return api;
  }
  const people = {
    update, addScope, removeScope, reindex() { if (M.ready) reindex(); },
    byId(id) { if (!M.ready && player.frame) init(); const p = M.cast.get(id) || M.people.find((q) => q.id === id); return p ? handle(p) : null; },
    count() { let n = 0; for (const p of M.people) if (p.state !== 'away') n++; return n; },
    setDensity(k) { M.density = clamp(+k || 0, 0, 2); M.cleared = false; if (M.ready) for (const fi of M.frames.values()) { const before = fi.people.length; populate(fi); if (fi.people.length > before) { for (const p of fi.people) if (p.state === 'away' && p.backAt === 0) p.backAt = clockNow() + Math.random() * 6; } } },
    spawnCrowd(frame, placeId, n) {
      if (!M.ready) init();
      const fid = typeof frame === 'string' ? frame : frame && frame.id; const fi = M.frames.get(fid); if (!fi) return [];
      const ids = [];
      for (let i = 0; i < (n || 20); i++) {
        const p = newPerson(fi, 'crowd', hashStr(placeId + ':' + M.nextId) ^ (M.nextId * 40503), null, null); p.pin = placeId;
        const s = findSpot(M, p, null, placeId); if (s) { occupy(p, s, 'magnet', true); p.until = 1e12; snapPose(p); } else { removePerson(p); break; }
        ids.push(p.id);
      }
      return ids;
    },
    clear() { for (const p of M.people.slice()) if (p.kind !== 'cast') removePerson(p); M.cleared = true; },
    stats, magnets: M.magnets, prof, meshes,
    // levels of detail: full figures to d0 metres (at most cap0 of them), reduced to d1, the simplest beyond
    setLod(d0, d1, cap0, cap1, shadow) { if (d0) LOD0 = d0; if (d1) LOD1 = d1; if (cap0) CAP0 = Math.min(cap0, 130); if (cap1) CAP1 = Math.min(cap1, 210); if (shadow) SHADOW = shadow; },
    get all() { return M.people; },
    // for tests and the story: put a named person somewhere now
    place(id, frame, x, y, z, yaw) { const p = M.cast.get(id); if (!p) return null; const fi = M.frames.get(typeof frame === 'string' ? frame : frame.id); if (!fi) return null; moveToFrame(p, fi); leaveSpot(p); p.x = x; p.y = y; p.z = z; p.yaw = yaw || 0; p.faceYaw = yaw || 0; p.state = 'idle'; p.idleT = 1e9; p.directed = true; p.pose = p.directedPose || 'stand'; snapPose(p); return handle(p); },
  };
  game.events.on('clock:jump', () => { M.lastNow = -1e9; });
  const lodFromQuality = () => { const q = game.settings && game.settings.get('quality'); const L = LOD_BY_QUALITY[q] || LOD_BY_QUALITY.high; LOD0 = L[0]; LOD1 = L[1]; CAP0 = L[2]; CAP1 = L[3]; SHADOW = L[4]; };
  lodFromQuality();
  game.events.on('settings', (e) => { if (e && e.key === 'quality') lodFromQuality(); });
  return people;
}
