// Station Ring 2, the south side of the glide platform: the Ledger hall (the Ledger, the old Count board, the Keeper's
// desk), the guest desk where guest-right is signed, and the ring counter's hatch. Frame 'station', deck 1, a full g.
import { floor, ceiling, wall, lamp, roomGlow, block } from '../world/kit.js';
import { room, railing, column, planter } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { LEDGER } from '../content/ledger.js';
import { MENUS } from '../content/menus.js';
import { SIGNS } from '../content/signs.js';
import { ledgerParts, spec, num, tell, found, flags, painted, drawFigure, drawNames, drawBlocks, drawCount, drawPlate, drawTitle, drawMap, drawChalk, seatHere, SERIF } from './ledger_parts.js';
import { Rng, mixHex, shadeHex } from '../core/util.js';

void ledgerParts;
const PI = Math.PI;
const SEFA = { name: 'Sefa', colour: '#2f6f8f' }, TOMAS = { name: 'Tomas', colour: '#c9552e' }, AGATHE = { name: 'Agathe', colour: '#d6a640' };
const YOU = { name: 'You', colour: '#8fd694' };
const BLOCKS = [['Ropewalk', 31, 29, 2], ['Pennyfold', 22, 22, 1], ['Candlewick', 26, 25, 1], ['Hassock', 30, 27, 1], ['Lindenhall', 19, 20, 1]];

function dayTotals(game) {
  const d = game.clock ? game.clock.day : 1;
  return d >= 3 ? LEDGER.totals.bookingDay : d === 2 ? LEDGER.totals.dayBefore : LEDGER.totals.thursday;
}
function guestsTonight(game) {
  const F = game.flags || {}; const T = dayTotals(game);
  const mine = F.signedIn && (F.signedInAt === undefined || game.time - F.signedInAt > 12) ? 1 : 0;
  return T.guests + mine;
}

export const place = {
  id: 'ledger', name: 'The Ledger hall, the guest desk and the ring counter', order: 12,
  build(game) {
    const f = game.world.frame('station', 3000, 0, 625);
    buildHall(game, f);
    buildDesk(game, f);
    buildCounter(game, f);
    game.spawns.ledger = { frame: f, x: 0, y: 0, z: 13.5, yaw: PI, pitch: 0.05 };
    game.spawns['ledger-board'] = { frame: f, x: 0, y: 0, z: 30.5, yaw: PI, pitch: 0.28 };
    game.spawns.guestdesk = { frame: f, x: -25, y: 0, z: 13, yaw: PI };
    game.spawns.counter = { frame: f, x: 25, y: 0, z: 12.6, yaw: PI };
  },
};

