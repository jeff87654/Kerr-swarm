// The Bellows itself: the organ that is the whole front end of Bellows Court. Frame 'felt-organ' (see lm_felt_organ.js).
//
//   Two towers of open wood at the sides, the biggest of them the bottom C, 17.4 m of timber; a tower of tin in the
//   middle, the principal's five longest notes standing on the floor; two flats of the sixteen-foot principal on the
//   impost, each a shallow V; a row of trumpets laid flat over them, pointing at the room; the swell boxes above with
//   their shutters half open; gilt shades over every pipe top. The notes alternate sides, C on the anti side and
//   C sharp on the spinward, as organs always have. Ranks of small pipes stand on the chests behind the flats.
//   Half way up, on deck 152, the console bridge crosses the organ's face with the console in a bay in the middle.
import { floor, lamp, block } from '../world/kit.js';
import { railing } from '../world/kit2.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, TOP, ORG, BR, GAL, C, say, choose, find, hour, tick, runX, pipeLen, pipeRad } from './lm_felt_organ_props.js';

const CLIP = [-15.2, -0.3, -34.2, 15.2, TOP + 0.1, -22];
const Q = (v, k) => Math.round(v / k) * k;
// the flats: fifteen pipes in front and fourteen behind, each flat a V, long at its ends; C side anti, C sharp spinward
const FLAT_N = 15, FLAT_SP = 0.545;
const flatX = (sx, i) => sx * (11.55 - i * FLAT_SP);               // i = 0 at the outer end
const flatM = (sx, i, back) => 24 + 2 * (7 - Math.abs(i - 7)) + (sx > 0 ? 1 : 0) - (back ? 1 : 0);
const flatTop = (m) => ORG.impost + 0.9 + pipeLen(m);
export async function buildOrgan(game, s, f, r, organ) {
  caseWork(s);
  await tick(game);
  facade(s);
  await tick(game);
  innerRanks(s, r);
  swellBoxes(s);
  await tick(game);
  bridge(game, s, f, organ);
  organLight(s);
  plate(game, s);
}

