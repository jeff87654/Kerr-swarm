// Herb Row: the glide from Sorrel to Lovage (docs/ashgrove.md, Day three; docs/raft-transport.md, The Glide).
// Out through the jacket in a short dark tunnel, round on the quay toward the lane's touch point, let go, and a fall
// in a straight line at 174 metres a second through the mid-raft: a dark hall nearly four kilometres deep, where what
// you see are lights. Then the catch at Lovage, and in through its jacket.
//
// How it is built. The world's own coordinates turn with the drums (once in 110 s), so the quay you stand on is still
// and the hall wheels round it, which is what a quay is. Their origin slides from Sorrel's axis to Lovage's during the
// fall. The flight is written in three parts, each in the frame it is simple in (Sorrel's quay, the lane, Lovage's
// quay), and turned into one path of half-second keys.
//
// Not canon:
// - The whole glide takes 140 s. The camera makes the crossing in about 26, overtaking the trains on its lane, and
//   looks where the picture is: back at Sorrel, across the rows, ahead at Lovage. A car's windows face aft only.
// - Each drum's quay lights have their own colour here (Sorrel amber, Lovage white). The docs give no colours.
// - The tunnels come down through the jacket at a slope and trains hang under the quay's band from cradles, since out
//   is down. The docs say only "a short dark tunnel" and "a cradle on the quay".
// - Lamps at a train's head and tail, lamp posts along the quay, truss lights in a lattice and on masts, and the
//   Yards' and data halls' places half a cell from the drums are this page's own.
// - A camera does not need a cradle: at Lovage it comes down beside the catch and goes straight in at a tunnel's mouth.
import { Scene, Group, Vector3 } from 'three';
import { makePath } from '../core/path.js';
import { smootherstep } from '../core/rng.js';
import { RAFT, LEVELS, QUAY_TINTS, buildHall, nearDrum, quayPiece, laneRibbon, nearTrains, laneNumber, trainSlots } from '../kit/outside.js';

const C = RAFT.CELL, OM = RAFT.OMEGA, V = RAFT.SPEED, RING = 6, Y0 = LEVELS[RING];
const T_GO = 20, T_JOIN = 45.5, T_CATCH = 54.5, T_END = 62.5;     // let go; join the arriving trains; the catch; the end

// turning about a drum's axis, the way drums turn
const turn = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
const pivot = (t) => C * smootherstep(T_GO + 2, T_JOIN - 1, t);
const toWorld = (h, t) => turn([h[0] - pivot(t), h[1], h[2]], -OM * (t - T_GO));                 // the hall's metres to the world's
const fromSorrel = (p, t) => turn(p, OM * (t - T_GO));                                            // Sorrel's own metres to the hall's
const fromLovage = (p, t) => { const q = turn(p, OM * (t - T_CATCH)); return [q[0] + C, q[1], q[2]]; };
const intoLovage = (h, t) => turn([h[0] - C, h[1], h[2]], -OM * (t - T_CATCH));

// a smooth curve through [t, [x, y, z]] keys; v0 and v1 are the velocities at its ends if they are known
function spline(keys, v0, v1) {
  const n = keys.length, m = [];
  const slope = (a, b) => [0, 1, 2].map((q) => (b[1][q] - a[1][q]) / (b[0] - a[0]));
  for (let i = 0; i < n; i++) {
    if (i === 0) m.push(v0 || slope(keys[0], keys[1]));
    else if (i === n - 1) m.push(v1 || slope(keys[n - 2], keys[n - 1]));
    else { const ha = keys[i][0] - keys[i - 1][0], hb = keys[i + 1][0] - keys[i][0], da = slope(keys[i - 1], keys[i]), db = slope(keys[i], keys[i + 1]); m.push([0, 1, 2].map((q) => (da[q] * hb + db[q] * ha) / (ha + hb))); }
  }
  return (t) => {
    let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
    const h = keys[i + 1][0] - keys[i][0], u = Math.min(Math.max((t - keys[i][0]) / h, 0), 1), u2 = u * u, u3 = u2 * u;
    const a = 2 * u3 - 3 * u2 + 1, b = (u3 - 2 * u2 + u) * h, c = -2 * u3 + 3 * u2, d = (u3 - u2) * h;
    return [0, 1, 2].map((q) => a * keys[i][1][q] + b * m[i][q] + c * keys[i + 1][1][q] + d * m[i + 1][q]);
  };
}
const rate = (f, t) => { const a = f(t - 0.01), b = f(t + 0.01); return [0, 1, 2].map((q) => (b[q] - a[q]) / 0.02); };

