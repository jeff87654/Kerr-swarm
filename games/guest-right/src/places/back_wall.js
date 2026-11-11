// The back end wall: three places on the disc at drum z = 3750, each in its own frame because a frame is flat metres
// at one radius. In every frame z = 0 is the wall and the terrace sticks out toward the Hollow (negative z); yaw 0 faces
// the Hollow. Above our own 12.6 m of facade the engine's painting of the wall carries on.
//   1. The dawn terrace (tier one, 0.48 g): a long stone shelf with a broad rail, stepped benches like a small theatre,
//      the Dawn Stand's cart, and at the anti end the elders' corner.
//   2. The Third (tier ten, a third of a g): a sprung dance floor, a band shell, lantern strings, a slow fountain whose
//      water leans spinward, and a high net at the rail.
//   3. The flying hall's gate (the hub, 72 m from the axis, a fortieth of a g): a netted balcony with the sleeve hire,
//      a wall of shoes, the wardens' post and the gate you step off from.
import { floor, lamp, block, stairs } from '../world/kit.js';
import { planter } from '../world/kit2.js';
import { prop, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { SIGNS } from '../content/signs.js';
import { MENUS } from '../content/menus.js';
import { CAST } from '../content/cast.js';
import { Rng, shadeHex } from '../core/util.js';
import { runX, lineX, toast, find, sfx, say, readSpec, buy, seat, facade, broadRail, netX, netZ, lanternString, endPier } from './wall_parts.js';

const ENV = { exposure: 1.0, autoKey: 0.19, autoMin: 0.02, autoMax: 5, bloom: 0.045, warmth: 0.05, contrast: 1.1, saturation: 1.12 };
const SKY = { sky: true, skyTop: 30, sun: true, sunPower: 34, far: 2400, reverb: 'open' };
const PI = Math.PI;

export const place = {
  id: 'back-wall', name: 'The back wall', order: 50,
  build(game) {
    const W = game.world;
    buildDawn(game, W);
    buildThird(game, W);
    buildHub(game, W);
  },
};

// ---------------------------------------------------------------------------------------------------------------
// shared pieces
// ---------------------------------------------------------------------------------------------------------------

// A day's sign in its own little scope, shown only on its day.
function daySigns(game, W, f, id, list) {
  const scopes = [];
  for (const it of list) {
    const ds = W.scope(id + '-' + it.day, f);
    sign(ds, it.spec, it.x, it.y, it.z, it.o || {});
    if (it.draw) it.draw(ds);
    ds.finish(); scopes.push({ ds, day: it.day });
  }
  const show = () => { const d = Math.max(1, Math.min(3, (game.clock && game.clock.day) || 1)); for (const q of scopes) q.ds.visible = (q.day === d) || (q.day === 'not3' && d !== 3); };
  show(); let last = -1;
  game.events.on('update', () => { const d = game.clock ? game.clock.day : 1; if (d !== last) { last = d; show(); } });
}

// A small glazed cab lobby standing against the wall: two berth doors, a canopy, a lamp, the stop and its call button.
function cabLobby(game, s, f, o) {
  const g = s.g, x0 = o.x0, x1 = o.x1, d = o.d || 3.6, H = 3.2, cx = (x0 + x1) / 2, clip = o.clip;
  // canopy roof
  g.mat('stone', '#b9a98e'); g.box(x0 - 0.25, H, -d - 0.25, x1 + 0.25, H + 0.32, 0, { faces: 'xXzYy' });
  g.mat('paint', '#2f5d5a'); g.box(x0 - 0.27, H + 0.06, -d - 0.27, x1 + 0.27, H + 0.26, -d - 0.25, { faces: 'z' });
  s.flush({ tier: 's' });
  // bronze frames and side glass
  g.mat('cast', '#5a4a33');
  for (const x of [x0, x1]) { g.box(x - 0.06, 0, -d - 0.06, x + 0.06, H, -d + 0.06, { bevel: 0.01 }); g.box(x - 0.05, 0, -0.1, x + 0.05, H, 0, { bevel: 0.01 }); g.box(x - 0.04, 0, -d, x + 0.04, 0.12, 0, { faces: 'xXY' }); g.box(x - 0.04, H - 0.1, -d, x + 0.04, H, 0, { faces: 'xXy' }); }
  g.box(x0, H - 0.5, -d - 0.05, x1, H - 0.4, -d + 0.05);
  s.flush({ tier: 's' });
  for (const x of [x0, x1]) { s.glass(x, 0.12, -d + 0.06, x, H - 0.1, -0.1, { tint: '#cfe3e0' }); s.solid(x - 0.06, 0, -d, x + 0.06, H, 0); }
  s.glass(x0 + 0.06, H - 0.4, -d, x1 - 0.06, H - 0.04, -d, { tint: '#e8dcc0', opacity: 0.2 });
  // the berths: brass doors in stone frames, a lit indicator over each
  const bw = 1.3, gap = (x1 - x0 - 2 * bw) / 3;
  const berths = [x0 + gap + bw / 2, x1 - gap - bw / 2];
  for (const bx of berths) {
    g.mat('stone', '#9c8f7c'); g.box(bx - bw / 2 - 0.18, 0, -0.18, bx + bw / 2 + 0.18, 2.6, -0.02, { faces: 'xXzY' });
    g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(bx - bw / 2, 0.02, -0.2, bx - 0.01, 2.36, -0.17); g.box(bx + 0.01, 0.02, -0.2, bx + bw / 2, 2.36, -0.17);
    g.mat('cast', '#8a6d3b'); for (const yy of [0.5, 1.2, 1.9]) g.box(bx - bw / 2 + 0.06, yy, -0.215, bx + bw / 2 - 0.06, yy + 0.03, -0.2);
    g.mat('diffuser', '#ffd9a0', { emissive: 3, lamp: true }); g.box(bx - 0.2, 2.44, -0.2, bx + 0.2, 2.52, -0.18);
    g.mat('cast', '#3a3430'); g.box(bx + bw / 2 + 0.25, 1.05, -0.08, bx + bw / 2 + 0.4, 1.3, -0.02, { bevel: 0.01 });
    g.mat('diffuser', '#3fe0d0', { emissive: 2 }); g.cyl(bx + bw / 2 + 0.325, 1.16, -0.09, 0.03, 0.012, { segs: 8 });
  }
  s.flush({ tier: 's' });
  // a bench and a planter inside, a mat at the threshold
  prop(s, 'wall.bench', x0 + 0.5, 0, -d / 2 - 0.2, PI / 2, { w: Math.min(2.2, d - 1.0), wood: '#7a5233' });
  g.mat('rush', '#8a7a5a'); g.box(x0 + 0.3, 0.002, -d + 0.1, x1 - 0.3, 0.014, -0.35, { faces: 'Y' }); s.flush({ tier: 'd', cast: false });
  sign(s, o.sign, cx, H + 0.16, -d - 0.28, { face: 'z', w: Math.min(3.2, x1 - x0 - 0.4), h: 0.22, board: false, glow: 1.4 });
  lamp(s, 'panel', cx, H - 0.02, -d / 2, { w: 1.6, d: 0.5, K: 3300, power: 0.8, clip });
  game.cab.addStop({ id: o.id, name: o.name, sub: o.sub, frame: f, x: cx, y: 0, z: -d - 1.0, yaw: 0 });
  s.interact({ x: cx, y: 1.2, z: -0.7, radius: 1.8, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(o.id); } });
  s.spot('stand', cx - 0.6, 0, -d + 1.6, 0, { tags: ['wait'] }); s.spot('stand', cx + 0.7, 0, -d + 1.9, PI * 0.1, { tags: ['wait'] });
  return { berths };
}

// A quarter of a sphere: the inside of a band shell. Centre (cx, cy, cz), radius R; its pole touches the wall at +z.
function quarterSphere(s, cx, cy, cz, R, inner, outer) {
  const g = s.g, NA = 7, NB = 16;
  const P = (a, b, rr) => [cx + rr * Math.sin(a) * Math.cos(b), cy + rr * Math.sin(a) * Math.sin(b), cz + rr * Math.cos(a)];
  const face = (p0, p1, p2, p3, inward) => {
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx]; const c = [cx - p0[0], cy - p0[1], cz - p0[2]];
    const d = n[0] * c[0] + n[1] * c[1] + n[2] * c[2];
    if ((d > 0) === inward) g.quad(p0, p1, p2, p3); else g.quad(p0, p3, p2, p1);
  };
  for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) {
    const a0 = (PI / 2) * i / NA, a1 = (PI / 2) * (i + 1) / NA, b0 = PI * j / NB, b1 = PI * (j + 1) / NB;
    g.mat('paint', (i + j) % 2 ? inner : shadeHex(inner, 1.06)); face(P(a0, b0, R), P(a0, b1, R), P(a1, b1, R), P(a1, b0, R), true);
    g.mat('stone', outer); face(P(a0, b0, R + 0.18), P(a0, b1, R + 0.18), P(a1, b1, R + 0.18), P(a1, b0, R + 0.18), false);
  }
  s.flush({ tier: 's' });
  // gilded ribs and the rim
  g.mat('cast', '#d6a640', { rough: -0.1 });
  for (let k = 1; k < 6; k++) { const b = PI * k / 6, pts = []; for (let i = 0; i <= 10; i++) pts.push(P((PI / 2) * i / 10, b, R - 0.03)); g.tube(pts, 0.035, { segs: 5 }); }
  for (const a of [PI / 2, PI / 3, PI / 6]) { const pts = []; for (let j = 0; j <= 20; j++) pts.push(P(a, PI * j / 20, a === PI / 2 ? R + 0.06 : R - 0.03)); g.tube(pts, a === PI / 2 ? 0.12 : 0.03, { segs: a === PI / 2 ? 8 : 5 }); }
  s.flush({ tier: 's' });
}

// Brass posts with a sagging rope between them (a queue lane).
function ropeRail(s, pts) {
  const g = s.g;
  g.mat('cast', '#b08a45', { rough: -0.1 });
  for (const p of pts) g.lathe(p[0], p[1], [[0.14, 0], [0.13, 0.03], [0.03, 0.06], [0.025, 0.9], [0.04, 0.93], [0.045, 0.98], [0, 1.0]], { segs: 10 });
  g.mat('weave', '#8a2f3c');
  for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], line = []; for (let k = 0; k <= 8; k++) { const t = k / 8; line.push([a[0] + (b[0] - a[0]) * t, 0.88 - 0.16 * 4 * t * (1 - t), a[1] + (b[1] - a[1]) * t]); } g.tube(line, 0.018, { segs: 5 }); }
  s.flush({ tier: 'd' });
  for (const p of pts) s.post(p[0], p[1], 0.12, 0, 1.0);
}

// Loops that make a place sound like itself, started once the first time the player is there.
function soundOnce(game, places, start) {
  let done = false;
  game.events.on('zone', (e) => { if (done || !game.audio || !game.loopAt) return; const z = e && e.zone; if (!z || places.indexOf(z.place) < 0) return; done = true; try { start(); } catch (err) { console.error('[back-wall] sound ' + err); } });
}

// The terrace's own sky glow for frames outside the Hollow's (the Third and the hub): follows the sunline.
function skyGlow(game, s, box, k) {
  const a = s.ambient({ box, sky: [0.5, 0.56, 0.42], ground: [0.32, 0.34, 0.26], power: 1, skylit: true, spec: 0.35, groundK: 1 });
  game.events.on('prerender', () => { const sun = game.clock ? game.clock.sun() : 1; a.scale = k * (34 * 0.2 * sun + 0.05 * (1 - sun)); });
  return a;
}

