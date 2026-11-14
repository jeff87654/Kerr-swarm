# A Card from Every Row: how it is built

An endless flight through the drums of Merrow. One world is on screen. The next is built a few milliseconds at a time while you fly, then drawn through an opening at the end of this one, so a crossing has no cut. Everything is generated in the browser: no pictures, models or recordings are loaded.

This file is the contract between the parts. A world file that follows it can be dropped in beside the others.

## Layout

```
index.html            the page, for development (python tools/serve.py, then http://localhost:5210/)
dev.html              one world alone: dev.html?file=<name of a file in src/worlds, without .js>; or several in order, file=a,b
src/main.js           entry: the list of worlds, handed to boot()
src/boot.js           starts the engine, the interface and the sound
src/dev.js            entry for dev.html (not part of the release)
src/core/engine.js    the flight: building, the opening, crossing, picture quality
src/core/path.js      camera paths
src/core/post.js      bloom, grading, tone mapping
src/core/audio.js     sound, synthesised
src/core/rng.js       seeded random numbers, noise, small maths
src/kit/drum.js       the drum's numbers; frames for bending flat models onto it
src/kit/geo.js        the geometry builder (Geo) and instances()
src/kit/mats.js       light rigs, the lit material, glowPoints, shared shader text
src/kit/plan.js       painting a Hollow's floor plan
src/kit/hollow.js     the Hollow: land, end walls, sunline; terraces to build on
src/kit/flora.js      trees and scattering them
src/kit/deck.js       decks: streets, arcades, courts, halls, lobbies; signs with real lettering
src/kit/outside.js    outside: the hall between the layers, a drum from outside, quays and trains; the sky behind the raft
src/kit/folk.js       people and crowds
src/worlds/*.js       one file per world; index.js lists them in the journey's order
src/ui/               the interface and its stylesheet
tools/serve.py        dev server            tools/shot.mjs   pictures and smoke tests in headless Chrome
tools/sheet.py        contact sheets        tools/build.py   the release bundler (one HTML file)
tools/flow.mjs        the whole journey, every crossing      tools/hitch.mjs   slow frames in a live run
tools/gaze.mjs        how fast the camera turns in a flight  tools/worlds.py   the list of worlds for the README
tools/cross.mjs       one crossing, looked at closely: the approach, the way through, the arrival
tools/jitter.mjs      does a surface shake as the camera moves? frames a hair apart, and how much they differ
content/brief.md      what a world should be, and what the docs allow
content/brief-rooms.md   the same for a place indoors: what a room needs, kit notes, what makes the flight stutter
```

## Rules for every source file

The release bundler (`tools/build.py`) reads a strict subset of module syntax. Break a rule and the page works in development and fails when built.

- Imports are static, named and relative, and end in `.js`: `import { a, b } from '../kit/geo.js';`. From three: `import { Vector3, Mesh } from 'three';`.
- Exports are `export function`, `export function*`, `export class` or `export const`, starting at column 0. No default exports, no `export { a, b }`, no re-exports.
- No top-level `await`, no dynamic `import()`, no side-effect imports.
- No top-level name `THREE`, `__mods` or `__req` in a module: the bundle keeps three.js and its modules under those names, and a module's own would hide them (a constant `THREE` holding the strokes of a figure 3 once did: the dev page ran and the built page did not start).
- The built page is the release: after `python tools/build.py`, load it (`node tools/shot.mjs --page dist/index.html ...`, `node tools/flow.mjs --page dist/index.html`) before calling anything done.
- Run `python tools/build.py --check` before you call a file done. It also checks the writing rules below.
- Windows notes: write files with LF line endings; do not paste long scripts into the shell (they arrive cut off or with backslashes eaten): write a script file and run it.

## The idea everything rests on: model flat, draw bent

Geometry is modelled FLAT, in metres, as on any ground: **x = spinward** (arc length round the floor), **y = up** (toward the axis), **z = along the axis** from the front wall (0) to the back wall (L = 3,750). A material made with `bend: frame` wraps the model onto the drum in the vertex shader. A street modelled straight curves up ahead of you on screen; a camera path given flat follows the floor.

A frame is `makeFrame(a0, z0, floorR)` from `kit/drum.js`: the angle its x = 0 sits at, the z its z = 0 sits at, and the radius of the floor it stands on (1,500 for the Hollow floor, `deckRadius(n)` for deck n, less for a terrace). `frame.point(x, y, z)` gives the place on the drum.

- A Hollow uses one frame for its whole floor: x from 0 to C = 9,424.8 (wrapping), z from 0 to 3,750. The far bank over your head is the same floor at x + C/2: flat `(x, 3000, z)` is the point on the far bank straight above `(x, 0, z)`, and `(x, 1500, z)` is on the axis.
- An Hour is a 30 degree wedge, C/12 = 785.4 m of floor; a Ring is a 417 m slice along the axis (sorrel.md). They are Sorrel's names: other drums address themselves otherwise or not at all.
- At height y above a floor of radius R things are narrower round the drum by (R - y)/R. Small things do not care. Anything built high up (on a terrace, on a high deck) gets its own frame with its own floor radius, so its metres are true: see `hollow.terrace()`.
- Long faces must be cut into short pieces to bend: `new Geo({ maxSeg: 8 })` splits any triangle wider than 8 m in x. Use about 8 on decks, 16 in the Hollow.
- A bent mesh is culled by where it really is only if told: `geo.mesh(material, frame)` and `instances(..., { frame })` do it for you.
- Things in open space (the raft, the sky behind it) are not bent: build them in plain world coordinates with a material that has no `bend`.
- A pattern worked out in the fragment shader from where the pixel lies (rails, fins, tiles) is only as steady as that position, and the position is carried across each triangle from its corners. Never draw such a surface as one huge triangle pair: across a quad thousands of kilometres wide the position is good to decimetres, differently in every frame, and the pattern shakes as the camera moves (the radiator plain did). Cut it into a grid that is fine near the camera (`sheetMesh` in `kit/outside.js`), and check with `node tools/jitter.mjs`.

