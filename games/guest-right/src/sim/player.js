// The player: a body in a frame's flat space with the drum's real physics (weight by radius, heavier going spinward,
// Coriolis on anything in the air), and the first-person camera that rides on it.
import * as THREE from 'three';
import { DRUM, freeAccel } from '../core/drum.js';
import { clamp, damp, lerp } from '../core/util.js';

const _acc = [0, 0], _mv = { x: 0, y: 0 }, _lk = { x: 0, y: 0 }, _g = { y: 0, surf: null };

export class Player {
  constructor(game) {
    this.game = game;
    this.frame = null;
    this.pos = { x: 0, y: 0, z: 0 };       // feet, flat coordinates of this.frame
    this.vel = { x: 0, y: 0, z: 0 };
    this.yaw = 0; this.pitch = 0;          // yaw 0 looks toward the front cap (-z); positive turns right (toward spinward)
    this.radius = 0.27; this.height = 1.74; this.eye = 1.6;
    this.onGround = true; this.surf = 'stone';
    this.locked = false;                   // scripted moments freeze the controls
    this.mode = 'walk';
    this.eyeY = 0; this.bob = 0; this.bobAmp = 0; this.dip = 0; this.dipV = 0; this.fovKick = 0;
    this.stepPhase = 0;
    this.gNow = 1;
    this.seat = null;                      // { x, y, z, yaw } when sitting
    this.camOffset = new THREE.Vector3();
    this.roll = 0;
  }
  place(frame, x, y, z, yaw, pitch) {
    this.frame = frame; this.pos.x = x; this.pos.y = y; this.pos.z = z; this.vel.x = this.vel.y = this.vel.z = 0;
    if (yaw !== undefined) this.yaw = yaw; if (pitch !== undefined) this.pitch = pitch;
    this.eyeY = y + this.eye; this.onGround = true; this.seat = null;
    if (this.game.pipeline) this.game.pipeline.resetHistory();
  }
  forward(out) { out.x = Math.sin(this.yaw); out.y = 0; out.z = -Math.cos(this.yaw); return out; }

