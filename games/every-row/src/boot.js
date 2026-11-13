// Start the flight over a list of worlds, show each world's card, and wire the few controls.
//
// Links:  ?w=<id> start at a world   ?only=<id> fly one world over and over   ?tier=0..3 fix the picture quality
// For the tools:  ?ui=0 no interface, begin at once   ?t=<seconds> start partway   ?freeze hold still   ?steady no camera breath
import { Engine, TIERS } from './core/engine.js';
import { mountUI } from './ui/ui.js';
import { Sound } from './core/audio.js';

export function boot(WORLDS) {
  const qs = new URLSearchParams(location.search);
  const canvas = document.getElementById('view');
  // the page's type is also lettered onto signs inside the worlds: ask for every face now, so that no world has to
  // letter its signs twice (once in a stand-in, again when the face arrives, in one long step)
  if (document.fonts && document.fonts.load) {
    for (const f of ["400 20px 'Cormorant Garamond'", "italic 400 20px 'Cormorant Garamond'", "italic 600 20px 'Cormorant Garamond'", "400 20px 'Barlow'", "500 20px 'Barlow'", "500 20px 'Barlow Condensed'", "500 20px 'Caveat'"]) document.fonts.load(f).catch(() => {});
  }
  const bare = qs.get('ui') === '0';
  // a link may name a place after the #: the flight starts there
  const hashWorld = WORLDS.some((d) => d.id === location.hash.slice(1)) ? location.hash.slice(1) : '';
  let ui = null, moved = false;
  const sound = new Sound();

  const engine = new Engine(canvas, WORLDS, {
    tier: qs.has('tier') ? parseInt(qs.get('tier'), 10) : 'auto',
    only: qs.get('only') || null,
    debug: qs.has('debug'),
    onWorld: (def, inst, crossed) => {
      app.world = def.id; app.crossings += crossed ? 1 : 0;
      // the address keeps the place, so a copied link opens where you were (a plain link stays plain until the first change)
      if (moved || hashWorld) { try { history.replaceState(null, '', '#' + def.id); } catch (e) { /* not allowed here */ } }
      moved = true;
      if (ui) ui.showCard(def);
      sound.setWorld(def.sound || null, def, crossed ? 3.5 : 1.5);
    },
  });

  // what the test tools and the console hold on to
  const app = window.app = { engine, WORLDS, TIERS, sound, world: null, crossings: 0, ready: false };

  if (qs.get('w')) engine.enqueue([qs.get('w')]);
  else if (hashWorld) engine.enqueue([hashWorld]);
  if (qs.has('t')) engine.startT = parseFloat(qs.get('t'));
  if (qs.has('steady') || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) engine.steady = true;
  // a phone starts a step lower; the frame-rate governor takes it from there either way
  if (!qs.has('tier') && window.matchMedia && window.matchMedia('(pointer: coarse)').matches && Math.min(window.innerWidth, window.innerHeight) < 820) engine.setTier(1);
  if (qs.has('pace')) engine.pace = parseFloat(qs.get('pace'));
  if (qs.has('one')) engine.oneStep = true;       // for the tools: one build step a frame, so a slow frame can be laid at one step's door

  if (bare) {
    if (qs.has('freeze')) engine.freeze = true;
  } else {
    // until Begin the first drum waits behind the title, dimmed and holding still
    engine.freeze = true; engine.fadeTarget = 0.5;
    ui = mountUI(document.getElementById('ui'), engine, WORLDS, {
      fixedTier: qs.has('tier'),
      onBegin: () => { engine.freeze = qs.has('freeze'); },
      sound: (on) => sound.enable(on),
    });
    setInterval(() => ui.setWaiting(engine.stats.waiting), 400);       // (also while the first drum is still being made, if Begin came first)
  }

  window.addEventListener('resize', () => engine.resize());
  document.addEventListener('visibilitychange', () => sound.duck(document.hidden));
  engine.start();
  const wait = setInterval(() => { if (engine.cur) { app.ready = true; clearInterval(wait); } }, 50);
  return app;
}
