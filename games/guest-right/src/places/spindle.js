// The Spindle: flying. By day only the netted hall at the back end is open (the sunline runs down the rest); on
// Booking night the line stays dark and the whole axis opens for the Long Flight: hundreds of thousands of people
// drifting down three kilometres of air with hand lamps. Also here: the lamp-painters' dawns, which recolour the sunline.
import * as THREE from 'three';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { DRUM } from '../core/drum.js';
import { clamp, lerp, smoothstep, hash2i, Rng, kelvin } from '../core/util.js';

const N_LAMPS = 1400;

export const place = {
  id: 'spindle', name: 'The Spindle', order: 55,
  build(game) {
    const W = game.world;
    // a frame for bookkeeping only (zones, sound): flat x wraps round a 75 m circle, y = 75 - distance from the axis
    const f = W.frame('spindle', 75, 0, 0); f.hollowView = true;
    for (const id of ['terrace1', 'terrace10', 'hub']) { const fr = W.frames.get(id); if (fr) fr.hollowView = true; }
    const s = W.scope('spindle', f);
    const zone = s.zoneBox({ id: 'spindle', place: 'spindle', box: [-300, -6, 0, 300, 80, DRUM.L], name: 'The Spindle', sub: 'no weight', ambience: 'spindle', reverb: 'open', headroom: 60, sun: true, sunPower: 34, far: 4200,
      env: { exposure: 1.0, autoKey: 0.17, autoMin: 0.02, autoMax: 7, bloom: 0.07, warmth: 0.1, contrast: 1.08, saturation: 1.1 } });
    zone.allRound = true;

    // ---- the flyers' lamps: small star-shaped glows, drifting toward the front
    const g = new Geo(new MeshBuf(64, 128));
    g.mat('plain', '#ffc27a'); g._mat[3] = 255; g._col[3] = 255;
    const q = (a, b, c, d) => g.quad(a, b, c, d, { uv: [0, 0, 1, 1] });
    const r = 1.6; q([-r, -r, 0], [r, -r, 0], [r, r, 0], [-r, r, 0]); q([0, -r, -r], [0, -r, r], [0, r, r], [0, r, -r]); q([-r, 0, -r], [r, 0, -r], [r, 0, r], [-r, 0, r]);
    const lamps = new THREE.InstancedMesh(g.buf.toGeometry(), W.fwdMats.glow, N_LAMPS); lamps.count = 0; lamps.renderOrder = 3;
    W.addRenderable(lamps, { frame: f, origin: [0, 0, 0], center: [0, 0, 0], radius: 10, far: 1e6, forward: true, always: true });
    const rng = new Rng(77); const L = [];
    for (let i = 0; i < N_LAMPS; i++) L.push({ z: rng.f(470, 3740), rho: Math.pow(rng.next(), 0.6) * 62, th: rng.f(0, 6.283), v: rng.f(0.8, 3.2), ph: rng.f(0, 6.283), w: rng.f(0.05, 0.3), s: rng.f(0.6, 1.5) });
    const M = new THREE.Matrix4(), P = new THREE.Vector3(), Q = new THREE.Quaternion(), S = new THREE.Vector3();

    const fly = game.fly = {
      active: false, long: false,
      // start({ long }): take off from the back gate. long = the Long Flight (the whole axis); otherwise the netted hall only.
      async start(o = {}) {
        if (fly.active) return; const p = game.player;
        const long = o.long !== undefined ? o.long : (game.clock.sun() < 0.14);
        fly.active = true; fly.long = long; fly.from = { frame: p.frame, x: p.pos.x, y: p.pos.y, z: p.pos.z, yaw: p.yaw };
        game.busy++;
        try { if (game.ui) await game.ui.fade(true, 0.5); } finally { game.busy--; }
        p.frame = f; p.startFlight({ x: 0, y: -58, z: 3736, vz: -2.2, maxRho: 72, z0: long ? 462 : 3452, z1: 3744 });
        if (game.audio) { fly.wind = game.audio.loop('wind', { vol: 0.5, param: 0 }); if (long) game.audio.music('long-flight', { fade: 4 }); }
        if (game.ui) { await game.ui.fade(false, 0.9); game.ui.banner(long ? 'The Long Flight' : 'The flying hall', long ? 'the whole Spindle, front to back' : 'inside the net'); }
        game.events.emit('fly:start', { long });
        // how to fly, the first two times (a touch screen has its own stick)
        if (game.ui && !(game.ui.touch && game.ui.touch.enabled) && (game.flags.fly_told || 0) < 2) {
          game.flags.fly_told = (game.flags.fly_told || 0) + 1;
          setTimeout(() => { if (fly.active && game.ui) game.ui.toast('W and S row you along your line of sight. Space lifts, C sinks, Shift pulls harder. E takes you back to the gate.', { kind: 'info', dur: 10 }); }, 4500);
        }
      },
      async stop() {
        if (!fly.active) return; const p = game.player; fly.active = false;
        game.busy++;
        try { if (game.ui) await game.ui.fade(true, 0.5); } finally { game.busy--; }
        if (fly.wind) { fly.wind.stop(0.5); fly.wind = null; } if (game.audio && fly.long) game.audio.music(null, { fade: 3 });
        p.endFlight(); const b = fly.from; const sp = game.spawns['flying-hall'];
        if (sp) p.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw || 0); else if (b) p.place(b.frame, b.x, b.y, b.z, b.yaw);
        if (game.ui) await game.ui.fade(false, 0.7);
        game.events.emit('fly:stop', { long: fly.long });
      },
    };
    // while flying: E goes back to the gate; the lamps drift; the wind follows your speed
    let promptOn = false;
    game.events.on('update', (dt) => {
      const p = game.player;
      if (fly.active && p.mode === 'fly') {
        if (game.ui && !game.busy && !promptOn) { promptOn = true; game.ui.prompt('Go back to the gate', 'E'); }
        if (game.input.use() && !game.busy) fly.stop();
        if (fly.wind) fly.wind.set({ param: clamp(p.fly.speed / 12, 0, 1), vol: 0.25 + 0.6 * clamp(p.fly.speed / 12, 0, 1) });
        if (fly.long && p.fly.p[2] < 520 && !game.flags.flew) { game.flags.flew = true; if (game.ui) game.ui.toast('The front gate. You have flown the Length of Chervil.', { kind: 'thread' }); }
      } else if (promptOn) { promptOn = false; if (game.ui) game.ui.prompt(null); }
      // lamps: only on the dark nights when the Spindle is open; a few stragglers on ordinary nights
      const night = game.clock.night(), booking = game.clock.day === 3 && game.clock.hours >= 21.8 || (game.clock.day === 4 && game.clock.hours < 5.5);
      const here = p.frame && (p.frame === f || p.frame.hollowView || p.frame.id === 'hollow');
      const want = !here || night < 0.5 ? 0 : booking ? N_LAMPS : 40;
      if (want === 0) { if (lamps.count) lamps.count = 0; return; }
      const t = game.time; const A = W.anchor; const o = lamps.userData.origin;
      // keep the numbers small: the mesh's origin rides with the eye along the axis
      o[0] = 0; o[1] = 0; o[2] = Math.round(A.z);
      let n = 0;
      for (let i = 0; i < want; i++) {
        const l = L[i]; l.z -= l.v * dt; if (l.z < 470) l.z += 3270;
        const rho = l.rho + Math.sin(t * l.w + l.ph) * 5, th = l.th + t * 0.01 * l.s;
        // flat coordinates of the spindle frame: x = theta * 75, y = 75 - rho
        P.set(th * 75, 75 - rho, l.z - o[2]); S.setScalar(l.s * (0.7 + 0.3 * Math.sin(t * 2.1 + l.ph)));
        M.compose(P, Q, S); lamps.setMatrixAt(n++, M);
      }
      lamps.count = n; lamps.instanceMatrix.needsUpdate = true;
    });
    s.finish();

    // ---- lamp-painting: the sunline's colour. An ordinary day is plain (warm, then white); Oona's dawn on Booking Day is played once.
    const dawn = (D, clock) => {
      const h = clock.hours, sun = Math.max(clock.sun(), 0.012);
      const t = clamp((h - 6) / 1.25, 0, 1.2);              // the painted part: the first hour and a quarter
      // the colours she composed: the brown-violet of the River, rose, gold, then ordinary morning
      const river = [0.34, 0.2, 0.42], rose = [1.0, 0.42, 0.46], gold = [1.25, 0.86, 0.34], white = kelvin(4200);
      for (let j = 0; j < 32; j++) {
        const az = j / 32 * 6.2832;
        const far = 0.5 - 0.5 * Math.cos(az);               // 0 on the near side (the watchers' own bank), 1 on the far bank overhead
        for (let i = 0; i < 64; i++) {
          const u = i / 63;                                  // 0 at the front end of the line, 1 at the back
          const tt = clamp(t - (1 - u) * 0.07, 0, 1.2);      // it arrives from the back wall and runs forward
          let c, k;
          if (tt < 0.16) { const a = tt / 0.16; c = river; k = 0.03 + 0.07 * a; }
          else if (tt < 0.4) { const a = smoothstep(0.16, 0.4, tt); c = [lerp(river[0], rose[0], a), lerp(river[1], rose[1], a), lerp(river[2], rose[2], a)]; k = lerp(0.1, 0.22, a); }
          else if (tt < 0.72) { const a = smoothstep(0.4, 0.5, tt); c = [lerp(rose[0], gold[0], a), lerp(rose[1], gold[1], a), lerp(rose[2], gold[2], a)]; k = lerp(0.22, 0.5, a) * lerp(0.04, 1, Math.pow(far, 1.6)); }     // the far bank gold, the near side still dark
          else { const a = smoothstep(0.72, 1.1, tt); c = [lerp(gold[0], white[0], a), lerp(gold[1], white[1], a), lerp(gold[2], white[2], a)]; k = lerp(0.5 * lerp(0.04, 1, Math.pow(far, 1.6)), Math.max(0.5, clock.sun()), a); }
          const q2 = (j * 64 + i) * 4; const m = k / sun;
          D[q2] = c[0] * m; D[q2 + 1] = c[1] * m; D[q2 + 2] = c[2] * m; D[q2 + 3] = 1;
        }
      }
      game.pipeline.sunTex.needsUpdate = true;
    };
    game.events.on('prerender', () => {
      if (!game.hollow) return;
      const c = game.clock; const painted = c.day === 3 && c.hours >= 5.9 && c.hours < 7.6;
      if (painted && game.hollow.sunTint !== dawn) { game.hollow.sunTint = dawn; game.hollow.inited = false; }
      else if (!painted && game.hollow.sunTint === dawn) { game.hollow.sunTint = null; game.hollow.inited = false; }
      // on Booking night the line stays dark (it would otherwise be dark anyway until six)
    });
    game.dawnProgress = () => clamp((game.clock.hours - 6) / 1.25, 0, 1);
    game.spawns.spindle = { frame: f, x: 0, y: 17, z: 3736, yaw: 0 };
  },
};
