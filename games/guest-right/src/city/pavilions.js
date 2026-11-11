// Lift pavilions on the Hollow's floor. The lift cores of the decks below come up through the floor where the paths
// cross (every 170 m: src/world/land.js, nearestPavilion). Each crossing has a small pavilion with a cab berth and the
// head of the last stair, which goes down to the block underneath. They are built round the player as they walk and
// taken down behind, like the blocks of the city.
import { prop } from '../world/props.js';
import { sign } from '../world/signs.js';
import { landAt, heightAt, wrapX, BIOME } from '../world/land.js';
import { LAYERS, BLOCK_Z, J_MIN, J_MAX, wrapI } from '../core/layout.js';

const STEP = 170, HOLLOW_R = 1500, CIRC = 2 * Math.PI * HOLLOW_R;
const TINTS = ['#2f6f73', '#8a2f3c', '#33407a', '#6b7a3a', '#5b3a6e', '#a8412b'];
const LINES = [
  'The plate on the drum of the core says: 5,200 cores, one of them here. A cab from this berth goes to any of the others.',
  'The stair door is kept on the latch. Six decks down is somebody\'s avenue, and their hall, and their lunch.',
  'A card under the glass: "If you came up for the light, sit down. If you came up for the lake, it is that way."',
  'Scratched small into the brass, by many hands over many years: the names of people who met here.',
];

// the crossing nearest a point, as integers
const gridOf = (x, z) => ({ ix: Math.round(wrapX(x) / STEP), iz: Math.round((z - 50) / STEP) });
const posOf = (ix, iz) => ({ x: ix * STEP, z: iz * STEP + 50 });
// can a pavilion stand there: on dry land, away from the end walls, the lake pavilion and the seam where the floor's x wraps
function standsAt(x, z) {
  if (z < 150 || z > 3600 || Math.abs(x) > CIRC / 2 - 120) return false;
  if (Math.hypot(x - 0, z - 1700) < 130) return false;
  const l = landAt(x, z); return l.biome !== BIOME.LAKE && l.biome !== BIOME.BEACH;
}