// ---------------------------------------------------------------------------------------------------------------
// the case: impost, plinths, stiles, back panels, cornice
// ---------------------------------------------------------------------------------------------------------------
function caseWork(s) {
  const g = s.g, IM = ORG.impost, F = ORG.face;
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -11.95 : 3.3, xb = sx < 0 ? -3.3 : 11.95;
    block(s, xa, 0, ORG.z0, xb, IM, F, 'wood', C.walnut);
    // the impost's front: fielded panels in frames, a gilt bead at the top, a dark plinth, a little door with a brass handle
    s.furniture((gg) => {
      const n = 4, w = (xb - xa) / n;
      for (let i = 0; i < n; i++) {
        const x0 = xa + i * w + 0.12, x1 = xa + (i + 1) * w - 0.12;
        gg.mat('wood', '#5a3826', { rough: -0.1 }); gg.box(x0, 0.45, F, x1, IM - 0.4, F + 0.03, { bevel: 0.012 });
        gg.mat('wood', '#6b4430', { rough: -0.15 }); gg.box(x0 + 0.12, 0.57, F + 0.03, x1 - 0.12, IM - 0.52, F + 0.05, { bevel: 0.02 });
      }
      gg.mat('wood', C.walnutD); gg.box(xa, 0, F, xb, 0.3, F + 0.06, { faces: 'ZY' });
      gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(xa, IM - 0.14, F, xb, IM - 0.06, F + 0.07, { bevel: 0.01 });
      gg.mat('wood', '#4a2e1e'); gg.box(xa - 0.05, IM - 0.06, F - 0.3, xb + 0.05, IM, F + 0.12, { bevel: 0.01 });
      gg.mat('cast', C.brass, { rough: -0.2 }); gg.box(xa + w * 1.5 - 0.04, 1.3, F + 0.05, xa + w * 1.5 + 0.04, 1.42, F + 0.09, { bevel: 0.01 });
    });
  }
  // the middle tower's plinth, and the case behind it up to the impost
  block(s, -3.25, 0, -31.7, 3.25, 0.5, F, 'wood', C.walnutD, { bevel: 0.01 });
  block(s, -3.25, 0, ORG.z0, 3.25, IM, -31.7, 'wood', C.walnut);
  s.structure((gg) => { gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(-3.25, 0.42, F, 3.25, 0.5, F + 0.04, { faces: 'ZY' }); });
  // the wooden towers' plinths
  for (const sx of [-1, 1]) block(s, sx < 0 ? -15 : 12.0, 0, ORG.z0, sx < 0 ? -12.0 : 15, 0.3, F, 'wood', C.walnutD);
  // stiles between the towers and flats, full height, with gilt beads and capitals
  for (const x of [-11.95, -3.27, 3.27, 11.95]) {
    s.structure((gg) => {
      gg.mat('wood', C.walnut, { rough: -0.1 }); gg.box(x - 0.16, 0, -31.9, x + 0.16, TOP - 0.36, F + 0.12, { bevel: 0.02 });
      gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(x - 0.05, 0.6, F + 0.12, x + 0.05, TOP - 0.9, F + 0.15, { faces: 'ZxX' });
      for (const y of [IM + 0.1, 12.5, TOP - 0.9]) gg.box(x - 0.22, y, -31.95, x + 0.22, y + 0.22, F + 0.2, { bevel: 0.02 });
    });
    s.solid(x - 0.16, 0, -31.9, x + 0.16, TOP, F + 0.12);
  }
  // the back of the case, dark, so the pipes stand out against it
  s.structure((gg) => {
    gg.mat('wood', '#24160e');
    gg.box(-3.1, 0.5, -32.0, 3.1, TOP, -31.9, { faces: 'Z' });
    gg.box(-15, 0.3, -32.3, -12.1, TOP, -32.2, { faces: 'Z' }); gg.box(12.1, 0.3, -32.3, 15, TOP, -32.2, { faces: 'Z' });
    gg.box(-11.8, IM, -33.8, -3.4, 13.2, -33.7, { faces: 'Z' }); gg.box(3.4, IM, -33.8, 11.8, 13.2, -33.7, { faces: 'Z' });
  });
  // the cornice right across under the ceiling
  s.structure((gg) => {
    runX(-15, 15, 10, (a, b) => {
      gg.mat('wood', C.walnut); gg.box(a, TOP - 0.36, -31.9, b, TOP, F + 0.3, { faces: 'yZ' });
      gg.mat('cast', C.gilt, { rough: -0.15 }); gg.box(a, TOP - 0.3, F + 0.3, b, TOP - 0.2, F + 0.34, { faces: 'ZyY' });
    });
  });
}