  // ---- flying (the Spindle): no floor, almost no weight. Position and velocity are kept in the drum's own Cartesian frame
  // (the axis is the z axis; x, y across it), orientation as a quaternion in that frame.
  startFlight(o) {
    this.mode = 'fly'; this.seat = null; this.onGround = false;
    this.fly = { p: [o.x, o.y, o.z], v: [o.vx || 0, o.vy || 0, o.vz || 0], q: new THREE.Quaternion(), maxRho: o.maxRho || 72, z0: o.z0, z1: o.z1, speed: 0 };
    // face along the axis toward the front, head toward the axis
    const m = new THREE.Matrix4(); const up = new THREE.Vector3(-o.x, -o.y, 0); if (up.lengthSq() < 1e-6) up.set(0, 1, 0); up.normalize();
    const fw = new THREE.Vector3(0, 0, -1), rt = new THREE.Vector3().crossVectors(fw, up).normalize(); up.crossVectors(rt, fw);
    m.makeBasis(rt, up, fw.clone().negate()); this.fly.q.setFromRotationMatrix(m);
    if (this.game.pipeline) this.game.pipeline.resetHistory();
  }
  endFlight() { this.mode = 'walk'; this.fly = null; this.roll = 0; }
  _fly(dt) {
    const game = this.game, input = game.input, F = this.fly, set = game.settings, W = DRUM.OMEGA;
    input.look(_lk, dt);
    const sens = 0.0022 * (set ? set.get('sensitivity') : 1);
    const q = F.q, qa = this._qa || (this._qa = new THREE.Quaternion()), ax = this._ax || (this._ax = new THREE.Vector3());
    const R = this._R || (this._R = new THREE.Vector3()), U = this._U || (this._U = new THREE.Vector3()), B = this._B || (this._B = new THREE.Vector3());
    R.set(1, 0, 0).applyQuaternion(q); U.set(0, 1, 0).applyQuaternion(q); B.set(0, 0, 1).applyQuaternion(q);
    if (!this.locked) {
      qa.setFromAxisAngle(U, -_lk.x * sens); q.premultiply(qa);
      qa.setFromAxisAngle(R, -_lk.y * sens * (set && set.get('invertY') ? -1 : 1)); q.premultiply(qa);
    }
    // ease the head toward the axis (so "up" is where the land is not), unless you are right on it
    const rho = Math.hypot(F.p[0], F.p[1]);
    if (rho > 4) {
      ax.set(-F.p[0] / rho, -F.p[1] / rho, 0);                    // toward the axis
      const fw = B.clone().negate(); const want = ax.clone().addScaledVector(fw, -ax.dot(fw));
      if (want.lengthSq() > 0.01) { want.normalize(); const err = Math.atan2(R.dot(want) * -1, U.dot(want)); qa.setFromAxisAngle(fw, -err * Math.min(1, dt * 1.2) * Math.min(1, (rho - 4) / 20)); q.premultiply(qa); }
    }
    q.normalize();
    R.set(1, 0, 0).applyQuaternion(q); U.set(0, 1, 0).applyQuaternion(q); B.set(0, 0, 1).applyQuaternion(q);
    // sleeves: you row the air. Forward is where you look.
    input.moveAxes(_mv);
    const thrust = input.run() ? 7 : 3.6; let tx = 0, ty = 0, tz = 0;
    if (!this.locked) {
      tx = (-B.x * _mv.y + R.x * _mv.x) * thrust; ty = (-B.y * _mv.y + R.y * _mv.x) * thrust; tz = (-B.z * _mv.y + R.z * _mv.x) * thrust;
      if (input.down('Space')) { tx += U.x * thrust * 0.8; ty += U.y * thrust * 0.8; tz += U.z * thrust * 0.8; }
      if (input.down('KeyC') || input.down('ControlLeft')) { tx -= U.x * thrust * 0.8; ty -= U.y * thrust * 0.8; tz -= U.z * thrust * 0.8; }
    }
    // the drum turns round you: a little centrifugal push outward, and Coriolis bends every crossing
    const v = F.v, pth = F.p;
    const axx = W * W * pth[0] + 2 * W * v[1] + tx, ayy = W * W * pth[1] - 2 * W * v[0] + ty;
    const drag = Math.exp(-dt / 2.6);
    v[0] = (v[0] + axx * dt) * drag; v[1] = (v[1] + ayy * dt) * drag; v[2] = (v[2] + tz * dt) * drag;
    pth[0] += v[0] * dt; pth[1] += v[1] * dt; pth[2] += v[2] * dt;
    // the net, and the gates at the ends
    const r2 = Math.hypot(pth[0], pth[1]);
    if (r2 > F.maxRho) { const k = F.maxRho / r2; const nx = pth[0] / r2, ny = pth[1] / r2; pth[0] *= k; pth[1] *= k; const vn = v[0] * nx + v[1] * ny; if (vn > 0) { v[0] -= vn * nx * 1.4; v[1] -= vn * ny * 1.4; } }
    if (pth[2] < F.z0) { pth[2] = F.z0; if (v[2] < 0) v[2] *= -0.3; } if (pth[2] > F.z1) { pth[2] = F.z1; if (v[2] > 0) v[2] *= -0.3; }
    F.speed = Math.hypot(v[0], v[1], v[2]);
    this.gNow = Math.max(0.001, W * W * r2 / DRUM.G0);
    // mirror into the flat frame so zones, the HUD and sound positions keep working
    const f = this.frame; const th = Math.atan2(pth[0], -pth[1]);
    this.pos.x = (th - f.theta0) * f.rho0; this.pos.y = f.rho0 - Math.max(r2, 0.01); this.pos.z = pth[2] - f.z0; this.eyeY = this.pos.y;
    this.fovKick = damp(this.fovKick, Math.min(1.6, F.speed / 9), 3, dt);
  }

