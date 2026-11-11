# Brief for builders of the whole drum

Guest-Right began as three nights in one block, Candlewick. It is being grown into the whole of Chervil: every block of the drum can be walked or reached by cab, and the drum's great places (the Keel's food plant, the line decks, the end walls, the axles, the far Hollow) are being built by hand. You are building one piece of that. Other builders are working beside you in the same folder at the same time.

The game is at `games/guest-right/` in this repository. Everything is JavaScript that draws its own geometry, textures and text; there are no asset files.

## Read first

1. `content/brief.md`: the world, the voice rules and the never-break rules. Short. Read all of it.
2. `content/place-brief.md`: the bar for a hand-built place and how to work. It still holds, word for word, except where this brief says otherwise.
3. `ARCHITECTURE.md`: "Rules for every source file", and everything under **Engine** (coordinates, the kit, materials, lights, props, signs, people, budgets and craft), then **The whole drum** at the end.
4. `content/drum-digest.md`: what the canon documents say about the inside of a nation drum and about Chervil, with sources. Your assignment names the sections that matter to you. Where the digest is silent you may invent, in keeping; list what you invented in your report.
5. Two or three finished places, for the standard: `src/places/bakery.js` (a shop), `src/places/baths.js` (a large room), `src/places/back_wall.js` (a place in its own frame, with a cab stop).

## Voice and world rules (the build fails on some of these)

Every word a player can read follows them: signs, prompts, lines, toasts.

