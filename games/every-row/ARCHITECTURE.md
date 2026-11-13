# A Card from Every Row: how it is built

An endless flight through the drums of Merrow. One world is on screen. The next is built a few milliseconds at a time while you fly, then drawn through an opening at the end of this one, so a crossing has no cut. Everything is generated in the browser: no pictures, models or recordings are loaded.

This file is the contract between the parts. A world file that follows it can be dropped in beside the others.

## Layout

```
index.html            the page, for development (python tools/serve.py, then http://localhost:5210/)
dev.html              one world alone: dev.html?file=<name of a file in src/worlds, without .js>
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
src/kit/folk.js       people and crowds
src/worlds/*.js       one file per world; index.js lists them in the journey's order
src/ui/               the interface and its stylesheet
tools/serve.py        dev server            tools/shot.mjs   pictures and smoke tests in headless Chrome
tools/sheet.py        contact sheets        tools/build.py   the release bundler (one HTML file)
content/brief.md      what a world should be, and what the docs allow
```

## Rules for every source file

The release bundler (`tools/build.py`) reads a strict subset of module syntax. Break a rule and the page works in development and fails when built.

- Imports are static, named and relative, and end in `.js`: `import { a, b } from '../kit/geo.js';`. From three: `import { Vector3, Mesh } from 'three';`.
- Exports are `export function`, `export function*`, `export class` or `export const`, starting at column 0. No default exports, no `export { a, b }`, no re-exports.
- No top-level `await`, no dynamic `import()`, no side-effect imports.
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
| `look` | `{ exposure, bloom, threshold, spread, vignette, grain, saturation, contrast, lift:[r,g,b], gain:[r,g,b] }`, any subset. Defaults: 1, 0.5 (use 0.1 to 0.35), 1, 1, 0.45, 0.03, 1.05, 1.03 |
| `update(t, dt, camera, engine)` | called each frame with the seconds into the flight. Also called while this world is only seen through the last world's opening, with t = 0. Keep it cheap |
| `portal` | options for the opening at the end: `{ shape: 'rect', width, height }` for a doorway instead of a disc; `rim: false` to leave off the glowing ring; `rimPower`; `mist` (colour) |
| `dispose()` | free anything the engine cannot find by walking the scene (it disposes geometries, materials and their textures itself) |

Yield after every big step and inside long loops (every few hundred turns). Kit builders that are generators are called with `yield*`.

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

