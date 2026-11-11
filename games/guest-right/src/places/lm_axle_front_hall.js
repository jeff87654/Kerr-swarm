// The Cold Room: the front axle's power hall. A drum-shaped room round the axis, 120 m across and 41 m long, whose floor
// runs all the way round and meets itself overhead. At its far end the bearing and the rotary joint stand on the axis;
// twenty-four superconducting conductors come out of the joint in a ring, run a few metres toward you, then turn
// outward like the spokes of a wheel and go down through the floor into the drum. They are as thick as a person,
// sleeved in ceramic collars and frosted at the clamps, and nothing about them moves. A ring of 160 amber lamps on
// the far wall, one for each gigawatt, is the only sign that anything is happening. Visitors stand on a netted apron
// behind a rail and a painted line; an attendant sits at a desk with nothing to do.
import { lamp, warm } from '../world/kit.js';
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { PI, RHO, C, HALF, XR, say, toast, find, seat, runX, inTrue, radialLathe, polar, polarFlat, handLine, netZ, netX } from './lm_axle_front_parts.js';

export const HZ0 = -3.3;                 // the hall's near wall (the Lap is on its other side)
export const HZ1 = -44;                  // the far wall, with the bearing
const SPZ = -25.5;                       // the plane of the spokes
const RH = 11;                           // the hub's radius
const NS = 24;                           // conductors
export const AX = 7, AZ = -14, AH = 4.2; // the apron: x -7..7, z -14..HZ0, netted at 4.2
const ATTEND = { name: 'Mireille, on watch', colour: '#d6a640' };
const ENV = { exposure: 1.0, autoKey: 0.15, autoMin: 0.25, autoMax: 3.2, bloom: 0.09, contrast: 1.14, saturation: 0.92, warmth: -0.12, vignette: 0.32 };