// ===============================================================================================================
// 1. The dawn terrace: tier one, 50 m above the floor, 0.48 g
// ===============================================================================================================
function buildDawn(game, W) {
  const f = W.frame('terrace1', 1450, 0, 3750); f.hollowView = true;
  const s = W.scope('dawn-terrace', f), g = s.g;
  const X0 = -45, X1 = 45, ZR = -12.6, H = 12.6;
  const clip = [X0 - 0.5, -2, -14.2, X1 + 0.5, H + 1, 0.8];
  const r = new Rng(1450);
  const ST = '#c4b49a', STD = '#a3937a', OAK = '#8a6240';

  // ---- the shelf: floor, slab, the broad rail, the piers that end it
  floor(s, X0, ZR, X1, 0, 0, 'stone', ST);
  runX(X0 + 0.8, X1 - 0.8, 8, (a, b) => { g.mat('stone', STD); g.box(a, 0, ZR, b, 0.006, ZR + 0.5, { faces: 'Y' }); g.box(a, 0, -1.2, b, 0.006, -0.9, { faces: 'Y' }); });
  s.flush({ tier: 's', cast: false });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#b9a98e', bronze: '#5a4a33', oak: OAK });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1 }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1 });

  // ---- the riser behind: the oldest people's flats with windows on the Hollow
  const DOORS = [-36, -19.5, -3, 13.5, 30];
  const fac = facade(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#dcc9a8', stone: '#b4a48a', trim: '#2f5d5a', gaps: [[35.6, 42.4]], doors: DOORS, seed: 1, lit: 0.42 });
  const plates = ['Tier one · 3', 'Tier one · 7', 'Tier one · 11', 'Tier one · 15', 'Tier one · 19'];
  fac.doors.forEach((d, i) => {
    sign(s, { kind: 'plate', text: plates[i] || 'Tier one', sub: 'please knock' }, d.x + 0.95, 1.5, -0.17, { face: 'z' });
    lamp(s, 'sconce', d.x - 0.95, 2.45, -0.17, { face: 'z', K: 2600, power: 0.55, night: true, clip });
    prop(s, 'plant', d.x + 1.05, 0, -0.55, 0, { kind: i % 2 ? 'fern' : 'flower', size: 0.9, pot: ['#a3563a', '#2f6f73', '#c9a24a'][i % 3] });
    s.interact({ x: d.x, y: 1.2, z: -0.6, radius: 1.2, prompt: 'Knock', onUse: async (gm) => {
      sfx(gm, 'knock', f, d.x, 1.2, -0.2);
      const lines = [['Nobody comes. A card in the fanlight says: Gone down to the lake. Back for the dawn.'], ['A voice through the door, unhurried: We are not buying anything, and we have eaten, thank you.'], ['Somebody inside is playing a long heliox flute, very slowly, and does not stop.'], ['The door opens a hand. An old man looks at you, then at the Hollow behind you, and says it is a good morning for it. Then he shuts the door.'], ['A note pinned at eye height: One hundred and nine today. No visitors till after the dawn.']];
      await say(gm, 'The door', lines[i % lines.length]);
    } });
  });
  // planters and benches along the wall between the doors
  for (const x of [-41, -28.5, -11.2, 5.2, 21.6]) planter(s, x, 0, -0.7, { w: 1.8, d: 0.55, h: 0.55, plants: x > 0 ? 'flower' : 'broad', tint: '#a89a84' });
  const wallBench = [[-24.5], [-8.2], [8.6]];
  for (const b of wallBench) { prop(s, 'wall.bench', b[0], 0, -0.8, PI, { w: 2.4, wood: '#7a5233' }); seat(s, b[0], 0, -0.95, PI, 'Sit by the wall'); }
  for (const x of [-30.5, 17]) prop(s, 'wall.urn', x, 0, -1.0, 0, { h: 0.9, kind: 'flower' });
  // a poster for the dawn and the tier plate at the rail
  sign(s, SIGNS['poster.dawn'], 34.1, 1.6, -0.27, { face: 'z' });
  sign(s, SIGNS['poster.flight'], 43.2, 1.6, -0.27, { face: 'z' });
  const tierPlate = { kind: 'plate', text: 'TIER ONE · 0.48 g', sub: 'fifty metres above the floor · twenty-nine to go' };
  sign(s, tierPlate, 0, 0.82, ZR + 0.005, { face: 'Z', w: 0.5, h: 0.2 });
  s.interact({ x: 0, y: 1.0, z: ZR + 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => {
    await say(gm, 'Tier one', ['A brass plate on the parapet: tier one, 0.48 g, fifty metres above the floor, twenty-nine to go.', 'Every tier up the wall is another fifty metres nearer the axis, and you weigh a little less on each. The Third is tier ten. The Twentieth, tier twenty-seven, is at a twentieth of a g.']);
    find(gm, 'terraces-lighter');
  } });

  // an orientation table at the rail: a bronze disc on a stone post, with the Hollow engraved on it
  { const TX = 8.5, TZ = ZR + 0.75;
    g.mat('stone', '#a89a84'); g.lathe(TX, TZ, [[0.3, 0], [0.28, 0.08], [0.18, 0.14], [0.15, 0.8], [0.22, 0.9], [0.34, 0.95]], { segs: 16 });
    s.flush({ tier: 's', cast: true }); s.post(TX, TZ, 0.34, 0, 1.0);
    s.detail(() => {
      g.mat('cast', '#9a7a42', { rough: -0.15 }); g.lathe(TX, TZ, [[0.36, 0.95], [0.37, 0.98], [0.34, 1.0], [0, 1.01]], { segs: 24, capBottom: false });
      g.mat('cast', '#5a4a2a'); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.box(TX + Math.sin(a) * 0.28 - 0.006, 1.0, TZ + Math.cos(a) * 0.28 - 0.006, TX + Math.sin(a) * 0.33 + 0.006, 1.012, TZ + Math.cos(a) * 0.33 + 0.006); }
      g.mat('glaze', '#2f6f73', { rough: -0.3 }); g.box(TX + 0.04, 1.005, TZ - 0.2, TX + 0.12, 1.013, TZ - 0.1);
      g.mat('cast', '#d6a640'); g.tube([[TX, 1.012, TZ], [TX, 1.012, TZ - 0.3]], 0.008, { segs: 4 });
    });
    s.interact({ x: TX, y: 1.1, z: TZ, radius: 1.1, prompt: 'Read the orientation table', onUse: async (gm) => {
      await say(gm, 'The orientation table', ['A bronze disc on a stone post, engraved with the Hollow as seen from here and rubbed bright where people point.', 'Straight ahead, 3.75 kilometres off, the front wall. The lake about two kilometres out, a little spinward, with its island. The festival green beside it.', 'The sunline stops 450 metres short of each wall, so the flying halls have room. Overhead, three kilometres up, the far bank. Engraved round the rim: whatever you can see, someone over there can see you.']);
    } });
  }
  // lean on the rail and look
  for (const lx of [-14, 30]) s.interact({ x: lx, y: 1.2, z: ZR + 0.35, radius: 1.4, prompt: 'Lean on the rail', onUse: async (gm) => {
    const h = gm.clock ? gm.clock.hours : 12, sun = gm.clock ? gm.clock.sun() : 1;
    const lines = sun < 0.05 ? (h >= 3 && h < 6 ? ['The line is still dark. Below, the orchards are a field of small lamps, and the lamps go on up the curve of the land on both sides and right over your head.', 'People are coming up the wall in ones and twos with lidded cups. Nobody talks much before a dawn.'] : ['The Hollow at night: small lamps scattered over the land, rising up the curve on both sides and meeting overhead, where a window on the far bank is looking back at you.'])
      : sun < 0.6 ? ['The light is coming. The far bank overhead catches it first, while the floor below you is still in shade. Fifty metres down, the tops of the back wood.']
      : ['The whole Hollow is in front of you: the land curving up on both sides and over your head, the lake shining a long way off, and the line down the middle, white and too bright to look at for long.', 'Fifty metres down, the back wood. You weigh a little less up here than down there, and your knees know it.'];
    await say(gm, 'The rail', lines);
  } });

  // ---- the stepped benches: three rows facing the Hollow, like a small theatre
  const TX0 = -24, TX1 = 16;
  block(s, TX0, 0, -8.9, TX1, 0.38, -5.7, 'stone', '#b8a88c');
  block(s, TX0, 0.38, -7.3, TX1, 0.76, -5.7, 'stone', '#bfaf93');
  // the back planter closing the top row, with gaps for the aisles' steps
  const AISLES = [-10.5, 3];
  const segs = [[TX0, AISLES[0] - 0.7], [AISLES[0] + 0.7, AISLES[1] - 0.7], [AISLES[1] + 0.7, TX1]];
  for (const sg of segs) {
    block(s, sg[0], 0, -5.7, sg[1], 1.22, -5.1, 'stone', '#a89a84', { bevel: 0.02 });
    planter(s, (sg[0] + sg[1]) / 2, 1.22, -5.4, { w: sg[1] - sg[0] - 0.1, d: 0.5, h: 0.04, plants: 'herbs', tint: '#a89a84', density: 9 });
  }
  for (const ax of AISLES) stairs(s, ax, 0, -5.1, 'z', 0.76, 0.6, 1.4, { tint: '#bfaf93' });
  // step lights along the risers (no light of their own: just a glow to find your feet by)
  runX(TX0 + 0.2, TX1 - 0.2, 4, (a, b) => { g.mat('diffuser', '#ffcf8a', { emissive: 2.2, night: true }); g.box(a, 0.24, -8.92, b, 0.27, -8.9, { faces: 'z' }); g.box(a, 0.62, -7.32, b, 0.65, -7.3, { faces: 'z' }); });
  s.flush({ tier: 'd', cast: false });
  const benchRows = [[-9.65, 0], [-8.05, 0.38], [-6.45, 0.76]];
  const CUSH = ['#5b4060', '#d98a3a', '#b8584a', '#2f6f73', '#d6a640', '#7a2f3c'];
  benchRows.forEach((row, ri) => {
    for (const sg of segs) {
      const n = 3, w = (sg[1] - sg[0] - 0.3) / n;
      for (let i = 0; i < n; i++) {
        const cx = sg[0] + 0.15 + w * (i + 0.5);
        prop(s, 'wall.bench', cx, row[1], row[0], PI, { w: w - 0.2, wood: OAK });
        // cushions, mismatched
        s.detail(() => { for (let k = 0; k < 3; k++) { if (r.chance(0.35)) continue; const x = cx - w / 2 + 0.5 + k * (w - 1) / 2; g.mat(r.chance(0.5) ? 'knit' : 'motif', CUSH[r.i(0, CUSH.length - 1)]); g.box(x - 0.24, row[1] + 0.44, row[0] - 0.2, x + 0.24, row[1] + 0.5, row[0] + 0.18, { bevel: 0.025 }); } });
        seat(s, cx, row[1], row[0] - 0.05, PI, ri === 0 ? 'Sit and watch' : 'Sit up here', { radius: 1.3, onSit: ri === 0 ? waitForDawn : null });
      }
    }
  });
  // blankets folded on the end of a few benches, cups left behind
  s.detail(() => {
    for (const p of [[-23.4, -9.65, 0], [2.1, -8.05, 0.38], [15.1, -6.45, 0.76], [-11.4, -9.65, 0]]) { g.mat('knit', CUSH[r.i(0, 5)]); g.box(p[0] - 0.22, p[2] + 0.44, p[1] - 0.18, p[0] + 0.22, p[2] + 0.56, p[1] + 0.16, { bevel: 0.03 }); }
  });
  for (const p of [[-16.2, -9.55, 0], [7.9, -7.95, 0.38], [-4.1, -6.4, 0.76]]) prop(s, 'cup', p[0], p[2] + 0.44, p[1], 0, { glaze: '#e9e1cf' });

  // ---- the Dawn Stand: the cart, its keeper's post, a queue lane, standing tables, its board
  const CX = 23, CZ = -4.2;
  prop(s, 'wall.cart', CX, 0, CZ, PI, { body: '#5b4060', trim: '#d6a640' });
  // crates and a water can behind the cart, the keeper's stool
  prop(s, 'crate', CX + 0.4, 0, -2.2, 0.15, { w: 0.6, h: 0.4, d: 0.4 }); prop(s, 'crate', CX + 0.45, 0.4, -2.25, -0.1, { w: 0.5, h: 0.32, d: 0.36, wood: '#9a7a4e' });
  prop(s, 'stool', CX - 1.1, 0, -2.6, 0, { h: 0.62 });
  prop(s, 'crock', CX + 1.3, 0, -2.4, 0, { glaze: '#2f6f73', h: 0.42, r: 0.15 });
  // a bracket on the cart's post with the stand's hanging sign
  g.mat('cast', '#3a3430'); g.tube([[CX + 1.06, 2.35, CZ + 0.44], [CX + 1.75, 2.35, CZ + 0.44]], 0.015, { segs: 5 }); for (const dx of [1.32, 1.68]) g.tube([[CX + dx, 2.35, CZ + 0.44], [CX + dx, 2.06, CZ + 0.44]], 0.004, { segs: 3 }); s.flush({ tier: 'd' });
  sign(s, SIGNS['dawn-terrace.hanging'], CX + 1.5, 1.78, CZ + 0.44, { face: 'z', double: true, w: 0.56, h: 0.56 });
  lamp(s, 'lantern', CX - 0.5, 1.78, CZ - 0.55, { tint: '#f2b56b', drop: 0.22, power: 0.7, clip, night: true, lampFlag: false });
  lamp(s, 'bulb', CX + 0.4, 1.9, CZ - 0.4, { K: 2500, power: 0.6, range: 5, clip, lampFlag: false, night: true });
  // the queue lane: a rope rail each side, leading back spinward
  ropeRail(s, [[CX + 1.6, -5.35], [CX + 3.6, -5.35], [CX + 5.6, -5.35], [CX + 7.2, -5.35]]);
  ropeRail(s, [[CX - 0.6, -6.9], [CX + 1.6, -6.9], [CX + 3.6, -6.9], [CX + 5.6, -6.9], [CX + 7.2, -6.9]]);
  s.spot('counter', CX, 0, CZ + 1.2, PI, { who: 'marisol', tags: ['coffee', 'keeper'] });
  s.spot('work', CX + 0.6, 0, CZ + 1.5, PI * 0.8, { tags: ['coffee'] });
  s.spot('queue', CX, 0, CZ - 1.45, 0, { tags: ['coffee'] });
  for (let i = 0; i < 6; i++) s.spot('queue', CX + 1.3 + i * 1.0, 0, -6.12, -PI / 2, { tags: ['coffee'] });
  // the day's board on an easel beside the lane
  const easel = (ds) => { const gg = ds.g; gg.mat('wood', '#6b4a2f'); gg.tube([[CX - 1.9, 0, -5.75], [CX - 1.9, 1.55, -5.95]], 0.018, { segs: 5 }); gg.tube([[CX - 2.45, 0, -5.75], [CX - 2.45, 1.55, -5.95]], 0.018, { segs: 5 }); gg.tube([[CX - 2.17, 0, -6.4], [CX - 2.17, 1.5, -5.98]], 0.016, { segs: 5 }); ds.flush({ tier: 'd' }); };
  daySigns(game, W, f, 'dawn-chalk', [1, 2, 3].map((d) => ({ day: d, spec: SIGNS['dawn-terrace.chalk.' + d], x: CX - 2.17, y: 1.08, z: -6.0, o: { face: 'z', w: 0.62, h: 0.9 }, draw: null })));
  // the easel itself stays whatever the day
  { const es = W.scope('dawn-easel', f); easel(es); es.finish(); }
  s.solid(CX - 2.5, 0, -6.1, CX - 1.85, 1.5, -5.7);
  s.interact({ x: CX - 2.17, y: 1.1, z: -6.4, radius: 1.2, prompt: 'Read the board', onUse: async (gm) => {
    const d = Math.max(1, Math.min(3, gm.clock ? gm.clock.day : 1)); const sp = SIGNS['dawn-terrace.chalk.' + d];
    await readSpec(gm, sp, d === 3 ? 'Under it, smaller: ask whose dawn it is.' : 'Under it, in smaller chalk: ask whose dawn it is. The painter is often in the queue.');
    find(gm, 'whose-dawn');
  } });
  s.interact({ x: CX, y: 1.1, z: CZ - 1.3, radius: 1.5, prompt: (gm) => { const h = gm.clock ? gm.clock.hours : 12; return h >= 5 && h < 11 ? 'Buy a coffee' : 'Look at the Dawn Stand'; }, onUse: async (gm) => {
    const c = CAST.marisol; const h = gm.clock ? gm.clock.hours : 12;
    if (h < 5 || h >= 11) { await say(gm, c, h >= 11 && h < 22 ? ['Shut till tomorrow. I put the boiler on at half four, and by eleven nobody is looking up at the far bank any more.', 'Come back early. Ask me whose dawn it is.'] : ['Not yet. The boiler takes half an hour, and the queue will be here before it is hot.']); return; }
    const it = await buy(gm, MENUS['dawn-stand'], c.name);
    if (it) {
      sfx(gm, it.id === 'cake' ? 'plate' : 'pour', f, CX, 1.0, CZ);
      if (it.id === 'cake' && gm.inv && gm.inv.give) gm.inv.give('steamed-cake');
      const d = gm.clock ? gm.clock.day : 1;
      await say(gm, c, it.id === 'cake' ? ['Tear it, do not cut it. It is still breathing.'] : d === 3 ? ['Keep the lid on till it starts. It is Oona\'s this morning. She was in the queue at five, and she paid.'] : ['Lid on. In this air it is cold before the far bank is pink.']);
    }
  } });
  // standing tables and the dawn in the paving
  for (const p of [[17.6, -10.2], [28.2, -9.6], [35.4, -10.4]]) {
    prop(s, 'table', p[0], 0, p[1], 0, { round: true, w: 0.7, h: 1.05, wood: '#4a3a2a', top: '#7a5233' });
    prop(s, 'cup', p[0] + 0.12, 1.05, p[1] - 0.05, 0, { glaze: '#c9763e' }); prop(s, 'cup', p[0] - 0.1, 1.05, p[1] + 0.08, 0, { glaze: '#e9e1cf' });
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4; s.spot('chat', p[0] + Math.sin(a) * 0.75, 0, p[1] + Math.cos(a) * 0.75, a + PI, { tags: ['watch', 'coffee'] }); }
  }
  s.structure(() => {
    const RINGS = [[2.2, '#4a3a52'], [1.8, '#6a4a6a'], [1.4, '#b86a72'], [1.0, '#d98a7a'], [0.6, '#e8b45a'], [0.25, '#f2d27a']];
    for (const rg of RINGS) { g.mat('mosaic', rg[1]); g.lathe(30.8, -6.6 - 3.6, [[rg[0], 0.004], [0, 0.0045]], { segs: 32, capTop: false, capBottom: false }); }
    g.mat('cast', '#b08a45'); const ring = []; for (let i = 0; i < 40; i++) { const a = i / 40 * PI * 2; ring.push([30.8 + Math.cos(a) * 2.24, 0.006, -10.2 + Math.sin(a) * 2.24]); } g.tube(ring, 0.02, { segs: 4, closed: true });
  });

  // ---- the elders' corner: deep chairs under a vine trellis, rugs, gin on a small table, a brass plate
  const EX0 = -43.6, EX1 = -27.5;
  planter(s, -26.4, 0, -7.6, { w: 0.6, d: 4.6, h: 0.9, plants: 'broad', tint: '#a89a84', density: 10 });
  sign(s, SIGNS['elders-terrace.plate'], -26.08, 0.72, -7.6, { face: 'X' });
  for (const p of [[EX0 + 1.2, -10.6], [EX1 - 0.8, -10.6], [EX0 + 1.2, -4.2], [EX1 - 0.8, -4.2]]) { g.mat('wood', '#5a4030'); g.box(p[0] - 0.08, 0, p[1] - 0.08, p[0] + 0.08, 2.9, p[1] + 0.08, { bevel: 0.01 }); g.mat('stone', '#a89a84'); g.box(p[0] - 0.16, 0, p[1] - 0.16, p[0] + 0.16, 0.25, p[1] + 0.16, { bevel: 0.015 }); s.post(p[0], p[1], 0.12, 0, 2.9); }
  s.flush({ tier: 's', cast: true });
  g.mat('wood', '#5a4030');
  for (const z of [-10.6, -4.2]) g.tube(lineX(EX0 + 1.0, EX1 - 0.6, 2.9, z, 2), 0.07, { segs: 6 });
  for (let x = EX0 + 1.2; x <= EX1 - 0.7; x += 0.9) g.box(x - 0.035, 2.97, -10.8, x + 0.035, 3.07, -4.0);
  s.flush({ tier: 's', cast: true });
  s.detail(() => {
    for (let x = EX0 + 1.3; x < EX1 - 0.6; x += 0.7) for (let z = -10.4; z < -4.3; z += 0.9) { g.mat(r.chance(0.2) ? 'blossom' : 'leafA', '#ffffff', { sway: 0.4 }); g.card(x + r.f(-0.2, 0.2), 3.0, z + r.f(-0.3, 0.3), 0.8, 0.5, r.f(0, 3), { tilt: r.f(0.9, 1.4) }); if (r.chance(0.25)) { g.mat('leafB', '#ffffff', { sway: 0.7 }); g.card(x, 2.1, z, 0.4, 0.85, r.f(0, 3), { tilt: 0.05 }); } }
  });
  for (const lx of [-39.8, -32.6]) lamp(s, 'lantern', lx, 2.35, -7.6, { tint: lx < -35 ? '#d98a5a' : '#c9763e', drop: 0.55, power: 0.75, clip, night: true, lampFlag: false });
  prop(s, 'rug', -35.8, 0, -8.2, 0, { w: 8.6, d: 3.4, a: '#5b4060', b: '#d6a640' });
  prop(s, 'rug', -35.6, 0, -5.6, 0.05, { w: 3.2, d: 1.8, a: '#7a2f3c', b: '#e2c48a', mat: 'carpet' });
  const CH = [[-40.2, -8.6, PI + 0.22, '#7a2f3c', '#d6a640'], [-38.3, -8.85, PI + 0.1, '#2f5d5a', null], [-36.2, -8.95, PI, '#5b4060', '#e2c48a'], [-34.1, -8.85, PI - 0.1, '#8a5a2a', '#2f6f73'], [-32.1, -8.6, PI - 0.22, '#3a4a6a', null], [-37.6, -5.8, PI - 0.4, '#6b3a3a', '#c9763e'], [-33.6, -5.9, PI + 0.35, '#4a5a3a', null]];
  CH.forEach((c, i) => {
    prop(s, 'wall.armchair', c[0], 0, c[1], c[2], { cloth: c[3], throw: c[4] || undefined }, { noSpots: true });
    s.spot('sit', c[0] + Math.sin(c[2]) * 0.08, 0.46, c[1] + Math.cos(c[2]) * 0.08, c[2], i === 2 ? { who: 'oona', tags: ['night', 'elders', 'watch'] } : { tags: ['elders', 'watch', i > 4 ? 'chat' : 'night'] });
    seat(s, c[0], 0, c[1], c[2], i === 2 ? 'Sit in the middle chair' : 'Sit in a deep chair', { eye: 1.05, radius: 0.9, onSit: eldersSit });
  });
  // the gin table: a lidded bottle, lidded glasses, a dish of something under a cover
  prop(s, 'table', -36.2, 0, -10.0, 0, { round: true, w: 0.66, h: 0.52, wood: '#4a3020' });
  s.detail(() => {
    g.mat('glaze', '#d8e6dc', { rough: -0.4 }); g.lathe(-36.32, -10.05, [[0, 0.52], [0.045, 0.52], [0.048, 0.7], [0.03, 0.75], [0.016, 0.79], [0.016, 0.83], [0, 0.83]], { segs: 12 });
    g.mat('cast', '#b08a45'); g.cyl(-36.32, 0.82, -10.05, 0.02, 0.025, { segs: 8 });
    g.mat('paper', '#efe6d2'); g.box(-36.37, 0.6, -10.098, -36.27, 0.66, -10.09);
    for (const p of [[-36.1, -9.92], [-36.0, -10.12], [-36.25, -9.86]]) { g.mat('glaze', '#e2ece6', { rough: -0.35 }); g.lathe(p[0], p[1], [[0, 0.52], [0.026, 0.52], [0.03, 0.6], [0, 0.6]], { segs: 10 }); g.mat('cast', '#b08a45'); g.lathe(p[0], p[1], [[0.032, 0.6], [0.028, 0.607], [0.006, 0.612], [0.006, 0.622], [0, 0.623]], { segs: 10, capBottom: false }); }
  });
  prop(s, 'bowl', -36.45, 0.52, -9.9, 0, { glaze: '#2f6f73', lid: '#d6a640', r: 0.07 });
  for (const p of [[-38.9, -9.9], [-33.4, -9.8]]) prop(s, 'stool', p[0], 0, p[1], 0, { h: 0.36, wood: '#5a4030' });
  // a side table with a lamp, and a basket of blankets
  prop(s, 'table', -35.6, 0, -5.2, 0, { round: true, w: 0.5, h: 0.6, wood: '#4a3020' });
  s.detail(() => { g.mat('cast', '#3a3430'); g.cyl(-35.6, 0.6, -5.2, 0.07, 0.02, { segs: 10 }); g.tube([[-35.6, 0.62, -5.2], [-35.6, 0.95, -5.2]], 0.01, { segs: 5 }); g.mat('weave', '#e8c890', { emissive: 1.6, lamp: true }); g.lathe(-35.6, -5.2, [[0.16, 0.9], [0.1, 1.1]], { segs: 12, capTop: false, capBottom: false }); });
  lamp(s, 'bulb', -35.6, 1.0, -5.2, { K: 2400, power: 0.35, range: 3.5, clip, night: true, lampFlag: false });
  s.detail(() => { g.mat('cane', '#b8955a'); g.lathe(-42.2, -6.6, [[0.25, 0], [0.3, 0.1], [0.32, 0.4], [0.3, 0.42]], { segs: 14, capTop: false }); for (let k = 0; k < 3; k++) { g.mat('knit', CUSH[(k * 2 + 1) % 6]); g.box(-42.42 + k * 0.05, 0.3 + k * 0.08, -6.82, -41.98 + k * 0.05, 0.38 + k * 0.08, -6.38, { bevel: 0.03 }); } });
  s.post(-42.2, -6.6, 0.3, 0, 0.5);
  s.interact({ x: -36.2, y: 0.8, z: -10.2, radius: 1.0, prompt: 'Look at the gin table', onUse: async (gm) => {
    const late = gm.clock && ((gm.clock.day === 3 && gm.clock.hours >= 21) || (gm.clock.day >= 4 && gm.clock.hours < 6));
    await say(gm, "The elders' terrace", late ? ['A lidded bottle of Chervil gin, the hall\'s thiamine label on it, and a ring of lidded glasses. Somebody carried all of it up from below, since the halls are the only place it is sold.', 'Nobody minds where it is drunk. Tonight, it is drunk here.'] : ['A bottle of Chervil gin with a brass stopper, a third full, and three lidded glasses waiting. Gin is sold only in the halls after six. These came up the wall.']);
    if (late) find(gm, 'gin-anywhere');
  } });
  s.trigger({ box: [EX0, -0.5, ZR, EX1 + 1.5, 3, -2], onEnter(gm) { const late = gm.clock && ((gm.clock.day === 3 && gm.clock.hours >= 21) || (gm.clock.day >= 4 && gm.clock.hours < 6)); if (late && !gm.flags['wall.ginseen']) { gm.flags['wall.ginseen'] = true; toast(gm, 'The elders\' terrace is full of lidded glasses carried up from below.'); find(gm, 'gin-anywhere'); } } });

  // ---- the lift lobby
  cabLobby(game, s, f, { x0: 35.8, x1: 42.2, d: 3.6, clip, id: 'dawn-terrace', name: 'The back terraces', sub: 'tier one: the Dawn Stand', sign: { kind: 'street', text: 'CABS · TIER ONE', sub: 'the back terraces' } });

  // ---- lamps for the dark hours: low bollards along the rail that light the floor, not the view
  for (let x = -40; x <= 40; x += 8) {
    prop(s, 'wall.bollard', x, 0, ZR + 0.4, 0, {});
    s.light({ at: [x, 0.66, ZR + 0.55], K: 2400, color: [1.0, 0.62, 0.32], power: 0.9, range: 4.2, night: true, clip, radius: 0.08 });
  }

  // ---- people: the rail, the queue, the benches (from the props), walkways
  for (let x = -22; x <= 34; x += 2.2) if (Math.abs(x) > 0.8) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZR + 0.55, PI, { tags: ['watch', 'rail'] });
  for (const p of [[-17, -2.4], [-15.9, -2.9], [-16.6, -3.4], [9.4, -2.8], [10.4, -2.3], [10.2, -3.4]]) s.spot('chat', p[0], 0, p[1], r.f(0, 6.28), { tags: ['watch', 'morning'] });
  s.path([[40, -5.2], [30, -4.6], [16, -3.6], [3, -3.6], [-10.5, -3.6], [-24, -3.6], [-30, -2.8], [-41, -2.6]]);
  s.path([[-41, -11.6], [-30, -11.4], [-20, -11.0], [0, -11.0], [20, -11.4], [30, -11.6], [41, -11.6]]);
  s.path([[40, -5.2], [41, -8], [41, -11.6]]); s.path([[-41, -2.6], [-42, -7], [-41, -11.6]]);
  s.path([[3, -3.6], [3, -6.2], [3, -9.0], [0, -11.0]]); s.path([[-10.5, -3.6], [-10.5, -6.2], [-10.5, -9.0], [-20, -11.0]]);
  s.path([[16, -3.6], [17, -7.5], [20, -11.4]]); s.path([[30, -4.6], [30.8, -7.6], [30, -11.6]]);
  s.path([[-30, -2.8], [-34, -7.3], [-30, -11.4]]);

  // ---- the dawn itself: Oona's, on Booking Day, from this terrace
  let goldSeen = false;
  game.events.on('update', () => {
    if (goldSeen || game.player.frame !== f || !game.clock || game.clock.day !== 3) return;
    const h = game.clock.hours; if (h < 6.45 || h > 7.3) return;
    goldSeen = true; toast(game, 'The far bank is gold. Down here the near side is still dark.', 'found'); find(game, 'gold-far-bank');
  });

  // ---- zones, sound, spawn
  s.zoneBox(Object.assign({ id: 'dawn-terrace', place: 'dawn-terrace', box: [X0, -2, ZR - 1.5, X1, H + 2, 0.6], name: 'The back terraces', sub: 'Tier one · the Dawn Stand', ambience: 'terrace', headroom: 30, env: ENV }, SKY));
  s.zoneBox(Object.assign({ id: 'elders-terrace', place: 'elders-terrace', box: [X0, -1, ZR, EX1 + 1.4, 4, -2], name: "The elders' terrace", sub: 'Tier one · by custom', ambience: 'terrace', headroom: 3, env: ENV }, SKY));
  soundOnce(game, ['dawn-terrace', 'elders-terrace'], () => {
    game.loopAt('murmur', f, -4, 1.2, -7.5, { vol: 0.32, radius: 22, param: 0.35 });
    game.loopAt('steam', f, CX - 0.55, 1.4, CZ + 0.1, { vol: 0.18, radius: 4 });
  });
  s.finish();
  game.spawns['dawn-terrace'] = { frame: f, x: 32.5, y: 0, z: -8.8, yaw: -0.75 };
  game.spawns['elders-terrace'] = { frame: f, x: -30.5, y: 0, z: -11.2, yaw: -1.2 };
}

