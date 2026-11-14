# Brief for a room

Read `ARCHITECTURE.md` (the contract) and `content/brief.md` (the setting, the hard limits, how to work) first. This file adds what the second round of worlds needs: thirteen places indoors.

## What was asked

The first twenty-seven worlds are mostly Hollows. The user then asked for "more scenes from the interiors of the other drums. The working, living, and playing spaces along with new cards for them. Have fun with it! They should be just as varied and fun as the Hollows since this is where most people will spend most of their time."

So: a room must be as much of a picture as a Hollow is. A Hollow gets its awe free, from three kilometres of land overhead. A room has to earn it: with a great object, a crowd doing one thing, a light nobody has seen, or a piece of the drum's physics made visible. Tidy streets and a pleasant court are not enough, and the piece already has those.

## What every room needs

1. **A subject.** People doing one particular thing, which the card's line is about. Stage it where the camera passes and give it room. The commonest fault of the first round was a place with nobody doing anything in it.
2. **A reveal.** Rooms are small, then suddenly not: come along something no higher than a room and out into the big thing. Or start small and close and pull back.
3. **Something that could only happen in a spinning drum, done honestly.** A thrown ball that dives spinward, a swing that hangs for twelve seconds, water that takes its time. Work the sums out, put them in a comment, and draw what they say. `worlds/borage_fountains.js`, `worlds/squall_swell.js` and `worlds/kittiwake_crosswise.js` are the worked examples.
4. **Things that move.** People walking, the thing being made or played, lamps, water, cloth. At least three kinds of motion in view for most of the flight.
5. **Words.** The deck kit letters real signs, slates, boards and tags (`deck.sign`). Rooms are full of writing, and it is the cheapest way to make a place particular and funny. Every word is read by the viewer, so the writing rules in ARCHITECTURE.md apply to it.
6. **Its own light.** No daylight reaches a deck. Mood comes from how bright the lamps are, what colour, where the pools fall, and what glows. Each new room has been given a palette that none of the others uses: keep to it.
7. **Wear.** Mass is dear, so nothing is new: chairs do not match, paint is patched, the best thing in a room is the oldest.

## The rooms already in the piece (do not make another of these)

- `sorrel_ashgrove`: a warm arcade no higher than a room that comes out into a six-storey planted court; pear trees on the bright wall.
- `sorrel_sleepers`: ten thousand cabs asleep in a dark depot, waking from the far end.
- `sorrel_organ`: a court five decks high with an organ's pipes in it, at an evening recital with the lamps down.
- `rue_count`: a station ring in the morning rush under the Count boards; a train leaves through its lock.
- `tansy_hens`: red-lit strawberry racks, a steel vat hall most of a kilometre long, a queue for forty hens behind glass.
- `chervil_hall`: four hundred people eating at one long table.
- `chervil_home`: a block meeting a wanderer on the platform with hand lamps; an apple cut crosswise, seen very close.

The thirteen new ones, so that no two of you build the same picture: Lovage's stair of ever grander lobbies (gold, vertical); Yarrow's court whose walls are hung with first tries (workshop white); Borage's fair with a swing ride that leans (dark, bulbs); Sloe's indoor wood and silent hall (grey-green, chalk); Kittiwake's swing school over a net (feather grey); Gloaming's model drum, with tonight's dusk run through it (black, then green); Squall's street under the lake's glass floor (rippling daylight); Carillon's bell tower through eight decks at a naming (bronze); Dulse's kelp in glass in the Keel (green-gold); Madder's dye court and a flat with a cradle (reds); Ochre's spinball derby in a long low hall (floodlit, red against yellow); Ochre's baths under a tiled River (brown-violet, steam); Spelt's bakehouse at half past four (dark, then crust gold).

## Kit notes for rooms

Read the comments in `src/kit/deck.js` for whatever you use: each builder is documented where it is defined. Worth reading before you start:

