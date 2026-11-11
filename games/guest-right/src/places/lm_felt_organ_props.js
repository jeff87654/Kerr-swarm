// The Bellows (Chervil's organ hall, deck 150, under Ring Four): the plan, the colours, small helpers, the organ
// player (notes from the game's own synthesiser) and the props. Every prop is drawn at the origin with its front
// toward +z and cached by the few parameters it takes.
//
// Frame 'felt-organ': x spinward, z toward the back cap, y up. Deck 150 at y = 0, decks 151 to 154 at y = 4, 8, 12, 16.
import { defineProp } from '../world/props.js';
import { wall } from '../world/kit.js';
import { shadeHex } from '../core/util.js';
import { THEME, THEME_CHORDS, voicing, bassOf } from '../audio/themes.js';

export const PI = Math.PI;
export const REGION = 'felt-organ';
export const DY = [0, 4, 8, 12, 16];
export const TOP = 19.6;                                    // the court's ceiling, under deck 155

// ---------------------------------------------------------------------------------------------------------------
// the plan
// ---------------------------------------------------------------------------------------------------------------
// Bellows Court, the atrium: x[-15, 15] z[-34, 0], five decks tall. The organ fills its front end (z < -29.8).
export const ATR = { x0: -15, x1: 15, z0: -34, z1: 0 };
// galleries on decks 151 to 154 down both sides (x beyond +-11.6), and across the back (z[-3.4, 0]) on 152 to 154
export const GAL = { xi: 11.6, xo: 15, z0: -28.4, back: -3.4 };
// the organ: case from the front wall to its face; pipe centres on PZ; flats stand on the impost
export const ORG = { z0: -34, face: -29.75, pz: -30.75, impost: 2.6 };
// the console bridge on deck 152, across the organ's face, with the console's bay in the middle
export const BR = { y: 8, z0: -29.65, z1: -27.6, bx: 2.6, bz: -25.2 };
// stair halls outside the court's side walls; their doors onto the court and galleries are at z[-3.1, -1.7]
export const STW = { x0: -19.4, x1: -15.1, z0: -9, z1: -1.6 };
export const STE = { x0: 15.1, x1: 19.4, z0: -9, z1: -1.6 };
export const SDOOR = { z0: -3.1, w: 1.4 };
// the foyer behind the court, two decks tall, open to it between the piers; the cab lobby behind that
export const FOY = { x0: -15, x1: 15, z0: 0, z1: 14, h: 7.4 };
export const LOB = { x0: -6, x1: 6, z0: 14, z1: 20, h: 3.4 };
// the long foyer to the Quilt's stalls door and the Kettle Room
export const CORR = { x0: 15, x1: 61, z0: 0, z1: 8, h: 3.4 };
// the Quilt, the concert hall: three decks tall; thirteen raked rows rising anti from the front cross aisle; the stage
export const QU = { x0: 19.6, x1: 53, z0: -28, z1: 0, h: 11.4, front: 38.8, rows: 13, pitch: 1.15, stage: 41.5, stageH: 1.0, sz0: -25, sz1: -3 };
export const QRISE = 4 / 13;
// the Kettle Room, the players' room behind the stage
export const KET = { x0: 53.4, x1: 61, z0: -14, z1: 0, h: 3.2 };
// rooms over the foyer: the Cutting Room and the Wind Room on deck 152, the Sound Larder on deck 153
export const BACK = { z0: 0, z1: 11, h: 3.3 };
export const CUT = { x0: -15, x1: -0.1 };
export const WIND = { x0: 0.1, x1: 15 };
export const LAR = { x0: -15, x1: 15 };