// ---------------------------------------------------------------------------------------------------------------
// the front pipes
// ---------------------------------------------------------------------------------------------------------------
function facade(s) {
  // the middle tower: nine of the principal's lowest notes, bottom C in the middle, standing on the floor
  const mid = [20, 18, 16, 14, 12, 13, 15, 17, 19];
  mid.forEach((m, i) => prop(s, 'feltorgan.pipe', (i - 4) * 0.68, 0.5, ORG.pz, 0, { L: Q(pipeLen(m), 0.05), r: 0.28, foot: 1.3, solid: true }, { tier: 's' }));
  // the wooden towers: C, D, E anti; C sharp, D sharp, F spinward, the longest outermost; two more behind each
  const wood = [[-14.4, 12], [-13.45, 14], [-12.5, 16], [14.4, 13], [13.45, 15], [12.5, 17]];
  for (const [x, m] of wood) prop(s, 'feltorgan.woodpipe', x, 0.3, -31.15, 0, { L: Q(pipeLen(m), 0.05), w: 0.78, wood: '#8a5a34', front: '#b07a48' }, { tier: 's' });
  for (const [x, m] of [[-13.9, 18], [-12.95, 20], [13.9, 19], [12.95, 21]]) prop(s, 'feltorgan.woodpipe', x, 0.3, -32.4, 0, { L: Q(pipeLen(m), 0.05), w: 0.7, wood: '#7a4a2a', front: '#9a6a3a' }, { tier: 's' });
  // the two flats on the impost, two rows deep
  for (const sx of [-1, 1]) for (let i = 0; i < FLAT_N; i++) {
    prop(s, 'feltorgan.pipe', flatX(sx, i), ORG.impost, ORG.pz, 0, { L: Q(pipeLen(flatM(sx, i)), 0.05), r: 0.2, foot: 0.9 }, { tier: 's' });
    if (i < FLAT_N - 1) prop(s, 'feltorgan.pipe', flatX(sx, i + 0.5), ORG.impost, ORG.pz - 0.45, 0, { L: Q(pipeLen(flatM(sx, i + 0.5, true)), 0.05), r: 0.17, foot: 0.9, metal: '#d2cfc6' }, { tier: 's' });
  }
  // gilt shades in a band over the flats, under the trumpets' beam
  s.structure((gg) => {
    gg.mat('grille', C.gilt, { rough: -0.1 });
    for (const sx of [-1, 1]) runX(sx < 0 ? -11.85 : 3.4, sx < 0 ? -3.4 : 11.85, 9, (a, b) => gg.box(a, 11.8, ORG.pz + 0.24, b, 12.5, ORG.pz + 0.28, { faces: 'zZ' }));
    gg.mat('cast', C.gilt, { rough: -0.2 });
    for (const sx of [-1, 1]) runX(sx < 0 ? -11.85 : 3.4, sx < 0 ? -3.4 : 11.85, 9, (a, b) => gg.box(a, 11.72, ORG.pz + 0.22, b, 11.8, ORG.pz + 0.32, { bevel: 0.01 }));
    for (const sx of [-1, 1]) gg.box(sx < 0 ? -15 : 12.05, 18.7, -30.5, sx < 0 ? -12.05 : 15, TOP - 0.36, -30.46, { faces: 'zZ' });
  });
  // the trumpets laid flat, on a beam over the flats, and the upper flats standing on the beam in front of the shutters
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -11.9 : 3.35, xb = sx < 0 ? -3.35 : 11.9;
    s.structure((gg) => {
      gg.mat('wood', C.walnut); gg.box(xa, 12.5, -31.0, xb, 13.25, -30.0, { bevel: 0.015 });
      gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(xa, 12.55, -30.0, xb, 12.62, -29.96, { faces: 'ZY' }); gg.box(xa, 13.18, -30.0, xb, 13.25, -29.96, { faces: 'ZY' });
    });
    for (let i = 0; i < 11; i++) {
      const x = sx * (11.3 - i * 0.78), L = Q(2.4 - Math.abs(i - 5) * 0.16, 0.05);
      prop(s, 'feltorgan.trumpet', x, 12.88, -30.0, 0, { L, r: 0.13 }, { tier: 's' });
    }
    for (let i = 0; i < 17; i++) {
      const m = 36 + 2 * Math.abs(i - 8) + (sx > 0 ? 1 : 0);
      prop(s, 'feltorgan.pipe', sx * (11.5 - i * 0.5), 13.25, -30.55, 0, { L: Q(pipeLen(m), 0.05), r: 0.1, foot: 0.5 }, { tier: 's' });
    }
  }
}