  update(dt) {
    if (this.mode === 'fly') return this._fly(dt);
    const game = this.game, input = game.input, col = game.world.colliders(this.frame), f = this.frame;
    const set = game.settings;
    // --- look
    input.look(_lk, dt);
    if (!this.locked || this.seat) {
      const sens = 0.0022 * (set ? set.get('sensitivity') : 1);
      this.yaw += _lk.x * sens;
      this.pitch -= _lk.y * sens * (set && set.get('invertY') ? -1 : 1);
      this.pitch = clamp(this.pitch, -1.5, 1.5);
    }
    const g = this.gOverride || f.weight(this.pos.y, this.vel.x);          // in g, with the heavier-spinward term
    this.gNow = g;
    if (this.seat) { this._camera(dt, 0); return; }

    // --- wish velocity
    input.moveAxes(_mv);
    let mx = _mv.x, my = _mv.y;
    if (this.locked) { mx = 0; my = 0; }
    const run = input.run() && my > 0.1;
    const gk = 0.5 + 0.5 * Math.sqrt(clamp(g, 0.05, 1.2));
    const speed = (run ? 5.4 : 2.5) * gk * (this.speedScale || 1);
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw);
    const wx = (sy * my + cy * mx) * speed, wz = (-cy * my + sy * mx) * speed;
    const rate = this.onGround ? 11 : 1.6;
    this.vel.x = damp(this.vel.x, wx, rate, dt); this.vel.z = damp(this.vel.z, wz, rate, dt);

    // --- vertical: the drum's own gravity, and Coriolis while in the air
    freeAccel(f, this.pos.y, this.vel.x, this.vel.y, _acc);
    if (!this.onGround) { this.vel.x += _acc[0] * dt; this.vel.y += _acc[1] * dt; }
    if (this.onGround && input.jump() && !this.locked) { this.vel.y = 3.7; this.onGround = false; game.events.emit('player:jump'); }

    // --- move and collide
    const px = this.pos.x, pz = this.pos.z;
    col.move(this.pos, this.vel.x * dt, this.vel.z * dt, this.radius, this.height, this.onGround ? 0.42 : 0.2);
    // what we actually achieved (so walls stop us cleanly)
    if (dt > 0) { const ax = (this.pos.x - px) / dt, az = (this.pos.z - pz) / dt; if (Math.abs(ax) < Math.abs(this.vel.x)) this.vel.x = ax; if (Math.abs(az) < Math.abs(this.vel.z)) this.vel.z = az; }