// colours
export const C = {
  plaster: '#d8b98c', plasterD: '#b89668', teal: '#1f4f52', tealL: '#2f6f73', gilt: '#c9a24a', brass: '#b08a45',
  walnut: '#4a2e1e', walnutD: '#2c1a12', oak: '#8a5a34', tin: '#d8d5cc', zinc: '#a9a7a0', copper: '#b8704a',
  floor: '#b8a58a', madder: '#9b2f2a', saffron: '#d99a2b', ochre: '#b8782f', plum: '#5b3a5e', indigo: '#2f3f6a',
  moss: '#5f7a3a', rose: '#c46a6a', iron: '#2a2c2c', cream: '#efe4c8', ink: '#22302c',
};
export const FELTS = [C.madder, C.saffron, C.tealL, C.plum, C.ochre, C.indigo, C.moss, C.rose, '#7a3a2a', '#3f7f6a', '#a85a2a', '#4a5a8a'];

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or the audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export async function choose(game, who, prompt, options) { if (!game.ui || !game.ui.choose) return null; game.busy++; try { return await game.ui.choose(who, prompt, options); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z, o) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z, o); }
export function find(game, id) { if (game.journal && game.journal.find) game.journal.find(id); }
export function hour(game) { return game.clock ? game.clock.hours : 12; }
export function day(game) { return game.clock ? game.clock.day : 1; }
// Wait a frame between the big parts of the build, then take the region's sign pages back.
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
// ---------------------------------------------------------------------------------------------------------------
// walls with doors in them: a run along z (constant x) or along x (constant z), cut into pieces round each hole and
// into lengths the drum can bend. holes: [[a0, w, sill, h], ...] in the run's own coordinate.
// ---------------------------------------------------------------------------------------------------------------
export function wallRun(s, axis, c, a0, a1, y0, h, o, holes) {
  const hs = (holes || []).slice().sort((p, q) => p[0] - q[0]);
  const piece = (u0, u1, op) => {
    const step = axis === 'x' ? 10 : 40;
    runX(u0, u1, step, (a, b) => {
      const opts = Object.assign({}, o, { openings: op ? [{ at: 0, w: b - a, h: op[3], sill: op[2] }] : undefined });
      if (axis === 'x') wall(s, a, c, b, c, y0, h, opts); else wall(s, c, a, c, b, y0, h, opts);
    });
  };
  let u = a0;
  for (const hl of hs) { if (hl[0] > u + 0.01) piece(u, hl[0]); piece(hl[0], hl[0] + hl[1], hl); u = hl[0] + hl[1]; }
  if (u < a1 - 0.01) piece(u, a1);
}

export function pickBy(list, k) { return list[((k % list.length) + list.length) % list.length]; }

// The speaking length of an open pipe in this air: the old thirty-two foot C (16.35 beats a second, MIDI 12) was
// 9.75 m in the old air; sound runs about 1.78 times as fast here, so it is 17.4 m.
export function pipeLen(m) { return 17.4 * Math.pow(2, -(m - 12) / 12); }
export function pipeRad(m) { return 0.27 * Math.pow(2, -(m - 12) / 19); }
const q = (v, k) => Math.round(v / k) * k;