// the small ranks behind the flats, on their chests: two rows of tin and one of zinc, seen between the front pipes
function innerRanks(s, r) {
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -11.7 : 3.55, xb = sx < 0 ? -3.55 : 11.7;
    s.structure((gg) => {
      gg.mat('wood', '#3a2418'); gg.box(xa, ORG.impost - 0.02, -33.6, xb, ORG.impost + 0.32, -31.3, { bevel: 0.01 });
      gg.mat('wood', '#2a1a10'); for (const z of [-32.0, -33.0]) gg.box(xa, ORG.impost + 0.32, z - 0.22, xb, ORG.impost + 0.4, z + 0.22, { faces: 'Y' });
    });
    const n1 = 20, n2 = 9;
    for (let i = 0; i < n1; i++) {
      const t = i / (n1 - 1), x = xa + 0.2 + t * (xb - xa - 0.4), m = 48 + Math.round((sx < 0 ? t : 1 - t) * 26);
      prop(s, 'feltorgan.pipe', x, ORG.impost + 0.4, -32.0, 0, { L: Q(pipeLen(m) * 0.5, 0.05), r: Q(pipeRad(m) * 0.8, 0.005), foot: 0.3 }, { tier: 'd' });
    }
    for (let i = 0; i < n2; i++) {
      const t = i / (n2 - 1), x = xa + 0.4 + t * (xb - xa - 0.8), m = 34 + Math.round(Math.abs(t - 0.5) * 2 * 9);
      prop(s, 'feltorgan.pipe', x, ORG.impost + 0.4, -33.0, 0, { L: Q(pipeLen(m), 0.05), r: Q(pipeRad(m), 0.01), foot: 0.6, metal: C.zinc }, { tier: 's' });
    }
  }
  void r;
}

// the swell boxes over the trumpets: frames of walnut, shutters painted teal and edged in gilt, standing half open
function swellBoxes(s) {
  for (const sx of [-1, 1]) {
    const xa = sx < 0 ? -11.8 : 3.4, xb = sx < 0 ? -3.4 : 11.8, y0 = 13.3, y1 = TOP - 0.45;
    s.structure((gg) => {
      gg.mat('wood', C.walnut); gg.box(xa, y0, -31.5, xb, y0 + 0.2, -30.75, { bevel: 0.01 }); gg.box(xa, y1 - 0.2, -31.5, xb, y1, -30.75, { bevel: 0.01 });
      gg.mat('wood', '#140c08'); gg.box(xa, y0 + 0.2, -31.6, xb, y1 - 0.2, -31.5, { faces: 'Z' });
      const n = 13, w = (xb - xa) / n;
      for (let i = 0; i < n; i++) {
        const cx = xa + (i + 0.5) * w;
        gg.push(); gg.move(cx, 0, -31.05); gg.rotY(0.55);
        gg.mat('paint', C.teal, { rough: -0.1 }); gg.box(-w * 0.5, y0 + 0.2, -0.035, w * 0.5, y1 - 0.2, 0.035, { faces: 'xXzZ' });
        gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(-w * 0.5, y0 + 0.2, 0.035, -w * 0.42, y1 - 0.2, 0.04, { faces: 'Z' });
        gg.pop();
      }
    });
  }
}