- `worlds/sorrel_ashgrove.js` (29 kB): the deck kit used plainly. Start here.
- `worlds/sorrel_organ.js`: a court with one great object in it, a shader of its own, lamps turned down.
- `worlds/tansy_hens.js`: halls several decks tall drawn by hand with `deck.pen` / `deck.bucket`, doors that open, robots that travel.
- `worlds/rue_count.js`: a crowd, boards with changing numbers, a train that moves.
- `worlds/chervil_home.js`: a flight that goes from the scale of a hall to the scale of a hand.
- `worlds/chervil_hall.js`: `hall()` with one long table.

Things the first round worked out:

- **You are not held to the kit's court.** `atrium()` makes Ashgrove's kind of court: stepped planted terraces with flats' windows. If your place is a tower, a nave, a vault or a well twelve decks deep, draw it yourself: `deck.pen(run)` and `deck.bucket(x, z)` give you Geo builders that land in the deck's own meshes, lit by its lamps. `sides.<name>.wall` on `atrium()` gives sheer walls.
- **Other decks are other heights.** In a deck's frame the deck above is y = 4 and the floor of a court two decks down is y = -8. Say in your header which deck y = 0 is: `deckRadius(n)` sets the weight (deck 16 is 0.98 g, 236 is 0.69 g, 375 is half a g), and the weight sets how things fall and swing.
- **Rigid things that move** (a bell, a wheel, a door, a ride). Model the part flat, where it stands, and make its mesh with the deck's bent material: `const m = g.mesh(deck.lit, deck.frame)`. Then move the mesh as a whole. Round the drum by x metres: `m.rotation.z = x / deck.frame.floorR`. Along the axis: `m.position.z = dz`. Anything else (turning about a pivot): `m.matrixAutoUpdate = false; m.matrix.copy(B).multiply(R).multiply(Binv)` each frame, where `B = deck.frame.stand(x, z, { h })` is the pivot's own basis on the drum and `R` the turn in flat co-ordinates (`rue_count.js` does this for its train near line 770). Lamps go on lighting the part as if it stood still, which is what you want. For hundreds of moving copies write the motion into a vertex shader instead (`yarrow_kites.js`, `borage_fountains.js`).
- **A shader of your own** must bend (`BEND_PARS`, `kBend(p, n)` before `modelMatrix`), must be cut at the crossing (`CLIP_PARS`, `CLIP_FRAG`, a `vW` varying, `uClip: G.uClip`), and should be lit by the deck's rig (`...deck.rig.uniforms`, `deck.rig.glsl` gives `kLight(P, N, F, FN)` where F and FN are the flat position and normal). `kit/mats.js` has the lit material's own shaders to copy from. Water: `hall()`'s pool in `kit/deck.js` and `worlds/sorrel_lake.js` have water shaders.
- **People** are small low-poly figures (`deck.people`, `deck.knot`, `deck.walkersAlong`, `figureGeo(skin, pose)` with poses 'stand', 'sit', 'child', 'fly'). They cannot move their arms. They read well from three metres and more and badly closer. So show what hands do through the thing they hold: the slate held up, the chair turned over, the rope going up and down. A figure may be scaled (a big baker, a child).
- **Trees indoors**: `treeGeo(kind)` from `kit/flora.js` gives a tree's geometry; draw copies with `instances(geometry, deck.lit, items, { frame: deck.frame })`.

## What makes the flight on screen stutter (all of these happened)

Your world is built while another one is flying, a few milliseconds a frame. Any single step of your `build` that takes longer than about 40 ms is a visible hitch in someone else's world.

- `yield` after every piece of work and inside every long loop by the clock (`if (performance.now() - t0 > 4) { yield 'chairs'; t0 = performance.now(); }`). A label that begins with `~` tells the engine to stop building for this frame: use it after anything heavy (`yield '~atlas'`).
- A canvas you draw yourself and use as a texture: keep it small (1024 or 2048 on a side), make the texture **not** sRGB (`tex.colorSpace = NoColorSpace`) and turn its colours into light in your shader (`LAND_GLSL` and `kLand()` in `kit/plan.js`). Sending a canvas into an sRGB texture took 170 ms here; into a plain one, 5 ms.
- Never call `getImageData` on a canvas you will draw on again, never use the canvas `filter` property, and never call `document.fonts.check()`. Lettering should go through `deck.sign`, which has dealt with all three.
- Build geometry in a few big meshes, not hundreds of small ones: every material you make is a shader to compile. Use instancing (`instances()`, `deck.put`, `deck.proto`) for anything there are many of.
- Budget for a room alone, at density 1: under 700,000 triangles and 350 draw calls in any picture, and under 1.5 s of build work in all. Multiply counts of scattered things by `ctx.density`.