// ---------------------------------------------------------------------------------------------------------------
// the organ player: notes from the synthesiser's heliox flute, slowed and sped to pitch, sounded from the pipes
// ---------------------------------------------------------------------------------------------------------------
// One sound, 'flute-note', is a D (MIDI 74) a second and a quarter long; played slower it is lower and longer, which is
// how an organ pipe behaves anyway. Every event is a time and a function; the queue runs in the scope's own update.
export function organPlayer(game, s, f) {
  const qu = []; let t = 0; let until = 0;
  s.every((dt) => {
    t += Math.min(0.1, dt || 0);
    while (qu.length && qu[0].at <= t + 0.25) { const e = qu.shift(); try { e.fn(Math.max(0, e.at - t)); } catch (err) { /* sound is optional */ } }
  });
  const at = (delay, fn) => { const e = { at: t + delay, fn }; let i = qu.length; qu.push(e); while (i > 0 && qu[i - 1].at > e.at) { qu[i] = qu[i - 1]; i--; } qu[i] = e; until = Math.max(until, e.at); };
  // where a note comes from: low notes from the towers, high ones from the flats
  const where = (m) => {
    if (m < 40) return [((m * 7) % 3 - 1) * 12.5, 7, ORG.pz];
    const k = (m * 5) % 9; return [(m % 2 ? -1 : 1) * (3.6 + k * 0.85), 6 + (m - 40) * 0.05, ORG.pz];
  };
  const note = (delay, m, vol) => at(delay, (d) => {
    if (!game.audio || !game.sfxAt) return;
    const p = where(m);
    game.sfxAt('flute-note', f, p[0], p[1], p[2], { pitch: Math.pow(2, (m - 74) / 12), vol: vol, radius: m < 40 ? 16 : 11, delay: d });
  });
  const api = {
    busy() { return until > t; },
    stop() { qu.length = 0; until = t; },
    note,
    // the bottom C: sixteen beats a second, felt as much as heard, and two octaves over it so the ear finds it
    bottomC() {
      note(0, 12, 2.2); note(0.05, 24, 1.4); note(2.5, 36, 0.7);
      return 6;
    },
    // a plain cadence on the principals: D minor, B flat, F, C, D, the pedal holding its D underneath
    chord() {
      const ch = ['Dm', 'Bb', 'F', 'C', 'Dm'], spb = 1.5; let prev = null;
      note(0, 38, 1.5); note(spb * 4, 38, 1.2);
      ch.forEach((sym, i) => {
        const v = voicing(sym, prev, 55, 74, 4); prev = v;
        for (const m of v) { note(i * spb, m, 0.75); note(i * spb + 0.75, m, 0.45); }
        note(i * spb, v[v.length - 1] + 12, 0.3);
      });
      return ch.length * spb + 3;
    },
    // the drum's own tune, the one the buskers play, on the full organ: a pedal note to each bar, chords on the beats
    theme(o) {
      const spb = (o && o.spb) || 0.86, bars = (o && o.bars) || 8, vol = (o && o.vol) || 1;
      let tb = 0, prevV = null, prevB = null, bar = 0, beat = 0;
      for (const [m, d] of THEME) {
        if (m !== null) { note(tb * spb, m, 0.85 * vol); if (d >= 1.5) note(tb * spb + spb, m, 0.5 * vol); note(tb * spb, m - 12, 0.35 * vol); }
        tb += d;
      }
      for (bar = 0; bar < Math.min(bars, THEME_CHORDS.length); bar++) {
        const sym = THEME_CHORDS[bar], b = bassOf(sym, prevB, 38, 50); prevB = b;
        const v = voicing(sym, prevV, 53, 69, 3); prevV = v;
        note(bar * 4 * spb, b, 1.2 * vol); note(bar * 4 * spb, b - 12, 0.9 * vol);
        for (beat = 0; beat < 4; beat += 2) for (const m of v) note((bar * 4 + beat) * spb, m, 0.5 * vol);
      }
      return Math.min(bars, 8) * 4 * spb + 4;
    },
    // what an organist practising sounds like from the gallery: a run, a held note checked twice, two bars of the tune
    practice(r) {
      const k = Math.floor(r * 4);
      if (k === 0) { const sc = [50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 67, 65, 64, 62]; sc.forEach((m, i) => note(i * 0.32, m, 0.6)); return 7; }
      if (k === 1) { note(0, 31, 1.6); note(3.5, 31, 1.6); note(7, 43, 1.0); note(7, 62, 0.5); note(7, 67, 0.5); return 12; }
      if (k === 2) return api.theme({ bars: 2, spb: 0.95, vol: 0.85 });
      return api.chord();
    },
  };
  return api;
}