// ---------------------------------------------------------------------------------------------------------------
// the console bridge, deck 152
// ---------------------------------------------------------------------------------------------------------------
function bridge(game, s, f, organ) {
  const y = BR.y, g = s.g;
  floor(s, -15, BR.z0, 15, BR.z1, y, 'planks', '#7a5233', { level: 2 });
  floor(s, -BR.bx, BR.z1, BR.bx, BR.bz, y, 'planks', '#7a5233', { level: 2 });
  s.deco((gg) => { gg.mat('felt', C.madder); runX(-14, 14, 8, (a, b) => gg.box(a, y, -28.95, b, y + 0.006, -28.3, { faces: 'Y' })); gg.mat('rush', '#8a7a5a'); gg.box(-2.2, y, -25.9, 2.2, y + 0.01, -25.3, { faces: 'Y' }); }, 2);
  // its edges: a teal fascia with a gilt line, a pale soffit, iron corbels into the case
  s.structure((gg) => {
    const edge = [[-15, -BR.bx], [BR.bx, 15]];
    for (const [a, b] of edge) runX(a, b, 8, (p, q) => {
      gg.mat('paint', C.teal); gg.box(p, y - 0.6, BR.z1, q, y + 0.02, BR.z1 + 0.12, { faces: 'ZyY' });
      gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(p, y - 0.34, BR.z1 + 0.12, q, y - 0.28, BR.z1 + 0.14, { faces: 'Z' });
    });
    gg.mat('paint', C.teal); gg.box(-BR.bx, y - 0.6, BR.bz, BR.bx, y + 0.02, BR.bz + 0.12, { faces: 'ZyY' });
    for (const sx of [-1, 1]) gg.box(sx * BR.bx - 0.06, y - 0.6, BR.z1, sx * BR.bx + 0.06, y + 0.02, BR.bz + 0.12, { faces: 'xXy' });
    gg.mat('cast', C.gilt, { rough: -0.2 }); gg.box(-BR.bx, y - 0.34, BR.bz + 0.12, BR.bx, y - 0.28, BR.bz + 0.14, { faces: 'Z' });
    gg.mat('wood', '#6b4a32'); runX(-15, 15, 8, (p, q) => gg.box(p, y - 0.61, BR.z0, q, y - 0.6, BR.z1, { faces: 'y' })); gg.box(-BR.bx, y - 0.61, BR.z1, BR.bx, y - 0.6, BR.bz, { faces: 'y' });
    gg.mat('cast', '#2a3434');
    for (const x of [-9.2, -5.4, 5.4, 9.2, -BR.bx + 0.3, BR.bx - 0.3]) {
      const zEnd = Math.abs(x) < 3 ? BR.bz + 0.4 : BR.z1 - 0.1;
      gg.box(x - 0.08, y - 0.65, ORG.face, x + 0.08, y - 0.55, zEnd, { bevel: 0.01 });
      gg.tube([[x, y - 2.2, ORG.face + 0.02], [x, y - 1.2, ORG.face + 0.5], [x, y - 0.65, zEnd - 0.2]], 0.05, { segs: 6 });
    }
  }, 2);
  // rails: round the bay and along the front; a lower one on the pipe side
  const ro = { h: 1.05, tint: '#2a3434', rail: C.brass, railMat: 'cast', level: 2 };
  railing(s, [[-GAL.xi, BR.z1], [-6, BR.z1], [-BR.bx, BR.z1], [-BR.bx, BR.bz], [BR.bx, BR.bz], [BR.bx, BR.z1], [6, BR.z1], [GAL.xi, BR.z1]], y, ro);
  railing(s, [[-15, BR.z0 + 0.05], [-7.5, BR.z0 + 0.05], [0, BR.z0 + 0.05], [7.5, BR.z0 + 0.05], [15, BR.z0 + 0.05]], y, { h: 0.95, tint: '#2a3434', rail: C.brass, railMat: 'cast', level: 2 });
  // the console in its bay, the organist's bench, the music; her coat on a hook, her shoes under the bench
  prop(s, 'feltorgan.console', 0, y, -26.45, 0, {}, { level: 2 });
  s.detail((gg) => {
    gg.mat('paper', '#efe6d0'); gg.box(1.35, y + 1.25, -26.9, 1.62, y + 1.27, -26.55, { faces: 'Y' }); gg.box(1.4, y + 1.27, -26.85, 1.66, y + 1.29, -26.5, { faces: 'Y' });
    gg.mat('weave', '#3a4a6a'); gg.box(-2.45, y + 0.9, BR.bz + 0.18, -2.0, y + 1.75, BR.bz + 0.26, { bevel: 0.03 });
    gg.mat('cast', C.brass); gg.box(-2.25, y + 1.75, BR.bz + 0.12, -2.2, y + 1.8, BR.bz + 0.2);
    gg.mat('felt', '#6a3a2a'); gg.box(0.9, y, -25.62, 1.18, y + 0.1, -25.52, { bevel: 0.02 }); gg.box(1.22, y, -25.64, 1.5, y + 0.1, -25.54, { bevel: 0.02 });
  }, 2);
  prop(s, 'cup', 1.9, y + 1.0, -26.2, 0, { glaze: '#2f6f73' }, { level: 2 });
  s.solid(1.75, y, -26.35, 2.05, y + 1.0, -26.05);
  s.furniture((gg) => { gg.mat('wood', '#5a3a24'); gg.box(1.75, y, -26.35, 2.05, y + 1.0, -26.05, { bevel: 0.01 }); }, 2);
  s.light({ at: [0, y + 1.75, -26.35], color: [1, 0.82, 0.58], power: 1.4, range: 3.2, radius: 0.15, lamp: true, clip: [-3, y - 0.2, -29.7, 3, y + 3, -25.0] });
  // the organist on the bench, the one who turns her pages beside her
  s.spot('sit', 0, y + 0.69, -25.65, PI, { tags: ['write', 'organ'] });
  s.spot('work', 1.65, y, -25.85, -2.4, { tags: ['notes'] });
  s.spot('stand', -1.9, y, -25.7, 2.6, { tags: ['view'] });
  s.path([[-13.3, y, -27.2], [-8, y, -28.6], [-1.9, y, -28.6], [-1.9, y, -25.7], [1.9, y, -25.7], [1.9, y, -28.6], [8, y, -28.6], [13.3, y, -27.2]], { width: 1.2 });
  // play it
  s.interact({ x: 0, y: y + 1.3, z: -25.3, radius: 1.4, prompt: 'Sit at the console', onUse: async (gm) => {
    const h = hour(gm);
    const first = !(gm.flags && gm.flags['fo-console']);
    if (gm.flags) gm.flags['fo-console'] = true;
    if (h >= 23 || h < 7) {
      await say(gm, 'The console', ['The console is dark and its lid is down. A card on it says: THE WIND IS OFF FROM ELEVEN. THE BLOWER IS LOUD AND THE FLATS ABOVE US ARE ASLEEP.']);
      return;
    }
    if (first) await say(gm, 'Mirela, the organist', [
      'The organist is small and seventy-three, and moves up the bench for you without being asked. "Guests may. Everything is drawn for the principals already."',
      '"Not the red knobs. Those are the trumpets, and then the whole court hears it, and the block upstairs writes to us."',
    ]);
    const pick = await choose(gm, 'The Bellows', 'Everything is drawn for the principals.', [
      { label: 'The bottom C', sub: '17.4 metres of pipe, sixteen beats a second', value: 'c' },
      { label: 'A cadence on the principals', sub: 'five chords, the pedal holding its D', value: 'chord' },
      { label: "The drum's tune", sub: 'the one the buskers play, with Mirela on the right hand', value: 'tune' },
      { label: 'Leave it', value: 'none' },
    ]);
    if (!pick || pick === 'none') return;
    organ.stop();
    if (gm.player && gm.player.sit) { gm.player.sit({ x: -0.25, y, z: -25.65, yaw: PI, eye: 1.3 }); gm.player.yaw = 0; gm.player.pitch = 0.28; }
    if (pick === 'c') {
      organ.bottomC();
      await say(gm, 'The Bellows', [
        'You put your left foot on the lowest pedal. For a moment there is nothing, and then the bridge starts to hum under your shoes, and the bench, and your teeth.',
        'That is the bottom C: a pipe 17.4 metres long, sixteen beats a second. In the old air the same note took a pipe of 9.75 metres. Sound runs about 1.8 times as fast here, so a pipe plays about ten semitones sharp for its length, and has to be 1.8 times as long to play the old note.',
        '"Most people feel it before they hear it," says Mirela. "The children put their hands flat on the pipe."',
      ]);
    } else if (pick === 'chord') {
      organ.chord();
      await say(gm, 'The Bellows', [
        'You put your hands down where Mirela points. The court takes the chord and gives it back off every stone wall, and goes on giving it back for four seconds after you let go.',
        '"That is why this room is stone," she says. "An organ wants a room that rings. Everything else in this building is hung in felt to stop it doing exactly that."',
      ]);
    } else {
      organ.theme({ spb: 0.9 });
      await say(gm, 'The Bellows', [
        'Everybody in Chervil knows this one. You find the D with your left foot and hold it; Mirela plays the tune over the top with one hand and turns her own page with the other.',
        'Down on the floor of the court a few people stop to listen. Somebody on the third gallery hums the second half a beat ahead.',
        '"You rushed the B," says Mirela. "Everyone rushes the B. It is the best note in it."',
      ]);
    }
    find(gm, 'long-pipes');
  } });
}

