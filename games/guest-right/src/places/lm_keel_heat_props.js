// Props, constants and small helpers for the Loop Hall (the Keel's heat works, deck 3, Ring Seven). Everything here is
// drawn at the origin with its front toward +z, and cached by the few parameters it takes.
import { defineProp } from '../world/props.js';

export const PI = Math.PI;
export const REGION = 'keel-heat';

// ---------------------------------------------------------------------------------------------------------------
// the plan (frame 'keel-heat': x spinward, y up, z toward the back cap)
// ---------------------------------------------------------------------------------------------------------------
export const HALL = { x0: -140, x1: 140, z: 15, h: 14.5, clip: [-140.6, -0.5, -15.6, 140.6, 14.8, 15.6] };
export const CAT = { y: 4.2, w: 1.2, x0: -120, x1: 120 };          // the catwalk down the middle: deck height, half width, ends
export const RANK_Z = 7.5;                                          // the exchangers' centre lines (z = ±7.5)
export const EX_N = 16, EX_P = 16, EX_X0 = -120;                    // sixteen to a rank, one every 16 m
export const MAIN = { flowZ: 13.6, retZ: 11.75, y: 10.6, rf: 0.75, rr: 0.72 };   // the loop's trunk mains along both walls
export const VAT = { z: 4.4, y: 10.0, r: 0.4 };                                  // the vat-water mains, inboard of the ranks
export const END = { x0: -158, h: 3.8 };                                         // the anti end block: lobby, watch room, crew room
export const TAPS = { x0: 140, x1: 158, h: 14.5 };                               // the Taps at the spinward end
export const GIN = { x0: -62, x1: -40, z0: 15, z1: 28, h: 4.6 };
export const SALT = { x0: -98, x1: -70, z0: -29, z1: -15, h: 4.4 };
export const INLET = { x0: 18, x1: 44, z0: -31, z1: -15, h: 7.2 };
export const COOK = { x0: 40, x1: 70, z0: 15, z1: 30, h: 7.2, screen: 18.6 };

// the loop's colours, as the rest of Chervil paints them (the Flour Hall's Kettle uses the same)
export const C = {
  loop: '#a8432e',        // the 65 degree loop, flow (red)
  ret: '#2f6f73',         // its return at 41 (teal)
  vat: '#8a6326',         // vat water, in at 69 and back at 47 (ochre)
  vatB: '#5e4318',        // vat water going back (darker ochre)
  water: '#2f6f8f',       // clean water from the moat (blue)
  lag: '#e8dfc8',         // canvas lagging
  brass: '#b08a45',
  strap: '#4a443e',
  steel: '#3d4245',
  dark: '#2c3133',
  warn: '#d6a640',
  cream: '#efe4c8',
  copper: '#b8733a',
};
export const EX_PAINT = ['#2c5a55', '#7a2e24', '#2f4d6e', '#2c5a55', '#5b4060', '#7a2e24'];

// ---------------------------------------------------------------------------------------------------------------
// small helpers, safe when the UI or audio is missing
// ---------------------------------------------------------------------------------------------------------------
export async function say(game, who, lines) { if (!game.ui) return; game.busy++; try { await game.ui.say(who, lines); } finally { game.busy--; } }
export function toast(game, text, kind) { if (game.ui) game.ui.toast(text, { kind: kind || 'info', dur: 6 }); }
export function sfx(game, name, f, x, y, z) { if (game.audio && game.sfxAt) game.sfxAt(name, f, x, y, z); }
// Wait a frame between big parts of the build, then take the region's atlas group back (another region may have had it).
export async function tick(game) {
  await new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });
  if (game.atlas && game.atlas.begin) game.atlas.begin('region:' + REGION);
}
// Run fn(a, b, i) over [a0, a1] in pieces no longer than `step` (long things must be cut so the drum can bend them).
export function runX(a0, a1, step, fn) { const n = Math.max(1, Math.ceil((a1 - a0) / step)); for (let i = 0; i < n; i++) fn(a0 + (a1 - a0) * i / n, a0 + (a1 - a0) * (i + 1) / n, i); }
export function lineX(a0, a1, y, z, step = 3) { const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / step)), out = []; for (let i = 0; i <= n; i++) out.push([a0 + (a1 - a0) * i / n, y, z]); return out; }
// A dial: brass bezel and a cream face, facing +z at the local origin. Draw inside g.push()/g.pop() to place it.
export function dial(g, r, needle) {
  g.mat('cast', C.brass, { rough: -0.2 }); g.push(); g.rotX(PI / 2); g.cyl(0, -0.05, 0, r, 0.06, { segs: 14 }); g.pop();
  g.mat('paint', C.cream, { emissive: 0.35 }); g.box(-r * 0.78, -r * 0.78, 0.012, r * 0.78, r * 0.78, 0.016, { faces: 'Z' });
  g.mat('paint', '#a63c28'); g.push(); g.rotZ(needle === undefined ? 0.6 : needle); g.box(-r * 0.04, 0, 0.017, r * 0.04, r * 0.68, 0.02, { faces: 'Z' }); g.pop();
}
// A handwheel of radius r in the plane z = 0 (its stem toward -z).
export function wheel(g, r, paint) {
  g.mat('cast', paint || '#a63c28', { rough: -0.1 });
  const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * PI * 2; pts.push([Math.sin(a) * r, Math.cos(a) * r, 0]); }
  g.tube(pts, Math.max(0.018, r * 0.07), { segs: 6, caps: false });
  for (let i = 0; i < 3; i++) { const a = i * PI / 3; g.tube([[Math.sin(a) * r, Math.cos(a) * r, 0], [-Math.sin(a) * r, -Math.cos(a) * r, 0]], Math.max(0.012, r * 0.045), { segs: 4, caps: false }); }
  g.mat('cast', C.steel); g.cyl(0, -0.05, 0, r * 0.16, 0.1, { segs: 8 });
}

