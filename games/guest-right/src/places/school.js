// The Candlewick school on Ladle Row, and its long hall for spinball.
// About: a small block school for three hundred children of every age, cheerful and worn, where the drum's turn is the
// first lesson. You come in off the street through a porch full of waiting aunts, past three heights of pegs and a wall of
// names, cross the corridor, and the long hall opens spinward in front of you, bright at both ends where the rings are.
// Palette: cream plaster, the school's teal tiles, honey wood, and the four house colours (red, saffron, teal, indigo).
import { floor, ceiling, wall, lamp, roomGlow, block, warm } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { Rng, shadeHex, mixHex } from '../core/util.js';
import { SIGNS } from '../content/signs.js';
import { PAL, BRIGHT, HOUSES, PAINTINGS, RING_OUT, SLATE, talk, found, custom, dynMesh, painted, floorPaint, drawPainting, schoolNames, drawNameWall, drawSlate, drawScore, drawWords, drawFloorArrow, bookRun, bookRunZ } from './school_parts.js';

const H = 3.2, HS = 3.4, HH = 7.2;
const TILE = PAL.teal, DADO = { h: 1.05, mat: 'tile', tint: '#3a8a8e' };
// rooms: [x0, z0, x1, z1] inside faces
const SMALL = [42.16, 4.19, 55.92, 16.92], FORE = [56.08, 4.19, 65.92, 7.92], ENTR = [56.08, 8.08, 65.92, 17.0];
const OLDER = [66.08, 4.19, 80.92, 16.92], TEACH = [81.08, 4.19, 88.92, 16.92], MILL = [89.08, 4.19, 99.84, 16.92];
const CORR = [42.16, 17.08, 99.84, 19.52], V1 = [59.48, 19.68, 62.52, 23.32], V2 = [85.68, 19.68, 87.92, 23.32];
const HALL = [47.08, 23.48, 94.92, 35.84];
const CZ = 30.1, CX0 = 51, CX1 = 91, CZ0 = 25.6, CZ1 = 34.6, MIDX = 71;       // the court
const clipOf = (r, h, pad) => [r[0] - (pad || 0.06), -0.2, r[1] - (pad || 0.06), r[2] + (pad || 0.06), (h || H) + 0.15, r[3] + (pad || 0.06)];