export function buildHall(game, s, f) {
  const g = s.g;
  // ---- the floor, all round except under the apron: dark blue-grey plate with stringers and the painted ring line
  for (const seg of [[AX, HALF], [-HALF, -AX]]) runX(seg[0], seg[1], 16, (a, b) => {
    s.structure(() => {
      g.mat('panel', '#3a414c'); g.box(a, -0.02, HZ1, b, 0, HZ0, { faces: 'Y' });
      g.mat('paint', '#d6a640'); g.box(a, 0.002, AZ - 0.62, b, 0.008, AZ - 0.5, { faces: 'Y' });
      g.mat('paint', '#a8402e'); g.box(a, 0.002, AZ - 0.7, b, 0.008, AZ - 0.64, { faces: 'Y' }); g.box(a, 0.002, AZ - 0.48, b, 0.008, AZ - 0.42, { faces: 'Y' });
    });
  });
  s.structure(() => { g.mat('panel', '#2e343e'); for (let k = 0; k < NS * 2; k++) { const x = wrapX(((k + 0.25) / (NS * 2)) * C); if (Math.abs(x) < AX + 1) continue; g.box(x - 0.16, 0, HZ1, x + 0.16, 0.12, HZ0, { faces: 'xXY' }); } });
  s.solid(-XR - 2, -0.5, HZ1, XR + 2, 0, HZ0);

  // ---- the near wall above the Lap, and the far wall with the bearing
  s.structure(() => { g.mat('panel', '#2a3142'); g.box(-XR, 3.45, HZ0 - 0.2, XR, RHO - 0.05, HZ0, { faces: 'z' }); });
  s.structure(() => { g.mat('panel', '#262c3b'); g.box(-XR, 0, HZ1, XR, RHO - RH, HZ1 + 0.2, { faces: 'Z' }); });
  // concentric painted rings on both walls, so their size reads in the dark
  s.deco(() => {
    for (const rr of [22, 34, 44]) { g.mat('paint', rr === 34 ? '#3a5a8a' : '#c9a24a'); g.box(-XR, RHO - rr - 0.2, HZ1 + 0.2, XR, RHO - rr + 0.2, HZ1 + 0.205, { faces: 'Z' }); }
    for (const rr of [30, 46]) { g.mat('paint', '#3a5a8a'); g.box(-XR, RHO - rr - 0.25, HZ0 - 0.205, XR, RHO - rr + 0.25, HZ0 - 0.2, { faces: 'z' }); }
  });
  // the hub: the rotary joint on the axis, banded; the bearing race round its root
  s.structure(() => {
    g.mat('brushed', '#9aa4ac', { rough: 0.05 }); g.box(-XR, RHO - RH, HZ1, XR, RHO, -31, { faces: 'yZ' });
    g.mat('cast', '#8a6d3b'); g.box(-XR, RHO - RH - 3.2, HZ1 + 0.2, XR, RHO - RH, HZ1 + 0.9, { faces: 'yZ' });
  });
  s.deco(() => {
    for (let k = 0; k < 5; k++) { const z = -42.2 + k * 2.2; g.mat('paint', k % 2 ? '#3a5a8a' : '#e9e1cf'); g.box(-XR, RHO - RH - 0.06, z, XR, RHO - RH, z + 0.6, { faces: 'yzZ' }); }
    g.mat('cast', '#3a3430'); for (let x = -XR; x < XR; x += 3.1) g.box(x, RHO - RH - 3.3, HZ1 + 0.9, x + 0.5, RHO - RH - 3.1, HZ1 + 1.15, { faces: 'yzZ' });
  });

  // ---- the ring of lamps on the far wall: 160, one for each gigawatt, a hundred metres across
  const RL = 50;
  for (let q = 0; q < 8; q++) s.deco(() => {
    for (let i = q * 20; i < q * 20 + 20; i++) {
      const th = (i + 0.5) / 160 * 2 * PI, x = wrapX(th * RHO), y = RHO - RL, z = HZ1 + 0.2;
      g.mat('cast', '#5a4a33'); g.box(x - 0.3, y - 0.3, z, x + 0.3, y + 0.3, z + 0.06, { faces: 'ZxXyY' });
      g.mat('diffuser', '#ffb347', { emissive: 7 }); g.ball(x, y, z + 0.1, 0.17, 0.17, 0.12, { segs: 10, rings: 6, bottom: 0 });
      if (i % 10 === 0) { g.mat('paint', '#e9e1cf'); g.box(x - 0.04, y - 0.9, z + 0.2, x + 0.04, y - 0.45, z + 0.21, { faces: 'Z' }); }
    }
  });
  for (let q = 0; q < 8; q++) { const th = (q + 0.5) / 8 * 2 * PI; s.light({ at: polarFlat(th, RL - 0.6, HZ1 + 1.6), color: warm(2000), power: 5, range: 11, radius: 0.5 }); }

  // ---- the conductors: out of the joint in a ring, a short run toward you, then outward as spokes to the floor
  const R0 = 8, R1 = 12, RB = R1 - R0, ZJ = -31;
  for (let k = 0; k < NS; k++) {
    const th = (k + 0.5) / NS * 2 * PI;
    const path = [polar(th, R0, ZJ - 0.3), polar(th, R0, SPZ - RB)];
    for (let i = 1; i <= 8; i++) { const a = (PI / 2) * i / 8; path.push(polar(th, R1 - RB * Math.cos(a), SPZ - RB + RB * Math.sin(a))); }
    path.push(polar(th, 57.1, SPZ));
    inTrue(s, () => { g.mat('brushed', '#cdd6dc', { rough: 0.22 }); g.tube(path, 0.42, { segs: 16, caps: false }); });
    inTrue(s, () => {
      // ceramic collars every few metres: four glazed discs on a sleeve, a blue band, frost at the clamp
      for (let rc = 16; rc < 55; rc += 4.8) {
        g.mat('glaze', '#efe8da', { rough: -0.15 });
        const prof = [[0.46, -0.36]]; for (let i = 0; i < 4; i++) { const yc = -0.27 + i * 0.18; prof.push([0.5, yc - 0.06], [0.78, yc - 0.03], [0.78, yc + 0.03], [0.5, yc + 0.06]); } prof.push([0.46, 0.36]);
        radialLathe(g, th, rc, SPZ, prof, { segs: 18, capTop: false, capBottom: false });
        g.mat('paint', '#3a5a8a'); radialLathe(g, th, rc + 0.36, SPZ, [[0.47, 0], [0.47, 0.12]], { segs: 16, capTop: false, capBottom: false });
        g.mat('plain', '#e6eef2', { rough: 0.4 }); radialLathe(g, th, rc - 0.36, SPZ, [[0.44, -0.5], [0.5, -0.38], [0.53, -0.1], [0.47, 0]], { segs: 16, capTop: false, capBottom: false });
      }
      // where the conductor leaves the joint: a squat ceramic gland
      g.mat('glaze', '#e9e1cf', { rough: -0.15 }); g.tube([polar(th, R0, ZJ - 0.05), polar(th, R0, ZJ + 0.9)], [0.95, 0.7], { segs: 16 });
      g.mat('cast', '#8a6d3b'); g.tube([polar(th, R0, ZJ - 0.05), polar(th, R0, ZJ + 0.2)], 1.05, { segs: 16 });
    });
    // the bushing it goes down through: a brass flange, a ribbed ceramic cone, the frost on the conductor above it
    inTrue(s, () => {
      g.mat('cast', '#9a7a42', { rough: -0.1 }); radialLathe(g, th, RHO, SPZ, [[1.45, 0], [1.45, 0.1], [1.2, 0.16], [1.0, 0.18]], { segs: 22, capBottom: false });
      g.mat('glaze', '#ece4d4', { rough: -0.18 });
      const prof = [[1.0, 0.16]]; for (let i = 0; i < 7; i++) { const d = 0.35 + i * 0.32, r = 0.95 - i * 0.05; prof.push([r - 0.1, d - 0.12], [r + 0.16, d - 0.05], [r + 0.16, d + 0.02], [r - 0.12, d + 0.09]); } prof.push([0.55, 2.7], [0.48, 2.9]);
      radialLathe(g, th, RHO, SPZ, prof, { segs: 20, capBottom: false, capTop: false });
      g.mat('plain', '#e9f0f4', { rough: 0.45 }); radialLathe(g, th, RHO - 2.85, SPZ, [[0.62, 0], [0.54, 0.4], [0.47, 0.9]], { segs: 14, capBottom: false, capTop: false });
    });
    // frost on the floor round the foot, and a small cold lamp at the foot shining up the spoke
    const fx = wrapX(th * RHO);
    s.deco(() => {
      g.mat('plain', '#c9d6de', { rough: 0.35 }); g.cyl(fx, 0.003, SPZ, 2.5, 0.003, { segs: 22, capBottom: false });
      g.mat('plain', '#e3ecf0', { rough: 0.4 }); g.cyl(fx + 0.4, 0.007, SPZ + 0.3, 1.9, 0.003, { segs: 18, capBottom: false });
      g.mat('cast', '#3a3430'); g.box(fx - 0.25, 0, SPZ + 2.1, fx + 0.25, 0.2, SPZ + 2.5, { bevel: 0.02 });
      g.mat('diffuser', '#dff0ff', { emissive: 3 }); g.box(fx - 0.2, 0.2, SPZ + 2.15, fx + 0.2, 0.22, SPZ + 2.45, { faces: 'Y' });
    });
    s.light({ at: [fx, 0.9, SPZ + 2.0], color: warm(6200), power: 7, range: 12, radius: 0.2 });
  }
  // light round the joint from inside the ring, so the spokes read against the far wall
  for (let q = 0; q < 6; q++) { const th = (q / 6) * 2 * PI; s.light({ at: polarFlat(th, 17, -27.5), color: warm(5600), power: 16, range: 26, radius: 0.4 }); }
  s.ambient({ box: [-XR, -1, HZ1, XR, RHO + 1, HZ0], sky: '#7d93b4', ground: '#3a4250', power: 0.2, spec: 0.3, allRound: true });

  // ---- the apron
  buildApron(game, s, f);

  s.zoneBox({ id: 'cold-room', place: 'axle-front', box: [-XR, -0.5, HZ1, XR, RHO, HZ0], name: 'The Cold Room', sub: 'The front axle · 160 GW · quiet, please', ambience: 'none', reverb: 'hall', headroom: 60, env: ENV }).allRound = true;
  s.zoneBox({ id: 'cold-room-apron', place: 'axle-front', box: [-AX, -0.5, AZ - 0.3, AX, AH, HZ0], name: 'The Cold Room', sub: 'The front axle · behind the line', ambience: 'none', reverb: 'hall', headroom: AH, env: ENV });
}