// ---------------------------------------------------------------------------------------------------------------
// the exchanger: a plate heat exchanger the size of a house. Vat water at 69 on one side of every plate, the city's
// loop on the other. Local: length along x (the fixed head at -x), depth along z, its city side toward +z (the wall
// mains), its vat side toward -z (the vat mains). It carries its own pipework up and over to the mains.
// p: { paint }
// ---------------------------------------------------------------------------------------------------------------
export const EX = { L: 9.0, D: 3.6, H: 6.4 };
defineProp('keelheat.exchanger', (g, p) => {
  const L = EX.L, D = EX.D, H = EX.H, paint = p.paint || EX_PAINT[0];
  const hx = -L / 2;                                // the fixed head's inner face
  // plinth
  g.mat('concrete', '#8f877a'); g.box(-L / 2 - 1.4, 0, -D / 2 - 0.3, L / 2 + 0.3, 0.26, D / 2 + 0.3, { bevel: 0.03 });
  g.mat('paint', C.warn); g.box(-L / 2 - 1.4, 0.26, -D / 2 - 0.3, L / 2 + 0.3, 0.262, -D / 2 - 0.2, { faces: 'Y' }); g.box(-L / 2 - 1.4, 0.26, D / 2 + 0.2, L / 2 + 0.3, 0.262, D / 2 + 0.3, { faces: 'Y' });
  // the fixed head and the far support column
  g.mat('paint', paint, { rough: -0.12 });
  g.box(hx - 0.6, 0.26, -D / 2, hx, H, D / 2, { bevel: 0.04 });
  g.box(L / 2 - 0.3, 0.26, -0.6, L / 2, H - 0.3, 0.6, { bevel: 0.03 });
  // the pressure plate (the movable end of the pack)
  const pp = L / 2 - 1.9;
  g.box(pp, 0.4, -D / 2 + 0.12, pp + 0.45, H - 0.45, D / 2 - 0.12, { bevel: 0.03 });
  // carrying bar on top and guide bar under, dark steel
  g.mat('cast', C.steel); g.box(hx, H - 0.75, -0.16, L / 2 - 0.3, H - 0.42, 0.16, { bevel: 0.02 }); g.box(hx, 0.5, -0.12, L / 2 - 0.3, 0.72, 0.12, { bevel: 0.015 });
  // the dark inside of the pack, so the gaps between plates read
  g.mat('plain', '#1d1c1a'); g.box(hx + 0.02, 0.8, -D / 2 + 0.3, pp - 0.02, H - 0.95, D / 2 - 0.3, { faces: 'zZyY' });
  // the plates: pressed steel, alternately catching the light
  const n = 52, span = pp - hx - 0.06, step = span / n;
  for (let i = 0; i < n; i++) {
    const x = hx + 0.03 + i * step;
    g.mat('brushed', i % 2 ? '#b7b1a4' : '#a39d90', { rough: -0.15 });
    g.box(x, 0.75, -D / 2 + 0.22, x + step * 0.62, H - 0.88, D / 2 - 0.22, { faces: 'xXyYzZ' });
  }
  // tie bolts with nuts, holding the pack shut
  for (const y of [1.2, 3.1, 5.0]) for (const sz of [-1, 1]) {
    const z = sz * (D / 2 + 0.06);
    g.mat('cast', '#5a5650', { rough: -0.2 }); g.tube([[hx - 0.7, y, z], [pp + 0.9, y, z]], 0.05, { segs: 6 });
    g.mat('cast', C.steel); g.box(hx - 0.78, y - 0.09, z - 0.09, hx - 0.62, y + 0.09, z + 0.09); g.box(pp + 0.45, y - 0.09, z - 0.09, pp + 0.62, y + 0.09, z + 0.09);
  }
  // the four ports on the fixed head (outer face at hx - 0.6): city flow and return toward +z, vat in and back toward -z
  const ox = hx - 0.6;
  const ports = [[4.9, 0.6, C.loop], [1.5, 1.25, C.ret], [4.9, -0.6, C.vat], [1.5, -1.25, C.vatB]];
  for (const q of ports) {
    g.mat('cast', q[2], { rough: -0.1 }); g.push(); g.move(ox, q[0], q[1]); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.24, 0.55, { segs: 12 }); g.pop();
    g.mat('cast', C.strap); g.push(); g.move(ox - 0.55, q[0], q[1]); g.rotZ(PI / 2); g.cyl(0, 0, 0, 0.36, 0.08, { segs: 12 }); g.pop();
  }
  // their pipes: out from the head, up, and across to the mains (city side to +z, vat side to -z)
  const rx = ox - 0.95, rx2 = ox - 1.25;            // the risers stand just off the head
  // city flow: from the top port, up to 7.8, out to the flow main (local z 6.1), up into its belly
  g.mat('cast', C.loop, { rough: -0.1 });
  g.tube([[ox - 0.6, 4.9, 0.6], [rx, 4.9, 0.6], [rx, 7.8, 0.6], [rx, 7.8, 3.5], [rx, 7.8, 6.1], [rx, 9.9, 6.1]], 0.22, { segs: 12 });
  // city return: bottom port, up to 8.6, out to the return main (local z 4.25)
  g.mat('cast', C.ret, { rough: -0.1 });
  g.tube([[ox - 0.6, 1.5, 1.25], [rx2, 1.5, 1.25], [rx2, 8.6, 1.25], [rx2, 8.6, 4.25], [rx2, 9.9, 4.25]], 0.2, { segs: 12 });
  // vat in and back: up to 7.2 / 7.6 and in to the vat main (local z -3.1)
  g.mat('cast', C.vat, { rough: -0.1 });
  g.tube([[ox - 0.6, 4.9, -0.6], [rx, 4.9, -0.6], [rx, 7.2, -0.6], [rx, 7.2, -3.1], [rx, VAT.y - VAT.r, -3.1]], 0.2, { segs: 12 });
  g.mat('cast', C.vatB, { rough: -0.1 });
  g.tube([[ox - 0.6, 1.5, -1.25], [rx2, 1.5, -1.25], [rx2, 7.65, -1.25], [rx2, 7.65, -3.1], [rx2, VAT.y - VAT.r, -3.1]], 0.18, { segs: 12 });
  // brass bands and a valve wheel on each riser at hand height
  g.mat('cast', C.brass, { rough: -0.15 });
  for (const q of [[rx, 0.6, 0.23], [rx2, 1.25, 0.21], [rx, -0.6, 0.21], [rx2, -1.25, 0.19]]) for (const y of [2.9, 6.6]) g.tube([[q[0], y - 0.05, q[1]], [q[0], y + 0.05, q[1]]], q[2] + 0.03, { segs: 12, caps: false });
  for (const q of [[rx, 0.6, C.loop], [rx2, 1.25, C.ret], [rx, -0.6, C.vat], [rx2, -1.25, C.vatB]]) { g.push(); g.move(q[0] - 0.3, 3.4, q[1]); g.rotY(-PI / 2); wheel(g, 0.24, '#a63c28'); g.pop(); g.mat('cast', C.steel); g.box(q[0] - 0.3, 3.32, q[1] - 0.08, q[0] - 0.02, 3.48, q[1] + 0.08); }
  // two thermometers on the head, facing -x (the aisle end)
  for (const q of [[2.6, 0.7], [2.6, -0.7]]) { g.push(); g.move(ox - 0.02, q[0], q[1]); g.rotY(-PI / 2); dial(g, 0.17, q[1] > 0 ? 0.9 : 1.3); g.pop(); }
  // a ladder up the head's side, and a hand rail on top
  g.mat('cast', C.steel);
  for (const sz of [-0.25, 0.25]) g.tube([[hx - 0.3 + sz, 0.26, D / 2 + 0.2], [hx - 0.3 + sz, H + 1.0, D / 2 + 0.2]], 0.025, { segs: 5 });
  for (let y = 0.6; y < H; y += 0.32) g.box(hx - 0.55, y - 0.015, D / 2 + 0.17, hx - 0.05, y + 0.015, D / 2 + 0.23);
  g.mat('cast', C.warn); g.tube([[hx - 0.55, H + 1.0, D / 2], [hx - 0.55, H + 1.0, -D / 2], [L / 2 - 0.3, H + 1.0, -D / 2]], 0.025, { segs: 5 });
  for (const q of [[hx - 0.55, -D / 2], [L / 2 - 0.3, -D / 2], [hx - 0.55, D / 2]]) { g.mat('cast', C.steel); g.tube([[q[0], H, q[1]], [q[0], H + 1.0, q[1]]], 0.022, { segs: 4 }); }
  g.mat('grille', '#6a6a62'); g.box(hx - 0.6, H - 0.02, -D / 2, L / 2 - 0.3, H, D / 2, { faces: 'Y' });
  return { solid: [[-L / 2 - 2.1, 0, -D / 2 - 0.3, L / 2 + 0.3, H, D / 2 + 0.3]], tier: 's', cast: true, surf: 'metal' };
});

