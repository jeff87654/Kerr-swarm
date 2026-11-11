// The Breadboard: the Hollow's playing grounds, on the open meadow anti of the lake and toward the back wall, where the
// drum is loudest out of doors. Chervil's grounds, not Sorrel's: their names are their own.
//   1. The Oval (lm_hollow_grounds_track.js): a 400 m half-g track with its straights along the axis. The back bend is
//      run spinward and weighs you more (the Kettle, banked); the front bend is run anti and weighs you less (the Lid,
//      railed). A stand, the timing hut and its lap board, the start lamp, and a lap to run against the clock.
//   2. The pitches (lm_hollow_grounds_pitches.js): four of the drum's spinball pitches side by side, the three arrows at
//      each centre, gates of hoops at the spin and anti ends, and a practice pitch with a throwing mark.
//   3. The pavilion (lm_hollow_grounds_pavilion.js): a veranda with the tea urn, loan shoes, balls on loan, and the
//      scoreboard, with today's fixtures between real blocks of Chervil.
// The cab sets you down at the lift pavilion between the pitches and the track, at (-680, 2430).
import { heightAt, nearestPavilion } from '../world/land.js';
import { signpost } from './hollow_parts.js';
import { T, P, V, OPEN, ENV, pz0 } from './lm_hollow_grounds_parts.js';
import { buildTrack } from './lm_hollow_grounds_track.js';
import { buildPitches } from './lm_hollow_grounds_pitches.js';
import { buildPavilion } from './lm_hollow_grounds_pavilion.js';

const frameWait = () => new Promise((res) => { let done = false; const go = () => { if (!done) { done = true; res(); } }; requestAnimationFrame(go); setTimeout(go, 50); });

export const place = {
  id: 'lm-hollow-grounds', name: 'The Breadboard', order: 10,
  region: 'hollow-grounds',
  near: { frame: 'hollow', x: -900, z: 2300, r: 450 },
  stops: [{ id: 'hollow-grounds', name: 'The Breadboard', sub: 'the Hollow · the playing grounds · track and spinball', group: 'The Hollow', spawn: 'hollow-grounds', deck: 376, zd: 2300 }],
  async build(game) {
    const t0 = performance.now(), ms = [];
    const f = game.world.frame('hollow', 1500, 0, 0);
    const zones = [];
    let t = performance.now();
    buildTrack(game, f, zones); ms.push(performance.now() - t);
    await frameWait();
    t = performance.now(); buildPitches(game, f, zones); ms.push(performance.now() - t);
    await frameWait();
    t = performance.now(); buildPavilion(game, f, zones); ms.push(performance.now() - t);
    // the spawn: beside the lift pavilion between the pitches and the track, facing spinward, with a signpost
    const q = nearestPavilion(-680, 2430, {});
    game.spawns['hollow-grounds'] = { frame: f, x: q.x + 2.5, y: heightAt(q.x, q.z) + 0.14, z: q.z, yaw: Math.PI / 2 };
    const s = game.world.scope('lmhg-site', f);
    signpost(s, q.x + 6.2, q.z - 4.6, [
      { dir: 'X', text: 'The Oval', sub: 'half-g track · the stand · 20 m', col: '#efe6d2' },
      { dir: 'x', text: 'The pitches', sub: 'field spinball · 45 m', col: '#efe6d2' },
      { dir: 'z', text: 'The pavilion', sub: 'tea · shoes and balls on loan', col: '#f3d9a0' },
    ]);
    // the zones: the grounds as a whole (the place the journal knows), and its parts by name
    const zone = (o) => { const z = s.zoneBox(Object.assign({}, OPEN, { env: Object.assign({}, ENV) }, o)); zones.push(z); return z; };
    zone({ id: 'hollow-grounds', place: 'hollow-grounds', box: [-760, -5, 2280, -550, 40, 2525], name: 'The Breadboard', sub: 'the Hollow’s playing grounds · half a g' });
    zone({ id: 'lmhg-oval', box: [T.X - T.RE - 3, -5, T.ZL - T.RE - 3, T.X + T.RE + 3, 40, T.ZH + T.RE + 3.5], name: 'The Oval', sub: 'the Breadboard · four hundred metres at half a g' });
    zone({ id: 'lmhg-pitches', box: [P.CX - P.L / 2 - 3.5, -5, pz0(0) - 3.5, P.CX + P.L / 2 + 3.0, 40, pz0(3) + P.W + 3.5], name: 'The pitches', sub: 'the Breadboard · field spinball, seven a side' });
    zone({ id: 'lmhg-pavilion', box: [V.XV - 0.6, -5, V.Z0 - 0.6, V.XB + 0.6, 40, V.Z1 + 0.6], name: 'The pavilion', sub: 'the Breadboard · tea, shoes and balls on loan' });
    zone({ id: 'lmhg-stand', box: [-667, -5, 2435, -660.6, 40, 2455.5], name: 'The stand', sub: 'the Oval · the home straight' });
    s.finish();
    // the zones follow the land's day, dusk and night beds, as the first game's do
    const zs = zones.filter((z) => z.ambience && z.ambience.indexOf('hollow') === 0);
    s.every((dt, gm) => { const lz = gm.hollow && gm.hollow.zone; if (!lz) return; for (const z of zs) z.ambience = lz.ambience; });
    console.log('[lm-hollow-grounds] built in ' + (performance.now() - t0).toFixed(0) + ' ms (track ' + ms[0].toFixed(0) + ', pitches ' + ms[1].toFixed(0) + ', pavilion ' + ms[2].toFixed(0) + ')');
  },
};
