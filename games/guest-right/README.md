# Guest-Right

A first-person game set in **Chervil**, the open hall drum across the rows from Sorrel on Herb Row (`docs/open-drums.md`). There is no violence in it. You are a wanderer of twenty from the maker drum Spelt, eleven legs into your wander year, with three nights in Chervil on guest-right: the Thursday you arrive, the Quiet, and Booking Day. You carry a spoon of this year's mother from Pell the baker for Marit Vell, who cooks the Ring 2 hall. Everything else is the drum itself: a station under a vault, lamplit streets that curve up ahead of you, one table a hundred and twenty metres long, shops, a school, baths, flats, the Hollow with its far bank hanging three kilometres overhead, and on the last night the Long Flight down the axis in the dark.

Play it on the world-bible site at **https://jeff87654.github.io/Kerr-swarm/guest-right/**. A desktop browser with a real graphics card is best; it needs WebGL 2.

## Playing

| | |
|---|---|
| Walk, run, jump | W A S D, Shift, Space (a gamepad's sticks and A also work) |
| Look | the mouse (click the picture to take the pointer; where a browser refuses, drag instead) |
| Use, talk | E |
| Throw the spinball, once you have borrowed one | F or the right mouse button |
| Journal, map, photo | J, M, P |
| Menu | Esc |
| In the Spindle | W and S row you along your line of sight, Space and C lift and sink, E goes back to the gate |

The clock runs: a day takes forty-eight minutes unless you change it in the settings. Sleep in your flat or sit a while on a bench to pass time. The title screen's Chapters start you at the moments of the three days.

Money is energy: your wallet is 21.6 kWh a day, and the prices are the docs'. The physics is the drum's: you weigh 0.98 of a g in Candlewick and half that in the Hollow; running spinward makes you heavier; a thrown ball sinks spinward, floats anti and flies true along the axis; in the Spindle there is almost no weight at all and every crossing bends.

## What is in it

- **Station Ring 2** (the Keel): the glide platform and its armoured cars, the Ledger hall with the Ledger and the old Count board, the guest desk, the ring counter, a Quaysides lane, the Gate behind glass.
- **Candlewick**, a block of about three thousand on decks 16 to 21: Wick Court (a six-deck atrium with planted terraces), Ladle Row and Thread Street, Marit Vell's Hall and its kitchen, a bakery, a greengrocer, a larder shop, a herb shop, a mender, a dyer and tailor, a chair remaker, a flute maker, Oona's lamp-painting studio, a book room, a toy library, a clinic, a block office, a choir room, a laundry, a fernery, the baths, the school and its spinball hall, two lift lobbies, and five flats (yours among them).
- **The Hollow**: the whole floor, 9.4 km round and 3.75 km long, can be walked: a lake, orchards, lawns, dim woods at the ends, a lift pavilion, a festival green and bandstand, a jetty and robe house, the orchard's working corner, a kite field. The far bank you see overhead is the same land, drawn from the same map.
- **The back wall**: the dawn terrace and the Dawn Stand, the Third (a third of a g, for reels), the flying hall's gate and the sleeve hire.
- **The Spindle**: the netted flying hall by day, and the whole axis on Booking night.
- People: about two thousand, with lives that follow the hour and the day (meals fill the hall, the Quiet empties the screens, Booking Day sends everyone to the dawn, the Ledger, the feast and the Spindle); fifty-seven of them named, with something to say that changes by the day.
- Things to do: sixteen threads in a journal, a hundred and two things to find, about a thousand things to read, sit on, knock at, buy, borrow or try, a wallet of 21.6 kWh a day, a card home to write on the fourth morning, and two endings. About eleven hundred lamps and a thousand painted or chalked signs.

## Canon status

The setting follows the docs: `docs/open-drums.md` (Chervil, its customs, and the Booking Day scene the third day stages), `docs/wander-year.md` (Marit, Pell, Spelt, the cards), `docs/eating-out.md`, `docs/cuisine.md`, `docs/daily-life.md`, `docs/raft-habitat.md`, `docs/drum-transport.md`, `docs/raft-transport.md`, `docs/ashgrove.md`, `docs/sorrel.md`, `docs/families.md`, `docs/people.md`, `docs/economy.md`. Marit Vell, Jory, Oona, Pell, the Ledger and its figures, the hall, the Dawn Stand, the ring counter, the Quiet, Booking Day, the vote and the Long Flight are theirs.

**Introduced here, and not canon** (ideas worth keeping should be written into `docs/` on purpose):

- The block **Candlewick** and everything in it: Wick Court and its lamp-painters' ceiling, Ladle Row, Thread Street, every shop and its name, the fernery, the block office, the choir room, the laundry, the plan of the hall (one room 124 m long) and of the flats.
- The staging of the three days round the player: arriving on the Thursday, the draw of a terrace flat, the errands, the block court's sitting on the evening of the Quiet, the hours given to each moment of Booking Day.
- Fifty-three of the fifty-seven named people (all but Marit, Jory, Oona and Pell), their work, and everything they say.
- The plan of Chervil's Hollow (where its lake, orchards, lawns and woods lie), the layout of Station Ring 2, the dawn terrace, the Third and the flying hall's gate as built.
- The colours and timing of Oona's dawn beyond what `open-drums.md` gives (the brown-violet of the River, rose, the far bank gold while the near side is dark).
- Small customs and details invented by the builders and writers: these are listed in `content/not-canon.md`.

## Layout

- `src/main.js` starts the game; `src/dev.js` is the development entry (it loads each place on its own, so one broken file does not stop the rest).
- `src/core/`: the drum's geometry and physics (`drum.js`), input, settings, saving, the clock.
- `src/render/`: the renderer. A deferred pipeline on three.js r170 (vendored in `vendor/`): G-buffer, hundreds of clustered lamps, overhead soft shadows, ambient occlusion, screen-space reflections, temporal anti-aliasing, bloom, automatic exposure, a filmic grade. `texgen.js` makes every surface texture on the GPU at start-up; `atlas.js` holds every painted or chalked word; `shell.js` draws the Hollow's far bank, end walls and sunline by ray.
- `src/world/`: the building kit (`kit.js`, `kit2.js`, `props.js`, `signs.js`, `doors.js`, `meshbuilder.js`), the world container (`world.js`) and the Hollow's map (`land.js`).
- `src/places/`: one module per place, listed in `src/places.json`.
- `src/sim/`: the player, collision, and the people.
- `src/game/`: using things, zones, the wallet, the journal and conversations, cabs, the flow of the game (title, chapters, saving, the ending), and the music director that chooses which tune is playing.
- `src/ui/`, `src/audio/`: the interface and the sound (all synthesised).
- `src/content/`: the words: cast, places, signs, menus, items, discoveries, overheard talk, tips, customs, the Ledger, conversations and threads.
- `content/brief.md`, `content/place-brief.md`: the briefs the game was built from. `ARCHITECTURE.md`: the contract between the parts, and the plan of the world.

No assets are loaded: geometry, textures, text, people, sound and music are all made in code. The only binary files are four open-licensed font families in `assets/fonts/`.

## Building

```
python tools/build.py                    # dist/guest-right.html (the artifact page) and dist/index.html (standalone)
python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
python tools/build.py --check            # the module rules and the writing rules
```

The build has no dependencies: it bundles the ES modules itself (see "Rules for every source file" in `ARCHITECTURE.md`), wraps three.js and inlines the fonts into one HTML file of a few megabytes. The world-bible site build (`site/build.py`) runs the standalone build into `_site/guest-right/` and links it from the home page and the sidebar.

## Developing and testing

```
python tools/serve.py                    # http://localhost:5190/ : the game straight from src/, never cached
npm install                              # once, for the screenshot tools (puppeteer-core; Chrome or Edge must be installed)
node tools/shot.mjs --q "at=court&t=13" --shot out/a.png
node tools/shot.mjs --q "only=test&at=test" --shot "out/b.png|1|game.player.yaw = 1.2"
```

`tools/shot.mjs` loads the game in headless Chrome on the real GPU, runs JavaScript, takes pictures and prints frames per second, draw calls, triangles, lights and console errors. `tools/play.mjs` plays the game through from the title with real key presses and a picture at every step: `node tools/play.mjs opening evening quiet booking ending credits screens shops fullflight phone` covers the three days, the Long Flight (landed early and flown the whole way), the last scene and the credits, every screen, saving and continuing, every shopkeeper at their counter, and a phone held both ways; `node tools/play.mjs tour` photographs every named place by day and by night, and `python tools/sheet.py out/play/tour out/sheets` lays the pictures out as contact sheets (it needs Pillow). Add `--page dist/index.html` to play the built file instead of the source. Useful URL parameters: `only=id,id` (build only those places), `at=<spawn>`, `pos=x,y,z`, `t=<hour>`, `day=1|2|3`, `freeze`, `q=low|medium|high|ultra`, `debug=1..6` (G-buffer views). `tools/ui-dev.html` and `tools/audio-dev.html` exercise the interface and the sound on their own; `tools/check-content.mjs` and `tools/check-story.mjs` check the words; `tools/check-found.mjs`, `tools/check-threads.mjs` and `tools/check-flags.mjs` check that every thing to find can be found, every step of every thread can be done, and no conversation waits on a flag that nothing sets; `tools/audio-check.mjs` renders every sound and tune and checks its level.