// An amber high-bay pendant: a red enamel dome on a rod. p: { drop }
defineProp('keelheat.pendant', (g, p) => {
  const drop = p.drop || 1.2;
  g.mat('cast', '#2f3a36'); g.tube([[0, 0, 0], [0, -drop, 0]], 0.02, { segs: 5 });
  g.mat('cast', '#7a2e24', { rough: -0.25 }); g.lathe(0, 0, [[0.55, -drop - 0.4], [0.46, -drop - 0.24], [0.2, -drop - 0.06], [0.08, -drop]], { segs: 14, capTop: true, capBottom: false });
  g.mat('paint', '#efe4c8'); g.lathe(0, 0, [[0.53, -drop - 0.39], [0.44, -drop - 0.24], [0, -drop - 0.07]], { segs: 14, capTop: false, capBottom: false });
  g.mat('diffuser', '#ffb060', { emissive: 6 }); g.ball(0, -drop - 0.28, 0, 0.15, 0.15, 0.15, { segs: 8, rings: 5 });
  return { tier: 's', cast: false };
});

// A gauge post for the aisles: a cast column with three dials and a chalk slate. p: {}
defineProp('keelheat.gaugepost', (g) => {
  g.mat('cast', C.steel); g.box(-0.1, 0, -0.1, 0.1, 2.0, 0.1, { bevel: 0.015 }); g.box(-0.25, 0, -0.25, 0.25, 0.06, 0.25, { bevel: 0.01 });
  g.mat('paint', '#2c5a55'); g.box(-0.42, 1.25, 0.08, 0.42, 1.95, 0.14, { bevel: 0.015 });
  for (let i = 0; i < 3; i++) { g.push(); g.move(-0.27 + i * 0.27, 1.65, 0.14); dial(g, 0.11, 0.3 + i * 0.5); g.pop(); }
  g.mat('slate', '#2a3030'); g.box(-0.36, 1.29, 0.14, 0.36, 1.45, 0.15, { faces: 'Z' });
  g.mat('paint', '#e9e3d0'); for (let i = 0; i < 4; i++) g.box(-0.32 + i * 0.16, 1.35, 0.151, -0.22 + i * 0.16, 1.37, 0.153, { faces: 'Z' });
  return { solid: [[-0.42, 0, -0.12, 0.42, 2.0, 0.16]], tier: 'd' };
});