- British spelling. No em dashes or en dashes (use a comma, a colon or a full stop; the middle dot `·` is fine on signs). No exclamation marks. No rhetorical questions.
- Never: testament to, tapestry, bustling, nestled, whispers of, symphony of, vibrant, hum of life, in a world where, delve, realm, beacon, labyrinthine, a dance of.
- Plain, exact, dry. Things have weights, prices in kWh, ages, owners. One good concrete detail beats three adjectives.
- Inside a drum there is no sun, sky, weather, season, moon or stars, and nobody says "day" for daylight: there is the sunline (a lamp), lamp-night, the dawn. Stars are seen only through a Window, outside the spin. No animals and nothing made from them (no leather, wool, silk, honey, eggs, milk from an animal: Chervil's meat and dairy are grown in vats). No fire, candles, wicks or smoke. No money but kWh ("kays"). No compass words: use spinward, anti, front, back, up (toward the axis), down (toward the rim).
- Robots are appliances. Nobody is a villain; nothing is a weapon; nothing is violent.
- Everything is old, mended, lent and labelled. Food is served under a lid.

## Hard technical rules

- Work only in the files your assignment names (they are already listed in `src/places.json`, which you must not edit) and in `out/<your id>/` for pictures. Do not edit the engine, the kit, `src/city/*`, shared props or anyone else's files. If you need something the engine lacks, do without and say so in your report.
- Source rules (the bundler is a small Python script, `tools/build.py`): static named relative imports with the `.js` extension; `import * as THREE from 'three'` only; `export function` / `export async function` / `export const` / `export class` at column 0; no default exports, export lists or re-exports; no top-level `await`; no dynamic `import()`; no circular imports.
- Name your own props with your prefix: `defineProp('<yourid>.<thing>', ...)`.
- `python tools/build.py` must end with `0 warnings`. `node --check` every file you write. `node tools/check-content.mjs` must still pass.
- The dev server is shared and already running on port 5190. Never start, stop or restart it. No git commands. Close any browser you launch (the tools do).
- Never write the repository's local path, anybody's name or email address into a file.

## Kind one: a lot module (a kind of room that every block of the city can have)

The city is generated: 65,807 blocks, each with an avenue, a street, a court, a hall, a lift core, shops, rooms and one or two special places. Its plan gives every such thing a **lot**: a rectangle of floor with one side on a street or on the court. A lot module builds what stands in a lot. The plain builders in `src/city/lots.js` are the fallback for every kind; yours replaces one key, and the same module is then used in thousands of blocks, each time with a different footprint, name and seed.

```js
// src/places/lots_<name>.js
import { registerLot, orient, PALETTES, say, note } from '../city/lots.js';
import { LOT_H } from '../city/plan.js';
import { Rng } from '../core/util.js';

registerLot('special.school', async (s, lot, plan, game, tick) => {
  const o = orient(lot), r = new Rng(lot.seed), info = plan.info;
  // ... build with the kit, everything through the scope `s` ...
  await tick();
});

// a place record so the file is loaded; it builds nothing itself
export const place = { id: 'lots-<name>', name: 'Lots: <name>', order: 2, always: true, build() {} };
```

`src/city/lots.js` has the registry, the helpers and four working examples of the contract (the plain shop, room, lobby and hall): read it before you write.

The lot: `{ id, kind, x0, z0, x1, z1, front, seed, name, sub, onCourt, trade | use | special, tradeKind }` in the frame's coordinates. `front` is the side of the footprint its street is on: `'n'` = the low-z side, `'s'` = high z, `'w'` = low x, `'e'` = high x (the same letters `room()` and `shopfront()` use). The footprint is **mirrored and turned from block to block**, so never write coordinates as if the front were on one particular side: use `orient(lot)`, which gives local coordinates `p` (along the front, from its low end) and `q` (inward from the front line):

- `o.P(p, q)` returns `[x, z]`; `o.W` is the frontage, `o.D` the depth; `o.box(p0, q0, p1, q1)` returns `[x0, z0, x1, z1]` sorted.
- `o.yawOut` is the yaw for a prop that should face the street, `o.yawIn` for one facing the back wall. `o.alongX` says the front runs along x. `o.c` is the front line, `o.a0`/`o.a1` its range (what `shopfront()` wants).
- Sizes you will be given: shops 8 to 10 m of front and 9.5 to 11 m deep; rooms 9 to 26 m by 9.5 to 13.5; the lobby 14 by 9.5; the hall 56 to 84 m long and 13.5 deep (open to the court along `lot.courtSpan`); a large special 24 by 20; an extra-large special about 36 to 58 m by 32 to 36. Read `o.W` and `o.D` and lay out to fit: divide a long room into bays, do not stretch one bay.

Rules for a lot module:

- Build only inside the footprint, from the floor at y = 0. Your front must fill the front line from the floor to **y = 3.2** (`LOT_H`); the street draws the band above it. Inside, the ceiling may be anywhere up to 3.4. You draw your own floor, ceiling, party walls and front. An extra-large special may make a taller room inside itself up to y = 7 (the decks above are the block's flats: say what you did in your report).
- Leave a door at least 1.1 m wide in your front, and end a walkway just outside it: `s.path([o.P(doorP, -0.7), o.P(doorP, 1.2), ...])`. The block joins that loose end to the street's walkways itself.
- Everything through the scope `s`: meshes, lights, colliders, spots, prompts, zones, `s.loop(name, x, y, z, { vol, radius })` for looping sound, `s.every((dt, game) => ...)` for anything animated, `s.onDispose(fn)` for anything to undo. The block is torn down when the player walks away, and rebuilt when they come back: nothing may outlive the scope. Never write to `game.spawns`, never call `game.events.on()` without `s.onDispose(off)`, never keep module-level state about a particular block.
- The same every time for the same `lot.seed`: take all randomness from `new Rng(lot.seed)`.
- Call `await tick()` between the parts of anything big (after the shell, after each row of furniture). It returns at once while the frame has time left and waits for the next frame otherwise. A lot that works for more than about 10 ms without a tick makes the game stutter as the player walks.
- Budgets, with the whole lot in view: a shop or room under 25,000 triangles and 6 lights; a hall or large special under 90,000 and 16; an extra-large special under 160,000 and 24. Total build time under 60 ms for a shop, 250 ms for an extra-large special.
- Signs are few and reused: each block has one page of the sign atlas for everything in it. A shop gets its fascia (the kit's `shopfront` draws it from `lot.name` and `lot.sub`), and at most three more small signs. Prefer geometry to text.
- Give it a zone: `s.zoneBox({ id: lot.id, place: 'city-shop' | 'city-room' | 'city-hall' | 'city-special', box: [lot.x0, -0.5, lot.z0, lot.x1, 3.4, lot.z1], name, sub: info.name + ' · ...', ambience, reverb, cell: info.key })`.
- Life: a keeper's post (`s.spot('counter', ...)`), customers, seats, work places with tags. Things to do: two to four `s.interact`s with written lines (`say(game, who, [lines])` from `lots.js`, or `note(game, text)` for a toast), true to the place and to the canon. Vary the lines by `lot.seed` so two blocks' bakers do not say the same thing: write at least four alternatives for anything a player will read in every block.
- What you know about the block: `plan.info` has `name`, `avenue`, `street`, `hall`, `cook`, `dish` (`[name, line]`), `pride`, `d0`, `d1` (its decks), `g`, `band` (`'low' | 'middle' | 'high'`), `bandName`, `ring`, `ringName`, `style` (0 to 5), `people`, `address`, `sub`. Use them: a shop on the High decks, at half a g, among the old, is not the same shop as one on the Low decks among children.

To see yours: `node tools/shot.mjs --q "cell=0:5:3&lot=special.school&t=13" --wait 9 --shot "out/<you>/a.png|3"`. `cell=L:i:j` is any block (layer 0 to 57, round 0 to N-1, along 1 to 17); `lot=<key>` finds the nearest block round the drum whose plan has such a lot, builds it and stands you outside its front. The console prints the lot's footprint and front side. Check **at least four blocks with different fronts** (the print tells you which side each is on) on at least two bands (`cell=0:..`, `cell=25:..`, `cell=50:..`), by day and at lamp-night (`t=13`, `t=22`). Move with `game.player.place(game.player.frame, x, 0, z, yaw)` in `--shot` JavaScript. `node tools/walk.mjs --q "cell=0:5:3&lot=special.school" --yaw <rad> --secs 20 --walk` holds W for you and reports whether you got stuck or fell.

## Kind two: a landmark (a place built once, by hand, somewhere in the drum)

A landmark is a place module like Candlewick's, in its own frame, that is built the first time a cab is called to it and taken down when the player has gone on. It needs three more lines than a v1 place:

```js
// src/places/lm_<name>.js
export const place = {
  id: 'lm-<name>', name: '<What it is called>', order: 10,
  region: '<region id>',                                   // every file of one landmark shares this
  stops: [{ id: '<stop id>', name: '<on the cab list>', sub: '<band · deck · ring>', group: '<your assignment gives it>', spawn: '<spawn name>', deck: <deck number>, zd: <drum z> }],
  async build(game) {
    const f = game.world.frame('<frame id>', deckRadius(<deck>), <theta0>, <z0>);
    const s = game.world.scope('<scope id>', f);
    // ... build ...
    s.finish();
    game.spawns['<spawn name>'] = { frame: f, x, y, z, yaw };   // where the cab sets you down: put a lift lobby there
  },
};
```

- Your frame's radius gives the weight there (`gAt(rho)`), and the player and the people already move by it: slower falls and long strides at a third of a g, a jump of fourteen metres at a twentieth. Your assignment gives your deck, ring, angle and frame id. One frame is flat metres at one radius; a place on several decks uses `y = 4 * (deck - d0)` in one frame (weight changes little over a few decks), with `level` set per deck when you draw.
- In the cab stop: `deck` and `zd` are for the ride's deck counter; `group` puts your stops under one heading on the cab's list. Put a lift lobby at your spawn with a berth whose prompt calls `game.cab.open('<stop id>')`, so the player can leave.
- A landmark in the Hollow (frame `hollow`) or on an end wall is found on foot as well: give the place record `near: { frame: 'hollow', x, z, r }` and it is built when the player comes within `r` metres. On an end wall or the axis, set `f.hollowView = true` so it and the Hollow see each other.
- While a region is being built, listeners you add with `game.events.on` and loops you start with `s.loop` or `game.loopAt` are remembered and removed when it unloads. Still prefer the scope's own methods.
- `build` may be `async`: `await` between big parts (`await new Promise(requestAnimationFrame)`) so the cab's ride does not freeze. Whole build under 1.5 s.
- Budget with everything in view: under 600,000 triangles and 150 lights, 60 frames a second at 1280 by 720. A landmark is a destination: it should have one big view that could only be here (the vats in their hundreds, the shaft going up out of sight, the stars), three or four smaller places inside it, people at work with the right tags, and six or more things to do or read.
- To see yours: `node tools/shot.mjs --q "only=lm-<name>&at=<spawn name>&t=13" --wait 3 --shot "out/<you>/a.png"`. With `only=` your place is built at once instead of on demand. The city, the people and the story are always loaded.
- Rides and other set pieces: `game.player.sit({ x, y, z, yaw, eye })`, `.stand()`, `.locked = true`, `.gOverride = <g>` (set it back to `null`), `await game.ui.fade(true, 0.4)`; read `src/game/cab.js` for a whole ride done this way. For floating in no weight, `game.player.startFlight({ x, y, z, maxRho, z0, z1 })` and `.endFlight()` (see `src/places/spindle.js`); use it only if your assignment says so.
- A picture you paint yourself (the stars through a Window, a great board): `const r = game.atlas.add(1024, 512, (ctx, w, h) => { ...2D canvas drawing... }, 'my-key')`, then `g.atlas(r.page, { emissive: 1.5 }); g.quad(p0, p1, p2, p3, { uv: [r.u0, r.v1, r.u1, r.v0] })` inside `s.deco(...)`. One or two per landmark, no more: they come out of a small budget of texture.

## Writing

- Names: Chervil's places are Chervil's own. The digest lists the kinds of place the canon names, mostly as Sorrel has them; do not copy Sorrel's proper names onto Chervil unless your assignment gives you the name. Chervil is the loud, generous, food-proud drum: its names are plain nouns and kitchen words.
- Every line a player reads should carry something true about this world: a number, a rule, a habit, who pays, what it weighs here. The digest's sections 9 to 11 are full of them.
- Do not put Candlewick's people (Marit, Jory, Oona and the rest of `src/content/cast.js`) anywhere else. New named people are fine in signs and lines; they have no bodies unless you give a spot `who:` (do not).

## Report back

Short: the files you wrote; triangles, lights and frames per second with everything in view; build time; the blocks or spawns you tested and at which hours; every spot type and prompt you added; what you invented that is not in the digest (for the not-canon list); anything you needed from the engine and did not have; what you would do next. The lead will look at the place itself.
