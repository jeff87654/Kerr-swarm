// The streets of a generated block: the avenue's and the street's four arms (floor, ceiling services, lamps, festival
// dressing), the rows of ordinary house fronts between the lots, the arches into the next blocks, the furniture and the
// walkways people use. Built from the same parts as Ladle Row and Thread Street (src/places/street_parts.js).
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { lamp } from '../world/kit.js';
import { Rng } from '../core/util.js';
import { mixHex } from '../core/util.js';
import {
  street, side, shell, streetGlow, unit, pilaster, pier, thresholdArch, bench, drinkingTap, noticePillar, publicClock, chalk,
  sweeperNiche, streetPlanter, rowPath, stations, signBoard, letterFlaps, FIN, read,
} from '../places/street_parts.js';
import { FAMILY, NOTICES } from '../content/city.js';
import { LOT_H } from './plan.js';

const P = (text, sub) => ({ kind: 'street', text, sub });
const STAIR_LINES = [
  "The residents' stair, locked from this side. The court stair is quicker, and it has the view.",
  'Locked. Through the glass, a stair with a runner worn to the weave in the middle of every tread.',
  "The residents' stair. Somebody has chalked a small arrow on it, pointing to the court.",
];

// buildStreets(s, plan, game, tick) -> { stA, stS }. tick() is awaited between parts so the work can be spread over frames.
export async function buildStreets(s, plan, game, tick) {
  const info = plan.info, H = plan.H, court = plan.court, r = new Rng(info.seed ^ 0x51ed270b);
  const stA = street('x', plan.avenue.hw, H, plan.avenue.z), stS = street('z', plan.street.hw, H, plan.street.x);
  const festive = game.clock ? game.clock.day <= 3 : true;
  const fam = () => FAMILY[r.i(0, FAMILY.length - 1)];
  const g = s.g, blankFin = FIN[(info.style * 2 + 1) % FIN.length], bandTint = mixHex(blankFin.tint, blankFin.trim, 0.35);
  let flaps = 0;
  const doorsBy = new Map();                 // arm key -> { lo: [...], hi: [...] } door positions along the street
  const arms = [
    { key: 'spin', st: stA, a0: court.x1, a1: plan.avenue.x1, dir: 1, exit: plan.exits.spin },
    { key: 'anti', st: stA, a0: plan.avenue.x0, a1: court.x0, dir: -1, exit: plan.exits.anti },
    { key: 'back', st: stS, a0: court.z1, a1: plan.street.z1, dir: 1, exit: plan.exits.back },
    { key: 'front', st: stS, a0: plan.street.z0, a1: court.z0, dir: -1, exit: plan.exits.front },
  ];
  const stripsOf = (arm) => plan.strips.filter((sp) => sp.axis === arm.st.axis && sp.a0 >= arm.a0 - 0.6 && sp.a1 <= arm.a1 + 0.6);
  const itemAt = (arm, sg, a) => { for (const sp of stripsOf(arm)) if (sp.side === sg) for (const it of sp.items) if (a >= it.a0 - 0.01 && a <= it.a1 + 0.01) return it; return null; };

  for (const arm of arms) {
    const st = arm.st, hw = st.hw, a0 = arm.a0, a1 = arm.a1, len = a1 - a0;
    if (len < 4) continue;
    const clip = st.bx(a0 - 0.5, -hw - 0.5, a1 + 0.5, hw + 0.5, -0.3, H + 0.3);
    const n = Math.max(2, Math.round(len / 6));
    // corbels only where a beam lands on a plain front of ours (never across a lot's own sign)
    const corbel = (a, sg) => { const it = itemAt(arm, sg, a); return !!it && (it.kind === 'houses' || it.kind === 'pier'); };
    const axisX = st.X;
    // the shell two bays at a time, so no single step is long
    const lines = [], bayL = len / n, look = Object.assign({ clip, festive, corbel },
      axisX ? {} : { cloth: info.style % 2 === 0, bunting: false, runner: 0.7, runnerTint: ['#3f6a78', '#7a4a6a', '#5f7a3a', '#8a5a2f'][info.style % 4], band: '#b5653a' },
      axisX ? { runnerTint: ['#b2603f', '#3f6a78', '#8a6a2f', '#7a3f5a', '#4f7a5a', '#a04a3a'][info.style], field: ['#bfae8e', '#c9b99a', '#b8b09a'][info.style % 3] } : {});
    for (let b = 0; b < n; b += 2) {
      const nb = Math.min(2, n - b), last = b + nb >= n;
      const part = shell(s, st, a0 + b * bayL, a0 + (b + nb) * bayL, Object.assign({}, look, { n: nb, seed: (info.seed + arm.key.length + b) % 6,
        startBeam: b === 0 && arm.dir < 0 ? false : undefined, endBeam: last && arm.dir < 0 ? undefined : false }));
      for (const a of part) lines.push(a);
      await tick();
    }
    streetGlow(s, st, a0, a1);
    await tick();
    const doors = { lo: [], hi: [] }; doorsBy.set(arm.key, doors);

    // ---- the fronts between the lots
    for (const sp of stripsOf(arm)) {
      const sd = side(st, sp.side < 0 ? -hw : hw, sp.side < 0 ? 1 : -1), keep = sp.side < 0 ? doors.lo : doors.hi;
      let k = r.i(0, 8);
      for (const it of sp.items) {
        if (it.kind === 'pier') { pier(s, sd, it.a0, it.a1, H); continue; }
        // a lot draws its own front up to LOT_H: the street gives it the band above
        if (it.kind === 'lot') { g.mat('paint', bandTint); sd.box(g, it.a0, it.a1, -0.004, 0.2, LOT_H, H, { faces: 'fy' }); s.flush({ tier: 's' }); continue; }
        // the side of a lot that fronts elsewhere: a plain wall of the block's own finish, with the block's letter flaps on one of them
        if (it.kind === 'lotside') {
          unit(s, sd, it.a0, it.a1, { kind: 'blank', fin: blankFin });
          const mid = (it.a0 + it.a1) / 2, len = it.a1 - it.a0;
          if (len > 4 && flaps++ === 0) letterFlaps(s, sd, mid - 1.2, mid + 1.2, { plate: { kind: 'plate', text: info.name.toUpperCase(), lines: ['one flap to a household'] }, who: info.name + '’s letter flaps', lines: ['Names on brass, one to a flap, and a slot under each for what comes by hand.', 'Three of the flaps are polished brighter than the rest. Somebody is waiting on something.'] });
          else if (len > 3) { const q = sd.xz(mid, -0.45); bench(s, q[0], q[1], sd.yaw, { tags: ['street'], w: Math.min(1.8, len - 1) }); }
          // printed cloths hung along the wall from a rail: this is the loud drum
          if (len > 5) {
            const nh = Math.floor(len / 3.4), cols = ['#c9552e', '#2f6f73', '#d6a640', '#33407a', '#8a2f3c', '#6b7a3a', '#5b3a6e'];
            g.mat('cast', '#b08a45'); sd.box(g, it.a0 + 0.5, it.a1 - 0.5, -0.06, -0.03, 2.52, 2.55); s.flush({ tier: 's' });
            for (let h = 0; h < nh; h++) {
              const a = it.a0 + len * (h + 0.5) / nh, w = r.f(1.3, 1.9), drop = r.f(1.3, 1.75); if (Math.abs(a - mid) < 2.2) continue;
              g.mat(h % 2 ? 'motif' : 'stripe', cols[(h + info.style + k) % cols.length]);
              g.sheet(sd.pt(a - w / 2, 2.52, -0.05), sd.pt(a + w / 2, 2.52, -0.05), sd.pt(a + w / 2, 2.52 - drop, -0.03), sd.pt(a - w / 2, 2.52 - drop, -0.03), { nu: 4, nv: 3, ripple: 0.02, rippleN: 3 });
              s.flush({ tier: 's', cast: false });
            }
          }
          continue;
        }
        if (it.kind !== 'houses') continue;
        let a = it.a0; const end = it.a1;
        if (end - a < 2.7) { pier(s, sd, a, end, H); continue; }
        let niche = r.chance(0.18);
        while (end - a > 0.05) {
          let w = r.f(3.6, 5.2); if (end - (a + w) < 2.9) w = end - a;
          pilaster(s, sd, a, H);
          const num = info.d0 + ' · ' + Math.abs(Math.round(a - (axisX ? info.x : info.z)));
          if (niche && w > 3 && w < 4.4) { sweeperNiche(s, sd, a, a + w, FIN[k % FIN.length], { deck: info.d0 }); niche = false; }
          else if (k % 7 === 3 && w < 4.3) {
            const out = unit(s, sd, a, a + w, { kind: 'stair', fin: 4, name: 'STAIR', num: 'decks ' + (info.d0 + 1) + ' to ' + info.d1, clip, prompt: 'Try the stair door', knock: STAIR_LINES[k % STAIR_LINES.length] });
            for (const d of out.doors) keep.push(d);
          } else {
            const name = fam();
            const out = unit(s, sd, a, a + w, { fin: (k * 4 + info.style) % FIN.length, name, num, clip, win: r.chance(0.75), plants: r.chance(0.6), lit: r.chance(0.8), lampPower: 0.7 });
            for (const d of out.doors) keep.push(d);
          }
          a += w; k++;
          await tick();
        }
        pilaster(s, sd, end, H);
      }
    }

    // ---- the way out at the far end: an arch naming the next block, or the end of the street
    const edge = arm.dir > 0 ? a1 : a0, ex = arm.exit;
    if (ex.open && !ex.built && arm.dir > 0) {
      thresholdArch(s, st, edge, 1, ex.name.toUpperCase(), 'decks ' + info.d0 + ' to ' + info.d1, info.name.toUpperCase(), st.bx(edge - 6, -hw - 0.5, edge + 6, hw + 0.5, -0.3, H + 0.3));
    } else if (!ex.open) {
      endWall(s, st, edge, arm.dir, ex, info, clip);
    }

    // ---- furniture: benches, planters, a tap, a pillar of notices, chalk, things left leaning
    const along = (t) => a0 + len * t, vF = hw - 0.55;
    for (const t of [0.22, 0.62]) {
      const a = along(t + r.f(-0.05, 0.05)), sg = r.chance(0.5) ? 1 : -1, it = itemAt(arm, sg, a);
      if (it && it.kind === 'houses') { const q = st.xz(a, sg * vF); bench(s, q[0], q[1], st.yawV(-sg), { tags: ['street'], w: r.chance(0.5) ? 1.6 : 1.4 }); }
    }
    for (const t of [0.36, 0.8]) {
      const a = along(t + r.f(-0.04, 0.04)), sg = r.chance(0.5) ? 1 : -1, it = itemAt(arm, sg, a);
      if (it && it.kind === 'houses') { const q = st.xz(a, sg * (hw - 0.5)); streetPlanter(s, q[0], q[1], axisX ? 1.5 : 0.45, axisX ? 0.45 : 1.5, ['flower', 'broad', 'fern', 'herbs'][r.i(0, 3)]); }
    }
    if (len > 50) {
      const a = along(0.5), q = st.xz(a, r.chance(0.5) ? 1.3 : -1.3);
      const tint = ['#2f4f43', '#6e2f2a', '#33407a', '#5a3a26'][info.style % 4];
      const notes = [NOTICES[r.i(0, NOTICES.length - 1)], NOTICES[r.i(0, NOTICES.length - 1)]];
      const fill = (t) => t.replace('{block}', plan.exits.spin.name || 'the next block').replace('{avenue}', info.avenue);
      noticePillar(s, q[0], q[1], notes.map((nn) => ({ kind: 'notice', title: nn[0], lines: nn.slice(1).map(fill) })), { tint });
      s.interact({ x: q[0], y: 1.4, z: q[1] + (axisX ? -0.5 : 0), radius: 1.6, prompt: 'Read the notice pillar', onUse(g2) { read(g2, 'The notice pillar', notes.map((nn) => nn[0] + ': ' + nn.slice(1).map(fill).join(' '))); } });
      s.spot('stand', q[0] + (axisX ? 0 : 0.9), 0, q[1] + (axisX ? 0.9 : 0), axisX ? Math.PI : -Math.PI / 2, { tags: ['read', 'street'] });
    }
    if (r.chance(0.6)) chalk(s, st, along(0.7), r.chance(0.5) ? hw - 1.8 : -(hw - 1.8), { flip: r.chance(0.5) });
    for (let b = 0; b < 2; b++) {
      const a = along(r.f(0.15, 0.9)), sg = r.chance(0.5) ? 1 : -1, it = itemAt(arm, sg, a);
      if (!it || it.kind !== 'houses') continue;
      const q = st.xz(a, sg * (hw - 0.4));
      if (r.chance(0.7)) prop(s, 'streets.bicycle', q[0], 0, q[1], axisX ? (r.chance(0.5) ? 0 : Math.PI) : Math.PI / 2, { c: ['#c9552e', '#2f6f73', '#33407a', '#d6a640', '#5f8a3a', '#8a2f3c'][r.i(0, 5)], basket: r.chance(0.4) ? '#d6a640' : undefined });
      else prop(s, 'streets.handcart', q[0], 0, q[1], axisX ? 0 : Math.PI / 2, { c: '#8a5634', load: r.chance(0.5) ? 'crates' : 'cloth' });
    }
    // a board of pointers a bay in from the court
    {
      const a = arm.dir > 0 ? lines[Math.min(1, lines.length - 1)] : lines[Math.max(0, lines.length - 2)];
      const toCourt = [P(info.name.toUpperCase() + ' COURT', 'the block court'), P('THE LONG TABLE', info.cook.split(' ')[0] + '’s hall · ' + info.dish[0]), P('CABS', 'the lift core · stairs')];
      const away = ex.open ? [P(ex.name.toUpperCase(), axisX ? (arm.dir > 0 ? 'spinward' : 'anti') : (arm.dir > 0 ? 'toward the back' : 'toward the front'))] : [P(ex.cap === 'front' ? 'THE FRONT CAP' : ex.cap === 'back' ? 'THE BACK CAP' : 'NO WAY THROUGH', 'the street ends')];
      signBoard(s, st, a, arm.dir > 0 ? -1.6 : 1.6, arm.dir > 0 ? toCourt : away, arm.dir > 0 ? away : toCourt);
    }
    // a clock on the avenue's spinward arm and a tap by the court on the anti arm
    if (arm.key === 'spin') publicClock(s, st, a0 + len / n * 0.5, 0, 2.62, { r: 0.3, label: { kind: 'plate', text: info.avenue.toUpperCase(), lines: ['wound on the Quiet'] } });
    if (arm.key === 'anti') { const sp = stripsOf(arm).find((q) => q.items.some((it) => it.kind === 'pier' && it.a1 >= a1 - 0.1)); if (sp) drinkingTap(s, side(st, sp.side < 0 ? -hw : hw, sp.side < 0 ? 1 : -1), a1 - 1.0); }

    // ---- walkways and places to stand
    const vS = hw - 1.45, inner = arm.dir > 0 ? a0 : a1, lo = a0 + (arm.dir > 0 ? 0 : 1.2), hi = a1 - (arm.dir > 0 ? 1.2 : 0);
    rowPath(s, st, 0, stations(lo, hi, 3, lines.filter((a) => a > lo && a < hi)).concat([inner]));
    rowPath(s, st, -vS, stations(lo + 0.6, hi - 0.6, 3, doors.lo.filter((a) => a > lo + 0.6 && a < hi - 0.6)));
    rowPath(s, st, vS, stations(lo + 0.6, hi - 0.6, 3, doors.hi.filter((a) => a > lo + 0.6 && a < hi - 0.6)));
    for (const a of lines) if (a > lo + 0.5 && a < hi - 0.5) s.path([st.xz(a, -vS), st.xz(a, 0), st.xz(a, vS)]);
    for (const a of doors.lo) s.path([st.xz(a, -(hw - 0.65)), st.xz(a, -vS)], { width: 1.0 });
    for (const a of doors.hi) s.path([st.xz(a, hw - 0.65), st.xz(a, vS)], { width: 1.0 });
    const groups = Math.max(1, Math.round(len / 28));
    for (let gk = 0; gk < groups; gk++) {
      const a = along((gk + 0.5) / groups + r.f(-0.08, 0.08)), v = r.f(-1, 1) * (hw - 2.2), q = st.xz(a, v), nn = 2 + r.i(0, 2), rad = 0.55 + nn * 0.05;
      for (let i2 = 0; i2 < nn; i2++) { const t = i2 / nn * Math.PI * 2 + 0.4, px = q[0] + Math.cos(t) * rad, pz = q[1] + Math.sin(t) * rad; s.spot('chat', px, 0, pz, Math.atan2(q[0] - px, q[1] - pz), { tags: ['street'] }); }
    }
    // ---- the zone: the street's name under the compass
    const way = axisX ? (arm.dir > 0 ? 'runs spinward' : 'runs anti') : 'runs along the axis';
    await tick();
    s.zoneBox({ id: info.key + ':' + arm.key, place: axisX ? 'city-avenue' : 'city-street', box: st.bx(a0, -hw, a1, hw, -0.5, H), name: axisX ? info.avenue : info.street, sub: info.name + ' · deck ' + info.d0 + ' · ' + way, ambience: 'arcade', reverb: axisX ? 'ring' : 'felt', cell: info.key });
  }
  // the air handlers you hear along the avenue
  for (const t of [-0.55, 0.55]) s.loop('air', info.x + t * plan.HU, 3.0, plan.avenue.z + plan.avenue.hw - 1.0, { vol: 0.22, radius: 14 });

  return { stA, stS };
}

