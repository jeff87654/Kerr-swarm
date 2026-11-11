// The Glide: out to Sorrel and back. A landmark that is mostly a ride, and the second of the game's two views of the
// outside (the other is the Window).
//
// One sentence: you sit facing backwards in a small padded room full of water, the cradle lets go, your weight goes out
// of you in about a second, and through a deep port you watch the drum you left fall away among its ranks of drums,
// each wearing its ring of quay lights, under the radiator layer running away like a ceiling over the world.
//
//   1. The boarding hall (frame 'glide-quay', the rim, a full g): five docking hatches, the departures, the notices, the
//      berth hand, a model car, and a lift lobby with the cab berths (lm_glide_hall.js).
//   2. The car (frame 'glide-car', radius 200 km so nothing out there bends): six seats, the lamp, the board, the port
//      (lm_glide_car.js).
//   3. The field: the mid-raft at a two-hundredth, moved past the car as it falls (lm_glide_field.js).
//   4. The ride: the cradle, the release, about fifty seconds of coasting for the canon's 140, the catch at Sorrel, a
//      pause, the ride back, shorter, and the platform again.
import { buildHall, HALL, toast, find, sfx } from './lm_glide_hall.js';
import { buildCar, SEAT } from './lm_glide_car.js';
import { buildField, R, L } from './lm_glide_field.js';
import { clamp, smoother } from '../core/util.js';

const PI = Math.PI;
const W_RIM = 0.16;            // how fast the cradle turns the car round a drum, in game seconds (the rim's turn, hurried like the clock)
const ARM = 0.42;              // how far the cradle's arm swings the car's port toward the drum it is riding
const ENV_CAR = { exposure: 1.0, autoKey: 0.11, autoMin: 0.8, autoMax: 1.6, bloom: 0.2, contrast: 1.12, saturation: 1.12, warmth: 0.04, vignette: 0.4 };
const ENV_HALL = { exposure: 1.0, autoKey: 0.18, bloom: 0.05, warmth: 0.12, contrast: 1.08, saturation: 1.08 };
const LEGS = [
  { to: 'SORREL', from: 'CHERVIL', coast: 50, cradle: 7, back: false },
  { to: 'CHERVIL', from: 'SORREL', coast: 30, cradle: 5, back: true },
];