// Sleeves and a lamp, the same way Bertil's own conversations give them.
function giveSleeves(gm) {
  gm.flags.has_sleeves = true;
  if (gm.inv) { if (!gm.inv.has('wing-sleeves')) gm.inv.give('wing-sleeves'); if (!gm.inv.has('peg-token')) gm.inv.give('peg-token'); }
  find(gm, 'shoes-deposit');
}
function hasLamp(gm) { return !!(gm.inv && gm.inv.has('hand-lamp')); }
function giveLamp(gm) { if (gm.inv && !gm.inv.has('hand-lamp')) gm.inv.give('hand-lamp'); }

// Sitting on a front bench in the small hours: offer to wait for the dawn.
async function waitForDawn(gm) {
  if (!gm.ui || !gm.clock || !gm.ui.pickHour) return;
  const h = gm.clock.hours; if (h < 1.5 || h >= 5.9) return;
  gm.busy++;
  try { const to = await gm.ui.pickHour({ title: 'Wait here for the dawn', from: h, to: 6.25, now: h }); if (to && to > h) gm.clock.skipTo(to); } finally { gm.busy--; }
}
// Sitting in the elders' corner.
async function eldersSit(gm) {
  if (gm.flags['wall.elderseat']) return; gm.flags['wall.elderseat'] = true;
  toast(gm, 'Nobody asks you to move. By custom you were meant to ask first.');
}

