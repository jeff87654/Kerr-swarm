// The game's flow: the title, beginning and continuing, chapters, pausing, the keys that open screens,
// photo mode, the map's data, and throwing a spinball.
import * as THREE from 'three';
import { TIPS } from '../content/tips.js';
import { Geo, MeshBuf } from '../world/meshbuilder.js';
import { freeAccel, deckOf, ringOf, DRUM } from '../core/drum.js';
import { clamp } from '../core/util.js';

// Places a chapter can start from: [id, title, sub, spawn, day, hour]
const CHAPTERS = [
  ['arrival', 'Arrival', 'Thursday morning, Station Ring 2', 'start', 1, 9.667],
  ['table', 'The long table', 'Thursday, one o’clock, the hall', 'hall', 1, 12.9],
  ['evening', 'An evening in the court', 'Thursday, eight in the evening', 'court', 1, 20],
  ['quiet', 'The Quiet', 'the day before Booking Day', 'court', 2, 10],
  ['dawn', 'Oona’s dawn', 'Booking Day, a little before six', 'dawn-terrace', 3, 5.85],
  ['ledger', 'The Ledger is read', 'Booking Day, half past eight', 'ledger', 3, 8.4],
  ['feast', 'The feast', 'Booking Day, one o’clock', 'hall', 3, 12.9],
  ['flight', 'The Long Flight', 'Booking night, ten o’clock', 'flying-hall', 3, 21.9],
  ['hollow', 'The Hollow at noon', 'free to wander', 'hollow', 1, 11.5],
];

