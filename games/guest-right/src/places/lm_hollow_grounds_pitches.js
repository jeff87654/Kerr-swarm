// Four of the Breadboard's spinball pitches, side by side along the axis on the anti side of the track. Each is mown in
// stripes, 36 m spinward to anti by 20 m across, with low boards round it in its own colour, a gate of three hoops at
// each end (the spin end, where throws dive, and the anti end, where they sail), and the three arrows painted at its
// centre. The fourth, nearest the pavilion, is the practice pitch: a throwing mark with three hoops on posts nine
// metres off, one spinward, one anti and one along the axis, so the same throw can be tried three ways.
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { Rng } from '../core/util.js';
import { minGround, say, toast, found, sfx } from './hollow_parts.js';
import { P, pz0, C, strip, paintLine, paintArc, patch, postGlass, groundY } from './lm_hollow_grounds_parts.js';

const PI = Math.PI;
const PY = (x, z) => groundY(x, z) + 0.05;                 // the mown surface, a hair over the meadow
const BOARD_COLS = [C.teal, C.verm, C.saffron, C.indigo];
const NAMES = ['Pitch one', 'Pitch two', 'Pitch three', 'Pitch four · practice'];
const custom = (gm, term) => { if (gm.journal && gm.journal.custom) gm.journal.custom(term); };

