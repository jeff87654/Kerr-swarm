// Ochre, Pigment Row: one shift with a back crew, behind the radiators (docs/wander-year.md, Day 226; ashgrove.md,
// Day four; raft-transport.md, Cyclers: "Behind a raft"). A closed sled on a service track between rows of panels, the
// plain of radiators running out to a horizon that is flat and has no end, and the River right across the sky over
// it, with other rafts as holes in it. Nobody works out here in a suit: the people are inside the sleds, the
// galleries and the dock, and what you see of them is their lamps.
//
// Axes are the kit's (kit/outside.js): x and z across the raft, y aft. Ochre's back axle is at x = 0, z = 0 and the
// plain is at y = RAFT.DEPTH; the River stands highest toward +x, which is the way the flight goes.
//
// Not canon:
// - Ochre's own Windows. The docs give Sorrel a dozen galleries and Carillon some; of Ochre they say only that a guest
//   may ride a shift. The ring of twelve round the dock here follows Sorrel's.
// - The look of the dock (a round housing with twelve berths), of a sled, and of the plain: panel rows 46 m wide,
//   tracks between them, rings of panels round each back axle, trunk pipes like spokes. The docs give the panels'
//   area and temperature, "panel rows", "a sled", "berths for the closed sleds" and "pipes as wide as rooms".
// - The raft creeping over the red star takes "most of an hour" by ashgrove.md. Here it takes about fifteen seconds.
// - How the River lies in Ochre's sky (highest about a quarter of the way up, to the flight's front) is chosen for the
//   picture; where it stands depends on where on Merrow's orbit you are.
import { Scene } from 'three';
import { makePath } from '../core/path.js';
import { instances } from '../kit/geo.js';
import { makeRng } from '../core/rng.js';
import { RAFT, buildSky, buildBack, backRig, skyDir, sledGeo, galleryGeo, dockGeo } from '../kit/outside.js';

const Y = RAFT.DEPTH;