export const theGlide = {
  id: 'the-glide',
  // (the card does not say where the glide began: in the journey it follows a train out of Rue's station through its lock)
  title: 'The glide to Lovage', drum: 'The Glide', row: 'Herb Row', kind: 'between drums', light: 0.0,
  line: 'Two minutes and twenty seconds with no weight. Every drum wears rings of quay lights, and they go back rank behind rank until they are one line.',
  tone: '#ffb870', source: 'ashgrove.md (Day three), raft-transport.md (The Glide)',
  sound: { root: 43, scale: 'dorian', pad: 0.5, air: 0.1, hum: 0.5, bells: 0.1, bright: 0.3 },
  *build(ctx) {
    const scene = new Scene();
    const L0 = laneNumber(0, 0, 1, RING);                       // our lane: the +z side of Herb Row at Ring Seven, toward +x
    const hallGroup = new Group();
    const hall = yield* buildHall(ctx, { focus: [0.5, 0], skip: [[0, 0], [1, 0]], tints: { '0,0': 0, '1,0': 6 }, trainsNear: [500, 1300], skipLanes: [L0] });
    hallGroup.add(hall.group);
    scene.add(hallGroup);
    yield 'hall';

    // the two drums of the glide, each with the stretch of quay the camera is close to
    const arc = (x) => x / RAFT.QUAY;
    const sorrel = yield* nearDrum({ at: [0, 0], tint: QUAY_TINTS[0], dark: [{ level: RING, from: 0, to: arc(760) }, { level: RING, from: Math.PI * 2 + arc(-460), to: Math.PI * 2 }] });
    const lovage = yield* nearDrum({ at: [1, 0], tint: QUAY_TINTS[6], lamp: 90, band: 0.07, dark: [{ level: RING, from: 0, to: arc(520) }, { level: RING, from: Math.PI * 2 + arc(-640), to: Math.PI * 2 }] });
    scene.add(sorrel.group, lovage.group);
    yield 'drums';
    // which cradles hold a train: the ones whose slot on the lane comes by empty
    const slots = trainSlots(L0), slot0 = slots[0], full = (m) => slots.includes((((slot0 + m) % RAFT.SLOTS) + RAFT.SLOTS) % RAFT.SLOTS);
    const quayS = yield* quayPiece({ drum: sorrel, level: RING, angle: 0, from: -440, to: 740, tint: QUAY_TINTS[0], cradles: [-350, 0, 350, 700], trains: [-350, 350, 700].filter((x) => !full(x / 350)), tunnel: { x: -170, dir: -1, length: 175 } });
    yield 'quay';
    const quayL = yield* quayPiece({ drum: lovage, level: RING, angle: 0, from: -620, to: 500, tint: QUAY_TINTS[6], lamp: 6, light: 1.1, cradles: [-350, 0, 350], trains: [350], tunnel: { x: -170, dir: -1, length: 120 } });
    yield 'quay';
    // our own train hangs in its cradle until the touch point comes round
    const ours = quayS.hangTrain(0);

    // the lane we fall along keeps the flight's own time, so that our train's slot reaches the touch point on the second
    const clock = { value: 0 };
    const lane0 = { number: L0, origin: [0, Y0, RAFT.LANE], dir: [1, 0], clock, gate: (slot, s) => slot !== slot0 || s >= -1 };
    hallGroup.add(laneRibbon({ ...lane0, mid: C / 2, near: [500, 1300] }));
    const lanes = [lane0, { number: laneNumber(0, 0, 1, 8), origin: [0, LEVELS[8], RAFT.LANE], dir: [1, 0] }];
    for (const k of [5, 7]) { lanes.push({ number: laneNumber(1, 0, 1, k), origin: [RAFT.LANE, LEVELS[k], 0], dir: [0, -1] }); lanes.push({ number: laneNumber(1, 1, -1, k), origin: [C - RAFT.LANE, LEVELS[k], 0], dir: [0, 1] }); }
    const trains = nearTrains(lanes, { count: 72, range: 1700 });
    hallGroup.add(trains.mesh);
    yield 'trains';

    // ---- the flight, part one: Sorrel's quay (flat: x round the quay, y in from its face, z aft)
    const S = (x, y, z) => quayS.local(x, y, z).toArray(), tp = quayS.tunnelPoint;
    const posA = spline([
      [0, S(...tp(150))], [2.5, S(...tp(133))], [5, S(...tp(102))], [7.5, S(...tp(58))], [9.5, S(...tp(18))], [11.5, S(-128, -12, 3)],
      [14, S(-95, -60, 22)], [17, S(-80, -130, 50)], [T_GO, S(-90, -165, 70)],
    ], S(...tp(150)).map((q, i) => (S(...tp(149))[i] - q) * 5.75));
    const lookA = spline([
      [0, S(...tp(-150))], [7.5, S(...tp(-150))], [10, S(160, -34, 4)], [13, S(520, -20, 30)], [16.5, S(1400, 60, 150)], [T_GO, S(700, 300, 0)],
    ]);
    // ---- part two: the fall. Along the lane the camera runs ahead of the trains; (a, u, o) is where it is beside the
    // lane: metres ahead of that, aft of the lane's level, and out from the row
    const Tm = T_JOIN - T_GO, D = C - V * (T_CATCH - T_JOIN);
    const along = (t) => { const u = Math.min(Math.max((t - T_GO) / Tm, 0), 1); return V * (t - T_GO) + (D - V * Tm) * u * u * u * (u * (u * 6 - 15) + 10); };
    const a0 = fromSorrel(posA(T_GO), T_GO), va = rate((t) => fromSorrel(posA(t), t), T_GO - 0.011);
    const offB = spline([
      [T_GO, [a0[0], a0[1] - Y0, a0[2] - RAFT.LANE]], [T_GO + 5, [-60, 90, 140]], [T_GO + 11, [0, 190, 260]], [T_GO + 18, [0, 150, 200]], [T_JOIN - 3, [-30, 80, 90]], [T_JOIN, [-20, 50, 45]],
    ], [va[0] - V, va[1], va[2]]);
    const posB = (t) => { const o = offB(t); return [along(t) + o[0], Y0 + o[1], RAFT.LANE + o[2]]; };
    // what it looks at on the way: back at Sorrel, across the rows, ahead at Lovage. The things aimed at are from one
    // kilometre to ninety away, and a curve drawn through such points swings back on itself, so the curve is drawn
    // through the directions to them instead, and the look point kept within 3 km of the camera
    const aims = [
      [T_GO, fromSorrel(lookA(T_GO), T_GO)], [T_GO + 3.5, [600, Y0 - 300, 2200]], [T_GO + 8, [0, 1700, 0]], [T_GO + 11, [1000, 1500, -22000]], [T_GO + 14.5, [C * 0.55, 1300, -90000]],
      [T_GO + 18, [C + 4000, 1700, -30000]], [T_GO + 21.5, [C, 1900, 0]], [T_JOIN, fromLovage(quayL.local(-150, 0, 0).toArray(), T_JOIN)],
    ].map(([t, aim]) => { const p = posB(t), d = [aim[0] - p[0], aim[1] - p[1], aim[2] - p[2]], len = Math.hypot(d[0], d[1], d[2]); return { t, dir: d.map((q) => q / len), far: Math.min(len, 3000) }; });
    const aimDir = spline(aims.map((a) => [a.t, a.dir]));
    const lookB = (t) => {
      let i = 0; while (i < aims.length - 2 && t > aims[i + 1].t) i++;
      const u = Math.min(Math.max((t - aims[i].t) / (aims[i + 1].t - aims[i].t), 0), 1), far = aims[i].far + (aims[i + 1].far - aims[i].far) * u;
      const p = posB(t), d = aimDir(t), len = Math.hypot(d[0], d[1], d[2]);
      return [p[0] + (d[0] / len) * far, p[1] + (d[1] / len) * far, p[2] + (d[2] / len) * far];
    };
    // ---- part three: Lovage's quay. Down beside the catch and along under the band to a tunnel's mouth
    const Lq = (x, y, z) => quayL.local(x, y, z).toArray(), tq = quayL.tunnelPoint;
    const c0 = intoLovage(posB(T_JOIN), T_JOIN), vc = rate((t) => intoLovage(posB(t), t), T_JOIN - 0.011);
    const posC = spline([
      [T_JOIN, c0], [T_JOIN + 3, Lq(34, -215, 34)], [T_JOIN + 6, Lq(-22, -84, 20)], [T_CATCH, Lq(-62, -34, 11)], [56.5, Lq(-106, -18, 5)], [58, Lq(-150, -9.8, 1)],
      [58.8, Lq(...tq(0))], [59.6, Lq(...tq(16.1))], [60.5, Lq(...tq(27.03))], [T_END - 0.8, Lq(...tq(36))], [T_END, Lq(...tq(42))],
    ], vc, Lq(...tq(42)).map((q, i) => (q - Lq(...tq(41))[i]) * 7.475));
    const lookC = spline([[T_JOIN, intoLovage(lookB(T_JOIN), T_JOIN)], [T_JOIN + 4, Lq(...tq(40))], [58, Lq(...tq(70))], [T_END, Lq(...tq(110))]]);
    // ---- one path, in the world's own metres
    const posH = (t) => (t <= T_GO ? fromSorrel(posA(t), t) : t <= T_JOIN ? posB(t) : fromLovage(posC(t), t));
    const lookH = (t) => (t <= T_GO ? fromSorrel(lookA(t), t) : t <= T_JOIN ? lookB(t) : fromLovage(lookC(t), t));
    const keys = [];
    for (let t = 0; t <= T_END + 1e-6; t += 0.5) keys.push({ t, p: toWorld(posH(t), t), look: toWorld(lookH(t), t), fov: 62 });
    const path = makePath(keys, { up: [0, 1, 0], entryRadius: 5, exitRadius: 6.5, align: 1.6 });
    yield 'path';

    // each frame: stand the hall and the two drums where the turning world has them, and move the trains
    const eye = new Vector3();
    const place = (t) => {
      const o = toWorld([0, 0, 0], t), l = toWorld([C, 0, 0], t);
      hallGroup.position.set(o[0], 0, o[2]); hallGroup.rotation.y = -OM * (t - T_GO);
      sorrel.group.position.set(o[0], 0, o[2]);
      lovage.group.position.set(l[0], 0, l[2]); lovage.group.rotation.y = OM * (T_GO - T_CATCH);
      clock.value = t - T_GO - (50 + (slot0 - L0 * 0.137) * RAFT.SLOT) / V;
      ours.visible = t < T_GO;
    };
    place(0);
    trains.update(eye.set(0, Y0, RAFT.QUAY));
    return {
      scene, path, hall, near: 2.5, far: RAFT.FAR,
      look: { exposure: 2.3, bloom: 0.42, threshold: 0.6, vignette: 0.4, saturation: 1.08 },
      portal: { mist: '#fff0d8', rimPower: 1.4 },
      update(t, dt, camera) {
        place(t);
        const p = camera.position, h = turn([p.x, p.y, p.z], OM * (t - T_GO));
        trains.update(eye.set(h[0] + pivot(t), h[1], h[2]));
      },
    };
  },
};