// the light on the organ: four uplights at its foot, a wash from under the bridge, two lamps on the swell boxes
function organLight(s) {
  for (const [x, z] of [[-13.4, -29.0], [13.4, -29.0], [-1.7, -29.2], [1.7, -29.2]]) {
    s.light({ at: [x, 0.3, z], type: 'spot', dir: [0, 1, -0.12], cone: [28, 14], color: [1, 0.86, 0.66], power: 150, range: 22, shadow: true, lamp: Math.abs(x) > 5, clip: CLIP });
    s.furniture((gg) => { gg.mat('cast', '#2a2622'); gg.cyl(x, 0, z, 0.16, 0.12, { segs: 10 }); gg.mat('diffuser', '#ffe2b0', { emissive: 4 }); gg.cyl(x, 0.12, z, 0.12, 0.01, { segs: 10 }); });
  }
  s.light({ at: [-10.5, 7.1, -29.6], to: [10.5, 7.1, -29.6], type: 'tube', color: [1, 0.8, 0.55], power: 3.5, range: 5, radius: 0.15, lamp: true, clip: CLIP });
  s.light({ at: [-10.5, 8.5, -29.6], to: [10.5, 8.5, -29.6], type: 'tube', color: [1, 0.82, 0.6], power: 2.5, range: 5, radius: 0.15, lamp: true, clip: CLIP });
  // the front light: two lamps high on the back gallery, aimed down the court at the organ's middle
  for (const sx of [-1, 1]) s.light({ at: [sx * 7, TOP - 0.8, -1.2], type: 'spot', dir: [-sx * 0.12, -0.3, -0.95], cone: [22, 12], color: [1, 0.88, 0.7], power: 420, range: 46, shadow: false, lamp: true, clip: [-15.2, -0.3, -34.2, 15.2, TOP, 0.3] });
  for (const sx of [-1, 1]) s.deco((gg) => { gg.mat('cast', '#2a2622'); gg.push(); gg.move(sx * 7, TOP - 0.8, -1.2); gg.rotX(-1.25); gg.cyl(0, -0.2, 0, 0.18, 0.4, { segs: 10 }); gg.mat('diffuser', '#ffe8c0', { emissive: 4 }); gg.cyl(0, -0.21, 0, 0.15, 0.01, { segs: 10 }); gg.pop(); });
  for (const sx of [-1, 1]) s.light({ at: [sx * 12.6, 17.2, -27.6], type: 'spot', dir: [-sx * 0.42, -0.08, -0.9], cone: [40, 22], color: [1, 0.84, 0.62], power: 38, range: 14, shadow: false, lamp: true, clip: CLIP });
}