export const place = {
  id: 'lm-glide', name: 'The Glide', order: 10,
  region: 'glide',
  stops: [{ id: 'glide-quay', name: 'The Glide', sub: 'a car to Sorrel and back · 140 seconds each way · free', group: 'The stations', spawn: 'glide-quay', deck: 1, zd: 625 }],
  async build(game) {
    const W = game.world, t0 = performance.now();
    const tick = async () => { await new Promise(requestAnimationFrame); if (game.atlas && game.atlas.begin) game.atlas.begin('region:glide'); };

    // ---- the boarding hall
    const fq = W.frame('glide-quay', 3000, 0.02, 625);
    const sq = W.scope('lm-glide-hall', fq);
    const ride = (gm) => runRide(gm, place._ride);
    buildHall(game, sq, fq, ride);
    sq.zoneBox({ id: 'glide-hall', box: [HALL.X0, -0.5, HALL.Z0 - 0.2, HALL.X1, HALL.H, HALL.Z1], name: 'The Glide', sub: 'the boarding berths · Station Ring 2 · deck 1', ambience: 'station', reverb: 'station', env: ENV_HALL });
    let left = sq.finish(48); while (left) { await tick(); left = sq.finish(48); }
    await tick();

    // ---- the car and the field behind its port
    const fc = W.frame('glide-car', 200000, 0, 0);
    const sc = W.scope('lm-glide-car', fc);
    const car = buildCar(game, sc);
    await tick();
    const field = await buildField(sc, tick);
    sc.zoneBox({ id: 'glide-car', box: [-1.6, -0.5, -2.5, 1.6, 2.3, 2.8], name: 'A glide car', sub: 'between Chervil and Sorrel · six seats · 13 t of water a seat', ambience: 'glide', reverb: 'room', headroom: 2.15, env: ENV_CAR, far: 2600 });
    left = sc.finish(48); while (left) { await tick(); left = sc.finish(48); }

    // the ride's state, read every frame by the floating things and the field
    const st = { on: false, k0: 0, t: 0, eye: 1.2 };
    sc.every((dt) => {
      if (!st.on) return;
      st.t += dt;
      car.float(dt, st.k0, st.t);
      const p = game.player;
      if (p.seat && p.seat.glide === 'car') p.seat.eye = 1.2 + 0.035 * st.k0;     // you lift a little against the straps
    });
    place._ride = { fq, fc, car, field, st, sq, sc };
    // test hooks for the shot tools: sit in the car and put the field at any point of the outbound leg (0..1)
    place.test = {
      sit(gm) { gm.player.place(fc, SEAT.x, 0, SEAT.z, PI, 0); gm.player.sit({ x: SEAT.x, y: 0, z: SEAT.z + 0.04, yaw: 0, eye: 1.2, glide: 'car' }); gm.player.yaw = PI; gm.player.pitch = 0.02; gm.player.gOverride = 0.001; gm.player.locked = true; },
      at(k, back) { field.swap(!!back); poseCoast(field, k); car.board('T + ' + Math.round(140 * k) + ' s', '174.4 m/s · weightless', (24.5 * k).toFixed(1) + ' km', 'of 24.5 · the car\'s own 140 s'); },
      cradle(k, back) { field.swap(!!back); poseCradle(field, k, 1); },
      caught(k, back) { field.swap(!!back); poseCatch(field, k * 9, 1); car.board('SORREL', 'Ring Two · doors on the far side', '1.02 g', 'not this time: back to Chervil'); },
      field,
    };

    game.spawns['glide-quay'] = { frame: fq, x: HALL.LX0 + 2.6, y: 0, z: 0, yaw: PI / 2 };
    game.spawns['glide-hatch'] = { frame: fq, x: 0, y: 0, z: HALL.Z0 + 1.9, yaw: PI };
    game.spawns['glide-car'] = { frame: fc, x: SEAT.x, y: 0, z: SEAT.z, yaw: PI };
    console.log('[lm-glide] built in ' + (performance.now() - t0).toFixed(0) + ' ms; field ' + Math.round(field.tris) + ' triangles');
  },
};

// ---------------------------------------------------------------------------------------------------------------
// Where the car is: three ways of moving the field round it.
// The drum you leave stands at grid (-R, 0); the one that catches you at (-R, -L). The car falls along x = 0 toward -z,
// with its port looking +z (aft), so in grid terms the world it sees is everything behind it.
// ---------------------------------------------------------------------------------------------------------------
// On the cradle before release: riding round the drum you leave, the arm swinging the port toward it. u: 0..1 of the
// cradle phase, T its length. The car speeds up into the turn and meets the release at the rim's own rate.
function poseCradle(F, u, T) {
  const p = 1.8, phi0 = -(W_RIM * T) / p;          // so that dphi/dt at u = 1 is the rim's rate
  const phi = phi0 * (1 - Math.pow(u, p));
  const cx = -R + R * Math.cos(phi), cz = -R * Math.sin(phi);
  const arm = ARM * (1 - smoother(clamp((u - 0.45) / 0.55, 0, 1)));
  F.setPose(cx, cz, phi - arm);
}
// Coasting: k 0..1 of the way.
function poseCoast(F, k) { F.setPose(0, -L * k, 0); }
// Caught: riding round the drum that caught you, slowing into its berth. t: seconds since the catch.
function poseCatch(F, t, T) {
  const Tm = 7, u = clamp(t / Tm, 0, 1);
  const psi = W_RIM * Tm * (u - u * u / 2);
  const cx = -R + R * Math.cos(psi), cz = -L - R * Math.sin(psi);
  const arm = ARM * smoother(clamp(t / 2.4, 0, 1));
  F.setPose(cx, cz, psi - arm);
  void T;
}