## A world file

```js
import { Scene } from 'three';
import { makePath } from '../core/path.js';

export const squallSwell = {
  id: 'squall-swell',                       // used in links: ?w=squall-swell
  title: 'Swell hour',                      // the picture on the card: five words at most
  drum: 'Squall', row: 'Weather Row', kind: 'a steady drum',
  light: 28.0,                              // seconds of light delay home to Chervil (the table in content/brief.md)
  line: 'I stood up on the eleventh try. Then I fell off, very slowly, which at half a g leaves you time to wave.',
  tone: '#9fd0d6',                          // the card's colour, and the mist in an opening before its world shows
  source: 'wander-year.md (Day 103)',       // where in docs/ the place comes from
  sound: { root: 48, scale: 'lydian', pad: 0.5, air: 0.2, water: 0.8, crowd: 0.3, bells: 0.2, bright: 0.6 },
  *build(ctx) {                             // a generator: yield often, so the flight on screen never stutters
    const scene = new Scene();
    // ... build ...
    yield;
    const path = makePath([...], { frame, entryRadius: 8, exitRadius: 30 });
    return { scene, path, near: 0.5, far: 9000, look: { exposure: 1.1, bloom: 0.15 }, update(t, dt, camera) { } };
  },
};
```

`ctx` is `{ renderer, q, density, engine }`. `ctx.density` is 0.4 (Low) to 1.4 (Ultra): multiply counts of scattered things by it. `ctx.q.plan` is the pixel size for a Hollow's Plan.

What `build` returns:

| field | |
|---|---|
| `scene` | a three.js Scene holding the whole world |
| `path` | from `makePath()`: the flight, its entry and its exit |
| `near`, `far` | the camera's clip distances in this world's metres. Keep far/near under about 30,000 |
| `look` | `{ exposure, bloom, threshold, spread, vignette, grain, saturation, contrast, lift:[r,g,b], gain:[r,g,b] }`, any subset. Keep hold of the object: `update()` may change its numbers as the light changes. Defaults: 1, 0.15 (use 0.1 to 0.35), 1, 1, 0.45, 0.03, 1.05, 1.03 |
| `update(t, dt, camera, engine)` | called each frame with the seconds into the flight. Also called while this world is only seen through the last world's opening, with t = 0. Keep it cheap |
| `portal` | options for the opening at the end: `{ shape: 'rect', width, height }` for a doorway instead of a disc; `rim: false` to leave off the glowing ring; `rimPower`; `mist` (colour); `openFor` (seconds before the crossing that the next world is drawn through it, default 16: until then it holds mist) |
| `onPortal(mesh, rim)` | called once, when the engine has made the opening, with its mesh and its rim's (or null). For a world that must hold back or move its own opening: `carillon_peal.js` keeps it hidden until the tenor bell is standing and turns it with the bell's mouth |
| `dispose()` | free anything the engine cannot find by walking the scene (it disposes geometries, materials and their textures itself) |

Yield after every big step, and inside long loops by the clock: `if (performance.now() - t0 > 4) { yield 'trees'; t0 = performance.now(); }`. A `yield` may carry a few words saying what was just done; with `?debug` the engine logs any single step over 40 ms by that name (shot.mjs prints it as "steps over 40 ms"), and one long step is a visible stall in the world on screen. Kit builders that are generators are called with `yield*`.

### Entry and exit: the rules that make crossings work

The engine maps the exit opening of one world onto the entry of the next and scales one to the other, so a doorway can open onto a Hollow.