// ===============================================================================================================
// 2. The Third: tier ten, a third of a g
// ===============================================================================================================
function buildThird(game, W) {
  const f = W.frame('terrace10', 1000, 0, 3750); f.hollowView = true;
  const s = W.scope('third-terrace', f), g = s.g;
  const X0 = -30, X1 = 30, ZR = -14.8, H = 12.6;
  const clip = [X0 - 0.5, -2, -16.2, X1 + 0.5, H + 1, 0.8];
  const r = new Rng(1000);
  const ST = '#c9bba2';

  // ---- the shelf, rail and piers
  floor(s, X0, ZR, X1, 0, 0, 'stone', ST);
  runX(X0 + 0.8, X1 - 0.8, 8, (a, b) => { g.mat('stone', '#a3937a'); g.box(a, 0, ZR, b, 0.006, ZR + 0.5, { faces: 'Y' }); });
  s.flush({ tier: 's', cast: false });
  broadRail(s, { x0: X0 + 0.8, x1: X1 - 0.8, zr: ZR, stone: '#bdae94', bronze: '#5a4a33', oak: '#8a6240', barrier: 5.3 });
  endPier(s, X0, X0 + 0.8, ZR, H, { inner: 1, tint: '#d8c6b2' }); endPier(s, X1 - 0.8, X1, ZR, H, { inner: -1, tint: '#d8c6b2' });
  // the high net: bronze masts on the parapet, rope mesh from the rail to five metres
  const ZN = ZR - 0.2;
  for (let x = X0 + 1.2; x <= X1 - 1.1; x += 5.8) { g.mat('cast', '#5a4a33'); g.lathe(x, ZN, [[0.07, 0.62], [0.05, 0.75], [0.04, 5.3], [0.06, 5.36], [0.03, 5.5], [0, 5.55]], { segs: 8 }); }
  s.flush({ tier: 's' });
  netX(s, { x0: X0 + 0.8, x1: X1 - 0.8, z: ZN, y0: 1.12, y1: 5.2, cell: 0.42, tint: '#e2d6b8' });

  // ---- the facade
  const fac = facade(s, { x0: X0 + 0.8, x1: X1 - 0.8, h: H, tint: '#d8c6b2', stone: '#b4a48a', trim: '#7a2a5a', gaps: [[-6.2, 6.2], [20.2, 27.6]], doors: [-25, -8.5, 13.5], seed: 10, lit: 0.45 });
  fac.doors.forEach((d, i) => {
    sign(s, { kind: 'plate', text: 'Tier ten · ' + (i * 4 + 2), sub: 'mind the step' }, d.x + 0.95, 1.5, -0.17, { face: 'z' });
    lamp(s, 'sconce', d.x - 0.95, 2.45, -0.17, { face: 'z', K: 2600, power: 0.55, night: true, clip });
  });
  sign(s, SIGNS['third-terrace.notice'], -11.4, 1.6, -0.27, { face: 'z', w: 0.42, h: 0.58 });
  sign(s, SIGNS['poster.reels'], -12.4, 1.6, -0.27, { face: 'z' });
  sign(s, SIGNS['poster.dawn'], 8.6, 1.6, -0.27, { face: 'z' });
  s.interact({ x: -11.6, y: 1.3, z: -0.7, radius: 1.3, prompt: 'Read the notice', onUse: (gm) => readSpec(gm, SIGNS['third-terrace.notice']) });
  const tierPlate = { kind: 'plate', text: 'TIER TEN · THE THIRD', sub: 'five hundred metres up · a third of a g' };
  sign(s, tierPlate, -2, 0.82, ZR + 0.005, { face: 'Z', w: 0.5, h: 0.2 });
  s.interact({ x: -2, y: 1.0, z: ZR + 0.5, radius: 1.3, prompt: 'Read the tier plate', onUse: async (gm) => { await say(gm, 'Tier ten', ['Tier ten, the Third: five hundred metres above the floor and a third of your weight. The floor down there is a field of trees the size of moss.', 'Leap here and you go three times as high as at home, and land a little spinward.']); find(gm, 'terraces-lighter'); } });

  // ---- the band shell and its stage
  const SR = 5.2, SC = -SR;
  { const poly = []; for (let i = 16; i >= 0; i--) { const t = PI * i / 16; poly.push([SR * Math.cos(t), SC + SR * Math.sin(t)]); } poly.reverse(); g.mat('planks', '#a8703e'); g.prism(poly, 0, 0.5); }
  g.mat('wood', '#5a3a22'); g.box(-SR + 0.3, 0, SC - 0.65, SR - 0.3, 0.25, SC, { faces: 'xXzY', aoBottom: 0.7 });
  s.flush({ tier: 's', cast: true });
  s.solid(-SR, 0, SC, SR, 0.5, 0); s.solid(-SR + 0.3, 0, SC - 0.65, SR - 0.3, 0.25, SC);
  quarterSphere(s, 0, 0.5, SC, SR, '#6a2a52', '#b4a48a');
  sign(s, { kind: 'letters', text: 'THE THIRD', palette: ['#d6a640', '#d6a640'] }, 0, 0.5 + SR + 0.55, SC + 0.05, { face: 'z', w: 2.6, h: 0.42 });
  // the band: chairs, a drum, a long flute on its stand, music stands
  for (const p of [[-2.6, -2.0, 0.5], [-0.9, -1.4, 0.1], [0.9, -1.4, -0.1], [2.6, -2.0, -0.5]]) { prop(s, 'chair', p[0], 0.5, p[1], PI + p[2], { wood: '#4a3020', back: 'slat' }, { noSpots: true }); s.spot('perform', p[0], 0.5, p[1] - 0.05, PI + p[2], { tags: ['band', 'reel'] }); }
  s.spot('perform', 0, 0.5, -3.2, PI, { tags: ['band', 'reel', 'caller'] });
  s.detail(() => {
    g.mat('wood', '#8a5a2a'); g.lathe(1.7, -3.0, [[0.24, 0.5], [0.26, 0.55], [0.26, 0.85], [0.24, 0.9]], { segs: 16 }); g.mat('leather', '#e8dcc0'); g.cyl(1.7, 0.9, -3.0, 0.245, 0.01, { segs: 16 });
    g.mat('wood', '#c9a46a'); g.tube([[-1.9, 0.62, -3.3], [-1.6, 1.82, -3.25]], 0.022, { segs: 6 }); g.mat('cast', '#3a3430'); g.tube([[-1.8, 0.5, -3.4], [-1.75, 1.1, -3.3]], 0.01, { segs: 4 });
    for (const p of [[-2.4, -2.8], [-0.6, -2.3], [0.8, -2.3], [2.4, -2.8]]) { g.mat('cast', '#2e2a26'); g.tube([[p[0], 0.5, p[1]], [p[0], 1.45, p[1]]], 0.01, { segs: 4 }); g.box(p[0] - 0.22, 1.4, p[1] - 0.02, p[0] + 0.22, 1.7, p[1] + 0.01); g.mat('paper', '#efe6d2'); g.box(p[0] - 0.2, 1.43, p[1] - 0.03, p[0] + 0.2, 1.68, p[1] - 0.02, { faces: 'z' }); }
  });
  for (const p of [[-3.2, 'X'], [3.2, 'x']]) s.light({ at: [p[0], 4.9, SC - 1.2], type: 'spot', dir: [-p[0] * 0.12, -0.35, 1], cone: [62, 30], K: 2700, color: [1, 0.72, 0.46], power: 7, range: 10, lamp: true, clip, shadow: true });
  lamp(s, 'bulb', 0, 3.6, -1.4, { K: 2500, power: 0.8, range: 6, clip });

  // ---- the sprung floor: honey boards on a low plinth, a dark border, a brass ring, the start stud
  const FX0 = -12, FX1 = 12, FZ0 = -13.2, FZ1 = -6.4, FY = 0.1, FC = [0, -9.8];
  block(s, FX0, 0, FZ0, FX1, FY, FZ1, 'wood', '#5a3a22', { faces: 'xXzZ', aoBottom: 0.6 });
  runX(FX0, FX1, 6, (a, b) => { g.mat('planks', '#c08a4e'); g.box(a, FY - 0.01, FZ0, b, FY, FZ1, { faces: 'Y' }); }); s.flush({ tier: 's', cast: false });
  runX(FX0, FX1, 4, (a, b) => { g.mat('wood', '#6a3e22'); g.box(a, FY, FZ0, b, FY + 0.004, FZ0 + 0.35, { faces: 'Y' }); g.box(a, FY, FZ1 - 0.35, b, FY + 0.004, FZ1, { faces: 'Y' }); g.mat('cast', '#b08a45'); g.box(a, 0, FZ0 - 0.03, b, FY + 0.004, FZ0, { faces: 'zY' }); g.box(a, 0, FZ1, b, FY + 0.004, FZ1 + 0.03, { faces: 'ZY' }); });
  for (const x of [FX0, FX1 - 0.35]) { g.mat('wood', '#6a3e22'); g.box(x, FY, FZ0 + 0.35, x + 0.35, FY + 0.004, FZ1 - 0.35, { faces: 'Y' }); }
  s.flush({ tier: 's', cast: false });
  s.detail(() => {
    g.mat('cast', '#c8a45a', { rough: -0.15 });
    for (const rr of [2.6, 2.75]) { const ring = []; for (let i = 0; i < 48; i++) { const a = i / 48 * PI * 2; ring.push([FC[0] + Math.cos(a) * rr, FY + 0.002, FC[1] + Math.sin(a) * rr]); } g.tube(ring, 0.014, { segs: 4, closed: true }); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.tube([[FC[0] + Math.cos(a) * 0.4, FY + 0.002, FC[1] + Math.sin(a) * 0.4], [FC[0] + Math.cos(a) * 2.6, FY + 0.002, FC[1] + Math.sin(a) * 2.6]], 0.01, { segs: 4 }); }
    g.cyl(-10.6, FY, FC[1], 0.075, 0.014, { segs: 14 }); g.mat('cast', '#8a6d3b'); g.cyl(-10.6, FY + 0.013, FC[1], 0.03, 0.004, { segs: 10 });
  });
  sign(s, { kind: 'label', text: 'START', sub: 'the Long Reel · spinward from here' }, -10.6, FY + 0.12, FC[1] + 0.5, { face: 'Z', w: 0.36, h: 0.12 });
  s.interact({ x: -10.6, y: 0.5, z: FC[1], radius: 1.0, prompt: 'Stand on the brass stud', onUse: async (gm) => {
    await say(gm, 'The brass stud', ['A brass stud in the boards, worn bright. Every reel here starts on it.', 'At a third of a g a leap goes three times as high, and the drum turns under you while you hang. A good leap lands about a hand\'s width spinward of where it left, so by the end of the night the reel has walked a long way round the floor.']);
    find(gm, 'reel-spinward');
  } });
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2, px = FC[0] + Math.cos(a) * 3.2, pz = FC[1] + Math.sin(a) * 2.6; s.spot('stand', px, FY, pz, Math.atan2(FC[0] - px, FC[1] - pz), { tags: ['reel', 'dance'] }); }
  for (let i = 0; i < 8; i++) s.spot('stand', -8.8 + i * 2.4, FY, -12.2, PI, { tags: ['reel', 'dance', 'line'] });

  // ---- tables at the spinward end, under lanterns
  const TCOL = ['#2f6f73', '#7a2a5a', '#c9763e', '#2f6f73', '#d6a640', '#5b4060'];
  const TABLES = [[15.8, -11.6], [21.4, -12.0], [26.6, -11.2], [15.6, -6.6], [21.0, -7.4], [26.2, -6.6]];
  TABLES.forEach((t, i) => {
    prop(s, 'table', t[0], 0, t[1], 0, { round: true, w: 0.95, wood: '#4a3020', top: TCOL[i] });
    const n = i % 2 ? 3 : 4;
    for (let k = 0; k < n; k++) { const a = k / n * PI * 2 + i * 0.4, cx = t[0] + Math.sin(a) * 0.78, cz = t[1] + Math.cos(a) * 0.78; prop(s, 'chair', cx, 0, cz, a + PI, { wood: ['#6b4a2f', '#4a3020', '#8a6240'][k % 3], back: k % 2 ? 'slat' : 'hoop' }); }
    prop(s, 'bowl', t[0] + 0.15, 0.74, t[1], 0, { glaze: ['#e9e1cf', '#c9763e', '#2f6f73'][i % 3] }); prop(s, 'cup', t[0] - 0.18, 0.74, t[1] + 0.12, 0, {}); prop(s, 'cup', t[0] - 0.05, 0.74, t[1] - 0.22, 0, { glaze: '#b8584a' });
    if (i % 2 === 0) { s.detail(() => { g.mat('cast', '#3a3430'); g.cyl(t[0], 0.74, t[1] + 0.25, 0.05, 0.02, { segs: 8 }); g.tube([[t[0], 0.76, t[1] + 0.25], [t[0], 1.0, t[1] + 0.25]], 0.008, { segs: 4 }); g.mat('weave', '#f0c880', { emissive: 1.8, lamp: true }); g.lathe(t[0], t[1] + 0.25, [[0.11, 0.95], [0.07, 1.1]], { segs: 10, capTop: false, capBottom: false }); }); s.light({ at: [t[0], 1.0, t[1] + 0.25], K: 2400, color: [1, 0.66, 0.38], power: 0.9, range: 3.5, lamp: true, clip, radius: 0.06 }); }
    seat(s, t[0] + Math.sin(i * 0.4 + PI) * 0.78, 0, t[1] + Math.cos(i * 0.4 + PI) * 0.78, i * 0.4, 'Sit at the table');
  });
  for (const p of [[-23.6, -3.2], [-16.6, -3.0]]) {
    prop(s, 'table', p[0], 0, p[1], 0, { w: 1.4, d: 0.75, wood: '#4a3020', top: '#7a2a5a' });
    for (const sz of [-1, 1]) for (const sx of [-0.35, 0.35]) prop(s, 'chair', p[0] + sx, 0, p[1] + sz * 0.6, sz > 0 ? PI : 0, { wood: '#6b4a2f' });
    prop(s, 'bowl', p[0], 0.74, p[1], 0, { glaze: '#d6a640', r: 0.1 });
  }
  // little groups standing at the floor's edges
  for (const c of [[-13.6, -10.6], [13.4, -9.0], [-13.2, -6.6], [8.6, -4.6]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.65, 0, c[1] + Math.cos(a) * 0.65, a + PI, { tags: ['reel', 'evening'] }); }
  for (const x of [-27.4, 18.8]) prop(s, 'wall.urn', x, 0, -1.0, 0, { h: 0.9, kind: x > 0 ? 'flower' : 'broad' });
  for (const x of [-18.6, 6.8]) planter(s, x, 0, -0.7, { w: 1.8, d: 0.55, h: 0.55, plants: 'flower', tint: '#a89a84' });

  // ---- the slow fountain: twelve glassy arcs that climb eight metres and land three spinward
  const BX0 = -26.6, BX1 = -14.8, BZ0 = -11.4, BZ1 = -7.0, BH = 0.45;
  g.mat('stone', '#b4a48a');
  g.box(BX0, 0, BZ0, BX1, BH, BZ0 + 0.3, { bevel: 0.03, aoBottom: 0.7 }); g.box(BX0, 0, BZ1 - 0.3, BX1, BH, BZ1, { bevel: 0.03, aoBottom: 0.7 });
  g.box(BX0, 0, BZ0 + 0.3, BX0 + 0.3, BH, BZ1 - 0.3, { bevel: 0.03 }); g.box(BX1 - 0.3, 0, BZ0 + 0.3, BX1, BH, BZ1 - 0.3, { bevel: 0.03 });
  g.mat('tile', '#2f6f73'); g.box(BX0 + 0.3, 0, BZ0 + 0.3, BX1 - 0.3, 0.05, BZ1 - 0.3, { faces: 'Y' });
  s.flush({ tier: 's', cast: true });
  g.mat('plain', '#3f8a90', { rough: -0.45 }); g.box(BX0 + 0.3, 0.32, BZ0 + 0.3, BX1 - 0.3, 0.33, BZ1 - 0.3, { faces: 'Y' }); s.flush({ tier: 's', cast: false });
  s.solid(BX0, 0, BZ0, BX1, BH, BZ1);
  const JET = '#c4ecf2';
  for (let i = 0; i < 12; i++) {
    const x0 = BX0 + 0.9 + (i % 6) * 1.2, z0 = (BZ0 + BZ1) / 2 + (i < 6 ? -0.75 : 0.75), hgt = 7.6 + 0.6 * ((i * 5) % 3) / 2, drift = 2.8 + 0.4 * ((i * 7) % 3) / 2;
    s.detail(() => {
      g.mat('cast', '#8a6d3b'); g.cyl(x0, 0.05, z0, 0.07, 0.32, { segs: 8, r1: 0.04 });
      const pts = [], rad = [];
      for (let k = 0; k <= 22; k++) { const t = k / 22; pts.push([x0 + drift * Math.pow(t, 1.7), 0.37 + hgt * (1 - (2 * t - 1) * (2 * t - 1)), z0 + 0.15 * Math.sin(t * PI) * (i < 6 ? -1 : 1)]); rad.push(0.04 + 0.03 * Math.sin(t * PI) + (t > 0.85 ? (t - 0.85) * 0.3 : 0)); }
      g.mat('plain', JET, { rough: -0.48, emissive: 0.32 }); g.tube(pts, rad.map((q) => q * 1.25), { segs: 7 });
      // the water that hangs: a loose cluster of drops near the top
      const R = new Rng(500 + i);
      for (let k = 0; k < 7; k++) { const t = R.f(0.38, 0.66); g.ball(x0 + drift * Math.pow(t, 1.7) + R.f(-0.2, 0.2), 0.37 + hgt * (1 - (2 * t - 1) * (2 * t - 1)) + R.f(-0.25, 0.3), z0 + R.f(-0.2, 0.2), 0.045, 0.05, 0.045, { segs: 6, rings: 4 }); }
      g.mat('plain', '#ffffff', { rough: -0.4 }); g.ball(x0 + drift, 0.36, z0, 0.22, 0.05, 0.22, { segs: 10, rings: 4, bottom: 0 });
    });
  }
  for (const x of [BX0 + 2.5, BX1 - 2.5]) s.light({ at: [x, 0.5, (BZ0 + BZ1) / 2], type: 'spot', dir: [0.15, 1, 0], cone: [40, 18], K: 4200, color: [0.75, 0.9, 1.0], power: 5, range: 11, night: true, clip });
  // the plate that explains the lean
  const fplate = { kind: 'notice', title: 'The slow fountain', lines: ['Each jet climbs eight metres,', 'hangs and comes down about', 'three metres spinward.', 'Rising toward the axis, the', 'water keeps the speed of the', 'floor it left, and that is faster', 'than the air it climbs into.', 'So it gets ahead.'] };
  g.mat('stone', '#a89a84'); g.box(-14.25, 0, -12.1, -13.85, 1.0, -11.7, { bevel: 0.02 }); g.box(-14.35, 1.0, -12.2, -13.75, 1.06, -11.6, { bevel: 0.01 }); s.flush({ tier: 's', cast: true }); s.solid(-14.35, 0, -12.2, -13.75, 1.06, -11.6);
  sign(s, fplate, -14.25 + 0.4 + 0.005, 1.35, -11.9, { face: 'X', w: 0.4, h: 0.56 });
  s.interact({ x: -13.6, y: 1.2, z: -11.9, radius: 1.2, prompt: 'Read the fountain plate', onUse: (gm) => readSpec(gm, fplate) });
  for (const p of [[-25, -12.2], [-20.8, -12.2], [-16.6, -12.2]]) { prop(s, 'wall.bench', p[0], 0, p[1], PI, { w: 2.6, wood: '#8a6240' }); seat(s, p[0], 0, p[1], PI, 'Sit by the fountain'); }

  // ---- lantern strings from the wall to the net masts, over the floor and the tables
  const lights = [];
  for (const x of [-10, -5, 0, 5, 10, 16.4, 22, 27.6]) {
    const top = x === 0 ? 7.6 : 6.8;
    const ls = lanternString(s, [x, top, -0.45], [x * 1.08, 5.2, ZN + 0.15], { n: 11, sag: 0.9, colors: x > 14 ? ['#f2b56b', '#e8743b', '#f0d070'] : ['#f2b56b', '#e8743b', '#f0d070', '#d95d7a', '#7aa8c8'] });
    lights.push(ls[3], ls[8]);
  }
  for (const L of lights) s.light({ at: [L[0], L[1], L[2]], K: 2500, color: [1, 0.7, 0.45], power: 1.4, range: 6.5, lamp: true, clip, radius: 0.1 });
  g.mat('cast', '#3a3430'); for (const x of [-10, -5, 0, 5, 10, 16.4, 22, 27.6]) { const top = x === 0 ? 7.6 : 6.8; g.tube([[x, top, -0.02], [x, top, -0.48]], 0.025, { segs: 5 }); } s.flush({ tier: 'd' });

  // ---- the lift lobby
  cabLobby(game, s, f, { x0: 21, x1: 27, d: 3.6, clip, id: 'third-terrace', name: 'The Third', sub: 'a third of a g: the reels', sign: { kind: 'street', text: 'CABS · TIER TEN', sub: 'the Third' } });

  // ---- people, walkways, zones, sound, spawn
  s.path([[24, -5.0], [14, -4.2], [8, -5.6], [0, -6.0], [-8, -5.6], [-14, -4.4], [-27, -4.4]]);
  s.path([[-27, -13.6], [-14, -13.8], [0, -13.8], [14, -13.8], [28, -13.6]]);
  s.path([[24, -5.0], [28, -9], [28, -13.6]]); s.path([[-27, -4.4], [-28, -9], [-27, -13.6]]);
  s.path([[0, -6.0], [0, -9.8], [0, -13.8]]); s.path([[-14, -4.4], [-13.2, -9.2], [-14, -13.8]]); s.path([[14, -4.2], [13.4, -9.0], [14, -13.8]]);
  s.zoneBox(Object.assign({ id: 'third-terrace', place: 'third-terrace', box: [X0, -2, ZR - 1.5, X1, H + 2, 0.6], name: 'The Third', sub: 'Tier ten · a third of a g', ambience: 'terrace', headroom: 30, env: ENV }, SKY));
  skyGlow(game, s, [X0 - 1, -2, ZR - 2, X1 + 1, H + 2, 0.8], 1.0);
  soundOnce(game, ['third-terrace'], () => {
    game.loopAt('fountain', f, (BX0 + BX1) / 2, 1.2, (BZ0 + BZ1) / 2, { vol: 0.45, radius: 14 });
    game.loopAt('murmur', f, 18, 1.2, -9, { vol: 0.25, radius: 18, param: 0.3 });
  });
  s.finish();
  game.spawns['third-terrace'] = { frame: f, x: 13.2, y: 0, z: -4.6, yaw: -0.85 };
}

