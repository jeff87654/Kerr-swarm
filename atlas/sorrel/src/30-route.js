/* ---------- the Lattice: cab trips door to door (after drum-transport.md) ---------- */

const CAB = { radial: 20, tube: 30, a: 1.5, wait: 15, turn: 20, change: 5, lift: 12 };

const LINES = LINE_FIRST.map(f => {
  const r = deckR(f);
  const wr = DRUM.W * r;
  const spin = Math.min(30, Math.sqrt(1.2 * DRUM.G0 * r) - wr);
  const anti = Math.min(30, wr - Math.sqrt(0.3 * DRUM.G0 * r));
  const feel = u => (wr + u) * (wr + u) / r / (DRUM.W * DRUM.W * DRUM.R);
  return { deck: f, r, spin, anti, feelSpin: feel(spin), feelAnti: feel(-anti), local: gAt(r) };
});

/* A trapezoidal move: speed v, acceleration a, plus a second for jerk. */
function legT(d, v, a = CAB.a) {
  if (d <= 0.5) return 0;
  const dA = v * v / a;
  return (d < dA ? 2 * Math.sqrt(d / a) : d / v + v / a) + 1;
}

/* How far the cabin leans on a radial run at 20 m/s (it compensates about three-quarters). */
function leanAt(r) {
  const full = Math.atan(2 * DRUM.W * CAB.radial / (DRUM.W * DRUM.W * r)) * 180 / Math.PI;
  return Math.round(full * 0.75);
}

function decksWord(n) { return n === 1 ? "1 deck" : n + " decks"; }

/* The core leg: from one cab stop (z, θ, r) to another, by the quickest line deck. */
function cabLeg(A, B) {
  const dz = Math.abs(B.z - A.z);
  let dth = normTheta(B.theta - A.theta);            // spinward angle
  const arcHere = Math.min(dth, TAU - dth) * Math.min(A.r, B.r);
  const nA = deckAtR(A.r), nB = deckAtR(B.r);

  if (dz < 70 && arcHere < 70) {                     // same core: straight up or down
    const d = Math.abs(A.r - B.r);
    const t = legT(d, CAB.radial);
    const steps = d > 2 ? [`Cab ${A.r > B.r ? "up" : "down"} ${decksWord(Math.abs(nB - nA))} in the same core (${fmtDur(t)}, leaning about ${leanAt((A.r + B.r) / 2)}°)`] : [];
    return { t: CAB.wait + t, steps, via: null };
  }

  let best = null;
  for (const L of LINES) {
    let t = CAB.wait, steps = [];
    const up1 = Math.abs(A.r - L.r), up2 = Math.abs(L.r - B.r);
    const t1 = legT(up1, CAB.radial), t2 = legT(up2, CAB.radial);
    t += t1 + t2 + CAB.change * 2;
    let loop = null, cross = null;
    if (arcHere > 40) {
      const arcSpin = dth * L.r, arcAnti = (TAU - dth) * L.r;
      const ts = legT(arcSpin, L.spin), ta = legT(arcAnti, L.anti);
      loop = ts <= ta ? { dir: "Spinward", d: arcSpin, u: L.spin, feel: L.feelSpin, t: ts } : { dir: "Antispinward", d: arcAnti, u: L.anti, feel: L.feelAnti, t: ta };
      t += loop.t + CAB.turn;
    }
    if (dz > 40) {
      cross = { d: dz, t: legT(dz, CAB.tube), toward: B.z > A.z ? "the back" : "the front" };
      t += cross.t + CAB.turn;
    }
    if (!best || t < best.t) best = { t, L, t1, t2, up1, up2, loop, cross };
  }
  const { L, loop, cross } = best;
  const steps = [];
  const nL = L.deck;
  if (best.up1 > 2) steps.push(`Cab ${A.r > L.r ? "up" : "down"} ${decksWord(Math.abs(nL - nA))} to line deck ${nL} (${fmtDur(best.t1)}, leaning about ${leanAt((A.r + L.r) / 2)}°)`);
  else steps.push(`Into the tubes at line deck ${nL}`);
  if (loop) steps.push(`${loop.dir} ${fmtDist(loop.d)} round loop ${nL} at ${loop.u.toFixed(loop.u % 1 ? 1 : 0)} m/s, where you weigh ${loop.feel.toFixed(2)} g (${fmtDur(loop.t)})`);
  if (cross) steps.push(`Along a cross-line ${fmtDist(cross.d)} toward ${cross.toward} at 30 m/s (${fmtDur(cross.t)})`);
  if (best.up2 > 2) steps.push(`Cab ${L.r > B.r ? "up" : "down"} ${decksWord(Math.abs(nB - nL))} (${fmtDur(best.t2)})`);
  return { t: best.t, steps, via: L };
}