- **Entry.** The flight starts at the first key, moving straight ahead toward the second. `entryRadius` is the size of the opening you arrive through. The disc of that radius round the start point, square to the direction of travel, **must be clear**: no ground, wall or tree inside it or just ahead of it. At 2.2 m above a floor, `entryRadius` is at most 2. In mid-air it can be 10 or 20. The starting speed is 1.15 x entryRadius metres a second: small openings start slow, which suits rooms.
- **The first picture matters.** For about ten seconds before a crossing your world is seen through the last world's opening, from the entry, looking along the first leg. Make that view good.
- **Exit.** The opening stands where the flight is 0.8 s before its end (`path.exit.pos`, `path.exit.quat`), square to the direction of travel there; the last two keys set that direction. `exitRadius` is its size and must also be clear all round (for a disc 30 m in radius, 30 m from the ground). The flight ends at 1.15 x exitRadius metres a second. The opening should be in view, ahead, for the last 8 to 12 seconds: fly toward it, do not turn onto it at the last moment.
- **Frame the exit** if the place suggests it (a hoop of lamps in the flying hall, an arch at the end of an arcade, a lift's doors): build it unbent, at the origin facing -z, then `mesh.position.copy(path.exit.pos); mesh.quaternion.copy(path.exit.quat)`. Use `hollow.plain` or `litMaterial(rig, {})` for it. By default the engine draws a glowing ring round a disc opening; pass `portal: { rim: false }` if your frame replaces it.
- **Length.** 40 to 65 seconds. The engine waits short of the opening if the next world is not built yet, so do not add padding.
- Nothing behind the entry is drawn for the first second and a half after a crossing, so it does not matter what is behind you at the start.

### Camera paths

```js
const path = makePath([
  { t: 0,  p: [2700, 2.2, 1875] },                               // start: on a lane, eye height
  { t: 7,  p: [2760, 3.2, 1875], look: [3300, 520, 2115] },      // look up at the land overhead
  { t: 15, p: [2950, 30, 1845],  look: [4650, 0, 1875] },
  { t: 56, p: [4870, 170, 2775] },                               // no look: straight ahead
], { frame: hollow.frame, entryRadius: 1.8, exitRadius: 34 });
```

- Keys are `{ t, p, look?, up?, fov?, roll? }`, times in seconds from 0. With `frame`, p and look are flat. The curve through them is smooth; put keys 6 to 12 seconds apart and avoid sharp reversals.
- "Up" is toward the axis from wherever the camera is. Near the axis that is unsteady: give `up: [0, 1, 0]` on every key (flat: toward the axis from the key's own x) and vary x between keys to turn the world slowly round you (`worlds/chervil_flight.js`).
- At both ends the view swings to face the direction of travel (over `align` seconds, default 2.2).
- `path.points(0.5)` is the flight as flat points every half second: hand it to the scatterers as `near`.
- A good flight has three or four pictures in it: a close beginning, a reveal, a passage past something particular, and the run at the opening. Looking along the axis shows the land rising on both sides and closing overhead; looking spinward shows it rising like a wave ahead.

## The kit

### Light and colour

Pictures are drawn in linear light and tone-mapped at the end. A surface colour is what you would paint it (`'#8aa466'`); light of 1 is full sun on a floor facing it. Lamps and windows glow through `emit` (1 to 8) on geometry or `power` (2 to 12) on glow points; anything above about 1 blooms. `look.exposure` sets how bright the whole picture is: a dawn at `sunPower: 0.5` wants `exposure: 1.9`, and then its lamps and windows shine against the land, which is where a mood comes from.

**Use only the kit's materials** (or shaders built from the kit's shader text). three's own materials are not bent and are not cut at a crossing.

`litMaterial(rig, opts)` draws Geo geometry: `bend` (a frame), `side: 'double'`, `emit` (multiplies every vertex's glow), `soft` (how far tinted faces are lit as if they faced up, default 0.7: leaves and clothes), `walk`, `drift`, `stride` (with `drift`: a small bob at each step, for people walking a line), `transparent`, `opacity`, `additive`.

A rig says how surfaces are lit:

- `hollowRig({ sun, sunPower, sunFar, sunFarPower, sunAngle, sunSharp, amb, ambPower, bounce, bouncePower, ground, groundPower, air, airDensity })`: the sunline (lit from 450 m short of each wall), the Hollow's own glow (`amb`), light thrown up off the land (`bounce`), warm light near the floor at night (`ground`), and the faint haze of distance (`air`). `sun` is the line seen from the side at angle `sunAngle`, `sunFar` from the opposite side: a painted dawn can gild one bank and leave the other dark. `rig.set({...})` changes them while flying. `buildHollow` makes this rig for you (`hollow.rig`).
- `lampRig({ ambUp, ambDown, lattices, zones, haze, hazeDensity, maxLattices, maxZones })`: indoors. A lattice is a regular grid of lamps `{ origin:[x,y,z], spacing:[sx,sz], count:[nx,nz], color, power, reach }` (flat coordinates); its light falls off with distance, beyond the grid's edge too. With `drop` it reaches only that far below the lamps and not through the ceiling above them; with `storeys` and `rise` the same grid lights several decks, each surface taking its own storey's lamps. A zone is a box lit from above `{ min, max, color, power, soft }`, for a bright court; `flare` widens it with height, `side` and `under` set what upright and downward faces get. Four of each, or up to eight with `maxLattices` / `maxZones`; `rig.setLattice(i, lattice)`, `rig.setZone(i, zone)` and `rig.set({...})` change them later. `makeDeck` makes this rig for you (`deck.rig`).
- `plainRig({ dir, color, power, amb, haze, hazeDensity })`: one direction of light and an ambient, for things in open space.

`glowPoints(points, { bend, minPx, maxPx, soft })` draws any number of small lights in one call: `{ p:[x,y,z], color, power, size (metres), move:[vx,vy,vz], loop (seconds), twinkle, phase }`. A light too far off to fill a pixel dims instead of shrinking, so a row of lamps runs off to a vanishing point properly.

Writing a shader of your own: include `CLIP_PARS` and `CLIP_FRAG` (needs a `vW` varying: the position on the drum), bend with `BEND_PARS` / `kBend(p, n)`, take `uClip: G.uClip` and `uTime: G.uTime` as uniforms, light with the rig's text (`rig.glsl` gives `kLight(P, N, F, FN)`, `kUp(P)`, `kAir(colour, P)`) and spread `...rig.uniforms` into yours. `kit/hollow.js` is the worked example.

### Geometry: `Geo`

```js
const g = new Geo({ maxSeg: 8 });
g.box(x0, y0, z0, x1, y1, z1, '#d8cdb8', { top: '#eee', skip: 'b' });   // also cube(cx, cy, cz, sx, sy, sz, ...)
g.cyl(x, y, z, r0, r1, h, sides, colour, { smooth, cap, emit });          // prisms, cones, posts
g.blob(x, y, z, [rx, ry, rz], detail, colour, { lump });                  // a faceted ball: crowns, heads, stones
g.tube(points, radius, sides, colour);     g.lathe(x, y, z, [[r, h], ...], sides, colour);
g.extrude([[x, z], ...], y, h, colour);    g.quad(a, b, c, d, colour, emit);   g.tri(...);   g.floor(x0, z0, x1, z1, y, colour);
g.at(x, y, z, yaw, scale); ...; g.pop();   // place what is drawn in between
g.tint(1); ...; g.tint(0);                 // faces drawn in between take an instance's colour (and the soft light)
scene.add(g.mesh(material, frame));
```

Corners of `quad` and `tri` go counter-clockwise seen from the front. Every face is flat-shaded unless the primitive is smooth. `instances(geometry, material, items, { frame, cell, walk, drift })` draws many copies: items are `{ p, yaw, scale, color, walk:[stroll radius, speed, phase, bob], drift:[vx,vy,vz,seconds], phase }`. Returns a list of meshes to add.

### A Hollow

```js
const plan = new Plan(ctx.q.plan);          // paint the floor: kit/plan.js
plan.fill(plan.band(0, L), { color: '#8aa466', life: 0.25 });
plan.fill(plan.blob(4650, 1875, 1170, 610, { wobble: 0.16 }), { color: '#5fa6a4', water: 1, clear: ['life', 'wood'] });
plan.stroke(points, 6, { color: '#c9bd9f', paved: 0.8, life: 0.7 });  plan.lamps(points, 26);
const hollow = yield* buildHollow(ctx, { plan, light: {...}, sunline: { power: 60 }, ground: {...}, front: {...}, back: {...} });
scene.add(hollow.group);
yield* scatterTrees(hollow, { near: path.points() });
yield* scatterPeople(hollow, { near: path.points() });
```

The plan has three layers painted together. `fill` and `stroke` take: `color` (what the land looks like from far off), `water`, `wood` (tree cover: the ground draws a crown in every 7.5 m cell, standing up off the land), `lamp` (glows when `ground.lamp` > 0), `paved`, `rows` (an orchard: a tree on every point of a lattice, in blossom, leaf or fruit by section), `life` (people), `clear: [...]` and `feather`. Helpers: `rect`, `band`, `ellipse`, `blob`, `poly`, `curve`, `dots`, `lamps`, `avenue`, `clumps`, `garden`, `mottle`; `layer(name, fn)` and `once(name, fn)` for canvas drawing of your own. Painting is queued and done by `buildHollow` a little each frame, so read the plan (`hollow.at`, `plan.sampler()`) only after it. A drawing is made three times, a turn apart, so that it may cross the seam; a shape from the plan's own helpers knows how far round it reaches and is drawn only where it can show. Give a `Path2D` of your own `_x = [least x, greatest x]` for the same saving, and put thousands of small shapes into a few paths, not a call each. Do not read the plan's canvases yourself (`getImageData`): a canvas that is read back is taken off the graphics card by the browser, and everything painted on it afterwards is slow. Use `hollow.at`. A shader of your own that reads the colour layer (`hollow.tex.alb`) must call `kLand()` on what it reads (`LAND_GLSL` from `kit/plan.js`): the layer is kept as painted, not as light. Shapes may cross the seam at x = 0 / C. Paint richly: land seen from a kilometre off is only as interesting as its plan. `worlds/sorrel_lake.js` and `worlds/chervil_flight.js` are worked examples by day and by night.

`buildHollow` spec, in brief (the comment above it in `kit/hollow.js` is complete):

- `light`: the hollowRig options. `sunline: { power }`: how bright the rod itself is (60 at noon, 0 for a dark cable).
- `ground`: `canopy`, `blossom`, `fruit`, `rows:[sx,sz]`, `lamp` (0..1), `lampColor`, `people`, `wave`, `swell`, `sunRod` (the line's brightness in water: match `sunline.power`), `stripes`.
- `front`, `back` (the end walls): `lit` (share of windows lit), `crowd`, `garden`, `stone`, `stone2`, `houses` (six colours), `houseMix`, `chart` (0 to 1: the wall painted as a colour chart, each house one swatch, the hue going once round the wall through twelve pigments, shades at the foot and tints toward the axis; `chartColors` gives your own twelve), `winA`, `winB`, `winPower`, `tiers: { 9: { crowd, garden, lit } }`, `depths`.

The Hollow it returns: `group`, `frame`, `rig`, `plan`, `lit` / `litDouble` / `walk` (materials bent to the floor), `plain` (unbent), `at(x, z)` (read the plan: it was read back once while the Hollow was built, so this costs nothing), `glow(points)`, `add(mesh)`, `lampPosts({ near, power })`, `terrace(side, tier, deg)`, and for light that changes as you fly: `rig.set({ sun, sunPower, sunFar, sunFarPower, sunAngle, sunSharp, amb, ambPower, ground, groundPower, air, airDensity })`, `setRod(power)`, `setLine(z1, z2)` (shorten the lit line), `setNight(lamp, lit)` (walk lamps; share of windows lit), `setWindows(side, tier, share)`.

**End walls.** Thirty tiers of 47.5 m each climb from the floor to the flying hall 75 m from the axis. Each riser is an arcade, nine floors of flats with balconies, and a garden hanging over its top; each terrace is a rail, a walk and beds. `TIERS` names the docs' four: `third` (tier 9, a third of a g), `quarter` (14), `tenth` (24), `twentieth` (27). `hollow.terrace(side, tier, deg)` gives a frame and materials for building on one: x in true metres round it, y above its floor, z = 0 at the rail, the houses at `z = toWall * depth`.

**Things the Hollow does not have, by canon:** weather, clouds, sky, stars, wind (kites are flown by walking), animals, soil, fire. Light comes only from the sunline and from lamps, so there are no long shadows: use the light's colour, the dark Dim Ends, lamps and windows for mood.

### Trees and people

`treeGeo(kind)`: 'round', 'apple', 'pear', 'yew', 'pine', 'birch', 'poplar', 'bush'. `scatterTrees(hollow, { near, radius, wood: [{ kind, weight, tint }], orchard: { kind } })` stands real trees within about 170 m of the flight, exactly where the ground draws crowns. `figureGeo(skin, pose)`: 'stand', 'sit', 'child', 'fly'. `crowd(spots, material, { frame })` makes people from `{ p, walk, sit, child, yaw, color }`; `scatterPeople(hollow, { near, radius, density })` puts them where the plan has life. People are small: they are how a picture gets its scale.

### Decks: the indoor city

```js
const frame = makeFrame(a0, z0, deckRadius(75));                  // the deck whose floor is y = 0
const path = makePath([...], { frame, entryRadius: 1.1, exitRadius: 1.1 });
const deck = makeDeck(ctx, { frame, near: path.points(0.5), seed: 'ashgrove', palette: PALETTES.warm, light: { level: 0.85 } });
const arcade = yield* street(deck, { axis: 'x', from: -236, to: -55, at: 0, width: 8, trolley: { every: 70 }, cloth: 0.5,
  fronts: { back: [{ from: -100, to: -91, kind: 'shop', name: "Dace's", goods: 'cloth' }, { from: -91, to: -87, kind: 'stair' }] } });
const court = yield* atrium(deck, { x0: -45, x1: 45, z0: -30, z1: 30, y: -8, storeys: 6,
  mouths: [{ side: 'anti', storey: 2, at: 0, width: 8, bridge: 5 }] });
yield* bridge(deck, { axis: 'x', from: -49, to: 45, at: 0, y: 0, hang: 16 });
yield* hall(deck, { x0: -85, x1: -55, z0: -22, z1: -4, open: { back: true }, tables: { axis: 'x', rows: 3 } });
const lifts = lobby(deck, { at: [0, -99], y: 8, face: 'back', hole: 1 });
yield* finish(deck);
scene.add(deck.group);
```

`kit/deck.js` builds the inside of the decks: streets and arcades under 3 m ceilings, courts cut up through several decks, halls, lift lobbies. Everything is modelled flat in one frame, `makeFrame(a0, z0, deckRadius(n))`, and bent when drawn. **Other decks of the same block are other heights in that frame**: the deck above is y = 4, a court floor two decks down is y = -8. Make the path first and hand its points to `makeDeck` as `near`: fronts are modelled in full within `detail` metres of the flight (48 by default) and as a few flat faces beyond, and nothing that juts out (an awning, a hanging sign, a tub, a person) is stood in the camera's way.

Words: an avenue (axis `'x'`, spinward, curving up ahead) has a `front` side (-z) and a `back` side; a street (axis `'z'`, dead straight) has an `anti` side (-x) and a `spin` side. A court's four sides take the same names. Places along a street or a side are given as plain deck co-ordinates (an x or a z).

- `makeDeck(ctx, { frame, near, palette, light: { level }, floor, seed, clock })` opens the place. `PALETTES.warm`, `.bright` and `.dim` are three paints (walls, dado, trim, doors, awnings, sign boards, floors, leaves, lamp and window colours): spread one and change what differs. `light.level` scales every lamp and lit window: 0.5 is hushed, 0.85 a plain warm drum, 1.5 a drum that spends on its lamps. The deck it returns has the materials (`lit`, `litDouble`, `prop`, `walk`, `drift`, `plain`), `bucket(x, z)` and `pen(run)` for drawing your own geometry into its meshes, and the calls below.
- `street(deck, spec)` (a generator): floor with a trolley's rails, ceiling with flat arched ribs and pipes, a row of lamps (panels or hanging globes) and their light, both rows of fronts, name plates hung across, people, flags. `fronts` places the ones you care about; `fill` makes the rest from a mix of kinds and a list of trades. Two stretches of one street either side of a court share one rhythm of lamps with `lamps.grid`, and one lattice of light with `lamps.lattice`. The ribs spring above the lettering of the shop boards (a rib that springs lower stands in front of the names, seen along the street). They are drawn last, by `finish()`, when every sign on the deck is known: a rib that would stand in front of a sign set higher than that (a hall's name on its beam, a stair's plate, a name over the window of a front of your own) is moved along to the nearest clear place, or left out. If you draw beams or ribs of your own, keep them clear of lettering in the same way.
- **Fronts** (`frontage(deck, run, spec)` is the row on its own). Kinds: `shop` (door, window with `goods` in it, name on a board, an awning or a hanging sign, a card in the window), `stall` (an open counter), `home` (a door in a wall: homes have no windows), `flat` (a home on a court's terrace, with windows), `hall` (piers and a beam: the open side of a hall), `stair`, `wall` (with a `notice` or a bench), `gap` (a way through), `custom` (`draw(P, bay, run, H)` draws it in the row's own co-ordinates). `goods`: bread, greens, cloth, pots, books, lamps, toys, shoes, flutes, jars, tea, noodles, bottles, paper, drawings. The row returns its bays; `row.find(id).at(t, y, v)` is a point of one, for standing your own things in a shop.
- `atrium(deck, spec)` (a generator): a court. Its terraces step back as they rise, so each ring of planting stands in the light. It makes the floor (with paving bands), each storey's terrace, rail of planted troughs and glass, posts, flats with lit windows, lamps under the slabs, people at the rails, and a ceiling of lamps; and it sets the light: the floor brightest, the terraces a share of it (`light.terraces`, 0.3). `sides.spin.wall: 2` leaves a sheer wall two storeys tall on that side. `mouths` are where streets come out. It returns `rail(side, storey)`, `wall(side, storey)`, `y(storey)` and `sideRun(side, storey)`.
- `bridge(deck, spec)`: a way across a court, hung on rods from its ceiling. `trolley(deck, spec)`: slow cars with riders along a line (a street calls it for its own; call it yourself for a line that runs on over a bridge). Things that travel keep the page's clock, so where a trolley is when the camera comes by is chance. To choose, open the deck with `clock: 'flight'`, give `trolley` its `cars: [places at the flight's start]`, and call `deck.tick(t)` from the world's `update(t)`: Ashgrove overtakes one car by the stair and follows another out over the Court.
- `hall(deck, spec)`: one long room with its own lamps; `tables` lays long tables with benches, dishes under lids and people eating; `pool` lets warm water into the floor, with bathers and steam. `open` leaves out stretches of wall where a street's `hall` front or a court stands.
- `lobby(deck, spec)`: a wall of cab doors. `open: [i]` shows a lit cab; `hole: i` leaves a door for the world's way out and returns `slide(k)`, which parts its two leaves: with `portal: { shape: 'rect', width: 1.5, height: 2.2, rim: false }` and a path that ends square through that door, a cab's doors open onto the next world. Put the lobby where the path ends: `path.exit.flat` is the middle of the opening, and the wall's face stands `DOOR_IN` (0.34 m) in front of it, so the leaves close over the opening. Call `slide()` from `update(t)`: Ashgrove opens them between 6.5 and 3 seconds before the crossing.
- `stairs(deck, spec)`, `rose(deck, spec)` (a direction rose in a floor: spinward, anti, front, back).
- **Furnishings**: `deck.put(kind, { p, yaw, scale, color })`. Kinds: chair, armchair, stool, table, tableRound, tableLong, benchLong, bench, crate, tub, tubTree, pot, planter, bush, trail, flower, stall, lampPost, pendant, dish, bowl, pan, cart, ladder, robot, banner, sheet, bunting, shelf, counter, noticeboard, trolley. Each kind is one instanced mesh however many there are. `deck.proto(name, (g, pal) => { ... })` adds one of your own (model it at the origin, front toward -z; faces drawn with `g.tint(1)` take each copy's colour).
- **Signs**: `deck.sign(text, { at, n or run or up, h, w, style, font, ground, ink, glow })` is real lettering from one canvas atlas. Styles: `board` (a painted fascia), `plate` (enamel: street names, addresses, door numbers), `chalk`, `paper`, `card`, `glow`. Fonts are the page's own: `serif`, `italic`, `sans`, `cond`, `hand`. Text may be several lines. Sign text is read by the viewer: the writing rules apply to it.
- **People**: `deck.people(spots)` takes what `crowd()` takes (they stand, sit or stroll a small circle); `deck.knot(x, y, z, n)` stands a few talking; `deck.walkersAlong({ from, to, n, speed })` walks people along a line and round again (they fade in and out at its ends, so put the ends out of sight; with `start` on a deck that keeps the flight's clock, they pass the camera when you choose: children race anti down an avenue). `deck.clear(x, y, z, r)` says whether the flight passes within r of a point.
- **Light**: `deck.lattice({...})` and `deck.zone({...})` add lampRig lattices and zones (up to 8 and 6 on a deck: a street takes one lattice, a court one lattice and two zones, a hall one lattice); `deck.glow(points)` adds small lights; `deck.sky({...})` tells polished floors what lit ceiling to hold. Floors are drawn by the deck's own shader: slabs, wear, and the shine of the lamps and of a court's ceiling in them.
- `finish(deck)` (a generator, called once, last) turns it all into meshes: one per material per 240 m square, one instanced mesh per kind of furnishing, people by skin and pose, one for all the small lights, one for all the signs.

**What a deck does not have, by canon:** windows in homes (only flats on a court's terraces and on the Hollow's end walls have them); daylight (a court is lit by its ceiling: "overcast-day brightness" on the floor, a grey quarter of that on the terraces in Ashgrove); soil (tubs and troughs); animals; anything that burns. Things are old, mended and inherited: chairs do not match, awnings have a stripe that was replaced. A deck's light comes from above and casts no shadows, so mood comes from the pools under the lamps, lit windows, and the jump in brightness between a street and a court.

**Budget on a deck.** Ashgrove (two stretches of arcade, two of street, four side streets, a six-storey court, two bridges, two halls, a lobby) is 260,000 to 650,000 triangles and 150 to 390 draw calls in a picture, and builds in about 450 ms of work. What costs: fronts modelled in full (keep `detail` near 48), planting on terraces (two thousand bushes), and people. Lettering is drawn on one canvas, 2048 square if it fits and 2048 x 4096 if not; signs far from the flight are lettered small.

---

Two lines elsewhere in ARCHITECTURE.md want changing to match what this work did to `kit/mats.js`.

### Outside: the raft and the sky behind it

`kit/outside.js` builds the two places that are not inside a drum: the mid-raft a glide car falls through, and the back of the raft under the sky. Nothing in it is bent. It is open space in plain world coordinates, in metres:

- **x** runs along a row of drums, **z** along a column, and **y** is aft: 0 at the rectenna layer, `RAFT.DEPTH` = 3,750 at the radiator layer, more than that behind the raft. A camera's up is `[0, 1, 0]` in both places: pass `up: [0, 1, 0]` to `makePath` and give no frame.
- Drum (i, j) stands on the line x = i × `RAFT.CELL`, z = j × `RAFT.CELL` (24,500 m). Every drum turns the same way, +`RAFT.OMEGA` about +y: a drum's +z side moves toward +x.
- So the lane on the +z side of a row runs toward +x and the one on its -z side toward -x; the lane on the +x side of a column runs toward -z and the one on its -x side toward +z. Lanes pass `RAFT.LANE` = 3,058 m from the axes.
- `LEVELS[0..8]` are the heights of the nine quays, Ring One at the front to Ring Nine at the back. Rows glide on Rings One, Three, Seven and Nine (`ROW_LEVELS`), columns on Two, Four, Six and Eight (`COL_LEVELS`), and Ring Five is the tube (`TUBE_LEVEL`), as in sorrel.md.
- Trains are 100 m long, a `RAFT.SLOT` (350 m, two seconds) apart, at `RAFT.SPEED` = 174.4 m/s. A hop is 70 slots and takes `HOP` = 140.5 s.

**Far planes.** From a quay the hall is drawn out to about 1,000 km, so a world on this kit returns `far: RAFT.FAR` (1.3e6) with `near` of 1.5 to 2.5. That breaks the rule of thumb above (far/near under 30,000) on purpose. Depth resolution at a distance d is about d × d ÷ (near × 2^24) whatever far is (10 m at 20 km with near = 2.5), so what matters is that near stays above a metre or two; and every small light in the kit is drawn a little nearer the eye than it stands, so none of them fights the surface it is mounted on. Keep the camera 1.5 × near away from anything solid. For lamps more than a few hundred metres off use `farLights()`, not `glowPoints()`: `glowPoints` has no such offset, and its lamps flicker against a wall 20 km away.

**Look points.** `makePath` draws one curve through a flight's `look` points. If one of them is twenty kilometres off and its neighbours are a hundred metres off, that curve swings back on itself and the camera looks behind it for a second or two. Out here, where the things looked at are from ten metres to ninety kilometres away, keep every look point about the same distance from its own key (a few hundred metres to 3 km), along the line to the thing. Both worlds below do, and both were caught by not doing it.

```js
import { RAFT, QUAY_TINTS, buildHall, nearDrum, quayPiece } from '../kit/outside.js';

const hall = yield* buildHall(ctx, { focus: [0.5, 0], skip: [[0, 0], [1, 0]], tints: { '0,0': 0, '1,0': 6 }, trainsNear: [500, 1300] });
scene.add(hall.group);
const sorrel = yield* nearDrum({ at: [0, 0], tint: QUAY_TINTS[0], dark: [{ level: 6, from: 0, to: 0.25 }] });
const quay = yield* quayPiece({ drum: sorrel, level: 6, angle: 0, from: -440, to: 740, cradles: [0, 350], trains: [350], tunnel: { x: -170, dir: -1 } });
scene.add(sorrel.group);
```

The mid-raft:

- `buildHall(ctx, opts)` (a generator): both layers as sheets to the horizon, each drum's collar of quay light on them, some 5,100 drums out to forty cells from the camera's (dark columns to 14 cells, about 650 of them, and lights only beyond), nine rings of quay lamps on each, the trains on every lane, truss lights in a lattice and on masts, the Yards' and data halls' lights, and the glow where it all meets on the horizon line. `focus` is the cell the camera stays near; `skip` lists drums the world builds itself; `tints` gives a drum one of `QUAY_TINTS`. As measured in `the_glide`: 7 draw calls, 197,000 points, 71,000 triangles.
- The lanes are ribbons with the trains painted along them: dashes near the eye, beads farther off, a thread at the horizon. Slot n of lane L holds a train when `cellRand(n mod 70, L)[0] < fill`, in the shader and in `trainSlots(L)` alike. `nearTrains(lanes)` stands real trains (`trainGeo()`) on the painted dashes within about 1.6 km of the eye: call its `update(eye)` each frame with the eye's place in the hall's own coordinates, and pass `trainsNear: [from, to]` to `buildHall` so the painted ones fade out there. `laneRibbon(opts)` draws one lane on a clock of its own, for a world that must let a train go on the second.
- `nearDrum(opts)` (a generator) is one drum in full: flank, nine quay ledges, a lamp every 40 m on each (4,320). `quayPiece(opts)` (a generator) is a stretch of one quay close to: band, rails, lamp posts, cradles with trains hanging in them, and a tunnel through the jacket with a real hole in the flank. It is modelled flat like a deck (x round the quay, y in from its face, z aft) and bent by a kit frame; `piece.local(x, y, z)` gives a flat point's place in the drum's own coordinates, `piece.tunnelPoint(s)` a point s metres up the tunnel from its mouth, and `piece.hangTrain(x)` one more train as its own mesh.
- **A quay turns.** The kit never turns a `nearDrum`. A world that only looks at one sets `group.rotation.y = RAFT.OMEGA * t`. A world that stands on a quay keeps that drum still and turns everything else: put `hall.group` in a group of your own and give it `rotation.y = -RAFT.OMEGA * t`, as `worlds/the_glide.js` does. Its world coordinates turn with the drums, so that the quay it leaves and the quay it arrives at can each be still in its turn, and their origin slides from one drum's axis to the other's during the fall; the flight is written in the frame each part is simple in and turned into half-second keys.

Behind the raft:

```js
import { RAFT, buildSky, buildBack, backRig, skyDir } from '../kit/outside.js';

const sky = yield* buildSky(ctx, { apex: [0, 24], red: { at: [-6, 22.2], power: 9 } });
const rig = backRig({ riverDir: skyDir(0, 24), lamps: [{ p: [x, RAFT.DEPTH + 4.6, z], color: '#ffe2b8', power: 1.8, reach: 16 }] });
const back = yield* buildBack(ctx, { sky, rig, focus: [0, 0] });
scene.add(sky.group, back.group);
```

- `buildSky(ctx, opts)` (a generator): the River (a glow in the sky's own shader, 150,000 stars as points, dust that dims and reddens both), the Shelf, the brown-violet the crews call bruise where the dust lies over the glow, and other rafts as black shapes drawn over the stars: thin near the horizon, since a raft is a flat sheet lying parallel to this one. `apex` is the bearing and elevation, in degrees, of the River's highest point; `skyDir(bearing, elevation)` turns the same angles into a direction. `sky.raft(at, widthDegrees)` adds one more shape as its own mesh: turn it a few thousandths of a radian with `mesh.rotation.y` and it creeps. As measured: 5 draw calls, 161,000 points, 26,000 triangles.
- The docs say about a sixth of that sky is rafts. The kit draws 3.5% of it as shapes (`sky.shown`) and takes the rest of the sixth off the brightness of the glow and of every star. A sixth drawn as shapes a degree across and less is so many that the River reads as dirty, not as holed.
- `buildBack(ctx, opts)` (a generator): the radiator plain at y = `RAFT.DEPTH` to a flat horizon (rows of panels 46 m wide along x with a service track on every line z = 54 n, rings of panels within 3,050 m of each back axle, trunk pipes), the lights of a dock at every drum out to forty cells, and far sleds' lamps: 2 draw calls, 14,000 points. Panels give off nothing an eye can see: they show the River, held dully, and the pool of a lamp. It needs the `sky`, for that reflection.
- `backRig(opts)` is the light for anything standing there: up to eight work lamps as points of light with a reach (the plain and `back.lit` both use them; `rig.lamp(i, {...})` moves one), and the River as one faint light.
- `sledGeo()`, `galleryGeo()` and `dockGeo()` (a generator) are a back crew's closed sled, a Window, and the still side's dock with its twelve berths. Stand them with `instances(geo.build(), back.lit, items)`.

**By canon** nobody is seen out there. The hall is flooded with X-rays and the back takes the glow of other rafts: people are inside trains, sleds, galleries and docks, and a world shows their lamps and windows. There are no stars in the hall (the layers hide the sky), and nothing behind the raft glows of its own heat.

## Tools

```
python tools/serve.py                                   # the dev server, port 5210 (one is usually running already)
node tools/shot.mjs --file squall_swell --t 0,8,16,24,32,40,48 --out out/<you>/s     # a picture at each time
node tools/shot.mjs --file squall_swell --cam "4000,60,1800,4600,0,1900" --out out/<you>/c   # look from anywhere (flat x,y,z to x,y,z)
node tools/shot.mjs --file squall_swell --live --every 2 --count 8 --q "t=40" --out out/<you>/x   # let it fly: tests the crossing into itself
python tools/sheet.py out/<you>/s- out/<you>/sheet.png --cols 2                     # many pictures on one sheet
python tools/build.py --file src/worlds/squall_swell.js   # module rules, syntax and writing rules for one file
python tools/build.py --check                           # the same for everything listed in worlds/index.js
node tools/flow.mjs                                     # the whole journey as a visitor skipping ahead: every crossing, build times, memory
node tools/hitch.mjs --q "w=the-glide&t=40" --secs 45   # let it fly and list every slow frame, with what was being built at the time
node tools/planhash.mjs --save out/plans/a              # after a change to kit/plan.js: save every painted plan, then again as b,
python tools/plandiff.py out/plans/a out/plans/b        #   and compare (unchanged code differs by a few pixels at most)
```

`shot.mjs` prints frames a second, draw calls, triangles and the milliseconds of work your build took, then any console errors (shader errors are printed in full). Look at your pictures: read the PNGs.

**Budget** at the default quality (density 1), measured by shot.mjs at 1280 x 720 on this machine: at least 100 frames a second through the whole flight, under 1.2 million triangles and 600 draw calls in any picture, and under 1.5 seconds of build work. Two worlds are drawn at once at every crossing, so a world at the limit makes its neighbours stutter: aim for under 700,000 triangles and 350 draw calls for a world alone. (The counts `shot.mjs` prints include the next world once it shows through the opening, in the last seconds of a flight.)

## Writing

Card text is plain and concrete, in the voice of someone writing home: what was seen, one number or one small human thing. No em or en dashes, no exclamation marks, no "testament", "tapestry", "bustling", "nestled", "vibrant", "realm", "beacon" and their kind. British spelling as in the docs. Names of people, places and customs come from the docs, exactly. Anything you invent (a layout, a custom, a name) is listed in a comment at the top of your world file under "Not canon", and kept small.