## Canon, for rooms

The hard limits in `content/brief.md` hold. For rooms in particular:

- No daylight, no sky, no windows in homes (only flats on a court's terraces and on the Hollow's end walls have them). A place's light is its lamps.
- Nothing burns: no flames, candles or smoke anywhere. Ovens, kilns and kettles are electric or on the 65 °C waste-heat loop. An element may glow; steam is fine.
- No animals. No soil (plants stand in tubs and troughs).
- Air is heliox: sound carries, voices are high. A dropped thing lands a little antispinward; a thing thrown up lands spinward; moving spinward you weigh more and moving antispinward less (by 2u/V of your weight at speed u, where V is the deck's own speed, 0.0572 rad/s times its radius).
- Money is kWh, said "kays". New mass costs about 25 kays a kilogram: a chair 125, a shirt 5, shoes 20, a loaf about 1.
- People named in the docs keep their ages and characters. Do not invent named people where a role will do ("a ringer", "the teacher").
- The docs are almost silent on what any drum but Sorrel looks like indoors. You will invent most of your place: do it in the spirit of the drum, keep it physically honest, and list every invention under "Not canon" at the top of your file.

## The card

Your prompt gives a title and a line for the card, in the voice of Marit Vell writing home (see the cards in `docs/wander-year.md`). Build the world so that the line is true of it: if the line says twelve bells, there are twelve. You may improve the line if the world you build suggests a better one, within the rules: plain and concrete, one number or one small human thing, about forty words at most, no dashes of any kind (use commas or full stops), no exclamation marks, British spelling, and none of the words listed under "Writing" in ARCHITECTURE.md.

## How to work

- You write **one file**, `src/worlds/<your_file>.js`. Do not edit, move or delete anything else under `src/`, `tools/` or `content/`. Several builders are at work at once on the same tree. If the kit lacks something, build it in your own file and say so in your report.
- Write the file in pieces: no more than about 250 lines in one tool call (a longer reply is cut off and nothing is saved). Create it with the first part, then add to it with further edits.
- Windows: write LF line endings. Do not paste long scripts into the shell: write a script file under `out/<your_file>/` and run it.
- A dev server is running on port 5210. Test with `node tools/shot.mjs --file <your_file> --t 0,6,12,... --out out/<your_file>/s` and **read the PNGs**. Take a picture every four seconds of the flight and look at every one. Use `--cam` to look at a thing from anywhere. If a page load fails with an error in a file that is not yours, someone is mid-edit: wait a little and run it again.
- Stills cannot show how fast the view turns. `node tools/gaze.mjs --file <your_file>` samples the flight and prints it. The worlds of the first round average 3 to 16 degrees a second and most never pass 60. Rooms tempt a camera to look about, so check: keep the mean under about 15 and every swing's peak under about 60, by giving a turn more seconds or by choosing the picture so that it needs less of a turn. Turn, stop, turn, stop is worse than a steady turn at the same average. Two causes found more than once: a key with no `look` of its own looks sixty metres ahead, so in a room (where the other look points are a few metres off) give the first and last keys their own; and a look point that passes close to the camera on its way between two keys' targets swings the view right round, so keep every look point six to ten metres from its key.
- Up to eight builders share this machine, so the frames a second that `shot.mjs` prints will read low while others are testing. Report triangles and draw calls for each picture, and frames a second with a note of when you measured.
- Done means: `python tools/build.py --file src/worlds/<your_file>.js` is clean; a contact sheet of the whole flight is at `out/<your_file>/sheet.png` (`python tools/sheet.py`); a live run through its own opening (`--live`) shows no errors; no step of the build is reported over 40 ms; and a short report is at `out/<your_file>/report.txt` (not `.md`): what the flight shows second by second, the card as built, what is not canon, the numbers, and anything you could not get right.
- Your final message should be short: where the files are, the numbers, and what you are least happy with.
