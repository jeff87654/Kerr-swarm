// Game-side glue that every place relies on: using things, zones (what the HUD says and how the camera exposes),
// sound positions, the wallet, the heads-up display.
import { flatToRender, deckOf, gAt, ringOf, RING_NAMES, DRUM } from '../core/drum.js';
import { clamp, damp, lerp, fmtKwh } from '../core/util.js';

const _r = { x: 0, y: 0, z: 0 }, _e = { x: 0, y: 0, z: 0 }, _d = { x: 0, y: 0, z: 0 };

export function setupSystems(game) {
  const world = game.world, player = game.player, pipeline = game.pipeline, camera = game.camera;

  // ---- sound positions: flat coordinates of a frame -> listener space (x right, y up, z behind)
  game.toListener = (frame, x, y, z, out = [0, 0, 0]) => {
    flatToRender(frame, x, y, z, world.anchor, _r);
    const e = camera.matrixWorldInverse.elements;
    out[0] = e[0] * _r.x + e[4] * _r.y + e[8] * _r.z; out[1] = e[1] * _r.x + e[5] * _r.y + e[9] * _r.z; out[2] = e[2] * _r.x + e[6] * _r.y + e[10] * _r.z;
    return out;
  };
  game.sfxAt = (name, frame, x, y, z, o) => { if (game.audio) game.audio.play(name, Object.assign({ pos: game.toListener(frame, x, y, z) }, o)); };
  game.sfx = (name, o) => { if (game.audio) game.audio.play(name, o); };
  // a looping positional source that follows a point: returns the handle from audio.loop
  game.loopAt = (name, frame, x, y, z, o) => game.audio ? game.audio.loop(name, Object.assign({ pos: () => game.toListener(frame, x, y, z) }, o)) : { stop() {}, set() {} };

  // ---- the wallet: kWh. A day's dividend is 21.6.
  const wallet = game.wallet = {
    kwh: game.save.get('wallet', 21.6),
    can(v) { return this.kwh + 1e-6 >= v; },
    spend(v, what) { if (v <= 0) return true; if (!this.can(v)) { if (game.audio) game.audio.ui('deny'); return false; } this.kwh -= v; game.save.set('wallet', this.kwh); if (game.ui) { game.ui.hud.wallet(this.kwh, -v); if (what) game.ui.toast(what + '  −' + fmtKwh(v) + ' kWh', { kind: 'spend' }); } if (game.audio) game.audio.play('coin', { vol: 0.6 }); game.events.emit('wallet', -v); return true; },
    earn(v, what) { this.kwh += v; game.save.set('wallet', this.kwh); if (game.ui) { game.ui.hud.wallet(this.kwh, v); if (what) game.ui.toast(what + '  +' + fmtKwh(v) + ' kWh', { kind: 'gain' }); } game.events.emit('wallet', v); },
  };

  // ---- using things
  let current = null, promptText = null;
  game.busy = 0;                         // > 0 while a conversation or a scripted moment has the player
  let wasBusy = false, noUseUntil = 0;   // the key that closes a conversation's last line must not start it again
  const findInteract = () => {
    const held = game.busy > 0 || (game.ui && game.ui.modal);
    if (held) { wasBusy = true; return null; }
    if (wasBusy) { wasBusy = false; noUseUntil = game.time + 0.35; }
    if (player.locked && !player.seat) return null;
    player.eyePos(_e); player.lookDir(_d);
    let best = null, bestScore = 1e9;
    const L = world.interacts;
    for (let i = 0; i < L.length; i++) {
      const it = L[i]; if (it.frame !== player.frame) continue;
      if (it.scope && !(it.scope.active && it.scope.visible)) continue;
      let x, y, z; if (it.pos) { const p = it.pos(game); if (!p) continue; x = p[0]; y = p[1]; z = p[2]; } else { x = it.x; y = it.y; z = it.z; }
      const dx = x - _e.x, dy = y - _e.y, dz = z - _e.z, d = Math.hypot(dx, dy, dz);
      if (d > (it.radius || 1.6) + 0.4) continue;
      if (it.enabled && !it.enabled(game)) continue;
      const cos = d > 1e-3 ? (dx * _d.x + dy * _d.y + dz * _d.z) / d : 1;
      const ang = Math.acos(clamp(cos, -1, 1));
      const limit = d < 0.9 ? 1.2 : (it.wide ? 0.9 : 0.55);
      if (ang > limit) continue;
      const score = ang * 1.4 + d * 0.35 - (it.priority || 0);
      if (score < bestScore) { bestScore = score; best = it; }
    }
    return best;
  };
  game.events.on('update', (dt) => {
    current = findInteract();
    let text = null, kind = 'dot';
    if (current) { text = typeof current.prompt === 'function' ? current.prompt(game) : current.prompt; kind = current.kind === 'talk' ? 'talk' : 'use'; }
    if (game.ui) { if (text !== promptText) { game.ui.prompt(text, 'E'); promptText = text; } game.ui.reticle(text ? kind : 'dot'); }
    if (current && game.input.use() && game.time >= noUseUntil) {
      const it = current;
      try { const r = it.onUse(game, it); if (r && r.catch) r.catch((e) => console.error('[interact] ' + (e && e.stack ? e.stack : e))); } catch (e) { console.error('[interact] ' + (e && e.stack ? e.stack : e)); }
    }
    // triggers
    const T = world.triggers; const p = player.pos;
    for (let i = 0; i < T.length; i++) {
      const t = T[i]; if (t.frame !== player.frame) continue;
      const b = t.box; const inside = p.x >= Math.min(b[0], b[3]) && p.x <= Math.max(b[0], b[3]) && p.y >= Math.min(b[1], b[4]) - 0.1 && p.y <= Math.max(b[1], b[4]) && p.z >= Math.min(b[2], b[5]) && p.z <= Math.max(b[2], b[5]);
      if (inside && !t.inside) { t.inside = true; if (t.onEnter) { try { t.onEnter(game, t); } catch (e) { console.error('[trigger] ' + (e && e.stack ? e.stack : e)); } } if (t.once) { T.splice(i, 1); i--; } }
      else if (!inside && t.inside) { t.inside = false; if (t.onExit) { try { t.onExit(game, t); } catch (e) { console.error('[trigger] ' + e); } } }
    }
    world.update(dt);
  });

  // ---- zones: place name, exposure and grade, ambience and reverb, shadow set-up
  const base = { exposure: 1.0, autoKey: 0.16, autoMin: 0.4, autoMax: 2.6, bloom: 0.05, contrast: 1.1, saturation: 1.08, warmth: 0.25, vignette: 0.26 };
  const cur = Object.assign({}, base);
  game.zone = null; game.envOverride = null;
  let hudT = 0;
  game.events.on('prerender', (dt) => {
    player.eyePos(_e);
    const z = world.zoneAt(player.frame, _e.x, _e.y - 0.3, _e.z);
    if (z !== game.zone) {
      const prev = game.zone; game.zone = z;
      game.events.emit('zone', { zone: z, prev });
      if (game.audio) { game.audio.ambience((z && z.ambience) || 'none', { fade: 1.5 }); game.audio.reverb((z && z.reverb) || 'room'); }
    }
    const target = Object.assign({}, base, z && z.env, game.envOverride);
    const k = 1 - Math.exp(-dt * 2.5);
    for (const key in base) cur[key] = lerp(cur[key], target[key], k);
    Object.assign(pipeline.env, cur);
    game.roomHeadroom = (z && z.headroom) || 2.75;
    // sky shadows where the zone is open to the sunline or a luminous atrium ceiling
    if (z && z.sky) {
      const feet = player.frame.rho(player.pos.y);
      const top = z.skyTop !== undefined ? player.frame.rho(z.skyTop) : feet - 40;
      const open = player.frame.id === 'hollow';               // the Hollow needs far shadows too; an atrium only near ones
      world.shadowRange.sky0 = z.skyNear || (open ? 48 : 36); world.shadowRange.sky1 = z.skyFar !== undefined ? z.skyFar : (open ? 300 : 0);
      pipeline.env.shadowSky = { near: { halfExtent: world.shadowRange.sky0, rhoNear: top, rhoFar: feet + 3 }, far: world.shadowRange.sky1 > 0 ? { halfExtent: world.shadowRange.sky1, rhoNear: top, rhoFar: feet + 12 } : null };
      // one set of soft shadows is enough: under an open sky the lamps' own room shadows are switched off (by day, in the Hollow)
      world.shadowRange.room = open ? (game.clock.sun() > 0.06 ? 0 : 26) : 0;
    } else { pipeline.env.shadowSky = null; world.shadowRange.sky0 = 0; world.shadowRange.sky1 = 0; world.shadowRange.room = 26; }
    pipeline.env.sun = z && z.sun ? game.clock.sun() * (z.sunPower || 40) : 0;
    pipeline.env.far = z && z.far ? z.far : 900;
    // what glass reflects: lamplight indoors, the bright court or the Hollow where the zone is open to them
    if (game.fwdMats) {
      const lampK = game.clock.lamps(), open = z && z.sky ? (z.sun ? Math.max(0.03, game.clock.sun()) * 18 : 5 * lampK) : 0;
      const k2 = open > 0 ? open : 0.55 * lampK + 0.05;
      game.fwdMats.glass.uniforms.uEnvSky.value.setRGB(0.95 * k2, 0.8 * k2, 0.6 * k2);
      game.fwdMats.glass.uniforms.uEnvGround.value.setRGB(0.3 * k2, 0.24 * k2, 0.18 * k2);
    }
    // HUD
    hudT -= dt;
    if (game.ui && hudT <= 0) {
      hudT = 0.25;
      const rho = player.frame.rho(player.pos.y), deck = deckOf(rho), ring = ringOf(player.frame.zd(player.pos.z));
      const title = z ? (z.name || '').toUpperCase() : '';
      const where = rho <= DRUM.HOLLOW_R + 1 ? 'The Hollow' : 'Deck ' + deck;
      // the zone's own line if it has one (builders write the deck and street into it); otherwise the plain address
      const sub = z && z.sub ? z.sub : where + ' · Ring ' + RING_NAMES[ring - 1];
      game.ui.hud.place(title, /\d\s?g\b/.test(sub) ? sub : sub + ' · ' + player.gNow.toFixed(2) + ' g');
      game.ui.hud.clock(game.clock.label() + ' · ' + game.clock.dayName());
      game.ui.hud.weight(player.gNow);
    }
    if (game.ui) {
      // compass: 0 = spinward. The player's yaw is 0 facing the front cap (-z) and grows turning toward spinward (+x).
      let deg = (player.yaw * 180 / Math.PI - 90) % 360; if (deg < 0) deg += 360;
      game.ui.hud.compass(deg, game.compassMarkers ? game.compassMarkers() : []);
    }
  });

  // ---- cheap extra culling: other frames are never in view, and inside a layer of the city only the decks you could see are
  // drawn. A court (Wick Court, any block's atrium) is open through several decks; everything else is one deck at a time.
  world.courts.push({ frame: null, frameId: 'candlewick', x0: -35.5, x1: 35.5, z0: -21.5, z1: 27.5, scope: null });
  let camLevel = 0, camFrame = null, camCity = false;
  const openCourts = [];                 // the courts the camera is in or near, this frame
  game.events.on('prerender', () => {
    camFrame = player.frame; player.eyePos(_e);
    camLevel = Math.max(0, Math.floor((_e.y - 0.9) / 4));
    camCity = !!camFrame && (camFrame.id === 'candlewick' || camFrame.city === true);
    openCourts.length = 0;
    if (!camCity) return;
    for (const c of world.courts) {
      if (c.frame ? c.frame !== camFrame : c.frameId !== camFrame.id) continue;
      const dx = Math.max(c.x0 - _e.x, 0, _e.x - c.x1), dz = Math.max(c.z0 - _e.z, 0, _e.z - c.z1);
      if (Math.hypot(dx, dz) < 80) openCourts.push(c);
    }
  });
  // the Hollow, its terraces and the Spindle see each other; a deck sees only itself
  const group = (f) => (f.id === 'hollow' || f.hollowView) ? 'h' : f.id;
  world.culler = (u) => {
    const f = u.frame; if (u.always) return true;
    if (f !== camFrame) return camFrame ? group(f) === group(camFrame) && group(f) === 'h' : false;
    if (!camCity) return true;
    if (u.level === camLevel) return true;
    const x = u.origin[0] + u.center[0], z = u.origin[2] + u.center[2];
    for (let i = 0; i < openCourts.length; i++) { const c = openCourts[i]; if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return true; }
    return false;
  };

  // ---- footsteps and landings
  game.events.on('player:step', (e) => { if (game.audio) game.audio.footstep(e.surf || 'stone', { g: e.g, speed: e.speed }); });
  game.events.on('player:land', (e) => { if (game.audio) game.audio.footstep(e.surf || 'stone', { g: e.g, speed: e.impact, land: true }); });
}
