# Guest-Right: architecture for contributors

A first-person game inside the nation drum Chervil. three.js r170 (vendored, `vendor/three.module.min.js`), plain ES modules, no bundler in development. World and voice: `content/brief.md` (read it first).

This file is the contract between the parts.

## Rules for every source file

The release build is made by `tools/build.py`, a small bundler with no dependencies. It only understands a strict subset of ES modules. Keep to it, or the build breaks:

- Imports are static, at the top of the file, one statement each, and either `import * as THREE from 'three';` (the only way to import three) or `import { a, b } from './relative/path.js';` (named imports, relative path, with the `.js`). No default imports, no `import * as x` of local files, no bare specifiers other than `'three'`, no `import()`.
- Exports are declarations at column 0: `export function f`, `export async function f`, `export class C`, `export const x =`. No `export default`, no `export let`, no `export { ... }` lists, no re-exports, no destructuring in an exported declaration.
- No top-level `await`. No circular imports.
- No external assets or network requests. Everything is generated in code. The only fonts are the four families in `assets/fonts` (`'Cormorant Garamond'`, `'Barlow'`, `'Barlow Condensed'`, `'Caveat'`), already loaded by the page.
- Browser storage only through `game.save` (it wraps `localStorage` in try/catch and falls back to memory).
- Check your file parses before you finish: `node --check path/to/file.js`.
- Every string a player reads follows the voice rules in `content/brief.md` (British spelling, no dashes, no exclamation marks, no banned phrases). `python tools/build.py --check` flags them.

## Run and test

- See "Run and test" under Engine below.

## Content data (`src/content/*.js`)

Plain data modules. One exported const per file. Text follows the brief's voice rules.

```js
// cast.js
export const CAST = {
  marit: {
    name: 'Marit Vell', short: 'Marit', age: 26, role: 'hall cook',
    line: 'Cooks the Ring 2 hall on Thursdays. Four months home from her wander year.',  // journal, People tab
    look: { build: 'medium', height: 1.68, skin: '#a8754f', hair: '#2a1c14', hairStyle: 'tied', top: '#c9552e', lining: '#2f6f8f', bottom: '#3a3a44', apron: '#e9e2d0', accent: 'kerchief' },
    voice: { pitch: 1.05, speed: 1.0, timbre: 'warm' },   // for dialogue blips
    home: 'flat-marit', work: 'hall',                      // place ids from places.js
  },
  ...
};
// look.build: 'slight' | 'medium' | 'broad' | 'child' | 'elder'; hairStyle: 'short' | 'tied' | 'long' | 'bun' | 'cropped' | 'bald' | 'cap' | 'scarf';
// accent: optional 'kerchief' | 'apron' | 'satchel' | 'shawl' | 'spectacles' | 'cane' | 'hat'. Colours are sRGB hex. People look like all of humanity mixed.

// places.js
export const PLACES = {
  hall: { name: "Marit Vell's Hall", sign: 'THE LONG TABLE', area: 'candlewick', kind: 'hall',
          sub: 'Candlewick · deck 16 · Ladle Row', blurb: 'One sentence shown on arrival and on the map.' },
  ...
};

// menus.js: what a venue sells. Prices in kWh from the docs (cuisine.md, eating-out.md, daily-life.md).
export const MENUS = {
  hall: { title: "Marit Vell's Hall", note: 'Lift the lid when it reaches you.',
          items: [ { id: 'ramen', name: 'Thursday ramen', desc: '...', price: 1.77, days: [1], hours: [11.5, 15] }, ... ] },
  ...
};

// items.js: things the player can carry or be given.
export const ITEMS = { 'spelt-mother': { name: "A spoon of Spelt's mother", desc: '...', icon: 'crock' }, ... };

// signs.js: every piece of text painted, chalked or lit in the world. The area builders look these up by id.
export const SIGNS = {
  'hall.fascia': { kind: 'fascia', text: 'THE LONG TABLE', sub: 'one table · four hundred seats' },
  'hall.chalk':  { kind: 'chalk', title: 'Thursday', lines: ['Ramen 1.77', '...'] },
  'ledger.poster.flight': { kind: 'poster', title: 'The Long Flight', lines: ['...'], palette: ['#1b1f3a', '#f2c879'] },
  ...
};
// kind: 'fascia' (shop front) | 'hanging' | 'chalk' | 'poster' | 'notice' | 'street' | 'plate' (small engraved plate) | 'label' | 'board' (big information board) | 'banner'

// discoveries.js: the collectible "things found" (journal). 1 to 3 crisp sentences, true to the docs, with their numbers.
export const DISCOVERIES = { 'long-table': { title: 'One long table', text: '...', where: "Marit Vell's Hall", hint: 'Where Ladle Row is widest.' }, ... };

// chatter.js: overheard lines. tags pick where and when they may be heard.
export const CHATTER = [ { tags: ['hall', 'day1'], lines: ['One line.', ['A says this.', 'B answers.'] ] }, ... ];
// tags: place ids, area ids ('station','candlewick','hollow','terraces','spindle'), 'day1' | 'day2' | 'day3', 'morning' | 'midday' | 'evening' | 'night', 'kids', 'elders', 'any'.

// tips.js: one-liners for loading screens.   customs.js: short glossary entries for the journal (term, text).
```

Dialogue scripts (`src/content/dialogue/*.js`) are a second pass.

## UI (`src/ui/`)

DOM and CSS over the game canvas. `src/ui/ui.js` exports `createUI(game)`; split the rest into files beside it as you like. CSS lives in JS (a template string injected in a `<style>`), because the build inlines only JS.

**Look.** One finished, quiet, warm interface. Type: `'Cormorant Garamond'` italic for titles, names and sayings (lamp gold `#FFE3A8`); `'Barlow Condensed'` caps with letter-spacing for labels and numbers; `'Barlow'` for running text; `'Caveat'` only for handwriting (notes, the card home). Colour: warm near-black panels (`#14100c` at ~82%, hairline borders `rgba(255,217,160,.18)`), text `#F3EDE2`, secondary `#A99F90`, lamp `#FFD9A0`, **ember `#FF7A2F` only for energy (kWh)**, teal `#3FE0D0` only for information and links, leaf `#8FD694`, warn `#FF5468` rarely. No emoji; icons are small inline SVGs you draw. Motion is gentle (150 to 300 ms fades and short slides, no bounce). Everything must also work at phone width (360 px) and with touch.