// ---------------------------------------------------------------------------------------------------------------
// props: the pipes
// ---------------------------------------------------------------------------------------------------------------
// A metal flue pipe. p: { L (speaking length), r, metal, foot }: the toe at y = 0, the mouth at the top of the foot.
defineProp('feltorgan.pipe', (g, p) => {
  const L = p.L, r = p.r, foot = p.foot || Math.max(0.3, Math.min(1.4, r * 5)), seg = r > 0.15 ? 18 : r > 0.07 ? 12 : 8;
  const metal = p.metal || C.tin;
  g.mat('cast', metal, { rough: -0.4 });
  g.lathe(0, 0, [[r * 0.14, 0], [r * 0.2, foot * 0.12], [r * 0.98, foot]], { segs: seg, capBottom: false, capTop: false });
  g.lathe(0, 0, [[r, foot], [r, foot + L - 0.03], [r * 1.025, foot + L - 0.02], [r * 1.025, foot + L]], { segs: seg, capBottom: false, capTop: false });
  // the inside, dark, a hand down from the rim
  g.mat('cast', '#1a1816', { rough: 0.3 }); g.lathe(0, 0, [[r * 0.99, foot + L], [r * 0.97, foot + L - 0.04], [0, foot + L - 0.06]], { segs: seg, capBottom: false, capTop: false });
  // the mouth: the flattened upper lip, the dark slot, the languid's line
  const mw = r * 1.15, mh = Math.max(0.03, r * 0.42), zf = r * 0.985;
  g.mat('cast', shadeHex(metal, 1.08), { rough: -0.5 });
  g.prism([[-mw / 2, zf - 0.004], [mw / 2, zf - 0.004], [mw / 2 * 0.2, zf + r * 0.06], [-mw / 2 * 0.2, zf + r * 0.06]], foot + mh, foot + mh + r * 1.3);
  g.mat('cast', '#121010'); g.box(-mw / 2, foot, zf - 0.01, mw / 2, foot + mh, zf + 0.004, { faces: 'Z' });
  g.mat('cast', shadeHex(metal, 0.8)); g.box(-mw / 2, foot - 0.012, zf - 0.006, mw / 2, foot, zf + 0.01, { faces: 'ZY' });
  return { tier: 's', cast: false, posts: r > 0.08 && p.solid ? [[0, 0, r, 0, foot + L]] : null };
});

// A square wooden pipe (the open wood). p: { L, w, wood }: the foot block, the mouth on the front, the tuning shade at the top.
defineProp('feltorgan.woodpipe', (g, p) => {
  const L = p.L, w = p.w, d = w * 1.2, foot = 0.7, wood = p.wood || '#6b4429';
  g.mat('wood', wood, { rough: -0.05 });
  g.box(-w / 2, foot, -d / 2, w / 2, foot + L, d / 2, { bevel: 0.012, faces: 'xXzZy' });
  g.mat('wood', '#1a120c'); g.box(-w / 2 + 0.04, foot + L - 0.05, -d / 2 + 0.04, w / 2 - 0.04, foot + L - 0.04, d / 2 - 0.04, { faces: 'Y' });
  g.mat('wood', shadeHex(wood, 0.82)); g.box(-w / 2 - 0.02, foot + L - 0.06, -d / 2 - 0.02, w / 2 + 0.02, foot + L, d / 2 + 0.02, { faces: 'xXzZY', bevel: 0.006 });
  // the foot: a narrower block, and the toe board it stands in
  g.mat('wood', shadeHex(wood, 0.9)); g.box(-w * 0.3, 0, -d * 0.3, w * 0.3, foot, d * 0.3, { faces: 'xXzZ' });
  // the front board, a little proud and lighter, with the mouth and its cap
  g.mat('wood', p.front || '#8a5a34', { rough: -0.1 }); g.box(-w / 2 - 0.006, foot, d / 2, w / 2 + 0.006, foot + L * 0.995, d / 2 + 0.02, { faces: 'ZxX', bevel: 0.004 });
  const my = foot + 0.12, mh = w * 0.32;
  g.mat('wood', '#120c08'); g.box(-w * 0.42, my, d / 2 + 0.02, w * 0.42, my + mh, d / 2 + 0.024, { faces: 'Z' });
  g.mat('wood', '#b98a52'); g.box(-w * 0.46, foot, d / 2 + 0.02, w * 0.46, my, d / 2 + 0.07, { faces: 'ZYxX', bevel: 0.006 });
  // a painted band and the stencilled note under the mouth's lip
  g.mat('paint', '#c9a24a'); g.box(-w / 2 - 0.008, my + mh + 0.12, d / 2 + 0.02, w / 2 + 0.008, my + mh + 0.17, d / 2 + 0.024, { faces: 'Z' });
  g.mat('cast', '#b08a45', { rough: -0.2 }); g.box(-w * 0.3, foot + L - 0.5, d / 2 + 0.02, w * 0.3, foot + L - 0.06, d / 2 + 0.03, { faces: 'ZxX' });
  return { tier: 's', cast: false, solid: [[-w / 2, 0, -d / 2, w / 2, Math.min(3, foot + L), d / 2 + 0.07]] };
});