export const ochreBackcrew = {
  id: 'ochre-backcrew',
  title: 'The River, from a sled', drum: 'Ochre', row: 'Pigment Row', kind: 'a steady drum', light: 33.1,
  line: 'Eight hours in a closed sled behind the radiators, holding a pump while Tilde swore at it. The River is brown-violet at the edges. The crews call that colour bruise.',
  tone: '#d9b48a', source: 'wander-year.md (Day 226), ashgrove.md (Day four)',
  sound: { root: 38, scale: 'dorian', pad: 0.6, air: 0.05, hum: 0.25, bells: 0.25, bright: 0.25 },
  *build(ctx) {
    const scene = new Scene(), rng = makeRng('ochre-shift');
    // the sky: a red star near the River's middle, and a raft about a degree wide beside it
    const STAR = [-6, 22.2];
    const sky = yield* buildSky(ctx, { apex: [0, 24], red: { at: STAR, power: 9 } });
    scene.add(sky.group);
    const creeper = sky.raft([STAR[0] - 1.25, STAR[1] + 0.1], 1.25, 0.62);
    yield 'sky';
    // work lamps the camera passes: two sleds at the start, a crew of three at a header, a Window, the dock
    const A = [-7462, 162], B = [-7230, 108], P = [-6480, 162];
    const rig = backRig({
      riverDir: skyDir(0, 24), riverPower: 0.1,
      lamps: [
        { p: [A[0] + 7, Y + 4.6, A[1]], color: '#ffe2b8', power: 1.8, reach: 16 }, { p: [A[0] + 1.2, Y + 1.6, A[1] + 6.6], color: '#ffb468', power: 1.2, reach: 6 },
        { p: [B[0] + 7, Y + 4.6, B[1]], color: '#ffe2b8', power: 1.8, reach: 16 },
        { p: [P[0], Y + 7, P[1] + 8], color: '#ffd9a8', power: 2.2, reach: 22 }, { p: [P[0] + 40, Y + 5, P[1] - 54], color: '#ffe2b8', power: 1.6, reach: 16 },
        { p: [-1100, Y + 5, 311], color: '#ff5038', power: 0.9, reach: 34 },
        { p: [-150, Y + 26, 0], color: '#ffe2b8', power: 3.2, reach: 60 }, { p: [-126, Y + 15, 0], color: '#fff0d8', power: 2, reach: 20 },
      ],
    });
    const back = yield* buildBack(ctx, { sky, rig, focus: [-0.15, 0] });
    scene.add(back.group);
    yield 'plain';

    // sleds: the ones lit above, a scatter of others along the way, and a few travelling
    const sled = sledGeo().build(), still = [], going = [], lamps = [];
    const put = (x, z, yaw, lit) => {
      still.push({ p: [x, Y, z], yaw });
      const c = Math.cos(yaw), s = Math.sin(yaw), at = (lx, ly, lz) => [x + lx * c + lz * s, Y + ly, z - lx * s + lz * c];
      for (const lz of [-1.9, 1.9]) lamps.push({ p: at(4.6, 4.7, lz), color: '#ffe9c8', power: lit ? 7 : 3.5, size: 0.7 });
      lamps.push({ p: at(-4.55, 4.45, 0), color: '#ffb060', power: 3, size: 0.5 });
      lamps.push({ p: at(1.2, 1.15, 6.55), color: '#ffb468', power: lit ? 4 : 2, size: 0.5 });
    };
    put(A[0], A[1], 0, true); put(B[0], B[1], 0, true);
    put(P[0] - 12, P[1], 0, true); put(P[0] + 40, P[1] - 54, Math.PI, true); put(P[0] + 64, P[1] + 54, 0, false);
    for (let i = 0; i < 46; i++) {
      const x = rng.f(-7300, -3300), z = Math.round(rng.f(-900, 1100) / 54) * 54;
      if (Math.abs(z - 162) < 60 && Math.abs(x + 7000) < 900) continue;      // keep the first stretch of the flight's own track clear
      put(x, z, rng.chance(0.5) ? 0 : Math.PI, false);
    }
    for (const m of instances(sled, back.lit, still)) back.group.add(m);
    for (let i = 0; i < 14; i++) {
      const x = rng.f(-7600, -3400), z = Math.round(rng.f(-500, 700) / 54) * 54, v = rng.sign() * rng.f(3, 7), loop = rng.f(70, 120);
      if (Math.abs(z - 162) < 30) continue;
      going.push({ p: [x, Y, z], yaw: v > 0 ? 0 : Math.PI, drift: [v, 0, 0, loop], phase: rng() });
      lamps.push({ p: [x + Math.sign(v) * 4.6, Y + 4.7, z], color: '#ffe9c8', power: 5, size: 0.8, move: [v, 0, 0], loop, phase: going[going.length - 1].phase });
    }
    for (const m of instances(sled, back.litDrift, going, { drift: true })) back.group.add(m);
    yield 'sleds';

    // the Windows: twelve long low galleries in a ring 600 m from the axle, each looking out over the plain
    const gal = [];
    for (let q = 0; q < 12; q++) { const a = ((15 + 30 * q) * Math.PI) / 180; gal.push({ p: [Math.cos(a) * 600, Y, Math.sin(a) * 600], yaw: Math.PI / 2 - a }); }
    for (const m of instances(galleryGeo().build(), back.lit, gal)) back.group.add(m);
    const GX = Math.cos((165 * Math.PI) / 180) * 600, GZ = Math.sin((165 * Math.PI) / 180) * 600;       // the one the flight passes
    rig.lamp(5, { p: [GX - 16, Y + 5, GZ + 4], color: '#ff5038', power: 0.9, reach: 34 });
    // the still side: the dock, with one berth standing open
    const dock = (yield* dockGeo({ open: 0 })).mesh(back.lit);
    dock.position.set(0, Y, 0);
    back.group.add(dock);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + 0.39; lamps.push({ p: [-113.6, Y + 15 + Math.cos(a) * 14.4, Math.sin(a) * 14.4], color: '#ffe2b0', power: 6, size: 1.2 }); }
    back.glow(lamps, { maxPx: 120, soft: 1.8 });
    yield 'dock';

    // the flight: low along a track past two sleds, up over a crew at a header, up to look at the River while a raft
    // creeps over the red star, down past a Window, and into the open berth
    // a look at the sky is a point 600 m off, the same order of distance as the things looked at: the curve through
    // the look points swings back on itself if one of them is twenty kilometres away and its neighbours are not
    const up = (p, bearing, elev) => { const d = skyDir(bearing, elev); return [p[0] + d.x * 600, p[1] + d.y * 600, p[2] + d.z * 600]; };
    const path = makePath([
      { t: 0, p: [-7600, Y + 6, 162] },
      { t: 5, p: [-7568, Y + 6.2, 162], look: [A[0], Y + 3, A[1]] },
      { t: 10, p: [-7502, Y + 8.6, 165], look: [A[0] + 6, Y + 3, A[1]] },
      { t: 13.5, p: [-7442, Y + 11.5, 160], look: [B[0], Y + 3, B[1]] },
      { t: 17, p: [-7340, Y + 13, 140], look: [B[0], Y + 3, B[1]] },
      { t: 21, p: [-7150, Y + 22, 150], look: [P[0], Y + 2, P[1]] },
      { t: 27, p: [-6570, Y + 30, 222], look: [P[0] + 18, Y + 3, P[1] - 12] },
      { t: 32, p: [-5600, Y + 120, 180], look: up([-5600, Y + 120, 180], -3, 9) },
      { t: 38, p: [-3900, Y + 230, 120], look: up([-3900, Y + 230, 120], -5.5, 14) },
      { t: 43.5, p: [-2300, Y + 170, 150], look: up([-2300, Y + 170, 150], -4, 6) },
      { t: 48, p: [-1250, Y + 48, 170], look: [GX, Y + 4, GZ] },
      { t: 51.5, p: [GX - 132, Y + 12, GZ + 5], look: [GX, Y + 4, GZ] },
      { t: 53.6, p: [GX + 20, Y + 24, GZ - 35], look: [-114, Y + 15, 0] },
      // the run in: the berth dead ahead for the last eleven seconds, slowing steadily from 85 m/s to the 10.35 m/s
      // an opening 9 m in radius is crossed at, and holding that from 63 on. The key at 64.2 is the opening itself,
      // just clear of the port's lip
      { t: 57, p: [-326, Y + 18.6, 44], look: [-110, Y + 15, 0] },
      { t: 60, p: [-193.5, Y + 15.6, 6.5], look: [-105, Y + 15, 0] },
      { t: 62, p: [-141.3, Y + 15.05, 0.5], look: [-100, Y + 15, 0] },
      { t: 63, p: [-127.02, Y + 15, 0], look: [-100, Y + 15, 0] },
      { t: 64.2, p: [-114.6, Y + 15, 0] },
      { t: 65, p: [-106.32, Y + 15, 0] },
    ], { up: [0, 1, 0], entryRadius: 5, exitRadius: 9, exitDir: [1, 0, 0], fov: 60 });
    return {
      scene, path, sky, back, near: 1.5, far: RAFT.FAR,
      look: { exposure: 3.4, bloom: 0.34, threshold: 0.7, vignette: 0.4, saturation: 1.12 },
      portal: { rim: false, mist: '#ffe2b0' },
      update(t) {
        // the raft's edge creeps over the star: about a degree in twenty seconds
        creeper.rotation.y = (-Math.min(Math.max((t - 22) / 20, 0), 1.2) * Math.PI) / 180;
      },
    };
  },
};
