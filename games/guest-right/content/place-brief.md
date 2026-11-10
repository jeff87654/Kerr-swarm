# Brief for place builders

You are building one or more places of **Guest-Right**, a first-person game inside the nation drum Chervil. Other builders are doing the neighbouring places at the same time, in the same folder. The game is at `games/guest-right/` in this repository (the Kerr swarm world bible).

## Read first

1. `content/brief.md`: the world, Chervil, the three days, the voice rules and the never-break rules.
2. `ARCHITECTURE.md`: "Rules for every source file", and everything under **Engine**: coordinates, the shape of a place module, the kit, materials, lights, props, signs, doors, people, budgets and craft, and the plan of the world with your footprint in it.
3. `src/places/test.js`: a working place that uses most of the kit. Look at it running: `node tools/shot.mjs --q "only=test&at=test" --shot out/<you>/test.png`, then open the picture.
4. Skim `src/world/kit.js`, `src/world/kit2.js`, `src/world/props.js` (the exemplar props set the standard for yours) and `src/world/meshbuilder.js` (the shapes `g` can draw).
5. The content written for your place: `src/content/places.js`, `signs.js`, `menus.js`, `cast.js`, `discoveries.js`, `items.js` (look up your place id and its keeper). Use these names, signs and prices. For what the place should feel like, read the parts of the canon docs (`docs/` at the repo root) that touch it; your assignment names them.

## The bar

This should look like a place from a finished, well-loved game with a stylised look and rich light: the kind of room a player stops in and turns round slowly. Not a box with furniture in it. Before you write code, decide what the place is about (one sentence), where the eye goes when you walk in, what the three or four big shapes are, what colours it is (a palette of five or six, one of them a strong accent), and where the light comes from.

Then build it in layers: the shell and its big shapes; the built-in things (counters, shelving, benches, niches, stairs, beams, ducts); the loose furniture; the small things on every surface (and there should be a lot of them, in sensible groups); the lighting (pools and darkness); the signs and text; the places for people (`spot`s: more than you think), their walkways (`path`s), what the player can use (`interact`s) and the zone (`zoneBox`).

What it must have:

- **A front that reads from the street** and makes you want to go in (use `shopfront` where it is a shop), with its sign from `content/signs.js`.
- **Layered detail** as in the architecture's "Budgets and craft": nothing bare, nothing brand new, things mended and mismatched, colour used boldly, plants under lamps, every dish under a lid, ceilings with their beams and pipes and felt.
- **Light with shape**: a few warm pools, a bright thing at the end of the main view, darker corners. Every lamp `clip`ped to its room. Check it at night too (`t=22` and `t=2`: after 23:00 the lamps go down to a fifth).
- **Life**: seats and standing places and work places for people as `spot`s, with tags saying what they are doing; a `path` from the street through the door to the places people would go; and a keeper's post for the place's keeper (`who: '<cast id>'`).
- **Things to do**: at least three `interact`s that are true to the place: sit down, read a board (show its text with `game.ui.say` or `game.ui.card`), buy something from the place's menu (`game.ui.menu` with the items from `MENUS[id]`, then `game.wallet.spend`), pick something up, open something, ask something. Keep their code short and safe when `game.ui` or `game.audio` is missing.
- **Three or four discoveries** worth finding, from `content/discoveries.js` where they are listed for your place: add a `trigger` or an `interact` that calls `game.journal && game.journal.find('<id>')`.
- **Sound hooks**: `ambience` and `reverb` on the zone (see the lists under Audio in the architecture), and `game.loopAt(...)` for anything that would make a noise (a kitchen, a fountain, a kettle), stored so it is only started once.

## How to work

- Work only in your own files (your assignment lists them) and your screenshots in `out/<your id>/`. Do not edit the engine, the kit, the shared props, `places.json`, or anyone else's place. If you need something from the engine that is not there, do without it and say so in your report. You may define your own props with `defineProp('<yourplace>.<name>', ...)` in your own files.
- Stay inside your footprint. Your neighbours build their own walls on their side of the line; you build yours.
- Take pictures constantly, and **look at them** (the Read tool shows images). A good loop is: build a layer, take four or five views (from the street, from the door, from the far corner, two close-ups, one at night), open them, write down what is wrong (flat light, empty surfaces, things floating or sunk, wrong scale, harsh colour, z-fighting, dark where it should be bright), fix, repeat. Expect to go round at least six times. Use `only=<your ids>` (and add a neighbour or `test` if you want context) so loading stays quick: `node tools/shot.mjs --q "only=bakery&at=bakery&t=13" --wait 2 --shot "out/bakery/a.png" --shot "out/bakery/b.png|0.6|game.player.place(game.player.frame, 35, 0, -9, 3.1, -0.1)"`.
- Watch the numbers `shot.mjs` prints (triangles, lights, frames per second) and its console errors. Fix every error.
- Walk it: check with a few `game.player.place(...)` positions that a 0.6 m wide, 1.74 m tall player can get in, get round, and reach everything usable; that nothing blocks the door; that the floor is solid everywhere (a floor needs `floor(...)` or a `solid`).
- `node --check` each file. Run `python tools/build.py --check` if it exists (it flags the voice rules in your strings); otherwise check your own strings against the brief's voice rules: British spelling, no dashes, no exclamation marks, none of the banned phrases.
- The dev server is shared and already running on port 5190: never start, stop or restart it. Close any browser you launch. No git commands.

## Report back

Keep it short: what you built (files, triangles and lights with everything in view, frames per second), the spawn names, the spots and interactions you added (ids and types), anything you invented that is not in the content files or the docs (for the "not canon" list), anything you needed from the engine and did not have, and what you would do next with more time. Attach nothing; the lead will look at the place itself.