// A trumpet en chamade: a reed laid flat and pointing at the room. p: { L (resonator), r (bell) }. Its boot is at the origin, it points +z.
defineProp('feltorgan.trumpet', (g, p) => {
  const L = p.L, r = p.r;
  g.push(); g.rotX(PI / 2);
  g.mat('cast', '#c99a4a', { rough: -0.45 });
  g.lathe(0, 0, [[0.035, 0], [0.04, 0.16], [0.03, 0.2], [0.018, 0.24], [0.02, L * 0.3], [r * 0.32, L * 0.8], [r * 0.6, L * 0.94], [r, L], [r * 0.96, L + 0.01]], { segs: 12, capTop: false });
  g.mat('cast', '#1a1410'); g.lathe(0, 0, [[r * 0.95, L + 0.005], [r * 0.6, L - 0.02], [0, L - 0.08]], { segs: 12, capBottom: false, capTop: false });
  g.mat('cast', '#8a6a32'); g.lathe(0, 0, [[0.05, 0.02], [0.052, 0.14], [0.045, 0.16]], { segs: 10 });
  g.pop();
  return { tier: 's', cast: false };
});

// The console: four manuals, two stop jambs, a music desk, the pedalboard and the bench. Front (+z) to the organist.
defineProp('feltorgan.console', (g) => {
  const W = 2.5, wood = C.walnut;
  g.mat('wood', wood, { rough: -0.1 });
  g.box(-W / 2, 0.05, -0.62, W / 2, 1.18, -0.02, { bevel: 0.015 });                          // the body
  g.box(-W / 2 - 0.03, 0, -0.66, W / 2 + 0.03, 0.08, 0.1, { bevel: 0.01 });                  // the plinth
  g.box(-W / 2 - 0.02, 1.18, -0.66, W / 2 + 0.02, 1.24, -0.06, { bevel: 0.012 });           // the lid
  // the key cheeks and the stop jambs, angled toward the bench
  for (const sx of [-1, 1]) {
    g.push(); g.move(sx * 1.03, 0, 0); g.rotY(-sx * 0.42);
    g.mat('wood', wood); g.box(-0.2, 0.62, -0.2, 0.2, 1.38, 0.32, { bevel: 0.012 });
    g.mat('wood', C.walnutD); g.box(-0.18, 0.66, 0.32, 0.18, 1.34, 0.335, { faces: 'Z' });
    // stop knobs: three columns of eight, coloured by family
    const fam = ['#efe4c8', '#efe4c8', '#d8c0a0', '#c9554a', '#efe4c8', '#3f6f8a', '#efe4c8', '#d8c0a0'];
    for (let c = 0; c < 3; c++) for (let rr = 0; rr < 8; rr++) {
      const x = -0.12 + c * 0.12, y = 0.73 + rr * 0.078, out = (c + rr + (sx > 0 ? 1 : 0)) % 3 === 0 ? 0.06 : 0.025;
      g.push(); g.move(x, y, 0.335); g.rotX(PI / 2);
      g.mat('wood', '#2a1c14'); g.cyl(0, 0, 0, 0.012, out, { segs: 6 });
      g.mat('glaze', fam[rr]); g.cyl(0, out, 0, 0.026, 0.02, { segs: 10 });
      g.pop();
    }
    g.pop();
  }
  // four manuals stepped up and back, each with its sharps, and a stick of pistons under each
  for (let k = 0; k < 4; k++) {
    const y = 0.74 + k * 0.105, z0 = 0.3 - k * 0.12, z1 = z0 - 0.17;
    g.mat('wood', C.walnutD); g.box(-0.86, y - 0.035, z1 - 0.02, 0.86, y - 0.005, z0 + 0.012);
    g.mat('glaze', '#ece2cc', { rough: -0.2 }); g.box(-0.82, y - 0.005, z1, 0.82, y + 0.014, z0, { faces: 'YZ' });
    g.mat('wood', '#16100c');
    for (let n = 0; n < 61; n++) { const pc = n % 12; if (pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10) { const x = -0.82 + (n + 0.5) * (1.64 / 61); g.box(x - 0.007, y + 0.014, z1, x + 0.007, y + 0.028, z1 + 0.1, { faces: 'xXYZ' }); } }
    g.mat('cast', '#b08a45'); for (let n = 0; n < 8; n++) g.box(-0.6 + n * 0.16, y - 0.028, z0 + 0.012, -0.58 + n * 0.16, y - 0.012, z0 + 0.016, { faces: 'Z' });
  }
  // the music desk, a hooded lamp over it, a piece of music on it
  g.mat('wood', wood); g.push(); g.move(0, 1.2, -0.12); g.rotX(-0.32); g.box(-0.62, 0, -0.02, 0.62, 0.42, 0.0, { bevel: 0.006 }); g.mat('paper', '#efe6d0'); g.box(-0.42, 0.04, 0.0, 0.42, 0.36, 0.006, { faces: 'Z' }); g.pop();
  g.mat('cast', '#3a2e22'); g.box(-0.7, 1.62, -0.24, 0.7, 1.68, -0.08, { bevel: 0.01 }); g.tube([[-0.66, 1.24, -0.3], [-0.66, 1.65, -0.18]], 0.012, { segs: 5 }); g.tube([[0.66, 1.24, -0.3], [0.66, 1.65, -0.18]], 0.012, { segs: 5 });
  g.mat('diffuser', '#ffe0a8', { emissive: 3.5, lamp: true }); g.box(-0.66, 1.605, -0.2, 0.66, 1.62, -0.12, { faces: 'y' });
  // the pedalboard: thirty-two wooden pedals, the sharps raised and darker
  g.mat('wood', C.walnutD); g.box(-0.95, 0, 0.0, 0.95, 0.06, 0.95, { faces: 'xXzZY' });
  for (let n = 0; n < 32; n++) {
    const pc = n % 12, sharp = pc === 1 || pc === 3 || pc === 6 || pc === 8 || pc === 10, x = -0.9 + (n + 0.5) * (1.8 / 32);
    if (sharp) { g.mat('wood', '#2a1c14'); g.box(x - 0.016, 0.06, 0.05, x + 0.016, 0.12, 0.42, { bevel: 0.005 }); }
    else { g.mat('wood', '#c9a878'); g.box(x - 0.022, 0.06, 0.05, x + 0.022, 0.085, 0.92, { bevel: 0.004 }); }
  }
  // the bench, high, so the feet reach the pedals
  g.mat('wood', wood, { rough: -0.1 });
  g.box(-0.85, 0.6, 0.62, 0.85, 0.66, 0.98, { bevel: 0.012 });
  for (const sx of [-1, 1]) g.box(sx * 0.8 - 0.03, 0, 0.64, sx * 0.8 + 0.03, 0.6, 0.96, { bevel: 0.008 });
  g.mat('felt', C.madder); g.box(-0.82, 0.66, 0.65, 0.82, 0.69, 0.95, { bevel: 0.012 });
  return { tier: 's', cast: true, solid: [[-W / 2 - 0.2, 0, -0.66, W / 2 + 0.2, 1.24, 0.0], [-0.9, 0, 0.0, 0.9, 0.86, 0.36], [-0.85, 0, 0.62, 0.85, 0.66, 0.98]] };
});