export function setupFlow(game) {
  const ui = game.ui, player = game.player, clock = game.clock, input = game.input, pipeline = game.pipeline, world = game.world;
  game.paused = false;
  // speech bubbles pinned to the world stay out of the way of full screens (the title, the journal, the map)
  try { const st = document.createElement('style'); st.textContent = '#gr-ui.gr-has-screen .gr-l-world{visibility:hidden}'; document.head.appendChild(st); } catch (e) { /* no document */ }
  const spawnOf = (id) => game.spawns[id] || game.spawns.start || game.spawns.court || Object.values(game.spawns)[0];
  const go = (spawnId, day, hour) => { const sp = spawnOf(spawnId); if (sp) player.place(sp.frame, sp.x, sp.y, sp.z, sp.yaw || 0, sp.pitch || 0); if (day) clock.set(day, hour); pipeline.resetHistory(); };
  game.go = go;                           // tests and chapters: stand at a named spawn, optionally at a day and hour

  // ---- photo mode
  let photoKeep = null;
  game.photo = {
    set(o) { if (o.fov !== undefined) player.fovOverride = o.fov; if (o.ev !== undefined) game.envOverride = Object.assign({}, game.envOverride, { exposure: Math.pow(2, o.ev) }); if (o.hour !== undefined) { clock.minutes = o.hour * 60; game.events.emit('clock:jump'); } },
    take() {
      try {
        pipeline.render(world, game.camera, world.anchor, 0);
        const src = pipeline.renderer.domElement, c = document.createElement('canvas'); c.width = 640; c.height = Math.round(640 * src.height / src.width);
        c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.82);
        if (game.journal) game.journal.addCard({ id: 'c' + Date.now(), src: url, place: game.zone ? game.zone.name : 'Chervil', day: clock.day, hour: clock.label() });
        if (game.audio) game.audio.play('lamp-click', { vol: 0.7 });
        return url;
      } catch (e) { console.error('[photo] ' + e); return null; }
    },
  };
  game.events.on('ui:photo', (on) => {
    if (on) { photoKeep = { minutes: clock.minutes, paused: clock.paused }; clock.paused = true; }
    else { player.fovOverride = null; game.envOverride = null; if (photoKeep) { clock.minutes = photoKeep.minutes; clock.paused = photoKeep.paused; photoKeep = null; } }
  });

  // ---- the map
  game.mapData = () => {
    const f = player.frame; const rho = f.rho(player.pos.y);
    const lines = [], labels = [];
    for (const z of world.zones) {
      if (z.frame !== f || z.allRound) continue;
      if (Math.abs((z.y0 + z.y1) / 2 - player.pos.y) > 4 && !(player.pos.y >= z.y0 - 0.5 && player.pos.y <= z.y1)) continue;
      lines.push([z.x0, z.z0, z.x1, z.z0, 'wall'], [z.x1, z.z0, z.x1, z.z1, 'wall'], [z.x1, z.z1, z.x0, z.z1, 'wall'], [z.x0, z.z1, z.x0, z.z0, 'wall']);
      if (z.name && (z.x1 - z.x0) * (z.z1 - z.z0) > 30) labels.push({ x: (z.x0 + z.x1) / 2, z: (z.z0 + z.z1) / 2, text: z.name });
    }
    return {
      drum: { you: { deck: deckOf(rho), ring: ringOf(f.zd(player.pos.z)), thetaDeg: (f.theta(player.pos.x) * 180 / Math.PI), zM: f.zd(player.pos.z), rho } },
      local: { title: game.zone ? game.zone.name : '', lines, labels, you: { x: player.pos.x, z: player.pos.z, yaw: player.yaw }, markers: [] },
    };
  };

  // ---- spinball: F throws. The ball obeys the drum: a throw along the axis flies true, spinward sinks, anti floats.
  const balls = []; let ballMesh = null;
  const makeBall = () => {
    const g = new Geo(new MeshBuf(128, 256)); g.mat('leather', '#d8b25a'); g.ball(0, 0, 0, 0.09, 0.09, 0.09, { segs: 10, rings: 7 }); g.mat('weave', '#b5532e'); g.ball(0, 0, 0, 0.092, 0.02, 0.092, { segs: 10, rings: 3 });
    const m = new THREE.Mesh(g.buf.toGeometry(), world.mats.opaque);
    world.addRenderable(m, { frame: player.frame, origin: [0, -500, 0], center: [0, 0, 0], radius: 0.3, far: 120, caster: true });
    return m;
  };
  const acc = [0, 0];
  const throwBall = () => {
    if (!game.flags.hasBall || player.mode !== 'walk' || game.busy) return;
    if (!ballMesh) ballMesh = makeBall();
    const e = { x: 0, y: 0, z: 0 }, d = { x: 0, y: 0, z: 0 }; player.eyePos(e); player.lookDir(d);
    const b = { frame: player.frame, x: e.x + d.x * 0.5, y: e.y - 0.15 + d.y * 0.5, z: e.z + d.z * 0.5, vx: d.x * 12 + player.vel.x, vy: d.y * 12 + 1.2, vz: d.z * 12 + player.vel.z, t: 0, bounces: 0 };
    balls.length = 0; balls.push(b); ballMesh.userData.frame = b.frame;
    if (game.audio) game.audio.play('ball-throw', { vol: 0.8 });
    game.events.emit('ball:throw', b);
  };
  game.events.on('update', (dt) => {
    if (!balls.length) return;
    const b = balls[0], col = world.colliders(b.frame); const n = 3, h = dt / n;
    for (let i = 0; i < n; i++) {
      freeAccel(b.frame, b.y, b.vx, b.vy, acc);
      b.vx += acc[0] * h; b.vy += acc[1] * h; b.x += b.vx * h; b.y += b.vy * h; b.z += b.vz * h;
      const hit = col.sphereHit(b.x, b.y, b.z, 0.09);
      if (hit) {
        const vn = b.vx * hit.nx + b.vy * hit.ny + b.vz * hit.nz;
        if (vn < 0) { b.vx -= 1.62 * vn * hit.nx; b.vy -= 1.62 * vn * hit.ny; b.vz -= 1.62 * vn * hit.nz; b.vx *= 0.86; b.vz *= 0.86; b.bounces++; if (game.audio && -vn > 1) game.sfxAt('ball-bounce', b.frame, b.x, b.y, b.z, { vol: clamp(-vn / 8, 0.15, 1) }); }
        b.x += hit.nx * hit.pen; b.y += hit.ny * hit.pen; b.z += hit.nz * hit.pen;
      }
      const T = game.spinballTargets;
      if (T && !b.scored) for (const t of T) { if (t.frame === b.frame && Math.hypot(b.x - t.x, b.y - t.y, b.z - t.z) < (t.r || 0.45)) { b.scored = true; if (game.ui) game.ui.toast('Through the ring.', { kind: 'gain' }); if (game.audio) game.audio.play('cheer', { vol: 0.5 }); game.events.emit('ball:score', t); game.flags.spinballScored = (game.flags.spinballScored || 0) + 1; } }
    }
    b.t += dt;
    const o = ballMesh.userData.origin; o[0] = b.x; o[1] = b.y; o[2] = b.z;
    if (b.t > 9 || (b.bounces > 6 && Math.hypot(b.vx, b.vy, b.vz) < 0.6)) { balls.length = 0; o[1] = -500; }
  });

  // ---- keys that open screens (the UI swallows keys itself while one is open)
  game.events.on('update', () => {
    if (!ui || ui.modal || game.paused) return;
    if (ui.photo.active) return;
    if (input.pressed('Escape') || input.pressed('KeyP') && false) { ui.pause.open(); return; }
    if (game.busy) return;
    if (input.pressed('KeyJ') || input.pressed('Tab')) ui.journal.open();
    else if (input.pressed('KeyM')) ui.map.open();
    else if (input.pressed('KeyP')) ui.photo.enter();
    else if (input.pressed('KeyF') || input.clicked2) throwBall();
  });
  // the browser drops pointer lock on Esc without telling the page which key it was: treat losing the lock as "pause"
  input.onLockChange = (locked) => { if (!locked && ui && !ui.modal && !ui.photo.active && game.started && !game.busy) ui.pause.open(); };
  game.events.on('ui:pause', (on) => { game.paused = !!on; if (!on) input.lock(); });
  // a quiet line when the picture does not have the pointer: click to take it (or drag, where a browser will not give it)
  let hint = null, hintT = 0, dragTold = false;
  try {
    hint = document.createElement('div');
    hint.style.cssText = 'position:fixed;left:50%;bottom:calc(86px + env(safe-area-inset-bottom, 0px));transform:translateX(-50%);z-index:60;pointer-events:none;opacity:0;transition:opacity .3s;' +
      'font:600 13px/1 "Barlow Condensed","Barlow",system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#f3ede2;background:rgba(12,9,6,.62);padding:9px 14px 8px;border-radius:3px;white-space:nowrap;';
    document.body.appendChild(hint);
  } catch (e) { hint = null; }
  game.events.on('update', (dt) => {
    if (!hint) return;
    const coarse = !!(ui && ui.touch && ui.touch.enabled);
    const free = game.started && !game.paused && !game.busy && !(ui && ui.modal) && !(ui && ui.photo && ui.photo.active) && !coarse;
    let text = '';
    if (free && !input.locked && !input.lockRefused) { hintT += dt; if (hintT > 0.7) text = 'Click to look around'; }
    else if (free && input.lockRefused && !dragTold) { hintT += dt; text = 'Drag to look around'; if (hintT > 7) dragTold = true; }
    else hintT = 0;
    if (text && hint.textContent !== text) hint.textContent = text;
    hint.style.opacity = text ? '1' : '0';
  });
  game.events.on('ui:modal', (on) => { input.enabled = !on; if (!on && game.started) input.lock(); });
  game.events.on('ui:leave', () => { game.saveGame(); window.location.reload(); });
  game.events.on('ui:chapter', (id) => { const c = CHAPTERS.find((x) => x[0] === id); if (c) { go(c[3], c[4], c[5]); if (ui) ui.banner(c[1], c[2]); if (game.story && game.story.onChapter) game.story.onChapter(id); } });

  // ---- the ending: the fourth morning is done. A few lines over black, the credits, and then the drum is still there.
  const CREDITS = [
    { title: 'Guest-Right' }, 'Three nights in Chervil', '',
    { h: 'Set in' }, 'The Kerr swarm: Chervil, the hall drum on Herb Row', 'Its people, customs and prices are from the world bible', '',
    { h: 'Made in code' }, 'Every street, lamp, face, voice and tune', 'No pictures, models or recordings were used', '',
    { h: 'Type' }, 'Cormorant Garamond, Barlow, Barlow Condensed and Caveat', 'under the SIL Open Font Licence', '',
    { h: 'Built with' }, 'three.js', '',
    { h: 'With thanks' }, 'To every hall that sets a place for a stranger', '',
  ];
  // a few lines of plain type over the black, one at a time
  const epilogue = async (lines) => {
    let el = null;
    try {
      el = document.createElement('div');
      el.style.cssText = 'position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;pointer-events:none;padding:0 max(24px, env(safe-area-inset-right, 0px)) 0 max(24px, env(safe-area-inset-left, 0px));';
      const tx = document.createElement('div');
      tx.style.cssText = 'max-width:34rem;text-align:center;font:italic 500 clamp(22px, 3.2vw, 34px)/1.45 "Cormorant Garamond", Georgia, serif;color:#f3ede2;opacity:0;transition:opacity 1.1s ease;text-wrap:balance;';
      el.appendChild(tx); document.body.appendChild(el);
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (const t of lines) { tx.textContent = t; await wait(60); tx.style.opacity = '1'; await wait(1100 + Math.max(2600, t.length * 62)); tx.style.opacity = '0'; await wait(1250); }
    } finally { if (el && el.parentNode) el.parentNode.removeChild(el); }
  };
  game.events.on('story:ending', async (e) => {
    if (game.flags.ended) return;
    game.flags.ended = true; game.busy++;
    const staying = !!(e && e.staying);
    try {
      if (game.music) game.music.hold('card-home', { vol: 0.8, fade: 3 });
      if (ui) {
        await ui.fade(true, 2.4);
        const lines = staying
          ? ['You stayed.', 'Thursdays, lids. Then stock. After a year Marit let you salt it.', 'Pell wrote back in 23.7 seconds, and then again every month.']
          : ['The nine o’clock glide, and the slow line after.', 'Three and a half hours out, Chervil was one lit drum among thousands.', 'In Spelt, Pell asked whether the mother took. It took.'];
        await epilogue(lines);
        await ui.credits(CREDITS);
        if (game.music) game.music.hold(null);
        ui.banner(staying ? 'Chervil' : 'One more morning', staying ? 'As long as you cook' : 'The glide leaves at nine. Nobody is counting.');
        await ui.fade(false, 2.0);
      }
    } catch (err) { console.error('[ending] ' + (err && err.stack ? err.stack : err)); if (ui) { try { await ui.fade(false, 0.5); } catch (e2) { /* ignore */ } } }
    finally { game.busy--; if (game.music) game.music.hold(null); game.saveGame(); }
  });

  const begin = async (fresh) => {
    game.started = true; clock.paused = false; player.locked = false;
    if (fresh) {
      game.newGame(); go('start', 1, 9.667);
      if (ui) { ui.hud.wallet(game.wallet.kwh); ui.hud.show(true); await ui.fade(false, 1.6); ui.banner('Chervil', 'Station Ring 2 · Thursday morning'); }
      game.events.emit('game:new');
      if (game.story && game.story.begin) game.story.begin(game);
      // the keys, once, in the first minute (a touch screen shows its own buttons)
      if (ui && !(ui.touch && ui.touch.enabled)) {
        const say = (after, text) => setTimeout(() => { if (game.started && !game.paused && !game.flags.signed_in) ui.toast(text, { kind: 'info', dur: 8 }); }, after * 1000);
        say(7, 'W A S D to walk, the mouse to look. Shift hurries. Space jumps.');
        say(17, 'E uses things and talks to people. Anything you can use shows its name when you look at it.');
        say(29, 'J opens your journal, M the map, P takes a picture for a card, Esc the menu.');
      }
    } else {
      if (!game.loadGame()) go('start', 1, 9.667);
      if (ui) { ui.hud.wallet(game.wallet.kwh); ui.hud.show(true); await ui.fade(false, 1.0); ui.hud.thread(game.journal.current()); }
      game.events.emit('game:continue');
    }
    input.lock();
  };

  // ---- start: straight in (?auto), or the title over a slow turn round the court
  game.run = async () => {
    // the station's lift lobby is a stop like any other (its builder calls game.cab.open('station') at the berths)
    const sl = game.spawns['station-lobby'];
    if (sl && !game.cab.stops.find((q) => q.id === 'station')) game.cab.addStop({ id: 'station', name: 'Station Ring 2', sub: 'the glide platform, the Ledger, the guest desk', banner: 'Station Ring 2', frame: sl.frame, x: sl.x, y: sl.y, z: sl.z, yaw: sl.yaw || 0 });
    if (ui && ui.setKeys) ui.setKeys([
      { k: ['W', 'A', 'S', 'D'], t: 'Walk' }, { k: ['Mouse'], t: 'Look about' }, { k: ['Shift'], t: 'Hurry' }, { k: ['Space'], t: 'Jump' },
      { k: ['E'], t: 'Use, talk, sit' }, { k: ['F'], t: 'Throw a ball you have borrowed' },
      { k: ['J'], t: 'Journal' }, { k: ['M'], t: 'Map' }, { k: ['P'], t: 'Photo mode' }, { k: ['Esc'], t: 'Pause' },
      { k: ['W', 'S', 'Space', 'C'], t: 'In the Spindle: row, lift, sink' },
    ]);
    if (ui) { ui.setChapters && ui.setChapters(CHAPTERS.map((c) => ({ id: c[0], title: c[1], sub: c[2] }))); ui.loading.hide(); if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ui.touch.enable(true); }
    if (game.params.auto) { game.started = true; if (ui) { ui.hud.show(true); ui.hud.wallet(game.wallet.kwh); } return; }
    const title = game.spawns.court ? ['court', 1, 20.4] : game.spawns.hollow ? ['hollow', 1, 11] : ['start', 1, 12];
    go(title[0], title[1], title[2]); clock.paused = true; player.locked = true; player.pitch = 0.18;
    if (ui) ui.hud.show(false);
    const spin = game.events.on('update', (dt) => { player.yaw += dt * 0.035; });
    let choice = { action: 'new' };
    if (ui) { try { choice = await ui.titleScreen({ canContinue: game.hasSave(), chapters: CHAPTERS.map((c) => ({ id: c[0], title: c[1], sub: c[2] })) }) || choice; } catch (e) { console.error('[title] ' + e); } }
    spin();
    if (ui) await ui.fade(true, 0.8);
    if (choice.action === 'continue') await begin(false);
    else if (choice.action === 'chapter' && choice.chapter) { await begin(true); game.events.emit('ui:chapter', choice.chapter); }
    else await begin(true);
  };
  game.tip = () => TIPS[Math.floor(Math.random() * TIPS.length)];

  // ---- hold the frame rate: when frames run long, draw fewer pixels; when there is room, draw more (up to the setting)
  let slow = 0, fast = 0, dyn = 1, lastChange = 0;
  game.events.on('prerender', () => {
    if (game.params.fixedres || !game.started) return;
    const dt = game.dtReal;
    if (dt > 0.024) { slow += dt; fast = 0; } else if (dt < 0.0135) { fast += dt; slow = Math.max(0, slow - dt); } else { slow = Math.max(0, slow - dt * 0.5); fast = 0; }
    const now = game.time;
    if (slow > 1.2 && dyn > 0.5 && now - lastChange > 2) { dyn = Math.max(0.5, dyn - 0.12); slow = 0; lastChange = now; apply(); }
    else if (fast > 6 && dyn < 1 && now - lastChange > 6) { dyn = Math.min(1, dyn + 0.08); fast = 0; lastChange = now; apply(); }
  });
  const apply = () => {
    const base = pipeline.quality.scale * Math.min(1, game.settings.get('renderScale') || 1);
    pipeline.scaleOverride = base * dyn; pipeline.setSize(pipeline.cssW, pipeline.cssH, pipeline.pixelRatio);
  };
  game.dynScale = () => dyn;
}
