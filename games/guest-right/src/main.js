// Guest-Right: start-up and the frame loop.
import * as THREE from 'three';
import { LightSystem } from './render/lights.js';
import { Pipeline } from './render/pipeline.js';
import { generateMaterials } from './render/texgen.js';
import { worldUniforms } from './render/worldmat.js';
import { World } from './world/world.js';
import { Input } from './core/input.js';
import { Save, Settings, Clock, makeEvents } from './core/state.js';
import { Player } from './sim/player.js';
import { DRUM, deckOf, gAt, ringOf, RING_NAMES } from './core/drum.js';
import { Atlas } from './render/atlas.js';
import { createForwardMaterials } from './render/fwdmat.js';
import { loadSignFonts } from './world/signs.js';
import { setupSystems } from './game/systems.js';
import { setupStory } from './game/story.js';
import { createCab } from './game/cab.js';
import { setupFlow } from './game/flow.js';
import { setupDirector } from './game/director.js';
import { createRegions } from './game/regions.js';

function params() { const p = {}; try { new URLSearchParams(window.location.search).forEach((v, k) => { p[k] = v === '' ? true : v; }); } catch (e) { /* none */ } return p; }
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

// A plain message in place of the game when it cannot run (no WebGL 2, or something broke while starting).
function fatal(title, text, detail) {
  try {
    const d = document.createElement('div'); d.className = 'gr-fatal';
    const b = document.createElement('div'); const h1 = document.createElement('h1'); h1.textContent = title; const p = document.createElement('p'); p.textContent = text; b.appendChild(h1); b.appendChild(p);
    if (detail) { const pre = document.createElement('pre'); pre.textContent = detail; b.appendChild(pre); }
    d.appendChild(b); document.body.appendChild(d);
    const ui = document.getElementById('gr-ui'); if (ui) ui.style.display = 'none';
  } catch (e) { /* nothing to draw on */ }
}