// ---------------------------------------------------------------------------------------------------------------
// The ride
// ---------------------------------------------------------------------------------------------------------------
let riding = false;
function mmss(s) { s = Math.max(0, Math.round(s)); return s + ' s'; }

async function runRide(game, R0) {
  if (riding || game.busy || !R0) return;
  const { fq, fc, car, field, st, sc } = R0;
  const P = game.player, ui = game.ui;
  riding = true; game.busy++;
  // run fn(u, t, dt) every frame for T seconds of game time; stops early if the place is taken down
  const during = (T, fn) => new Promise((res) => {
    let t = 0;
    const off = game.events.on('update', (dt) => {
      if (!sc.active) { off(); res(); return; }
      t = Math.min(T, t + dt * (place.testSpeed || 1));
      try { fn(t / T, t, dt); } catch (e) { console.error('[lm-glide] ' + (e && e.stack ? e.stack : e)); }
      if (t >= T) { off(); res(); }
    });
  });
  const sit = () => { P.place(fc, SEAT.x, 0, SEAT.z, PI, 0); P.sit({ x: SEAT.x, y: 0, z: SEAT.z + 0.04, yaw: 0, eye: 1.2, glide: 'car' }); P.locked = true; P.yaw = PI; P.pitch = 0.02; };
  const G0 = 1.02, GZ = 0.001;
  try {
    sfx(game, 'hatch', fq, 0, 1.2, HALL.Z0);
    if (ui) { ui.hud.thread(null); await ui.fade(true, 0.5); }
    sit(); P.gOverride = G0; car.reset();
    st.on = true; st.t = 0; st.k0 = 0;
    for (let leg = 0; leg < LEGS.length; leg++) {
      const Lg = LEGS[leg];
      field.swap(Lg.back);
      poseCradle(field, 0, Lg.cradle);
      car.board('SEALED', 'on the cradle · ' + Lg.from + ' · the quay', 'RELEASE IN ' + Lg.cradle + ' s', 'to ' + Lg.to.toLowerCase() + ' · 140 s');
      if (ui) await ui.fade(false, 0.7);
      if (game.audio) game.sfx('clunk');
      if (leg === 0) toast(game, 'The harness clicks shut over your shoulders. The cradle carries the car round the quay toward the touch point, at the rim\'s own 174 metres a second.', 7);
      // ---- the cradle: a countdown at weight
      await during(Lg.cradle, (u, t) => {
        poseCradle(field, u, Lg.cradle);
        P.gOverride = G0;
        car.board(Lg.cradle - t > 0.05 ? 'RELEASE IN ' + Math.ceil(Lg.cradle - t - 0.001) : 'RELEASE', 'on the cradle · the quay · ' + G0.toFixed(2) + ' g', Lg.to, '174.4 m/s');
      });
      // ---- release: weight goes out of you in about a second
      if (game.audio) game.sfx('glide-release');
      if (leg === 0) find(game, 'glide');
      await during(1.1, (u) => {
        const k = smoother(u);
        P.gOverride = Math.max(GZ, G0 * (1 - k));
        st.k0 = k;
        poseCoast(field, 0);
        car.board('RELEASE', 'weight ' + Math.max(0, G0 * (1 - k)).toFixed(2) + ' g', Lg.to, '174.4 m/s');
      });
      P.gOverride = GZ; st.k0 = 1;
      if (leg === 0) toast(game, 'The cradle lets go, and your weight goes out of you in about a second. The strap ends of the empty seats lift off the cushions and stay up.', 7);
      // ---- the coast: the canon's 140 seconds, counted on the board, in fewer of the game's
      const notes = leg === 0 ? [
        [0.16, 'Behind the car Chervil falls away: a wall of dark six kilometres across, with two hundred million people inside it.'],
        [0.4, 'Every drum wears a ring of quay lights round its waist. The drums stand in rows 24.5 km apart, so the rings go back rank behind rank to a vanishing point.'],
        [0.64, 'Overhead the radiator layer runs away like a ceiling over the world. Under the car, the rectennas. Nobody goes there, and nobody looks.'],
        [0.9, 'Sorrel\'s quay is coming round to meet you. Its lights are a different colour: green-white, where Chervil\'s are gold.'],
      ] : [[0.5, 'Going home the view runs the other way about: Sorrel falls behind, and at the very end Chervil\'s gold comes round to meet you.']];
      let ni = 0;
      await during(Lg.coast, (u) => {
        poseCoast(field, u);
        P.gOverride = GZ;
        const ts = 140 * u, km = 24.5 * u;
        car.board('T + ' + mmss(ts), '174.4 m/s · weightless', km.toFixed(1) + ' km', 'of 24.5 · the car\'s own 140 s');
        if (ni < notes.length && u >= notes[ni][0]) { toast(game, notes[ni][1], 8); ni++; }
      });
      // ---- the catch: the soft arm, your weight back over a second or two, a jolt
      if (game.audio) game.sfx('glide-catch');
      car.kick(-2.5);
      await during(2.2, (u, t) => {
        // a little over a full g for a moment as the arm takes up the car, then the quay's own
        const k = smoother(clamp(t / 1.5, 0, 1));
        P.gOverride = Math.max(GZ, k * G0 + 0.24 * Math.sin(PI * clamp(t / 1.2, 0, 1)));
        st.k0 = 1 - k;
        P.roll = 0.045 * Math.exp(-t * 2.2) * Math.sin(t * 13);
        P.pitch = 0.02 - 0.03 * Math.exp(-t * 3) * Math.sin(t * 9);
        poseCatch(field, t, 7);
        car.board('CATCH', 'the cradle has you · ' + (P.gOverride).toFixed(2) + ' g', Lg.to, '');
      });
      P.roll = 0; P.gOverride = G0; st.k0 = 0;
      if (leg === 0) { find(game, 'catch'); toast(game, 'The catch. The soft arm takes the car and your weight comes back over a second or two, with a little extra at the start. The old say the catch is a young people\'s ride.', 8); }
      // ---- the pause at the far quay
      const pause = leg === 0 ? 7 : 3;
      await during(pause, (u, t) => {
        poseCatch(field, 2.2 + t, 7);
        if (leg === 0) car.board('SORREL', 'Ring Two · doors on the far side', G0.toFixed(2) + ' g', 'not this time: back to Chervil');
        else car.board('CHERVIL', 'Station Ring 2 · the berths', G0.toFixed(2) + ' g', 'doors open · welcome back');
      });
      if (leg === 0) {
        toast(game, 'The doors on the far side open onto Sorrel\'s Ring Two and close again. Nobody gets on. The cradle carries the car round to the lane home.', 7);
        if (ui) await ui.fade(true, 0.6);
      }
    }
    game.flags.rode_glide = true;
    if (game.story && game.story.persist) game.story.persist();
    game.events.emit('glide:done');
  } catch (e) {
    console.error('[lm-glide] ride: ' + (e && e.stack ? e.stack : e));
  } finally {
    st.on = false; st.k0 = 0;
    P.gOverride = null; P.roll = 0; P.locked = false; P.stand();
    try { car.reset(); } catch (e) { /* gone */ }
    if (ui) { try { await ui.fade(true, 0.5); } catch (e) { /* no ui */ } }
    const sp = game.spawns['glide-hatch'];
    if (sp) P.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw, 0);
    sfx(game, 'hatch', fq, 0, 1.2, HALL.Z0);
    if (ui) { ui.fade(false, 0.8); ui.hud.thread(game.journal && game.journal.current ? game.journal.current() : null); }
    riding = false; game.busy--;
  }
  if (game.flags.rode_glide && ui) toast(game, 'Out to Sorrel and back in a few minutes, and nobody asked you for anything. That is the Glide.', 6);
}