export const place = {
  id: 'school', name: 'The Candlewick school and the long hall', order: 56,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('school', f);
    const g = s.g;
    const rnd = new Rng(1601);
    const say = (who, lines) => talk(game, who, lines);
    game.flags = game.flags || {};

    // =====================================================================================================
    // SHELL: floors, ceilings, walls
    // =====================================================================================================
    floor(s, 42.08, 4.03, 56, 17, 0, 'planks', '#c79a62');                      // the small ones
    floor(s, 56, 4.03, 66, 8, 0, 'pattern', '#cf8f62');                          // the porch
    floor(s, 56, 8, 66, 17, 0, 'terrazzo', '#d9c8a6');                           // entrance hall
    floor(s, 66, 4.03, 81, 17, 0, 'planks', '#b88a5a');                          // the middle class
    floor(s, 81, 4.03, 89, 17, 0, 'planks', '#9c7450');                          // teachers
    floor(s, 89, 4.03, 99.92, 17, 0, 'tile', '#dccbab');                         // the Mill room
    floor(s, 42.08, 17, 99.92, 19.6, 0, 'speckle', '#b9634a');                   // corridor
    floor(s, 59.4, 19.6, 62.6, 23.4, 0, 'speckle', '#b9634a'); floor(s, 85.6, 19.6, 88, 23.4, 0, 'speckle', '#b9634a');
    floor(s, 47, 23.4, 95, 36, 0, 'planks', '#ddb47c');                          // the long hall
    ceiling(s, 42.08, 4.03, 99.92, 19.6, H, 'paint', '#f7f0e2');
    // a grid of ceiling tiles in every room, and the corridor's
    const ceilGrid = (r, step) => {
      s.deco(() => {
        g.mat('brushed', '#d8d2c6', { rough: -0.1 });
        for (let x = r[0] + step; x < r[2] - 0.1; x += step) g.box(x - 0.012, H - 0.012, r[1], x + 0.012, H, r[3], { faces: 'y' });
        for (let z = r[1] + step; z < r[3] - 0.1; z += step) g.box(r[0], H - 0.012, z - 0.012, r[2], H, z + 0.012, { faces: 'y' });
      });
    };
    for (const r of [SMALL, OLDER, TEACH, MILL]) ceilGrid(r, 1.2);
    ceilGrid([56.08, 8.08, 58.9, 17.0], 1.2); ceilGrid([59.15, 8.08, 65.92, 17.0], 1.2);
    for (let x0 = 42.16; x0 < 99.8; x0 += 14.4) ceilGrid([x0, 17.08, Math.min(99.84, x0 + 14.4), 19.52], 1.2);
    ceiling(s, 59.4, 19.6, 62.6, 23.4, H, 'paint', '#f3ead8'); ceiling(s, 85.6, 19.6, 88, 23.4, H, 'paint', '#f3ead8');
    ceiling(s, 47, 23.4, 95, 36, HH, 'panel', '#c9c2b4');

    const FAC = '#e3b469';               // the street face: warm ochre over teal tiles
    // the front, on Ladle Row
    wall(s, 42, 4.11, 100, 4.11, 0, HS, { tintA: '#f4dfc0', tintB: FAC, dado: DADO, openings: [
      { at: 2.6, w: 8.6, sill: 0.72, h: 1.6 }, { at: 14.08, w: 9.84, h: 2.75 }, { at: 27.5, w: 9, sill: 0.82, h: 1.5 }, { at: 41.5, w: 3, sill: 1.0, h: 1.2 }, { at: 49, w: 7, sill: 0.86, h: 1.4 }] });
    // cross walls
    wall(s, 56, 4.19, 56, 17.0, 0, H, { tintA: '#f1e4c8', tintB: '#f6dcc0', dado: DADO });
    wall(s, 66, 4.19, 66, 17.0, 0, H, { tintA: '#e3ead8', tintB: '#f1e4c8', dado: DADO });
    wall(s, 56.08, 8, 65.92, 8, 0, H, { tintA: '#f1e4c8', tintB: '#f2d9a8', dado: DADO, openings: [{ at: 3.22, w: 3.4, h: 2.5 }] });
    wall(s, 81, 4.19, 81, 16.92, 0, H, { tintA: '#efe0c8', tintB: '#e3ead8', dado: DADO });
    wall(s, 89, 4.19, 89, 16.92, 0, H, { tintA: '#f3e2b8', tintB: '#efe0c8', dado: DADO });
    wall(s, 42.08, 4.03, 42.08, 19.68, 0, H, { tintA: '#f6dcc0', dado: DADO });
    wall(s, 99.92, 4.03, 99.92, 19.68, 0, H, { tintB: '#f3e2b8', tintA: '#ecdcbc', dado: DADO });
    // the corridor's north wall, either side of the entrance hall
    wall(s, 42.16, 17, 56, 17, 0, H, { tintA: '#ecdcbc', tintB: '#f6dcc0', dado: DADO, openings: [{ at: 1.0, w: 4, sill: 1.05, h: 1.2 }, { at: 6.24, w: 1.2, h: 2.2 }, { at: 9.4, w: 3, sill: 1.05, h: 1.2 }] });
    wall(s, 66, 17, 99.84, 17, 0, H, { tintA: '#ecdcbc', tintB: '#e3ead8', dado: DADO, openings: [{ at: 1.5, w: 4, sill: 1.05, h: 1.2 }, { at: 7.2, w: 1.2, h: 2.2 }, { at: 18.4, w: 1.0, h: 2.1 }, { at: 27.0, w: 1.4, h: 2.2 }, { at: 29.6, w: 4, sill: 1.05, h: 1.2 }] });
    // the corridor's south wall, with the ways into the hall
    wall(s, 42.16, 19.6, 99.84, 19.6, 0, H, { tintB: '#ecdcbc', tintA: '#d8cdb8', dado: DADO, openings: [{ at: 8.84, w: 0.9, h: 2.05 }, { at: 17.32, w: 3.04, h: 2.6 }, { at: 31.84, w: 1.0, h: 2.05 }, { at: 43.52, w: 2.24, h: 2.4 }] });
    for (const x of [59.4, 62.6, 85.6, 88]) wall(s, x, 19.68, x, 23.32, 0, H, { tint: '#ecdcbc', dado: DADO });
    // the long hall
    const HPLA = '#efe6d4';
    wall(s, 47, 23.4, 95, 23.4, 0, HH, { tintA: HPLA, tintB: '#d8cdb8', openings: [{ at: 12.48, w: 3.04, h: 2.6 }, { at: 38.68, w: 2.24, h: 2.4 }] });
    wall(s, 47, 35.92, 95, 35.92, 0, HH, { tintB: HPLA });
    wall(s, 47, 23.48, 47, 35.84, 0, HH, { tintA: HPLA });
    wall(s, 95, 23.48, 95, 35.84, 0, HH, { tintB: HPLA });

    // =====================================================================================================
    // THE FRONT: ochre plaster over teal tiles, a gate porch, the fascia, windows full of paintings
    // =====================================================================================================
    s.structure(() => {
      // a cornice band and a painted stripe of the four house colours along the top of the front
      g.mat('wood', '#5b4636'); g.box(42, 3.22, 3.98, 100, 3.32, 4.03, { faces: 'zyY' });
      for (let i = 0; i < 4; i++) { g.mat('paint', HOUSES[i][1]); for (let x = 42 + i * 1.5; x < 100; x += 6) g.box(x, 3.12, 4.025, Math.min(100, x + 1.5), 3.2, 4.03, { faces: 'z' }); }
      // the lintel over the porch: a deeper board for the fascia
      g.mat('paint', '#1f5a60'); g.box(55.85, 2.75, 3.96, 66.15, 3.12, 4.03, { bevel: 0.01, faces: 'zyxX' });
      // window surrounds on the street face
      g.mat('paint', '#1f5a60');
      for (const w of [[44.6, 53.2, 0.72, 2.32], [69.5, 78.5, 0.82, 2.32], [83.5, 86.5, 1.0, 2.2], [91, 98, 0.86, 2.26]]) {
        g.box(w[0] - 0.08, w[2] - 0.06, 3.97, w[1] + 0.08, w[2], 4.05, { bevel: 0.01 });           // sill
        g.box(w[0] - 0.08, w[3], 3.98, w[1] + 0.08, w[3] + 0.08, 4.04, { bevel: 0.008 });           // head
        for (const x of [w[0], w[1]]) g.box(x - 0.05, w[2], 3.98, x + 0.05, w[3], 4.04, { bevel: 0.006 });
        const n = Math.max(1, Math.round((w[1] - w[0]) / 1.4));
        for (let i = 1; i < n; i++) { const x = w[0] + (w[1] - w[0]) * i / n; g.box(x - 0.03, w[2], 4.07, x + 0.03, w[3], 4.13, { bevel: 0.005 }); }
        g.box(w[0], (w[2] + w[3]) / 2 + 0.25 - 0.025, 4.07, w[1], (w[2] + w[3]) / 2 + 0.25 + 0.025, 4.13, { bevel: 0.005 });
      }
    });
    for (const w of [[44.6, 53.2, 0.72, 2.32], [69.5, 78.5, 0.82, 2.32], [83.5, 86.5, 1.0, 2.2], [91, 98, 0.86, 2.26]]) s.glass(w[0], w[2], 4.11, w[1], w[3], 4.11, { opacity: 0.12 });
    // the fascia (the content's sub names the wrong decks for this front, so it is given here)
    sign(s, Object.assign({}, SIGNS['school.fascia'], { sub: 'Ladle Row · two hundred and twenty children', palette: ['#1f5a60', '#f6ecd6', '#e9b23c'], emblem: 'ball' }), 61, 2.935, 3.955, { face: 'z', w: 6.0, h: 0.34, board: false });
    // house plaques beside the porch, and the school's name in small letters for those who read walls
    for (let i = 0; i < 4; i++) sign(s, { kind: 'hanging', text: HOUSES[i][0], palette: [HOUSES[i][1], i === 1 ? '#2a2018' : '#f6ecd6', i === 1 ? '#2a2018' : '#f6ecd6'], emblem: ['lamp', 'ladle', 'thread', 'lamp'][i] }, i < 2 ? 54.6 + i * 0.62 : 66.8 + (i - 2) * 0.62, 2.55, 3.985, { face: 'z', w: 0.5, h: 0.5 });
    // a child's painted frieze along the facade dado: hand prints in every colour
    s.deco(() => {
      const r = new Rng(88);
      for (let x = 42.4; x < 99.6; x += r.f(0.28, 0.6)) {
        if (x > 55.6 && x < 66.4) continue;
        if ((x > 44.5 && x < 53.3) || (x > 69.4 && x < 78.6) || (x > 90.9 && x < 98.1)) { if (r.chance(0.6)) continue; }
        const y = r.f(0.25, 0.85), c = r.pick(BRIGHT), sz = r.f(0.06, 0.1);
        g.mat('paint', c); g.box(x - sz * 0.5, y - sz * 0.6, 3.996, x + sz * 0.5, y + sz * 0.4, 3.999, { faces: 'z' });
        for (let k = 0; k < 4; k++) g.box(x - sz * 0.48 + k * sz * 0.27, y + sz * 0.4, 3.996, x - sz * 0.48 + k * sz * 0.27 + sz * 0.16, y + sz * (0.85 + (k === 1 || k === 2 ? 0.15 : 0)), 3.999, { faces: 'z' });
        g.box(x + sz * 0.5, y - sz * 0.25, 3.996, x + sz * 0.8, y + sz * 0.05, 3.999, { faces: 'z' });
      }
    });

    // ---------- the porch ----------
    const CF = [56.0, -0.2, 2.6, 66.0, H + 0.2, 8.0];
    roomGlow(s, FORE[0], 0, FORE[1], FORE[2], H, FORE[3], { sky: '#ffd9a8', ground: '#c98b5e', power: 0.28 });
    lamp(s, 'lantern', 58.0, 2.5, 6.0, { tint: PAL.red, clip: CF, power: 0.7, drop: 0.55 });
    lamp(s, 'lantern', 61.0, 2.6, 5.4, { tint: PAL.saffron, clip: CF, power: 0.8, drop: 0.45, r: 0.24, hh: 0.36 });
    lamp(s, 'lantern', 64.0, 2.5, 6.0, { tint: PAL.teal, clip: CF, power: 0.7, drop: 0.55 });
    lamp(s, 'bulb', 61, 2.6, 4.4, { K: 2800, power: 0.6, range: 5, clip: [55.5, -0.2, 1.5, 66.5, H + 0.3, 8] });
    // folding gates, folded back against the porch walls
    s.furniture(() => {
      g.mat('cast', '#1f5a60', { rough: -0.1 });
      for (const side of [-1, 1]) {
        const x = side < 0 ? 56.18 : 65.82;
        for (let i = 0; i < 9; i++) { const z = 4.35 + i * 0.07; g.tube([[x + side * -0.02 * (i % 2), 0.02, z], [x + side * -0.02 * (i % 2), 2.6, z]], 0.012, { segs: 5 }); }
        for (const y of [0.15, 1.3, 2.5]) g.box(x - 0.04, y, 4.3, x + 0.04, y + 0.04, 4.98, { bevel: 0.006 });
        g.mat('cast', '#c8a45a'); g.ball(x, 1.1, 5.0, 0.03, 0.03, 0.03, { segs: 8, rings: 5 }); g.mat('cast', '#1f5a60', { rough: -0.1 });
      }
    });
    // benches along the porch walls, a planter at each corner, a chalk board on a stand
    prop(s, 'bench', 56.48, 0, 6.45, Math.PI / 2, { w: 2.2, back: true, wood: '#a8794f', metal: '#1f5a60' });
    prop(s, 'bench', 65.52, 0, 6.45, -Math.PI / 2, { w: 2.2, back: true, wood: '#a8794f', metal: '#1f5a60' });
    planter(s, 56.75, 0, 7.55, { w: 1.1, d: 0.5, h: 0.45, plants: 'flower', tint: '#2f7f86', mat: 'tile' });
    planter(s, 65.25, 0, 7.55, { w: 1.1, d: 0.5, h: 0.45, plants: 'herbs', tint: '#2f7f86', mat: 'tile' });
    s.furniture(() => {
      // a standing chalk board on the porch, today's news facing the street
      g.mat('wood', '#6b4a2f');
      for (const sx of [-1, 1]) { g.box(63.6 + sx * 0.36 - 0.025, 0, 4.86, 63.6 + sx * 0.36 + 0.025, 1.22, 4.92, { bevel: 0.006 }); g.box(63.6 + sx * 0.36 - 0.03, 0, 4.7, 63.6 + sx * 0.36 + 0.03, 0.05, 5.1, { bevel: 0.008 }); }
      g.box(63.22, 0.3, 4.88, 63.98, 1.2, 4.92, { bevel: 0.008 });
    });
    sign(s, { kind: 'chalk', title: 'Thursday', lines: ['Spinball at break', 'Mill table at twelve', 'Lamp-painting with Oona, two', 'Home time three', 'No school tomorrow: the Quiet'] }, 63.6, 0.76, 4.874, { face: 'z', w: 0.68, h: 0.86, board: false });
    s.solid(63.2, 0, 4.7, 64.0, 1.22, 5.1);
    // the porch doors: bright red, glazed, propped open for the day
    doorFrame(s, 61, 0, 8, 3.4, 2.5, 'x', { tint: '#1f5a60' });
    door(s, { x: 59.3, y: 0, z: 8, w: 1.7, h: 2.5, along: 'x', dir: 1, swing: -1, style: 'glazed', tint: PAL.red, open: true, label: 'the school door' });
    door(s, { x: 62.7, y: 0, z: 8, w: 1.7, h: 2.5, along: 'x', dir: -1, swing: 1, style: 'glazed', tint: PAL.red, open: true, label: 'the school door' });
    sign(s, { kind: 'letters', text: 'Come in, and wipe your feet', palette: ['#1f5a60'] }, 61, 2.82, 7.915, { face: 'z', w: 2.6, h: 0.22 });
    s.zoneBox({ id: 'school-porch', place: 'school', box: [56, -0.5, 4.0, 66, H, 8], name: 'The Candlewick school', sub: 'Ladle Row · the gate', ambience: 'school', reverb: 'room' });

    // =====================================================================================================
    // ENTRANCE HALL: pegs at three heights, the name wall, the notice board
    // =====================================================================================================
    const CE = clipOf(ENTR, H, 0.08); CE[5] = 19.5;
    roomGlow(s, ENTR[0], 0, ENTR[1], ENTR[2], H, ENTR[3], { sky: '#ffe2b8', ground: '#e0d0b4', power: 0.32 });
    lamp(s, 'globe', 61, 2.45, 10.2, { K: 2800, clip: CE, power: 0.85, drop: 0.7, r: 0.2 });
    lamp(s, 'globe', 61, 2.45, 14.4, { K: 2800, clip: CE, power: 0.85, drop: 0.7, r: 0.2 });
    // a picture light over the name wall, and the pegs' own warm wash
    s.light({ at: [64.2, 3.0, 12.5], type: 'spot', dir: [0.5, -0.86, 0], cone: [70, 40], color: warm(3000), power: 5, range: 5, shadow: false, lamp: true, clip: CE, radius: 0.1 });
    lamp(s, 'strip', 65.6, 3.12, 8.7, { to: [65.6, 3.12, 16.3], K: 3000, power: 0.25, clip: CE, glow: 0.8 });
    lamp(s, 'strip', 56.4, 3.12, 8.7, { to: [56.4, 3.12, 16.3], K: 2900, power: 0.3, clip: CE, glow: 0.8 });
    s.structure(() => {
      // a border in the terrazzo, a mat at the door, a beam across
      g.mat('terrazzo', '#2f7f86'); g.box(56.3, 0, 8.3, 65.7, 0.003, 8.42, { faces: 'Y' }); g.box(56.3, 0, 16.6, 65.7, 0.003, 16.72, { faces: 'Y' }); g.box(56.3, 0, 8.3, 56.42, 0.003, 16.72, { faces: 'Y' }); g.box(65.58, 0, 8.3, 65.7, 0.003, 16.72, { faces: 'Y' });
      g.mat('terrazzo', '#c9552e'); for (let i = 0; i < 4; i++) { const cx = 61, cz = 12.5, a = i * Math.PI / 2; g.push(); g.move(cx, 0, cz); g.rotY(a + Math.PI / 4); g.box(-0.08, 0, 0, 0.08, 0.004, 0.9, { faces: 'Y' }); g.pop(); }
      g.mat('rush', '#a88c5a'); g.box(59.4, 0, 8.12, 62.6, 0.012, 9.3, { faces: 'YxXzZ' });
      g.mat('wood', '#7a5233'); g.box(58.9, H - 0.26, 8.08, 59.15, H, 17.0, { bevel: 0.01, faces: 'yxX' });
      g.mat('brushed', '#9a948a'); g.tube([[56.3, H - 0.12, 9.0], [65.7, H - 0.12, 9.0]], 0.04, { segs: 8 }); g.tube([[56.3, H - 0.12, 9.15], [65.7, H - 0.12, 9.15]], 0.025, { segs: 6 });
    });
    // the pegs: three rails at three heights on the west wall, coats and satchels where children left them
    const PW = 56.08;
    s.structure(() => {
      g.mat('wood', '#8a5a34', { rough: -0.05 });
      for (const y of [0.95, 1.32, 1.7]) g.box(PW, y - 0.05, 8.5, PW + 0.03, y + 0.05, 16.5, { bevel: 0.008 });
      g.mat('wood', '#a8794f'); g.box(PW, 0.28, 8.5, PW + 0.36, 0.33, 16.5, { bevel: 0.01 });
      for (let z = 8.7; z < 16.4; z += 0.9) g.box(PW + 0.02, 0, z - 0.03, PW + 0.34, 0.28, z + 0.03, { bevel: 0.006 });
    });
    s.solid(PW, 0, 8.5, PW + 0.36, 0.33, 16.5);
    const hung = [];
    const free = (z0, z1, y0, y1) => !hung.some((h) => z0 < h[1] && z1 > h[0] && y0 < h[3] && y1 > h[2]);
    s.detail(() => {
      g.mat('cast', '#c8a45a', { rough: -0.2 });
      const rails = [[0.95, 0.06, 0.0], [1.32, 0.09, 0.12], [1.7, 0.12, 0.24]];
      for (const rl of rails) for (let z = 8.65 + rl[2]; z < 16.4; z += 0.36) { g.tube([[PW + 0.03, rl[0], z], [PW + rl[1], rl[0] + 0.03, z]], 0.011, { segs: 5 }); g.ball(PW + rl[1], rl[0] + 0.035, z, 0.016, 0.016, 0.016, { segs: 6, rings: 4 }); }
    });
    {
      const rails = [[1.7, 0.12, 0.24, 0.62], [1.32, 0.09, 0.12, 0.52], [0.95, 0.06, 0.0, 0.4]];
      const lin = [PAL.saffron, PAL.red, '#f6ecd6', PAL.leaf, '#d4878a', PAL.teal];
      for (const rl of rails) for (let z = 8.65 + rl[2]; z < 16.4; z += 0.36) {
        const u = rnd.next();
        if (u < 0.5) {
          const len = rl[3] * rnd.f(0.9, 1.08);
          if (!free(z - 0.18, z + 0.18, rl[0] - len, rl[0])) continue;
          hung.push([z - 0.18, z + 0.18, rl[0] - len - 0.02, rl[0]]);
          prop(s, 'school.coat', PW + rl[1], rl[0] + 0.02, z, Math.PI / 2, { a: rnd.pick(['#2f3f7a', '#7a2f2a', '#3d5a3a', '#2f7f86', '#8a4a6a', '#c9552e', '#5b4636', '#e9b23c']), lining: rnd.pick(lin), len: Math.round(len * 20) / 20, hood: rnd.chance(0.4), patch: rnd.chance(0.35) ? rnd.pick(lin) : null }, { noCollide: true });
        } else if (u < 0.72) {
          if (!free(z - 0.15, z + 0.15, rl[0] - 0.44, rl[0])) continue;
          hung.push([z - 0.15, z + 0.15, rl[0] - 0.44, rl[0]]);
          prop(s, 'school.satchel', PW + rl[1] - 0.02, rl[0] + 0.02, z, Math.PI / 2, { a: rnd.pick(['#8a5634', '#5b4636', '#2f7f86', '#a0522d', '#33407a']), badge: rnd.chance(0.5) ? rnd.pick(BRIGHT) : null }, { noCollide: true });
        }
      }
      // shoes in pairs under the bench, small to large
      s.detail(() => {
        for (let z = 8.8; z < 16.3; z += rnd.f(0.25, 0.5)) {
          if (rnd.chance(0.3)) continue;
          const c = rnd.pick(['#3a2a20', '#7a2f2a', '#2f3f7a', '#e9b23c', '#5b4636']), l = rnd.f(0.15, 0.24);
          g.mat('leather', c);
          for (const dz of [-0.05, 0.05]) { g.box(PW + 0.08, 0, z + dz - 0.04, PW + 0.08 + l, 0.06, z + dz + 0.03, { bevel: 0.02 }); }
        }
      });
    }
    // the name wall, east side
    const NAMES = schoolNames(220, 1601);
    s.structure(() => {
      g.mat('wood', '#5b4636'); g.box(65.84, 1.02, 8.55, 65.92, 2.94, 16.45, { bevel: 0.01 });
      g.mat('cast', '#c8a45a'); g.box(65.82, 2.94, 8.5, 65.92, 2.98, 16.5, { bevel: 0.004 });
    });
    painted(s, 'school.names', 7.8, 1.82, 150, drawNameWall(NAMES, 22, 10), 65.835, 1.98, 12.5, { face: 'x' });
    sign(s, { kind: 'letters', text: 'Everyone here, and the one they are named for', palette: ['#1f5a60'] }, 65.9, 3.06, 12.5, { face: 'x', w: 4.4, h: 0.17 });
    s.interact({ x: 65.2, y: 1.6, z: 12.5, radius: 2.2, prompt: 'Read the name wall', onUse(gm) {
      return say('The name wall', ['Two hundred and twenty tiles, in four colours of paint. Each child is written large, and under each, smaller, the person whose share they carry.',
        'Pip Halloran, for Philippa Rowe. Esi Halloran, for Esi Marr. Rafe Oyelaran, for Rafael Dunne. Lumi Castellane, for Lumi Sato.',
        'Most of the first names match, and most of the dead were family, a great-grandparent or someone down an aunt\'s line. Somebody has drawn a very small cab beside Tavi Brennan.']);
    } });
    // the notice board, on the front wall west of the door
    s.deco(() => {
      g.mat('wood', '#6b4a2f'); g.box(56.5, 1.05, 8.08, 59.05, 2.35, 8.12, { bevel: 0.008 });
      g.mat('felt', '#b98e5c'); g.box(56.56, 1.1, 8.12, 58.99, 2.3, 8.125, { faces: 'Z' });
    });
    sign(s, SIGNS['school.window'], 57.05, 1.95, 8.128, { face: 'Z', w: 0.42, h: 0.56 });
    sign(s, SIGNS['school.panels'], 57.62, 1.55, 8.128, { face: 'Z', w: 0.38, h: 0.5 });
    sign(s, SIGNS['school.quiet'], 58.38, 1.9, 8.128, { face: 'Z', w: 0.4, h: 0.54 });
    sign(s, { kind: 'notice', title: 'Lost', lines: ['One left glove, red,', 'mended twice. Ask Kwame.'], hand: true }, 58.55, 1.38, 8.13, { face: 'Z', w: 0.3, h: 0.3 });
    sign(s, { kind: 'notice', title: 'Mill table aunts', lines: ['Thursday: Bo and Kemi', 'Booking Day: the feast', 'Next week: sign here'], hand: true }, 57.1, 1.4, 8.13, { face: 'Z', w: 0.34, h: 0.36 });
    s.interact({ x: 57.8, y: 1.7, z: 8.6, radius: 1.5, prompt: 'Read the notice board', onUse() {
      return say('The notice board', ['Window rounds: eight-year-olds, your round is set. Choose your adult.',
        'Light panels: twenty minutes at the panel every morning. It costs a hundredth of a kay.',
        'The Quiet: no school, no tutors. Go and talk to someone old.',
        'Lost: one left glove, red, mended twice. Ask Kwame. Under it, in pencil: it is in the store, it is always in the store.']);
    } });
    // east of the door: the lost property basket, a plant under the strip light, a bench in the middle
    prop(s, 'crate', 64.9, 0, 8.45, 0.05, { w: 0.7, h: 0.35, d: 0.45, wood: '#b08d5e' });
    s.detail(() => {
      g.mat('knit', PAL.red); g.ball(64.75, 0.38, 8.45, 0.16, 0.06, 0.12, { segs: 8, rings: 4 }); g.mat('knit', PAL.saffron); g.ball(65.05, 0.37, 8.5, 0.12, 0.05, 0.1, { segs: 8, rings: 4 });
      g.mat('leather', PAL.indigo); g.box(64.6, 0.35, 8.32, 64.8, 0.42, 8.42, { bevel: 0.02 });
    });
    sign(s, { kind: 'label', text: 'Lost and found', ink: '#2a2622' }, 64.9, 0.6, 8.12, { face: 'Z', w: 0.5, h: 0.08 });
    prop(s, 'plant', 65.4, 0, 16.4, 0, { kind: 'broad', size: 1.6, pot: '#c9552e' });
    prop(s, 'plant', 56.6, 0, 16.55, 0, { kind: 'fern', size: 1.1, pot: '#2f7f86' });
    prop(s, 'bench', 62.6, 0, 12.5, -Math.PI / 2, { w: 1.8, wood: '#a8794f', metal: '#1f5a60' });

    // =====================================================================================================
    // THE SMALL ONES: low tables, cushions, a reading corner, blocks, the model drum, paintings everywhere
    // =====================================================================================================
    const CS = clipOf(SMALL, H, 0.08);
    roomGlow(s, SMALL[0], 0, SMALL[1], SMALL[2], H, SMALL[3], { sky: '#ffe6c4', ground: '#e6d2b4', power: 0.38 });
    lamp(s, 'panel', 45.8, H, 8.0, { w: 1.2, d: 0.6, K: 3200, power: 0.8, clip: CS });
    lamp(s, 'panel', 52.3, H, 8.0, { w: 1.2, d: 0.6, K: 3200, power: 0.7, clip: CS });
    lamp(s, 'panel', 45.8, H, 13.6, { w: 1.2, d: 0.6, K: 3200, power: 0.75, clip: CS });
    lamp(s, 'panel', 52.3, H, 13.6, { w: 1.2, d: 0.6, K: 3200, power: 0.7, clip: CS });
    lamp(s, 'lantern', 48.2, 2.2, 10.6, { tint: PAL.saffron, clip: CS, power: 0.5, drop: 0.75 });
    lamp(s, 'globe', 43.6, 1.7, 5.4, { K: 2700, clip: [42.1, -0.2, 2.8, 50, H + 0.2, 10], power: 0.6, drop: 1.3, r: 0.14 });
    s.structure(() => {
      // a picture rail and a cork strip round the room, a painted band of the house colours
      g.mat('felt', '#c49a68'); g.box(42.16, 1.25, 4.6, 42.2, 2.45, 16.6, { faces: 'X' }); g.box(55.88, 1.25, 4.6, 55.92, 2.45, 16.6, { faces: 'x' });
      g.mat('wood', '#7a5233'); for (const y of [1.22, 2.45]) { g.box(42.16, y, 4.5, 42.22, y + 0.04, 16.7, { bevel: 0.006 }); g.box(55.86, y, 4.5, 55.92, y + 0.04, 16.7, { bevel: 0.006 }); }
      // the window seat inside the street window
      g.mat('wood', '#a8794f'); g.box(44.5, 0.68, 4.19, 53.3, 0.74, 4.62, { bevel: 0.01 });
      g.mat('paint', '#2f7f86'); g.box(44.55, 0, 4.19, 53.25, 0.68, 4.58, { bevel: 0.008 });
      g.mat('paint', '#3a8a8e'); for (let x = 44.7; x < 53.1; x += 1.1) g.box(x, 0.1, 4.58, x + 0.95, 0.6, 4.6, { bevel: 0.006, faces: 'Z' });
    });
    s.solid(44.5, 0, 4.19, 53.3, 0.74, 4.62);
    // window paintings stuck to the glass, facing out and in
    {
      const ps = [0, 3, 4, 5, 9, 11];
      ps.forEach((pi, i) => {
        const p = PAINTINGS[pi], x = 45.2 + i * 1.42, y = 1.5 + (i % 2) * 0.12;
        painted(s, 'school.paint.' + pi, 0.42, 0.32, 240, drawPainting(p, 100 + pi), x, y, 4.098, { face: 'z', off: 0, tilt: (i % 3 - 1) * 0.04, tier: 'd' });
        painted(s, 'school.paint.back', 0.42, 0.32, 60, (ctx, w, h) => { ctx.fillStyle = '#f2ead6'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = 'rgba(80,60,40,0.25)'; for (let k = 0; k < 5; k++) ctx.fillRect(w * 0.1, h * (0.2 + k * 0.13), w * 0.7, 1); }, x, y, 4.122, { face: 'Z', off: 0, tilt: -(i % 3 - 1) * 0.04, tier: 'd' });
      });
    }
    // paintings on the cork: west wall and east wall
    const PAINT_SPOTS = [];
    {
      const r = new Rng(52);
      for (let i = 0; i < 18; i++) {
        const pi = i % PAINTINGS.length, p = PAINTINGS[pi], z = 5.0 + (i % 9) * 1.28 + r.f(-0.1, 0.1), y = i < 9 ? 2.0 : 1.55;
        if (z > 15.8) continue;
        painted(s, 'school.paint.' + pi, 0.42, 0.32, 240, drawPainting(p, 100 + pi), 42.205, y + r.f(-0.05, 0.05), z, { face: 'X', tilt: r.f(-0.05, 0.05), tier: 'd' });
        PAINT_SPOTS.push([42.6, z]);
      }
      for (let i = 0; i < 12; i++) {
        const pi = (i + 5) % PAINTINGS.length, p = PAINTINGS[pi], z = 5.0 + (i % 6) * 1.9 + r.f(-0.1, 0.1), y = i < 6 ? 2.05 : 1.55;
        painted(s, 'school.paint.' + pi, 0.42, 0.32, 240, drawPainting(p, 100 + pi), 55.875, y + r.f(-0.05, 0.05), z, { face: 'x', tilt: r.f(-0.05, 0.05), tier: 'd' });
      }
      // drawing pins
      s.deco(() => { const rr = new Rng(53); for (let i = 0; i < 30; i++) { g.mat('paint', rr.pick([PAL.red, PAL.teal, PAL.saffron])); g.ball(42.215, rr.f(1.6, 2.2), rr.f(5, 16), 0.008, 0.008, 0.008, { segs: 5, rings: 3 }); } });
    }
    s.interact({ x: 42.9, y: 1.8, z: 10.5, radius: 2.4, prompt: 'Look at the paintings', onUse(gm) {
      found(gm, 'window-at-eight');
      return say('The paintings', ['Nobody here has seen an animal or a sky, and most have not been to the Window yet, so they paint what there is: the Hollow with its far bank upside down at the top, the sunline as a yellow stripe, a cab with Gran in it, a row of aunts holding hands.',
        'One is black, with a band of dots across it, pale gold and a few orange, and dark holes in it. In capitals: THE RIVER. I SAW IT. Esi, 10.',
        'Next to it a younger hand has painted the River brown and purple, like a road, with the label: what the River is like. She has not been to the Window yet. She is not far off.']);
    } });
    // the reading corner: an L of low shelves, beanbags, a rug, a lamp low over it
    prop(s, 'rug', 44.6, 0, 6.6, 0, { w: 3.6, d: 2.6, a: '#2f7f86', b: '#e9b23c' });
    prop(s, 'shelving', 42.5, 0, 7.4, Math.PI / 2, { w: 2.2, h: 1.0, d: 0.32, shelves: 2, wood: '#a8794f' });
    prop(s, 'shelving', 44.4, 0, 8.68, Math.PI, { w: 2.4, h: 0.86, d: 0.3, shelves: 2, wood: '#a8794f' });
    s.detail(() => {
      bookRunZ(g, 6.35, 8.45, 0.105, 42.34, 'X', 11, 0.3); bookRunZ(g, 6.35, 8.45, 0.565, 42.34, 'X', 12, 0.3);
      bookRun(g, 43.25, 45.55, 0.105, 8.83, 'z', 13, 0.26); bookRun(g, 43.25, 45.55, 0.493, 8.83, 'z', 14, 0.28);
    });
    prop(s, 'school.beanbag', 43.6, 0, 5.4, 0.6, { c: PAL.red, patch: PAL.saffron });
    prop(s, 'school.beanbag', 45.2, 0, 5.2, -0.3, { c: PAL.indigo, patch: PAL.leaf });
    prop(s, 'school.beanbag', 46.2, 0, 6.9, -1.2, { c: PAL.saffron, patch: PAL.teal });
    sign(s, { kind: 'letters', text: 'The reading corner', palette: ['#c9552e'], font: 'hand' }, 42.21, 2.62, 7.4, { face: 'X', w: 1.6, h: 0.22 });
    // an open picture book on the rug
    s.detail(() => {
      g.push(); g.move(44.4, 0.015, 6.4); g.rotY(0.4);
      g.mat('leather', PAL.teal); g.box(-0.2, 0, -0.13, 0.2, 0.01, 0.13);
      g.mat('paper', '#f6efdc'); g.box(-0.19, 0.01, -0.12, -0.005, 0.02, 0.12); g.box(0.005, 0.01, -0.12, 0.19, 0.02, 0.12);
      g.mat('paper', '#7cb55a'); g.box(0.03, 0.021, -0.08, 0.17, 0.022, 0.0); g.mat('paper', '#f4c430'); g.box(-0.17, 0.021, -0.02, -0.03, 0.022, 0.0);
      g.pop();
    });
    // the low tables: four, each laid for painting or building, with low chairs round them
    const LT = [[47.6, 11.0, PAL.saffron], [51.2, 11.0, PAL.teal], [47.6, 14.4, PAL.red], [51.2, 14.4, PAL.leaf]];
    LT.forEach((t, ti) => {
      prop(s, 'school.lowtable', t[0], 0, t[1], 0, { w: 1.4, d: 0.8, top: t[2] });
      const seats = [[-0.4, -0.66, 0], [0.4, -0.66, 0], [-0.4, 0.66, Math.PI], [0.4, 0.66, Math.PI], [-0.95, 0, Math.PI / 2], [0.95, 0, -Math.PI / 2]];
      seats.forEach((sp, k) => { if ((ti + k) % 5 === 4) return; prop(s, 'school.chair', t[0] + sp[0], 0, t[1] + sp[1], sp[2] + rnd.f(-0.12, 0.12), { c: BRIGHT[(ti * 2 + k) % BRIGHT.length], frame: '#3a3a3a', h: 0.3 }, { spot: { tags: ['class', 'school', 'kids'], low: true } }); });
    });
    s.detail(() => {
      const r = new Rng(61);
      for (const t of LT) {
        // paper, crayon pots, paint pots, a jar of brushes; every water jar has a lid
        for (let k = 0; k < 4; k++) { g.mat('paper', r.pick(['#fbf3e0', '#fdeee4', '#eef4f2'])); const x = t[0] - 0.5 + k * 0.32, z = t[1] + (k % 2 ? 0.18 : -0.18); g.push(); g.move(x, 0.501, z); g.rotY(r.f(-0.3, 0.3)); g.box(-0.13, 0, -0.1, 0.13, 0.003, 0.1); g.mat('paper', r.pick(BRIGHT)); g.box(-0.08, 0.003, -0.05, 0.05, 0.004, 0.04); g.pop(); }
        g.mat('glaze', '#e8e2d4'); g.cyl(t[0], 0.5, t[1], 0.05, 0.1, { segs: 10 }); g.mat('glaze', '#2f7f86'); g.cyl(t[0], 0.6, t[1], 0.055, 0.012, { segs: 10 });
        for (let k = 0; k < 5; k++) { g.mat('paint', BRIGHT[k]); g.tube([[t[0] + 0.12 + k * 0.02, 0.505, t[1] - 0.05], [t[0] + 0.12 + k * 0.02, 0.505, t[1] + 0.06]], 0.005, { segs: 5 }); }
        for (let k = 0; k < 3; k++) { g.mat('glaze', BRIGHT[(k + 2) % BRIGHT.length]); g.cyl(t[0] - 0.2 + k * 0.08, 0.5, t[1] + 0.02, 0.025, 0.035, { segs: 8 }); g.mat('glaze', '#f6ecd6'); g.cyl(t[0] - 0.2 + k * 0.08, 0.535, t[1] + 0.02, 0.027, 0.006, { segs: 8 }); }
      }
    });
    prop(s, 'school.blocks', 51.0, 0.5, 14.5, 0.2, { seed: 4, n: 5 });
    prop(s, 'school.blocks', 51.5, 0.5, 14.2, 0.9, { seed: 5, n: 3, arch: true });
    // the story circle: cushions in a ring on a round rug, the teacher's low chair
    const SCX = 52.4, SCZ = 7.0;
    s.detail(() => { g.mat('motif', '#8a2f3c'); g.cyl(SCX, 0.004, SCZ, 1.9, 0.01, { segs: 36 }); g.mat('weave', '#e9b23c'); g.lathe(SCX, SCZ, [[1.9, 0.014], [1.78, 0.016]], { segs: 36, capBottom: false, capTop: false }); });
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2 + 0.3; if (Math.abs(Math.sin(a) - 1) < 0.2 && Math.cos(a) > 0) continue;
      const x = SCX + Math.cos(a) * 1.4, z = SCZ + Math.sin(a) * 1.4;
      if (i === 3) continue;
      prop(s, 'school.cushion', x, 0.012, z, Math.atan2(SCX - x, SCZ - z), { a: BRIGHT[i % BRIGHT.length], b: '#f6ecd6', patch: i % 4 === 0 ? PAL.saffron : null }, { spot: { tags: ['class', 'school', 'kids', 'story'] } });
    }
    prop(s, 'school.armchair', SCX, 0, SCZ - 1.85, 0, { c: PAL.teal, cushion: PAL.saffron }, { spot: { tags: ['teach', 'school', 'story'] } });
    // the building blocks: a big rug, a bin, a tower half built, a ramp of blocks
    prop(s, 'rug', 45.6, 0, 14.3, 0, { w: 3.0, d: 2.4, a: '#2f3f7a', b: '#e9b23c', mat: 'weave' });
    prop(s, 'crate', 43.0, 0, 15.9, 0, { w: 0.8, h: 0.4, d: 0.5, wood: '#c9a070' });
    s.detail(() => { const r = new Rng(71); for (let i = 0; i < 14; i++) { g.mat('paint', r.pick(BRIGHT)); const x = 43.0 + r.f(-0.32, 0.32), z = 15.9 + r.f(-0.18, 0.18), y = 0.36 + r.f(0, 0.06); g.push(); g.move(x, y, z); g.rotY(r.f(0, 3)); g.box(-0.05, 0, -0.05, 0.05, 0.1, 0.05, { bevel: 0.006 }); g.pop(); } });
    prop(s, 'school.blocks', 45.0, 0.014, 14.0, 0.3, { seed: 7, n: 7, s: 0.11 });
    prop(s, 'school.blocks', 45.4, 0.014, 14.1, 1.1, { seed: 8, n: 4, s: 0.11, arch: true });
    prop(s, 'school.blocks', 46.4, 0.014, 14.6, 0.6, { seed: 9, n: 2, s: 0.11 });
    prop(s, 'school.blocks', 44.6, 0.014, 15.0, 2.1, { seed: 10, n: 3, s: 0.11 });
    prop(s, 'school.blocks', 46.9, 0.014, 13.4, 0.2, { seed: 11, n: 9, s: 0.11 });
    prop(s, 'school.blocks', 44.3, 0.014, 13.5, 1.7, { seed: 12, n: 1, s: 0.11 });
    s.detail(() => {
      // a wall of blocks half built, a ramp, blocks scattered where they fell
      const r = new Rng(72);
      for (let i = 0; i < 9; i++) { g.mat('paint', BRIGHT[i % BRIGHT.length]); const x = 45.6 + (i % 5) * 0.23, y = 0.014 + Math.floor(i / 5) * 0.11; g.box(x, y, 15.35, x + 0.22, y + 0.11, 15.46, { bevel: 0.008 }); }
      g.mat('wood', '#c9a070'); g.push(); g.move(46.9, 0.014, 14.4); g.rotY(0.6); g.rotZ(0.22); g.box(-0.45, 0, -0.1, 0.45, 0.025, 0.1, { bevel: 0.006 }); g.pop();
      for (let i = 0; i < 22; i++) { g.mat('paint', r.pick(BRIGHT)); g.push(); g.move(44.4 + r.f(0, 2.6), 0.014, 13.3 + r.f(0, 2.0)); g.rotY(r.f(0, 3)); if (r.chance(0.3)) g.box(-0.11, 0, -0.055, 0.11, 0.11, 0.055, { bevel: 0.008 }); else g.box(-0.055, 0, -0.055, 0.055, 0.11, 0.055, { bevel: 0.008 }); g.pop(); }
      // a wooden cab with its cabin swinging level, and a glide car on its side
      g.push(); g.move(46.2, 0.014, 15.0); g.rotY(-0.4);
      g.mat('wood', '#9a7048'); g.box(-0.16, 0, -0.07, 0.16, 0.02, 0.07, { bevel: 0.004 }); g.mat('cast', '#b8924c'); for (const sx of [-1, 1]) g.tube([[sx * 0.15, 0.02, -0.05], [sx * 0.15, 0.17, 0], [sx * 0.15, 0.02, 0.05]], 0.006, { segs: 4 });
      g.mat('paint', PAL.red); g.box(-0.12, 0.04, -0.065, 0.12, 0.17, 0.065, { bevel: 0.014 }); g.mat('plain', '#26323a'); g.box(-0.1, 0.1, -0.066, 0.1, 0.15, 0.066, { faces: 'zZ' });
      g.pop();
      g.mat('paint', PAL.saffron); g.ball(44.9, 0.06, 15.6, 0.15, 0.05, 0.06, { segs: 10, rings: 6 });
    });
    // the model drum that opens, on a low plinth table beside the blocks
    const MD = { x: 46.6, z: 16.15 };
    block(s, MD.x - 0.6, 0, MD.z - 0.4, MD.x + 0.6, 0.42, MD.z + 0.4, 'wood', '#a8794f', { bevel: 0.015 });
    // A drum lying on its side, axis along x (spinward, as the real one turns): the upper half of the shell is a lid
    // on a hinge at the back. Opened, it shows the decks as stripes in the cut, the green Hollow floor inside with a
    // lake and trees, the end walls, and a brass sunline down the middle.
    const shell = (g2, r, a0, a1, L, out) => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n;
        const P = (x, a) => [x, r * Math.sin(a), r * Math.cos(a)];
        if (out) g2.quad(P(-L / 2, b0), P(L / 2, b0), P(L / 2, b1), P(-L / 2, b1)); else g2.quad(P(-L / 2, b0), P(-L / 2, b1), P(L / 2, b1), P(L / 2, b0));
      }
    };
    const annulus = (g2, x, r0, r1, a0, a1, sx) => {
      const n = 14;
      for (let i = 0; i < n; i++) {
        const b0 = a0 + (a1 - a0) * i / n, b1 = a0 + (a1 - a0) * (i + 1) / n;
        r0 = Math.max(r0, 0.004); const P = (r, a) => [x, r * Math.sin(a), r * Math.cos(a)];
        if (sx < 0) g2.quad(P(r0, b0), P(r1, b0), P(r1, b1), P(r0, b1)); else g2.quad(P(r0, b0), P(r0, b1), P(r1, b1), P(r1, b0));
      }
    };
    const drumParts = (g2, open) => {
      const cx = MD.x, cz = MD.z, y = 0.42, R = 0.32, Ri = 0.17, L = 0.92, cy = y + R + 0.05;
      g2.mat('wood', '#6b4a2f'); for (const sx of [-1, 1]) g2.box(cx + sx * 0.34 - 0.03, y, cz - 0.24, cx + sx * 0.34 + 0.03, y + 0.1, cz + 0.24, { bevel: 0.006 });
      g2.push(); g2.move(cx, cy, cz);
      // the lower half: outer rim, the Hollow floor inside, the decks in the cut, the end walls
      g2.mat('paint', '#e6dcc4'); shell(g2, R, Math.PI, Math.PI * 2, L, true);
      g2.mat('paint', '#7cab4e'); shell(g2, Ri, Math.PI, Math.PI * 2, L - 0.02, false);
      const deckCols = ['#c9552e', '#e9b23c', '#e8dcc0', '#3f8a8e', '#e8dcc0', '#d39b3a', '#e8dcc0'];
      for (let k = 0; k < deckCols.length; k++) {
        const r0 = Ri + (R - Ri) * k / deckCols.length, r1 = Ri + (R - Ri) * (k + 1) / deckCols.length;
        g2.mat('paint', deckCols[k]);
        for (const sz of [-1, 1]) { const za = sz * r0, zb = sz * r1; g2.box(-L / 2, -0.002, Math.min(za, zb), L / 2, 0, Math.max(za, zb), { faces: 'Y' }); }
      }
      for (const sx of [-1, 1]) { g2.mat('wood', '#a8794f'); annulus(g2, sx * L / 2, 0.0, R, Math.PI, Math.PI * 2, sx); g2.mat('paint', '#d8cdb8'); annulus(g2, sx * (L / 2 - 0.01), 0.04, Ri, Math.PI, Math.PI * 2, -sx); }
      // the lake and the trees on the Hollow floor
      g2.mat('paint', '#3f8fc8', { rough: -0.3 }); for (let i = 0; i < 4; i++) { const a = Math.PI * 1.5 + (i - 1.5) * 0.08; g2.box(-0.12 + i * 0.01, Ri * Math.sin(a) + 0.003, Ri * Math.cos(a) - 0.02, 0.06, Ri * Math.sin(a) + 0.005, Ri * Math.cos(a) + 0.02, { faces: 'Y' }); }
      g2.mat('leafA', '#ffffff');
      for (let i = 0; i < 16; i++) { const x = -0.4 + (i % 8) * 0.11, a = Math.PI * 1.5 + (i < 8 ? -0.55 : 0.55) + (i % 3 - 1) * 0.08; if (x > -0.16 && x < 0.1 && Math.abs(a - Math.PI * 1.5) < 0.6) continue; g2.mat('paint', i % 2 ? '#3d6b2f' : '#4f7f3a'); g2.ball(x, Ri * Math.sin(a) * 0.86, Ri * Math.cos(a) * 0.86, 0.018, 0.022, 0.018, { segs: 6, rings: 4 }); }
      g2.mat('cast', '#f4c430', { emissive: 2.5 }); g2.tube([[-L / 2 + 0.02, 0, 0], [L / 2 - 0.02, 0, 0]], 0.005, { segs: 5 });
      g2.mat('cast', '#c8a45a'); for (const sx of [-1, 1]) g2.ball(sx * (L / 2 + 0.005), 0, 0, 0.018, 0.018, 0.018, { segs: 8, rings: 5 });
      // the lid: the upper half of the shell with its own end pieces; closed on top, or swung back on its hinge
      g2.push();
      if (open) { g2.move(0, 0, R); g2.rotX(1.95); g2.move(0, 0, -R); }
      g2.mat('paint', '#d9534f'); shell(g2, R + 0.006, 0, Math.PI, L + 0.01, true);
      g2.mat('paint', '#b8403a'); shell(g2, R - 0.004, 0, Math.PI, L, false);
      g2.mat('paint', '#e9b23c'); for (let k = 0; k < 5; k++) { const a = 0.35 + k * 0.6; g2.push(); g2.rotX(-a); g2.box(-L / 2 - 0.006, R + 0.004, -0.01, L / 2 + 0.006, R + 0.012, 0.01); g2.pop(); }
      for (const sx of [-1, 1]) { g2.mat('wood', '#a8794f'); annulus(g2, sx * L / 2, 0.0, R + 0.006, 0, Math.PI, sx); annulus(g2, sx * (L / 2 - 0.004), 0.0, R, 0, Math.PI, -sx); }
      g2.pop();
      g2.pop();
      g2.mat('cast', '#c8a45a'); g2.box(cx - L / 2, cy - 0.01, cz + R - 0.005, cx + L / 2, cy + 0.01, cz + R + 0.02);
    };
    const drumOpenMesh = dynMesh(s, [MD.x, 0.8, MD.z], (g2) => drumParts(g2, true), { radius: 1.2 });
    const drumShutMesh = dynMesh(s, [MD.x, 0.8, MD.z], (g2) => drumParts(g2, false), { radius: 1.2, hidden: true });
    let drumOpen = true;
    s.interact({ x: MD.x, y: 0.7, z: MD.z - 0.3, radius: 1.5, prompt: () => drumOpen ? 'Close the model drum' : 'Open the model drum', onUse(gm) {
      drumOpen = !drumOpen; if (drumOpenMesh) drumOpenMesh.userData.hidden = !drumOpen; if (drumShutMesh) drumShutMesh.userData.hidden = drumOpen;
      gm.sfxAt('clunk', f, MD.x, 0.6, MD.z, { vol: 0.5 });
      if (drumOpen) return say('The model drum', ['Inside, the decks are painted as rings, from the rim in to a green Hollow. The lake is a blue smear. The sunline is a brass wire down the middle.',
        'Somebody has written OUT IS DOWN on the inside of the shell, and somebody else has added AND IN IS UP, in better writing.']);
    } });
    // easels by the window
    prop(s, 'school.easel', 50.8, 0, 5.4, 0.2, { c: '#3f8fc8' });
    prop(s, 'school.easel', 49.4, 0, 5.3, -0.15, { c: '#d9534f' });
    // the bones poster, by the door: the discovery about the Low decks
    sign(s, { kind: 'poster', title: 'Grow heavy', lines: ['You weigh 0.98 here', 'Bones grow best near full weight', 'That is why school is on deck 16', 'Drink your milk'], palette: ['#2f7f86', '#f6ecd6', '#e9b23c'], motif: 'drum' }, 50.6, 1.6, 16.905, { face: 'z', w: 0.52, h: 0.74 });
    s.interact({ x: 50.6, y: 1.5, z: 16.3, radius: 1.4, prompt: 'Read the poster by the door', onUse(gm) {
      found(gm, 'low-deck-bones');
      return say('A poster', ['Grow heavy. You weigh 0.98 here. Bones grow best near full weight, or so every parent believes, which is why the school is on deck 16 and not up where it is light.', 'At the bottom, in a child\'s writing: I want to grow up on the Third. I would be very tall.']);
    } });
    // cubbies with names along the east wall, under the paintings
    s.furniture(() => {
      g.mat('wood', '#c9a070', { rough: -0.05 }); const x0 = 55.5;
      g.box(x0, 0, 9.4, 55.92, 1.08, 15.2, { faces: 'xyYzZ' });
      g.mat('wood', '#8a6240'); for (let i = 0; i < 11; i++) for (let j = 0; j < 3; j++) { const z = 9.5 + i * 0.52, y = 0.08 + j * 0.33; g.box(x0 - 0.002, y, z, x0 + 0.0, y + 0.28, z + 0.46, { faces: 'x' }); }
    });
    s.solid(55.5, 0, 9.4, 55.92, 1.08, 15.2);
    s.detail(() => { const r = new Rng(73); for (let i = 0; i < 11; i++) for (let j = 0; j < 3; j++) { if (r.chance(0.4)) continue; const z = 9.5 + i * 0.52 + 0.23, y = 0.08 + j * 0.33; g.mat(r.chance(0.5) ? 'knit' : 'paper', r.pick(BRIGHT)); g.box(55.55, y, z - 0.16, 55.85, y + r.f(0.06, 0.2), z + 0.16, { bevel: 0.01 }); } });
    // felt baffles and a cab mobile from the ceiling
    s.deco(() => {
      const r = new Rng(74);
      for (let i = 0; i < 9; i++) { const x = 43.6 + (i % 3) * 4.4 + r.f(-0.4, 0.4), z = 6 + Math.floor(i / 3) * 4 + r.f(-0.4, 0.4); g.mat('felt', BRIGHT[i % BRIGHT.length]); g.box(x - 0.7, H - 0.36, z - 0.04, x + 0.7, H - 0.06, z + 0.04, { bevel: 0.01 }); g.mat('cast', '#555'); g.tube([[x - 0.5, H - 0.06, z], [x - 0.5, H, z]], 0.004, { segs: 3 }); g.tube([[x + 0.5, H - 0.06, z], [x + 0.5, H, z]], 0.004, { segs: 3 }); }
      // a mobile of cabs and glide cars
      const mx = 49.6, my = 2.3, mz = 9.0;
      g.mat('weave', '#e9e2d0'); g.tube([[mx, H, mz], [mx, my, mz]], 0.002, { segs: 3, caps: false });
      g.mat('wood', '#8a6240'); g.tube([[mx - 0.5, my, mz], [mx + 0.5, my, mz]], 0.006, { segs: 4 });
      for (const q of [[mx - 0.5, PAL.red], [mx + 0.5, PAL.teal], [mx, PAL.saffron]]) {
        g.mat('weave', '#e9e2d0'); g.tube([[q[0], my, mz], [q[0], my - 0.3, mz]], 0.0015, { segs: 3, caps: false });
        g.mat('paint', q[1]); g.box(q[0] - 0.08, my - 0.44, mz - 0.06, q[0] + 0.08, my - 0.3, mz + 0.06, { bevel: 0.015 });
        g.mat('plain', '#26323a'); g.box(q[0] - 0.081, my - 0.39, mz - 0.04, q[0] + 0.081, my - 0.33, mz + 0.04, { faces: 'xX' });
      }
    });
    // a door from the corridor, open
    doorFrame(s, 49.0, 0, 17, 1.2, 2.2, 'x', { tint: '#1f5a60' });
    door(s, { x: 48.4, y: 0, z: 17, w: 1.2, h: 2.2, along: 'x', dir: 1, swing: 1, style: 'glazed', tint: PAL.saffron, open: true, label: "the small ones' room" });
    for (const w of [[43.16, 47.16], [51.56, 54.56]]) { s.glass(w[0], 1.05, 17, w[1], 2.25, 17, { opacity: 0.1 }); s.deco(() => { g.mat('wood', '#5b4636'); g.box(w[0] - 0.04, 1.0, 16.9, w[1] + 0.04, 1.06, 17.1, { bevel: 0.006 }); g.box(w[0] - 0.04, 2.25, 16.92, w[1] + 0.04, 2.3, 17.08, { bevel: 0.006 }); }); }
    s.zoneBox({ id: 'school-small', place: 'school', box: [42.08, -0.5, 4.11, 56, H, 17], name: 'The small ones', sub: 'Candlewick school · ages four to seven', ambience: 'school', reverb: 'felt' });

    // =====================================================================================================
    // THE MIDDLE CLASS: desks in a horseshoe, the slate, the raft on its stand, shelves of books, the light panel
    // =====================================================================================================
    const CO = clipOf(OLDER, H, 0.08);
    roomGlow(s, OLDER[0], 0, OLDER[1], OLDER[2], H, OLDER[3], { sky: '#f4eee0', ground: '#e0d4bf', power: 0.36 });
    for (const p of [[70, 7.5], [76.5, 7.5], [70, 13.6], [76.5, 13.6]]) lamp(s, 'panel', p[0], H, p[1], { w: 1.4, d: 0.6, K: 4000, power: 0.75, clip: CO });
    // the light panel wall: twenty minutes at 2,500 lux every morning
    s.structure(() => {
      g.mat('wood', '#5b4636'); g.box(66.08, 0.5, 7.3, 66.2, 2.5, 13.7, { bevel: 0.01 });
      g.mat('diffuser', '#fbf6ec', { emissive: 4.5, lamp: true }); g.box(66.2, 0.6, 7.4, 66.22, 2.4, 13.6, { faces: 'X' });
      g.mat('brushed', '#9a948a'); for (let z = 8.4; z < 13.6; z += 1.0) g.box(66.2, 0.6, z - 0.01, 66.235, 2.4, z + 0.01, { faces: 'XzZ' });
    });
    s.light({ at: [66.6, 1.5, 7.6], to: [66.6, 1.5, 13.4], type: 'tube', color: warm(5600), power: 9, range: 9, shadow: true, lamp: true, clip: CO, radius: 0.6 });
    sign(s, { kind: 'plate', text: 'Light panel', lines: ['2,500 lux · twenty minutes'] }, 66.25, 2.68, 10.5, { face: 'X', w: 0.42, h: 0.16 });
    s.interact({ x: 67.4, y: 1.4, z: 10.5, radius: 1.6, prompt: 'Sit at the light panel', onUse(gm) {
      if (gm.player && gm.player.sit) { gm.player.sit({ x: 67.5, y: 0, z: 10.5, eye: 1.1 }); gm.player.yaw = Math.PI - (-Math.PI / 2); gm.player.pitch = 0; }
      return say('The light panel', ['A wall of white light at 2,500 lux, brighter than any room in the block. Twenty minutes of it every morning sets the body clock, and costs about a hundredth of a kay.', 'The children sit with their backs to their desks and their faces in it and are not allowed to talk. Most of them talk.']);
    } });
    // the slate, on the east wall
    s.structure(() => {
      g.mat('wood', '#6b4a2f'); g.box(80.8, 0.92, 8.6, 80.92, 2.38, 12.4, { bevel: 0.01 });
      g.box(80.62, 0.9, 8.6, 80.92, 0.95, 12.4, { bevel: 0.008 });                                  // the chalk ledge
    });
    painted(s, 'school.slate', 3.6, 1.34, 210, drawSlate(), 80.795, 1.65, 10.5, { face: 'x', rough: 0.75 });
    s.detail(() => {
      g.mat('plain', '#f4ecd2'); for (let i = 0; i < 5; i++) g.cyl(80.72 - (i % 2) * 0.05, 0.95, 9.0 + i * 0.13, 0.008, 0.07, { segs: 6 });
      g.push(); g.move(80.75, 0.95, 11.6); g.mat('wood', '#8a6240'); g.box(-0.04, 0, -0.1, 0.04, 0.04, 0.1, { bevel: 0.006 }); g.mat('felt', '#3a3a3a'); g.box(-0.035, 0.04, -0.09, 0.035, 0.055, 0.09); g.pop();
      g.mat('plain', '#f2a48f'); g.cyl(80.7, 0.95, 12.1, 0.008, 0.05, { segs: 6 });
    });
    s.interact({ x: 80.0, y: 1.6, z: 10.5, radius: 2.2, prompt: 'Read the slate', onUse(gm) {
      gm.sfxAt('chalk', f, 80.7, 1.6, 10.5, { vol: 0.3 });
      return say('The slate', [SLATE.title + '.', SLATE.lines.slice(0, 3).join(' '), 'From a metre, on deck 16: drift = (2h) to the power 1.5, divided by 3 times the square root of r. So 2.83 over 3 times 54.2: 0.017 m. About two centimetres.',
        "Under the cloth's sweeps, yesterday is still showing: Spin sinks: 2 × 0.0572 × 13 = 1.5. A sixth of your weight. Anti floats: the same, taken off."]);
    } });
    // the teacher's desk, a lamp, papers, a lidded cup
    prop(s, 'table', 79.2, 0, 13.4, Math.PI / 2, { w: 1.4, d: 0.7, wood: '#6b4a2f', top: '#8a6240' });
    prop(s, 'chair', 79.8, 0, 13.4, -Math.PI / 2, { back: 'slat', wood: '#5b4636' }, { noSpots: true });
    s.spot('counter', 80.2, 0, 10.0, -Math.PI / 2, { who: 'lucan', tags: ['teach', 'school', 'keeper'] });
    s.spot('work', 79.0, 0, 11.6, -Math.PI / 2, { tags: ['teach', 'write', 'school'] });
    s.detail(() => {
      const r = new Rng(81);
      for (let i = 0; i < 6; i++) { g.mat('paper', r.pick(['#fbf3e0', '#f6efdc', '#eef4f2'])); g.box(78.9 + r.f(-0.1, 0.1), 0.74 + i * 0.006, 13.0 + r.f(-0.05, 0.05), 79.2 + r.f(-0.1, 0.1), 0.745 + i * 0.006, 13.4, { faces: 'Y' }); }
      g.mat('cast', '#2f7f86'); g.cyl(79.3, 0.74, 14.0, 0.07, 0.02, { segs: 10 }); g.tube([[79.3, 0.76, 14.0], [79.25, 1.05, 14.0], [79.1, 1.12, 13.9]], 0.008, { segs: 5 }); g.lathe(79.08, 13.88, [[0.0, 1.06], [0.07, 1.06], [0.04, 1.14], [0.0, 1.15]], { segs: 10 });
    });
    lamp(s, 'bulb', 79.08, 1.0, 13.88, { K: 2700, power: 0.35, range: 2.5, clip: CO });
    prop(s, 'cup', 79.45, 0.74, 12.9, 0, { glaze: '#c9552e' });
    // the horseshoe of desks, open toward the slate
    const DESKS = [];
    for (let i = 0; i < 9; i++) DESKS.push([69.7, 7.0 + i * 0.86, Math.PI / 2]);                      // the base, facing spinward
    for (let i = 0; i < 8; i++) DESKS.push([70.9 + i * 0.84, 6.1, 0]);                                // north arm, facing the back
    for (let i = 0; i < 8; i++) DESKS.push([70.9 + i * 0.84, 14.9, Math.PI]);                         // south arm, facing the front
    const TOPS = ['#b8875a', '#c49464', '#a87a4c', '#bf8c5c'];
    DESKS.forEach((d, i) => {
      const fy = d[2], sx = Math.sin(fy), sz = Math.cos(fy);
      prop(s, 'school.desk', d[0], 0, d[1], fy + Math.PI, { top: TOPS[i % TOPS.length], frame: i % 3 ? PAL.teal : PAL.indigo, book: BRIGHT[i % BRIGHT.length] });
      prop(s, 'school.chair', d[0] - sx * 0.42, 0, d[1] - sz * 0.42, fy + rnd.f(-0.15, 0.15), { c: HOUSES[i % 4][1], frame: '#3a3a3a', h: 0.42 }, { spot: { tags: ['class', 'school', 'desk'] } });
    });
    s.detail(() => {
      const r = new Rng(83);
      DESKS.forEach((d) => {
        const fy = d[2];
        if (r.chance(0.7)) { g.push(); g.move(d[0], 0.66, d[1]); g.rotY(fy + r.f(-0.3, 0.3)); g.mat('paper', '#f6efdc'); g.box(-0.15, 0, -0.1, 0.15, 0.004, 0.11); g.mat('plain', '#6a6058'); for (let k = 0; k < 5; k++) g.box(-0.12, 0.004, -0.07 + k * 0.035, 0.05 + r.f(0, 0.06), 0.005, -0.065 + k * 0.035); g.pop(); }
        if (r.chance(0.4)) { g.mat('paint', r.pick(BRIGHT)); g.push(); g.move(d[0] + r.f(-0.2, 0.2), 0.665, d[1] + r.f(-0.1, 0.1)); g.rotY(r.f(0, 3)); g.tube([[-0.08, 0.005, 0], [0.08, 0.005, 0]], 0.005, { segs: 5 }); g.pop(); }
        if (r.chance(0.25)) prop(s, 'cup', d[0] + r.f(-0.2, 0.2), 0.66, d[1] + r.f(-0.12, 0.12), 0, { glaze: r.pick(['#d9cfb8', '#2f7f86', '#c9552e']) });
      });
    });
    s.interact({ x: 73.3, y: 0.9, z: 6.6, radius: 1.3, prompt: 'Sit at a desk', onUse(gm) {
      if (gm.player && gm.player.sit) { gm.player.sit({ x: 73.42, y: 0, z: 5.68, eye: 1.08 }); gm.player.yaw = Math.PI; gm.player.pitch = -0.08; }
      if (gm.ui && gm.ui.toast) gm.ui.toast('A desk for an eleven-year-old. Your knees know it.', { kind: 'info' });
      gm.sfxAt('cutlery', f, 73.4, 0.6, 6.1, { vol: 0.2 });
    } });
    // the raft on its stand, by the window
    prop(s, 'school.raft', 79.4, 0, 5.6, 0.3, {});
    s.interact({ x: 79.4, y: 1.0, z: 5.6, radius: 1.4, prompt: 'Look at the model of the raft', onUse() {
      return say('The model raft', ['A flat platform of drums standing side by side, every axis pointing up at a brass bead on a wire: the Lantern. The rectennas are painted blue-grey on top; underneath, the radiators are black.',
        'One drum near one edge is painted red and has a paper flag on a pin. CHERVIL, it says, and under it, in a different hand, YOU ARE HERE (INSIDE).']);
    } });
    // shelves of paper books along the corridor wall
    prop(s, 'shelving', 76.8, 0, 16.7, Math.PI, { w: 1.8, h: 2.1, d: 0.32, shelves: 5, wood: '#7a5233' });
    prop(s, 'shelving', 78.7, 0, 16.7, Math.PI, { w: 1.8, h: 2.1, d: 0.32, shelves: 5, wood: '#6f5137' });
    s.detail(() => {
      for (let k = 0; k <= 4; k++) { const y = 0.105 + k * (2.1 - 0.11) / 5; bookRun(g, 75.95, 77.65, y, 16.85, 'z', 200 + k, 0.3); bookRun(g, 77.85, 79.55, y, 16.85, 'z', 210 + k, 0.3); }
    });
    sign(s, { kind: 'label', text: 'Read it, bring it back', ink: '#2a2622' }, 77.75, 2.22, 16.9, { face: 'z', w: 1.2, h: 0.1 });
    // posters: weight is a map, and the houses
    sign(s, { kind: 'poster', title: 'Weight is a map', lines: ['The Keel 1 g', 'The Low decks 0.98 to 0.85', 'The Middle decks', 'The High decks', 'The Hollow 0.5', 'The Spindle: nearly nothing'], palette: ['#1f2f4a', '#f3e6c8', '#e9b23c'], motif: 'drum' }, 67.75, 1.8, 4.195, { face: 'Z', w: 0.6, h: 0.86 });
    sign(s, { kind: 'poster', title: 'Herb Row', lines: ['Chervil, a hall drum', 'Tansy has the hens', 'Lovage bakes the bread', 'Rue takes notes'], palette: ['#3d5a3a', '#f3e6c8', '#e9b23c'], motif: 'leaf' }, 80.88, 1.8, 15.2, { face: 'x', w: 0.6, h: 0.86 });
    // plants along the window sill, under the window's light
    s.structure(() => { g.mat('wood', '#a8794f'); g.box(69.4, 0.78, 4.19, 78.6, 0.84, 4.5, { bevel: 0.008 }); });
    for (let i = 0; i < 7; i++) prop(s, 'plant', 69.9 + i * 1.3, 0.84, 4.36, i, { kind: ['broad', 'fine', 'fern', 'flower'][i % 4], size: 0.45 + (i % 3) * 0.1, pot: BRIGHT[i % BRIGHT.length] });
    // a cupboard under the window, a rug inside the horseshoe, a clock over the slate, a house band round the walls
    s.furniture(() => {
      g.mat('paint', '#2f6f73'); g.box(69.5, 0, 4.19, 78.5, 0.76, 4.64, { bevel: 0.01 });
      g.mat('paint', '#3a8a8e'); for (let x = 69.6; x < 78.4; x += 0.9) g.box(x, 0.08, 4.64, x + 0.84, 0.7, 4.66, { bevel: 0.006, faces: 'Z' });
      g.mat('cast', '#c8a45a'); for (let x = 69.6; x < 78.4; x += 0.9) g.box(x + 0.38, 0.5, 4.66, x + 0.46, 0.53, 4.68);
    });
    s.solid(69.5, 0, 4.19, 78.5, 0.76, 4.64);
    prop(s, 'rug', 74.2, 0, 10.5, 0, { w: 6.0, d: 4.2, a: '#3b4f8f', b: '#e9b23c' });
    s.deco(() => {
      g.push(); g.move(80.88, 2.72, 10.5); g.rotZ(Math.PI / 2);
      g.mat('wood', '#5b4636'); g.cyl(0, 0, 0, 0.23, 0.04, { segs: 24 }); g.mat('paint', '#f6ecd6'); g.cyl(0, 0.04, 0, 0.2, 0.004, { segs: 24 });
      g.pop();
      g.mat('plain', '#2a2622'); g.box(80.835, 2.72, 10.49, 80.84, 2.86, 10.51, { faces: 'x' }); g.box(80.835, 2.71, 10.5, 80.84, 2.73, 10.6, { faces: 'x' });
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; g.box(80.836, 2.72 + Math.cos(a) * 0.17 - 0.008, 10.5 + Math.sin(a) * 0.17 - 0.008, 80.84, 2.72 + Math.cos(a) * 0.17 + 0.008, 10.5 + Math.sin(a) * 0.17 + 0.008, { faces: 'x' }); }
      for (let i = 0; i < 4; i++) { g.mat('paint', HOUSES[i][1]); for (let x = 66.08 + i * 1.0; x < 80.92; x += 4) g.box(x, 2.56, 4.19, Math.min(80.92, x + 1.0), 2.62, 4.2, { faces: 'Z' }); }
    });
    // two lines of the class's work strung across the room, pegged up to dry
    s.detail(() => {
      const r = new Rng(85);
      for (const z of [8.6, 12.4]) {
        const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push([66.2 + t * 14.6, 2.75 - 0.25 * 4 * t * (1 - t), z]); }
        g.mat('weave', '#8a6a4a'); g.tube(pts, 0.007, { segs: 4, caps: false });
        for (let i = 1; i < 12; i++) {
          const p = pts[i], w = r.f(0.24, 0.32), h = r.f(0.3, 0.38);
          g.mat('paper', r.pick(['#fbf3e0', '#fdeee4', '#eef4f2', '#f3f7d8']));
          g.quad([p[0] - w / 2, p[1] - h, z], [p[0] + w / 2, p[1] - h, z], [p[0] + w / 2, p[1], z], [p[0] - w / 2, p[1], z], { double: true });
          g.mat('paper', r.pick(BRIGHT)); const k = r.f(0.2, 0.6);
          g.quad([p[0] - w * 0.35, p[1] - h * (k + 0.25), z + 0.002], [p[0] + w * 0.35, p[1] - h * (k + 0.25), z + 0.002], [p[0] + w * 0.35, p[1] - h * k, z + 0.002], [p[0] - w * 0.35, p[1] - h * k, z + 0.002], { double: true });
          g.mat('wood', '#c9a070'); g.box(p[0] - 0.008, p[1] - 0.03, z - 0.01, p[0] + 0.008, p[1] + 0.03, z + 0.01);
        }
      }
    });
    doorFrame(s, 73.8, 0, 17, 1.2, 2.2, 'x', { tint: '#1f5a60' });
    door(s, { x: 73.2, y: 0, z: 17, w: 1.2, h: 2.2, along: 'x', dir: 1, swing: 1, style: 'glazed', tint: PAL.indigo, open: true, label: 'the middle class' });
    for (const w of [[67.5, 71.5]]) { s.glass(w[0], 1.05, 17, w[1], 2.25, 17, { opacity: 0.1 }); s.deco(() => { g.mat('wood', '#5b4636'); g.box(w[0] - 0.04, 1.0, 16.9, w[1] + 0.04, 1.06, 17.1, { bevel: 0.006 }); g.box(w[0] - 0.04, 2.25, 16.92, w[1] + 0.04, 2.3, 17.08, { bevel: 0.006 }); }); }
    s.zoneBox({ id: 'school-middle', place: 'school', box: [66, -0.5, 4.11, 81, H, 17], name: 'The middle class', sub: "Candlewick school · Lucan's room", ambience: 'school', reverb: 'room' });

    // =====================================================================================================
    // TEACHERS' ROOM
    // =====================================================================================================
    const CT = clipOf(TEACH, H, 0.08);
    roomGlow(s, TEACH[0], 0, TEACH[1], TEACH[2], H, TEACH[3], { sky: '#ffdcb0', ground: '#d8c4a6', power: 0.3 });
    lamp(s, 'globe', 85, 2.3, 7.0, { K: 2700, clip: CT, power: 0.75, drop: 0.8 });
    lamp(s, 'globe', 85, 2.3, 11.6, { K: 2700, clip: CT, power: 0.75, drop: 0.8 });
    // a standard lamp by the sofa, and a rail of costumes for the feast, newly dyed
    s.furniture(() => { g.mat('cast', '#3a3a3a'); g.lathe(81.7, 11.0, [[0.16, 0], [0.14, 0.03], [0.02, 0.05], [0.015, 1.45]], { segs: 10 }); g.mat('weave', '#e9c890'); g.lathe(81.7, 11.0, [[0.2, 1.38], [0.13, 1.62], [0.11, 1.63]], { segs: 14, capBottom: false }); });
    s.post(81.7, 11.0, 0.16, 0, 1.6);
    lamp(s, 'bulb', 81.7, 1.48, 11.0, { K: 2600, power: 0.6, range: 3.5, clip: CT });
    s.furniture(() => { g.mat('cast', '#5b5650'); for (const z of [13.6, 16.2]) g.tube([[88.4, 0, z], [88.4, 1.5, z]], 0.014, { segs: 6 }); g.tube([[88.4, 1.5, 13.6], [88.4, 1.5, 16.2]], 0.012, { segs: 6 }); });
    for (let i = 0; i < 6; i++) prop(s, 'school.coat', 88.4, 1.5, 13.9 + i * 0.42, -Math.PI / 2, { a: ['#e2553a', '#e9b23c', '#7cab4e', '#8a4a6a', '#2f7f86', '#d4878a'][i], lining: ['#f6ecd6', '#33407a', '#e9b23c', '#e9b23c', '#e2553a', '#7cab4e'][i], len: 0.55, hood: i % 2 === 0 }, { noCollide: true });
    s.solid(88.2, 0, 13.5, 88.6, 1.5, 16.3);
    sign(s, { kind: 'label', text: 'For the feast: dyed, not new', ink: '#2a2622' }, 88.85, 1.72, 14.9, { face: 'x', w: 1.3, h: 0.1 });
    prop(s, 'rug', 85, 0, 6.6, 0, { w: 3.0, d: 2.2, a: '#5b4060', b: '#e9b23c' });
    prop(s, 'school.armchair', 83.6, 0, 6.7, 0.5, { c: PAL.plum, cushion: PAL.saffron });
    prop(s, 'school.armchair', 86.5, 0, 6.6, -0.6, { c: PAL.teal, cushion: '#e8743b' });
    prop(s, 'table', 85, 0, 7.6, 0, { round: true, w: 0.7, h: 0.48, wood: '#6b4a2f' });
    prop(s, 'cup', 84.9, 0.48, 7.55, 0, { glaze: '#e9b23c' }); prop(s, 'cup', 85.12, 0.48, 7.68, 0, { glaze: '#2f7f86' });
    s.structure(() => { g.mat('wood', '#a8794f'); g.box(83.4, 0.96, 4.19, 86.6, 1.02, 4.48, { bevel: 0.008 }); });
    prop(s, 'plant', 84.1, 1.02, 4.34, 0, { kind: 'fine', size: 0.6, pot: '#d9cfb8' }); prop(s, 'plant', 85.9, 1.02, 4.34, 0, { kind: 'broad', size: 0.7, pot: PAL.red });
    // the long table for marking
    prop(s, 'table', 85, 0, 11.4, Math.PI / 2, { w: 2.4, d: 0.9, wood: '#6b4a2f', top: '#7a5233' });
    for (const p of [[84.2, 10.6, Math.PI / 2], [84.2, 11.4, Math.PI / 2], [84.2, 12.2, Math.PI / 2], [85.8, 10.6, -Math.PI / 2], [85.8, 11.9, -Math.PI / 2]]) prop(s, 'chair', p[0], 0, p[1], p[2] + rnd.f(-0.2, 0.2), { back: rnd.chance(0.5) ? 'slat' : 'hoop', wood: rnd.pick(['#6b4a2f', '#7a5233', '#5b4636']) }, { spot: { tags: ['teachers', 'school', 'write'] } });
    s.detail(() => {
      const r = new Rng(91);
      for (let k = 0; k < 4; k++) { const z = 10.5 + k * 0.5; for (let i = 0; i < 8; i++) { g.mat('paper', r.pick(['#fbf3e0', '#f6efdc', '#eef4f2', '#fde4da'])); g.box(84.75 + r.f(-0.03, 0.03), 0.74 + i * 0.005, z - 0.1 + r.f(-0.02, 0.02), 85.05 + r.f(-0.03, 0.03), 0.744 + i * 0.005, z + 0.12, { faces: 'Y' }); } }
      g.mat('paint', PAL.red); g.tube([[85.3, 0.745, 11.0], [85.45, 0.745, 11.08]], 0.005, { segs: 5 });
    });
    prop(s, 'cup', 85.3, 0.74, 12.3, 0, { glaze: '#d9cfb8' }); prop(s, 'bowl', 85.25, 0.74, 10.4, 0, { glaze: '#2f7f86' });
    // the counter: a sink with the 65 degree tap, a kettle on its plate, cups on hooks, a lidded tin
    prop(s, 'counter', 88.55, 0, 11.4, -Math.PI / 2, { w: 2.6, d: 0.6, body: '#2f7f86', top: '#c9a070' }, { noSpots: true });
    prop(s, 'school.kettle', 88.5, 0.92, 10.6, -Math.PI / 2, {});
    s.detail(() => {
      g.mat('brushed', '#b8b2a8'); g.box(88.25, 0.88, 11.6, 88.75, 0.925, 12.2, { faces: 'Y' });
      g.mat('brushed', '#8a847a'); g.tube([[88.85, 0.92, 11.9], [88.85, 1.2, 11.9], [88.6, 1.24, 11.9]], 0.014, { segs: 6 });
      g.mat('paint', PAL.red); g.cyl(88.85, 1.12, 11.98, 0.025, 0.02, { segs: 8 });
      g.mat('wood', '#6b4a2f'); g.box(88.86, 1.5, 10.0, 88.92, 1.55, 12.8, { bevel: 0.004 });
      for (let i = 0; i < 7; i++) { const z = 10.2 + i * 0.36; g.mat('cast', '#c8a45a'); g.tube([[88.86, 1.5, z], [88.8, 1.47, z]], 0.004, { segs: 4 }); }
      g.mat('cast', '#c9552e'); g.cyl(88.5, 0.92, 12.6, 0.07, 0.14, { segs: 12 }); g.mat('cast', '#e9b23c'); g.cyl(88.5, 1.06, 12.6, 0.073, 0.02, { segs: 12 });
    });
    for (let i = 0; i < 7; i++) prop(s, 'cup', 88.76, 1.36, 10.2 + i * 0.36, Math.PI / 2, { glaze: BRIGHT[i % BRIGHT.length], open: true }, { noCollide: true });
    s.spot('work', 87.8, 0, 11.0, Math.PI / 2, { tags: ['tea', 'school', 'teachers'] });
    s.interact({ x: 88.0, y: 1.1, z: 10.6, radius: 1.3, prompt: 'Make a cup of tea', onUse(gm) {
      gm.sfxAt('pour', f, 88.5, 1.0, 10.6, { vol: 0.5 });
      return say('The kettle', ['The tap gives water at 65 degrees off the food plant\'s loop, for nothing. The plate only has to finish it, which takes a minute.', 'You put a lid on the cup without thinking. Somebody has written on the tin: TEACHERS ONLY. CHILDREN ALSO WELCOME.']);
    } });
    // pigeonholes on the west wall, a coat stand
    s.furniture(() => {
      g.mat('wood', '#7a5233'); g.box(81.08, 0.9, 13.2, 81.42, 2.3, 16.4, { faces: 'XyYzZ' });
      g.mat('wood', '#4a3424'); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) g.box(81.42, 0.94 + j * 0.34, 13.25 + i * 0.395, 81.425, 1.24 + j * 0.34, 13.6 + i * 0.395, { faces: 'X' });
    });
    s.solid(81.08, 0.9, 13.2, 81.42, 2.3, 16.4);
    s.detail(() => { const r = new Rng(93); for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) { if (r.chance(0.35)) continue; g.mat('paper', r.pick(['#fbf3e0', '#f6efdc', '#eef4f2', '#fde4da'])); g.box(81.2, 0.95 + j * 0.34, 13.3 + i * 0.395, 81.43, 0.95 + j * 0.34 + r.f(0.03, 0.15), 13.55 + i * 0.395, { bevel: 0.004 }); } });
    s.furniture(() => { g.mat('wood', '#5b4636'); g.lathe(82.0, 16.3, [[0.2, 0], [0.18, 0.03], [0.03, 0.06], [0.025, 1.75], [0.04, 1.8]], { segs: 10 }); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; g.tube([[82.0, 1.7, 16.3], [82.0 + Math.cos(a) * 0.14, 1.78, 16.3 + Math.sin(a) * 0.14]], 0.012, { segs: 4 }); } });
    s.post(82.0, 16.3, 0.2, 0, 1.8);
    prop(s, 'school.coat', 82.12, 1.78, 16.3, Math.PI / 2, { a: '#26306b', lining: '#e0a040', len: 1.0, patch: '#e0a040' }, { noCollide: true });
    sign(s, { kind: 'notice', title: 'Booking Day', lines: ['No marking on the Quiet.', 'The feast at one.', 'Somebody bring a knife', 'for the apples.'], hand: true }, 84.5, 1.6, 16.905, { face: 'z', w: 0.34, h: 0.42 });
    // a sofa along the west wall, a bookcase, a timetable, a plant under the lamp
    s.furniture(() => {
      const x = 81.5;
      g.mat('wood', '#4a3424'); for (const z of [8.3, 10.3]) for (const dx of [-0.25, 0.25]) g.cyl(x + dx, 0, z, 0.025, 0.12, { segs: 6 });
      g.mat('weave', '#8a2f3c'); g.box(x - 0.36, 0.12, 8.1, x + 0.36, 0.42, 10.5, { bevel: 0.05 }); g.box(x - 0.42, 0.42, 8.1, x - 0.18, 0.86, 10.5, { bevel: 0.06 });
      g.box(x - 0.36, 0.42, 8.0, x + 0.3, 0.64, 8.24, { bevel: 0.05 }); g.box(x - 0.36, 0.42, 10.36, x + 0.3, 0.64, 10.6, { bevel: 0.05 });
      g.mat('weave', '#b8403a'); g.box(x - 0.2, 0.42, 8.3, x + 0.3, 0.5, 9.28, { bevel: 0.04 }); g.box(x - 0.2, 0.42, 9.32, x + 0.3, 0.5, 10.3, { bevel: 0.04 });
      g.mat('knit', PAL.saffron); g.box(x - 0.15, 0.5, 9.6, x + 0.25, 0.53, 10.25, { bevel: 0.01 });
      g.mat('weave', '#2f7f86'); g.push(); g.move(x - 0.1, 0.62, 8.6); g.rotZ(0.4); g.box(-0.05, -0.15, -0.18, 0.05, 0.15, 0.18, { bevel: 0.04 }); g.pop();
    });
    s.solid(81.1, 0, 8.0, 81.9, 0.5, 10.6);
    for (const z of [8.7, 9.7]) s.spot('sit', 81.75, 0.5, z, Math.PI / 2, { tags: ['teachers', 'school', 'rest'] });
    prop(s, 'shelving', 88.7, 0, 6.2, -Math.PI / 2, { w: 2.0, h: 2.0, d: 0.32, shelves: 5, wood: '#6f5137' });
    s.detail(() => { for (let k = 0; k <= 4; k++) { const y = 0.105 + k * (2.0 - 0.11) / 5; bookRunZ(g, 5.25, 7.15, y, 88.86, 'x', 300 + k, 0.28); } });
    prop(s, 'rug', 85, 0, 11.4, 0, { w: 2.4, d: 3.4, a: '#2f4f6f', b: '#c9552e' });
    sign(s, { kind: 'chalk', title: 'This week', lines: ['Thu: spinball v Ropewalk', 'Fri: the Quiet', 'Sat: Booking Day', 'Window round: Ada, Oskar, Ilse', 'Lamp-painting: Oona'] }, 81.13, 1.75, 12.0, { face: 'X', w: 0.9, h: 0.9 });
    prop(s, 'plant', 88.5, 0, 4.7, 0, { kind: 'fern', size: 1.2, pot: '#2f7f86' });
    doorFrame(s, 84.9, 0, 17, 1.0, 2.1, 'x', { tint: '#1f5a60' });
    door(s, { x: 84.4, y: 0, z: 17, w: 1.0, h: 2.1, along: 'x', dir: 1, swing: 1, style: 'panel', tint: '#7a5233', label: "the teachers' room" });
    s.zoneBox({ id: 'school-teachers', place: 'school', box: [81, -0.5, 4.11, 89, H, 17], name: "The teachers' room", sub: 'Candlewick school', ambience: 'school', reverb: 'felt' });

    // =====================================================================================================
    // THE MILL ROOM: where the children eat the free table at twelve
    // =====================================================================================================
    const CM = clipOf(MILL, H, 0.08);
    roomGlow(s, MILL[0], 0, MILL[1], MILL[2], H, MILL[3], { sky: '#ffe4bc', ground: '#e2d6c0', power: 0.34 });
    lamp(s, 'globe', 92.2, 2.3, 9.6, { K: 3000, clip: CM, power: 0.7, drop: 0.8 }); lamp(s, 'globe', 96.6, 2.3, 9.6, { K: 3000, clip: CM, power: 0.7, drop: 0.8 });
    lamp(s, 'globe', 92.2, 2.3, 13.4, { K: 3000, clip: CM, power: 0.7, drop: 0.8 }); lamp(s, 'globe', 96.6, 2.3, 13.4, { K: 3000, clip: CM, power: 0.7, drop: 0.8 });
    for (const z of [9.6, 13.4]) {
      prop(s, 'table', 94.4, 0, z, 0, { w: 6.4, d: 0.8, h: 0.62, legs: 'trestle', wood: '#8a6240', top: '#b8875a' });
      for (const sz of [-1, 1]) for (let i = 0; i < 3; i++) prop(s, 'bench', 92.2 + i * 2.2, 0, z + sz * 0.62, sz > 0 ? Math.PI : 0, { w: 2.0, wood: '#a8794f', metal: '#3a3a3a' }, { spot: { tags: ['eat', 'school', 'kids'] } });
    }
    s.detail(() => {
      const r = new Rng(95);
      for (const z of [9.6, 13.4]) for (let i = 0; i < 9; i++) { const x = 91.6 + i * 0.7; for (const sz of [-1, 1]) { if (r.chance(0.3)) continue; prop(s, 'bowl', x + r.f(-0.05, 0.05), 0.62, z + sz * 0.22, 0, { glaze: r.pick(['#e9e1cf', '#2f7f86', '#e9b23c', '#c9552e']), r: 0.075 }); prop(s, 'cup', x + 0.15, 0.62, z + sz * 0.2, 0, { glaze: '#d9cfb8' }); } }
    });
    // the serving counter: the Mill table, everything under its lid, and the bowl of the Nine
    prop(s, 'counter', 99.4, 0, 11.5, -Math.PI / 2, { w: 4.2, d: 0.7, body: '#c9552e', top: '#d8c8a8', topMat: 'tile' }, { spot: { tags: ['serve', 'aunt', 'school'] } });
    for (let i = 0; i < 4; i++) prop(s, 'crock', 99.45, 0.92, 9.9 + i * 0.75, 0, { glaze: ['#8a5a3c', '#2f7f86', '#d9cfb8', '#5b4060'][i], h: 0.34, r: 0.15 });
    prop(s, 'bowl', 99.4, 0.92, 13.35, 0, { glaze: '#3d5a3a', lid: '#2a3a2a', r: 0.12 });
    sign(s, { kind: 'chalk', title: 'The Mill table', lines: ['Rice and broth', 'Bread and fat', 'Sweet buns', 'The Nine, if you are brave', 'Lids back on'] }, 99.83, 1.7, 11.5, { face: 'x', w: 0.62, h: 0.86 });
    s.interact({ x: 98.6, y: 1.2, z: 11.5, radius: 1.6, prompt: 'Look at the Mill table', onUse() {
      return say('The Mill table', ['The free table, the same as in every hall: starch, sugar, fat and the amino flours, made up into rice, broth, bread and buns. Every crock has its lid on, because the air here would have it cold in minutes.', 'The small green bowl at the end is the bitter Nine. A card propped against it says: one spoon makes you brave.']);
    } });
    // paintings along the west wall, aprons on pegs by the door, the aunts' rota
    {
      const r = new Rng(99);
      for (let i = 0; i < 7; i++) { const pi = (i * 3 + 2) % PAINTINGS.length; painted(s, 'school.paint.' + pi, 0.42, 0.32, 240, drawPainting(PAINTINGS[pi], 100 + pi), 89.165, 1.85 + r.f(-0.08, 0.08), 6.0 + i * 1.45, { face: 'X', tilt: r.f(-0.05, 0.05), tier: 'd' }); }
    }
    s.deco(() => { g.mat('wood', '#8a5a34'); g.box(95.0, 1.55, 16.82, 99.6, 1.62, 16.92, { bevel: 0.006 }); });
    for (let i = 0; i < 5; i++) prop(s, 'school.coat', 95.4 + i * 0.9, 1.62, 16.82, Math.PI, { a: ['#f6ecd6', '#e9b23c', '#f6ecd6', '#7cab4e', '#f6ecd6'][i], lining: PAL.red, len: 0.8 }, { noCollide: true });
    sign(s, { kind: 'notice', title: 'Aunts on the Mill table', lines: ['Mon: Bo, Kemi', 'Tue: Ros, Dagny', 'Wed: Halima', 'Thu: Bo, Kemi', 'Booking Day: everyone, the hall'], hand: true }, 92.0, 1.65, 4.2, { face: 'Z', w: 0.42, h: 0.52 });
    sign(s, { kind: 'poster', title: 'Lids on', lines: ['The air takes the heat', 'four times faster here', 'Lids back on'], palette: ['#c9552e', '#f6ecd6', '#e9b23c'], motif: 'cup' }, 99.83, 1.75, 14.6, { face: 'x', w: 0.5, h: 0.72 });
    doorFrame(s, 93.7, 0, 17, 1.4, 2.2, 'x', { tint: '#1f5a60' });
    door(s, { x: 93.0, y: 0, z: 17, w: 1.4, h: 2.2, along: 'x', dir: 1, swing: 1, style: 'glazed', tint: PAL.leaf, open: true, label: 'the Mill room' });
    for (const w of [[95.6, 99.6]]) { s.glass(w[0], 1.05, 17, w[1], 2.25, 17, { opacity: 0.1 }); s.deco(() => { g.mat('wood', '#5b4636'); g.box(w[0] - 0.04, 1.0, 16.9, w[1] + 0.04, 1.06, 17.1, { bevel: 0.006 }); g.box(w[0] - 0.04, 2.25, 16.92, w[1] + 0.04, 2.3, 17.08, { bevel: 0.006 }); }); }
    s.zoneBox({ id: 'school-mill', place: 'school', box: [89, -0.5, 4.11, 100, H, 17], name: 'The Mill room', sub: 'Candlewick school · lunch at twelve', ambience: 'school', reverb: 'room' });

    // =====================================================================================================
    // THE CORRIDOR
    // =====================================================================================================
    const CC = clipOf(CORR, H, 0.1);
    roomGlow(s, CORR[0], 0, CORR[1], CORR[2], H, CORR[3], { sky: '#ffe2b8', ground: '#d8b8a0', power: 0.3 });
    for (const x of [45.5, 53, 68.5, 77, 85, 94]) lamp(s, 'strip', x - 1.6, H - 0.02, 18.34, { to: [x + 1.6, H - 0.02, 18.34], K: 3200, power: 0.7, clip: CC });
    s.structure(() => {
      g.mat('speckle', '#2f7f86'); g.box(42.3, 0, 18.27, 99.7, 0.003, 18.41, { faces: 'Y' });                       // the line to follow
      g.mat('brushed', '#9a948a'); g.tube([[42.2, H - 0.14, 19.3], [99.8, H - 0.14, 19.3]], 0.05, { segs: 8 }); g.tube([[42.2, H - 0.1, 19.12], [99.8, H - 0.1, 19.12]], 0.03, { segs: 6 });
      g.mat('paint', '#c9552e'); g.tube([[42.2, H - 0.26, 19.36], [99.8, H - 0.26, 19.36]], 0.022, { segs: 6 });
      g.mat('cast', '#5b5650'); for (let x = 43; x < 99.6; x += 2.4) g.box(x - 0.02, H - 0.32, 19.25, x + 0.02, H, 19.42);
    });
    // a strip of cork on the south wall, full of the middle class's work, between the doors
    s.deco(() => {
      g.mat('felt', '#c49a68');
      for (const seg of [[43, 50.4], [52.0, 58.6], [63.4, 73.2], [77.4, 84.8], [88.6, 99.2]]) g.box(seg[0], 1.25, 19.515, seg[1], 2.25, 19.52, { faces: 'z' });
      g.mat('wood', '#7a5233'); for (const seg of [[43, 50.4], [52.0, 58.6], [63.4, 73.2], [77.4, 84.8], [88.6, 99.2]]) { g.box(seg[0], 2.25, 19.49, seg[1], 2.29, 19.52, { bevel: 0.004 }); g.box(seg[0], 1.21, 19.49, seg[1], 1.25, 19.52, { bevel: 0.004 }); }
    });
    {
      const r = new Rng(97); let k = 0;
      for (const seg of [[43, 50.4], [52.0, 58.6], [63.4, 73.2], [77.4, 84.8], [88.6, 99.2]]) for (let x = seg[0] + 0.45; x < seg[1] - 0.3; x += r.f(0.75, 1.2)) {
        const pi = (k++ * 5) % PAINTINGS.length;
        painted(s, 'school.paint.' + pi, 0.42, 0.32, 240, drawPainting(PAINTINGS[pi], 100 + pi), x, 1.75 + r.f(-0.15, 0.15), 19.512, { face: 'z', tilt: r.f(-0.06, 0.06), tier: 'd' });
      }
    }
    // the drinking fountain and a bench
    s.furniture(() => {
      g.mat('glaze', '#2f7f86'); g.box(57.6, 0, 19.2, 58.4, 0.78, 19.52, { bevel: 0.02 });
      g.mat('brushed', '#b8b2a8'); g.box(57.65, 0.78, 19.18, 58.35, 0.82, 19.52, { bevel: 0.01 }); g.tube([[58.0, 0.82, 19.4], [58.0, 0.9, 19.36]], 0.01, { segs: 5 });
    });
    s.solid(57.6, 0, 19.2, 58.4, 0.82, 19.52);
    s.interact({ x: 58, y: 0.9, z: 19.0, radius: 1.0, prompt: 'Drink from the fountain', onUse(gm) { gm.sfxAt('pour', f, 58, 0.85, 19.35, { vol: 0.3 }); if (gm.ui && gm.ui.toast) gm.ui.toast('Cold, and at child height. You bend a long way.', { kind: 'info' }); } });
    prop(s, 'bench', 70.2, 0, 19.22, Math.PI, { w: 1.8, wood: '#a8794f', metal: '#1f5a60' });
    // plates by every door
    sign(s, { kind: 'plate', text: 'The small ones', lines: ['ages four to seven'] }, 47.75, 1.75, 16.915, { face: 'Z', w: 0.36, h: 0.16 });
    sign(s, { kind: 'plate', text: 'The middle class', lines: ['Lucan Ferro'] }, 72.55, 1.75, 16.915, { face: 'Z', w: 0.36, h: 0.16 });
    sign(s, { kind: 'plate', text: 'Teachers', lines: ['knock, then come in'] }, 83.8, 1.75, 16.915, { face: 'Z', w: 0.36, h: 0.16 });
    sign(s, { kind: 'plate', text: 'The Mill room', lines: ['lunch at twelve'] }, 92.35, 1.75, 16.915, { face: 'Z', w: 0.36, h: 0.16 });
    sign(s, { kind: 'plate', text: 'Washrooms', lines: ['child height'] }, 50.4, 1.75, 19.515, { face: 'z', w: 0.32, h: 0.15 });
    sign(s, { kind: 'plate', text: 'Store', lines: ['Kwame has the key'] }, 73.4, 1.75, 19.515, { face: 'z', w: 0.32, h: 0.15 });
    sign(s, SIGNS['spinball.fascia'], 61.0, 2.88, 19.512, { face: 'z', w: 3.0, h: 0.42 });
    sign(s, { kind: 'street', text: 'The long hall', sub: 'spinball · mind the anti side' }, 86.8, 2.66, 19.512, { face: 'z', w: 1.9, h: 0.36 });
    door(s, { x: 50.95, y: 0, z: 19.6, w: 0.9, h: 2.05, along: 'x', dir: -1, style: 'panel', tint: '#2f7f86', locked: true, lockedText: 'The washrooms, child height' });
    door(s, { x: 74.0, y: 0, z: 19.6, w: 1.0, h: 2.05, along: 'x', dir: -1, style: 'panel', tint: '#5b4636', locked: true, lockedText: "Kwame's store. Locked", onLocked(gm) { say('The store door', ['Locked. Through the crack: rolled mats, a bin of balls, three tins of line paint and a red glove, mended twice.']); } });
    doorFrame(s, 51.4, 0, 19.6, 0.9, 2.05, 'x', { tint: '#1f5a60' }); doorFrame(s, 74.5, 0, 19.6, 1.0, 2.05, 'x', { tint: '#1f5a60' });
    doorFrame(s, 61, 0, 19.6, 3.04, 2.6, 'x', { tint: '#1f5a60', depth: 0.24 }); doorFrame(s, 86.8, 0, 19.6, 2.24, 2.4, 'x', { tint: '#1f5a60', depth: 0.24 });
    // corridor end walls: a big painted drum at the west end, a cab berth map at the east end
    painted(s, 'school.paint.mural', 2.2, 1.6, 120, drawPainting({ kind: 'hollow2', by: 'the whole of the small ones', paper: '#f4f0e2' }, 444), 42.165, 1.95, 18.3, { face: 'X', tier: 's' });
    painted(s, 'school.paint.mural2', 2.2, 1.6, 120, drawPainting({ kind: 'table', by: 'the middle class', paper: '#fbf0dc' }, 445), 99.835, 1.95, 18.3, { face: 'x', tier: 's' });
    s.zoneBox({ id: 'school-corridor', place: 'school', box: [42.08, -0.5, 17, 100, H, 23.4], name: 'The Candlewick school', sub: 'the corridor', ambience: 'school', reverb: 'room' });
    s.zoneBox({ id: 'school-hall', place: 'school', box: [56, -0.5, 8, 66, H, 17], name: 'The Candlewick school', sub: 'Ladle Row · deck 16', ambience: 'school', reverb: 'room' });
    // vestibules: padded jambs, a light in each
    lamp(s, 'globe', 61, 2.6, 21.5, { K: 3000, power: 0.5, clip: clipOf(V1, H, 0.1), drop: 0.4, r: 0.13 });
    lamp(s, 'globe', 86.8, 2.6, 21.5, { K: 3000, power: 0.45, clip: clipOf(V2, H, 0.1), drop: 0.4, r: 0.13 });
    roomGlow(s, V1[0], 0, V1[1], V1[2], H, V1[3], { power: 0.22 }); roomGlow(s, V2[0], 0, V2[1], V2[2], H, V2[3], { power: 0.22 });
    s.deco(() => {
      for (const v of [V1, V2]) { const r = new Rng(v[0] | 0); for (let i = 0; i < 6; i++) { const z = v[1] + 0.3 + i * 0.55; g.mat('weave', r.pick(BRIGHT)); g.box(v[0], 1.4, z - 0.15, v[0] + 0.004, 1.85, z + 0.15, { faces: 'X' }); g.mat('weave', r.pick(BRIGHT)); g.box(v[2] - 0.004, 1.4, z - 0.15, v[2], 1.85, z + 0.15, { faces: 'x' }); } }
    });

    // =====================================================================================================
    // THE LONG HALL: 48 m spinward, 12 m across, two decks tall. Throw along it and it breaks; throw across and it flies true.
    // =====================================================================================================
    const CH = [HALL[0] - 0.1, -0.2, HALL[1] - 0.1, HALL[2] + 0.1, HH + 0.2, HALL[3] + 0.1];
    roomGlow(s, HALL[0], 0, HALL[1], HALL[2], HH, HALL[3], { sky: '#f2ecdf', ground: '#d8ae78', power: 0.34 });
    for (const x of [53, 62, 71, 80, 89]) lamp(s, 'panel', x, HH - 0.25, CZ, { w: 2.4, d: 1.2, K: 4200, power: 2.2, range: 14, clip: CH });
    for (const x of [56, 74, 90]) lamp(s, 'strip', x - 2.5, HH - 0.3, 24.6, { to: [x + 2.5, HH - 0.3, 24.6], K: 3200, power: 0.8, range: 8, clip: CH });
    // the goal boards at both ends, washed with light: the bright thing at the end of the view
    for (const end of [-1, 1]) {
      const xw = end < 0 ? HALL[0] : HALL[2], o = -end, col = end < 0 ? PAL.teal : PAL.red;
      const bx = (d0, d1, y0, y1, z0, z1, faces) => g.box(Math.min(xw + o * d0, xw + o * d1), y0, z0, Math.max(xw + o * d0, xw + o * d1), y1, z1, { faces: faces || 'xXyYzZ', bevel: 0.006 });
      s.structure(() => {
        g.mat('paint', '#f6ecd6'); bx(0, 0.03, 2.5, 6.1, 24.9, 35.3);
        g.mat('paint', col); bx(0.03, 0.04, 2.62, 5.98, 25.02, 35.18, o > 0 ? 'X' : 'x');
        g.mat('paint', '#f6ecd6'); for (const z of [25.5, 34.7]) bx(0.04, 0.045, 2.62, 5.98, z - 0.05, z + 0.05, o > 0 ? 'X' : 'x');
        // roundels behind the rings
        for (const rg of [[27.1, 3.3, 0.7], [CZ, 4.5, 0.62], [33.1, 3.3, 0.7]]) {
          g.push(); g.move(xw + o * 0.04, rg[1], rg[0]); g.rotZ(-o * Math.PI / 2);
          g.mat('paint', '#f6ecd6'); g.cyl(0, 0, 0, rg[2], 0.006, { segs: 28 });
          g.mat('paint', end < 0 ? PAL.saffron : PAL.indigo); g.cyl(0, 0.006, 0, rg[2] - 0.1, 0.003, { segs: 28 });
          g.mat('paint', '#f6ecd6'); g.cyl(0, 0.009, 0, rg[2] - 0.22, 0.002, { segs: 28 });
          g.pop();
        }
        // the light bar over the board
        g.mat('brushed', '#6a6a66'); bx(0, 0.32, 6.22, 6.34, 25.0, 35.2);
        g.mat('diffuser', '#fff4e0', { emissive: 5, lamp: true }); bx(0.02, 0.3, 6.215, 6.225, 25.1, 35.1, 'y');
      });
      s.light({ at: [xw + o * 0.45, 6.15, 25.3], to: [xw + o * 0.45, 6.15, 34.9], type: 'tube', color: warm(3600), power: 16, range: 7.5, shadow: false, lamp: true, clip: CH, radius: 0.12 });
      sign(s, { kind: 'letters', text: end < 0 ? 'ANTI END' : 'SPIN END', font: 'caps', palette: ['#f6ecd6'] }, xw + o * 0.05, 5.45, CZ, { face: o > 0 ? 'X' : 'x', w: 3.2, h: 0.5 });
    }
    // cloth banners in the house colours down the north wall
    s.detail(() => {
      [[51.6, 0], [64.4, 1], [75.4, 2], [83.9, 3]].forEach(([x, i]) => {
        const c = HOUSES[i][1], z = 23.56;
        g.mat('cast', '#c8a45a'); g.tube([[x - 0.55, 6.86, z + 0.06], [x + 0.55, 6.86, z + 0.06]], 0.014, { segs: 6 });
        g.mat('weave', c, { sway: 0.25 }); g.sheet([x - 0.48, 6.84, z + 0.08], [x + 0.48, 6.84, z + 0.08], [x + 0.48, 4.8, z + 0.1], [x - 0.48, 4.8, z + 0.1], { nu: 6, nv: 5, ripple: 0.02, rippleN: 3 });
        g.quad([x - 0.48, 4.8, z + 0.1], [x, 4.4, z + 0.1], [x, 4.4, z + 0.1], [x - 0.48, 4.8, z + 0.1], { double: true });
        g.quad([x, 4.4, z + 0.1], [x + 0.48, 4.8, z + 0.1], [x + 0.48, 4.8, z + 0.1], [x, 4.4, z + 0.1], { double: true });
        g.quad([x - 0.48, 4.8, z + 0.101], [x + 0.48, 4.8, z + 0.101], [x, 4.4, z + 0.101], [x, 4.4, z + 0.101], { double: true });
        g.mat('weave', i === 1 ? '#2a2018' : '#f6ecd6'); g.box(x - 0.48, 6.3, z + 0.105, x + 0.48, 6.42, z + 0.112, { faces: 'Z' });
      });
    });
    [[51.6, 0], [64.4, 1], [75.4, 2], [83.9, 3]].forEach(([x, i]) => sign(s, { kind: 'letters', text: HOUSES[i][0], font: 'caps', palette: [i === 1 ? '#2a2018' : '#f6ecd6'] }, x, 5.7, 23.675, { face: 'Z', w: 0.86, h: 0.32 }));
    // ceiling: trusses across, a duct along the bench side, a net rolled up high
    s.structure(() => {
      g.mat('cast', '#5b6a6a', { rough: -0.1 });
      for (let x = 50; x < 94; x += 6) {
        g.box(x - 0.08, HH - 0.7, HALL[1], x + 0.08, HH - 0.6, HALL[3], { bevel: 0.01 });
        g.box(x - 0.06, HH - 0.12, HALL[1], x + 0.06, HH, HALL[3]);
        for (let z = HALL[1] + 0.6; z < HALL[3] - 0.3; z += 1.2) g.tube([[x, HH - 0.62, z], [x, HH - 0.12, z + 0.6]], 0.02, { segs: 5 });
      }
      g.mat('brushed', '#a8a298'); g.box(47.1, HH - 1.3, 23.6, 94.9, HH - 0.8, 24.3, { bevel: 0.02 });
      for (let x = 49; x < 94; x += 4) { g.mat('grille', '#8a847a'); g.box(x - 0.3, HH - 1.31, 23.7, x + 0.3, HH - 1.3, 24.2, { faces: 'y' }); }
    });
    // the high walls: a teal stripe, felt panels high up, the saying painted large on the south wall
    s.structure(() => {
      g.mat('paint', '#2f7f86'); g.box(47.08, 2.15, 35.82, 94.92, 2.4, 35.84, { faces: 'z' }); g.box(47.08, 2.15, 23.48, 94.92, 2.4, 23.5, { faces: 'Z' });
      g.box(47.08, 2.15, 23.48, 47.1, 2.4, 35.84, { faces: 'X' }); g.box(94.9, 2.15, 23.48, 94.92, 2.4, 35.84, { faces: 'x' });
      for (let i = 0; i < 4; i++) { g.mat('felt', HOUSES[i][1]); const x = 52 + i * 11.6; g.box(x - 1.6, 5.75, 35.76, x + 1.6, 6.75, 35.84, { bevel: 0.02 }); g.box(x + 3.2, 5.75, 23.48, x + 6.4, 6.75, 23.56, { bevel: 0.02 }); }
    });
    painted(s, 'school.say.1', 11, 1.25, 72, drawWords(['AXIS', 'FLIES', 'TRUE'], ['#33407a', '#33407a', '#26306b']), 57.5, 4.3, 35.835, { face: 'z', cutout: true });
    painted(s, 'school.say.2', 9, 1.25, 72, drawWords(['SPIN', 'SINKS'], ['#e2553a', '#c0412c']), 71, 4.3, 35.835, { face: 'z', cutout: true });
    painted(s, 'school.say.3', 10, 1.25, 72, drawWords(['ANTI', 'FLOATS'], ['#2a8a90', '#1f6f74']), 84.4, 4.3, 35.835, { face: 'z', cutout: true });
    s.interact({ x: 71, y: 1.4, z: 34.8, radius: 3.5, prompt: 'Read the saying on the wall', onUse(gm) {
      custom(gm, 'Spinball');
      return say('Painted on the wall', ['AXIS FLIES TRUE. SPIN SINKS. ANTI FLOATS.', 'Throw along the axis, across this hall, and the ball goes where you mean it to. Throw it spinward, down the hall, and it gains about a sixth of its weight and dives. Throw it anti and it loses as much and sails.', 'Every throw breaks by its heading, so the game is all angles. The small ones learn it before they can read, which is why it is painted this big.']);
    } });
    // padded lower walls, in blocks, mended where they split
    const pads = [];
    for (let x = 47.08; x < 94.9; x += 1.2) pads.push(['z', x, Math.min(94.92, x + 1.2), 35.84, -1]);
    for (let x = 47.08; x < 94.9; x += 1.2) { const x1 = Math.min(94.92, x + 1.2); if ((x1 > 59.3 && x < 62.7) || (x1 > 85.5 && x < 88.1)) continue; pads.push(['z', x, x1, 23.48, 1]); }
    for (let z = 23.48; z < 35.8; z += 1.2) { pads.push(['x', z, Math.min(35.84, z + 1.2), 47.08, 1]); pads.push(['x', z, Math.min(35.84, z + 1.2), 94.92, -1]); }
    s.structure(() => {
      const r = new Rng(301); const cols = ['#2f7f86', '#2a7378', '#33868b'];
      for (const p of pads) {
        const c = r.chance(0.12) ? r.pick([PAL.red, PAL.saffron, PAL.indigo]) : r.pick(cols);
        g.mat('leather', c, { rough: 0.05 });
        if (p[0] === 'z') { const z0 = p[4] < 0 ? p[3] - 0.1 : p[3], z1 = p[4] < 0 ? p[3] : p[3] + 0.1; g.box(p[1] + 0.02, 0.12, z0, p[2] - 0.02, 2.05, z1, { bevel: 0.04 }); }
        else { const x0 = p[4] < 0 ? p[3] - 0.1 : p[3], x1 = p[4] < 0 ? p[3] : p[3] + 0.1; g.box(x0, 0.12, p[1] + 0.02, x1, 2.05, p[2] - 0.02, { bevel: 0.04 }); }
      }
      g.mat('wood', '#5b4636');
      g.box(47.08, 0, 23.48, 94.92, 0.12, 23.6, { faces: 'ZY' }); g.box(47.08, 0, 35.72, 94.92, 0.12, 35.84, { faces: 'zY' });
      g.box(47.08, 0, 23.48, 47.2, 0.12, 35.84, { faces: 'XY' }); g.box(94.8, 0, 23.48, 94.92, 0.12, 35.84, { faces: 'xY' });
    });
    s.solid(47.08, 0, 35.7, 94.92, 2.05, 35.84); s.solid(47.08, 0, 23.48, 59.3, 2.05, 23.6); s.solid(62.7, 0, 23.48, 85.5, 2.05, 23.6); s.solid(88.1, 0, 23.48, 94.92, 2.05, 23.6); s.solid(47.08, 0, 23.48, 47.2, 2.05, 35.84); s.solid(94.8, 0, 23.48, 94.92, 2.05, 35.84);
    // the mends: patches in other colours, stitched with bright thread
    s.deco(() => {
      const r = new Rng(303);
      for (let i = 0; i < 16; i++) {
        const p = pads[r.i(0, pads.length - 1)], u = r.f(0.25, 0.85), y = r.f(0.4, 1.7), w = r.f(0.14, 0.3), h = r.f(0.1, 0.24);
        const c = r.pick([PAL.saffron, PAL.red, '#f6ecd6', PAL.leaf]);
        if (p[0] === 'z') { const x = p[1] + (p[2] - p[1]) * u, z = p[3] + p[4] * 0.104; g.mat('leather', c); g.box(x - w / 2, y - h / 2, Math.min(z, z + p[4] * 0.006), x + w / 2, y + h / 2, Math.max(z, z + p[4] * 0.006), { faces: p[4] > 0 ? 'Z' : 'z' }); g.mat('plain', '#f6ecd6'); for (let k = 0; k < 6; k++) { const sx = x - w / 2 + (k + 0.5) * w / 6; g.box(sx - 0.006, y + h / 2 - 0.015, Math.min(z, z + p[4] * 0.009), sx + 0.006, y + h / 2 + 0.015, Math.max(z, z + p[4] * 0.009), { faces: p[4] > 0 ? 'Z' : 'z' }); } }
        else { const z = p[1] + (p[2] - p[1]) * u, x = p[3] + p[4] * 0.104; g.mat('leather', c); g.box(Math.min(x, x + p[4] * 0.006), y - h / 2, z - w / 2, Math.max(x, x + p[4] * 0.006), y + h / 2, z + w / 2, { faces: p[4] > 0 ? 'X' : 'x' }); }
      }
    });
    // the court: lines, the centre, the end circles, SPIN and ANTI. The anti half is half repainted.
    const LINE = '#f6f1e4', WORN = '#e3d7bf';
    const fline = (x0, z0, x1, z1, c) => { g.mat('paint', c, { rough: 0.2 }); g.box(x0, 0, z0, x1, 0.0025, z1, { faces: 'Y' }); };
    const ringFlat = (cx, cz, r0, r1, c, from, to) => {
      g.mat('paint', c, { rough: 0.2 }); const n = 40;
      for (let i = 0; i < n; i++) {
        const a0 = from + (to - from) * i / n, a1 = from + (to - from) * (i + 1) / n;
        const P = (r, a) => [cx + Math.cos(a) * r, 0.0025, cz + Math.sin(a) * r];
        g.quad(P(r1, a0), P(r0, a0), P(r0, a1), P(r1, a1));
      }
    };
    s.detail(() => {
      const w = 0.07;
      // boundary: the spin half, worn but whole
      fline(MIDX, CZ0 - w / 2, CX1, CZ0 + w / 2, WORN); fline(MIDX, CZ1 - w / 2, CX1, CZ1 + w / 2, WORN); fline(CX1 - w / 2, CZ0, CX1 + w / 2, CZ1, WORN);
      // the anti half: worn through in patches near the far end, freshly painted from the centre out to where Kwame got to
      const kw = 62.4;
      fline(kw, CZ0 - w / 2, MIDX, CZ0 + w / 2, LINE); fline(kw, CZ1 - w / 2, MIDX, CZ1 + w / 2, LINE);
      for (let x = CX0; x < kw; x += 0.9) { fline(x, CZ0 - w / 2, x + 0.55, CZ0 + w / 2, WORN); fline(x + 0.2, CZ1 - w / 2, x + 0.7, CZ1 + w / 2, WORN); }
      for (let z = CZ0; z < CZ1; z += 0.8) fline(CX0 - w / 2, z, CX0 + w / 2, z + 0.5, WORN);
      fline(MIDX - w / 2, CZ0, MIDX + w / 2, CZ1, LINE);
    });
    s.detail(() => {
      ringFlat(MIDX, CZ, 1.4, 1.47, LINE, 0, Math.PI * 2);
      ringFlat(CX1 - 4, CZ, 2.6, 2.67, WORN, -Math.PI / 2, Math.PI / 2); ringFlat(CX1 - 4, CZ, 2.6, 2.67, WORN, Math.PI / 2, Math.PI * 1.5);
      for (let k = 0; k < 7; k++) ringFlat(CX0 + 4, CZ, 2.6, 2.67, WORN, k * 0.9, k * 0.9 + 0.55);
      g.mat('paint', PAL.red, { rough: 0.2 }); g.cyl(MIDX, 0, CZ, 0.16, 0.003, { segs: 16 });
    });
    floorPaint(s, 'school.floor.spin2', 4.6, 1.4, 90, drawFloorArrow('SPIN', '#d8452c', false, true), 82, 0.003, 28.0, {});
    floorPaint(s, 'school.floor.anti2', 4.6, 1.4, 90, drawFloorArrow('ANTI', '#2a8a90', false, false), 60, 0.003, 28.0, {});
    floorPaint(s, 'school.floor.axis2', 3.0, 0.9, 90, drawFloorArrow('TRUE', '#33407a', false, false), 71, 0.003, 32.6, { rot: -Math.PI / 2 });
    // Kwame's paint: a tin, a roller on a pole, a line of tape where he stopped
    s.detail(() => {
      g.mat('cast', '#d8d0c0'); g.cyl(62.1, 0, 25.15, 0.1, 0.2, { segs: 12 }); g.mat('paint', '#f6f1e4'); g.cyl(62.1, 0.2, 25.15, 0.1, 0.004, { segs: 12 });
      g.mat('cast', '#8a847a'); g.tube([[62.1, 0.21, 25.15], [62.14, 0.32, 25.15], [62.18, 0.21, 25.15]], 0.004, { segs: 4 });
      g.mat('wood', '#c9a070'); g.tube([[62.6, 0.04, 25.4], [64.4, 0.05, 26.6]], 0.014, { segs: 5 });
      g.mat('weave', '#f6f1e4'); g.push(); g.move(62.55, 0.04, 25.38); g.rotY(-0.59); g.cyl(0, 0, 0, 0.04, 0.001, { segs: 10 }); g.pop();
      g.mat('weave', '#f6f1e4'); g.tube([[62.42, 0.045, 25.32], [62.68, 0.045, 25.48]], 0.04, { segs: 10 });
      g.mat('paper', '#e9b23c'); g.box(62.38, 0, CZ0 - 0.05, 62.42, 0.0035, CZ0 + 0.05, { faces: 'Y' });
    });
    s.spot('work', 62.9, 0, 25.0, Math.PI / 2, { who: 'kwame', tags: ['paint', 'keeper', 'spinball-hall'] });
    // the rings: three on each end wall, registered for throwing
    const RINGS = [[27.1, 3.3, 0.26], [CZ, 4.5, 0.22], [33.1, 3.3, 0.26]];
    game.spinballTargets = (game.spinballTargets || []).filter((t) => t.owner !== 'school');
    for (const end of [-1, 1]) {
      const xw = end < 0 ? HALL[0] : HALL[2];
      RINGS.forEach((rg, i) => {
        const c = end < 0 ? [PAL.saffron, PAL.red, PAL.saffron][i] : [PAL.saffron, PAL.cream, PAL.saffron][i];
        prop(s, 'school.ring', xw - end * 0.045, rg[1], rg[0], end < 0 ? Math.PI / 2 : -Math.PI / 2, { c, r: rg[2], bare: true }, { noCollide: true });
        game.spinballTargets.push({ frame: f, x: xw - end * (RING_OUT + 0.045), y: rg[1], z: rg[0], r: rg[2], owner: 'school', end: end < 0 ? 'anti' : 'spin', points: i === 1 ? 5 : 3 });
      });
    }
    // benches down the north side, things left on them
    const BENCH = [[49.8, 2.2], [52.5, 2.2], [55.2, 2.2], [57.8, 2.0], [65.3, 2.4], [68.1, 2.4], [70.9, 2.4], [73.7, 2.4], [76.5, 2.4], [79.3, 2.4], [82.1, 2.4], [90.0, 2.2], [92.6, 2.2]];
    for (const b of BENCH) prop(s, 'bench', b[0], 0, 24.32, 0, { w: b[1], back: true, wood: '#a8794f', metal: '#1f5a60' }, { spot: { tags: ['watch', 'spinball-hall', 'parent'] } });
    s.detail(() => {
      const r = new Rng(311);
      for (const b of BENCH) {
        if (r.chance(0.5)) { g.mat('knit', r.pick(BRIGHT)); g.ball(b[0] + r.f(-0.6, 0.6), 0.5, 24.3, 0.2, 0.05, 0.14, { segs: 8, rings: 4 }); }
        if (r.chance(0.5)) prop(s, 'cup', b[0] + r.f(-0.8, 0.8), 0.46, 24.4, 0, { glaze: r.pick(['#d9cfb8', '#2f7f86', '#c9552e']) });
        if (r.chance(0.35)) prop(s, 'school.satchel', b[0] + r.f(-0.5, 0.5), 0.0, 24.6, r.f(-0.5, 0.5), { a: r.pick(['#8a5634', '#2f7f86', '#33407a']) }, { noCollide: true });
      }
    });
    // the ball rack by the door, and the scoreboard over it
    prop(s, 'school.rack', 64.6, 0, 24.0, 0, {});
    s.interact({ x: 64.6, y: 0.9, z: 24.6, radius: 1.5, prompt: (gm) => gm.flags.hasBall ? 'You have a ball already' : 'Take a ball', onUse(gm) {
      if (gm.flags.hasBall) { if (gm.ui && gm.ui.toast) gm.ui.toast('You have one. Throw it anti and watch it sail.', { kind: 'info' }); return; }
      gm.flags.hasBall = true;
      gm.sfxAt('ball-catch', f, 64.6, 0.9, 24.0);
      if (gm.ui && gm.ui.toast) gm.ui.toast('A spinball, scuffed and true', { kind: 'gain' });
      custom(gm, 'Spinball');
      return say('The ball rack', ['Chalked on the end of the rack: Take one. Bring it back HERE, not to me. K.', 'Under it, smaller: across the hall it goes where you mean. Down the hall it breaks. Anti floats.']);
    } });
    painted(s, 'school.score', 2.6, 1.5, 180, drawScore([7, 5, 9, 4]), 61, 4.0, 23.522, { face: 'Z', glow: 0.25 });
    s.deco(() => { g.mat('wood', '#3a2d22'); g.box(59.62, 3.18, 23.48, 62.38, 4.82, 23.52, { bevel: 0.01 }); });
    sign(s, SIGNS['spinball.fixtures'], 66.6, 3.2, 23.49, { face: 'Z', w: 1.5, h: 1.0 });
    sign(s, SIGNS['spinball.rules'], 57.4, 2.75, 23.49, { face: 'Z', w: 0.4, h: 0.54 });
    sign(s, SIGNS['school.banner'], 88.4, 4.5, 23.49, { face: 'Z', w: 0.8, h: 2.4, board: false });
    s.interact({ x: 61, y: 1.6, z: 24.4, radius: 2.0, prompt: 'Read the scoreboard', onUse() {
      return say('The scoreboard', ['Four houses on flip tiles: Wick 7, Ladle 5, Thread 9, Lamp 4. First to twelve. A ring scores three, the high one five.', 'Under it the fixtures: Thursday, Candlewick against Ropewalk. The Quiet, no matches. Booking Day, no matches.']);
    } });
    // bunting in the house colours, across the hall from truss to truss
    for (const x of [56, 68, 80]) bunting(s, [x, HH - 0.75, 23.6], [x, HH - 0.75, 35.7], { colors: HOUSES.map((h) => h[1]).concat(['#f6ecd6']), sag: 1.1 });
    // stray balls, a forgotten jumper, a lidded water jug
    prop(s, 'school.ball', 48.4, 0, 34.9, 0, { a: PAL.red, b: PAL.cream }); prop(s, 'school.ball', 93.4, 0, 25.9, 1, { a: PAL.indigo, b: PAL.saffron }); prop(s, 'school.ball', 76.0, 0, 33.2, 2, { a: PAL.leaf, b: PAL.cream });
    s.detail(() => { g.mat('knit', PAL.saffron); g.ball(83.4, 0.04, 35.2, 0.3, 0.04, 0.18, { segs: 8, rings: 4 }); g.mat('glaze', '#2f7f86'); g.cyl(58.4, 0.46, 24.4, 0.07, 0.24, { segs: 12 }); g.mat('glaze', '#e9b23c'); g.cyl(58.4, 0.7, 24.4, 0.075, 0.03, { segs: 12 }); });
    // children's spots: in the court, all over it, near enough to throw to each other
    {
      const r = new Rng(321);
      for (let i = 0; i < 26; i++) {
        const x = CX0 + 1.5 + (i % 9) * 4.6 + r.f(-1, 1), z = CZ0 + 1.2 + Math.floor(i / 9) * 3.3 + r.f(-0.6, 0.6);
        s.spot('play', x, 0, z, r.f(-Math.PI, Math.PI), { tags: ['kids', 'spinball', 'spinball-hall'] });
      }
      s.spot('play', 73.0, 0, CZ, -Math.PI / 2, { who: 'rafe', tags: ['kids', 'spinball', 'captain'] });
      s.spot('stand', MIDX, 0, 25.0, 0, { tags: ['referee', 'teach', 'spinball-hall'] });
      for (const p of [[49.8, 26.4, Math.PI / 2], [92.2, 34.0, -Math.PI / 2], [50.2, 33.6, 1.2]]) s.spot('stand', p[0], 0, p[1], p[2], { tags: ['watch', 'kids', 'spinball-hall'] });
    }
    // the discovery: watch from either end
    s.trigger({ box: [HALL[0], 0, HALL[1], CX0, 2.5, HALL[3]], onEnter(gm) { found(gm, 'spinball'); } });
    s.trigger({ box: [CX1, 0, HALL[1], HALL[2], 2.5, HALL[3]], onEnter(gm) { found(gm, 'spinball'); } });
    let kids = null;
    s.trigger({ box: [HALL[0], 0, HALL[1], HALL[2], HH, HALL[3]], onEnter(gm) { if (!kids) kids = gm.loopAt('kids', f, 71, 1.2, CZ, { vol: 0.45, radius: 26 }); } });
    let kidsS = null;
    s.trigger({ box: [SMALL[0], 0, SMALL[1], SMALL[2], H, SMALL[3]], onEnter(gm) { if (!kidsS) kidsS = gm.loopAt('kids', f, 49, 1.0, 11, { vol: 0.18, radius: 9 }); } });
    s.zoneBox({ id: 'spinball-hall', place: 'spinball-hall', box: [47, -0.5, 23.4, 95, HH, 36], name: 'The long hall', sub: 'Candlewick school · spinball', ambience: 'school', reverb: 'ring', headroom: 7 });

    // =====================================================================================================
    // PEOPLE: spots and walkways
    // =====================================================================================================
    // parents and aunts at the gate
    const group = (x, z, n, rad, tags) => { for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2 + 0.5; const px = x + Math.cos(t) * rad, pz = z + Math.sin(t) * rad; s.spot('chat', px, 0, pz, Math.atan2(x - px, z - pz), { tags }); } };
    group(58.6, 5.4, 3, 0.62, ['parent', 'aunt', 'gate', 'school']);
    group(62.4, 6.6, 3, 0.6, ['parent', 'aunt', 'gate', 'school']);
    group(60.2, 13.2, 2, 0.55, ['parent', 'school']);
    for (const p of [[57.2, 11.0], [57.2, 14.2], [57.3, 9.4]]) s.spot('play', p[0], 0, p[1], -Math.PI / 2, { tags: ['kids', 'pegs', 'school'] });
    for (const p of [[64.6, 11.2], [64.7, 13.6]]) s.spot('stand', p[0], 0, p[1], Math.PI / 2, { tags: ['read', 'names', 'school'] });
    for (const p of [[44.4, 13.6], [46.2, 15.2], [45.8, 13.2]]) s.spot('play', p[0], 0, p[1], rnd.f(-3, 3), { tags: ['kids', 'blocks', 'school'] });
    s.spot('stand', 49.5, 0, 12.6, 0, { tags: ['teach', 'school', 'small'] });
    for (const p of [[48.5, 18.3], [52, 18.4], [66, 18.2], [80, 18.4], [90, 18.3]]) s.spot('play', p[0], 0, p[1], rnd.f(-3, 3), { tags: ['kids', 'corridor', 'school'] });
    // walkways: the street to the gate, through the door, down the corridor, into every room and the hall
    s.path([[61, 4.6], [61, 7.0], [61, 9.4], [61, 12.0], [61, 15.0], [61, 18.3]]);
    s.path([[61, 18.3], [61, 21.5], [61, 24.6], [61, 27.5], [61, 30.1]]);
    s.path([[44, 18.3], [49, 18.3], [55, 18.3], [61, 18.3], [67, 18.3], [74, 18.3], [80, 18.3], [84.9, 18.3], [86.8, 18.3], [93.7, 18.3], [98.5, 18.3]]);
    s.path([[86.8, 18.3], [86.8, 21.5], [86.8, 25.0], [86.8, 28.4]]);
    s.path([[49, 18.3], [49, 16.2], [49, 12.7], [47.2, 9.0], [44.6, 7.6]], { width: 1.1 });
    s.path([[49, 12.7], [52.4, 9.6]], { width: 1.1 });
    s.path([[73.8, 18.3], [73.8, 16.0], [72.8, 13.6], [72.8, 10.5], [77.6, 10.5], [79.5, 11.0]], { width: 1.1 });
    s.path([[72.8, 10.5], [72.8, 7.4], [68.2, 7.0]], { width: 1.0 });
    s.path([[84.9, 18.3], [84.9, 16.0], [85.0, 13.4], [83.4, 9.2], [85, 8.4]], { width: 1.0 });
    s.path([[93.7, 18.3], [93.7, 15.5], [94.4, 11.5], [98.2, 11.5]], { width: 1.1 });
    s.path([[61, 24.6], [52, 24.9], [48.5, 26.0]], { width: 1.4 }); s.path([[61, 24.6], [70, 25.0], [80, 25.0], [86.8, 25.0], [93, 25.4]], { width: 1.4 });
    s.path([[61, 30.1], [53, 30.1], [49, 30.1]], { width: 2 }); s.path([[61, 30.1], [71, 30.1], [81, 30.1], [86.8, 28.4], [93, 30.1]], { width: 2 });
    s.path([[57.2, 12.0], [61, 12.0], [64.6, 12.4]], { width: 1.2 });

    s.finish();
    game.spawns.school = { frame: f, x: 61, y: 0, z: 0.6, yaw: Math.PI };
    game.spawns['school-inside'] = { frame: f, x: 61, y: 0, z: 9.6, yaw: Math.PI };
    game.spawns['spinball-hall'] = { frame: f, x: 49.6, y: 0, z: 31.0, yaw: Math.PI / 2 };
  },
};