// A seat in the Quilt: an iron standard, a felt pad that tips up, a felt back with a wooden shell, an arm. p: { c }
defineProp('feltorgan.seat', (g, p) => {
  const c = p.c || C.madder;
  g.mat('cast', C.iron); g.box(-0.265, 0, -0.26, -0.24, 0.64, 0.18, { faces: 'xXzZY' });
  g.mat('wood', '#5a3a24', { rough: -0.1 }); g.box(-0.27, 0.62, -0.24, -0.235, 0.66, 0.16, { bevel: 0.006 });
  g.mat('felt', c); g.box(-0.235, 0.4, -0.17, 0.235, 0.48, 0.24, { bevel: 0.03 });
  g.push(); g.move(0, 0.5, -0.22); g.rotX(-0.14);
  g.mat('felt', c); g.box(-0.235, 0, -0.04, 0.235, 0.5, 0.04, { bevel: 0.03 });
  g.mat('wood', '#5a3a24'); g.box(-0.235, -0.06, -0.08, 0.235, 0.52, -0.04, { faces: 'zxXY' });
  g.pop();
  return { tier: 'd', cast: false };
});

// A heliox flute lying along x, from x = 0 to x = L. p: { L, wood }
defineProp('feltorgan.flute', (g, p) => {
  const L = p.L || 1.2;
  g.mat(p.wood ? 'wood' : 'cast', p.wood || '#cfccc4', { rough: p.wood ? -0.1 : -0.4 });
  g.tube([[0, 0.02, 0], [L, 0.02, 0]], 0.017, { segs: 8 });
  g.mat('cast', '#b08a45'); for (let i = 0; i < 9; i++) { const x = L * (0.42 + i * 0.055); g.cyl(x, 0.035, 0, 0.009, 0.006, { segs: 6 }); }
  g.box(L * 0.1, 0.034, -0.008, L * 0.14, 0.04, 0.008);
  return { tier: 'd', cast: false };
});