```js
const ui = createUI(game);
ui.update(dt);                       // every frame
ui.modal;                            // true while a screen that takes input is open (the game suspends player input)

// boot
ui.loading.show(); ui.loading.set(progress01, label); ui.loading.tip(text); ui.loading.hide();
await ui.titleScreen({ canContinue, chapters: [{ id, title, sub }] });   // -> { action: 'new' | 'continue' | 'chapter', chapter }

// heads-up display
ui.hud.show(bool);
ui.hud.place(title, sub);            // bottom left: 'CANDLEWICK · LADLE ROW' / 'Deck 16 · Ring Two · 0.98 g'
ui.hud.clock(text);                  // '13:05 · Thursday'
ui.hud.wallet(kwh, delta);           // bottom right, ember; delta animates (+/-)
ui.hud.compass(yawDeg, markers);     // top centre strip. The four points are SPINWARD, BACK, ANTI, FRONT (in that clockwise order; 0 deg = spinward). markers: [{ id, bearing, label, kind: 'thread' | 'place' | 'person', dist }]
ui.hud.thread(text);                 // the current thread (objective), or null
ui.hud.weight(g);                    // small readout, e.g. '0.98 g'
ui.prompt(text, key);                // '[E] Sit at the long table' near the reticle; null hides it
ui.reticle(mode);                    // 'dot' | 'use' | 'talk' | 'aim' | 'none'
ui.toast(text, { kind, dur });       // kind: 'info' | 'gain' | 'spend' | 'thread' | 'found'
ui.card({ kicker, title, text, dur });   // discovery card, upper centre
ui.banner(title, sub);               // large place title on arrival, fades by itself
ui.subtitle(speaker, text, dur);     // an overheard line, bottom centre, stacked up to three
ui.bubble(id, text, anchor);         // speech bubble pinned to the world. anchor() -> { x, y, visible, dist } in CSS pixels; ui.bubble(id, null) removes it
await ui.fade(toBlack, seconds);
ui.letterbox(bool);
ui.ride(info);                       // { kicker, big, sub } large centred readout for cab, lift and glide rides; null hides

// talk
await ui.say(speaker, lines, opts);  // speaker: { name, colour } or a string. lines: string | [{ s, t }]. Typewriter at ~45 chars/s; E, Space, Enter or click skips to the end of a line, then advances. opts.onChar(ch, speaker) is called per character (for voice blips).
await ui.choose(speaker, prompt, options);   // options: [{ label, sub, value, cost, disabled }] -> value, or null if dismissed. Number keys pick.
await ui.menu({ kicker, title, note, items, wallet, footer });   // items: [{ id, name, desc, price, tag, disabled }] -> id or null. Prices in kWh, two decimals, ember.
await ui.pickHour({ title, from, to, now });   // "sit a while": choose an hour to wait until -> number or null

// screens
ui.pause.open(); ui.pause.close();   // Resume, Settings, How to play, Chapters, Leave. Esc toggles (the game calls these).
ui.journal.open(tab); ui.journal.close();   // tabs: 'threads' | 'found' | 'people' | 'customs' | 'cards'. Data from game.journal (below).
ui.map.open(); ui.map.close();       // data from game.mapData() (below)
ui.photo.enter(); ui.photo.exit();   // hides the HUD, shows a frame and sliders (field of view, exposure, hour); calls game.photo.set({...}) and game.photo.take()
await ui.cardHome({ photos, to, place, day });   // the ending: pick a photo for the front, write up to 300 characters on the back in 'Caveat'; -> { front, text } or null
ui.credits(lines);

// touch
ui.touch.enable(bool);               // left stick, right look pad, buttons for use, jump, run, journal; writes game.input.virtual = { moveX, moveY, lookDX, lookDY, jump, use, run }
```

What the UI may read from the game (use nothing else; everything may be absent while loading):

```js
game.settings.get(key); game.settings.set(key, value); game.settings.all();   // 'quality' ('low'|'medium'|'high'|'ultra'), 'renderScale' (0.5..1), 'fov' (60..100), 'sensitivity' (0.2..3), 'invertY', 'headBob', 'motionBlur', 'subtitles' ('off'|'small'|'large'), 'volMaster','volMusic','volSfx','volVoice','volAmbience' (0..1), 'daySpeed' (minutes of real time per game day: 24, 48, 72, 96)
game.events.on(name, fn); game.events.emit(name, data);                        // UI emits 'ui:modal' (bool) when ui.modal changes
game.audio.ui(name);                                                           // 'click' | 'hover' | 'open' | 'close' | 'page' | 'coin' | 'deny' | 'thread' | 'found'
game.journal.threads();   // [{ id, title, text, done, steps: [{ text, done }] }]
game.journal.found();     // [{ id, title, text, where, found: bool, hint }]
game.journal.people();    // [{ id, name, role, line, met: bool, colour }]
game.journal.customs();   // [{ term, text, seen: bool }]
game.journal.cards();     // [{ id, src (data URL), place, day, hour }]
game.mapData();           // { drum: { you: { deck, ring, thetaDeg, zM, rho } }, local: { title, lines: [[x,z,x,z,kind]], labels: [{ x, z, text }], you: { x, z, yaw }, markers: [...] } }
game.photo.set({ fov, ev, hour }); game.photo.take();   // -> data URL
game.clock.label();       // '13:05'
game.wallet.kwh;
```

Build a dev page `tools/ui-dev.html` that mounts the UI over a plain backdrop with a mock `game` and buttons to exercise every call, and keep it working: it is how the UI is tested without the engine.

## Audio (`src/audio/`)

Everything is synthesised with the Web Audio API: no samples, no files. `src/audio/audio.js` exports `createAudio(game)`.

**Positions.** The game hands audio every position already in **listener space**: metres, x to the right, y up, z toward the back of the head (so straight ahead is −z). The listener is always at the origin. Positional sources take `pos: () => [x, y, z]` and are polled every `update`.

**The air is heliox.** Voices are bright and thin-edged (formants ~1.8× higher, pitch unchanged), bare rooms ring, felt-hung rooms are dry, and wind instruments are tuned to sound right only because they are long. Make it sound like that.

