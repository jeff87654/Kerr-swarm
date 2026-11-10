// The music director: which of the score's cues is playing, from where you are and what the hour is.
// The cues themselves are composed in src/audio/music.js. A place may still start one itself (the studio's model dawn,
// the Long Flight): the director stands back until that place stops it.
import { clamp } from '../core/util.js';

export function setupDirector(game) {
  const audio = game.audio;
  if (!audio || !audio.music) { game.music = { hold() {}, now: () => null }; return; }
  const raw = audio.music.bind(audio);
  let outside = null;                    // a cue a place started through audio.music
  let mine = null;                       // the key of the cue the director last asked for
  let hold = null;                       // a cue the story is holding (the card home and the credits)
  let arrivalUntil = -1;
  audio.music = (id, o) => { outside = id || null; if (id) mine = null; raw(id, o); };
  game.music = {
    hold(id, o) { hold = id ? { id, o: o || {} } : null; tick(true); },
    now: () => outside || (mine ? mine.split('@')[0] : null),
  };
  game.events.on('game:new', () => { arrivalUntil = game.time + 170; });

  // where the players stand: flat coordinates in a frame, handed to the audio as listener space every frame
  const at = (frameId, x, y, z) => () => { const f = game.world.frames.get(frameId); return f ? game.toListener(f, x, y, z) : [0, 0, -1e5]; };
  const spawnAt = (id, dy) => () => { const sp = game.spawns[id]; return sp ? game.toListener(sp.frame, sp.x, sp.y + (dy || 1.5), sp.z) : [0, 0, -1e5]; };
  const COURT = at('candlewick', 17.6, 1.7, 12.2);       // the bandstand in Wick Court
  const THIRD = at('terrace10', 0, 1.7, -3.2);           // the band shell on the Third
  const GREEN = at('hollow', 66, 2.6, 1850);             // the bandstand on the festival green
  const near = (frameId, x, z, r) => { const p = game.player; return !!p.frame && p.frame.id === frameId && Math.hypot(p.pos.x - x, p.pos.z - z) < r; };
  const nearSpawn = (id, r) => { const sp = game.spawns[id], p = game.player; return !!sp && p.frame === sp.frame && Math.hypot(p.pos.x - sp.x, p.pos.z - sp.z) < r && Math.abs(p.pos.y - sp.y) < 9; };

  function want() {
    if (hold) return hold;
    if (!game.started) return { id: 'title', o: { vol: 0.85, fade: 3 } };
    const c = game.clock, d = c.day, h = c.hours, p = game.player, fr = p.frame ? p.frame.id : '', place = game.zone ? game.zone.place : null;
    if (fr === 'spindle' || fr === 'cab') return null;
    // Oona's dawn, wherever the Hollow can be seen
    if (d === 3 && h >= 5.97 && h < 7.35 && (fr === 'hollow' || fr.indexOf('terrace') === 0 || fr === 'hub')) return { id: 'dawn', o: { vol: 0.8, fade: 4 }, dawn: true };
    // the first walk off the glide
    if (d === 1 && game.time < arrivalUntil && fr === 'station') return { id: 'arrival', o: { vol: 0.62, fade: 2.5 } };
    // the feast
    if (d === 3 && h >= 12.95 && h < 15.6 && (place === 'hall' || place === 'kitchen')) return { id: 'feast', o: { vol: 0.42, fade: 3 } };
    // reels on the Third, every evening and all Booking Day afternoon
    if (fr === 'terrace10' && ((h >= 17.5 && h < 23.4) || (d === 3 && h >= 11))) return { id: 'reel', o: { pos: THIRD, radius: 9, vol: 0.95, fade: 2 } };
    // Wick Court: the choir at half past seven on the Thursday, the band on the Thursday and on Booking Day
    if (near('candlewick', 17.6, 12.2, 95) && p.pos.y < 26) {
      if (d === 1 && h >= 19.5 && h < 20.2) return { id: 'choir', o: { pos: COURT, radius: 11, vol: 1, fade: 2 } };
      if ((d === 1 && h >= 18 && h < 22.6) || (d >= 3 && h >= 17.4 && h < 21.4)) return { id: 'court-evening', o: { pos: COURT, radius: 10, vol: 0.9, fade: 2.5 } };
    }
    // the festival green in the Hollow: the band on the Thursday evening and Booking Day, one flute on the Quiet
    if (near('hollow', 66, 1850, 190)) {
      if ((d === 1 && h >= 17.8 && h < 21) || (d === 3 && h >= 9.2 && h < 12.4) || (d === 3 && h >= 15.6 && h < 17.2)) return { id: 'court-evening', o: { pos: GREEN, radius: 16, vol: 1, fade: 2.5 } };
      if (d === 2 && h >= 14 && h < 18) return { id: 'busker', o: { pos: GREEN, radius: 14, vol: 1, fade: 2 } };
    }
    // one flute, by day: outside the Long Pipe on Thread Street, and in the Quaysides lane at the station
    if (h >= 10 && h < 17.5 && d !== 3) {
      if (nearSpawn('flutes', 46)) return { id: 'busker', o: { pos: spawnAt('flutes'), radius: 7, vol: 0.9, fade: 2 } };
      if (h >= 11 && h < 14.5 && nearSpawn('quayside', 50)) return { id: 'busker', o: { pos: spawnAt('quayside'), radius: 8, vol: 0.9, fade: 2 } };
    }
    return null;
  }

  function tick(now) {
    // the card home starts its tune when the card is written: wrap that hook once the story has registered it
    const S = game.story;
    if (S && S.fn && S.fn['card-home'] && !S.fn['card-home'].__dir) {
      const orig = S.fn['card-home'];
      const wrapped = async (G, x) => { hold = { id: 'card-home', o: { vol: 0.8, fade: 3 } }; tick(true); return orig(G, x); };
      wrapped.__dir = true; S.fn['card-home'] = wrapped; S.hook('card-home', wrapped);
    }
    if (outside && !hold) return;                      // a place has the music
    const w = want();
    const key = w ? w.id + '@' + (w.o && w.o.pos ? 'p' : 'n') + (w.o && w.o.radius ? w.o.radius : '') : null;
    if (w && w.dawn && audio.musicParam) audio.musicParam('progress', game.dawnProgress ? clamp(game.dawnProgress(), 0, 1) : 0.5);
    if (key === mine && !now) return;
    if (key === mine) return;
    mine = key; outside = null;
    if (w) raw(w.id, w.o); else raw(null, { fade: 3.5 });
  }
  let acc = 0;
  game.events.on('update', (dt) => { acc += dt || 0; if (acc < 0.5) return; acc = 0; try { tick(false); } catch (e) { console.error('[music] ' + (e && e.stack ? e.stack : e)); } });
  // the title's tune starts with the first gesture (the audio keeps the request until it is unlocked)
  try { tick(true); } catch (e) { console.error('[music] ' + e); }
}