/* Where a cab stops for a spot, and what you do before or after. */
function cabEnd(spot, arriving) {
  const z = clamp(spot.z, 30, DRUM.L - 30), th = spot.theta || 0;
  switch (spot.zone) {
    case "deck": case "keel": case "line": {
      const walk = 50 / PHYS.walk(spot.r);
      return { z, theta: th, r: spot.r, pre: walk, text: arriving ? `Walk to the door (${fmtDur(walk)})` : `Walk to the lift lobby (${fmtDur(walk)})` };
    }
    case "hollow": {
      const walk = 70 / PHYS.walk(DRUM.FLOOR) + 10;
      const up = spot.r < DRUM.FLOOR - 30 ? " (and the rest of the way is air)" : "";
      return { z, theta: th, r: deckR(375), pre: walk, text: arriving ? `Up through the floor at a pavilion, and walk across the grass${up} (${fmtDur(walk)})` : `Walk to the nearest pavilion (${fmtDur(walk)})` };
    }
    case "wall": case "spindle": case "axle": {
      const back = spot.wall === "back" || spot.z > DRUM.L / 2;
      const rTo = spot.zone === "wall" ? spot.r : 40;
      const lift = legT(DRUM.FLOOR - rTo, CAB.lift, 1.2) + 20;
      const walk = 60 / PHYS.walk(DRUM.FLOOR);
      const extra = spot.zone === "axle" ? 120 : spot.zone === "spindle" ? 30 : 0;
      const where = back ? "back" : "front";
      const what = spot.zone === "wall" ? `to the terrace at ${gAt(rTo).toFixed(2)} g` : spot.zone === "axle" ? "to the axis, then in through the axle hall's lock" : "to the flying-hall gate at the axis";
      return {
        z: back ? DRUM.L - 300 : 300, theta: th, r: deckR(375), pre: walk + lift + extra,
        text: arriving ? `Walk to the ${where} wall and ride a Spindle lift ${what} (${fmtDur(walk + lift + extra)})` : `Spindle lift down the ${where} wall to the floor (${fmtDur(walk + lift + extra)})`,
      };
    }
    case "outside": {
      const rz = ringCenter(spot.ring || ringOfZ(z));
      return { z: rz, theta: th, r: deckR(2), pre: 90, text: arriving ? "From the station ring, out through the jacket on a crew car (about 1 min 30 s); passengers only pass through" : "In through the jacket to the station ring" };
    }
    default: return { z, theta: th, r: deckR(200), pre: 0, text: "" };
  }
}

function route(from, to) {
  if (!from || !to) return null;
  if (to.zone === "beyond" || from.zone === "beyond") {
    const win = /window|radiator|back crew|sled/i.test(to.title || "");
    return {
      t: null,
      steps: win
        ? ["Book it through the Window office or your crew", "Spindle lift up the back wall to the axis", "Through the back axle hall to the despun chamber (a little under two minutes)", "An armoured car on the shielded track, out through the radiator layer"]
        : ["Out of the drum only in a shielded glide car or a crew vehicle", "Board at a station ring on the rim deck", "Out through the jacket to the quay's cradles"],
      note: win ? "About half an hour from the Hollow floor, by arrangement" : "Nobody walks out here",
    };
  }
  const A = cabEnd(from, false), B = cabEnd(to, true);
  const sameBlock = from.zone === to.zone && Math.abs(from.z - to.z) < 120 && Math.abs(from.r - to.r) < 12 &&
    Math.min(normTheta(from.theta - to.theta), TAU - normTheta(from.theta - to.theta)) * from.r < 120;
  if (sameBlock && (from.zone === "deck" || from.zone === "keel")) {
    const d = Math.abs(from.z - to.z) + Math.min(normTheta(from.theta - to.theta), TAU - normTheta(from.theta - to.theta)) * from.r + Math.abs(from.r - to.r) * 6;
    const t = d / PHYS.walk(from.r) + 20;
    return { t, steps: [`On foot, by the stairs and streets (${fmtDur(t)})`], note: "Close enough to walk" };
  }
  const leg = cabLeg(A, B);
  const steps = [A.text, ...leg.steps, B.text].filter(Boolean);
  return { t: A.pre + leg.t + B.pre, steps, via: leg.via };
}

/* The quickest station platform from a spot (cabs sidestep along the Keel to the nearest ring). */
function toPlatform(spot) {
  if (!["deck", "keel", "line"].includes(spot.zone)) return null;
  const walk = 50 / PHYS.walk(spot.r);
  const ride = legT(Math.abs(spot.r - deckR(4)), CAB.radial);
  const ring = ringOfZ(spot.z);
  const side = legT(Math.abs(spot.z - ringCenter(ring)), CAB.radial) + 12;   // the sidestep along the Keel
  return { t: walk + CAB.wait + ride + side + 20, ring };                     // and across to the glide car
}

function toHollow(spot) {
  if (!["deck", "keel", "line"].includes(spot.zone)) return null;
  const walk = 50 / PHYS.walk(spot.r);
  const ride = legT(Math.abs(spot.r - deckR(375)), CAB.radial);
  return walk + CAB.wait + ride + 10;
}