// =====================================================================================================================
// The Ledger hall: x[-18, 18] z[12, 36], 12 m to the beams. The Ledger fills the south wall.
// =====================================================================================================================
function buildHall(game, f) {
  const s = game.world.scope('ledger', f), g = s.g;
  const X0 = -18, X1 = 18, Z0 = 12, Z1 = 36, H = 12, T = 0.3;
  const CLIP = [X0 - 0.05, -0.3, Z0 - 2.0, X1 + 0.05, H + 0.2, Z1 + 0.05];
  const STONE = '#c9bba0', TIMBER = '#2e2018', BRASS = '#b48c48', INDIGO = '#26306b', OCHRE = '#c9552e';

  // ---- floor: pale stone field, a darker border, brass inlay lines, a brass star where people stand to read
  floor(s, X0, Z0, X1, Z1, 0, 'terrazzo', '#cdc1a8');
  s.structure(() => {
    g.mat('stone', '#8f8371');
    g.box(X0 + T, 0, Z0, X1 - T, 0.004, Z0 + 1.2, { faces: 'Y' }); g.box(X0 + T, 0, Z1 - 1.2, X1 - T, 0.004, Z1 - T, { faces: 'Y' });
    g.box(X0 + T, 0, Z0 + 1.2, X0 + 1.4, 0.004, Z1 - 1.2, { faces: 'Y' }); g.box(X1 - 1.4, 0, Z0 + 1.2, X1 - T, 0.004, Z1 - 1.2, { faces: 'Y' });
  });
  s.deco(() => {
    g.mat('cast', BRASS, { rough: -0.25 });
    const L = (x0, z0, x1, z1) => g.box(x0, 0, z0, x1, 0.006, z1, { faces: 'Y' });
    L(X0 + 1.4, Z0 + 1.2, X1 - 1.4, Z0 + 1.25); L(X0 + 1.4, Z1 - 1.25, X1 - 1.4, Z1 - 1.2); L(X0 + 1.4, Z0 + 1.2, X0 + 1.45, Z1 - 1.2); L(X1 - 1.45, Z0 + 1.2, X1 - 1.4, Z1 - 1.2);
    for (const z of [16, 22, 28]) L(X0 + 1.45, z - 0.025, X1 - 1.45, z + 0.025);
    L(-0.025, Z0 + 1.25, 0.025, 30.6);
    // the star in front of the rail
    for (let i = 0; i < 48; i++) { const a = i / 48 * PI * 2; g.at(Math.sin(a) * 1.3, 0, 30.9 + Math.cos(a) * 1.3, a); g.box(-0.09, 0, -0.025, 0.09, 0.006, 0.025, { faces: 'Y' }); g.pop(); }
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, r1 = i % 2 ? 0.7 : 1.2; g.at(0, 0, 30.9, a); g.prism([[-0.06, 0], [0, -r1], [0.06, 0], [0, 0.06]], 0.0, 0.007); g.pop(); }
  });

  // ---- walls: dark fluted timber dado, warm plaster, stone pilasters, tall indigo panels between them
  const W = { t: T, tint: '#d2c3a5', dado: { h: 2.4, mat: 'flute', tint: '#5b3f2b' }, skirt: '#1f1610' };
  wall(s, X0 + T / 2, Z0, X0 + T / 2, Z1, 0, H, W);
  wall(s, X1 - T / 2, Z0, X1 - T / 2, Z1, 0, H, W);
  wall(s, X0, Z1 - T / 2, X1, Z1 - T / 2, 0, H, W);
  wall(s, X0, Z0 + T / 2, X1, Z0 + T / 2, 0, H, Object.assign({}, W, { openings: [{ at: 1.5, w: 33, h: 4 }] }));
  const bays = [[Z0 + T, 15.6], [16.4, 21.6], [22.4, 27.6], [28.4, Z1 - T]];
  for (const side of [-1, 1]) {
    const xw = side < 0 ? X0 + T : X1 - T, out = -side;            // out: +1 means the wall face looks toward +x
    s.structure(() => {
      // pilasters at the column lines, with a capital
      for (const z of [16, 22, 28]) {
        g.mat('plaster', STONE); g.box(Math.min(xw, xw + out * 0.24), 0, z - 0.4, Math.max(xw, xw + out * 0.24), H - 0.75, z + 0.4, { bevel: 0.02 });
        g.box(Math.min(xw, xw + out * 0.34), H - 1.05, z - 0.5, Math.max(xw, xw + out * 0.34), H - 0.75, z + 0.5, { bevel: 0.02 });
        g.mat('cast', BRASS); g.box(Math.min(xw, xw + out * 0.25), 2.35, z - 0.41, Math.max(xw, xw + out * 0.25), 2.45, z + 0.41);
      }
      // cornice above the dado band and at the top of the plaster
      for (const y of [4.4, 10.9]) { g.mat('stone', STONE); g.box(Math.min(xw, xw + out * 0.12), y, Z0 + T, Math.max(xw, xw + out * 0.12), y + 0.18, Z1 - T, { bevel: 0.01 }); g.box(Math.min(xw, xw + out * 0.06), y - 0.1, Z0 + T, Math.max(xw, xw + out * 0.06), y, Z1 - T); }
      // tall indigo panels with brass edging
      for (const b of bays) {
        const z0 = b[0] + 0.45, z1 = b[1] - 0.45; if (z1 - z0 < 1) continue;
        g.mat('paint', INDIGO); g.box(Math.min(xw, xw + out * 0.02), 4.9, z0, Math.max(xw, xw + out * 0.02), 10.4, z1);
        g.mat('cast', BRASS); for (const zz of [z0, z1 - 0.05]) g.box(Math.min(xw, xw + out * 0.04), 4.9, zz, Math.max(xw, xw + out * 0.04), 10.4, zz + 0.05);
        g.box(Math.min(xw, xw + out * 0.04), 4.85, z0, Math.max(xw, xw + out * 0.04), 4.9, z1); g.box(Math.min(xw, xw + out * 0.04), 10.4, z0, Math.max(xw, xw + out * 0.04), 10.45, z1);
      }
    });
  }
  // cloth banners on brass rods over the indigo panels, one word each
  const BAN = [[-1, 19, 'Shares', '#9e3d22'], [-1, 25, 'People', '#c9963a'], [-1, 32, 'The Margin', '#9e3d22'], [1, 19, 'Places', '#c9963a'], [1, 25, 'The Names', '#9e3d22'], [1, 32, 'Guests', '#c9963a']];
  for (const b of BAN) {
    const xw = b[0] < 0 ? X0 + T : X1 - T, out = -b[0], xf = xw + out * 0.1;
    painted(s, 'ledger.banner.' + b[2], 1.5, 4.2, 64, drawBanner(b[2], b[3]), xf, 7.45, b[1], { face: out > 0 ? 'X' : 'x' });
    s.deco(() => { g.mat('cast', BRASS, { rough: -0.2 }); g.tube([[xf, 9.6, b[1] - 0.9], [xf, 9.6, b[1] + 0.9]], 0.025, { segs: 6 }); for (const dz of [-0.9, 0.9]) { g.ball(xf, 9.6, b[1] + dz, 0.05, 0.05, 0.05, { segs: 8, rings: 5 }); g.tube([[xf, 9.6, b[1] + dz * 0.8], [xw, 9.9, b[1] + dz * 0.8]], 0.01, { segs: 4 }); }
      g.mat('cast', BRASS); g.tube([[xf, 5.33, b[1] - 0.76], [xf, 5.33, b[1] + 0.76]], 0.018, { segs: 5 }); });
  }
  // a long runner up the middle aisle
  s.deco(() => { g.mat('carpet', '#5a2024'); g.box(-0.8, 0.0, 14.0, 0.8, 0.012, 29.4, { faces: 'YxXzZ' }); g.mat('weave', '#a8823f'); for (const x of [-0.8, 0.68]) g.box(x, 0.0, 14.0, x + 0.12, 0.014, 29.4, { faces: 'Y' }); g.box(-0.8, 0.0, 14.0, 0.8, 0.014, 14.12, { faces: 'Y' }); g.box(-0.8, 0.0, 29.28, 0.8, 0.014, 29.4, { faces: 'Y' }); });

  // the south wall above the board, and the north wall above the mouth: indigo with a brass band
  s.structure(() => {
    g.mat('paint', INDIGO); g.box(X0 + T, 10.95, Z1 - T - 0.02, X1 - T, 11.3, Z1 - T, { faces: 'z' });
    g.mat('stone', STONE); g.box(X0 + T, 4.4, Z0 + T, X1 - T, 4.58, Z0 + T + 0.12, { bevel: 0.01 }); g.box(X0 + T, 10.9, Z0 + T, X1 - T, 11.08, Z0 + T + 0.12, { bevel: 0.01 });
    g.mat('paint', INDIGO); g.box(X0 + T + 1, 5.0, Z0 + T, X1 - T - 1, 10.4, Z0 + T + 0.02, { faces: 'Z' });
    g.mat('cast', BRASS); g.box(X0 + T + 1, 4.95, Z0 + T, X1 - T - 1, 5.0, Z0 + T + 0.04); g.box(X0 + T + 1, 10.4, Z0 + T, X1 - T - 1, 10.45, Z0 + T + 0.04);
  });
  // the mouth onto the platform: a timber lintel with the hall's name toward the platform
  s.furniture(() => {
    g.mat('wood', TIMBER); g.box(-16.5, 3.55, Z0 - 0.02, 16.5, 4.0, Z0 + 0.62, { bevel: 0.02 });
    g.mat('cast', BRASS); g.box(-16.5, 3.52, Z0 - 0.03, 16.5, 3.56, Z0 + 0.63);
    for (const x of [-16.6, 16.6]) { g.mat('stone', STONE); g.box(x - 0.35, 0, Z0, x + 0.35, 4.0, Z0 + 0.6, { bevel: 0.02 }); }
  });
  s.solid(-16.95, 0, Z0, -16.25, 4, Z0 + 0.6); s.solid(16.25, 0, Z0, 16.95, 4, Z0 + 0.6);
  sign(s, { kind: 'fascia', text: 'The Ledger', sub: 'shares · people · the Margin · the names', palette: ['#1f2b5c', '#f1e2b8', '#d6a640'] }, 0, 3.775, Z0 - 0.03, { face: 'z', w: 7, h: 0.4, board: false });

  // ---- ceiling: dark, with steel beams on the column lines, two big ducts, felt baffles in colours
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#2a2e33');
  s.structure(() => {
    g.mat('panel', '#4b5157');
    for (const z of [16, 22, 28, 34]) g.box(X0 + T, H - 0.75, z - 0.25, X1 - T, H, z + 0.25);
    for (const x of [-8.5, 8.5]) g.box(x - 0.22, H - 0.6, Z0 + T, x + 0.22, H, Z1 - T);
    g.mat('brushed', '#8d8f8a');
    for (const x of [-13, 13]) {
      g.tube([[x, 10.5, Z0 + T], [x, 10.5, Z1 - T]], 0.42, { segs: 16 });
    }
  });
  s.deco(() => {
    g.mat('brushed', '#8d8f8a');
    for (const x of [-13, 13]) for (let z = Z0 + 1.5; z < Z1 - 0.5; z += 2.2) { g.at(x, 10.5, z, 0); g.rotX(PI / 2); g.lathe(0, 0, [[0.445, -0.04], [0.445, 0.04]], { segs: 16 }); g.pop(); g.tube([[x, 10.94, z], [x, H - 0.75, z]], 0.02, { segs: 4 }); }
    g.mat('panel', '#3e444a'); for (const x of [-4.4, 4.4]) g.box(x - 0.2, 11.12, Z0 + T, x + 0.2, 11.18, Z1 - T);
    g.mat('brushed', '#6e6a62'); for (const x of [-4.4, 4.4]) for (const dx of [-0.17, 0, 0.17]) g.tube([[x + dx, 11.22, Z0 + T], [x + dx, 11.22, Z1 - T]], 0.025, { segs: 5, caps: false });
  });
  // felt baffles hung in long rows down the nave: from the mouth you see their edges march toward the board
  const fcols = [INDIGO, INDIGO, '#c9963a', INDIGO, INDIGO, '#8a3a2e'];
  for (const zs of [[12.6, 15.6], [16.4, 21.6], [22.4, 27.6], [28.4, 33.4]]) s.furniture(() => {
    let k = 0;
    for (let x = -7.2; x <= 7.21; x += 1.8) {
      const drop = 9.9 - 0.25 * Math.cos(x * 0.45);
      g.mat('felt', fcols[k++ % fcols.length]); g.box(x - 0.025, drop, zs[0], x + 0.025, 11.3, zs[1]);
      g.mat('brushed', '#5a5650'); for (const z of [zs[0] + 0.3, zs[1] - 0.3]) g.tube([[x, 11.3, z], [x, H - 0.6, z]], 0.006, { segs: 3, caps: false });
    }
    for (const x of [-15.8, -11.2, 11.2, 15.8]) { g.mat('felt', '#2b3560'); g.box(x - 0.025, 9.4, zs[0] + 0.2, x + 0.025, 11.0, zs[1] - 0.2); }
  });

  // ---- two rows of tall columns
  for (const x of [-8.5, 8.5]) for (const z of [16, 22, 28]) {
    column(s, x, 0, z, H - 0.75, { r: 0.38, tint: '#d2c6ad', mat: 'terrazzo' });
    s.deco(() => { g.mat('cast', BRASS, { rough: -0.2 }); g.lathe(x, z, [[0.4, 2.3], [0.43, 2.36], [0.43, 2.44], [0.4, 2.5]], { segs: 18 }); g.lathe(x, z, [[0.56, H - 0.95], [0.6, H - 0.9], [0.6, H - 0.82], [0.56, H - 0.78]], { segs: 18 }); });
  }

  // ---- the Ledger: x[-13.5, 13.5] y[1.2, 10.6] on the south wall
  const BZ = Z1 - T, FACEZ = BZ - 0.2;            // wall face; the painted face sits 0.2 proud of it
  s.furniture(() => {
    g.mat('plain', '#0b0f0e'); g.box(-13.05, 1.55, FACEZ, 13.05, 10.0, BZ, { faces: 'z' });
    g.mat('wood', TIMBER, { rough: -0.05 });
    g.box(-13.5, 9.95, FACEZ - 0.25, 13.5, 10.45, BZ, { bevel: 0.03 }); g.box(-13.5, 1.15, FACEZ - 0.25, 13.5, 1.6, BZ, { bevel: 0.03 });
    g.box(-13.5, 1.6, FACEZ - 0.25, -13.0, 9.95, BZ, { bevel: 0.03 }); g.box(13.0, 1.6, FACEZ - 0.25, 13.5, 9.95, BZ, { bevel: 0.03 });
    g.box(-13.85, 10.45, FACEZ - 0.42, 13.85, 10.7, BZ, { bevel: 0.03 });
    g.box(-13.6, 0, FACEZ - 0.1, 13.6, 1.15, BZ, { bevel: 0.02 });
    g.mat('cast', BRASS, { rough: -0.25 });
    g.box(-13.85, 10.4, FACEZ - 0.43, 13.85, 10.46, BZ); g.box(-13.6, 0, FACEZ - 0.12, 13.6, 0.16, FACEZ - 0.09);
    g.box(-13.0, 8.7, FACEZ - 0.06, 13.0, 8.8, FACEZ); g.box(-13.0, 5.9, FACEZ - 0.06, 13.0, 6.0, FACEZ);
    for (let i = 1; i < 8; i++) { const x = -13 + i * 3.25; g.box(x - 0.05, 6.0, FACEZ - 0.05, x + 0.05, 8.7, FACEZ); }
    for (let i = 1; i < 6; i++) { const x = -13 + i * 26 / 6; g.box(x - 0.06, 1.6, FACEZ - 0.05, x + 0.06, 5.9, FACEZ); }
    // rosettes on the frame
    for (const x of [-13.25, 13.25]) for (const y of [1.38, 10.2]) { g.at(x, y, FACEZ - 0.25, 0); g.rotX(PI / 2); g.lathe(0, 0, [[0.0, -0.07], [0.1, -0.065], [0.16, -0.03], [0.14, 0.0]], { segs: 16 }); g.pop(); }
    // the lamp rail: a brass trough under the board, its lit edge turned up at the panels
    g.mat('cast', BRASS, { rough: -0.2 }); g.box(-13.3, 1.18, FACEZ - 0.62, 13.3, 1.42, FACEZ - 0.25, { bevel: 0.02 });
    for (let x = -12.9; x < 13; x += 1.3) g.box(x - 0.03, 0.9, FACEZ - 0.3, x + 0.03, 1.2, FACEZ - 0.25);
    g.mat('diffuser', '#ffd9a0', { emissive: 4, lamp: true }); g.box(-13.2, 1.42, FACEZ - 0.55, 13.2, 1.44, FACEZ - 0.32, { faces: 'Y' });
  });
  s.solid(-13.6, 0, FACEZ - 0.62, 13.6, 1.45, BZ);
  // figures, by day; names; the Candlewick column. All painted into the atlas and redrawn as they change.
  const totals0 = dayTotals(game);
  const figureSpecs = (T, guests) => {
    const d3 = T === LEDGER.totals.bookingDay;
    return [
      ['SHARES', num(T.shares), 'the drum at par'],
      ['PEOPLE', num(T.people), 'living, tonight'],
      ['THE MARGIN', num(T.margin), d3 ? 'down 29,000 · 20,000 of it refuge' : 'kept since the Count', { hot: true }],
      ['PLACES', num(T.places), '(' + num(T.heldByDrum) + ' held by the drum)'],
      ['BORN THIS YEAR', num(T.born), 'each beside a share'],
      ['DIED THIS YEAR', num(T.died), 'each named again'],
      ['GUESTS TONIGHT', num(guests), 'on guest-right'],
      ['THIRD CHILDREN', 'one family / in seven', 'one in nine at the Count', { text: true }],
    ];
  };
  painted(s, 'ledger.title', 26, 0.9, 72, drawTitle('CHERVIL · HERB ROW', 'The Ledger', 'STATION RING 2 · DECK 1'), 0, 9.32, FACEZ, { face: 'z', glow: 0.35 });
  const figRects = []; const figDrawn = [];
  figureSpecs(totals0, guestsTonight(game)).forEach((c, i) => {
    const x = 13 - 3.25 * i - 1.625;
    figRects.push(painted(s, 'ledger.fig.' + i, 3.12, 2.6, 96, drawFigure(c[0], c[1], c[2], c[3]), x, 7.33, FACEZ, { face: 'z', glow: 0.45 }));
    figDrawn.push(c[1] + '|' + c[2]);
  });
  const born = LEDGER.names, holders = LEDGER.householders;
  const bornRow = (n, hot) => ({ a: n.born, b: 'for ' + n.for, hot });
  const AGO = ['', 'last year', 'two years'];
  const holdRow = (h, hot) => ({ a: h.holder, b: 'after ' + h.after + (h.gift ? ', a gift' : '') + (h.ago ? ', ' + AGO[h.ago] : ''), hot, dim: !!h.ago });
  const colX = (i) => 13 - (i + 0.5) * 26 / 6, CW = 26 / 6 - 0.16, CH = 4.2, CY = 3.76;
  const scroll = { born: 0, hold: 0 };
  const bornRows = () => { const r = []; for (let i = 0; i < 16; i++) r.push(bornRow(born[(scroll.born + i) % born.length], i === 0)); return r; };
  const holdRows = () => { const r = []; for (let i = 0; i < 16; i++) r.push(holdRow(holders[(scroll.hold + i) % holders.length], i === 0)); return r; };
  const NB = 'BORN · FOR THE SHARE OF', NBs = 'posted as they come in';
  const rBorn = painted(s, 'ledger.names.0', CW, CH, 88, drawNames(NB, NBs, bornRows()), colX(0), CY, FACEZ, { face: 'z', glow: 0.4 });
  painted(s, 'ledger.names.1', CW, CH, 88, drawNames('BORN · FOR', 'each newborn beside the share they carry', born.slice(40, 56).map((n) => bornRow(n))), colX(1), CY, FACEZ, { face: 'z', glow: 0.4 });
  painted(s, 'ledger.names.2', CW, CH, 88, drawNames('BORN · FOR', 'and usually named for them', born.slice(56, 72).map((n) => bornRow(n))), colX(2), CY, FACEZ, { face: 'z', glow: 0.4 });
  const NH = 'HOLDS · AFTER', NHs = 'each new householder beside the last';
  const rHold = painted(s, 'ledger.names.3', CW, CH, 88, drawNames(NH, NHs, holdRows()), colX(3), CY, FACEZ, { face: 'z', glow: 0.4 });
  painted(s, 'ledger.names.4', CW, CH, 88, drawNames('HOLDS · AFTER', 'older entries kept up a while', holders.slice(20, 40).filter((h, i) => i < 16).map((h) => holdRow(h))), colX(4), CY, FACEZ, { face: 'z', glow: 0.4 });
  painted(s, 'ledger.names.5', CW, CH, 88, drawBlocks(LEDGER.totals.block, BLOCKS), colX(5), CY, FACEZ, { face: 'z', glow: 0.55 });
  // the board changes: a new name every few seconds in one column or the other, the figures when the day turns,
  // and the guest line when you have signed in. One small redraw at a time.
  let tick = 0, which = 0, slow = 0;
  game.events.on('update', (dt) => {
    if (!game.atlas || game.player.frame !== f || !s.active) return;
    const p = game.player.pos; if (Math.abs(p.x) > 60 || p.z < -30 || p.z > 70) return;
    tick += dt; slow += dt;
    if (tick > 3.6) {
      tick = 0; which = 1 - which;
      if (which === 0 && rBorn) { scroll.born = (scroll.born + 1) % born.length; game.atlas.redraw(rBorn, drawNames(NB, NBs, bornRows())); }
      else if (rHold) { scroll.hold = (scroll.hold + 1) % holders.length; game.atlas.redraw(rHold, drawNames(NH, NHs, holdRows())); }
      return;
    }
    if (slow > 1.0) {
      slow = 0;
      const specs = figureSpecs(dayTotals(game), guestsTonight(game));
      for (let i = 0; i < specs.length; i++) {
        const k = specs[i][1] + '|' + specs[i][2];
        if (k !== figDrawn[i] && figRects[i]) { figDrawn[i] = k; game.atlas.redraw(figRects[i], drawFigure(specs[i][0], specs[i][1], specs[i][2], specs[i][3])); if (game.audio && i === 6) game.sfxAt('clunk', f, 6.5, 7, FACEZ); break; }
      }
    }
  });
  // light from below: a rail of uplights along the trough, and a soft wash
  for (let i = 0; i < 8; i++) s.light({ at: [-13 + 3.25 * i + 1.625, 1.45, FACEZ - 0.6], type: 'spot', dir: [0, 0.94, 0.34], cone: [72, 36], power: 9, range: 10.5, clip: [-14, 0, 30, 14, 11, Z1], lamp: true });

  // ---- the lean rail in front of the board: posts of brass, a timber rail, a foot rail; gaps to step through
  const RZ = 32.8;
  for (const seg of [[-12.6, -4.6], [-3.6, 3.6], [4.6, 12.6]]) {
    s.furniture(() => {
      g.mat('wood', '#4a2e1e', { rough: -0.1 }); g.box(seg[0], 1.0, RZ - 0.09, seg[1], 1.07, RZ + 0.09, { bevel: 0.025 });
      g.mat('cast', BRASS, { rough: -0.25 }); g.tube([[seg[0], 0.16, RZ - 0.05], [seg[1], 0.16, RZ - 0.05]], 0.022, { segs: 8 });
      const n = Math.max(1, Math.round((seg[1] - seg[0]) / 1.6));
      for (let k = 0; k <= n; k++) { const x = seg[0] + (seg[1] - seg[0]) * k / n; g.lathe(x, RZ, [[0.07, 0], [0.07, 0.03], [0.035, 0.06], [0.028, 0.95], [0.045, 1.0]], { segs: 10 }); }
    });
    s.solid(seg[0], 0, RZ - 0.1, seg[1], 1.07, RZ + 0.1);
  }

  // ---- benches facing the board, and long benches along the walls
  const benchSeats = [];
  for (const z of [17.6, 19.6, 21.6, 23.6, 25.6]) for (const x of [-3.4, 3.4]) {
    prop(s, 'bench', x, 0, z, 0, { w: 4.6, back: true, wood: z % 4 > 2 ? '#6b4a30' : '#7a5233', metal: '#2e2a26' }, { spot: { tags: ['ledger', 'bench'] } });
    benchSeats.push([x + (x < 0 ? 1.2 : -1.2), z]);
  }
  for (const side of [-1, 1]) for (const z of [18.5, 24.5]) prop(s, 'bench', side * 17.3, 0, z, side < 0 ? PI / 2 : -PI / 2, { w: 3.8, back: false, wood: '#5a3a26' }, { spot: { tags: ['ledger', 'bench'] } });
  for (const b of benchSeats.filter((_, i) => i % 3 === 0)) seatHere(s, b[0], 0, b[1], PI, 'Sit and read the board');
  seatHere(s, -17.3, 0, 24.5, PI / 2, 'Sit by the wall');

  // ---- the old Count board, on the west wall by the corner, with its plate, a picture lamp and a rope
  const CX = X0 + T;
  s.furniture(() => {
    g.mat('wood', '#3a2a1e', { rough: 0.15 }); g.box(CX, 2.25, 31.15, CX + 0.16, 5.05, 35.25, { bevel: 0.02 });
    g.mat('cast', '#6e5a36', { rough: 0.1 }); g.box(CX + 0.1, 5.05, 31.0, CX + 0.2, 5.12, 35.4);
  });
  painted(s, 'ledger.count', 3.8, 2.5, 108, drawCount(), CX + 0.165, 3.65, 33.2, { face: 'X', glow: 0.12 });
  painted(s, 'ledger.count.plate', 1.0, 0.56, 330, drawPlate('THE OLD COUNT BOARD', ['Chervil counted once, after a radiator fault,', 'about 340 years ago. It stopped births three or', 'four years too long, and came out 3% under par.', 'The assembly voted to keep the gap', 'and called it the Margin.'], { titleK: 0.18 }), CX + 0.02, 1.6, 33.2, { face: 'X' });
  s.furniture(() => {
    g.mat('cast', BRASS, { rough: -0.2 });
    for (const z of [31.4, 33.2, 35.0]) g.lathe(-16.4, z, [[0.12, 0], [0.12, 0.03], [0.03, 0.06], [0.025, 0.9], [0.05, 0.93], [0.03, 0.98], [0, 0.99]], { segs: 10 });
    g.mat('weave', '#8a2f3c'); for (const a of [[31.4, 33.2], [33.2, 35.0]]) { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([-16.4, 0.88 - 0.16 * 4 * t * (1 - t), a[0] + (a[1] - a[0]) * t]); } g.tube(pts, 0.022, { segs: 6 }); }
  });
  s.solid(-16.5, 0, 31.3, -16.3, 0.95, 35.1);
  lamp(s, 'strip', CX + 0.45, 5.35, 31.4, { to: [CX + 0.45, 5.35, 35.0], power: 0.55, K: 2700, clip: [X0, 0, 30.5, -13.6, 6, Z1] });
  s.deco(() => { g.mat('cast', BRASS); for (const z of [31.6, 34.8]) g.tube([[CX, 5.5, z], [CX + 0.45, 5.4, z]], 0.015, { segs: 5 }); });
  prop(s, 'bench', -15.0, 0, 33.2, -PI / 2, { w: 2.2, back: false, wood: '#5a3a26' }, { spot: { tags: ['ledger', 'countboard'] } });
  seatHere(s, -15.0, 0, 33.2, -PI / 2, 'Sit by the old board');

  // ---- the Keeper's desk, on a low dais by the east corner, with the ledgers behind it
  const DX0 = 13.7;
  block(s, DX0, 0, 30.9, X1 - T, 0.2, Z1 - T, 'planks', '#6a4630', { bevel: 0.015 });
  s.deco(() => { g.mat('cast', BRASS); g.box(DX0 - 0.01, 0.17, 30.89, X1 - T, 0.205, 30.92); g.box(DX0 - 0.01, 0.17, 30.9, DX0 + 0.02, 0.205, Z1 - T); });
  s.furniture(() => {
    g.mat('wood', '#3a2418', { rough: -0.05 }); g.box(14.3, 0.2, 32.2, 17.1, 0.96, 33.0, { bevel: 0.015 });
    g.mat('wood', '#4a2e1e'); for (let i = 0; i < 4; i++) g.box(14.4 + i * 0.68, 0.3, 32.18, 14.98 + i * 0.68, 0.86, 32.2, { bevel: 0.008 });
    g.mat('wood', '#5a3a26', { rough: -0.15 }); g.box(14.22, 0.96, 32.12, 17.18, 1.0, 33.08, { bevel: 0.012 });
    g.mat('leather', '#2f4a3a'); g.box(14.5, 1.0, 32.3, 16.9, 1.004, 32.9, { faces: 'Y' });
  });
  s.solid(14.22, 0.2, 32.12, 17.18, 1.0, 33.08);
  prop(s, 'chair', 15.7, 0.2, 33.65, PI, { wood: '#3a2418', back: 'slat', seat: '#2f4a3a' }, { noSpots: true });
  prop(s, 'station.ledgers', 14.7, 1.004, 32.65, 0.2, { n: 5, seed: 2 });
  prop(s, 'station.ledgers', 16.75, 1.004, 32.75, -0.3, { n: 3, seed: 5 });
  prop(s, 'station.openBook', 15.7, 1.004, 32.55, 0, { cover: '#3a2418' });
  prop(s, 'station.bell', 15.15, 1.004, 32.4, 0, {});
  prop(s, 'station.deskLamp', 16.35, 1.004, 32.85, PI + 0.4, { shade: '#2f7a4a' });
  lamp(s, 'bulb', 16.25, 1.3, 32.7, { power: 0.45, K: 2600, range: 3.5, clip: [DX0 - 0.5, 0, 30.5, X1, 3, Z1] });
  prop(s, 'cup', 16.6, 1.004, 32.45, 0, { glaze: '#2f6f73' });
  sign(s, spec('ledger.keeper'), 15.7, 0.7, 32.18, { face: 'z', w: 0.5, h: 0.2 });
  s.spot('counter', 15.7, 0.2, 33.7, 0, { tags: ['ledger', 'keeper'], who: 'agathe' });
  // shelves of old ledgers on the east wall behind the desk
  prop(s, 'shelving', X1 - T - 0.17, 0.2, 33.3, -PI / 2, { w: 3.6, h: 2.5, shelves: 5, wood: '#3a2418' });
  s.detail(() => {
    const r = new Rng(77); const cols = ['#6b2a22', '#2a3a5c', '#3e4a2a', '#5a3a22', '#1e2a2a', '#7a5a2a'];
    for (let k = 0; k < 5; k++) {
      const y = 0.2 + 0.08 + k * (2.5 - 0.11) / 5 + 0.025; let z = 31.6;
      while (z < 35.0) {
        const t = r.f(0.05, 0.09), hh = r.f(0.32, 0.4); if (r.chance(0.06)) { z += 0.12; continue; }
        g.mat('leather', cols[r.i(0, cols.length - 1)]); g.box(X1 - T - 0.3, y, z, X1 - T - 0.04, y + hh, z + t - 0.006, { bevel: 0.004 });
        g.mat('cast', '#b48c48'); g.box(X1 - T - 0.305, y + hh * 0.75, z + 0.005, X1 - T - 0.3, y + hh * 0.8, z + t - 0.01, { faces: 'x' });
        z += t;
      }
    }
  });

  // ---- tea for the visitors from Rue, by the door
  prop(s, 'station.urnTrolley', -14.6, 0, 14.4, PI / 2, {});
  sign(s, spec('ledger.tea'), X0 + T + 0.02, 1.65, 14.4, { face: 'X' });
  s.spot('stand', -12.6, 0, 16.4, PI, { tags: ['ledger', 'notes'], who: 'hollis' });
  s.spot('stand', -11.8, 0, 16.7, PI, { tags: ['ledger', 'notes'], who: 'yusra' });
  s.spot('work', -13.9, 0, 14.4, -PI / 2, { tags: ['ledger', 'tea'] });

  // ---- what the Ledger shows, the programme, the posters
  painted(s, 'ledger.six', 1.1, 0.82, 280, drawPlate('WHAT THE LEDGER SHOWS', ['Shares', 'People', 'The Margin', 'Places, and those the drum holds', 'Born and died this year', 'Guests tonight', 'and the names, two by two'], { titleK: 0.15 }), X1 - T - 0.02, 1.55, 26.0, { face: 'x' });
  sign(s, spec('ledger.programme'), X1 - T - 0.02, 1.55, 24.6, { face: 'x' });
  sign(s, spec('ledger.margin.plate'), 0, 0.7, FACEZ - 0.11, { face: 'z', w: 0.6, h: 0.22 });
  const posters = [['poster.booking', -1, 18.2], ['poster.feast', -1, 19.0], ['poster.flight', -1, 19.8], ['poster.dawn', -1, 24.6], ['poster.homecoming', -1, 25.4], ['poster.fund', 1, 18.2], ['poster.sun', 1, 19.0], ['poster.choir', 1, 19.8]];
  for (const p of posters) {
    const xw = p[1] < 0 ? X0 + T + 0.02 : X1 - T - 0.02;
    s.deco(() => { g.mat('wood', '#3a2a1e'); g.box(Math.min(xw, xw - p[1] * 0.03), 1.08, p[2] - 0.34, Math.max(xw, xw - p[1] * 0.03), 2.02, p[2] + 0.34, { bevel: 0.006 }); });
    sign(s, SIGNS[p[0]], xw - p[1] * 0.031, 1.55, p[2], { face: p[1] < 0 ? 'X' : 'x', board: false });
  }

  // ---- things people have left on the benches: a cup, a shawl, a basket, a hat
  prop(s, 'cup', -4.2, 0.46, 19.62, 0, { glaze: '#2f6f73' }); prop(s, 'cup', 2.1, 0.46, 23.6, 0, { glaze: '#c9552e' }); prop(s, 'cup', 5.3, 0.46, 17.55, 0, { open: true, drink: '#7a4a2a' });
  prop(s, 'station.basket', -2.3, 0.46, 21.62, 0, { c: '#d8352a', r: 0.18 }); prop(s, 'station.bag', 4.6, 0.46, 25.62, 0.3, { c: '#7a3a2a' });
  s.detail(() => { g.mat('weave', '#c9963a'); g.box(-5.2, 0.46, 23.45, -4.5, 0.5, 23.75, { bevel: 0.03 }); g.mat('weave', '#8a2f3c'); g.box(-5.25, 0.5, 23.5, -4.6, 0.52, 23.7, { bevel: 0.01 }); g.mat('weave', '#3a2a22'); g.lathe(1.2, 17.6, [[0, 0.46], [0.17, 0.46], [0.17, 0.47], [0.1, 0.48], [0.1, 0.56], [0.08, 0.58], [0, 0.58]], { segs: 12 }); });
  // ---- plants under the side lamps, and a stand of umbrellas' cousin: a rack for wet coats does not exist here; a coat rail
  for (const pz of [[-17.2, 13.1], [17.2, 13.1]]) prop(s, 'plant', pz[0], 0, pz[1], 0, { kind: 'broad', size: 1.6, pot: '#8a3a2e' });
  for (const px of [-3.4, 3.4]) {
    planter(s, px, 0, 13.6, { w: 2.4, d: 0.5, h: 0.45, plants: 'fern', tint: '#8f8371', seed: px });
    s.deco(() => { g.mat('cast', BRASS); g.box(px - 1.22, 0.45, 13.33, px + 1.22, 0.48, 13.87); });
  }

  // ---- light: big pendant globes over the benches, sconces on the pilasters, the bounce of the room
  roomGlow(s, X0, 0, Z0, X1, H, Z1, { sky: '#ffd6a4', ground: '#b49870', power: 0.11 });
  for (const x of [-4.2, 4.2]) for (const z of [18.6, 24.6]) lamp(s, 'globe', x, 6.4, z, { r: 0.42, drop: H - 0.75 - 6.4, power: 2.4, glow: 0.9, range: 13, K: 2700, clip: CLIP });
  for (const side of [-1, 1]) for (const z of [19, 25]) lamp(s, 'sconce', side < 0 ? X0 + T + 0.02 : X1 - T - 0.02, 3.3, z, { face: side < 0 ? 'X' : 'x', power: 1.4, K: 2700, clip: CLIP });
  lamp(s, 'sconce', X0 + T + 0.02, 3.3, 14.2, { face: 'X', power: 1.0, K: 2700, clip: CLIP });
  lamp(s, 'sconce', X1 - T - 0.02, 3.3, 14.2, { face: 'x', power: 1.0, K: 2700, clip: CLIP });
  // the Candlewick column has its own little lamp, so it reads warmer
  lamp(s, 'spot', colX(5), 6.05, FACEZ - 0.45, { dir: [0, -0.5, 0.86], cone: [40, 18], power: 0.6, K: 2500, clip: [-14, 0, 30, -8, 7, Z1] });
  // a high wash on the vault so the felt reads
  s.light({ at: [0, 9.0, 24], to: [0, 9.0, 24], type: 'point', power: 7, range: 14, color: [1.0, 0.78, 0.55], clip: CLIP, lamp: true, nospec: true });

  // ---- people
  for (let x = -12.2; x <= 12.2; x += 0.85) { if (Math.abs(Math.abs(x) - 4.1) < 0.5) continue; s.spot('stand', x, 0, RZ - 0.42, PI, { tags: ['ledger', 'read'] }); }
  for (let x = -11.5; x <= 11.5; x += 1.15) s.spot('stand', x, 0, RZ - 1.45, PI, { tags: ['ledger', 'read'] });
  for (let x = -9; x <= 9; x += 1.8) s.spot('stand', x + 0.4, 0, RZ - 2.5, PI + (x * 0.02), { tags: ['ledger', 'read'] });
  for (const z of [32.0, 33.2, 34.4]) s.spot('stand', -14.9, 0, z, -PI / 2, { tags: ['ledger', 'read', 'countboard'] });
  const chat = (cx, cz, n, tags) => { for (let i = 0; i < n; i++) { const a = i / n * PI * 2; s.spot('chat', cx + Math.sin(a) * 0.6, 0, cz - Math.cos(a) * 0.6, a + PI, { tags }); } };
  chat(-11.5, 20.5, 3, ['ledger']); chat(11.4, 22.4, 3, ['ledger']); chat(10.5, 14.8, 2, ['ledger']); chat(-6.0, 29.3, 3, ['ledger']); chat(6.2, 28.8, 2, ['ledger']);
  s.path([[0, Z0], [0, 15], [0, 30.2]], { width: 2 });
  s.path([[-12.5, 15], [-7.1, 15], [0, 15], [7.1, 15], [12.5, 15]]);
  s.path([[-7.1, 15], [-7.1, 30.2]]); s.path([[7.1, 15], [7.1, 30.2]]);
  s.path([[-15.4, 30.5], [-12, 31.6], [-7.1, 30.2], [0, 30.2], [7.1, 30.2], [12, 31.6], [14.2, 30.5]]);
  s.path([[-12.5, 15], [-12.5, 27], [-12, 31.6]]); s.path([[12.5, 15], [12.5, 27], [12, 31.6]]);
  s.path([[-12.5, 15], [-13.6, 15.4]]);
  s.path([[-4.1, 30.2], [-4.1, 34.2], [4.1, 34.2], [4.1, 30.2]], { width: 0.9 });

  // ---- things to do
  const LEDGER_SPK = { name: 'The Ledger', colour: '#d6a640' };
  s.interact({ x: 0, y: 1.6, z: RZ + 0.4, radius: 2.4, wide: true, prompt: 'Read the figures', onUse: async (game) => {
    const T = dayTotals(game), d3 = T === LEDGER.totals.bookingDay;
    await tell(game, LEDGER_SPK, [
      'Shares, ' + num(T.shares) + '. People, ' + num(T.people) + '. The Margin, ' + num(T.margin) + '.',
      'Places, ' + num(T.places) + ', and ' + num(T.heldByDrum) + ' of them held by the drum: guest flats, refuge, studios, first homes lent to young couples, homes for life for the placeless.',
      'Born this year, ' + num(T.born) + '. Died, ' + num(T.died) + '. Guests tonight, ' + num(guestsTonight(game)) + '.',
      d3 ? 'The Margin line reads 29,000 lower than last year, and 20,000 of that is refuge. People cheer it anyway.' : 'The woman beside you reads the Margin line under her breath, the way you would check a clock before a walk.',
    ]);
    found(game, 'margin'); found(game, 'held-places');
  } });
  s.interact({ x: colX(0), y: 1.6, z: RZ + 0.4, radius: 2.4, wide: true, prompt: 'Read the names as they come up', onUse: async (game) => {
    const a = born[scroll.born % born.length], b = born[(scroll.born + 1) % born.length];
    await tell(game, LEDGER_SPK, ['Each newborn stands beside the dead whose share they carry, and is usually named for them.', a.born + ', for ' + a.for + '. ' + b.born + ', for ' + b.for + '.', "The dead's family brings a gift to the naming. Every birth closes someone's funeral."]);
    found(game, 'two-names');
  } });
  s.interact({ x: colX(3), y: 1.6, z: RZ + 0.4, radius: 2.0, wide: true, prompt: 'Read the householders', onUse: async (game) => {
    const h = holders[scroll.hold % holders.length];
    await tell(game, LEDGER_SPK, ['Each new householder beside the dead whose place they took. A place is a home of about 78 square metres, passed whole to one heir.', h.holder + ', after ' + h.after + '.', 'Two are marked as gifts: Petra Lindau after Oskar Wendt, Samuel Oyo after Hester Grange. Someone with no children gave a young couple their home, and their share, and their name.']);
    found(game, 'householders');
  } });
  s.interact({ x: colX(5), y: 1.6, z: RZ + 0.4, radius: 2.0, wide: true, prompt: 'Read the Candlewick column', onUse: async (game) => {
    const B = LEDGER.totals.block;
    await tell(game, LEDGER_SPK, ['Candlewick, ' + num(B.people) + ' people. Born this year ' + B.born + ', died ' + B.died + '. Room for thirds ' + B.room + ', thirds given ' + B.thirdsGiven + '.', 'Square with its room. Two lines down, Hassock has given three against one of room, and people reading it go quiet in a particular way.', 'At the Count one family in nine had a third child. Now it is one in seven.']);
    found(game, 'third-line');
  } });
  s.interact({ x: -16.6, y: 1.5, z: 33.2, radius: 2.0, wide: true, prompt: 'Read the plate under the old board', onUse: async (game) => {
    await tell(game, { name: 'The Count board', colour: '#b8ad8e' }, ['THE COUNT. People over shares. Births this year: none. Permits issued: none. Under par: 6,000,000.', 'Chervil counted once, after a radiator fault, about 340 years ago. It stopped births three or four years too long and came out 3% under par.', 'The assembly voted to keep the gap and called it the Margin. The old board was hung here so people would remember why.']);
    found(game, 'count-board');
  } });
  s.interact({ x: 15.7, y: 1.2, z: 32.0, radius: 1.8, kind: 'talk', prompt: 'Ask the Keeper how she came to keep the Ledger', onUse: async (game) => {
    await tell(game, AGATHE, ['Have you eaten? Good. Sit down if you want; the benches face the board for a reason.', 'Thirty years. I have no children and no place, and in Chervil that makes you useful. Crews, stewards, cooks, aunts, keepers. Nobody thinks of it as a consolation.', 'On Booking Day I read the year\'s first name and its last from this desk. Without a card. Every year somebody checks, and every year I have them right.']);
    found(game, 'keeper');
  } });
  s.interact({ x: 15.15, y: 1.1, z: 32.4, radius: 1.2, prompt: 'Look at the steel bell', onUse: async (game) => {
    await tell(game, null, ["A small steel bell on a turned stand. On Booking Day the Keeper rings it once before the reading, and in heliox it rings high and thin, and the whole hall hears it."]);
    if (game.sfxAt) game.sfxAt('bell', f, 15.15, 1.1, 32.4, { vol: 0.3 });
  } });
  s.interact({ x: -12.2, y: 1.5, z: 16.5, radius: 1.8, kind: 'talk', prompt: (game) => (game.clock && game.clock.day >= 3 ? 'Ask the two at the back what they are writing' : 'Read the note by the urn'), onUse: async (game) => {
    if (game.clock && game.clock.day >= 3) await tell(game, { name: 'Yusra', colour: '#c9a24a' }, ['Numbers. Yours.', { s: { name: 'Hollis', colour: '#9a2a2a' }, t: "We're from Rue. Fourteen years from par, and some of us would like a Margin of our own when we get there." }, 'Somebody here brings us tea every year. We write that down too.']);
    else await tell(game, null, ['Visitors from Rue. Tea is by the door. Notebooks welcome.', "Rue's councillors come every Booking Day and stand at the back with notebooks. Rue is a counted drum, about fourteen years from par."]);
    found(game, 'rue-notebooks');
  } });
  s.interact({ x: -14.4, y: 1.1, z: 14.4, radius: 1.4, prompt: 'Pour a cup of tea from the urn', onUse: async (game) => {
    if (game.sfxAt) game.sfxAt('pour', f, -14.6, 1.0, 14.4);
    flags(game).hadTea = true;
    await tell(game, null, ['Somebody keeps this urn full. The cups have lids, as everything here does, because heliox takes the heat out of a cup four times faster than air.']);
  } });
  s.interact({ x: X1 - T - 0.3, y: 1.5, z: 25.3, radius: 1.6, prompt: 'Read the plaque and the programme', onUse: async (game) => {
    await tell(game, null, ['What the Ledger shows: shares, people, the Margin, places and those the drum holds, born and died this year, guests tonight. And the names, two by two.', 'Booking Day: six o\'clock, dawn from the back terraces. Half past eight, the Ledger is read here. Ten, the booking and the question. One, the feast. Five, the vote. Ten at night, the Long Flight.']);
  } });
  // the reading itself: be here on Booking Day morning
  s.trigger({ box: [X0, -0.5, Z0, X1, 4, Z1], onEnter(game) {
    if (game.clock && game.clock.day >= 3 && game.clock.hours > 8.2 && game.clock.hours < 11) found(game, 'refuge');
  } });

  // ---- sound, started the first time you come in
  let loops = null;
  game.events.on('zone', (e) => {
    if (loops || !e || !e.zone || e.zone.scope !== s) return;
    loops = [game.loopAt('murmur', f, 0, 1.6, 26, { vol: 0.55, radius: 22, param: 0.6 }), game.loopAt('air', f, -13, 10.5, 24, { vol: 0.25, radius: 16 })];
  });
  s.zoneBox({ id: 'ledger', place: 'ledger', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The Ledger hall', sub: 'Station Ring 2', ambience: 'station', reverb: 'station', headroom: 12 });
  s.finish();
}

// =====================================================================================================================
// The guest desk: x[-30, -20] z[12, 20], an alcove of warm wood off the platform.
// =====================================================================================================================
function buildDesk(game, f) {
  const s = game.world.scope('guestdesk', f), g = s.g;
  const X0 = -30, X1 = -20, Z0 = 12, Z1 = 20, H = 4;
  const clip = room(s, { x0: X0, z0: Z0, x1: X1, z1: Z1, y: 0, h: H, floor: ['planks', '#9a6b45'], ceil: ['paint', '#d8c6a2'],
    wall: { tint: '#e2c58e', dado: { h: 1.1, mat: 'wood', tint: '#6a4128' }, skirt: '#3a2418' }, open: { n: [{ at: 0.55, w: 8.9, h: 3.3 }] },
    glow: { sky: '#ffd6a0', ground: '#a8784a', power: 0.24 } });
  const CL = [X0, -0.2, Z0 - 1.5, X1, H + 0.1, Z1];
  sign(s, spec('guestdesk.fascia'), -25, 3.65, Z0 - 0.03, { face: 'z', w: 4.2, h: 0.55 });
  s.structure(() => {
    g.mat('paint', '#2f5a62'); g.box(X0 + 0.16, 3.3, Z0 - 0.02, X1 - 0.16, 4.0, Z0 + 0.01, { faces: 'z' });
    // beams
    g.mat('wood', '#4a2e1e'); for (let x = X0 + 1.2; x < X1 - 0.5; x += 1.6) g.box(x - 0.09, H - 0.24, Z0 + 0.16, x + 0.09, H, Z1 - 0.16);
    g.box(X0 + 0.16, H - 0.3, Z0 + 0.16, X1 - 0.16, H, Z0 + 0.4);
    // a picture rail and a painted teal band
    g.mat('paint', '#2f6f73'); for (const side of [[X0 + 0.16, 1], [X1 - 0.16, -1]]) g.box(Math.min(side[0], side[0] + side[1] * 0.01), 2.65, Z0 + 0.3, Math.max(side[0], side[0] + side[1] * 0.01), 2.85, Z1 - 0.16);
    g.box(X0 + 0.16, 2.65, Z1 - 0.17, X1 - 0.16, 2.85, Z1 - 0.16);
    g.mat('wood', '#4a2e1e'); for (const side of [[X0 + 0.16, 1], [X1 - 0.16, -1]]) g.box(Math.min(side[0], side[0] + side[1] * 0.04), 2.85, Z0 + 0.3, Math.max(side[0], side[0] + side[1] * 0.04), 2.9, Z1 - 0.16);
  });
  s.deco(() => { g.mat('rush', '#b5915e'); g.box(-28.6, 0.002, 13.2, -21.4, 0.012, 15.6, { faces: 'YxXzZ' }); g.mat('weave', '#8a2f3c'); g.box(-28.6, 0.002, 13.2, -21.4, 0.014, 13.32, { faces: 'Y' }); g.box(-28.6, 0.002, 15.48, -21.4, 0.014, 15.6, { faces: 'Y' }); });

  // the counter: honey wood, panelled, a guest book on a slope, a flap at the east end
  const CZ0 = 15.8, CZ1 = 16.45, CH = 1.0;
  s.furniture(() => {
    g.mat('wood', '#7a4a2a'); g.box(-27.4, 0.1, CZ0 + 0.03, -21.4, CH - 0.05, CZ1);
    g.mat('wood', '#4a2e1e'); g.box(-27.35, 0, CZ0 + 0.08, -21.45, 0.1, CZ1 - 0.05);
    g.mat('wood', '#9a6238'); for (let i = 0; i < 8; i++) g.box(-27.3 + i * 0.73, 0.18, CZ0 + 0.015, -26.65 + i * 0.73, CH - 0.15, CZ0 + 0.03, { bevel: 0.01 });
    g.mat('wood', '#b98656', { rough: -0.12 }); g.box(-27.48, CH - 0.05, CZ0 - 0.08, -21.32, CH, CZ1 + 0.04, { bevel: 0.015 });
    // the lectern for the book
    g.mat('wood', '#7a4a2a'); g.at(-25.0, CH + 0.09, (CZ0 + CZ1) / 2, 0); g.rotX(-0.27); g.box(-0.62, -0.1, -0.33, 0.62, -0.012, 0.33, { bevel: 0.01 }); g.pop();
    // the half wall behind the west end, to keep the keeper's side
    g.mat('wood', '#7a4a2a'); g.box(-27.52, 0, CZ1, -27.36, 1.1, Z1 - 0.16); g.mat('wood', '#b98656'); g.box(-27.56, 1.1, CZ1, -27.32, 1.14, Z1 - 0.16, { bevel: 0.008 });
  });
  s.solid(-27.48, 0, CZ0 - 0.08, -21.32, CH, CZ1 + 0.04); s.solid(-27.56, 0, CZ1, -27.32, 1.14, Z1 - 0.16);
  s.detail(() => {
    // the guest book open on the slope, its pen on a chain, a brass inkwell
    g.at(-25.0, CH + 0.115, (CZ0 + CZ1) / 2, 0); g.rotX(-0.27);
    g.mat('leather', '#5a2a1e'); g.box(-0.42, -0.012, -0.29, 0.42, 0.0, 0.29, { bevel: 0.004 });
    g.mat('paper', '#f1e7cf'); g.box(-0.4, 0.0, -0.27, -0.01, 0.025, 0.27, { bevel: 0.003 }); g.box(0.01, 0.0, -0.27, 0.4, 0.025, 0.27, { bevel: 0.003 });
    g.mat('plain', '#3a3028'); for (let i = 0; i < 11; i++) { const w = 0.12 + (i * 37 % 11) / 40; g.box(-0.36, 0.0262, -0.23 + i * 0.042, -0.36 + w, 0.0268, -0.225 + i * 0.042, { faces: 'Y' }); if (i < 7) g.box(0.05, 0.0262, -0.23 + i * 0.042, 0.05 + w * 0.8, 0.0268, -0.225 + i * 0.042, { faces: 'Y' }); }
    g.pop();
    g.mat('cast', '#b08a45'); g.lathe(-24.25, 16.25, [[0, CH], [0.05, CH], [0.055, CH + 0.04], [0.03, CH + 0.06], [0, CH + 0.06]], { segs: 12 });
    g.mat('plain', '#1e1c1a'); g.tube([[-24.4, CH + 0.02, 16.05], [-24.15, CH + 0.08, 16.18]], 0.006, { segs: 5 });
    g.mat('cast', '#b08a45'); g.tube([[-24.4, CH + 0.02, 16.05], [-24.5, CH + 0.005, 16.0], [-24.6, CH + 0.03, 16.08], [-24.68, CH + 0.12, 16.15]], 0.002, { segs: 3 });
    // chits, a stamp, a vase with a sprig
    g.mat('paper', '#efe0b8'); g.box(-23.6, CH, 16.0, -23.32, CH + 0.03, 16.18, { bevel: 0.002 });
    g.mat('wood', '#3a2418'); g.cyl(-23.1, CH, 16.1, 0.035, 0.07, { segs: 8 }); g.mat('plain', '#2a2a2a'); g.box(-23.15, CH, 16.25, -23.0, CH + 0.015, 16.35);
    g.mat('glaze', '#2f6f73'); g.lathe(-26.6, 16.15, [[0, CH], [0.05, CH], [0.06, CH + 0.08], [0.035, CH + 0.16], [0.04, CH + 0.18], [0.03, CH + 0.18]], { segs: 12 });
    g.mat('leafB', '#cfe8a0', { sway: 0.4 }); g.card(-26.6, CH + 0.15, 16.15, 0.2, 0.26, 0.4); g.card(-26.6, CH + 0.15, 16.15, 0.2, 0.24, 1.9);
  });
  prop(s, 'station.deskLamp', -22.0, CH, 16.2, PI + 0.5, { shade: '#c9963a' });
  lamp(s, 'bulb', -22.1, CH + 0.3, 16.0, { power: 0.5, K: 2600, range: 3.5, clip: CL });
  sign(s, spec('guestdesk.questions'), -25, 0.62, CZ0 - 0.001, { face: 'z', w: 0.62, h: 0.24 });
  s.spot('counter', -25, 0, 17.0, 0, { tags: ['guestdesk', 'keeper'], who: 'sefa' });
  s.spot('work', -22.3, 0, 19.2, PI, { tags: ['guestdesk', 'kettle'] });

  // the back wall: brass key tags by block and deck, today's draw, a shelf with the kettle
  prop(s, 'station.keyBoard', -26.0, 1.15, Z1 - 0.17, PI, { rows: 6, cols: 14 });
  painted(s, 'guestdesk.keys', 1.4, 0.22, 260, drawPlate('MARGIN FLAT KEYS', ['by block and deck · a gap is out on loan'], { titleK: 0.45 }), -26.0, 2.7, Z1 - 0.2, { face: 'z' });
  sign(s, spec('guestdesk.draw'), -22.55, 1.85, Z1 - 0.17, { face: 'z', w: 1.3, h: 0.9 });
  s.furniture(() => {
    g.mat('wood', '#7a4a2a'); g.box(-23.6, 0.95, Z1 - 0.5, -21.0, 0.99, Z1 - 0.16, { bevel: 0.01 });
    for (const x of [-23.5, -21.1]) g.box(x - 0.03, 0.75, Z1 - 0.3, x + 0.03, 0.95, Z1 - 0.17);
  });
  s.detail(() => {
    g.mat('brushed', '#c4c0b8', { rough: -0.2 }); g.lathe(-21.5, Z1 - 0.32, [[0, 0.99], [0.09, 0.99], [0.1, 1.02], [0.095, 1.18], [0.07, 1.22], [0.03, 1.23], [0.02, 1.26], [0, 1.26]], { segs: 14 });
    g.tube([[-21.42, 1.18, Z1 - 0.32], [-21.33, 1.2, Z1 - 0.32], [-21.33, 1.06, Z1 - 0.32], [-21.41, 1.03, Z1 - 0.32]], 0.012, { segs: 5 });
    g.tube([[-21.6, 1.14, Z1 - 0.32], [-21.7, 1.18, Z1 - 0.32]], 0.012, { segs: 5 });
    g.mat('cast', '#2f6f73'); g.box(-22.05, 0.99, Z1 - 0.42, -21.85, 1.17, Z1 - 0.24, { bevel: 0.01 });
  });
  for (let i = 0; i < 4; i++) prop(s, 'cup', -23.3 + i * 0.13, 0.99, Z1 - 0.34, 0, { glaze: ['#e9e1cf', '#c9552e', '#2f6f73', '#d9b25c'][i] });

  // the west wall: threads and notes from home drums, pinned on cork, in a nook beside the counter
  const TW = X0 + 0.16;
  s.furniture(() => { g.mat('wood', '#4a2e1e'); g.box(TW, 1.15, 16.55, TW + 0.05, 2.65, 19.75, { bevel: 0.01 }); g.mat('rush', '#c49a62'); g.box(TW + 0.05, 1.2, 16.6, TW + 0.07, 2.6, 19.7, { faces: 'X' }); });
  const pinned = (gg, r, x0, x1, y0, y1, n) => {
    const cols = ['#f1e7cf', '#f3d98a', '#cfe3d8', '#f2b8a8', '#d8d0f0', '#ffffff'], th = ['#c8243a', '#2f6f73', '#e8c242', '#3a7a4a', '#8a2f3c', '#26306b', '#e8743b', '#7a2a5a'];
    for (let i = 0; i < n; i++) {
      const z = r.f(x0, x1), y = r.f(y0, y1), w = r.f(0.08, 0.16), h = r.f(0.1, 0.18), a = r.f(-0.12, 0.12);
      if (r.chance(0.55)) { gg.mat('paper', cols[r.i(0, cols.length - 1)]); gg.at(TW + 0.075, y, z, PI / 2); gg.rotZ(a); gg.box(-w / 2, -h, 0, w / 2, 0, 0.002 + i * 0.0001); gg.pop(); }
      const c = th[r.i(0, th.length - 1)]; const len = r.f(0.12, 0.4); gg.mat('weave', c);
      gg.tube([[TW + 0.08, y, z], [TW + 0.09, y - len * 0.5, z + r.f(-0.03, 0.03)], [TW + 0.085, y - len, z + r.f(-0.05, 0.05)]], 0.0035, { segs: 3 });
      gg.ball(TW + 0.085, y - len * 0.35, z, 0.008, 0.008, 0.008, { segs: 5, rings: 3 });
      gg.mat('cast', '#c9a45c'); gg.ball(TW + 0.085, y, z, 0.007, 0.007, 0.007, { segs: 5, rings: 3 });
    }
  };
  s.detail(() => pinned(g, new Rng(42), 16.75, 19.55, 1.4, 2.55, 70));
  const notes = [
    [{ kind: 'notice', hand: true, title: 'From Dulse', lines: ['Thirty-seven light', 'seconds out. Three', 'nights. Best jook on', 'the Row. Sorry, Sorrel.'] }, 17.1, 2.25],
    [{ kind: 'notice', hand: true, title: 'Tansy, leg nine', lines: ['Ate a strawberry.', 'Cried a bit.', 'Worth it.'] }, 17.9, 1.6],
    [{ kind: 'notice', hand: true, title: 'Legs so far: 11', lines: ['Twelve kays in fares.', 'My boots cost more.', 'Keep going.'] }, 18.75, 2.2],
    [{ kind: 'notice', hand: true, title: 'Spelt', lines: ['If you know Pell,', 'you know where', 'to eat in Chervil.'] }, 19.35, 1.55],
  ];
  for (const n of notes) sign(s, n[0], TW + 0.085, n[2], n[1], { face: 'X', w: 0.2, h: 0.28, board: false, tier: 'd' });
  // a bench for whoever is waiting, with their bags
  prop(s, 'bench', X0 + 0.5, 0, 14.0, PI / 2, { w: 2.6, back: true, wood: '#7a4a2a' }, { spot: { tags: ['guestdesk', 'wait'] } });
  seatHere(s, X0 + 0.5, 0, 14.0, PI / 2, 'Sit on the guests\' bench');
  prop(s, 'station.bag', X0 + 0.5, 0.46, 13.0, PI / 2 + 0.2, { c: '#5a6a3a' });
  prop(s, 'station.bag', X0 + 1.1, 0, 15.6, 0.6, { c: '#7a3a2a' });
  prop(s, 'plant', X1 - 0.5, 0, 12.6, 0, { kind: 'fern', size: 1.3, pot: '#2f6f73' });
  prop(s, 'plant', X0 + 0.55, 0, 16.0, 0, { kind: 'broad', size: 1.1, pot: '#c9963a' });

  // the compact: a framed list of the drums that grant guest-right along the Row, high on the back wall
  painted(s, 'guestdesk.compact', 1.3, 0.62, 230, drawPlate('GUEST-RIGHT, BOTH WAYS', ['Any traveller from a drum that grants the same', 'may stay three nights in a Margin flat', 'and eat at the halls.', 'Sorrel · Spelt · Dulse · Kittiwake · and most of the Row'], { titleK: 0.2, a: '#e8dcc0', b: '#f6eedc', c: '#dccfae', ink: '#3a2a1a' }), -28.6, 3.25, Z1 - 0.19, { face: 'z' });
  s.deco(() => { g.mat('wood', '#3a2418'); g.box(-29.3, 2.9, Z1 - 0.18, -27.9, 3.6, Z1 - 0.16, { bevel: 0.006 }); });
  // a coat rail with coats and bags left while their owners eat
  s.furniture(() => {
    g.mat('wood', '#4a2e1e'); g.box(-29.0, 1.75, Z1 - 0.2, -27.7, 1.82, Z1 - 0.16);
    g.mat('cast', '#b08a45'); for (let i = 0; i < 5; i++) g.tube([[-28.9 + i * 0.3, 1.78, Z1 - 0.18], [-28.9 + i * 0.3, 1.8, Z1 - 0.3]], 0.012, { segs: 4 });
    const cc = ['#5a6a3a', '#7a3a2a', '#26306b', '#c9963a']; for (let i = 0; i < 3; i++) { g.mat('weave', cc[i], { sway: 0.15 }); g.sheet([-28.9 + i * 0.6 - 0.2, 1.78, Z1 - 0.3], [-28.9 + i * 0.6 + 0.2, 1.78, Z1 - 0.3], [-28.9 + i * 0.6 + 0.26, 0.85, Z1 - 0.34], [-28.9 + i * 0.6 - 0.26, 0.85, Z1 - 0.34], { ripple: 0.04, nu: 3, nv: 5 }); }
  });
  prop(s, 'station.bag', -28.3, 0, Z1 - 0.5, 0.3, { c: '#26306b' });

  // the east wall: a map of Candlewick, the notices, a rack of blank cards home
  painted(s, 'guestdesk.map', 1.5, 1.05, 190, drawMap(), X1 - 0.21, 1.85, 17.6, { face: 'x' });
  s.deco(() => { g.mat('wood', '#3a2418'); g.box(X1 - 0.2, 1.3, 16.82, X1 - 0.16, 2.4, 18.38, { bevel: 0.006 }); });
  sign(s, spec('guestdesk.notice'), X1 - 0.17, 1.65, 13.4, { face: 'x' });
  sign(s, spec('guestdesk.stay'), X1 - 0.17, 1.65, 13.85, { face: 'x' });
  s.furniture(() => {
    g.mat('wood', '#6a4128'); g.box(X1 - 0.42, 0.95, 14.5, X1 - 0.16, 1.75, 15.6, { bevel: 0.01 });
    g.mat('wood', '#3a2418'); for (let k = 0; k < 4; k++) g.box(X1 - 0.42, 0.97 + k * 0.2, 14.52, X1 - 0.17, 0.99 + k * 0.2, 15.58);
    for (let k = 0; k < 5; k++) g.box(X1 - 0.42, 0.97, 14.52 + k * 0.265, X1 - 0.17, 1.73, 14.54 + k * 0.265);
  });
  s.detail(() => { const r = new Rng(8); for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) { const n = r.i(2, 6); for (let i = 0; i < n; i++) { g.mat('paper', ['#f4ecd8', '#efe0b8', '#e8d9c0'][i % 3]); g.box(X1 - 0.4 + i * 0.012, 1.0 + k * 0.2, 14.58 + j * 0.265, X1 - 0.39 + i * 0.012, 1.14 + k * 0.2, 14.76 + j * 0.265); } } });
  painted(s, 'guestdesk.cards', 0.8, 0.14, 300, drawPlate('CARDS HOME', ['blank · free · take one'], { titleK: 0.45 }), X1 - 0.43, 1.85, 15.05, { face: 'x' });
  s.solid(X1 - 0.42, 0.9, 14.5, X1 - 0.16, 1.75, 15.6);

  // queue posts with a rope
  s.furniture(() => {
    g.mat('cast', '#b08a45', { rough: -0.2 }); for (const p of [[-26.3, 13.4], [-26.3, 15.2]]) g.lathe(p[0], p[1], [[0.13, 0], [0.13, 0.03], [0.03, 0.06], [0.025, 0.92], [0.05, 0.95], [0, 0.99]], { segs: 10 });
    g.mat('weave', '#2f6f73'); const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([-26.3, 0.86 - 0.14 * 4 * t * (1 - t), 13.4 + 1.8 * t]); } g.tube(pts, 0.02, { segs: 6 });
  });
  s.solid(-26.4, 0, 13.3, -26.2, 0.95, 15.3);

  // light: two low globes over the counter, a sconce by the map, the room's own glow
  lamp(s, 'globe', -26.6, 2.5, 16.2, { r: 0.2, drop: 1.25, power: 1.3, K: 2700, clip: CL });
  lamp(s, 'globe', -23.4, 2.5, 16.2, { r: 0.2, drop: 1.25, power: 1.3, K: 2700, clip: CL });
  lamp(s, 'sconce', X1 - 0.17, 2.45, 16.4, { face: 'x', power: 0.8, K: 2700, clip: CL });
  lamp(s, 'sconce', X0 + 0.17, 2.45, 18.2, { face: 'X', power: 0.7, K: 2700, clip: CL });
  lamp(s, 'spot', -25, H, 13.6, { power: 0.7, K: 3000, clip: CL, cone: [55, 30] });

  // people and paths
  for (const q of [[-25, 15.25], [-25, 14.45], [-25.2, 13.65], [-25.5, 12.85], [-25.8, 12.05], [-26.1, 11.2]]) s.spot('queue', q[0], 0, q[1], PI, { tags: ['guestdesk'] });
  s.spot('browse', -28.9, 0, 18.0, -PI / 2, { tags: ['guestdesk', 'threads'] });
  s.spot('browse', -28.8, 0, 17.0, -PI / 2, { tags: ['guestdesk', 'threads'] });
  s.spot('browse', -20.9, 0, 17.6, PI / 2, { tags: ['guestdesk', 'map'] });
  s.spot('chat', -22.6, 0, 13.4, -PI / 2 + 0.3, { tags: ['guestdesk'] }); s.spot('chat', -23.6, 0, 13.0, PI / 2 + 0.2, { tags: ['guestdesk'] });
  s.path([[-25, Z0], [-25, 15.2]]);
  s.path([[-25, 12.6], [-27.6, 12.8], [-28.4, 15.8], [-28.5, 17.6]]);
  s.path([[-25, 14.0], [-21.0, 14.4], [-20.9, 17.0]]);

  // your own thread, drawn now and shown once you have pinned it
  const pin = game.world.scope('guestdesk-pin', f), pg = pin.g;
  pin.detail(() => { pg.mat('weave', '#d9b25c'); pg.tube([[TW + 0.09, 2.05, 17.35], [TW + 0.1, 1.9, 17.38], [TW + 0.095, 1.72, 17.33]], 0.004, { segs: 3 }); pg.mat('paper', '#f4ecd8'); pg.at(TW + 0.078, 2.02, 17.42, PI / 2); pg.box(-0.05, -0.08, 0, 0.05, 0, 0.002); pg.pop(); pg.mat('cast', '#c9a45c'); pg.ball(TW + 0.09, 2.05, 17.35, 0.008, 0.008, 0.008, { segs: 5, rings: 3 }); });
  pin.finish(); pin.visible = !!(game.flags && game.flags.pinnedThread);

  // things to do
  const F = () => flags(game);
  s.interact({ id: 'guestdesk.sign', x: -25.0, y: CH + 0.2, z: 16.0, radius: 1.6, priority: 0.3, prompt: (game) => (flags(game).signedIn ? 'Read the guest book' : 'Sign the guest book'), onUse: async (game) => {
    if (!flags(game).signedIn) {
      if (game.story && game.story.signIn) { await game.story.signIn(game); return; }
      await tell(game, SEFA, [
        'Where have you slept?',
        { s: YOU, t: 'Sorrel, last night. Spelt before that.' },
        'Have you eaten?',
        { s: YOU, t: 'Not yet.' },
        'Then sign here, and go and eat. Three nights in a Margin flat, a seat at any hall, the baths. And a key from the draw.',
        "Candlewick, deck 19, number 4. A terrace over Wick Court. That's a good draw. Don't tell the others.",
      ]);
      const Fl = flags(game); Fl.signedIn = true; Fl.signedInAt = game.time; Fl.hasKey = true; Fl.hasChit = true;
      if (game.sfxAt) game.sfxAt('paper', f, -25, 1.1, 16.1);
      if (game.ui) { game.ui.toast('Guest chit · three nights on guest-right', { kind: 'gain' }); game.ui.toast('Flat key · Candlewick 19 · 4', { kind: 'gain' }); }
      game.events.emit('signedIn', {});
      return;
    }
    await tell(game, null, ['Page after page of names and home drums in a hundred hands. Dulse. Tansy. Kittiwake. Madder. A child has drawn a glide car falling between two drums.', 'Your own line, near the bottom: Spelt, and a small loaf Sefa drew beside it.']);
  } });
  s.interact({ x: -25.0, y: 1.3, z: 16.8, radius: 1.7, kind: 'talk', priority: -0.2, enabled: (game) => !!flags(game).signedIn, prompt: 'Ask Sefa who pays for your three nights', onUse: async (game) => {
    await tell(game, SEFA, ['Nobody, and everybody. Any drum that grants guest-right can send its wanderers to any other that does.', 'We put up about two hundred a day here. Spelt puts up ours. Across the raft it comes to nothing at all.', 'Go and eat. Ladle Row, the long table. Ramen at one.']);
    found(game, 'guest-compact');
  } });
  s.interact({ x: -22.55, y: 1.8, z: Z1 - 0.5, radius: 1.9, prompt: "Read today's draw", onUse: async (game) => {
    await tell(game, null, ["Today's draw: Candlewick 19 · 4. Ropewalk 18 · 12. Pennyfold 21 · 3. Hassock 24 · 7. Lindenhall 17 · 9.", 'Margin flats go by lottery. The terraces and the Hollow\'s edge go by draw, the dim decks to whoever is left. Candlewick 19 is a terrace over the court.']);
    found(game, 'flat-draw');
  } });
  s.interact({ x: -26.0, y: 1.8, z: Z1 - 0.5, radius: 1.9, prompt: 'Look at the key tags', onUse: async (game) => {
    await tell(game, null, ['Brass tags on loops of coloured cord, a row for each block and deck. The bare hooks are flats out on loan.', 'The corners of the oldest tags have been worn round by hundreds of hands.']);
  } });
  s.interact({ x: TW + 0.4, y: 1.8, z: 18.1, radius: 1.8, wide: true, prompt: 'Read the threads and notes', onUse: async (game) => {
    await tell(game, null, ['Threads in every colour, pinned with a note or a knot. From Dulse: thirty-seven light seconds out, best jook on the Row. Tansy, leg nine: ate a strawberry, cried a bit, worth it.', 'Legs so far, eleven. Twelve kays in fares, and my boots cost more. Keep going.', 'A wander year of twelve slow legs costs about 13 kWh in fares. A new pair of shoes costs 20. Nearly all of what it costs is time.']);
    found(game, 'wander-cost');
  } });
  s.interact({ x: TW + 0.4, y: 1.4, z: 17.2, radius: 1.5, priority: 0.2, enabled: (game) => !!flags(game).signedIn && !flags(game).pinnedThread, prompt: 'Pin a thread from Spelt', onUse: async (game) => {
    flags(game).pinnedThread = true; pin.visible = true;
    if (game.sfxAt) game.sfxAt('paper', f, TW, 2, 17.4);
    await tell(game, null, ['You pull a gold thread from your cuff, knot it, and pin it beside the others with a scrap of paper: Spelt, leg twelve.']);
  } });
  s.interact({ x: X1 - 0.5, y: 1.4, z: 15.05, radius: 1.4, prompt: 'Take a blank card home', onUse: async (game) => {
    const Fl = flags(game);
    if (Fl.blankCard) { await tell(game, null, ['You have one already. They are free, and one is what you need.']); return; }
    Fl.blankCard = true; if (game.sfxAt) game.sfxAt('paper', f, X1 - 0.3, 1.3, 15);
    if (game.ui) game.ui.toast('A blank card home', { kind: 'gain' });
  } });
  s.interact({ x: X1 - 0.5, y: 1.8, z: 17.6, radius: 1.6, prompt: 'Look at the map of Candlewick', onUse: async (game) => {
    await tell(game, null, ['Candlewick, straight up from the station: Wick Court in the middle, the long table along its front side, Ladle Row through it, Thread Street running back. Someone has drawn your flat in red: deck 19, over the court.', 'Cabs leave from deck 4. Up into the drum is about a minute.']);
  } });
  s.interact({ x: -21.6, y: 1.2, z: Z1 - 0.5, radius: 1.3, prompt: 'Make a cup of tea', onUse: async (game) => {
    if (game.sfxAt) game.sfxAt('pour', f, -21.5, 1.1, Z1 - 0.3);
    await tell(game, SEFA, ['Help yourself. The water comes off the loop at sixty-five, so the urn has little left to do. Lid on it, or it is cold before you sit down.']);
  } });
  void F;

  s.zoneBox({ id: 'guestdesk', place: 'guestdesk', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The guest desk', sub: 'Station Ring 2', ambience: 'station', reverb: 'room', headroom: 3.7 });
  s.finish();
  void clip;
}

// =====================================================================================================================
// The ring counter: x[20, 30] z[12, 18]. A tiled lobby off the platform, a hatch with a deep sill, a kitchen behind.
// =====================================================================================================================
function buildCounter(game, f) {
  const s = game.world.scope('counter', f), g = s.g;
  const X0 = 20, X1 = 30, Z0 = 12, Z1 = 18, H = 4, HZ = 14.85;
  const TEAL = '#2f6f73', CREAM = '#e6e4d6';
  floor(s, X0, Z0, X1, HZ, 0, 'hex', '#cfc6b2');
  floor(s, X0, HZ, X1, Z1, 0, 'tile', '#d9d4c6');
  ceiling(s, X0, Z0, X1, Z1, H, 'paint', '#e8e2d2');
  const tileW = { mat: 'tile', tint: CREAM, dado: { h: 1.3, mat: 'tile', tint: TEAL }, skirt: '#1f3a3a' };
  wall(s, X0 + 0.08, Z0, X0 + 0.08, Z1, 0, H, tileW);
  wall(s, X1 - 0.08, Z0, X1 - 0.08, Z1, 0, H, tileW);
  wall(s, X0, Z1 - 0.08, X1, Z1 - 0.08, 0, H, tileW);
  wall(s, X0, Z0 + 0.08, X1, Z0 + 0.08, 0, H, { tint: '#2f5a5a', openings: [{ at: 0.3, w: 9.4, h: 3.35 }], skirt: false });
  // the hatch wall: a wide hatch, and a staff door at the east end
  wall(s, X0, HZ, X1, HZ, 0, H, Object.assign({}, tileW, { t: 0.2, openings: [{ at: 2.0, w: 6.0, h: 1.25, sill: 0.95 }, { at: 8.55, w: 0.95, h: 2.1 }] }));
  doorFrame(s, X0 + 9.025, 0, HZ, 0.95, 2.1, 'x', { tint: '#1f3a3a' });
  door(s, { x: X0 + 8.575, y: 0, z: HZ, w: 0.9, h: 2.08, along: 'x', kind: 'hinge', style: 'plain', tint: TEAL, locked: true, lockedText: 'Kitchen. Tomas will pass it through the hatch.' });
  sign(s, spec('counter.fascia'), 25, 3.68, Z0 - 0.03, { face: 'z', w: 4.4, h: 0.55 });
  s.structure(() => {
    g.mat('paint', '#c9552e'); g.box(X0 + 0.16, 1.3, Z0 + 0.16, X0 + 0.17, 1.42, HZ - 0.1, { faces: 'X' }); g.box(X1 - 0.17, 1.3, Z0 + 0.16, X1 - 0.16, 1.42, HZ - 0.1, { faces: 'x' }); for (const a of [[X0 + 0.16, 22.0], [28.0, 28.5]]) g.box(a[0], 1.3, HZ - 0.11, a[1], 1.42, HZ - 0.1, { faces: 'z' });
    g.mat('paint', '#2f5a5a'); g.box(X0 + 0.16, 3.35, Z0 - 0.02, X1 - 0.16, 4.0, Z0 + 0.0, { faces: 'z' });
  });
  // the deep tiled sill, and the counter body under it on the lobby side
  s.furniture(() => {
    g.mat('tile', '#f0ebdc'); g.box(21.9, 0.9, 14.2, 28.1, 0.98, 15.5, { bevel: 0.01 });
    g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(21.88, 0.955, 14.17, 28.12, 0.985, 14.21);
    g.mat('tile', TEAL); g.box(21.95, 0, 14.25, 28.05, 0.9, 14.75);
    g.mat('tile', '#c9552e'); g.box(21.94, 0.62, 14.24, 28.06, 0.7, 14.76, { faces: 'zxX' });
    g.mat('plain', '#1f3a3a'); g.box(22.0, 0, 14.22, 28.0, 0.08, 14.26, { faces: 'z' });
  });
  s.solid(21.9, 0, 14.2, 28.1, 0.98, 15.5);
  // the kitchen: steel worktops, the pot held on the loop, the rice steamer, shelves of crocks, the loop's red pipe
  s.furniture(() => {
    g.mat('brushed', '#c4c6c0', { rough: -0.2 }); g.box(20.2, 0.88, 15.5, 29.8, 0.92, 16.1, { bevel: 0.008 }); g.box(20.2, 0.88, 17.2, 29.8, 0.92, 17.84, { bevel: 0.008 });
    g.mat('paint', '#2f5a5a'); g.box(20.2, 0, 15.55, 29.8, 0.88, 16.05); g.box(20.2, 0, 17.25, 29.8, 0.88, 17.84);
    g.mat('brushed', '#8a8c88'); g.box(23.4, 0.92, 17.3, 26.8, 0.95, 17.8, { bevel: 0.005 });
    g.mat('brushed', '#a8aaa4'); g.box(27.6, 0.86, 17.3, 28.6, 0.92, 17.78); g.mat('plain', '#5a6a6a'); g.box(27.68, 0.7, 17.36, 28.52, 0.9, 17.72, { faces: 'Y' });
    g.mat('brushed', '#9a9c98'); g.tube([[28.1, 0.92, 17.8], [28.1, 1.25, 17.8], [28.1, 1.25, 17.6]], 0.015, { segs: 6 });
    // shelves over the back worktop
    g.mat('wood', '#7a5233'); for (const y of [1.6, 2.1]) g.box(20.3, y, 17.55, 29.7, y + 0.03, 17.84, { bevel: 0.006 });
    // the 65 degree loop: an insulated red pipe along the back wall, dropping to the hob plate
    g.mat('paint', '#9a3a2a'); g.tube([[20.2, 2.75, 17.75], [29.8, 2.75, 17.75]], 0.06, { segs: 10 }); g.tube([[25.1, 2.75, 17.75], [25.1, 0.95, 17.75]], 0.045, { segs: 8 });
    g.mat('brushed', '#9a9c98'); for (let x = 21; x < 29.8; x += 1.4) g.lathe(x, 17.75, [[0.07, 2.7], [0.07, 2.8]], { segs: 10 });
  });
  s.solid(20.2, 0, 15.5, 29.8, 0.92, 16.1); s.solid(20.2, 0, 17.2, 29.8, 0.92, 17.84);
  prop(s, 'station.pot', 24.2, 0.95, 17.55, 0, { r: 0.25, h: 0.38 });
  prop(s, 'station.pot', 25.9, 0.95, 17.55, 0.6, { r: 0.2, h: 0.3 });
  prop(s, 'station.cupRack', 21.0, 0.92, 15.8, 0, { w: 1.1 });
  prop(s, 'station.cupRack', 29.0, 0.92, 15.8, 0, { w: 1.1 });
  s.detail(() => {
    const r = new Rng(12);
    for (const y of [1.63, 2.13]) for (let x = 20.5; x < 29.5; x += r.f(0.28, 0.42)) { const h = r.f(0.16, 0.3), rr = r.f(0.07, 0.11); const c = ['#8a5a3c', '#c9963a', '#2f6f73', '#e9e1cf', '#a8392e'][r.i(0, 4)]; g.mat('glaze', c); g.lathe(x, 17.7, [[0, y], [rr * 0.8, y], [rr, y + h * 0.2], [rr, y + h * 0.75], [rr * 0.7, y + h * 0.9], [rr * 0.75, y + h], [0, y + h + 0.01]], { segs: 10 }); }
    // the tray of rice balls on the sill under a cloth, one end turned back
    g.mat('wood', '#9a7048'); g.box(25.5, 0.98, 14.55, 26.6, 1.01, 15.2, { bevel: 0.006 });
    g.mat('plain', '#f4f0e4', { rough: 0.1 }); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.ball(25.62 + i * 0.12, 1.05, 14.68 + j * 0.12, 0.05, 0.045, 0.05, { segs: 8, rings: 5 });
    g.mat('weave', '#e8dcc0'); g.sheet([26.06, 1.12, 14.55], [26.62, 1.12, 14.55], [26.62, 1.12, 15.22], [26.06, 1.12, 15.22], { sag: -0.03, nu: 6, nv: 5 });
    g.mat('weave', '#c9552e'); g.box(26.06, 1.121, 14.6, 26.62, 1.124, 14.66, { faces: 'Y' });
    // today's sprig in a glass on the sill
    g.mat('plain', '#cfe3e0', { rough: -0.4 }); g.lathe(23.9, 14.55, [[0, 0.98], [0.04, 0.98], [0.042, 1.12], [0.038, 1.12], [0.035, 0.99], [0, 0.99]], { segs: 12 });
    g.mat('leafB', '#b8e08a', { sway: 0.4 }); g.card(23.9, 1.05, 14.55, 0.16, 0.24, 0.3); g.card(23.9, 1.05, 14.55, 0.14, 0.22, 1.9);
  });
  for (let i = 0; i < 5; i++) prop(s, 'cup', 22.4 + i * 0.16, 0.98, 14.45 + (i % 2) * 0.1, 0, { glaze: ['#e9e1cf', '#2f6f73', '#e9e1cf', '#c9552e', '#d9b25c'][i] });
  // the queue rail, whose wide top is the shelf to stand your cup on
  s.furniture(() => {
    g.mat('wood', '#7a5233', { rough: -0.1 }); g.box(21.4, 1.02, 12.95, 28.9, 1.06, 13.2, { bevel: 0.01 });
    g.mat('cast', '#b08a45', { rough: -0.2 }); for (let x = 21.5; x <= 28.9; x += 1.23) g.tube([[x, 0, 13.08], [x, 1.02, 13.08]], 0.025, { segs: 8 });
    g.tube([[21.4, 0.2, 13.08], [28.9, 0.2, 13.08]], 0.018, { segs: 6 });
    g.mat('wood', '#7a5233'); g.box(X0 + 0.16, 1.08, 12.3, X0 + 0.4, 1.12, 14.6, { bevel: 0.006 });
  });
  s.solid(21.4, 0, 12.95, 28.9, 1.06, 13.2); s.solid(X0 + 0.16, 1.0, 12.3, X0 + 0.4, 1.12, 14.6);
  for (const c of [[21.6, 13.12], [22.9, 13.06], [24.6, 13.1], [X0 + 0.28, 13.4]]) prop(s, 'cup', c[0], c[0] < 21 ? 1.12 : 1.06, c[1], 0, { open: true, glaze: '#e9e1cf', drink: '#b8864a' });
  // the chalkboard of the day, and the argument
  const chalkR = painted(s, 'counter.chalk', 0.7, 1.0, 300, drawChalk(chalkSpec(game)), 21.0, 1.95, HZ - 0.13, { face: 'z' });
  s.deco(() => { g.mat('wood', '#6b4a2f'); g.box(20.62, 1.42, HZ - 0.125, 21.38, 2.48, HZ - 0.1); });
  let chalkDay = game.clock ? game.clock.day : 1;
  game.events.on('update', () => { if (!game.clock || !game.atlas || !chalkR) return; if (game.clock.day !== chalkDay) { chalkDay = game.clock.day; game.atlas.redraw(chalkR, drawChalk(chalkSpec(game))); } });
  sign(s, spec('counter.argument'), X0 + 0.17, 1.75, 13.6, { face: 'X' });
  painted(s, 'counter.over', 3.2, 0.42, 160, drawPlate('BROTH · RICE BALL · TODAY\'S SPRIG', ['free to anyone off a car, as on every ring of the Row'], { titleK: 0.5, a: '#2f6f73', b: '#3f8a8a', c: '#2a5a5a', ink: '#f2ead6' }), 25, 2.75, HZ - 0.105, { face: 'z' });
  s.detail(() => { g.mat('plain', '#cfe3e0', { rough: -0.4 }); g.lathe(27.5, 14.45, [[0, 0.98], [0.07, 0.98], [0.075, 1.2], [0.06, 1.24], [0.03, 1.26], [0, 1.26]], { segs: 12 }); g.mat('plain', '#e8eef0'); g.lathe(27.5, 14.45, [[0.065, 0.99], [0.068, 1.15], [0, 1.15]], { segs: 10 }); });
  planter(s, X1 - 0.5, 0, 12.6, { w: 0.6, d: 0.6, h: 0.5, plants: 'herbs', tint: '#c9552e' });
  // light: the kitchen bright and cool behind the hatch, the lobby warm
  lamp(s, 'panel', 25, H, 16.7, { w: 3.2, d: 0.5, power: 1.2, K: 4000, clip: [X0, -0.2, 14.0, X1, H, Z1] });
  lamp(s, 'panel', 21.6, H, 16.7, { w: 1.2, d: 0.5, power: 0.6, K: 4000, clip: [X0, -0.2, HZ, X1, H, Z1] });
  lamp(s, 'globe', 23.2, 2.7, 13.6, { r: 0.18, drop: 1.3, power: 1.0, K: 2800, clip: [X0, -0.2, Z0 - 1.5, X1, H, HZ + 0.7] });
  lamp(s, 'globe', 26.8, 2.7, 13.6, { r: 0.18, drop: 1.3, power: 1.0, K: 2800, clip: [X0, -0.2, Z0 - 1.5, X1, H, HZ + 0.7] });
  roomGlow(s, X0, 0, Z0, X1, H, HZ, { sky: '#ffe1b8', ground: '#b8a888', power: 0.22 });
  roomGlow(s, X0, 0, HZ, X1, H, Z1, { sky: '#e8eef0', ground: '#c8c4b8', power: 0.25 });

  // people
  s.spot('counter', 25, 0, 15.15, 0, { tags: ['counter', 'keeper'], who: 'tomas' });
  s.spot('work', 24.4, 0, 16.75, PI, { tags: ['counter', 'cook'] });
  s.spot('customer', 25, 0, 13.85, PI, { tags: ['counter'] });
  for (const q of [[25.9, 13.85], [26.8, 13.85], [27.7, 13.85], [28.6, 13.7], [29.3, 13.0], [29.4, 12.2], [29.5, 11.3]]) s.spot('queue', q[0], 0, q[1], q[0] > 29 ? -PI / 2 : -PI / 2, { tags: ['counter'] });
  for (const x of [21.6, 22.6, 23.6, 24.6]) s.spot('stand', x, 0, 12.55, PI, { tags: ['counter', 'drink'] });
  s.spot('stand', X0 + 0.7, 0, 13.6, -PI / 2, { tags: ['counter', 'drink'] });
  s.path([[25, Z0], [25, 12.55]]); s.path([[29.4, Z0], [29.4, 13.0], [28.0, 13.85], [25, 13.85]], { width: 0.9 }); s.path([[25, 12.55], [21.6, 12.55]]);

  // things to do
  s.interact({ x: 25, y: 1.2, z: 14.6, radius: 1.6, kind: 'talk', prompt: 'Ask for a cup of broth', onUse: async (game) => {
    const M = MENUS.counter; const day = game.clock ? game.clock.day : 1;
    const items = M.items.filter((it) => !it.days || it.days.indexOf(day) >= 0).map((it) => ({ id: it.id, name: it.name, desc: it.desc, price: it.price }));
    let pick = 'broth';
    if (game.ui && game.ui.menu) { game.busy++; try { pick = await game.ui.menu({ kicker: 'Station Ring 2', title: M.title, note: M.note, items, wallet: game.wallet ? game.wallet.kwh : 0 }); } finally { game.busy--; } }
    if (!pick) return;
    if (game.sfxAt) { game.sfxAt('ladle', f, 24.2, 1.2, 17.4); game.sfxAt('cup', f, 25, 1.0, 14.6, { delay: 0.6 }); }
    const Fl = flags(game); const first = !Fl.hadBroth; Fl.hadBroth = true;
    const sprig = day >= 3 ? 'chervil' : day === 2 ? 'chives' : 'coriander';
    await tell(game, TOMAS, first ? ['There. Broth, a rice ball, and ' + sprig + ' from the hall, cut this morning.', "Sorrel's is peppery and Lovage's is sweet. Ours comes with a sprig. People have been arguing about which is best since before the Count. Drink it here."] : ['Another? Of course. Same sprig. The hall only cuts once.']);
    if (game.ui) game.ui.toast('A cup of Mill broth, a rice ball and a sprig of ' + sprig, { kind: 'gain' });
    found(game, 'counter-sprig');
  } });
  s.interact({ x: 24.2, y: 1.1, z: 14.7, radius: 1.4, kind: 'talk', priority: -0.3, enabled: (game) => !!flags(game).hadBroth, prompt: 'Ask why nobody carries a cup aboard', onUse: async (game) => {
    await tell(game, TOMAS, ['Into a glide car? For 140 seconds that car is falling, and so is everything in it, soup included. You would wear it all the way to Sorrel.', 'Drink it on the platform. The counter will wait.']);
    found(game, 'no-soup');
  } });
  s.interact({ x: 21.0, y: 1.8, z: HZ - 0.4, radius: 1.5, prompt: 'Read the chalkboard', onUse: async (game) => {
    const sp = chalkSpec(game); await tell(game, null, [sp.title + '. ' + sp.lines.join('. ') + '.']);
  } });
  s.interact({ x: X0 + 0.6, y: 1.7, z: 13.6, radius: 1.4, prompt: 'Read the notice', onUse: async (game) => {
    await tell(game, null, ["Which is best. Sorrel's: peppery. Lovage's: sweet. Ours: with a sprig. Argue on the platform, please.", 'Below it, in three different hands: Peppery. Sprig. Sprig, obviously.']);
  } });

  let loops = null;
  game.events.on('zone', (e) => {
    if (loops || !e || !e.zone || e.zone.scope !== s) return;
    loops = [game.loopAt('kitchen', f, 25, 1.2, 17.2, { vol: 0.35, radius: 8 }), game.loopAt('steam', f, 24.2, 1.4, 17.55, { vol: 0.2, radius: 5 })];
  });
  s.zoneBox({ id: 'counter', place: 'counter', box: [X0, -0.5, Z0, X1, H, Z1], name: 'The ring counter', sub: 'Station Ring 2', ambience: 'station', reverb: 'tile', headroom: 3.8 });
  s.finish();
}

function chalkSpec(game) {
  const d = game.clock ? Math.min(3, Math.max(1, game.clock.day)) : 1;
  return SIGNS['counter.chalk.' + d] || SIGNS['counter.chalk.1'];
}

// A cloth banner: one word in a tall serif, a border, small lozenges top and bottom.
function drawBanner(word, bg) {
  return (ctx, w, h) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f2e2b8'; ctx.globalAlpha = 0.7; ctx.lineWidth = Math.max(1.5, w * 0.025); ctx.strokeRect(w * 0.08, w * 0.08, w * 0.84, h - w * 0.16); ctx.globalAlpha = 1;
    ctx.fillStyle = '#f6ead0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const words = word.split(' '); const lh = h * 0.6 / Math.max(2, words.length + 0.6);
    words.forEach((wd, i) => { let sz = Math.round(Math.min(lh * 0.9, w * 0.36)); ctx.font = 'italic 600 ' + sz + 'px ' + SERIF; while (sz > 8 && ctx.measureText(wd).width > w * 0.78) { sz--; ctx.font = 'italic 600 ' + sz + 'px ' + SERIF; } ctx.fillText(wd, w / 2, h * 0.5 + (i - (words.length - 1) / 2) * lh); });
    for (const y of [h * 0.13, h * 0.87]) { ctx.save(); ctx.translate(w / 2, y); ctx.rotate(Math.PI / 4); ctx.fillRect(-w * 0.07, -w * 0.07, w * 0.14, w * 0.14); ctx.restore(); }
    // a fringe
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; for (let x = 0; x < w; x += 4) ctx.fillRect(x, h - 6, 2, 6);
  };
}