// ===============================================================================================================
// 3. The flying hall's gate: the hub, 72 m from the axis, 2.4% of a g
// ===============================================================================================================
function buildHub(game, W) {
  const f = W.frame('hub', 72, 0, 3750); f.hollowView = true;
  const s = W.scope('flying-hall', f), g = s.g;
  const X0 = -19.6, X1 = 19.6, ZF = -9.0, CEIL = 5.0;
  const clip = [X0 - 0.4, -1, -10.4, X1 + 0.4, CEIL + 0.3, 0.6];
  const r = new Rng(72);
  const INDIGO = '#2a3268', DECK = '#a87a4c';

  // ---- deck, the take-off step, ceiling canopy, end nets
  floor(s, X0, ZF, X1, 0, 0, 'planks', DECK);
  runX(X0, X1, 4, (a, b) => { g.mat('deckplate', '#6a6a62'); g.box(a, 0, ZF, b, 0.008, ZF + 0.4, { faces: 'Y' }); g.mat('wood', '#5a3e26'); g.box(a, -0.6, ZF - 0.06, b, 0.0, ZF, { faces: 'zyY' }); g.box(a, -0.6, ZF, b, -0.58, 0, { faces: 'y' }); });
  s.flush({ tier: 's', cast: false });
  floor(s, -0.75, -10.0, 0.75, ZF, 0, 'planks', '#c08a4e');
  s.structure(() => { g.mat('paint', '#e8e0d0'); for (let z = -9.9; z < -9.05; z += 0.2) g.box(-0.75, 0, z, 0.75, 0.006, z + 0.08, { faces: 'Y' }); g.mat('wood', '#5a3e26'); g.box(-0.75, -0.4, -10.05, 0.75, 0, -10.0, { faces: 'zyY' }); });
  s.solid(-0.8, 0, -10.05, -0.75, 2.4, ZF); s.solid(0.75, 0, -10.05, 0.8, 2.4, ZF); s.solid(-0.8, 0, -10.2, 0.8, CEIL, -10.0);
  // the canopy at five metres: beams, a felt soffit, and the solid ceiling that keeps you from drifting off
  runX(X0 - 0.2, X1 + 0.2, 4, (a, b) => { g.mat('felt', '#3a3f6a'); g.box(a, CEIL, ZF - 0.6, b, CEIL + 0.04, 0, { faces: 'y' }); g.mat('wood', '#5a3e26'); g.box(a, CEIL - 0.25, ZF - 0.7, b, CEIL + 0.06, ZF - 0.5, { faces: 'yzZ' }); });
  s.flush({ tier: 's', cast: false });
  for (let x = X0 + 0.4; x <= X1; x += 2.6) { g.mat('wood', '#6b4a2f'); g.box(x - 0.08, CEIL - 0.28, ZF - 0.6, x + 0.08, CEIL, 0, { faces: 'xXy' }); } s.flush({ tier: 's', cast: false });
  s.solid(X0 - 1, CEIL, ZF - 2, X1 + 1, CEIL + 0.8, 1);
  // sleeves hung up to air between the beams, and a string of flags along the rail
  { const FC = ['#c9552e', '#e7b547', '#2f8f8a', '#c23a6a', '#5a8f3a', '#2f5fa8', '#e8743b', '#7a3a9a'];
    s.detail(() => { let k = 0; for (let x = X0 + 1.7; x < X1 - 1; x += 2.6) for (const z of [-7.4, -2.8]) { if (Math.abs(x) < 2.5 && z > -4) continue; const c = FC[(k++ * 3) % FC.length], L = 1.2 + 0.3 * ((k * 5) % 3) / 2; g.mat('weave', c, { sway: 0.6 }); g.sheet([x - 0.2, CEIL - 0.28, z], [x + 0.2, CEIL - 0.28, z], [x + 0.3, CEIL - 0.28 - L, z + 0.02], [x - 0.3, CEIL - 0.28 - L, z + 0.02], { nu: 3, nv: 4, ripple: 0.04, rippleN: 3 }); } }); }
  for (const x of [X0, X1]) { netZ(s, { x, z0: ZF, z1: 0, y0: 0, y1: CEIL, cell: 0.4 }); s.solid(x - 0.1, -1, ZF - 1.2, x + 0.1, CEIL + 0.5, 0.5); g.mat('cast', '#5a4a33'); g.box(x - 0.06, 0, ZF - 0.06, x + 0.06, CEIL, ZF + 0.06); s.flush({ tier: 's' }); }

  // ---- the front: a rail with the gate in it, net up to the canopy, the mouth of the hall beyond
  const railPts = (a, b) => lineX(a, b, 1.05, ZF + 0.05, 1.5);
  g.mat('cast', '#5a4a33');
  for (const seg of [[X0, -1.15], [1.15, X1]]) { for (let x = seg[0]; x <= seg[1] + 0.01; x += (seg[1] - seg[0]) / Math.round((seg[1] - seg[0]) / 1.4)) g.tube([[x, 0, ZF + 0.05], [x, 1.05, ZF + 0.05]], 0.022, { segs: 6 }); }
  s.flush({ tier: 's' });
  for (const seg of [[X0, -1.15], [1.15, X1]]) { g.mat('wood', '#8a6240', { rough: -0.1 }); g.tube(railPts(seg[0], seg[1]), 0.035, { segs: 7 }); g.mat('cast', '#5a4a33'); g.tube(lineX(seg[0], seg[1], 0.5, ZF + 0.05, 1.5), 0.012, { segs: 4 }); }
  s.flush({ tier: 's' });
  for (const seg of [[X0, -1.15], [1.15, X1]]) netX(s, { x0: seg[0], x1: seg[1], z: ZF + 0.02, y0: 1.07, y1: CEIL - 0.25, cell: 0.4, tint: '#e2d6b8' });
  for (const seg of [[X0 + 0.2, -1.4], [1.4, X1 - 0.2]]) runX(seg[0], seg[1], 4.6, (a, b) => bunting(s, [a, 3.0, ZF + 0.25], [b, 3.0, ZF + 0.25], { sag: 0.3, colors: ['#c9552e', '#e7b547', '#2f8f8a', '#e9e2d0', '#c23a6a'] }));
  s.solid(X0, 0, ZF - 0.05, X1, CEIL, ZF + 0.12);
  // the gate: two tall striped posts, a hinged net gate (shut), a lintel with the hall's plate
  for (const x of [-1.15, 1.15]) for (let k = 0; k < 7; k++) { g.mat('paint', k % 2 ? '#e8e0d0' : '#a82a2a'); g.box(x - 0.08, k * 0.42, ZF - 0.08, x + 0.08, (k + 1) * 0.42, ZF + 0.12, { faces: 'xXzZ' }); }
  g.mat('paint', '#a82a2a'); g.box(-1.3, 2.94, ZF - 0.1, 1.3, 3.2, ZF + 0.14, { bevel: 0.015 });
  g.mat('cast', '#5a4a33'); g.tube([[-1.05, 0.1, ZF + 0.02], [1.05, 0.1, ZF + 0.02], [1.05, 1.15, ZF + 0.02], [-1.05, 1.15, ZF + 0.02], [-1.05, 0.1, ZF + 0.02]], 0.022, { segs: 6 });
  s.flush({ tier: 's' });
  netX(s, { x0: -1.0, x1: 1.0, z: ZF + 0.02, y0: 0.14, y1: 1.12, cell: 0.2, tint: '#e8c25a' });
  sign(s, SIGNS['flying-hall.plate'], 0, 3.07, ZF + 0.145, { face: 'Z', w: 0.5, h: 0.2 });
  s.interact({ x: 0, y: 1.2, z: ZF + 0.6, radius: 1.5, enabled: (gm) => !(gm.fly && gm.fly.active), prompt: 'Take off', onUse: async (gm) => {
    if (!gm.fly) { toast(gm, 'The hall is closed just now.'); return; }
    if (!gm.flags.has_sleeves) { giveSleeves(gm); toast(gm, 'Bertil fits you a pair of sleeves at the gate and puts your shoes on peg three one eight.'); }
    sfx(gm, 'sleeve-flap', f, 0, 1.4, ZF);
    gm.fly.start();
  } });
  // the mouth of the net: guide ropes running out along the hall, hoops right round the axis
  s.structure(() => {
    g.mat('weave', '#cfc4a8');
    for (let i = -4; i <= 4; i++) {
      const x = i * 4.6;
      for (const y0 of [CEIL, 0.0]) { const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16, z = ZF - 1 - t * 150; pts.push([x * (1 + 2.6 * t), y0 + (-2.5 - y0) * Math.min(1, t * 3), z]); } g.tube(pts, 0.05, { segs: 4, caps: false }); }
    }
  });
  for (const hz of [-34, -96, -158]) s.structure(() => { const pts = []; const C = 2 * PI * 74.5; for (let k = 0; k < 96; k++) pts.push([-C / 2 + C * k / 96, -2.5, hz]); g.mat('cast', '#3a3a3a'); g.tube(pts, 0.14, { segs: 5, closed: true }); });

  // ---- the back wall: indigo panelling, the Spindle lift's doors, the hire's fascia
  runX(X0, X1, 4, (a, b) => {
    g.mat('flute', INDIGO); g.box(a, 0.9, 0, b, CEIL, 0.3, { faces: 'z' });
    g.mat('wood', '#6b4a2f'); g.box(a, 0, 0, b, 0.9, 0.3, { faces: 'z' }); g.box(a, 0.88, -0.05, b, 0.96, 0, { faces: 'zY' });
    g.mat('cast', '#c8a45a'); g.box(a, 4.2, -0.03, b, 4.26, 0, { faces: 'zyY' });
  });
  s.flush({ tier: 's' });
  s.solid(X0, 0, 0, X1, CEIL + 1, 0.4);
  // the lift: tall brass doors in a stone frame, a dial over them
  g.mat('stone', '#b4a48a'); g.box(-2.0, 0, -0.3, -1.55, 3.6, 0, { faces: 'xXzY' }); g.box(1.55, 0, -0.3, 2.0, 3.6, 0, { faces: 'xXzY' }); g.box(-2.1, 3.3, -0.35, 2.1, 3.75, 0, { faces: 'xXzYy' });
  g.mat('cast', '#b08a45', { rough: -0.12 }); g.box(-1.55, 0.02, -0.12, -0.01, 3.1, -0.05); g.box(0.01, 0.02, -0.12, 1.55, 3.1, -0.05);
  g.mat('cast', '#8a6d3b'); for (const yy of [0.6, 1.6, 2.6]) g.box(-1.5, yy, -0.135, 1.5, yy + 0.04, -0.12);
  g.mat('plain', '#1a1a1a'); g.box(-1.55, 3.1, -0.06, 1.55, 3.3, -0.05, { faces: 'z' });
  s.flush({ tier: 's' });
  s.structure(() => { g.mat('paper', '#efe6d2'); g.lathe(0, -0.38, [[0.3, 3.95], [0, 3.95]], { segs: 20, capTop: false, capBottom: false }); });
  s.deco(() => { g.mat('paper', '#efe6d2', { emissive: 0.8 }); g.box(-0.3, 3.82, -0.36, 0.3, 4.08, -0.34, { faces: 'z' }); g.mat('cast', '#2e2a26'); g.box(-0.012, 3.95, -0.38, 0.012, 4.07, -0.37); });
  sign(s, SIGNS['spindle-lift.plate'], 0, 3.52, -0.36, { face: 'z', w: 0.6, h: 0.24 });
  for (const x of [-2.3, 2.3]) lamp(s, 'sconce', x, 2.5, -0.05, { face: 'z', K: 2800, power: 0.7, clip });
  game.cab.addStop({ id: 'flying-hall', name: 'The Spindle', sub: 'the back flying hall and the sleeve hire', frame: f, x: 0, y: 0, z: -1.6, yaw: 0 });
  s.interact({ x: 0, y: 1.2, z: -0.6, radius: 1.6, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open('flying-hall'); } });

  // ---- the sleeve hire: counter, the wall of shoes, racks of sleeves, rules
  const KX0 = -15.6, KX1 = -9.0, KZ = -3.0;
  sign(s, SIGNS['sleeve-hire.fascia'], (KX0 + KX1) / 2, 4.62, -0.02, { face: 'z', w: 4.2, h: 0.62, glow: 0.9 });
  prop(s, 'counter', (KX0 + KX1) / 2, 0, KZ, PI, { w: KX1 - KX0, d: 0.7, body: '#a82a2a', top: '#8a6240' }, { noSpots: true });
  prop(s, 'wall.cubbies', -16.3, 0, -0.42, PI, { nx: 10, ny: 6, seed: 1 });
  prop(s, 'wall.cubbies', -12.3, 0, -0.42, PI, { nx: 10, ny: 6, seed: 2 });
  sign(s, SIGNS['sleeve-hire.pegs'], -14.3, 2.15, -0.5, { face: 'z', w: 0.9, h: 0.26 });
  sign(s, SIGNS['sleeve-hire.rules'], -8.2, 1.65, -0.02, { face: 'z' });
  lamp(s, 'globe', -12.3, 3.2, KZ + 0.2, { K: 2800, power: 0.9, drop: 1.6, clip });
  g.mat('wood', '#6b4a2f'); g.box(-18.2, 2.3, -0.75, -10.4, 2.36, 0, { bevel: 0.01 }); for (const x of [-18, -14.3, -10.6]) g.box(x - 0.03, 2.05, -0.06, x + 0.03, 2.3, -0.02); s.flush({ tier: 's' });
  lamp(s, 'strip', -18.0, 2.3, -0.62, { to: [-10.6, 2.3, -0.62], K: 3200, power: 0.5, clip });
  s.detail(() => { for (let i = 0; i < 9; i++) { const x = -17.8 + i * 0.85; g.mat('glaze', ['#2f6f73', '#c9763e', '#e9e1cf'][i % 3]); g.lathe(x, -0.35, [[0, 2.36], [0.06, 2.36], [0.07, 2.46], [0.05, 2.52], [0, 2.52]], { segs: 10 }); } });
  // on the counter: a ledger, pegs in a dish, a pair of sleeves laid out folded, a lidded cup
  s.detail(() => {
    g.mat('leather', '#3a2a20'); g.box(-14.6, 0.92, KZ - 0.2, -14.0, 0.95, KZ + 0.2, { bevel: 0.01 }); g.mat('paper', '#efe6d2'); g.box(-14.56, 0.95, KZ - 0.17, -14.04, 0.958, KZ + 0.17);
    g.mat('glaze', '#2f6f73'); g.lathe(-13.2, KZ, [[0, 0.92], [0.1, 0.92], [0.12, 0.96], [0, 0.95]], { segs: 12 });
    g.mat('cast', '#c8a45a'); for (let k = 0; k < 6; k++) g.box(-13.25 + (k % 3) * 0.04, 0.95, KZ - 0.04 + Math.floor(k / 3) * 0.05, -13.22 + (k % 3) * 0.04, 0.96, KZ - 0.02 + Math.floor(k / 3) * 0.05);
    for (let k = 0; k < 2; k++) { g.mat('weave', k ? '#e7b547' : '#c9552e'); g.box(-11.7 + k * 0.32, 0.92, KZ - 0.25, -11.45 + k * 0.32, 0.96, KZ + 0.25, { bevel: 0.01 }); }
  });
  prop(s, 'cup', -10.2, 0.92, KZ + 0.1, 0, { glaze: '#e7b547' });
  s.spot('counter', -12.3, 0, KZ + 0.95, PI, { who: 'bertil', tags: ['hire', 'keeper'] });
  s.spot('customer', -12.3, 0, KZ - 0.75, 0, { tags: ['hire'] }); s.spot('customer', -14.4, 0, KZ - 0.8, 0.2, { tags: ['hire'] }); s.spot('queue', -12.0, 0, KZ - 1.8, 0, { tags: ['hire'] });
  s.solid(KX0, 0, KZ - 0.36, KX1, 0.95, KZ + 0.36);
  s.interact({ x: -12.3, y: 1.1, z: KZ - 0.7, radius: 1.4, prompt: 'Look at the hire list', onUse: async (gm) => {
    const c = CAST.bertil;
    const it = await buy(gm, MENUS['sleeve-hire'], c.name);
    if (!it) return;
    if (it.id === 'turn' || it.id === 'child-turn' || it.id === 'flight-night') { giveSleeves(gm); sfx(gm, 'sleeve-flap', f, -12.3, 1.1, KZ); await say(gm, c, ['Shoes off, both of them. Peg three one eight. Wrist loops on, fins to your hips, and fly lengthwise till you have the feel of it.']); }
    else if (it.id === 'hand-lamp') { giveLamp(gm); await say(gm, c, ['Clip it to your collar. A watt or two. The wardens want to see you, not the other way round.']); }
    else if (it.id === 'crosswise') { await say(gm, c, ['Ayo will take you out when the next turn starts. Aim wide.']); find(gm, 'crosswise'); }
  } });
  // racks of sleeves, folded like long fans
  const RACKS = [[-17.8, -5.6, 0, ['#c9552e', '#e7b547', '#2f8f8a', '#c23a6a', '#5a8f3a']], [-14.6, -6.1, 0, ['#2f5fa8', '#e8743b', '#7a3a9a', '#e7b547', '#2f8f8a']], [-11.4, -5.6, 0, ['#c23a6a', '#5a8f3a', '#c9552e', '#2f5fa8', '#f0d070']], [-19.0, -2.6, PI / 2, ['#e8743b', '#2f8f8a', '#c9552e', '#7a3a9a']]];
  for (const rk of RACKS) prop(s, 'wall.sleeverack', rk[0], 0, rk[1], rk[2], { w: 1.8, cols: rk[3] });
  for (const rk of RACKS.slice(0, 3)) s.spot('browse', rk[0], 0, rk[1] - 0.8, 0, { tags: ['hire'] });
  // the hand lamps: a peg board by the gate, some lit at night
  g.mat('wood', '#6b4a2f'); g.box(-4.4, 0, -8.35, -2.6, 1.6, -8.25, { bevel: 0.01 }); g.box(-4.45, 0, -8.5, -4.3, 1.6, -8.1); g.box(-2.7, 0, -8.5, -2.55, 1.6, -8.1); s.flush({ tier: 's', cast: true }); s.solid(-4.45, 0, -8.5, -2.55, 1.6, -8.1);
  for (let i = 0; i < 12; i++) prop(s, 'wall.handlamp', -4.15 + (i % 6) * 0.3, 0.75 + Math.floor(i / 6) * 0.45, -8.2, 0, { body: ['#2f5d5a', '#a82a2a', '#e7b547', '#26306b'][i % 4], glow: i % 3 !== 1 });
  s.light({ at: [-3.5, 1.1, -7.9], K: 2600, color: [1, 0.78, 0.5], power: 0.6, range: 3, night: true, clip });
  s.interact({ x: -3.5, y: 1.1, z: -7.6, radius: 1.2, prompt: (gm) => (hasLamp(gm) ? 'Look at the hand lamps' : 'Take a hand lamp'), onUse: async (gm) => {
    if (hasLamp(gm)) { toast(gm, 'You have one already, clipped to your collar.'); return; }
    if (gm.wallet && !gm.wallet.spend(0.01, 'A hand lamp')) return;
    giveLamp(gm); sfx(gm, 'lamp-click', f, -3.5, 1.1, -8.2); toast(gm, 'A hand lamp, a watt or two, clipped to your collar. 0.01.', 'spend');
  } });

  // ---- the wardens' post: red lamps, the rules, the night's shifts
  const WX = 15.2;
  g.mat('wood', '#5a3e26'); g.box(WX - 1.4, 0, -7.6, WX + 1.4, 1.1, -6.9, { bevel: 0.015 }); g.mat('paint', '#9a2a2a'); g.box(WX - 1.35, 0.1, -7.62, WX + 1.35, 1.0, -7.58); s.flush({ tier: 's', cast: true });
  s.solid(WX - 1.4, 0, -7.6, WX + 1.4, 1.1, -6.9);
  g.mat('cast', '#3a3430'); g.tube([[WX + 1.8, 0, -7.4], [WX + 1.8, 3.4, -7.4]], 0.04, { segs: 6 }); g.tube([[WX + 1.8, 3.2, -7.4], [WX + 1.3, 3.2, -7.4]], 0.02, { segs: 5 }); s.flush({ tier: 's' }); s.post(WX + 1.8, -7.4, 0.08, 0, 3.4);
  for (const p of [[WX + 1.3, 2.9], [WX + 1.8, 3.45]]) { g.mat('cast', '#3a3430'); g.cyl(p[0], p[1] + 0.1, -7.4, 0.07, 0.04, { segs: 8 }); g.mat('diffuser', '#ff3a2a', { emissive: 5 }); g.ball(p[0], p[1], -7.4, 0.08, 0.1, 0.08, { segs: 10, rings: 6 }); s.flush({ tier: 'd' }); s.light({ at: [p[0], p[1], -7.4], color: '#ff3020', power: 1.6, range: 5, clip, radius: 0.08 }); }
  s.detail(() => { // spare red lamps on hooks, a coil of rope, a box with a cross
    for (let k = 0; k < 4; k++) { const x = WX - 1.1 + k * 0.3; g.mat('cast', '#3a3430'); g.tube([[x, 1.1, -7.25], [x, 1.22, -7.25]], 0.005, { segs: 3 }); g.mat('diffuser', '#c83020'); g.ball(x, 1.17, -7.25, 0.04, 0.05, 0.04, { segs: 8, rings: 5 }); }
    g.mat('weave', '#cfc4a8'); for (let k = 0; k < 5; k++) g.lathe(WX + 0.8, -7.2, [[0.18 - k * 0.012, 1.1 + k * 0.03], [0.2 - k * 0.012, 1.115 + k * 0.03], [0.18 - k * 0.012, 1.13 + k * 0.03]], { segs: 14, capTop: false, capBottom: false });
    g.mat('paint', '#e8e0d0'); g.box(WX - 0.4, 1.1, -7.45, WX + 0.1, 1.38, -7.1, { bevel: 0.01 }); g.mat('paint', '#a82a2a'); g.box(WX - 0.2, 1.17, -7.46, WX - 0.1, 1.31, -7.44); g.box(WX - 0.22, 1.2, -7.46, WX - 0.08, 1.28, -7.44);
  });
  sign(s, SIGNS['flying-hall.rules'], WX - 0.6, 1.7, -0.02, { face: 'z' });
  sign(s, SIGNS['spindle.wardens'], WX + 0.6, 1.7, -0.02, { face: 'z' });
  sign(s, SIGNS['poster.choir'], 11.2, 1.6, -0.02, { face: 'z' });
  sign(s, SIGNS['poster.flight'], 6.6, 1.6, -0.02, { face: 'z' });
  daySigns(game, W, f, 'hub-day3', [{ day: 3, spec: SIGNS['spindle.shifts'], x: WX + 2.6, y: 2.1, z: -0.03, o: { face: 'z', w: 1.5, h: 1.05 } }, { day: 3, spec: SIGNS['spindle.banner'], x: 3.6, y: 2.6, z: -0.03, o: { face: 'z', w: 0.7, h: 2.2 } }]);
  s.interact({ x: WX - 0.6, y: 1.4, z: -0.6, radius: 1.1, prompt: 'Read the flying hall rules', onUse: async (gm) => { await readSpec(gm, SIGNS['flying-hall.rules'], 'Somebody has drawn, in pencil, an arrow that sets off for a hoop and lands well to one side of it.'); find(gm, 'crosswise'); } });
  s.interact({ x: WX + 0.6, y: 1.4, z: -0.6, radius: 1.1, prompt: "Read the wardens' rules", onUse: async (gm) => { await readSpec(gm, SIGNS['spindle.wardens']); find(gm, 'wardens'); } });
  s.interact({ x: WX + 2.6, y: 1.6, z: -0.6, radius: 1.2, enabled: (gm) => !!(gm.clock && gm.clock.day === 3), prompt: 'Read the flight shifts', onUse: async (gm) => { await readSpec(gm, SIGNS['spindle.shifts'], 'Pencilled underneath: about a hundred cubic metres a flyer, so 660,000 at once, so shifts.'); find(gm, 'flyers-at-once'); } });
  s.spot('work', WX, 0, -6.4, PI, { who: 'ayo', tags: ['warden'] });
  s.spot('stand', WX + 1.2, 0, -8.3, 0, { tags: ['warden', 'night'] });
  // ---- benches with straps, for people who float off seats
  for (const b of [[7.4, -0.75, 3.0, '#c9552e'], [-5.2, -0.75, 2.4, '#2f8f8a'], [10.6, -5.2, 2.4, '#e7b547']]) { prop(s, 'wall.strapbench', b[0], 0, b[1], b[1] < -2 ? PI / 2 : PI, { w: b[2], strap: b[3] }); }
  seat(s, 7.4, 0, -0.9, PI, 'Sit and strap in', { onSit: (gm) => toast(gm, 'You buckle the strap across your lap. Without it you would drift up off the seat in a minute or two.') });
  // footholds along the deck: loops of rope to hook a toe under
  s.detail(() => { g.mat('weave', '#c9552e'); for (let x = -8; x <= 12; x += 2.2) { if (Math.abs(x) < 2.2) continue; g.tube([[x - 0.15, 0.005, -4.4], [x - 0.15, 0.08, -4.4], [x + 0.15, 0.08, -4.4], [x + 0.15, 0.005, -4.4]], 0.014, { segs: 4 }); } });

  // ---- light: pendants under the canopy, the hall's own glow
  for (const x of [-14, -7, 0, 7, 14]) lamp(s, 'globe', x, 3.9, -5.4, { K: 2900, power: 1.1, drop: 1.1, clip });
  skyGlow(game, s, [X0 - 1, -1, ZF - 2, X1 + 1, CEIL + 0.5, 0.6], 0.55);
  s.ambient({ box: [X0, 0, ZF, X1, CEIL, 0.4], sky: '#ffd8a6', ground: '#b88a5e', power: 0.1, lamp: true, soft: 1.5 });

  // ---- people, paths, zones, sound, spawn
  for (let x = -16; x <= 16; x += 2.4) if (Math.abs(x) > 1.6) s.spot('stand', x + r.f(-0.3, 0.3), 0, ZF + 0.6, PI, { tags: ['watch', 'flyers'] });
  for (const c of [[4.2, -6.4], [-6.6, -5.2], [11.6, -3.0]]) for (let k = 0; k < 3; k++) { const a = k * 2.09; s.spot('chat', c[0] + Math.sin(a) * 0.6, 0, c[1] + Math.cos(a) * 0.6, a + PI, { tags: ['flyers'] }); }
  for (const x of [-1.2, 1.2]) s.spot('queue', x, 0, ZF + 1.3, 0, { tags: ['gate'] });
  s.path([[0, -1.6], [0, -5.4], [0, ZF + 0.8]]); s.path([[0, -5.4], [-6, -4.6], [-12.3, -4.3], [-18, -4.0]]); s.path([[0, -5.4], [7, -4.4], [12, -5.8], [18, -6.0]]);
  s.zoneBox(Object.assign({}, SKY, { id: 'flying-hall', place: 'flying-hall', box: [X0 - 0.5, -1, ZF - 1.2, X1 + 0.5, CEIL + 0.5, 0.6], name: 'The back flying hall', sub: 'The Spindle · the back gate', ambience: 'spindle', headroom: CEIL - 0.1, env: ENV }));
  s.zoneBox(Object.assign({}, SKY, { id: 'sleeve-hire', place: 'sleeve-hire', box: [X0 - 0.5, -1, -7.5, -8.0, CEIL + 0.5, 0.6], name: 'The wing-sleeve hire', sub: 'The Spindle · the back gate', ambience: 'spindle', headroom: CEIL - 0.1, env: ENV }));
  soundOnce(game, ['flying-hall', 'sleeve-hire'], () => { game.loopAt('air', f, 0, 4.5, -4, { vol: 0.22, radius: 20 }); game.loopAt('murmur', f, -10, 1.3, -4.5, { vol: 0.22, radius: 14, param: 0.25 }); });
  s.finish();
  game.spawns['flying-hall'] = { frame: f, x: 3.2, y: 0, z: -6.2, yaw: 0.25 };
  game.spawns['sleeve-hire'] = { frame: f, x: -8.6, y: 0, z: -5.6, yaw: -1.2 };
}