// boot({ canvas, places: [place modules], createUI, createAudio })
export async function boot(opts = {}) {
  try { return await start(opts); }
  catch (e) { console.error('[boot] ' + (e && e.stack ? e.stack : e)); fatal('Guest-Right', 'The game could not start here.', String(e && e.message ? e.message : e)); return null; }
}
async function start(opts) {
  const P = params();
  const canvas = opts.canvas || document.getElementById('gr-canvas');
  { // the game draws with WebGL 2 and floating-point targets: say so plainly where they are missing
    let ok = false; try { const t = document.createElement('canvas').getContext('webgl2'); ok = !!(t && t.getExtension('EXT_color_buffer_float')); } catch (e) { ok = false; }
    if (!ok) { fatal('Guest-Right', 'This game needs WebGL 2 with floating-point render targets, which this browser or device does not offer here. A recent desktop browser will run it.'); return null; }
  }
  const events = makeEvents();
  const save = new Save();
  const settings = new Settings(save, events);
  const game = { events, save, settings, params: P, ready: false, places: {}, areas: {}, flags: {}, spawns: {}, time: 0, dtReal: 0 };
  window.game = game;
  if (P.q) settings.v.quality = P.q;
  else if (!save.get('settings', null)) {       // first run: start phones and small machines on the light setting
    let small = false; try { small = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.deviceMemory && navigator.deviceMemory <= 4); } catch (e) { small = false; }
    if (small) settings.v.quality = 'low';
  }

  const lights = game.lights = new LightSystem();
  const pipeline = game.pipeline = new Pipeline(canvas, lights, { quality: settings.get('quality'), preserve: !!P.preserve });
  game.renderer = pipeline.renderer;
  const world = game.world = new World(lights);
  const input = game.input = new Input(canvas);
  const clock = game.clock = new Clock(game);
  const camera = game.camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 900);
  camera.matrixAutoUpdate = false; camera.matrixWorldAutoUpdate = false;
  const player = game.player = new Player(game);
  const anchor = world.anchor;
  world.game = game;
  game.env = (o) => Object.assign(pipeline.env, o);
  await loadSignFonts();
  // ten permanent pages for the places built at start-up, eight lent to regions and city blocks as they come and go
  const atlas = game.atlas = new Atlas(pipeline.renderer, { size: settings.get('quality') === 'low' ? 1024 : 2048, pages: 10, dynamic: 8 });
  worldUniforms.tAtlas.value = atlas.texture;
  const fwd = game.fwdMats = createForwardMaterials(pipeline);
  world.fwdMats.glass = fwd.glass; world.fwdMats.glow = fwd.glow;
  // sound and interface are optional parts: the game runs without them (and the dev pages test them alone)
  try { game.audio = opts.createAudio ? opts.createAudio(game) : null; } catch (e) { console.error('[audio] ' + (e && e.stack ? e.stack : e)); game.audio = null; }
  try { game.ui = opts.createUI ? opts.createUI(game) : null; } catch (e) { console.error('[ui] ' + (e && e.stack ? e.stack : e)); game.ui = null; }
  setupSystems(game);
  setupStory(game);
  game.cab = createCab(game);
  game.regions = createRegions(game);
  setupFlow(game);
  setupDirector(game);
  const progress = (p, label) => { if (game.ui) game.ui.loading.set(p, label); if (opts.onProgress) opts.onProgress(p, label); };
  if (game.ui) { game.ui.hud.show(false); game.ui.loading.show(); game.ui.loading.tip(game.tip()); }
  let tipT = performance.now();
  await nextFrame();
  input.onFirstGesture = () => { if (game.audio) game.audio.unlock(); };

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, P.pr ? parseFloat(P.pr) : 1.5);
    pipeline.scaleOverride = settings.get('renderScale') < 1 ? pipeline.quality.scale * settings.get('renderScale') : null;
    pipeline.setSize(w, h, pr);
    camera.aspect = w / h;
  };
  window.addEventListener('resize', resize);
  resize();
  events.on('settings', (e) => { if (e.key === 'quality') { pipeline.setQuality(e.value); resize(); if (game.people && game.people.setDensity) game.people.setDensity({ low: 0.4, medium: 0.7, high: 1, ultra: 1 }[e.value] || 1); } if (e.key === 'renderScale') resize(); });

  // --- materials
  const tm0 = performance.now();
  const gen = generateMaterials(pipeline.renderer, settings.get('quality') === 'low' ? 256 : 512);
  await gen.prepare();
  console.log('[boot] material shaders ' + (performance.now() - tm0).toFixed(0) + ' ms');
  for (let i = 0; i < gen.count; i++) {
    gen.step(i);
    if (i % 6 === 5) progress(0.05 + 0.25 * (i + 1) / gen.count, 'Mixing materials');
    if (i % 6 === 5) await nextFrame();
  }
  gen.finish();
  console.log('[boot] materials ' + (performance.now() - tm0).toFixed(0) + ' ms');
  worldUniforms.tAlb.value = gen.alb; worldUniforms.tNrm.value = gen.nrm;
  game.materials = gen;

  // --- places
  const list = (opts.places || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const only = P.only ? String(P.only).split(',') : null;
  let n = 0;
  for (const pl of list) {
    n++;
    if (only ? (only.indexOf(pl.id) < 0 && !pl.always) : pl.testOnly) continue;
    // a place that belongs to a region waits until somebody goes there (unless it was asked for by name, for testing)
    if (pl.region && !(only && only.indexOf(pl.id) >= 0)) { game.places[pl.id] = pl; game.regions.register(pl); continue; }
    const t0 = performance.now();
    try {
      game.places[pl.id] = pl;
      await pl.build(game);
      for (const st of pl.stops || []) { const sp = game.spawns[st.spawn]; if (sp) game.cab.addStop(Object.assign({}, st, { frame: sp.frame, x: sp.x, y: sp.y, z: sp.z, yaw: sp.yaw || 0 })); }
    } catch (e) { console.error('[place ' + pl.id + '] failed to build: ' + (e && e.stack ? e.stack : e)); }
    const ms = performance.now() - t0; if (ms > 250) console.log('[place ' + pl.id + '] built in ' + ms.toFixed(0) + ' ms');
    progress(0.3 + 0.68 * n / list.length, 'Building ' + (pl.name || pl.id).toLowerCase());
    if (game.ui && performance.now() - tipT > 4500) { tipT = performance.now(); game.ui.loading.tip(game.tip()); }
    await nextFrame();
  }

  console.log('[boot] sign atlas ' + (atlas.usage().permanent * 100).toFixed(0) + '% full, ' + atlas.count + ' signs');
  // --- start position
  const spawns = game.spawns;
  const sp = spawns[P.at] || spawns.start || Object.values(spawns)[0];
  if (sp) player.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw || 0, sp.pitch || 0);
  if (P.pos) { const a = String(P.pos).split(',').map(Number); player.place(player.frame, a[0], a[1], a[2]); }
  if (P.yaw !== undefined) player.yaw = parseFloat(P.yaw);
  if (P.pitch !== undefined) player.pitch = parseFloat(P.pitch);
  if (P.t !== undefined) clock.minutes = parseFloat(P.t) * 60;
  if (P.day !== undefined) clock.day = parseInt(P.day, 10);
  if (P.freeze) clock.paused = true;
  if (P.debug) pipeline.debug = parseInt(P.debug, 10) || 0;

  game.fps = 0; game.perf = { update: 0, prerender: 0, render: 0 };      // milliseconds of script per frame, smoothed
  let last = performance.now(), fpsT = 0, fpsN = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (!(dt > 0)) dt = 1 / 60; if (dt > 0.1) dt = 0.1;
    game.dtReal = dt; game.time += dt;
    fpsT += dt; fpsN++; if (fpsT >= 0.5) { game.fps = fpsN / fpsT; fpsT = 0; fpsN = 0; }

    if (!game.paused) clock.update(dt);
    const perf = game.perf, t0 = performance.now();
    if (player.frame) {
      if (!game.paused) { player.update(dt); events.emit('update', dt); }
      const t1 = performance.now(); perf.update += (t1 - t0 - perf.update) * 0.05;
      player.applyCamera(camera, anchor);
      // the place the camera is in decides the light levels and the look
      lights.levels.lamps = clock.lamps(); lights.levels.night = clock.night(); lights.levels.sun = clock.sun();
      worldUniforms.uLamps.value = lights.levels.lamps; worldUniforms.uNight.value = lights.levels.night;
      // overhead room shadow: from just under the ceiling of the deck the eye is in, to a little under the floor
      const feet = player.frame.rho(player.pos.y);
      const sr = pipeline.env.shadowRoom;
      sr.rhoNear = feet - (game.roomHeadroom || 2.75); sr.rhoFar = feet + 0.6;
      events.emit('prerender', dt);
      fwd.res.set(pipeline.w, pipeline.h);
      atlas.flush();
      const t2 = performance.now(); perf.prerender += (t2 - t1 - perf.prerender) * 0.05;
      pipeline.render(world, camera, anchor, dt);
      perf.render += (performance.now() - t2 - perf.render) * 0.05;
      if (game.audio) game.audio.update(dt);
      if (game.ui) game.ui.update(dt);
    }
    input.endFrame();
  };
  game.ready = true;
  events.emit('ready');
  requestAnimationFrame(frame);
  game.run();
  return game;
}

// A readable address for wherever a drum coordinate is.
export function addressOf(theta, rho, z) {
  const deck = deckOf(rho);
  return { deck, ring: ringOf(z), ringName: RING_NAMES[ringOf(z) - 1], g: gAt(rho), hollow: rho <= DRUM.HOLLOW_R + 2 };
}