`litMaterial(rig, opts)` draws Geo geometry: `bend` (a frame), `side: 'double'`, `emit` (multiplies every vertex's glow), `soft` (how far tinted faces are lit as if they faced up, default 0.7: leaves and clothes), `walk`, `drift`, `transparent`, `opacity`, `additive`.

A rig says how surfaces are lit:

- `hollowRig({ sun, sunPower, sunFar, sunFarPower, sunAngle, sunSharp, amb, ambPower, bounce, bouncePower, ground, groundPower, air, airDensity })`: the sunline (lit from 450 m short of each wall), the Hollow's own glow (`amb`), light thrown up off the land (`bounce`), warm light near the floor at night (`ground`), and the faint haze of distance (`air`). `sun` is the line seen from the side at angle `sunAngle`, `sunFar` from the opposite side: a painted dawn can gild one bank and leave the other dark. `rig.set({...})` changes them while flying. `buildHollow` makes this rig for you (`hollow.rig`).
- `lampRig({ ambUp, ambDown, lattices, zones, haze, hazeDensity })`: indoors. A lattice is a regular grid of lamps `{ origin:[x,y,z], spacing:[sx,sz], count:[nx,nz], color, power, reach }` (flat coordinates); a zone is a box lit from above `{ min, max, color, power, soft }`, for a bright court. Up to four of each.
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

The plan has three layers painted together. `fill` and `stroke` take: `color` (what the land looks like from far off), `water`, `wood` (tree cover: the ground draws a crown in every 7.5 m cell, standing up off the land), `lamp` (glows when `ground.lamp` > 0), `paved`, `rows` (an orchard: a tree on every point of a lattice, in blossom, leaf or fruit by section), `life` (people), `clear: [...]` and `feather`. Helpers: `rect`, `band`, `ellipse`, `blob`, `poly`, `curve`, `dots`, `lamps`, `avenue`, `clumps`, `garden`, `mottle`. Shapes may cross the seam at x = 0 / C. Paint richly: land seen from a kilometre off is only as interesting as its plan. `worlds/sorrel_lake.js` and `worlds/chervil_flight.js` are worked examples by day and by night.

`buildHollow` spec, in brief (the comment above it in `kit/hollow.js` is complete):

- `light`: the hollowRig options. `sunline: { power }`: how bright the rod itself is (60 at noon, 0 for a dark cable).
- `ground`: `canopy`, `blossom`, `fruit`, `rows:[sx,sz]`, `lamp` (0..1), `lampColor`, `people`, `wave`, `swell`, `sunRod` (the line's brightness in water: match `sunline.power`), `stripes`.
- `front`, `back` (the end walls): `lit` (share of windows lit), `crowd`, `garden`, `stone`, `stone2`, `houses` (six colours), `houseMix`, `winA`, `winB`, `winPower`, `tiers: { 9: { crowd, garden, lit } }`, `depths`.

The Hollow it returns: `group`, `frame`, `rig`, `plan`, `lit` / `litDouble` / `walk` (materials bent to the floor), `plain` (unbent), `at(x, z)` (read the plan), `glow(points)`, `add(mesh)`, `setNight(lamp, lit)`, `setRod(power)`, `lampPosts({ near, power })`, and `terrace(side, tier, deg)`.

**End walls.** Thirty tiers of 47.5 m each climb from the floor to the flying hall 75 m from the axis. Each riser is an arcade, nine floors of flats with balconies, and a garden hanging over its top; each terrace is a rail, a walk and beds. `TIERS` names the docs' four: `third` (tier 9, a third of a g), `quarter` (14), `tenth` (24), `twentieth` (27). `hollow.terrace(side, tier, deg)` gives a frame and materials for building on one: x in true metres round it, y above its floor, z = 0 at the rail, the houses at `z = toWall * depth`.

**Things the Hollow does not have, by canon:** weather, clouds, sky, stars, wind (kites are flown by walking), animals, soil, fire. Light comes only from the sunline and from lamps, so there are no long shadows: use the light's colour, the dark Dim Ends, lamps and windows for mood.

### Trees and people

`treeGeo(kind)`: 'round', 'apple', 'pear', 'yew', 'pine', 'birch', 'poplar', 'bush'. `scatterTrees(hollow, { near, radius, wood: [{ kind, weight, tint }], orchard: { kind } })` stands real trees within about 170 m of the flight, exactly where the ground draws crowns. `figureGeo(skin, pose)`: 'stand', 'sit', 'child', 'fly'. `crowd(spots, material, { frame })` makes people from `{ p, walk, sit, child, yaw, color }`; `scatterPeople(hollow, { near, radius, density })` puts them where the plan has life. People are small: they are how a picture gets its scale.

## Tools

```
python tools/serve.py                                   # the dev server, port 5210 (one is usually running already)
node tools/shot.mjs --file squall_swell --t 0,8,16,24,32,40,48 --out out/<you>/s     # a picture at each time
node tools/shot.mjs --file squall_swell --cam "4000,60,1800,4600,0,1900" --out out/<you>/c   # look from anywhere (flat x,y,z to x,y,z)
node tools/shot.mjs --file squall_swell --live --every 2 --count 8 --q "t=40" --out out/<you>/x   # let it fly: tests the crossing into itself
python tools/sheet.py out/<you>/s- out/<you>/sheet.png --cols 2                     # many pictures on one sheet
python tools/build.py --file src/worlds/squall_swell.js   # module rules, syntax and writing rules for one file
python tools/build.py --check                           # the same for everything listed in worlds/index.js
```

`shot.mjs` prints frames a second, draw calls, triangles and the milliseconds of work your build took, then any console errors (shader errors are printed in full). Look at your pictures: read the PNGs.

**Budget** at the default quality (density 1), measured by shot.mjs at 1280 x 720 on this machine: at least 100 frames a second through the whole flight, under 1.2 million triangles and 600 draw calls in any picture, and under 1.5 seconds of build work. Two worlds are drawn at once at every crossing, so a world at the limit makes its neighbours stutter.

## Writing

Card text is plain and concrete, in the voice of someone writing home: what was seen, one number or one small human thing. No em or en dashes, no exclamation marks, no "testament", "tapestry", "bustling", "nestled", "vibrant", "realm", "beacon" and their kind. British spelling as in the docs. Names of people, places and customs come from the docs, exactly. Anything you invent (a layout, a custom, a name) is listed in a comment at the top of your world file under "Not canon", and kept small.