// x round the drum, kept in -HALF..HALF
function wrapX(x) { x = ((x + HALF) % C + C) % C - HALF; return x; }

// ===============================================================================================================
// The apron: planked, netted, behind a rail and a painted line. The attendant's desk; strap chairs; the card.
// ===============================================================================================================
function buildApron(game, s, f) {
  const g = s.g;
  const clip = [-AX - 0.3, -0.3, AZ - 0.4, AX + 0.3, AH + 0.2, HZ0 + 0.1];
  // floor: warm planks, a felt runner, the painted line a metre inside the rail
  s.structure(() => { g.mat('planks', '#8a6240'); g.box(-AX, -0.02, AZ, AX, 0.04, HZ0, { faces: 'YxXz' }); });
  s.structure(() => { g.mat('felt', '#7a2f3c'); g.box(-0.8, 0.04, AZ + 1.4, 0.8, 0.052, HZ0 - 0.05, { faces: 'YxXz' }); });
  s.deco(() => {
    const L = (x0, z0, x1, z1) => { g.box(Math.min(x0, x1), 0.041, Math.min(z0, z1), Math.max(x0, x1), 0.049, Math.max(z0, z1), { faces: 'Y' }); };
    g.mat('paint', '#d6a640'); L(-AX + 0.9, AZ + 0.9, AX - 0.9, AZ + 1.0); L(-AX + 0.9, AZ + 0.9, -AX + 1.0, HZ0 - 0.3); L(AX - 1.0, AZ + 0.9, AX - 0.9, HZ0 - 0.3);
    g.mat('paint', '#a8402e'); L(-AX + 0.9, AZ + 0.82, AX - 0.9, AZ + 0.87); L(-AX + 0.82, AZ + 0.82, -AX + 0.87, HZ0 - 0.3); L(AX - 0.87, AZ + 0.82, AX - 0.82, HZ0 - 0.3);
  });
  s.solid(-AX, -0.5, AZ, AX, 0.04, HZ0);
  // the rail: posts, a broad wooden top, a brass under-rail; nets from the rail up to the ceiling net
  const posts = [];
  for (let x = -AX; x <= AX + 0.01; x += 1.4) posts.push([x, AZ]);
  for (let z = AZ + 1.4; z <= HZ0 - 0.2; z += 1.4) { posts.push([-AX, z]); posts.push([AX, z]); }
  s.furniture(() => { g.mat('cast', '#4a4038'); for (const p of posts) g.tube([[p[0], 0.04, p[1]], [p[0], AH, p[1]]], 0.035, { segs: 7, caps: false }); });
  s.furniture(() => {
    g.mat('wood', '#6b4a2f', { rough: -0.08 });
    g.box(-AX - 0.09, 1.0, AZ - 0.09, AX + 0.09, 1.08, AZ + 0.09, { bevel: 0.02 });
    for (const sx of [-1, 1]) g.box(sx * AX - 0.09, 1.0, AZ, sx * AX + 0.09, 1.08, HZ0, { bevel: 0.02 });
    g.mat('cast', '#b08a45', { rough: -0.12 });
    g.tube([[-AX, 0.55, AZ], [AX, 0.55, AZ]], 0.02, { segs: 6 }); for (const sx of [-1, 1]) g.tube([[sx * AX, 0.55, AZ], [sx * AX, 0.55, HZ0]], 0.02, { segs: 6 });
    g.box(-AX - 0.06, AH - 0.08, AZ - 0.06, AX + 0.06, AH, AZ + 0.06); for (const sx of [-1, 1]) g.box(sx * AX - 0.06, AH - 0.08, AZ, sx * AX + 0.06, AH, HZ0);
  });
  netZ(s, -AX, AX, AZ - 0.02, 1.08, AH - 0.08, 0.6, '#7a7468');
  for (const sx of [-1, 1]) netX(s, sx * AX + sx * 0.02, AZ, HZ0, 1.08, AH - 0.08, 0.6, '#7a7468');
  // the ceiling net: cables along the apron and a few across, fine enough to see through
  s.deco(() => { g.mat('cast', '#8a8478', { rough: -0.1 }); for (let x = -AX + 1.4; x < AX; x += 1.4) g.tube([[x, AH, AZ], [x, AH, HZ0]], 0.006, { segs: 4, caps: false }); for (let z = AZ + 3.6; z < HZ0; z += 3.6) g.tube([[-AX, AH, z], [AX, AH, z]], 0.008, { segs: 4, caps: false }); });
  s.solid(-AX - 0.15, 0, AZ - 0.15, AX + 0.15, AH + 0.5, AZ + 0.05);
  for (const sx of [-1, 1]) s.solid(sx * AX - 0.15, 0, AZ, sx * AX + 0.15, AH + 0.5, HZ0);
  s.solid(-AX - 0.2, AH, AZ - 0.2, AX + 0.2, AH + 0.6, HZ0 + 0.3);
  handLine(s, [[-AX + 0.14, HZ0 - 0.4], [-AX + 0.14, AZ + 0.14], [AX - 0.14, AZ + 0.14], [AX - 0.14, HZ0 - 0.4]], 0.9, { side: -1 });

  // the near wall seen from the apron: the doorway back to the Lap, sconces, the hall's name over the door
  s.structure(() => { g.mat('panel', '#2a3142'); g.box(-AX, 0, HZ0 - 0.2, -1.2, 3.45, HZ0, { faces: 'z' }); g.box(1.2, 0, HZ0 - 0.2, AX, 3.45, HZ0, { faces: 'z' }); g.box(-1.2, 2.45, HZ0 - 0.2, 1.2, 3.45, HZ0, { faces: 'z' }); });
  s.structure(() => { g.mat('cast', '#8a6d3b'); g.box(-1.32, 0, HZ0 - 0.26, -1.2, 2.55, HZ0, { bevel: 0.01 }); g.box(1.2, 0, HZ0 - 0.26, 1.32, 2.55, HZ0, { bevel: 0.01 }); g.box(-1.32, 2.45, HZ0 - 0.26, 1.32, 2.57, HZ0, { bevel: 0.01 }); });
  sign(s, { kind: 'street', text: 'THE LAP', sub: 'the lift lobby · the Slow Pour · the Hundreds', palette: ['#1f2b40', '#e9e1cf'] }, 0, 2.9, HZ0 - 0.215, { face: 'z', w: 1.9, h: 0.34, glow: 0.6 });
  for (const x of [-2.2, 2.2]) lamp(s, 'sconce', x, 2.2, HZ0 - 0.2, { face: 'z', K: 2600, power: 0.6, clip });

  // ---- the attendant's desk: facing the hall, a book, a dial, a cup with its lid clipped, a desk lamp, nothing to do
  const DX = 4.6, DZ = -6.6;
  s.furniture(() => {
    g.mat('wood', '#5a3a28', { rough: -0.05 }); g.box(DX - 1.1, 0.72, DZ - 0.42, DX + 1.1, 0.78, DZ + 0.36, { bevel: 0.015 });
    for (const sx of [-1, 1]) g.box(DX + sx * 1.0 - 0.07, 0.04, DZ - 0.38, DX + sx * 1.0 + 0.07, 0.72, DZ + 0.32, { bevel: 0.01 });
    g.box(DX - 0.95, 0.3, DZ - 0.4, DX + 0.95, 0.72, DZ - 0.36, { faces: 'zZ' });
    g.mat('felt', '#2f5d5a'); g.box(DX - 0.9, 0.78, DZ - 0.32, DX + 0.9, 0.785, DZ + 0.28, { faces: 'Y' });
  });
  s.solid(DX - 1.1, 0, DZ - 0.42, DX + 1.1, 0.78, DZ + 0.36);
  s.detail(() => {
    // the watch book, open; a pencil on a string; the dial box; a lidded flask; a sock half-knitted on its needles in a clip
    g.mat('leather', '#3a2a20'); g.box(DX - 0.5, 0.785, DZ - 0.15, DX + 0.1, 0.8, DZ + 0.2, { bevel: 0.005 });
    g.mat('paper', '#efe6d2'); g.box(DX - 0.48, 0.8, DZ - 0.13, DX - 0.21, 0.81, DZ + 0.18); g.box(DX - 0.19, 0.8, DZ - 0.13, DX + 0.08, 0.81, DZ + 0.18);
    g.mat('paper', '#8a7c66'); for (let i = 0; i < 9; i++) { g.box(DX - 0.45, 0.8105, DZ - 0.1 + i * 0.03, DX - 0.25, 0.811, DZ - 0.09 + i * 0.03); }
    g.mat('wood', '#c9a24a'); g.tube([[DX + 0.12, 0.79, DZ - 0.05], [DX + 0.24, 0.79, DZ + 0.08]], 0.004, { segs: 5 });
    g.mat('weave', '#a82a2a'); g.tube([[DX + 0.24, 0.79, DZ + 0.08], [DX + 0.4, 0.78, DZ + 0.2], [DX + 0.55, 0.785, DZ + 0.26]], 0.002, { segs: 3 });
    g.mat('cast', '#2e2a26'); g.box(DX + 0.35, 0.785, DZ - 0.3, DX + 0.85, 1.05, DZ - 0.1, { bevel: 0.015 });
    g.mat('paper', '#efe6d2', { emissive: 0.6 }); g.box(DX + 0.4, 0.83, DZ - 0.305, DX + 0.8, 1.0, DZ - 0.3, { faces: 'z' });
    g.mat('cast', '#a82a2a'); g.box(DX + 0.6, 0.86, DZ - 0.31, DX + 0.605, 0.98, DZ - 0.305);
    g.mat('weave', '#5a8f3a'); g.ball(DX - 0.75, 0.83, DZ + 0.05, 0.08, 0.05, 0.06, { segs: 8, rings: 5 }); g.mat('cast', '#c8a45a'); g.tube([[DX - 0.85, 0.82, DZ - 0.02], [DX - 0.62, 0.86, DZ + 0.12]], 0.003, { segs: 3 }); g.tube([[DX - 0.86, 0.84, DZ + 0.1], [DX - 0.62, 0.82, DZ - 0.01]], 0.003, { segs: 3 });
  });
  prop(s, 'lm-axle-front.clipcup', DX + 0.25, 0.785, DZ + 0.2, 0, { glaze: '#c9763e', lid: '#2f6f73' });
  prop(s, 'lm-axle-front.strapchair', DX, 0.04, DZ + 0.8, PI, { wood: '#5a3a28', cloth: '#7a2f3c', strap: '#d6a640', tags: ['attendant'] }, { noSpots: true });
  s.spot('work', DX, 0.04, DZ + 0.75, PI, { tags: ['attendant', 'watch', 'desk'] });
  // desk lamp on a stiff stem
  s.detail(() => { g.mat('cast', '#3a3430'); g.cyl(DX - 0.8, 0.785, DZ - 0.25, 0.07, 0.02, { segs: 10 }); g.tube([[DX - 0.8, 0.8, DZ - 0.25], [DX - 0.8, 1.15, DZ - 0.25], [DX - 0.6, 1.25, DZ - 0.15]], 0.01, { segs: 5 }); g.mat('cast', '#2f5d5a'); g.lathe(DX - 0.6, DZ - 0.15, [[0.1, 1.15], [0.05, 1.25], [0, 1.26]], { segs: 12, capBottom: false }); g.mat('diffuser', '#ffd59a', { emissive: 5 }); g.cyl(DX - 0.6, 1.14, DZ - 0.15, 0.08, 0.01, { segs: 12 }); });
  s.light({ at: [DX - 0.6, 1.05, DZ - 0.15], color: warm(2500), power: 1.0, range: 3.2, clip, radius: 0.08 });
  s.interact({ x: DX - 0.2, y: 0.95, z: DZ + 0.4, radius: 1.3, prompt: 'Read the watch book', onUse: async (gm) => {
    const h = gm.clock ? Math.floor(gm.clock.hours) : 13, hh = (h < 10 ? '0' : '') + h + ':00';
    await say(gm, 'The watch book', ['Open at today, in a small upright hand, one line an hour. ' + hh + ': 160 in. All steady. Nothing to report.', 'The line above is the same, and the one above that. Somebody has drawn a very small cup in the margin at eleven.', 'Further back, underlined twice: "A visitor sneezed by the rail. Heard it at the far wall, thirty metres off, and so did the visitor."']);
  } });
  s.interact({ x: DX + 0.6, y: 1.0, z: DZ + 0.3, radius: 0.9, prompt: 'Look at the dial', onUse: async (gm) => {
    const sun = gm.clock ? gm.clock.sun() : 1;
    await say(gm, ATTEND, ['That one reads what comes in. One hundred and sixty gigawatts, give or take a tenth, and it has not moved since the beam was booked.', 'What the drum does with it moves all day. Just now the sunline is taking ' + (sun > 0.05 ? 'about ' + Math.max(1, Math.round(12 * sun)) + ' of them' : 'none of them: it is dark') + '. Everything else is lamps, kettles, the Mill, the vats, the cabs and you.', 'I sit here so somebody is sitting here. Tea is two doors along, if you are going.']);
  } });

  // ---- strap chairs for visitors, facing the hall
  const CH = [[-5.2, '#2f5d5a'], [-4.4, '#a82a2a'], [-3.6, '#d6a640'], [-2.8, '#3a4a6a'], [2.0, '#7a3a9a'], [2.8, '#2f6f73']];
  CH.forEach((c, i) => prop(s, 'lm-axle-front.strapchair', c[0], 0.04, -10.6, PI, { cloth: c[1], strap: '#e9e1cf', tags: ['rail', 'watch'] }, { noSpots: i !== 4 }));
  seat(s, -4.4, 0.04, -10.6, PI, 'Sit and buckle the strap', { onSit: (gm) => toast(gm, 'You buckle the lap strap. Up here, without it, the first deep breath would lift you off the cushion.') });
  s.path([[0, HZ0 - 0.6], [0, -8.5], [1.8, -9.6]]);

  // ---- the card at the rail
  const card = { kind: 'notice', title: 'This room is quiet on purpose', lines: ['About 160 GW pass through here.', 'The bus is superconducting, at 20 K.', 'Direct current: nothing turns or hums.', 'No resistance, so no heat to shed.', 'The heat comes later, at the back axle,', 'and the back axle is the loudest room', 'in Chervil. Please keep this one quiet.'] };
  s.furniture(() => { g.mat('cast', '#4a4038'); g.tube([[0, 0.04, AZ + 0.35], [0, 1.1, AZ + 0.35]], 0.03, { segs: 8 }); g.mat('cast', '#b08a45', { rough: -0.1 }); g.box(-0.3, 1.08, AZ + 0.28, 0.3, 1.5, AZ + 0.33, { bevel: 0.01 }); });
  sign(s, card, 0, 1.29, AZ + 0.34, { face: 'Z', w: 0.5, h: 0.36, board: false });
  s.interact({ x: 0, y: 1.3, z: AZ + 1.0, radius: 1.3, prompt: 'Read the card at the rail', onUse: async (gm) => {
    await say(gm, 'The card', ['This room is quiet on purpose. About 160 gigawatts pass through it, the whole of Chervil\'s power, from the rectennas in front of the raft, and you can hear your own sleeve.', 'The bus is superconducting, kept at twenty kelvin with hydrogen from the jacket. It carries direct current, so nothing in here turns and nothing hums, and with no resistance there is no heat to shed.', 'The heat comes later. Every lamp and kettle in the drum turns its share of this into warmth, and the same 160 gigawatts leave through the back axle as a river of ammonia, in the loudest room in Chervil.', 'Under the card, in pencil: the attendant asks visitors not to whistle. It carries.']);
    find(gm, 'power-in');
  } });
  s.interact({ x: -3.0, y: 1.4, z: AZ + 0.7, radius: 1.4, prompt: 'Count the lamps on the far wall', onUse: async (gm) => {
    await say(gm, 'The lamps', ['A ring of small amber lamps on the far wall, a hundred metres across, going up both sides and over the top of the hall where the floor becomes the ceiling. A hundred and sixty of them: one for every gigawatt coming in.', 'They are the only sign that anything is happening. The conductors do not move, do not warm and make no sound. Frost sits on their clamps because they are colder than the air.', 'There is a white tick under every tenth lamp, so you can count by tens. All sixteen tens are lit.']);
  } });
  s.interact({ x: 3.0, y: 1.4, z: AZ + 0.7, radius: 1.4, prompt: 'Look at the conductors', onUse: async (gm) => {
    await say(gm, 'The conductors', ['Twenty-four of them come out of the joint on the axis in a ring, run a few metres toward you, and turn outward like the spokes of a wheel, down to the floor all round you and up over your head.', 'Each is as thick as a person, sleeved every few metres in ceramic collars, and goes down through the floor in a ribbed bushing into the drum, toward every lamp and kettle in it.', 'The floor you stand on is sixty metres from the axis. The rim is nearly three kilometres further down, and every one of them runs downhill from here.']);
  } });

  // light: the sconces by the door, the desk lamp, a low warm glow on the planks; the hall is left to its own lamps
  s.ambient({ box: [-AX, -0.2, AZ - 0.3, AX, AH, HZ0], sky: '#ffcf9a', ground: '#8a6248', power: 0.05, spec: 0.3 });
}
