# Builders' brief: Round the Clock

Round the Clock is a browser game set in **Sorrel**, one nation drum of the Kerr swarm world bible (`docs/` at the repo root is canon). Its job is to show off how much variety one drum holds. Sorrel is cut like a clock into twelve **Hours**, each a county of ~17 million people with its own colours, trade, word and dish. The player joins one Hour's running club and "goes round the clock": they visit every Hour and play that Hour's own small game, which earns a thread in that Hour's colours (one to three knots). Then they run the Round, the Hours' great race.

There are twelve games, one per Hour, plus the Round. **Each game is one file in `src/`** that registers itself with the shell. This brief is the contract for writing one.

Read, in this order: this brief; `src/61-lark.js` (the reference game: copy its shape); `src/15-draw.js` and `src/05-drum.js` (the kit you draw and compute with); then skim `src/10-stage.js` (input) and `src/30-shell.js` (how a game is run). For the setting's texture, `atlas/sorrel/content/brief.md` at the repo root is the best single page, and `atlas/sorrel/content/hours.json` has every Hour's character.

## The drum in one page

- **Sorrel** is a spinning cylinder: radius 3,000 m at the rim, 3,750 m long, one turn every **110 s** (ω = 0.0571 rad/s). 200 million people. **Out is down; the middle is up.**
- **Deck n** is at radius r = 3,000 − 4(n − 1) m and weighs **r ÷ 3,000** of rim weight. Deck 1 (the rim) is 1 g; deck 77 is 0.90 g; deck 201 is 0.73 g; deck 376 is the floor of **the Hollow** at 1,500 m, 0.50 g. Decks are 4 m apart with ~3 m ceilings.
- **Bands:** the Keel (decks 1–15: the food plant, water, freight, the station rings; nobody lives there), the Low decks (16–113: families, schools), the Middle decks (114–301: most homes and work), the High decks (302–375: elders, who "go up" at about a hundred), the Hollow (the open middle, 3 km across: a park with a lake, orchards, lawns and sports grounds, under a **sunline** along the axis; the far side of it hangs 3 km overhead, upside down and perfectly sharp).
- **The end walls** of the Hollow climb in terraces toward the axis, lighter with every tier: the Third (a third of a g), the Quarter, the Tenth, the Twentieth. **The Spindle** is the axis itself: within 75 m of it you weigh under 3% of a g and fly in wing-sleeves.
- **Coriolis is everything.** The floor is turning, so in the floor's own frame (x spinward, y up):
  - going **spinward** makes you heavier, **antispinward ("anti")** lighter: weight × (1 + u ÷ v)² where v is the deck's own speed (172 m/s at the rim, 126 on deck 201, 86 on the Hollow floor);
  - a **dropped** thing lands a little anti: (2h)^1.5 ÷ (3√r) metres (a cup from 1 m: ~2 cm; children say "anti");
  - a **leap or a toss** straight up comes down a little spinward: (4/3) ω v³ ÷ g² (a hand's width at a third of a g);
  - a throw along the axis flies true. Every child learns: **"axis flies true, spin sinks, anti floats."**
  - `spinStep(p, dt, g)` in `05-drum.js` integrates exactly this. Use it. Use real numbers.
- **Air is heliox:** sound runs 1.8× faster (voices bright, rooms ring, so good rooms hang felt), it chills skin (rooms run warm, baths are the cheap luxury) and it cools food fast, so **everything is served under lids**. Sorrel's motto is "Lids on."
- **Thrift:** new mass costs ~25 kWh a kilogram, so things are mended, remade and inherited. "The best chair in a room is the oldest." Money is kWh, said "kays". Food comes from the Mill (starch, sugar, fat), the Vats (protein, dairy, mycelium steak) and the Garden (rare, dear produce: a tomato is jewellery).
- **Getting about:** six-seat cabs with cabins on gimbals that lean against Coriolis ("the cab is a room"), in lift cores and on fifteen line decks. Between drums: the Glide, from nine station rings in the Keel.
- **Light:** lamps. Homes at ~200 lux; the sunline ramps 06:00–09:00 (lamp-dawn), full 09:00–15:00, dusk to 18:00, then lamp-night.

### Never break these

No sun, sky, weather or seasons inside the drum. No stars visible from inside. **No animals at all** (no birds, bees, fish, insects, pets: the Hours are named for animals nobody has seen). No open fire, candles or smoke (electric hotplates, hand lamps). No currency but kWh. No villains: problems are small and human. Robots are appliances, never characters. Don't name real Earth religions, brands or places. People look like all of humanity mixed; names are from every language, worn smooth.

## The twelve Hours

Hours are 30° wedges counted spinward, numbered like a clock. Each faces its opposite across the Hollow (so Hare sees Stag overhead). Rivalries run across the Hollow.

| No. | Hour | Colours | Keeps | Club | Overhead | Its game |
|---|---|---|---|---|---|---|
| 1 | Hare | tawny and cream | midwives, stair races | Hare Harriers, the Boxers | Stag | The Long Stair |
| 2 | Heron | grey-blue and white | the water | Heron Waders, the Stilts | Swift | The Tide |
| 3 | Owl | violet and buff | the lamp-night | Owl Athletic, the Yawners | Badger | The Lid Wall |
| 4 | Bee | gold and black | orchards and rotas | Bee Rota, the Brushes | Moth | Brush Rows |
| 5 | Fox | russet and white | trade | Fox Rovers, the Reds | Wolf | A Both |
| 6 | Otter | teal and white | the baths and the lake | Otter Lake Club, the Wets | Lark | The Jetty |
| 7 | Stag | moss and bronze | freight and furniture | Stag Heavies, the Antlers | Hare | Going Up |
| 8 | Swift | indigo and silver | the cabs | Swift Lattice, the Leaners | Heron | The Lean |
| 9 | Badger | charcoal and chalk | the recyclers | Badger United, the Stripes | Owl | The Take-Apart |
| 10 | Moth | mauve and grey | lamps and wing-sleeves | Moth Lamplight, the Dusties | Bee | Crosswise |
| 11 | Wolf | crimson and slate | the crews | Wolf Crews, the Pack | Fox | Spinball |
| 12 | Lark | green and brown | breakfast and flutes | Lark Harmonic, the Earlies | Otter | Lamp-dawn Crepes |

The Hollow's floor, by Hour: the lake (Fox, Otter, Stag), the orchards (Heron, Owl, Bee), the lawns (Swift, Badger, Moth), the grounds (Wolf, Lark, Hare).

## Voice (for every word a player reads)

- Plain, concrete, specific, warm, quietly funny. Short sentences. One exact detail beats three adjectives. The humour comes from physics and thrift.
- British spelling (colour, metre, grey, neighbour).
- **No em dashes or en dashes** (number ranges like "0.95 to 0.10 g" are written out). **No exclamation marks.** No rhetorical questions. No "not just X but Y". None of: testament to, tapestry, bustling, nestled, vibrant, delve, realm, beacon, a dance of, a symphony of.
- People speak plainly, in translation: no modern Earth slang.
- `python tools/build.py --check` flags dashes, exclamation marks and banned phrases in your strings.

## The contract

One file, `src/NN-id.js`, wrapped in an IIFE so nothing leaks (every file shares one script scope; a top-level name used by two files breaks the whole page):

```js
"use strict";
(function () {
  function create(ctx) { return { /* all of the game's state */ score: 0, done: false }; }
  function update(s, dt, inp, ctx) { /* dt is always 1/120 s */ }
  function draw(s, g, ctx) { /* g is a 2D canvas context in stage units */ }
  function bot(s, b, ctx) { /* the house plays: set b.x, b.y, b.down, b.tap, b.left, b.right, b.up, b.dn, b.num */ }
  registerEvent({
    id: "lark", hour: 12, name: "Lamp-dawn Crepes",
    place: "where it is, with decks and weights",        // one line
    intro: "three sentences at most: what this is and what the drum does to it",
    how: "what to do, in one or two short sentences, for pointer or touch",
    keys: "arrows to walk, Space to toss",                // the keyboard way
    marks: [6, 9, 11],                                    // s.score needed for one, two, three knots
    unit: "points", fmt: (v) => String(v),                // how a score is written on the card
    result: (s, ctx) => "12 of 12 served, 11 golden",     // the headline when it ends (short: it is set very large)
    create, update, draw, bot,
  });
})();
```

- **The stage** is a square in stage units: 1000 × 1000, (0, 0) top left. Constants `SW`, `SH`. Draw everything; never touch the DOM, never use `setTimeout`, never read the clock. Time only moves in `update`.
- **`update(s, dt, inp, ctx)`** runs 120 times a second of game time. Set `s.done = true` when the game is over, after a short ending beat of your own (about a second) so the last moment can be seen. Keep `s.score` current; **higher is better**.
- **Randomness:** only `ctx.rng` (a seeded generator: `ctx.rng()`, `.range(a, b)`, `.int(a, b)`, `.pick(arr)`, `.sign()`, `.chance(p)`, `.shuffle(arr)`). Never `Math.random` (a run must replay the same from the same seed). Scatter that is only decoration can use `makeRng(fixedNumber)` inside `draw`.
- **`inp`** (see `10-stage.js`): `x, y` pointer in stage units; `down / pressed / released` (pointer **or** Space/Enter: use these for "tap"); `ptrDown / ptrPressed / ptrReleased` (pointer only); `left, right, up, dn` held and `leftPressed ...` edges (arrows or WASD); `ax, ay` (−1..1); `num` (1..12 from the number keys); `moved`.
- **`ctx`**: `rng`, `pal` (this Hour's palette), `hour` (this Hour's record: name, colours, word, dish ...), `sfx` (sounds), `hud` (`ctx.hud.set(leftText, rightText)`: two small readouts in the stage's top corners, `\n` allowed), `say(text, seconds)` (a caption along the bottom of the stage, for the three or four moments that need words), `demo` (true when the house is playing on the Hour's card), `skill` (0..1, for the bot), `time` (seconds played), `reduced` (the player prefers less motion: no screen shake).
- **Always use `ctx.sfx`, `ctx.hud` and `ctx.say`**, never `Snd` or `Hud` directly: in the demo they are silent stand-ins.
- **The bot is required.** It plays your game through the same input a player has. It is the demo on the Hour's card ("the house shows you how"), and it is how the game is tested. At `ctx.skill` 1 it should earn three knots; around 0.5 it should fumble like a newcomer and earn about one. Bots set levels, not edges: `b.down = true` each step it should be held, `b.tap = true` for one press, `b.x / b.y` for the pointer.
- You may read the globals `HOURS[n]` and `PALS[n]` (1..12) if your game shows other Hours.
- The kit's names are plain words (`seg`, `disc`, `ring`, `mix`, `lamp`, `sign`, `label`, `board`, `knot`, `thread`). A local variable with one of those names hides the kit function inside your file and breaks drawing at run time, so name your own things something else.

## The kit

**Colour** (`15-draw.js`): `INK` (felt-dark), `PAPER` (undyed cloth), `ctx.pal` = `{a, b, aD, aDD, aL, aLL, bD, bL, onA, onB, light, dark, ink, paper}` (a and b are the Hour's two colours; D darker, L lighter; `onA` is the readable ink on `a`). `mix(c1, c2, t)`, `shade(c, k)` (k < 0 darker, k > 0 lighter), `alpha(c, a)`, `lum(c)`, `onCol(c)`.

**Shapes:** `disc(g, x, y, r, col)`, `ring(g, x, y, r, w, col)`, `seg(g, x0, y0, x1, y1, w, col)` (round-capped line), `rrect(g, x, y, w, h, r)` (path), `fillRR(g, x, y, w, h, r, col)`, `poly(g, [x0, y0, x1, y1, ...], col)`, `wedgePath(g, cx, cy, r0, r1, a0, a1)`, `glow(g, x, y, r, col, a)`, `lamp(g, x, y, r, col, halo)`, `vignette(g, col, a)`.

**Type:** `sign(g, text, x, y, size, col, align, weight)` (the condensed sign face: names, numbers, anything painted on a board; give it capitals), `label(...)` (the reading face), `mono(...)` (figures), `arcText(...)`, `wrapText(g, text, x, y, maxW, lineH)`, `board(g, x, y, w, h, big, small)` (a dark painted board with white numerals), `spinMark(g, x, y, col, dir)` (the word SPINWARD and an arrow: **show which way is spinward in any game where it matters**).

**People:** `person(g, x, y, h, o)` draws a figure with its feet at (x, y), h units tall. `o.view` "front" or "side" (`o.face` 1 or −1); `o.pose` "stand", "walk", "run", "cheer", "sit", "reach", "carry", "wave", "hands"; `o.t` the pose's clock; `o.shirt, o.legs, o.skin, o.hair, o.sash` colours; `o.child`, `o.old`; `o.lean`; `o.handTo: [x, y]` / `o.handTo2` make a hand reach for a stage point; `o.arms / o.legsA` set limb angles yourself. It returns where the hands and head are. `someone(i, shirtColours)` gives a deterministic stranger; `crowd(g, x0, x1, y, n, h, {cols, t, cheer, seed})` a row of onlookers. `SKINS`, `HAIRS`. **Use `person` for every human** so the twelve games look like one set.

**Places:** `hollowBack(g, {pal, sun, far, farDots, near, near2, horizon, seed})` paints the Hollow seen from its floor looking along the axis (land curling up both sides, the far bank overhead).

**Motion:** `Parts` (particles: `ps.add({x, y, vx, vy, life, r, col, g, drag, a, grow})`, `ps.update(dt)`, `ps.draw(g)`), `Notes` (words that rise and fade: `notes.add("golden", x, y, {good: true})`), easing `easeOut, easeIn, easeInOut, easeBack, smooth(a, b, x)`, `lerp, clamp, approach(a, b, maxStep), angDiff`.

**Physics** (`05-drum.js`): `DRUM` (R, L, T, W, G0), `deckR(n)`, `gFrac(r)`, `gAt(r)` (m/s²), `gDeck(n)`, `deckSpeed(r)`, `bandOfDeck(n)`, `runWeight(u, r)`, `dropDrift(h, r)`, `leapDrift(v, g)`, `spinStep(p, dt, g)`, `axisStep(p, dt, fx, fy)`, `fmtG(f)`.

**Sound** (`ctx.sfx`, all optional and safe): `tap, tick, step, pop, good, great, bad, miss, whoosh(k), splash(k), thud(k), clack, sizzle(k), pour, bell(n), chime(i)` (i rising = a rising scale: good for streaks), `clap(n), cheer(k)`, and the raw `tone({f, f1, type, dur, vol, at})` and `noise({f, f1, q, dur, vol, type, at})`.

## The look

A two-ink print. Each game is drawn in **its Hour's two colours** (`pal.a`, `pal.b`, and their darker and lighter turns) plus `INK` and `PAPER`. A third colour is allowed where the thing itself needs it (a crepe is golden, water is blue, blossom is pink), kept small. Flat fills, round caps, soft glows for lamps; no outlines for their own sake, no gradients except light and sky. Big simple shapes that read at 360 px wide. The dozen games should hang together like twelve posters from one press, each in its own dye.

## What makes a good game here

- **35 to 60 seconds**, ends by itself, can't be lost early in a way that stops the fun. A first try should usually earn one knot; three knots should take a few tries.
- **One clear idea that the drum makes strange.** The player should come away having felt something true about living in a spinning drum, or about this Hour's people. Teach by play, with at most three or four short captions (`ctx.say`).
- **Pointer first, touch friendly:** everything playable with one finger. Targets at least 90 units across. Then a keyboard way.
- **Legible on a phone:** the stage is ~360 px wide there. Words a player must read: 34 units or taller. Decorative lettering: 22 or taller. Prefer pictures to words on the stage; the card beside the stage carries the explaining.
- **Feedback for every action:** a sound, a movement, a word that rises. A streak should feel like one. End with a beat: a pose, a cheer, a word.
- **Show the numbers** that make it real, lightly: the deck, the weight in g, metres, seconds (`ctx.hud.set`).
- **Deterministic and tidy:** all state in `s`; no globals; no timers; guard against `dt` spikes (there are none: dt is fixed).

## Working on one game

All commands from `games/round-the-clock/`. Build and test **into your own folders** so you never collide with anyone else working at the same time:

```
python tools/build.py --only lark --dist out/lark/dist          # just the core and your game
node tools/shot.js --dist out/lark/dist --q "ev=lark&bot=1&seed=3&speed=4&mute=1" --at "2,10,25,end" --out out/lark
node tools/shot.js --dist out/lark/dist --q "ev=lark&bot=1&skill=0.5&seed=7&speed=6&mute=1" --at "end" --out out/lark --name clumsy
node tools/shot.js --dist out/lark/dist --q "view=card&h=12&mute=1&fresh=1" --at "4" --out out/lark --name card --page          # the card, with the demo running
node tools/shot.js --dist out/lark/dist --q "view=card&h=12&mute=1&fresh=1" --at "4" --out out/lark --name phone --page --phone  # the same on a phone
python tools/build.py --check --only lark                                                                                       # writing rules and name clashes
```

`shot.js` prints one line of JSON: the result (`score`, `knots`, `text`), any page errors, and the pictures it took. **Look at the pictures** (read the PNG files): a game that scores correctly can still look wrong. `--at` takes seconds of game time; `speed=N` runs the game N times faster; `seed=N` fixes the run; `skill=0.5` makes the bot clumsy; `--js "..."` runs JavaScript in the page first.

To try it by hand, open `out/<id>/dist/index.html?ev=<id>` in a browser.

**Only write your own `src/NN-id.js`** (and pictures under `out/<id>/`). Don't edit the shared files, the content, or anyone else's game; if the kit is missing something, write it inside your file, and if you find a bug in the kit, say so in your report. Don't run git.