// Where a street stops: against the drum's front or back cap, or against a block with no way through.
function endWall(s, st, a, dir, ex, info, clip) {
  const g = s.g, hw = st.hw, H = st.H, t = 0.4, A0 = dir > 0 ? a - t : a, A1 = dir > 0 ? a : a + t;
  g.mat('block', '#8d8676'); st.box(g, A0, -hw, A1, hw, 0, H, { faces: dir > 0 ? 'a' : 'A' });
  g.mat('tile', '#2f4f43'); st.box(g, dir > 0 ? A0 - 0.01 : A1, -hw, dir > 0 ? A0 : A1 + 0.01, hw, 0, 1.1, { faces: dir > 0 ? 'a' : 'A' });
  g.mat('cast', '#b08a45'); st.box(g, dir > 0 ? A0 - 0.03 : A1, -hw, dir > 0 ? A0 : A1 + 0.03, hw, 1.1, 1.16, { faces: (dir > 0 ? 'a' : 'A') + 'yY' });
  s.flush({ tier: 's' });
  st.solid(s, A0, -hw, A1, hw, 0, H);
  const cap = ex.cap === 'front' ? 'THE FRONT CAP' : ex.cap === 'back' ? 'THE BACK CAP' : (ex.name || 'CANDLEWICK').toUpperCase();
  const sub = ex.cap ? (ex.cap === 'front' ? 'the power end · the street stops here' : 'the heat end · the street stops here') : 'no way through · go round by its avenue';
  const face = st.faceA(-dir), at = dir > 0 ? A0 - 0.035 : A1 + 0.035;
  sign(s, { kind: 'letters', text: cap, font: 'caps', palette: ['#ffe3a8'] }, ...st.pt(at, 2.25, 0), { face, w: Math.min(3.6, 2 * hw - 1.2), h: 0.36, glow: 2.2 });
  sign(s, { kind: 'plate', text: cap, lines: [sub] }, ...st.pt(at, 1.55, 0), { face, w: 0.5, h: 0.2 });
  for (const sg of [-1, 1]) lamp(s, 'sconce', ...st.pt(at, 2.3, sg * (hw - 1.0)), { face, power: 1.0, K: 2600, clip, range: 4.5 });
  const ip = st.pt(dir > 0 ? A0 - 0.6 : A1 + 0.6, 1.4, 0);
  const lines = ex.cap ? ['Behind this wall the decks stop. Past it are the cap, the jacket and the cold.', ex.cap === 'front' ? 'This is the power end: a hundred and sixty gigawatts come in through the front axle, and you would never know it by ear.' : 'This is the heat end: the same hundred and sixty gigawatts go out through the back axle as a river of ammonia.']
    : ['The street stops at the back of ' + (ex.name || 'the next block') + "'s hall. The way in is round by its avenue."];
  s.interact({ x: ip[0], y: ip[1], z: ip[2], radius: 1.7, prompt: 'Read the plate', onUse(game) { read(game, cap, lines); } });
  void info;
}