    const gnd = col.ground(this.pos.x, this.pos.z, this.pos.y + (this.onGround ? 0.45 : 0.05), this.radius * 0.6, _g);
    if (this.onGround) {
      if (gnd && gnd.y >= this.pos.y - 0.4) { this.pos.y = gnd.y; this.vel.y = 0; this.surf = gnd.surf; }
      else { this.onGround = false; }
    } else {
      this.pos.y += this.vel.y * dt;
      const head = col.ceiling(this.pos.x, this.pos.z, this.pos.y + this.height - 0.3);
      if (this.pos.y + this.height > head && this.vel.y > 0) { this.pos.y = head - this.height; this.vel.y = 0; }
      if (gnd && this.vel.y <= 0 && this.pos.y <= gnd.y) {
        const impact = -this.vel.y;
        this.pos.y = gnd.y; this.vel.y = 0; this.onGround = true; this.surf = gnd.surf;
        this.dipV -= Math.min(impact * 0.5, 2.2);
        game.events.emit('player:land', { impact, surf: this.surf, g });
      }
      if (this.pos.y < -200) { this.pos.y = 2; this.vel.y = 0; }       // fell out of the world: put them back
    }
    this._camera(dt, Math.hypot(this.vel.x, this.vel.z));
  }

  _camera(dt, hs) {
    const game = this.game, set = game.settings;
    const bobOn = set ? set.get('headBob') : true;
    // step phase advances with distance; stride lengthens when you weigh less
    const stride = 1.5 + 1.2 * (1 - clamp(this.gNow, 0, 1));
    if (this.onGround && hs > 0.3 && !this.seat) {
      const before = this.stepPhase;
      this.stepPhase += hs * dt / stride * Math.PI * 2;
      if (Math.floor(before / Math.PI) !== Math.floor(this.stepPhase / Math.PI)) game.events.emit('player:step', { surf: this.surf, g: this.gNow, speed: hs });
      this.bobAmp = damp(this.bobAmp, 1, 8, dt);
    } else this.bobAmp = damp(this.bobAmp, 0, 6, dt);
    // landing dip (a damped spring)
    this.dipV += (-this.dip * 90 - this.dipV * 14) * dt; this.dip += this.dipV * dt;
    const amp = bobOn ? this.bobAmp : 0;
    const bobY = Math.sin(this.stepPhase * 2) * 0.028 * amp * (1 + 0.6 * (1 - clamp(this.gNow, 0, 1)));
    const bobX = Math.cos(this.stepPhase) * 0.018 * amp;
    const targetEye = (this.seat ? this.seat.y + (this.seat.eye || 1.12) : this.pos.y + this.eye);
    this.eyeY = this.seat ? damp(this.eyeY, targetEye, 6, dt) : (this.onGround ? damp(this.eyeY, targetEye, 22, dt) : targetEye);
    this.camOffset.set(Math.cos(this.yaw) * bobX, bobY + this.dip * 0.5, Math.sin(this.yaw) * bobX);
    const run = hs > 3.6;
    this.fovKick = damp(this.fovKick, run ? 1 : 0, 5, dt);
  }

  // The camera's drum coordinates (the render anchor) and orientation.
  applyCamera(camera, anchor) {
    if (this.mode === 'fly') {
      const F = this.fly, p = F.p; const rho = Math.max(Math.hypot(p[0], p[1]), 0.01), th = Math.atan2(p[0], -p[1]);
      anchor.theta = th; anchor.rho = rho; anchor.z = p[2];
      // the anchor's axes in the drum's frame: X = spinward tangent, Y = toward the axis, Z = along it
      const c = Math.cos(th), sn = Math.sin(th);
      const R = this._R.set(1, 0, 0).applyQuaternion(F.q), U = this._U.set(0, 1, 0).applyQuaternion(F.q), B = this._B.set(0, 0, 1).applyQuaternion(F.q);
      const e = camera.matrixWorld.elements; const put = (v, o) => { e[o] = v.x * c + v.y * sn; e[o + 1] = -v.x * sn + v.y * c; e[o + 2] = v.z; e[o + 3] = 0; };
      put(R, 0); put(U, 4); put(B, 8); e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
      const baseFov = this.game.settings ? this.game.settings.get('fov') : 75; camera.fov = baseFov + this.fovKick * 6;
      return;
    }
    const f = this.frame;
    const x = (this.seat ? this.seat.x : this.pos.x) + this.camOffset.x, z = (this.seat ? this.seat.z : this.pos.z) + this.camOffset.z, y = this.eyeY + this.camOffset.y;
    anchor.theta = f.theta(x); anchor.rho = f.rho(y); anchor.z = f.zd(z);
    const sy = Math.sin(this.yaw), cy = Math.cos(this.yaw), sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
    // forward f = (sy*cp, sp, -cy*cp); right r = (cy, 0, sy); up u = r x f
    const fx = sy * cp, fy = sp, fz = -cy * cp, rx = cy, rz = sy;
    let ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy;       // r x f = (ry*fz - rz*fy, rz*fx - rx*fz, rx*fy - ry*fx), ry = 0
    const e = camera.matrixWorld.elements;
    if (this.roll) { const c = Math.cos(this.roll), s = Math.sin(this.roll); const r2x = rx * c + ux * s, r2y = uy * s, r2z = rz * c + uz * s; ux = ux * c - rx * s; uy = uy * c; uz = uz * c - rz * s; e[0] = r2x; e[1] = r2y; e[2] = r2z; }
    else { e[0] = rx; e[1] = 0; e[2] = rz; }
    e[3] = 0; e[4] = ux; e[5] = uy; e[6] = uz; e[7] = 0; e[8] = -fx; e[9] = -fy; e[10] = -fz; e[11] = 0; e[12] = 0; e[13] = 0; e[14] = 0; e[15] = 1;
    const baseFov = this.game.settings ? this.game.settings.get('fov') : 75;
    camera.fov = (this.fovOverride || baseFov) + this.fovKick * 5;
  }
  // world position of the eye in flat coordinates
  eyePos(out) { out.x = this.seat ? this.seat.x : this.pos.x; out.y = this.eyeY; out.z = this.seat ? this.seat.z : this.pos.z; return out; }
  lookDir(out) { const cp = Math.cos(this.pitch); out.x = Math.sin(this.yaw) * cp; out.y = Math.sin(this.pitch); out.z = -Math.cos(this.yaw) * cp; return out; }
  sit(seat) { this.seat = seat; this.vel.x = this.vel.y = this.vel.z = 0; }
  stand() { if (this.seat) { this.seat = null; this.eyeY = this.pos.y + this.eye; } }
}