```js
const audio = createAudio(game);
audio.unlock();                          // call on the first user gesture; safe to call again
audio.update(dt);                        // every frame
audio.play(name, { pos, vol, pitch, delay });          // one-shot. pos: [x,y,z] (listener space) or omitted for non-spatial
const h = audio.loop(name, { pos, vol, radius, param });   // -> { stop(fadeSeconds), set({ vol, pitch, param }) }
audio.ambience(id, { fade });            // crossfade the bed: 'none' | 'station' | 'arcade' | 'court' | 'hall' | 'feast' | 'shop' | 'flat' | 'baths' | 'school' | 'hollow-day' | 'hollow-dusk' | 'hollow-night' | 'terrace' | 'spindle' | 'cab' | 'glide' | 'quiet'
audio.reverb(id);                        // 'none' | 'room' | 'ring' (a bare arcade) | 'felt' | 'hall' | 'tile' (baths) | 'station' | 'open' (the Hollow: nearly dry, with a faint echo off the far bank 9.7 s later)
audio.music(id, { pos, vol, fade });     // start a cue, or audio.music(null) to stop. Cues below.
audio.musicParam(name, value);           // e.g. ('intensity', 0..1), ('progress', 0..1) for the dawn
audio.voice(profile, ch);                // one syllable of dialogue babble. profile: { pitch, speed, timbre: 'warm' | 'bright' | 'low' | 'child' | 'elder' }
audio.footstep(surface, { g, speed, land });   // 'tile' | 'wood' | 'stone' | 'metal' | 'felt' | 'carpet' | 'grass' | 'gravel' | 'sand' | 'water'. g scales weight (0.03..1).
audio.ui(name);                          // 'click' | 'hover' | 'open' | 'close' | 'page' | 'coin' | 'deny' | 'thread' | 'found'
audio.setVolumes({ master, music, sfx, voice, ambience });   // 0..1 each
audio.duck(amount, seconds);             // dip music and ambience under dialogue
audio.names;                             // every one-shot and loop name
```