// A music stand. p: { tint }
defineProp('feltorgan.stand', (g, p) => {
  g.mat('cast', p.tint || '#2a2a28');
  g.tube([[0, 0, 0], [0, 1.05, 0]], 0.012, { segs: 5 });
  for (let i = 0; i < 3; i++) { const a = i * 2.094; g.tube([[0, 0.25, 0], [Math.cos(a) * 0.26, 0, Math.sin(a) * 0.26]], 0.008, { segs: 4 }); }
  g.push(); g.move(0, 1.05, 0); g.rotX(-0.35); g.box(-0.25, 0, -0.01, 0.25, 0.34, 0.0); g.mat('paper', '#efe6d0'); g.box(-0.21, 0.04, 0.0, 0.21, 0.32, 0.004, { faces: 'Z' }); g.pop();
  return { tier: 'd', cast: false };
});

// A cab berth: brass doors in a stone frame, a lit indicator. Front +z.
export function berth(s, x, z, yaw) {
  const g = s.g, bw = 1.3;
  g.at(x, 0, z, yaw);
  g.mat('stone', '#9c8f7c'); g.box(-bw / 2 - 0.2, 0, -0.06, bw / 2 + 0.2, 2.62, 0.12, { faces: 'xXZY', bevel: 0.01 });
  g.mat('cast', C.brass, { rough: -0.15 }); g.box(-bw / 2, 0.02, 0.12, -0.01, 2.36, 0.15); g.box(0.01, 0.02, 0.12, bw / 2, 2.36, 0.15);
  g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(-bw / 2 + 0.06, yy, 0.15, bw / 2 - 0.06, yy + 0.03, 0.165);
  g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(-0.2, 2.44, 0.12, 0.2, 2.52, 0.14);
  g.mat('cast', '#3a3430'); g.box(bw / 2 + 0.26, 1.05, 0.12, bw / 2 + 0.42, 1.3, 0.18, { bevel: 0.01 });
  g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.cyl(bw / 2 + 0.34, 1.16, 0.19, 0.03, 0.012, { segs: 8 });
  g.pop();
  s.flush({ tier: 's' });
}