export function buildPitches(game, f, zones) {
  const s = game.world.scope('lmhg-pitches', f), g = s.g, r = new Rng(5150);
  const x0 = P.CX - P.L / 2, x1 = P.CX + P.L / 2;
  const targets = [];
  for (let k = 0; k < 4; k++) {
    const z0 = pz0(k), z1 = z0 + P.W, cz = (z0 + z1) / 2;
    // ---- the mown surface, in stripes three metres wide
    for (let xs = x0 - 0.9; xs < x1 + 0.9 - 1e-6; xs += 3.0) {
      const xa = xs, xb = Math.min(x1 + 0.9, xs + 3.0), Lp = [], Rp = [];
      for (let z = z0 - 0.9; z <= z1 + 0.9 + 1e-6; z += (P.W + 1.8) / 11) { Lp.push([xa, z]); Rp.push([xb, z]); }
      g.mat('grass', Math.round((xs - x0) / 3) % 2 ? C.mown : C.mown2);
      strip(g, Lp, Rp, PY, 0);
      if (Math.round((xs - x0) / 3) % 4 === 3) s.flush({ tier: 's', cast: false });
    }
    s.flush({ tier: 's', cast: false });
    // ---- the lines: the border, the halfway line, the centre circle, the throwing arcs at each end
    s.structure(() => {
      g.mat('paint', C.lane, { rough: 0.2 });
      const w = 0.07;
      paintLine(g, [x0, z0], [x1, z0], w, PY, 0.012, 2); paintLine(g, [x0, z1], [x1, z1], w, PY, 0.012, 2);
      paintLine(g, [x0, z0], [x0, z1], w, PY, 0.012, 2); paintLine(g, [x1, z0], [x1, z1], w, PY, 0.012, 2);
      paintLine(g, [P.CX, z0], [P.CX, z1], w, PY, 0.012, 2);
      paintArc(g, P.CX, cz, 3.0, 0, PI * 2, w, PY, 0.012);
      paintArc(g, x0, cz, 6.0, -PI / 2, PI / 2, w, PY, 0.012); paintArc(g, x1, cz, 6.0, PI / 2, PI * 1.5, w, PY, 0.012);
    });
    // ---- the three arrows: along the axis (white, straight), spin (red, short: it dives), anti (teal, long: it sails)
    s.structure(() => {
      const arrow = (ax, az, bx, bz, w, col) => {
        g.mat('paint', col, { rough: 0.1 });
        const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, hx = bx - ux * 0.9, hz = bz - uz * 0.9;
        paintLine(g, [ax, az], [hx, hz], w, PY, 0.016, 1.5);
        patch(g, [[hx - uz * 0.55, hz + ux * 0.55], [bx, bz], [bx, bz], [hx + uz * 0.55, hz - ux * 0.55]], PY, 0.016);
      };
      arrow(P.CX, cz - 0.4, P.CX, cz + 5.6, 0.28, C.lane);
      arrow(P.CX + 0.4, cz, P.CX + 3.8, cz, 0.42, '#c8402a');
      arrow(P.CX - 0.4, cz, P.CX - 7.2, cz, 0.18, '#2f8f8a');
    });
    // ---- the boards: knee-high planks in the pitch's colour, with a gap in the middle of each long side
    const B = P.BOARD, bx0 = x0 - B, bx1 = x1 + B, bz0 = z0 - B, bz1 = z1 + B, col = BOARD_COLS[k], H = 0.5, T = 0.07;
    const run = (ax, az, bx, bz) => {
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 4));
      for (let i = 0; i < n; i++) {
        const xa = ax + (bx - ax) * i / n, za = az + (bz - az) * i / n, xb = ax + (bx - ax) * (i + 1) / n, zb = az + (bz - az) * (i + 1) / n;
        const yb = minGround(Math.min(xa, xb), Math.min(za, zb), Math.max(xa, xb), Math.max(za, zb), 1) - 0.1, yt = groundY((xa + xb) / 2, (za + zb) / 2) + H;
        const along = Math.abs(bx - ax) > Math.abs(bz - az);
        const X0 = along ? Math.min(xa, xb) : xa - T / 2, X1 = along ? Math.max(xa, xb) : xa + T / 2, Z0 = along ? za - T / 2 : Math.min(za, zb), Z1 = along ? za + T / 2 : Math.max(za, zb);
        s.furniture(() => {
          g.mat('planks', col, { rough: 0.05 }); g.box(X0, yb, Z0, X1, yt - 0.06, Z1, { bevel: 0.006 });
          g.mat('wood', C.cream); g.box(X0 - (along ? 0 : 0.02), yt - 0.06, Z0 - (along ? 0.02 : 0), X1 + (along ? 0 : 0.02), yt, Z1 + (along ? 0.02 : 0), { bevel: 0.01 });
          // a stake behind each joint, and a mend or two in a second colour
          g.mat('wood', C.wood); if (along) g.box(xa - 0.04, yb, za + (bz0 === za ? -0.12 : 0.04), xa + 0.04, yt - 0.1, za + (bz0 === za ? -0.04 : 0.12)); else g.box(xa + (bx0 === xa ? -0.12 : 0.04), yb, za - 0.04, xa + (bx0 === xa ? -0.04 : 0.12), yt - 0.1, za + 0.04);
          if (r.chance(0.3)) { const t0 = r.f(0.2, 0.7); g.mat('planks', BOARD_COLS[(k + 2) % 4]); if (along) g.box(xa + (xb - xa) * t0, yb + 0.12, Z0 - 0.006, xa + (xb - xa) * (t0 + 0.12), yt - 0.14, Z1 + 0.006); else g.box(X0 - 0.006, yb + 0.12, za + (zb - za) * t0, X1 + 0.006, yt - 0.14, za + (zb - za) * (t0 + 0.12)); }
        });
        s.solid(X0, yb, Z0, X1, yt, Z1, { surf: 'wood' });
      }
    };
    run(bx0, bz0, P.CX - 1.1, bz0); run(P.CX + 1.1, bz0, bx1, bz0);
    run(bx0, bz1, P.CX - 1.1, bz1); run(P.CX + 1.1, bz1, bx1, bz1);
    run(bx0, bz0, bx0, bz1); run(bx1, bz0, bx1, bz1);
    // the ends' plates, on the outsides of the end boards; the name on the long side
    const spinPlate = { kind: 'plate', text: 'SPIN END', lines: ['throws this way dive'], palette: [C.cream, '#2b2a26', '#c8402a'] };
    const antiPlate = { kind: 'plate', text: 'ANTI END', lines: ['throws this way sail'], palette: [C.cream, '#2b2a26', '#2f8f8a'] };
    sign(s, spinPlate, bx1 + 0.04, groundY(bx1, cz + 4.5) + 0.3, cz + 4.5, { face: 'X', w: 0.7, h: 0.22 });
    sign(s, antiPlate, bx0 - 0.04, groundY(bx0, cz - 4.5) + 0.3, cz - 4.5, { face: 'x', w: 0.7, h: 0.22 });
    sign(s, { kind: 'plate', text: NAMES[k].toUpperCase(), lines: ['axis flies true · spin sinks · anti floats'], palette: [C.cream, '#2b2a26', col] }, x1 - 5, groundY(x1 - 5, bz0) + 0.3, bz0 - 0.04, { face: 'z', w: 1.2, h: 0.22 });
    // ---- the gates: two posts and a bar, two low hoops worth three and a high hoop worth five
    for (const end of [-1, 1]) {
      const gx = end < 0 ? x0 : x1, gy = groundY(gx, cz), yaw = end < 0 ? PI / 2 : -PI / 2;
      s.furniture(() => {
        g.mat('paint', C.cream, { rough: -0.1 });
        for (const dz of [-3.4, 3.4]) g.cyl(gx, gy - 0.3, cz + dz, 0.07, 4.1, { segs: 10 });
        g.mat('paint', col); g.tube([[gx, gy + 3.75, cz - 3.4], [gx, gy + 3.75, cz + 3.4]], 0.06, { segs: 8 });
        g.mat('cast', C.iron); for (const dz of [-2.2, 0, 2.2]) g.tube([[gx, gy + 3.75, cz + dz], [gx, gy + (dz ? 2.1 : 3.4), cz + dz]], 0.02, { segs: 4 });
        g.mat('paint', C.saffron); for (const dz of [-3.4, 3.4]) g.cyl(gx, gy + 3.8, cz + dz, 0.09, 0.08, { segs: 10 });
      });
      for (const dz of [-3.4, 3.4]) s.post(gx, cz + dz, 0.08, gy - 0.3, gy + 3.8);
      const hoops = [[-2.2, 1.65, 0.45, 3, C.saffron], [0, 3.0, 0.36, 5, '#c8402a'], [2.2, 1.65, 0.45, 3, C.saffron]];
      for (const h of hoops) {
        prop(s, 'lmhg.hoop', gx, gy + h[1], cz + h[0], yaw, { r: h[2], col: h[4] }, { tier: 's' });
        targets.push({ frame: f, x: gx - end * 0.05, y: gy + h[1], z: cz + h[0], r: h[2], owner: 'lmhg', end: end > 0 ? 'spin' : 'anti', points: h[3], pitch: k });
      }
    }
    // ---- balls left lying, a water jug on the boards
    for (let i = 0; i < 3; i++) { const bx = r.f(x0 + 2, x1 - 2), bz = r.f(z0 + 1, z1 - 1); prop(s, 'lmhg.ball', bx, PY(bx, bz), bz, r.f(0, 6), { a: r.pick([C.verm, C.indigo, C.leaf, C.saffron]), b: C.cream }); }
    // ---- people: children at catch in pairs and running; grown players at practice on pitch three; watchers outside
    if (k < 3) {
      for (let i = 0; i < 3; i++) {
        const ax = r.f(x0 + 3, x1 - 9), az = r.f(z0 + 3, z1 - 3), bx = ax + r.f(4, 6), bz = az + r.f(-1.5, 1.5);
        s.spot('play', ax, PY(ax, az), az, Math.atan2(bx - ax, bz - az), { tags: ['kids', 'catch', 'spinball', 'grounds'] });
        s.spot('play', bx, PY(bx, bz), bz, Math.atan2(ax - bx, az - bz), { tags: ['kids', 'catch', 'spinball', 'grounds'] });
      }
      for (let i = 0; i < 2; i++) { const x = r.f(x0 + 4, x1 - 4), z = r.f(z0 + 3, z1 - 3); s.spot('play', x, PY(x, z), z, r.f(-PI, PI), { tags: ['kids', 'run', 'spinball', 'grounds'] }); }
    }
    if (k === 2) {
      for (const [dx, dz, yaw] of [[-12, -3, PI / 2], [-12, 3, PI / 2], [-6, 0, -PI / 2], [6, -4, -PI / 2], [10, 2, PI / 2]]) s.spot('stand', P.CX + dx, PY(P.CX + dx, cz + dz), cz + dz, yaw, { tags: ['throw', 'practice', 'spinball', 'grounds'] });
    }
    const watch = (x, z, n) => { for (let i = 0; i < n; i++) { const t = i / n * PI * 2 + 0.3, px = x + Math.cos(t) * 0.7, pz = z + Math.sin(t) * 0.7; s.spot('chat', px, groundY(px, pz), pz, Math.atan2(x - px, z - pz), { tags: ['watch', 'spinball', 'grounds'] }); } };
    if (k === 0) watch(bx1 + 1.4, cz - 6, 3);
    if (k === 1) watch(bx1 + 1.3, cz + 5, 2);
    // ---- the walkway along the spinward ends, joining the gaps
    s.path([[bx1 + 0.9, groundY(bx1 + 0.9, bz0 - 0.8), bz0 - 0.8], [bx1 + 0.9, groundY(bx1 + 0.9, bz1 + 0.8), bz1 + 0.8]]);
    s.path([[P.CX, groundY(P.CX, bz0 - 0.8), bz0 - 0.8], [P.CX, PY(P.CX, cz), cz], [P.CX, groundY(P.CX, bz1 + 0.8), bz1 + 0.8]]);
    s.path([[P.CX, groundY(P.CX, bz0 - 0.8), bz0 - 0.8], [bx1 + 0.9, groundY(bx1 + 0.9, bz0 - 0.8), bz0 - 0.8]]);
    s.path([[P.CX, groundY(P.CX, bz1 + 0.8), bz1 + 0.8], [bx1 + 0.9, groundY(bx1 + 0.9, bz1 + 0.8), bz1 + 0.8]]);
  }

  // ---- the practice pitch's throwing mark and its three hoops on posts
  const k3 = 3, cz3 = pz0(k3) + P.W / 2, MX = P.CX, MZ = cz3, HY = 2.3, HR = 0.5, D = 9;
  s.structure(() => {
    g.mat('paint', C.saffron, { rough: 0.1 }); paintArc(g, MX, MZ, 0.55, 0, PI * 2, 0.1, PY, 0.02);
    g.mat('paint', C.saffron); paintLine(g, [MX - 0.35, MZ], [MX + 0.35, MZ], 0.06, PY, 0.022, 1); paintLine(g, [MX, MZ - 0.35], [MX, MZ + 0.35], 0.06, PY, 0.022, 1);
  });
  const practice = [[D, 0, 'spin', '#c8402a'], [-D, 0, 'anti', '#2f8f8a'], [0, -D + 1, 'axis', C.lane]];
  for (const [dx, dz, kind, col] of practice) {
    const x = MX + dx, z = MZ + dz, y = groundY(x, z), yaw = kind === 'axis' ? 0 : PI / 2;
    s.furniture(() => {
      g.mat('paint', C.dark); g.cyl(x, y - 0.3, z, 0.05, HY - HR - 0.05 + 0.3, { segs: 8 });
      g.mat('paint', col); g.cyl(x, y + 0.5, z, 0.06, 0.1, { segs: 8 }); g.cyl(x, y + 1.1, z, 0.06, 0.1, { segs: 8 });
      g.mat('cast', C.iron); g.cyl(x, y - 0.05, z, 0.22, 0.06, { segs: 10 });
    });
    s.post(x, z, 0.07, y - 0.3, y + HY - HR);
    prop(s, 'lmhg.hoop', x, y + HY, z, yaw, { r: HR, col }, { tier: 's' });
    targets.push({ frame: f, x, y: y + HY, z, r: HR, owner: 'lmhg', practice: kind });
  }
  sign(s, { kind: 'plate', text: 'THE MARK', lines: ['three hoops, nine metres, one throw'], palette: [C.cream, '#2b2a26', C.saffron] }, MX + 0.5, groundY(MX + 0.5, pz0(3) - P.BOARD) + 0.3, pz0(3) - P.BOARD - 0.04, { face: 'z', w: 0.9, h: 0.22 });
  s.interact({ x: MX, y: PY(MX, MZ) + 1.0, z: MZ, radius: 1.6, prompt: 'Read the throwing mark', onUse: (gm) => {
    custom(gm, 'Spinball');
    return say(gm, { name: 'The throwing mark', colour: C.saffron }, [
      'Painted round the mark: stand here, borrow a ball from the pavilion, and throw the same way at each of the three hoops. Each is nine metres off and 2.3 metres up.',
      'A ball thrown at twelve metres a second gets there in about three quarters of a second. Thrown spinward it weighs three tenths more on the way and falls about 0.4 metres further: aim high. Thrown anti it weighs a quarter less and falls about 0.35 less: aim low.',
      'Along the axis it flies true, and it goes where you look. That is the whole of the game, and children here learn it before they can read.',
    ]);
  } });
  s.spot('stand', MX + 1.6, PY(MX + 1.6, MZ + 1.4), MZ + 1.4, PI / 2, { tags: ['throw', 'practice', 'spinball', 'grounds'] });
  s.spot('stand', MX - 1.2, PY(MX - 1.2, MZ + 2.0), MZ + 2.0, -PI / 2, { tags: ['throw', 'practice', 'spinball', 'grounds'] });

  // ---- the arrows on pitch two can be read from the board's gap
  const cz1 = pz0(1) + P.W / 2;
  s.interact({ x: P.CX, y: PY(P.CX, cz1) + 0.6, z: cz1 + 1.2, radius: 2.6, prompt: 'Read the arrows on the grass', onUse: (gm) => {
    found(gm, 'break-twice'); custom(gm, 'Spinball');
    return say(gm, { name: 'The three arrows', colour: '#c8402a' }, [
      'Axis flies true, spin sinks, anti floats. The white arrow runs along the axis and is straight. The red one points spinward and is short, because a ball thrown that way dives. The teal one points anti and is long, because it sails.',
      'Out here it breaks twice as hard as on the decks. The floor turns at 86 metres a second, and a ball thrown spinward at twelve adds its speed to that: it weighs 30 per cent more on the way. Thrown anti it weighs 26 per cent less. On Candlewick’s decks, which turn at 168, the same throw changes by about a sixth.',
      'So the Breadboard’s game is all angles, and the old players throw almost everything along the axis and let the young ones show off.',
    ]);
  } });
  // ---- the rules board at the front end of the row
  {
    const x = x1 + P.BOARD + 2.2, z = pz0(0) - 2.4, y = groundY(x, z);
    s.furniture(() => { g.mat('wood', C.wood); for (const dz of [-0.75, 0.75]) g.box(x - 0.05, y - 0.3, z + dz - 0.05, x + 0.05, y + 2.1, z + dz + 0.05, { bevel: 0.01 }); g.mat('paint', C.roof); g.box(x - 0.15, y + 2.1, z - 0.95, x + 0.15, y + 2.18, z + 0.95, { bevel: 0.01 }); });
    for (const dz of [-0.75, 0.75]) s.post(x, z + dz, 0.07, y - 0.3, y + 2.1);
    sign(s, { kind: 'notice', title: 'Field spinball', lines: ['Seven a side. Two halves', 'of twenty minutes.', 'Low hoops three, high hoop', 'five. First to twenty-one.', 'No running with the ball:', 'three steps, then throw.', 'Balls on loan, pavilion.'] }, x + 0.06, y + 1.35, z, { face: 'X', w: 1.3, h: 1.25 });
    s.interact({ x: x + 0.8, y: y + 1.3, z, radius: 1.8, prompt: 'Read the rules of field spinball', onUse: (gm) => say(gm, { name: 'Field spinball', colour: C.teal }, [
      'Seven a side, on a pitch 36 metres spinward to anti and 20 across. Two halves of twenty minutes; ends change at half time, because nobody would agree to defend the spin end for forty.',
      'A low hoop scores three and the high hoop five. First to twenty-one. Three steps with the ball and then you throw it. The boards are in play: a ball off the boards is live.',
      'The spin end is the hard one to score at: every throw at it dives, and the high hoop is 3 metres up. The anti end gives the high hoop away to anybody who throws flat and lets it sail.',
    ]) });
  }

  // ---- lamps on posts between the pitches, both sides
  const PH = 4.6;
  const rows = [pz0(0) - 2.6, (pz0(0) + P.W + pz0(1)) / 2, (pz0(1) + P.W + pz0(2)) / 2, (pz0(2) + P.W + pz0(3)) / 2, pz0(3) + P.W + 2.6];
  rows.forEach((z, i) => {
    for (const x of [x0 - P.BOARD - 1.3, x1 + P.BOARD + 1.3]) {
      const y = groundY(x, z);
      prop(s, 'lmhg.post', x, y, z, i * 0.5, { h: PH, col: C.indigo, band: C.saffron }, { tier: 's' });
      s.deco(() => postGlass(g, x, y, z, PH, 5));
      s.light({ at: [x, y + PH, z], color: '#ffd8a8', power: 6, range: 18, night: true, lamp: true, radius: 0.14 });
    }
  });
  s.loop('kids', P.CX, groundY(P.CX, 2362) + 1.2, 2362, { vol: 0.55, radius: 50 });

  // ---- the targets: registered for the thrown ball while the grounds are loaded, and a word when one goes through
  game.spinballTargets = (game.spinballTargets || []).filter((t) => t.owner !== 'lmhg').concat(targets);
  s.onDispose(() => { if (game.spinballTargets) game.spinballTargets = game.spinballTargets.filter((t) => t.owner !== 'lmhg'); });
  const off = game.events.on('ball:score', (t) => {
    if (!t || t.owner !== 'lmhg') return;
    found(game, 'break-twice');
    if (t.practice === 'spin') toast(game, 'Through the spin hoop. Thrown spinward the ball weighed about three tenths more and dived, so you had to throw it high.', 'gain');
    else if (t.practice === 'anti') toast(game, 'Through the anti hoop. Thrown anti it weighed about a quarter less and sailed, so you had to throw it low.', 'gain');
    else if (t.practice === 'axis') toast(game, 'Through the axis hoop. Along the axis it flies true: it went where you looked.', 'gain');
    else toast(game, (t.points === 5 ? 'The high hoop, five' : 'A low hoop, three') + ', at the ' + t.end + ' end of ' + NAMES[t.pitch].split(' · ')[0].toLowerCase() + '. ' + (t.end === 'spin' ? 'Thrown spinward: it dived, and you allowed for it.' : 'Thrown anti: it sailed, and you kept it down.'), 'gain');
  });
  s.onDispose(off);
  s.finish();
  return s;
}