export function createPavilions(game, city) {
  const W = game.world, built = new Map();          // 'ix:iz' -> scope
  const top = LAYERS.length - 1, ly = LAYERS[top];
  // the block of the top decks that lies under a point of the Hollow's floor
  const cellUnder = (x, z) => ({ L: top, i: wrapI(top, Math.round((wrapX(x) / HOLLOW_R) * ly.rho0 / ly.pitch)), j: Math.max(J_MIN, Math.min(J_MAX, Math.round(z / BLOCK_Z))) });

  // A pavilion's plates are the same on every one and are kept for good: they must not land among the signs lent to a
  // region or a block that happens to be building as the player walks by.
  function build(ix, iz) {
    const atlas = game.atlas, g0 = atlas ? atlas.group : null; if (atlas) atlas.group = null;
    try { return raise(ix, iz); } finally { if (atlas) atlas.group = g0; }
  }
  function raise(ix, iz) {
    const key = ix + ':' + iz; if (built.has(key)) return built.get(key);
    const f = W.frames.get('hollow'); if (!f) return null;
    const { x, z } = posOf(ix, iz); if (!standsAt(x, z)) return null;
    const y = heightAt(x, z), cell = cellUnder(x, z), info = city.info(cell), tint = TINTS[Math.abs(ix * 7 + iz * 3) % TINTS.length];
    const s = W.scope('pav:' + key, f, { origin: [x, z] }), g = s.g;
    // a round stone floor, the enamelled top of the lift core, eight slim columns and a lantern roof
    g.mat('stone', '#c9bda6'); g.lathe(x, z, [[3.5, y - 0.3], [3.5, y + 0.1], [3.4, y + 0.12], [0, y + 0.12]], { segs: 24 });
    g.mat('mosaic', tint); g.lathe(x, z, [[3.1, y + 0.125], [2.7, y + 0.125]], { segs: 24 });
    s.flush({ tier: 's' });
    g.mat('paint', tint, { rough: -0.2 }); g.lathe(x, z, [[1.55, y + 0.12], [1.55, y + 0.5], [1.5, y + 0.52], [1.5, y + 2.5], [1.56, y + 2.54], [1.56, y + 2.7], [0, y + 2.75]], { segs: 20 });
    g.mat('cast', '#c8a45a'); g.lathe(x, z, [[1.57, y + 1.02], [1.57, y + 1.08]], { segs: 20 }); g.lathe(x, z, [[1.57, y + 2.42], [1.57, y + 2.5]], { segs: 20 });
    s.flush({ tier: 's', cast: true });
    g.mat('paint', '#2f3a36');
    for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; g.tube([[x + Math.sin(a) * 3.0, y + 0.12, z + Math.cos(a) * 3.0], [x + Math.sin(a) * 3.0, y + 2.9, z + Math.cos(a) * 3.0]], 0.055, { segs: 8 }); }
    g.mat('paint', '#efe5d1'); g.lathe(x, z, [[0.4, y + 3.72], [3.55, y + 2.98], [3.7, y + 2.86]], { segs: 8 });
    g.mat('paint', tint); g.lathe(x, z, [[3.7, y + 2.86], [3.6, y + 3.0], [0.45, y + 3.78], [0.2, y + 3.95]], { segs: 8 });
    g.mat('diffuser', '#ffe9c0', { emissive: 6, lamp: true }); g.ball(x, y + 4.12, z, 0.22, 0.22, 0.22, { segs: 12, rings: 8 });
    s.flush({ tier: 's', cast: true });
    s.light({ at: [x, y + 2.75, z + 2.2], color: '#ffdcae', power: 2.2, range: 7, lamp: true, nospec: true });
    s.light({ at: [x, y + 2.75, z - 2.2], color: '#ffdcae', power: 2.2, range: 7, lamp: true, nospec: true });
    // the berth door (spinward side) and the stair door (anti side), each with its small lamp and plate
    g.mat('brushed', '#b9b4aa'); g.box(x + 1.5, y + 0.12, z - 0.55, x + 1.56, y + 2.2, z + 0.55);
    g.mat('cast', '#c8a45a'); g.box(x + 1.5, y + 2.2, z - 0.66, x + 1.6, y + 2.32, z + 0.66);
    g.mat('diffuser', '#9fffd8', { emissive: 5, lamp: true }); g.box(x + 1.56, y + 2.38, z - 0.07, x + 1.6, y + 2.5, z + 0.07);
    g.mat('wood', '#6b4a2f'); g.box(x - 1.56, y + 0.12, z - 0.5, x - 1.5, y + 2.15, z + 0.5, { bevel: 0.01 });
    g.mat('cast', '#c8a45a'); g.box(x - 1.6, y + 1.05, z + 0.32, x - 1.56, y + 1.11, z + 0.4);
    s.flush({ tier: 's' });
    sign(s, { kind: 'plate', text: 'CABS', lines: ['one party to a cab'] }, x + 1.585, y + 1.6, z + 0.95, { face: 'X', w: 0.4, h: 0.18 });
    sign(s, { kind: 'plate', text: 'THE LAST STAIR', lines: ['down to the top decks'] }, x - 1.585, y + 1.6, z - 0.95, { face: 'x', w: 0.46, h: 0.18 });
    prop(s, 'bench', x, y + 0.12, z + 2.35, Math.PI, { w: 1.6, back: true, wood: '#7a5233' }, { noSpots: true });
    prop(s, 'plant', x + 2.2, y + 0.12, z - 2.2, 0, { kind: 'broad', size: 1.2, pot: '#a3563a' });
    // colliders: the floor, the core
    s.solid(x - 2.5, y - 0.5, z - 2.5, x + 2.5, y + 0.12, z + 2.5, { surf: 'stone' });
    s.post(x, z, 1.58, y, y + 2.8);
    const stopId = 'pav:' + key;
    s.interact({ x: x + 2.2, y: y + 1.3, z, radius: 1.5, prompt: 'Call a cab', onUse: (gm) => { if (gm.cab) gm.cab.open(stopId); } });
    s.interact({ x: x - 2.2, y: y + 1.3, z, radius: 1.5, prompt: () => 'Go down the last stair to ' + info.name, onUse: (gm) => gm.city.stairs(cell, -1) });
    s.interact({ x, y: y + 1.4, z: z + 1.9, radius: 1.3, priority: -0.2, prompt: 'Read the plate on the core', onUse: (gm) => { if (gm.ui) gm.ui.toast(LINES[Math.abs(ix * 5 + iz) % LINES.length], { kind: 'info', dur: 7 }); } });
    // its zone takes after the Hollow's own (the open sky's light, shadows and sound), with its own name
    const hz = W.zoneAt(f, x, y + 1, z);
    const zn = s.zoneBox(Object.assign({}, hz || { ambience: 'hollow-day', reverb: 'open' }, { allRound: false, id: 'pav:' + key, place: undefined, box: [x - 3.6, y - 1, z - 3.6, x + 3.6, y + 4.4, z + 3.6], name: 'A lift pavilion', sub: 'over ' + info.name + ' · decks ' + info.d0 + ' to ' + info.d1 }));
    if (hz) s.every(() => { zn.ambience = hz.ambience; });
    s.finish();
    built.set(key, s);
    return s;
  }
  function drop(key) { const s = built.get(key); if (s) { s.dispose(); built.delete(key); } }

  // keep the nine crossings round the player built while they are in the Hollow
  let acc = 0, away = 0;
  game.events.on('update', (dt) => {
    acc += dt; if (acc < 0.5) return; acc = 0;
    const p = game.player; if (!p.frame) return;
    if (p.frame.id !== 'hollow') { away += 0.5; if (away > 8 && built.size) for (const k of [...built.keys()]) drop(k); return; }
    away = 0;
    const c = gridOf(p.pos.x, p.pos.z), keep = new Set();
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const k = (c.ix + dx) + ':' + (c.iz + dz); keep.add(k); try { build(c.ix + dx, c.iz + dz); } catch (e) { console.error('[pavilion] ' + (e && e.stack ? e.stack : e)); } }
    for (const k of [...built.keys()]) if (!keep.has(k)) drop(k);
  });

  return {
    built, cellUnder,
    // the pavilion nearest above a block: where to stand when you come up into the Hollow there, or null if there is none
    // within reach (the lake, an end wall)
    over(cell) {
      const lyc = LAYERS[cell.L], th = (((cell.i + lyc.N / 2) % lyc.N) - lyc.N / 2) * lyc.pitch / lyc.rho0;
      const g0 = gridOf(th * HOLLOW_R, cell.j * BLOCK_Z);
      for (const d of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
        const q = posOf(g0.ix + d[0], g0.iz + d[1]);
        if (standsAt(q.x, q.z)) { build(g0.ix + d[0], g0.iz + d[1]); return { frame: W.frames.get('hollow'), x: q.x + 2.5, y: heightAt(q.x, q.z) + 0.14, z: q.z, yaw: Math.PI / 2, ix: g0.ix + d[0], iz: g0.iz + d[1] }; }
      }
      return null;
    },
  };
}