// A reservoir of the organ's wind: a wedge of boards and proofed cloth, ribs at the fold, cast weights on the top board.
// p: { w, d, open (the rise of the top board) }
defineProp('feltorgan.bellows', (g, p) => {
  const w = p.w || 2.4, d = p.d || 1.6, rise = p.open || 0.45;
  g.mat('wood', '#6b4a2f'); g.box(-w / 2, 0, -d / 2, w / 2, 0.5, d / 2, { bevel: 0.01 });
  // the folds: two cloth gussets between bottom and top boards, each with a wooden rib
  const y0 = 0.5, y1 = 0.5 + rise;
  for (let k = 0; k < 2; k++) {
    const ya = y0 + rise * k / 2, yb = y0 + rise * (k + 1) / 2, ins = 0.08;
    g.mat('weave', '#4a3a2e'); g.box(-w / 2 + ins, ya, -d / 2 + ins, w / 2 - ins, (ya + yb) / 2, d / 2 - ins, { faces: 'xXzZ' });
    g.mat('weave', '#5a4636'); g.box(-w / 2 + 0.02, (ya + yb) / 2 - 0.02, -d / 2 + 0.02, w / 2 - 0.02, (ya + yb) / 2 + 0.02, d / 2 - 0.02, { faces: 'xXzZ' });
    g.mat('wood', '#8a5a34'); g.box(-w / 2, yb - 0.03, -d / 2, w / 2, yb, d / 2, { faces: 'xXzZ' });
  }
  g.mat('wood', '#7a5233'); g.box(-w / 2, y1, -d / 2, w / 2, y1 + 0.06, d / 2, { bevel: 0.01 });
  // the weights: iron bricks, each painted with what it is for
  const cols = ['#2a2c2c', '#2a2c2c', '#7a2f2a', '#2a2c2c', '#2f5d5a'];
  for (let i = 0; i < 5; i++) { g.mat('cast', cols[i]); g.box(-w / 2 + 0.25 + i * (w - 0.5) / 5, y1 + 0.06, -0.18, -w / 2 + 0.25 + (i + 0.8) * (w - 0.5) / 5, y1 + 0.2, 0.18, { bevel: 0.008 }); }
  return { tier: 's', cast: true, solid: [[-w / 2, 0, -d / 2, w / 2, y1 + 0.2, d / 2]] };
});

// A cabinet of catalogue drawers, with brass pulls and a card in every frame. p: { cols, rows, wood }
defineProp('feltorgan.drawers', (g, p) => {
  const cols = p.cols || 6, rows = p.rows || 8, dw = 0.3, dh = 0.15, W = cols * dw + 0.08, H = rows * dh + 0.5, D = 0.5;
  g.mat('wood', p.wood || '#5a3a24'); g.box(-W / 2, 0, -D / 2, W / 2, H, D / 2, { bevel: 0.01 });
  g.box(-W / 2 - 0.02, H, -D / 2 - 0.02, W / 2 + 0.02, H + 0.04, D / 2 + 0.03, { bevel: 0.008 });
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const x0 = -W / 2 + 0.04 + c * dw, y0 = 0.4 + r * dh, out = (c * 7 + r * 3) % 11 === 0 ? 0.12 : 0;
    g.mat('wood', ((c + r) % 5 === 0) ? '#6b4a2f' : '#61412a'); g.box(x0 + 0.008, y0 + 0.008, D / 2 - 0.02, x0 + dw - 0.008, y0 + dh - 0.008, D / 2 + 0.005 + out, { faces: 'ZxXyY' });
    g.mat('paper', (c + r) % 3 ? '#efe6d0' : '#e6d6b0'); g.box(x0 + dw * 0.3, y0 + dh * 0.55, D / 2 + 0.006 + out, x0 + dw * 0.7, y0 + dh * 0.8, D / 2 + 0.009 + out, { faces: 'Z' });
    g.mat('cast', C.brass, { rough: -0.2 }); g.box(x0 + dw * 0.4, y0 + dh * 0.22, D / 2 + 0.006 + out, x0 + dw * 0.6, y0 + dh * 0.36, D / 2 + 0.03 + out, { bevel: 0.004 });
  }
  return { tier: 's', cast: true, solid: [[-W / 2, 0, -D / 2, W / 2, H, D / 2]] };
});
