# Round the Clock

A browser game set in **Sorrel**, the nation drum of 200 million on Herb Row (`docs/sorrel.md`, `docs/ashgrove.md`). It exists to show off how much variety one drum holds. Sorrel is cut like a clock into twelve **Hours**, each a county with its own colours, trade, word and dish. You join one Hour's running club and go round the clock: a small game in every Hour, played with the drum's real physics, from a full g at the rim to none at all on the axis. Each Hour ties a thread in its colours on your wrist. Then you run **the Round**, the Hours' yearly race right round deck 201, and every thread you wear makes that Hour's crowd carry you.

Play it on the world-bible site at **https://jeff87654.github.io/Kerr-swarm/round-the-clock/**. It is also published as a claude.ai artifact, https://claude.ai/artifact/XWekQuY44FnxZTeDa67aBG (rebuild and republish `dist/round-the-clock.html` there to update it).

## The twelve games

Each is drawn in its Hour's two colours and takes under a minute.

| Hour | Game | What the drum does to it |
|---|---|---|
| Hare | **The Long Stair** | A stair race from deck 16 to the Hollow's floor. You weigh half as much at the top, so every bound hangs longer and the rhythm has to slow. |
| Heron | **The Tide** | 45 million commuters glide out each morning, and the same weight of water has to be pumped in to keep the spin. The water takes two seconds to climb, so it is sent before the train goes. |
| Owl | **The Lid Wall** | Heliox takes the heat out of food, so everything is served under a lid, and every lid is somebody's. Find each regular's own lid before their bowl goes cold. |
| Bee | **Brush Rows** | Nothing in Sorrel carries pollen but people. One stroke of the brush has to go from one variety to another, flower by flower. |
| Fox | **A Both** | Nobody buys anything new. Trade what you hold for what someone wants, in a chain, until you hold the oldest chair in the market. |
| Otter | **The Jetty** | At half a g a dive from three metres takes half again as long to fall, so there is time for somersaults nobody could turn at the rim, and the spin bends the fall by about a hand's width. |
| Stag | **Going Up** | Stack an elder's furniture for the ride to the High decks. On deck 150 everything dropped lands three centimetres antispinward, and a tall stack remembers it. |
| Swift | **The Lean** | A cab climbing a spinning drum is pushed sideways; its cabin leans 13° at the Keel, 25° near the Hollow and more under braking. You are the gimbal, with a full cup of tea. |
| Badger | **The Take-Apart** | Is it finished. In Badger the answer is nearly always "not yet". |
| Moth | **Crosswise** | Flying the axis by night in wing-sleeves. Along it is easy; across it, the drum turns under you and every path curls anti at 6.5° a second. |
| Wolf | **Spinball** | The same throw is a different throw in each direction: spin sinks, anti floats. |
| Lark | **Lamp-dawn Crepes** | The same toss at six stops from deck 40 to the Tenth: the lighter it gets, the longer a crepe hangs and the further spinward it lands. |

**The Round** is run twice, as in `docs/sorrel.md`: the Heavy Round spinward (a runner at full stride weighs a tenth more) and the Light Round antispinward (a tenth less, and the trick is to stay on the ground). The other eleven clubs run to character: Stag wins the Heavy and Hare the Light unless you beat them, Swift leaves early, Heron has never won and never failed to finish.

## Canon status

The Hours, their colours, clubs, words, dishes and rivalries, and every place the games are set in, come from the Sorrel Atlas (`atlas/sorrel/content/hours.json` and its landmarks) and `docs/sorrel.md`; the physics follows `docs/raft-habitat.md`, `docs/drum-transport.md` and `docs/ashgrove.md`. **Introduced here, and not canon:** going round the clock and the threads; each Hour's game as a custom of that Hour (the Long Stair, the hoops on Moth's night, Stag's going-up day, and so on); the hosts who aren't in the atlas (Sunniva Paek, Tomas Idowu, Odile Barros, Roisin Abara, Iolo Marchetti); the Round's finishing times and the other clubs' ways of running it; the day ending at the bandstand. Ideas worth keeping should be written into `docs/` on purpose.

## Layout

- `src/page.html`: markup and CSS. `src/*.js`, concatenated in name order:
  - `00-util`, `05-drum` (Sorrel's numbers and the Coriolis the games share), `10-stage` (one square canvas, a fixed 120 Hz step, one input object), `15-draw` (the shared look: colour, type, people, lamps, threads), `20-audio` (a small synthesiser);
  - `30-shell` (what the player has done, the card beside the stage, the run of one game), `40-hub` (the clock: Sorrel end-on);
  - `50-hare` … `61-lark`: one file per Hour's game; `69-round`: the Round;
  - `90-main`: start-up and test hooks.
- `content/hours.json`: this game's own fields for each Hour (colours as hex, the host of its game and what they say for none to three knots). The build joins it with the atlas's `hours.json`, so the Hours' character, words and dishes have one source.
- `content/brief.md`: the brief the games were written from: the drum in one page, the voice, the contract for a game file, the drawing kit, and how to work on one game alone.
- `tools/`: `build.py`, `sim.js` (play every game with its bot, without a browser), `shot.js` (pictures of the page in headless Chrome) and `flow.js` (a scripted click-through). The last two need `npm i playwright-core` and Chrome or Edge.

Every game has a **bot** that plays it through the same input a player has. It is the demo on each Hour's card ("the house shows you how"), and it is how the games are tested and balanced.

## Building

```
python tools/build.py                    # dist/round-the-clock.html (artifact page) and dist/index.html (standalone)
python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
python tools/build.py --check            # name clashes between source files, and the writing rules
python tools/build.py --only lark,otter --dist out/mine    # just those games, into another folder
```

The world-bible site build (`site/build.py`) runs the standalone build into `_site/round-the-clock/` and links it from the home page and the sidebar.

## Testing

```
node tools/sim.js                                    # every game, bots at three skills, eight seeds: do they end, and are the marks fair
node tools/sim.js round --mode light --threads 2     # the Round with two knots on every thread
node tools/shot.js --q "ev=wolf&bot=1&seed=3" --at "5,20,end" --out out/wolf     # pictures of a bot's game (needs playwright-core and Chrome)
node tools/shot.js --q "view=card&h=6" --at "4" --out out/card --page --phone    # an Hour's card on a phone
node tools/flow.js [--phone]                         # click through the whole thing with a real pointer and keyboard, mashing at every game
```

- Query hooks for a local build: `?ev=<hour>` starts a game (`&bot=1` lets the house play, `&skill=0.5`, `&seed=3`, `&speed=4`); `?view=clock|card|pick|result|round&h=7`; `&club=7`, `&threads=2`, `&clock=21:30`, `&fresh=1`, `&mute=1`. An artifact link carries no query, so there `#otter` opens Otter's card and `#round` the Round.
- The stage's clock follows the viewer's own time of day: Sorrel's sunline ramps from six, is full from nine to three, and is down by six in the evening.