One-shots: `door`, `door-slide`, `shutter`, `knock`, `lid-up`, `lid-down`, `cup`, `plate`, `cutlery`, `pour`, `sip`, `chop`, `ladle`, `bell` (the Ledger's steel bell), `chime` (a lift arriving), `cab-go`, `cab-stop`, `berth-door`, `glide-release`, `glide-catch`, `clunk`, `hatch`, `splash`, `dive`, `ball-throw`, `ball-bounce`, `ball-catch`, `kite-snap`, `cheer`, `laugh`, `applause`, `brush`, `paper`, `book`, `chalk`, `scissors`, `coin` (a kWh spent: soft, not a cash register), `lamp-click`, `sleeve-flap`, `whoosh`, `land`, `flute-note`, `pluck`, `drum-tap`, `gong`.

Loops: `murmur` (a crowd: `param` 0..1 is its size), `kids`, `kitchen` (pots held on the loop, a little steam, a knife), `sizzle`, `steam`, `water-lap`, `fountain`, `shower`, `cab-hum`, `platform` (a station's machinery), `air` (air handlers), `wind` (air past your ears when flying: `param` is speed), `choir` (a block choir rehearsing), `tide` (water in a big pipe), `hum-lamp`.

Music cues (generative, each able to run for many minutes without obviously looping): `title`; `arrival` (the first walk out onto the platform); `court-evening` (a small band in the court: flute, plucked strings, hand drum; positional); `busker` (one heliox flute; positional); `choir` (positional); `dawn` (Oona's dawn: starts dark and low, the brown-violet of the River, warms through rose to gold; driven by `musicParam('progress')`); `feast`; `reel` (a leaping dance at a third of a g: the beat is slower than you expect, because dancers hang); `long-flight` (many voices, high and strange, over a slow pulse; the emotional peak); `card-home` (the ending).

Build a dev page `tools/audio-dev.html` with a button for every sound, bed, reverb and cue, and keep it working.

## Engine

Deferred rendering on three.js r170 (WebGL2): a G-buffer, hundreds of clustered lamps, overhead soft shadows, ambient occlusion, screen-space reflections, temporal anti-aliasing, bloom, automatic exposure and a filmic grade. All geometry, textures and text are made in code at start-up. You never touch the renderer: you build places with the kit below.

### Run and test

- Dev server: `python tools/serve.py` (port 5190, no caching; normally already running: check with `curl -s -o /dev/null -w "%{http_code}" http://localhost:5190/`; never stop it, other people are using it). The game is `http://localhost:5190/`.
- **Screenshots** (headless Chrome on the real GPU), from the `games/guest-right` folder:
  `node tools/shot.mjs --q "only=test,mine&at=mine" --wait 2 --shot "out/<you>/a.png" --shot "out/<you>/b.png|0.6|game.player.place(game.player.frame, 4, 0, -2, 1.57, -0.1)"`
  Each `--shot` is `path|secondsToWaitFirst|javascriptToRunFirst`. It prints frames per second, draw calls, triangles, lights and console errors. **Open your pictures with the Read tool and criticise them like an art director**, then iterate. Use your own `out/<you>/` folder.
- URL parameters: `only=id,id` builds just those places (fast: use it), `at=<spawn>` starts at a spawn, `pos=x,y,z` moves the player, `yaw=<rad>` `pitch=<rad>`, `t=<hour>` sets the clock (e.g. `t=20.5`), `day=1|2|3`, `freeze` stops the clock, `q=low|medium|high|ultra`, `debug=1..6` shows a G-buffer view (1 albedo, 2 normals, 3 occlusion, 4 lights per cluster, 5 shadows, 6 roughness).
- `window.game` is the game. Useful in `--shot` JS: `game.player.place(frame, x, y, z, yaw, pitch)`, `game.player.yaw`, `game.clock.set(day, hour)`, `game.pipeline.debug = 2`, `game.world.frames.get('candlewick')`.
- `node --check <file>` before you finish. One broken place file does not stop the others loading, but it stops yours.

### Coordinates

- **Drum coordinates** are cylindrical: `theta` (radians, growing spinward), `rho` (metres from the axis; bigger is further down), `z` (metres along the axis; 0 is the front cap, 3750 the back).
- **You work in a frame**: a flat space for one deck or terrace. `x` = metres spinward, `y` = metres up (toward the axis), `z` = metres toward the back cap. Right-handed. The engine bends everything into the drum when it draws, so a long avenue really does curve up ahead of you; you build as if the world were flat. Long things are subdivided for you by the kit.
- Yaw: 0 faces −z (the front cap), +π/2 faces +x (spinward), π faces +z (the back), −π/2 faces −x (anti). Props are drawn with their front toward +z and turned by `yaw` about `y` (so `yaw = 0` leaves the front toward +z, `yaw = Math.PI / 2` turns the front toward +x).
- Frames in use: `station` (deck 1, the rim, 1 g), `candlewick` (deck 16 at y = 0; decks 17 to 21 at y = 4, 8, 12, 16, 20; 0.98 g), `hollow` (the Hollow's floor, 0.5 g). Get one with `game.world.frame('candlewick', deckRadius(16), 0, 625)` (same arguments every time; `deckRadius` is in `src/core/drum.js`).
- Decks are 4 m apart: a floor at `y`, a ceiling at about `y + 3` to `y + 3.4`, and the next floor at `y + 4`.

### A place module

One file per place in `src/places/`, listed in `src/places.json` (the list is already filled in: don't edit it; if you need a new file, tell the lead).

```js
import { floor, ceiling, wall, lamp, roomGlow, block, stairs } from '../world/kit.js';
import { room, shopfront, railing, planter, column, archway } from '../world/kit2.js';
import { prop, defineProp, bunting } from '../world/props.js';
import { sign } from '../world/signs.js';
import { door, doorFrame } from '../world/doors.js';
import { deckRadius } from '../core/drum.js';
import { SIGNS } from '../content/signs.js';

export const place = {
  id: 'bakery', name: 'The bakery', order: 20,
  build(game) {
    const f = game.world.frame('candlewick', deckRadius(16), 0, 625);
    const s = game.world.scope('bakery', f);          // everything you make belongs to this scope
    // ... build with the kit ...
    s.zoneBox({ id: 'bakery', place: 'bakery', box: [x0, 0, z0, x1, 3, z1], name: 'The Heel', sub: 'Ladle Row', ambience: 'shop', reverb: 'room' });
    s.finish();                                        // turn what was drawn into meshes: call it last
    game.spawns.bakery = { frame: f, x: 34, y: 0, z: -6, yaw: 0 };   // where ?at=bakery starts
  },
};
```

`src/places/test.js` is a working example that uses most of the kit: read it, and look at it in the game (`?only=test`).

### Drawing: tiers, flushing, shadows

Everything is drawn with `s.g` (a `Geo`, below) into a buffer, then **flushed** into batches. The kit functions flush for you. When you draw by hand, wrap it:

```js
s.structure((g) => { ... });   // walls, floors, big fixed things: seen from afar, cast no overhead shadow
s.furniture((g) => { ... });   // big furniture: seen from afar, casts soft shadows on the floor
s.detail((g) => { ... });      // small things: fade out beyond ~40 m, cast shadows
s.deco((g) => { ... });        // small things that should cast no shadow (wall art, ceiling fittings, lamp bodies)
```

All four take an optional second argument, `level`: an integer naming the deck (0 for y = 0, 1 for y = 4 ...). Set it when you build on more than one deck. Keep each call to one object or one small group so chunks stay tight (a chunk is 16 m: one call that draws a whole 100 m street lands in one chunk and is never culled).

### Geo: shapes (`s.g`)

Material first, then shapes. Colours are sRGB hex. Sizes in metres.

```js
g.mat(name, tint, { rough: ±0.5, emissive: strength, lamp: true, night: true, sway: 0..1, shade: 'metal' | 'cloth' | 'foliage' | 'plain' })
g.box(x0, y0, z0, x1, y1, z1, { bevel: 0.01, faces: 'xXyYzZ', aoBottom: 0.7 })      // faces: lower-case = minus side. bevel rounds the edges: use it on furniture
g.cube(cx, cy, cz, sx, sy, sz, opts)
g.lathe(cx, cz, [[r, y], ...], { segs })       // turned shapes: bowls, pots, lamps, columns, legs. Profile from bottom to top
g.cyl(cx, y0, cz, r, h, { r1, segs })          // cylinder or cone
g.ball(cx, cy, cz, rx, ry, rz, { segs, rings, top, bottom })
g.tube([[x,y,z], ...], r | [r...], { segs, closed, caps })     // pipes, rails, chair frames, cords, branches
g.prism([[x,z], ...], y0, y1)                  // a polygon footprint (given in the order (0,0),(1,0),(1,1),(0,1)) pulled up
g.extrude([[u,y], ...], a0, a1, 'z' | 'x')     // a profile in a vertical plane (counter-clockwise) pulled along z or x: mouldings, benches, arches
g.quad(p0, p1, p2, p3, { double })             // four corners, counter-clockwise seen from the front
g.sheet(p00, p10, p11, p01, { sag, ripple, nu, nv })           // hanging cloth, both sides
g.card(x, y, z, w, h, yaw, { tilt })           // a cut-out card standing on its bottom centre (foliage)
g.at(x, y, z, yaw); ...; g.pop();              // a transform: draw things at the origin and place them. Also g.push(), move, rotY, rotX, rotZ, scale, pop
```

Emission: `emissive: 1` glows like a dim screen, `4` to `8` is a lamp face (it blooms), `lamp: true` makes it dim at lamp-night (23:00 to 06:30), `night: true` lights it only at night.

### Materials

Tileable: `plaster` (rough wall), `paint` (smooth painted), `planks` (floor boards), `wood` (joinery), `terrazzo`, `tile` (20 cm glazed), `mosaic`, `pattern` (two-tone patterned tile), `hex`, `stone` (pavers), `concrete`, `block` (painted blockwork), `brushed` (brushed metal), `cast` (cast or hammered metal: brass, bronze, iron by tint), `deckplate` (studded metal floor), `panel` (riveted painted panels), `flute` (ribbed panelling), `felt`, `weave` (plain cloth), `stripe` (striped cloth), `knit`, `motif` (block-printed cloth), `carpet`, `rush` (matting), `cane`, `leather`, `paper`, `speckle` (rubber floor), `glaze` (stoneware), `slate` (chalkboard), `diffuser` (lamp glass), `plain` (flat colour), `grass`, `soil`, `gravel`, `sand`, `bark`. Cut-outs (alpha): `leafA` (broad leaves on a twig), `leafB` (fine leaves), `fern`, `blossom`, `grille` (perforated metal). The tint multiplies the texture, which is authored pale: tints are the real colour. Metals take their colour from the tint (`cast` + `#b08a45` is brass). Natural ones (`grass`, `soil`, `sand`, `bark`, leaves) have their own colour: tint them `#ffffff` or nudge.

### The kit (`world/kit.js`, `world/kit2.js`)

```js
floor(s, x0, z0, x1, z1, y, mat, tint, { level, surf })        // draws it and makes it walkable
ceiling(s, x0, z0, x1, z1, y, mat, tint, { level })
wall(s, ax, az, bx, bz, y0, h, { tint, mat, t, tintA, tintB, dado: { h, mat, tint }, skirt: '#hex' | false, openings: [{ at, w, h, sill }], level })
        // from (ax,az) to (bx,bz): they must share x or z. `at` is the distance along the wall to an opening's near edge. Collides.
room(s, { x0, z0, x1, z1, y, h, floor: [mat, tint], ceil: [mat, tint], wall: { tint, dado }, open: { n, s, e, w }, level })   // -> a clip box for its lamps
        // n = the low-z wall, s = high-z, w = low-x, e = high-x. Each a list of openings ({ at, w, h, sill }; at from the low end) or false for no wall.
block(s, x0, y0, z0, x1, y1, z1, mat, tint, { bevel })          // a solid drawn box that collides: plinths, daises, counters
stairs(s, x, y, z, dir, rise, run, width, { mat, tint })         // dir 'X' | 'x' | 'Z' | 'z': the way they climb. Walkable
railing(s, [[x,z], ...], y, { h, glass, tint, rail })
column(s, x, y, z, h, { r, mat, tint })      planter(s, x, y, z, { w, d, h, plants: 'broad'|'fine'|'fern'|'flower'|'herbs' })      archway(s, x, y, z, w, h, along, {})
shopfront(s, { side, a0, a1, c, y, h, fascia: signSpec, palette: { frame, plinth, awning: [..] }, door: { at, w, kind: 'slide'|'hinge'|'open', auto }, awning, plinth, glass })
        // the glazed front of a unit: side 'n' | 's' (front runs along x at z = c; the street is toward lower z for 'n') or 'w' | 'e' (along z at x = c).
        // a0..a1 is its extent along the front. It makes posts, plinth, glass, a door, the fascia with the shop's sign, an awning.
lamp(s, kind, x, y, z, { K: 2900, power: 1, range, clip, tint, w, d, to, face, drop, level })
        // kind: 'panel' (ceiling panel w x d) | 'strip' (to: [x,y,z]) | 'globe' (pendant) | 'sconce' (face) | 'lantern' (coloured cloth lantern: tint) | 'spot' | 'pole' | 'bulb' (light only)
roomGlow(s, x0, y0, z0, x1, y1, z1, { sky, ground, power })     // the bounce light of a room (room() adds one for you)
```

**Light.** One ordinary lamp (`power: 1`) lights a 3 m room comfortably at arm's length. Rooms want a few lamps plus their `roomGlow`. **Always pass `clip`** (the room's box, `[x0,y0,z0,x1,y1,z1]`, a little bigger than the room): light does not go through walls by itself, the clip is what stops it. For light that should spill through an opening, make the clip reach through it. Mix colour temperatures: 2700 K (homes, halls), 3000 to 3400 K (streets, shops), 4000 K (work rooms, clinics); coloured lanterns for accents. Dark corners are good; flat, even light is not. Raw lights: `s.light({ at, color | K via warm(K), power, range, type: 'point' | 'spot' | 'tube', to, dir, cone, clip, shadow, nospec, lamp, night })` and `s.ambient({ box, sky, ground, power, skylit, lamp, sun })`.

### Props, signs, doors, glass

```js
prop(s, name, x, y, z, yaw, params, { tint: [r,g,b], level })     // exemplars in world/props.js: chair, stool, table, bench, bowl, cup, plate, crock, plant, crate, counter, shelving, rug
defineProp('mine.thing', (g, p) => { ...draw at the origin, front toward +z...; return { solid: [[x0,y0,z0,x1,y1,z1]], spots: [...], tier: 's' }; });
bunting(s, [x0,y0,z0], [x1,y1,z1], { colors })
sign(s, spec, x, y, z, { face: 'x'|'X'|'z'|'Z', w, h, glow, night, double })    // spec: SIGNS['id'] from content/signs.js or { kind, text, sub, lines, palette, emblem, motif }
        // kinds: fascia, hanging, chalk, poster, notice, street, plate, label, board, banner, letters. emblems: ladle loaf leaf apple flute book thread lamp cup chair wing drop star drum cross ball
door(s, { x, y, z, w, h, along: 'x'|'z', dir, swing, kind: 'hinge'|'slide', style: 'panel'|'plain'|'glazed'|'slat', tint, auto, locked, label })   // (x,y,z): foot of the hinge edge
doorFrame(s, x, y, z, w, h, along)
s.glass(x0, y0, z0, x1, y1, z1, { tint, opacity })               // a flat pane (constant x or z)
s.glowCard(x, y, z, { face, color, size, strength })             // a soft additive halo (use sparingly)
```

Name your own props with a prefix (`bakery.loaf`). A prop is drawn once and cached per distinct `params`, so pass colours as params and use `tint` for cheap per-copy variation. Text for signs comes from `src/content/signs.js` (look it up by id; if an id you need is missing, write the spec inline and say so in your report).

### People, use and sound

```js
s.spot(type, x, y, z, yaw, { tags: [...], who: 'castId' })       // a place for a person to be. Types: 'sit' (seat height y), 'stand', 'counter' (a keeper's post),
        // 'customer', 'browse' (facing a shelf), 'chat' (one of a group: give 2 to 5 facing each other), 'work' (tags say what: 'cook','mend','sweep','write'...),
        // 'queue', 'play' (children), 'perform', 'bed', 'bath'. Give every place plenty: they are what makes it lived in. who: reserves it for a cast member.
s.path([[x, z], ...], { y, width })          // a walkway people follow. Paths whose ends meet (within 0.7 m) join up; run one through every door you want people to use.
s.interact({ x, y, z, radius, prompt: 'Sit at the long table' | (game) => string, kind: 'use' | 'talk', onUse(game) { ... } })
s.trigger({ box: [x0,y0,z0,x1,y1,z1], once, onEnter(game) {}, onExit(game) {} })
s.zoneBox({ id, place, box, name, sub, ambience, reverb, env: { exposure, autoKey, bloom, warmth }, headroom, sky })    // every room and street needs one: it names the place on the HUD and sets the sound
s.solid(x0, y0, z0, x1, y1, z1, { surf })    s.post(x, z, r, y0, y1)    s.ramp(x0, z0, x1, z1, ya, yb, 'x'|'z')      // extra collision (the kit adds most of it)
```

In `onUse` you have the game: `await game.ui.say(speaker, lines)`, `await game.ui.choose(speaker, prompt, options)`, `await game.ui.menu({...})` (see UI above), `game.wallet.spend(kwh, 'Ramen')` (returns false if short), `game.wallet.kwh`, `game.clock` (`.hours`, `.day`, `.set(day, hour)`, `.skipTo(hour)`), `game.flags` (a plain object, saved), `game.sfxAt(name, frame, x, y, z)`, `game.loopAt(name, frame, x, y, z, { vol, radius })`, `game.player.sit({ x, y, z, yaw })` / `.stand()`, `game.events.on('zone', fn)`. Wrap a conversation in `game.busy++ ... game.busy--`. `game.ui` and `game.audio` may be null: guard with `if (game.ui)`.

### Story, journal, cabs (`src/game/story.js`, `src/game/cab.js`)

- `game.flags` (saved), `game.inv.give(id) / take(id) / has(id)`, `game.wallet.spend(kwh, what) / earn / can / kwh`.
- `game.journal.find(discoveryId)`, `.meet(castId)`, `.custom(term)`, `.defineThread({ id, title, text, steps: [...] })`, `.start(id)`, `.step(id, i)`, `.done(id)`.
- `game.story.talk(castId)` runs the best conversation node for that person (nodes are added with `game.story.add({ castId: [nodes] })`; the node and step format is documented at the top of `src/game/story.js`), `game.story.scene([steps])` runs steps that belong to nobody, `game.story.hook(name, fn)` names a function for `{ call: 'name' }` steps.
- Cabs: `game.cab.addStop({ id, name, sub, frame, x, y, z, yaw })` registers a place a cab can take you (x, y, z is where you step out, yaw the way you face); `game.cab.open('<this stop id>')` shows the list of other stops and rides to the one chosen. A lift lobby adds its own stop and gives its berth doors an `interact` that calls `game.cab.open(id)`.
- Sitting: `game.player.sit({ x, y, z, yaw, eye })` and `game.player.stand()`. Passing time: `game.clock.skipTo(hour)`; `await game.ui.pickHour({ title, from, to, now })` lets the player choose.

### The Hollow's land (`src/world/land.js`)

The Hollow's floor is frame `hollow` (`game.world.frame('hollow', 1500, 0, 0)`): x is metres spinward round the floor (it wraps at ±4712), z is the drum's own z (0 at the front wall, 3750 at the back), y is height above the floor datum. The ground is not flat: `heightAt(x, z)` gives it, `landAt(x, z)` gives `{ biome, h, tree, pd }` (see `BIOME`), and the lake's surface is at `LAND.WATER`. Stand things on the ground with `y = heightAt(x, z)`. The land, trees, lake, paths (gravel walks on a loose 170 m grid), sunline and far bank are already built (`src/places/hollow_land.js`); the festival green is the open lawn round (10, 1790), the lake lies spinward of it (shore at about x = 140 near z = 1790, an island at (620, 1760)), orchards and lawns everywhere else, dim woods within 700 m of each end wall. The player walks on `heightAt` automatically; a built floor (`floor(...)`, `block(...)`) higher than the ground takes over. At half a g everything falls slowly and people lope.

### Budgets and craft

- A shop or flat: under ~150,000 triangles and ~40 lights. A big hall or street: under ~600,000 triangles and ~150 lights. Check the numbers `shot.mjs` prints; aim for 60 frames a second at 1280×720 with everything in view.
- **Detail is layered.** No bare boxes. Walls get a dado or panelling, a skirting board, a picture rail or a painted band; ceilings get beams, ducts, pipes, cable trays, lamp fittings, felt baffles (this is the inside of a very large machine, lived in for centuries); floors get borders, thresholds, mats; shelves are full; tables are laid, every dish under a lid; there are plants wherever a lamp can keep them. Use bevels on furniture. Vary heights and depths: niches, steps, bays, benches built into walls.
- **Everything is old and mended.** Nothing matches exactly; chairs differ; a new pane among old ones; visible mends in bright thread; names in linings. Colour is cheap here and used boldly (dye, paint and glaze weigh nothing): rich reds, teals, ochres, indigo, against warm plaster and dark wood. Chervil is the loud, generous drum: more colour, more tables, more hangings than you first think.
- **Light makes the picture.** Pools of warm light and real darkness between them; a bright thing at the end of every view (a lit sign, a glowing lantern, a doorway); lamps low over tables.
- Real sizes: door 0.9 x 2.05, seat 0.45, table 0.74, counter 0.9, shelf depth 0.3, stair rise 0.17, railing 1.05, corridor at least 1.6 wide. The player is 1.74 tall with eyes at 1.6 and needs 0.6 m to pass.
- No animals, no fire or candles, no windows to an outside (there is none), no screens with moving pictures (personal devices are small and private), no cash. See "Never break these" in the brief.

### The plan of the world (who builds where)

Footprints are `x[a, b] z[c, d]` in the frame's metres. A module builds everything inside its footprint: its own floor, ceiling, walls (including the wall it shares with a neighbour: both neighbours build their own, back to back) and its front onto the street. It builds nothing outside it. Streets belong to the street modules, which build only the street's own floor, ceiling, lamps and furniture, and the fronts of the stretches no shop owns.

**Candlewick** (frame `candlewick`: `game.world.frame('candlewick', deckRadius(16), 0, 625)`; ground level is deck 16 at y = 0; shops are 3.2 m high inside, streets 3.4 m).

| Place (id) | Footprint | Notes |
|---|---|---|
| Wick Court (`court`) | x[−28, 28] z[−14, 20], open from y = 0 to 23.4 | The atrium. Ladle Row crosses it east to west at z[−4, 4]; Thread Street leaves its south side at x[−3, 3]. Its north side is the open front of the hall. A stair tower in its south-west corner, x[−28, −21] z[13, 20], climbs to every deck. The tea cart (`teacart`) stands at about (−18, 0, 12). |
| Terraces (`terraces`) | walkways 3.2 m wide round the court's void on decks 17 to 21 (y = 4, 8, 12, 16, 20): east x[28, 31.2], west x[−31.2, −28], south z[20, 23.2] (all decks), north z[−17.2, −14] (decks 18 to 21 only: the hall is two decks tall) | Railings on the void side, flat doors and planters on the outer side. |
| The hall (`hall`) | x[−62, 62] z[−27.5, −14], y 0 to 7.2 | One room, one table 120 m long down its middle. Open to the court along x[−28, 28] at z = −14 (arches). End doors at x = ±62 into the two passages. |
| Hall kitchen (`kitchen`) | x[−14, 14] z[−34, −27.5] | Open to the hall across a long pass. |
| Hall passages | east x[62, 65.5] z[−27.5, −4]; west x[−65.5, −62] z[−27.5, −4] | From Ladle Row to the hall's end doors (the hall module builds them). |
| Ladle Row, east (`ladle-row`) | x[28, 105] z[−4, 4] | The avenue. Runs on past x = 105 into the next block. |
| Ladle Row, west | x[−105, −28] z[−4, 4] | |
| Thread Street (`thread-street`) | x[−3, 3] z[20, 104] | Runs on past z = 104. |
| Bakery (`bakery`) | x[30, 39] z[−13.5, −4] | Front on Ladle Row at z = −4 (its `s` side). |
| Greengrocer (`greengrocer`) | x[39, 47] z[−13.5, −4] | |
| Larder shop (`larder`) | x[47, 55] z[−13.5, −4] | |
| Herb shop (`herbs`) | x[55, 61.5] z[−13.5, −4] | |
| Lift lobby A (`lobby-a`) | x[66, 82] z[−16, −4] | Cab berths. Front open to Ladle Row. |
| Clinic (`clinic`) | x[82, 92] z[−13.5, −4] | |
| Toy library (`toys`) | x[30, 40] z[4, 14] | Front on Ladle Row at z = 4 (its `n` side). |
| School (`school`, `spinball-hall`) | x[42, 100] z[4, 36] | Entrance on Ladle Row about x[58, 64]. |
| Block office | x[−39, −30] z[−13.5, −4] | The block court's clerk, the lottery boards. |
| Choir room | x[−50, −39] z[−13.5, −4] | |
| Laundry | x[−61.5, −50] z[−13.5, −4] | |
| Baths (`baths`) | x[−104, −68] z[−40, −4] | Entrance on Ladle Row. |
| Fernery | x[−60, −36] z[4, 24] | A small dim garden off Ladle Row's south side. |
| Book room (`books`) | x[−17, −3.5] z[20, 31] | Front on the court at z = 20 (its `n` side). |
| Lamp-painting studio (`studio`) | x[3.5, 17] z[20, 31] | Front on the court. |
| Mender (`mender`) | x[−13, −3] z[31.5, 40] | Front on Thread Street at x = −3 (its `e` side). |
| Dyer and tailor (`dyer`) | x[−13, −3] z[40, 50] | |
| Chair remaker (`chairs`) | x[−13, −3] z[50, 61] | |
| Flute maker (`flutes`) | x[3, 13] z[31.5, 40] | Front on Thread Street at x = 3 (its `w` side). |
| Lift lobby B (`lobby-b`) | x[3, 17] z[41, 57] | |
| Guest flat (`flat-guest`) | deck 19 (y = 12): x[4, 15] z[23.2, 33] | Door on the south terrace at (9, 12, 23.2); a window onto the court. |
| Family flat (`flat-family`) | deck 19: x[−15, −4] z[23.2, 33] | |
| Oona's flat (`flat-oona`) | deck 17 (y = 4): x[4, 15] z[23.2, 33] | |
| Marit's flat (`flat-marit`) | deck 18 (y = 8): x[−12, 0] z[−27, −17.2] | Door on the north terrace. |
| The old couple's flat (`flat-elders`) | deck 20 (y = 16): x[31.2, 41] z[−2, 10] | Door on the east terrace. |

Everything else along the streets is the street modules' to fill with ordinary fronts: doors with name plates, a stair up, a workshop behind glass, benches, planters, bicycles, children's chalk on the floor.

**Station Ring 2** (frame `station`: `game.world.frame('station', 3000, 0, 625)`; the rim, 1 g; the station is tall: 12 m to the vault).

| Place (id) | Footprint | Notes |
|---|---|---|
| Platform (`platform`) | x[−72, 72] z[−12, 12], car bays z[−22, −12] | The glide platform, curving up both ways. Six bays where armoured cars rise through the floor. |
| Lift lobby (`station-lobby`) | x[−46, −34] z[12, 26] | Cab berths up to Candlewick. |
| Guest desk (`guestdesk`) | x[−30, −20] z[12, 20] | |
| Ledger hall (`ledger`) | x[−18, 18] z[12, 36] | The Ledger on its south wall, the old Count board beside it. |
| Ring counter (`counter`) | x[20, 30] z[12, 18] | A hatch onto the platform. |
| Quaysides lane (`quayside`) | x[34, 44] z[12, 60] | Market stalls both sides. |
| The Gate (`gate`) | x[44, 60] z[40, 60] | Quarantine, seen through glass from the lane. |

**The Hollow** (frame `hollow`: `game.world.frame('hollow', 1500, 0, 0)`; z is the drum's own z; the lead builds the land, the lake, the trees and the sky). Places there are assigned later.

## The whole drum

Candlewick, the station, the festival Hollow and the back wall are built by hand when the game starts. Everything else in Chervil is either **generated** (the indoor city: every block of every deck) or a **landmark** built by hand the first time somebody goes there. `content/expansion-brief.md` is the brief for builders of both; this section is the map of the code.

### The grid (`src/core/layout.js`)

The residential decks between the fifteen line decks are cut into 58 **layers** of five or six decks (layer 0 is decks 16 to 21, Candlewick's). Each layer is cut into **cells**: one block each, about 210 m round the drum and 208.33 m along it. A cell is `(L, i, j)`: layer, index round the drum (0 at Candlewick's meridian, counting spinward, wrapping at `LAYERS[L].N`, 88 on layer 0 and 45 on layer 57), index along the axis (1 to 17; Candlewick is j = 3). 65,807 cells in all. Every layer has one frame (`candlewick` for layer 0, `layer<L>` for the rest) with the same origin, so in a layer's flat coordinates cell `(i, j)` is centred at `x = signedI * pitch`, `z = (j - 3) * 208.33`. On the far side of the drum a layer's x jumps by one circumference: the streamer moves the player across it unseen.

### The city (`src/city/`)

- `city.js`: `cellInfo(L, i, j)` gives everything about a block that follows from its address: name, avenue, street, hall, cook, dish, decks, weight, band, ring, style. `game.city` (made by `src/places/city.js`) adds `info`, `frame(L)`, `cellOfPlayer()`, `above(cell, dL)`, `visit`, `visited`, `arrive(cell)` (builds a block and returns its lift lobby), `stairs(cell, dir)`, `stop(cell)` (a cab stop for any block), `pick()` (the cab's address list, `picker.js`) and `go(cell, lot)` for tests.
- `plan.js`: `planCell(L, i, j)`: the block's plan, pure and cheap. The avenue runs spinward through the cell's middle (8 m wide), the street along the axis (6 m); they cross in the court (40 to 56 m by 28 to 34 m, two to six decks tall). The hall lies along the court's front side. Every arm is lined with **lots** (shops, the block's rooms, the lift lobby, one or two special places) and ordinary house fronts. The whole layout is mirrored by the seed, so a lot's `front` may be any of n, s, e, w.
- `streets.js`: the four arms, from the same parts as Ladle Row (`src/places/street_parts.js`). `court.js`: the atrium, its terraces (drawn lifted, on their own levels), its luminous ceiling and one of six middles.
- `lots.js`: the registry (`registerLot(key, fn)`) and the plain builders. A richer module for a key lives in `src/places/lots_*.js` and simply takes the key over.
- `streamer.js`: builds a block in slices of a few milliseconds a frame (`tick()`), in one managed scope with its own origin (so vertices keep sub-millimetre precision nine kilometres round) and its own page of the sign atlas, then shows it a few meshes a frame and tells the people (`game.people.addScope`). It keeps loaded the block the player is in and the blocks its streets lead into when the player could see down them; it lets go of the rest. An open street end whose next block is not built yet holds the player back for the moment it takes.

Hand-built and generated blocks meet at arches: Candlewick's stand at x = -105 and 105 and z = 104, and the blocks beside it begin exactly there.

- `pavilions.js`: the Hollow's lift pavilions. Where the Hollow's paths cross (every 170 m) a lift core comes up through the floor: a small pavilion with a cab berth and the head of the last stair, which goes down to the block of decks 371 to 375 underneath. The nine nearest the player are kept built. `game.city.toHollow(cell)` is the same stair climbed from below (the top layer's lift lobbies offer it); `game.city.hollowStop(cell)` is a cab stop at the pavilion over any block.
- `picker.js`: the cab's list for "another block of Chervil": on the map (the UI's Round the drum view as a chooser), straight up or down, the Hollow over this block, by address (band, decks, ring, block), somewhere you have been, anywhere.

### Scopes that come and go

`world.scope(id, frame, { origin: [x, z], managed: true })`: `origin` moves the scope's vertex zero (callers still draw in frame coordinates); `managed` means the people are told when it is ready and before it goes, instead of re-reading the world. `scope.finish(max)` builds at most `max` batches and returns how many are left. `scope.onDispose(fn)`, `scope.every(fn)`, `scope.loop(name, x, y, z, o)` and `scope.court(x0, z0, x1, z1)` (an atrium seen through several decks) all end with the scope.

### Landmarks (`src/game/regions.js`)

A place module with `region: '<id>'` is not built at start-up. All the places of a region are built together when a cab is called to one of its `stops`, or (with `near`) when the player walks close, and disposed when the player has gone on. What a region made is found by comparing the world before and after: its scopes (made managed, so the people are told of each without anybody else being disturbed), frames, spawns, the listeners it added and the loops it started. Its signs come out of the atlas's pool (`atlas.begin(id)` ... `end()`, `release(id)`): the lent pages are shared by every region and block that is loaded, a freed slot going to the next sign of the same size.

| Region | File | Frame | Where | Cab group |
|---|---|---|---|---|
| `keel-vats` | `lm_keel_vats.js` | `keel-vats`: deck 9, theta 0.9, z0 1875 | the Keel, Ring Five | The Keel |
| `keel-garden` | `lm_keel_garden.js` | `keel-garden`: deck 6, theta 0.9, z0 1460 | the Keel, Ring Four | The Keel |
| `keel-heat` | `lm_keel_heat.js` | `keel-heat`: deck 3, theta 2.4, z0 2710 | the Keel, Ring Seven | The Keel |
| `keel-library` | `lm_keel_library.js` | `keel-library`: deck 11, theta -1.2, z0 1040 | the Keel, Ring Three | The Keel |
| `ring-five` | `lm_ring_five.js` | `ring-five`: deck 1, theta 0, z0 1875 | Station Ring Five | The stations |
| `ring-nine` | `lm_ring_nine.js` | `ring-nine`: deck 1, theta 0, z0 3540 | Station Ring Nine | The stations |
| `line-works` | `lm_line_works.js` | `line38`: deck 38, theta 0.35, z0 625 | the first line deck above Candlewick | The line decks |
| `line-rides` | `lm_line_rides.js` | `line63`: deck 63, theta -0.8, z0 2290 | a line deck, Ring Six | The line decks |
| `chimney` | `lm_chimney.js` | `chimney`: deck 40 at y = 0, theta 1.5, z0 2290 | the Low decks, Ring Six | The Low decks |
| `mile-hall` | `lm_mile_hall.js` | `mile-hall`: deck 52, theta -1.9, z0 2710 | the Low decks, Ring Seven | The Low decks |
| `felt-organ` | `lm_felt_organ.js` | `felt-organ`: deck 150, theta 1.9, z0 1460 | the Middle decks, Ring Four | The Middle decks |
| `lot-hall` | `lm_lot_hall.js` | `lot-hall`: deck 200, theta -2.2, z0 1875 | the Middle decks, Ring Five | The Middle decks |
| `up-decks` | `lm_up_decks.js` | `up-decks`: deck 340, theta 0.3, z0 1040 | the High decks, Ring Three | The High decks |
| `hollow-island` | `lm_hollow_island.js` | `hollow`, near (620, 1760) | the lake's island | The Hollow |
| `hollow-grounds` | `lm_hollow_grounds.js` | `hollow`, near (-900, 2300) | the playing grounds | The Hollow |
| `hollow-front` | `lm_hollow_front.js` | `hollow`, near (200, 350) | the front wood | The Hollow |
| `front-wall` | `lm_front_wall.js` | `fwall1` (rho 1450), `fwall10` (rho 1000), z0 0 | the front end wall | The end walls |
| `back-upper` | `lm_back_upper.js` | `quarter` (rho 750), `tenth` (rho 300), `twentieth` (rho 150), z0 3750 | the back wall's high tiers | The end walls |
| `axle-back` | `lm_axle_back.js`, `lm_window.js` | `axle-back` (rho 60, z0 3760), `still-side` | the back axle and the still side | The axles |
| `axle-front` | `lm_axle_front.js` | `axle-front` (rho 60, z0 -10) | the front axle | The axles |

### Tools for the whole drum

- `?cell=L:i:j&lot=<key>` goes straight to a block (and to a lot of that kind, in the nearest block that has one). `?citylog` prints each block's build time by part and its share of the sign atlas. `?nocity` runs without the city.
- `node tools/walk.mjs --q "at=ladle-east-end" --yaw 1.5708 --secs 60`: holds W (and Shift) and reports position, block, frame rate, the worst frame and any fall, every two seconds.
- `node tools/prof.mjs --q "..." --run "<js>" --secs 6`: a CPU profile of the running game by function.
- `node tools/play.mjs drum`: out of Candlewick on foot, a generated hall, a cab to the High decks, the stair, the last stair into the Hollow, a landmark, and a save and a reload in a generated block.
- `python tools/build.py` also asks node whether every module parses, and may be run by several people at once.

## Music

`src/game/director.js` decides which of the score's cues is playing (`src/audio/music.js` composes them): `title` on the title screen; `arrival` for the first minutes off the glide; `court-evening` from the bandstand in Wick Court on the Thursday evening and on Booking Day, and from the bandstand on the festival green; `choir` in the court at half past seven on the Thursday; `busker` (one flute) outside the Long Pipe, in the Quaysides lane and on the green on the Quiet; `reel` on the Third; `dawn` wherever the Hollow can be seen during Oona's dawn, driven by `game.dawnProgress()`; `feast` in the hall on Booking Day; `card-home` from the writing of the card to the end of the credits. A place may still call `audio.music()` itself (the studio's model dawn, the Long Flight): the director wraps that call, stands back while the place's cue plays, and takes over again when the place stops it. `game.music.hold(id, opts)` pins a cue for a scripted moment; `game.music.hold(null)` lets go.

## Playing it through by machine

`tools/play.mjs` drives the game in headless Chrome: it clicks Begin on the title, presses E through conversations, picks answers, walks up to things by their prompt (`T.use('Sign the guest book')`), finds named people (`T.talkTo('marit')`), rides cabs, sleeps, and takes a picture at every step into `out/play/<scenario>/`. Console errors and anything it could not find fail the run. The scenarios are at the bottom of the file; add one for any new thread or set piece. Chapters from the title screen go through `game.story.onChapter(id)`, which marks the earlier days as lived so that a scenario (or a player) can start at any of them.