// ---------------------------------------------------------------------------------------------------------------
// the Gin Kitchen
// ---------------------------------------------------------------------------------------------------------------
// A vacuum pot still: a copper pot on a lagged jacket fed from the loop, a column, a swan neck to a condenser. p: { h }
defineProp('keelheat.still', (g, p) => {
  const h = p.h || 3.4;
  g.mat('cast', C.steel); for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; g.box(Math.sin(a) * 0.7 - 0.05, 0, Math.cos(a) * 0.7 - 0.05, Math.sin(a) * 0.7 + 0.05, 0.6, Math.cos(a) * 0.7 + 0.05); }
  // the jacket (the loop's water goes round the pot) and the pot
  g.mat('weave', '#d8cdb2'); g.lathe(0, 0, [[0.86, 0.55], [0.9, 0.6], [0.9, 1.25], [0.86, 1.3]], { segs: 18, capBottom: true, capTop: false });
  g.mat('cast', C.loop); g.lathe(0, 0, [[0.91, 0.82], [0.91, 0.9]], { segs: 18, capTop: false, capBottom: false });
  g.mat('cast', C.copper, { rough: -0.3 }); g.lathe(0, 0, [[0.86, 1.3], [0.84, 1.55], [0.7, 1.85], [0.42, 2.05], [0.26, 2.12]], { segs: 18, capBottom: false, capTop: false });
  // the column with its sight glasses, the helmet, the swan neck
  g.lathe(0, 0, [[0.26, 2.12], [0.24, 2.2], [0.24, h - 0.4], [0.3, h - 0.3], [0.32, h - 0.12], [0.2, h], [0, h + 0.04]], { segs: 14, capBottom: false });
  g.mat('cast', C.brass, { rough: -0.2 }); for (const y of [2.5, 2.9]) g.lathe(0, 0, [[0.255, y - 0.07], [0.255, y + 0.07]], { segs: 14, capTop: false, capBottom: false });
  g.mat('diffuser', '#ffd29a', { emissive: 1.2 }); for (const y of [2.5, 2.9]) g.box(-0.07, y - 0.05, 0.245, 0.07, y + 0.05, 0.262, { faces: 'Z' });
  g.mat('cast', C.copper, { rough: -0.3 }); g.tube([[0, h - 0.2, 0.25], [0, h - 0.1, 0.55], [0, h - 0.4, 1.2], [0, 2.2, 1.45]], [0.1, 0.09, 0.07, 0.07], { segs: 10 });
  // the condenser: a lagged cylinder fed cold, its drip to the safe line
  g.mat('brushed', '#b9b4a8'); g.cyl(0, 0.9, 1.45, 0.22, 1.35, { segs: 12 });
  g.mat('cast', C.water); g.tube([[0.22, 1.1, 1.45], [0.5, 1.1, 1.45], [0.5, 0, 1.45]], 0.035, { segs: 6 });
  g.mat('cast', C.brass); g.tube([[0, 0.9, 1.45], [0, 0.75, 1.7], [0, 0.75, 2.0]], 0.025, { segs: 6 });
  // a vacuum gauge on the pot
  g.push(); g.move(0, 1.55, 0.86); dial(g, 0.13, -0.9); g.pop();
  return { solid: [[-0.95, 0, -0.95, 0.95, 2.2, 0.95], [-0.3, 0, 1.2, 0.3, 2.2, 1.7]], tier: 's', cast: true, surf: 'metal' };
});
// The spirit safe: a brass box with glass sides on a stand, three bowls the spirit runs through, locked. p: {}
defineProp('keelheat.safe', (g) => {
  g.mat('wood', '#4a3424'); g.box(-0.55, 0, -0.3, 0.55, 0.9, 0.3, { bevel: 0.015 });
  g.mat('cast', C.brass, { rough: -0.25 });
  g.box(-0.6, 0.9, -0.32, 0.6, 0.98, 0.32, { bevel: 0.01 }); g.box(-0.6, 1.5, -0.32, 0.6, 1.58, 0.32, { bevel: 0.01 });
  for (const sx of [-0.58, 0.58]) for (const sz of [-0.3, 0.3]) g.box(sx - 0.025, 0.98, sz - 0.025, sx + 0.025, 1.5, sz + 0.025);
  g.lathe(0, 0, [[0.5, 1.58], [0.3, 1.72], [0.06, 1.78], [0, 1.78]], { segs: 4 });
  // the bowls inside, the spirit clear in them
  for (let i = 0; i < 3; i++) { const x = -0.34 + i * 0.34; g.mat('glaze', '#e9e1cf'); g.lathe(x, 0, [[0, 1.0], [0.09, 1.0], [0.12, 1.1], [0.11, 1.12], [0, 1.08]], { segs: 12, capTop: false }); g.mat('cast', C.brass); g.cyl(x, 1.12, 0, 0.012, 0.36, { segs: 4 }); g.ball(x, 1.36, 0, 0.04, 0.04, 0.04, { segs: 6, rings: 4 }); }
  g.mat('cast', '#3a3430'); g.box(0.48, 1.18, 0.32, 0.56, 1.3, 0.35);
  return { solid: [[-0.6, 0, -0.33, 0.6, 1.6, 0.33]], glass: [[-0.58, 0.98, 0.31, 0.58, 1.5, 0.31, { tint: '#e8f0ea', opacity: 0.14 }], [-0.58, 0.98, -0.31, 0.58, 1.5, -0.31, { tint: '#e8f0ea', opacity: 0.14 }]], tier: 'd' };
});
// A steel churn for a hall's gin, with a lid and a painted band. p: { band }
defineProp('keelheat.churn', (g, p) => {
  g.mat('brushed', '#c4c0b6', { rough: -0.2 }); g.lathe(0, 0, [[0, 0], [0.2, 0], [0.22, 0.04], [0.22, 0.5], [0.16, 0.62], [0.12, 0.66], [0.12, 0.7]], { segs: 14, capTop: false });
  g.mat('brushed', '#a9a59b'); g.lathe(0, 0, [[0.14, 0.69], [0.15, 0.72], [0.05, 0.76], [0, 0.77]], { segs: 14, capBottom: false });
  g.mat('paint', p.band || C.loop); g.lathe(0, 0, [[0.225, 0.28], [0.225, 0.36]], { segs: 14, capTop: false, capBottom: false });
  return { posts: [[0, 0, 0.22, 0, 0.77]], tier: 'd' };
});
// A tasting glass with its own little glass lid (heliox takes a spirit's scent away four times as fast). p: {}
defineProp('keelheat.taster', (g) => {
  g.mat('plain', '#dfe8e4', { rough: -0.4 }); g.lathe(0, 0, [[0, 0], [0.025, 0], [0.006, 0.012], [0.005, 0.05], [0.03, 0.07], [0.034, 0.1], [0.028, 0.12]], { segs: 10, capTop: false });
  g.mat('plain', '#cfe0da', { rough: -0.4 }); g.lathe(0, 0, [[0.031, 0.12], [0.02, 0.128], [0.006, 0.13], [0.006, 0.14], [0, 0.142]], { segs: 10, capBottom: false });
  return { cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// the Salt Pans
// ---------------------------------------------------------------------------------------------------------------
// A warm pan: a shallow steel tray of brine on a lagged plinth, the loop's pipes under it, salt crusted at the edges. p: { w, d, crust }
defineProp('keelheat.pan', (g, p) => {
  const w = p.w || 7, d = p.d || 2.2, top = 0.62;
  g.mat('weave', '#d9d0bc'); g.box(-w / 2, 0, -d / 2, w / 2, top - 0.1, d / 2, { bevel: 0.03 });
  g.mat('cast', C.loop); g.box(-w / 2 + 0.05, 0.18, d / 2 - 0.02, w / 2 - 0.05, 0.26, d / 2 + 0.02); g.mat('cast', C.ret); g.box(-w / 2 + 0.05, 0.08, d / 2 - 0.02, w / 2 - 0.05, 0.14, d / 2 + 0.02);
  g.mat('brushed', '#b9b4a8', { rough: -0.2 });
  g.box(-w / 2 - 0.05, top - 0.1, -d / 2 - 0.05, w / 2 + 0.05, top - 0.06, d / 2 + 0.05);
  for (const sz of [-1, 1]) g.box(-w / 2 - 0.05, top - 0.06, sz * (d / 2) - 0.04, w / 2 + 0.05, top + 0.08, sz * (d / 2) + 0.04, { bevel: 0.01 });
  for (const sx of [-1, 1]) g.box(sx * (w / 2) - 0.04, top - 0.06, -d / 2, sx * (w / 2) + 0.04, top + 0.08, d / 2, { bevel: 0.01 });
  // brine, and the salt coming out of it: a white crust thickest at the edges, a raked ridge down the middle
  g.mat('plain', '#c9d4d0', { rough: -0.45 }); g.box(-w / 2 + 0.04, top - 0.06, -d / 2 + 0.04, w / 2 - 0.04, top + 0.02, d / 2 - 0.04, { faces: 'Y' });
  g.mat('plaster', '#f4f2ec', { rough: 0.2 });
  const cr = p.crust === undefined ? 0.5 : p.crust;
  for (const sz of [-1, 1]) g.box(-w / 2 + 0.04, top - 0.06, sz * (d / 2 - 0.04) - (sz > 0 ? 0.32 : 0), w / 2 - 0.04, top + 0.035, sz * (d / 2 - 0.04) + (sz > 0 ? 0 : 0.32), { faces: 'Y' + (sz > 0 ? 'z' : 'Z') });
  if (cr > 0) {
    const L = (w - 0.6) * cr;
    for (const zc of [-0.55, 0, 0.55]) g.extrude([[zc - 0.22, top], [zc + 0.22, top], [zc + 0.07, top + 0.1], [zc - 0.07, top + 0.1]], -w / 2 + 0.3, -w / 2 + 0.3 + L, 'x');
    // the heap raked up at the end of the run
    g.lathe(-w / 2 + 0.3 + L + 0.35, 0, [[0, top], [0.5, top], [0.36, top + 0.14], [0.14, top + 0.24], [0, top + 0.26]], { segs: 12 });
  }
  return { solid: [[-w / 2 - 0.05, 0, -d / 2 - 0.05, w / 2 + 0.05, top + 0.08, d / 2 + 0.05]], tier: 's', surf: 'metal' };
});
// A sack of salt, tied at the neck, with a painted band in a ring's colour. p: { band }
defineProp('keelheat.sack', (g, p) => {
  g.mat('weave', '#eee8da'); g.box(-0.24, 0, -0.17, 0.24, 0.52, 0.17, { bevel: 0.09 });
  g.lathe(0, 0, [[0.12, 0.5], [0.06, 0.6], [0.08, 0.66], [0, 0.68]], { segs: 8 });
  g.mat('weave', p.band || '#2f6f73'); g.box(-0.245, 0.2, 0.15, 0.245, 0.3, 0.172, { faces: 'Z' });
  g.mat('cast', '#7a5233'); g.lathe(0, 0, [[0.065, 0.585], [0.065, 0.605]], { segs: 8, capTop: false, capBottom: false });
  return { solid: [[-0.24, 0, -0.17, 0.24, 0.55, 0.17]], tier: 'd' };
});
// A long salt rake, leaning: wooden head, ash-pale shaft. p: {}
defineProp('keelheat.rake', (g) => {
  g.mat('wood', '#c9b48a'); g.tube([[0, 0.06, 0], [0, 2.4, -0.55]], 0.02, { segs: 6 });
  g.mat('wood', '#8a6d4a'); g.box(-0.35, 0.0, -0.03, 0.35, 0.12, 0.03, { bevel: 0.01 });
  return { tier: 'd', cast: false };
});

// ---------------------------------------------------------------------------------------------------------------
// the Cookers (the oxidisers) and the Inlet
// ---------------------------------------------------------------------------------------------------------------
// A pressure vessel: thick steel, lagged, flanged, on a skirt. Water above 374 degrees and 221 bar goes through it. p: {}
defineProp('keelheat.oxidiser', (g) => {
  g.mat('paint', '#3a4a48'); g.lathe(0, 0, [[0.9, 0], [0.9, 0.9], [0.75, 1.0]], { segs: 18, capBottom: false, capTop: false });
  g.mat('cast', '#56625f', { rough: -0.15 }); g.lathe(0, 0, [[0.75, 1.0], [0.85, 1.25], [0.85, 4.6], [0.6, 5.05], [0.3, 5.2]], { segs: 18, capBottom: true, capTop: false });
  g.mat('weave', '#d6cfbd'); g.lathe(0, 0, [[0.865, 1.7], [0.865, 2.8]], { segs: 18, capTop: false, capBottom: false }); g.lathe(0, 0, [[0.865, 3.35], [0.865, 4.3]], { segs: 18, capTop: false, capBottom: false });
  g.mat('cast', C.strap); for (const y of [1.6, 2.6, 3.6, 4.4]) g.lathe(0, 0, [[0.87, y - 0.04], [0.87, y + 0.04]], { segs: 18, capTop: false, capBottom: false });
  g.mat('cast', '#5a5650', { rough: -0.2 }); g.cyl(0, 5.15, 0, 0.42, 0.22, { segs: 16 }); g.cyl(0, 5.37, 0, 0.32, 0.12, { segs: 14 });
  for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; g.cyl(Math.sin(a) * 0.37, 5.37, Math.cos(a) * 0.37, 0.025, 0.1, { segs: 5 }); }
  g.mat('paint', '#a63c28'); g.lathe(0, 0, [[0.86, 2.95], [0.86, 3.2]], { segs: 18, capTop: false, capBottom: false });
  g.mat('cast', C.steel); g.tube([[0, 5.49, 0], [0, 5.9, 0], [0.6, 6.2, 0]], 0.09, { segs: 8 });
  g.push(); g.move(0, 2.1, 0.88); dial(g, 0.16, 1.7); g.pop();
  return { posts: [[0, 0, 0.9, 0, 5.5]], tier: 's', cast: true, surf: 'metal' };
});
// The sleeved pipe from the moat as it comes up through the floor: an elbow of steel in a frost-white collar. p: {}
defineProp('keelheat.inletpipe', (g) => {
  // the collar at the floor, white lagging thick as an arm, with a frost of fine felt
  g.mat('felt', '#f2f1ec'); g.lathe(0, 0, [[0, 0], [1.6, 0], [1.6, 0.4], [1.45, 0.55], [1.25, 0.62], [1.25, 1.1], [1.05, 1.18]], { segs: 22, capTop: false });
  g.mat('cast', C.steel); g.lathe(0, 0, [[1.62, 0.12], [1.62, 0.2]], { segs: 22, capTop: false, capBottom: false });
  // the vacuum sleeve: a bigger steel pipe round the water pipe, bolted at a flange
  g.mat('brushed', '#9c968a', { rough: -0.1 }); g.lathe(0, 0, [[1.05, 1.1], [1.05, 2.0]], { segs: 20, capTop: false, capBottom: false });
  g.mat('cast', '#5a5650'); g.lathe(0, 0, [[1.22, 2.0], [1.22, 2.18]], { segs: 20 });
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; g.cyl(Math.sin(a) * 1.14, 2.18, Math.cos(a) * 1.14, 0.04, 0.08, { segs: 5 }); }
  // the water pipe, blue, bending over toward +z
  g.mat('cast', C.water, { rough: -0.1 });
  const pts = []; for (let i = 0; i <= 8; i++) { const a = i / 8 * PI / 2; pts.push([0, 2.18 + Math.sin(a) * 1.6, 1.6 - Math.cos(a) * 1.6]); }
  pts.push([0, 3.78, 4.2]);
  g.tube(pts, 0.85, { segs: 20, caps: false });
  g.mat('cast', C.brass, { rough: -0.2 }); for (const z of [2.6, 3.8]) g.tube([[0, 3.78, z - 0.06], [0, 3.78, z + 0.06]], 0.9, { segs: 20, caps: false });
  return { posts: [[0, 0, 1.6, 0, 3.0]], solid: [[-0.9, 2.9, 0.5, 0.9, 4.7, 4.2]], tier: 's', cast: true, surf: 'metal' };
});

// ---------------------------------------------------------------------------------------------------------------
// the watch room and the crew room
// ---------------------------------------------------------------------------------------------------------------
// The watch desk: a long sloped console of lamps and switches under the window, a log open on it. p: { w }
defineProp('keelheat.desk', (g, p) => {
  const w = p.w || 5;
  g.mat('wood', '#5b4636', { rough: -0.1 }); g.box(-w / 2, 0.72, -0.42, w / 2, 0.77, 0.42, { bevel: 0.012 });
  g.mat('panel', '#2c5a55'); g.box(-w / 2 + 0.05, 0, -0.4, w / 2 - 0.05, 0.72, -0.32);
  for (const sx of [-1, 1]) g.box(sx * (w / 2 - 0.05) - 0.05, 0, -0.4, sx * (w / 2 - 0.05) + 0.05, 0.72, 0.4);
  g.extrude([[-0.42, 0.77], [-0.08, 0.77], [-0.26, 1.08], [-0.42, 1.08]], -w / 2 + 0.1, w / 2 - 0.1, 'x');
  const cols = ['#ffb060', '#ffb060', '#7fe08a', '#ffb060', '#ff5040', '#7fe08a'];
  for (let i = 0; i < Math.floor((w - 0.4) / 0.13); i++) for (let k = 0; k < 2; k++) {
    const x = -w / 2 + 0.25 + i * 0.13, y = 0.84 + k * 0.11, z = -0.13 - k * 0.065;
    if ((i * 7 + k * 3) % 4 === 0) { g.mat('cast', '#d9d4c6'); g.box(x - 0.012, y - 0.01, z - 0.01, x + 0.012, y + 0.03, z + 0.02); }
    else { g.mat('diffuser', cols[(i * 5 + k * 11) % cols.length], { emissive: 2 }); g.box(x - 0.02, y, z, x + 0.02, y + 0.02, z + 0.02); }
  }
  // the log, open, and a pencil
  g.mat('paper', '#efe6d2'); g.box(-0.45, 0.77, 0.0, 0.15, 0.785, 0.32, { bevel: 0.004 });
  g.mat('cast', '#7a2e24'); g.box(-0.16, 0.77, 0.0, -0.14, 0.79, 0.32);
  g.mat('wood', '#d6a640'); g.tube([[0.25, 0.79, 0.12], [0.4, 0.79, 0.2]], 0.006, { segs: 5 });
  return { solid: [[-w / 2, 0, -0.43, w / 2, 1.08, 0.43]], tier: 'd' };
});
// A copper kettle on a little stand with an element under it, its cord, a lid. p: {}
defineProp('keelheat.kettle', (g) => {
  g.mat('cast', '#2f3a36'); g.cyl(0, 0, 0, 0.16, 0.05, { segs: 14 });
  g.mat('cast', C.copper, { rough: -0.3 }); g.lathe(0, 0, [[0, 0.05], [0.14, 0.05], [0.16, 0.12], [0.15, 0.2], [0.1, 0.25], [0.04, 0.27], [0.04, 0.29], [0, 0.3]], { segs: 16 });
  g.tube([[0, 0.1, 0.14], [0, 0.17, 0.22], [0, 0.22, 0.26]], [0.025, 0.018, 0.012], { segs: 6 });
  g.mat('wood', '#2a2622'); g.tube([[0, 0.24, -0.1], [0, 0.36, -0.06], [0, 0.37, 0.05], [0, 0.25, 0.09]], 0.012, { segs: 5 });
  return { cast: false, tier: 'd' };
});
// Locker bank. p: { n, paint }
defineProp('keelheat.lockers', (g, p) => {
  const n = p.n || 6, w = 0.45;
  for (let i = 0; i < n; i++) {
    const x = -n * w / 2 + i * w;
    g.mat('panel', i % 5 === 3 ? '#a8432e' : (p.paint || '#2c5a55'), { rough: -0.05 }); g.box(x + 0.01, 0.12, -0.25, x + w - 0.01, 1.9, 0.25, { bevel: 0.008 });
    g.mat('cast', '#2a2622'); for (let k = 0; k < 4; k++) g.box(x + 0.1, 1.55 + k * 0.05, 0.25, x + w - 0.1, 1.57 + k * 0.05, 0.255);
    g.mat('cast', C.brass); g.box(x + w - 0.1, 1.0, 0.25, x + w - 0.07, 1.12, 0.27);
    g.mat('paper', '#efe6d2'); g.box(x + 0.12, 1.75, 0.251, x + w - 0.12, 1.82, 0.256, { faces: 'Z' });
  }
  g.mat('wood', '#5b4636'); g.box(-n * w / 2, 0, -0.25, n * w / 2, 0.12, 0.25);
  return { solid: [[-n * w / 2, 0, -0.26, n * w / 2, 1.9, 0.26]], tier: 'd' };
});
// A coverall on a peg, a mend at the knee. p: { cloth, mend }
defineProp('keelheat.coverall', (g, p) => {
  g.mat('weave', p.cloth || '#7a2e24');
  g.box(-0.22, 0.75, -0.05, 0.22, 1.45, 0.05, { bevel: 0.03 });
  g.box(-0.2, 0.0, -0.045, -0.02, 0.78, 0.045, { bevel: 0.02 }); g.box(0.02, 0.0, -0.045, 0.2, 0.78, 0.045, { bevel: 0.02 });
  g.box(-0.31, 0.85, -0.04, -0.21, 1.42, 0.04, { bevel: 0.02 }); g.box(0.21, 0.85, -0.04, 0.31, 1.42, 0.04, { bevel: 0.02 });
  g.mat('knit', p.mend || '#d6a640'); g.box(-0.18, 0.28, 0.04, -0.05, 0.42, 0.052, { faces: 'Z' });
  return { tier: 'd', cast: false };
});