// the plate at the foot of the bottom C
function plate(game, s) {
  sign(s, { kind: 'plate', text: 'BOTTOM C · 17.40 m', sub: 'in the old air 9.75 m · sixteen beats a second', palette: ['#b08a45', '#2a1c14'] }, 0, 0.27, ORG.face + 0.02, { face: 'Z', w: 1.5, h: 0.3 });
  s.interact({ x: 0, y: 1.0, z: -28.9, radius: 1.5, prompt: 'Read the plate on the big pipe', onUse: async (gm) => {
    await say(gm, 'The plate', [
      'BOTTOM C. 17.40 METRES. In the old air this note took a pipe of 9.75 metres. Sound runs about 1.8 times as fast in heliox, so every pipe here plays about ten semitones sharp for its length, and must be about 1.8 times as long to play the old note.',
      'Under it, smaller: THE BELLOWS HAS 6,212 PIPES. FORTY-ONE ARE TALLER THAN A DECK. THE SHORTEST IS THE LENGTH OF YOUR LITTLE FINGER. ALL OF THEM ARE TUNED IN THIS AIR, AT TWENTY-TWO DEGREES.',
      'Somebody has scratched a line on the tin at about the height of a child, and written beside it: hand here when it plays.',
    ]);
    find(gm, 'long-pipes');
  } });
}
