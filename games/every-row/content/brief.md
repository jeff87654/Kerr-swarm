# Brief for a world

Read `ARCHITECTURE.md` first: it is the contract. This file says what a world should be and what the setting allows.

## What we are making

An endless, hands-off flight through the drums of Merrow, in the manner of Ethan Mollick's *Portals*: each world is forty to sixty-five seconds of camera flight through one place, ending in an opening onto the next. The user asked that it show many drums and how different they are, many styles of Hollow, the living areas and plazas as well, and that it be **immense and awe-inspiring**. A world earns its place by being a picture nobody has seen before of a place that could only exist here.

The bar is high. A viewer should want to pause on any second of your flight. Plain, tidy and correct is not enough: go back and add the thing that makes it a place (the lit window, the long table, the child flying crosswise, the row of drying noodles), then the second thing.

## The setting in a page

The full digest, with sources, is `games/guest-right/content/drum-digest.md` (470 lines): read the sections your place touches. The docs themselves are in `docs/`. `games/three-nights/src/15-canon.js` has sixteen drums written up with their customs, dawn palettes and people. What follows is only orientation.

- **A nation drum** is a spinning cylinder 3 km in radius and 3.75 km long with about 200 million people, turning once in 110 seconds. Out is down. 376 decks, 4 m apart, run from the rim (1 g) in to the floor of the Hollow at 1,500 m (half a g). Most of the drum is an indoor city of streets and arcades with 3 m ceilings, lit about as brightly as a living room; the Hollow and the atria (parks cut up through several decks) are the only ceilings higher than a room.
- **The Hollow** is the open middle: 3 km across, its floor 35 km² of park wrapped right round, the far bank hanging 3 km overhead, upside down and perfectly sharp (heliox carries no dust). A **sunline** on the axis is its sky: a three-hour dawn from 06:00, six hours of full sun, three of dusk, then the lamp-night. It stops 450 m short of each end wall, so the floor's ends are dim woods. **End walls** climb in thirty terraces toward the axis, lighter with every tier: a third of a g at the Third, where people dance leaping reels and marry; a twentieth at the top gardens. Within 75 m of the axis, the **Spindle**, you weigh nothing and fly, in netted flying halls by day and the whole length by night.
- **Decks**: the Keel at the rim (food plant, water, reserves, the nine station rings; no homes), the Low decks (families, schools, visitors), the Middle decks (most homes and work), the High decks (elders, prestige). A block is about 3,000 people on six decks, 230 m on a side, round an atrium court. Lift cores every 100 m carry cabs: small private rooms that hum, lean and open somewhere else.
- **Outside**: drums stand 24.5 km apart on a square grid in a raft, Merrow, 0.1 AU across with 300 billion of them, between a layer of rectennas in front and radiators behind: a dark hall 3.75 km deep. A glide car let go at one drum's rim coasts 140 seconds to the next. Every drum wears rings of quay lights round its waist; they go back rank behind rank to a vanishing point. Nobody inside sees stars. Behind the radiators the back crews, and children once at about eight through a Window, see the River: a broad band of stars, pale gold, with dust rifts the crews call bruise, and black shapes where other rafts hide it.
- **People** live on 2 kWe each. Mass is dear, so things are old, mended and inherited; fashion lives in linings and alterations. Money is kWh ("kays"). Food comes from the Mill (chemistry), the Vats (microbes, fungi, cell culture) and the Garden (lamp-grown herbs, greens, a few fruit). An orchard apple is a luxury and a wedding thing: cut crosswise, it shows a star.
- **Every drum sets its own rules** inside the same beam per share, so neighbours a free glide apart differ a great deal. That difference is the subject of this piece.

### Kinds of drum (open-drums.md, people.md, families.md)

steady drums (Sorrel, Lovage, Tansy, Squall, Ochre) · open drums, about a quarter, which hold births to deaths without coercion, keep a Margin and grant guest-right: **hall** drums (Chervil, Carillon, Dulse: human time, cooks, music, loud and crowded), **wood** drums (Sloe: dim woods, long silences, "a monastery the size of a nation"), **fair** drums (Gloaming, Borage: light and spectacle, rents returned), **maker** drums (Kittiwake, Spelt, Yarrow: a famous thing people glide to) · counted drums (Rue; Madder until this year) under a birth stop, their Count on every platform.

### Rows, and the light delay home to Chervil (wander-year.md)

| Row | Drums | light |
|---|---|---|
| Herb Row | Sorrel, Lovage, Tansy, Chervil, Rue, Yarrow, Borage | 0.0 |
| Hedge Row | Sloe | 8.7 |
| Gull Row | Kittiwake | 18.9 |
| Weather Row | Gloaming, Squall | 28.0 |
| Bell Row | Carillon | 32.6 |
| Kelp Row (the far side) | Dulse | 36.9 |
| Pigment Row | Madder, Ochre | 33.1 |
| Grain Row | Spelt | 23.7 |
| the slow line | between rows | 3.4 on leg 1, 7.6 on leg 11 |

## Hard limits (drum-digest.md, section 11)

- No animals anywhere, except forty hens behind glass in Tansy. No birds, fish, insects, pets.
- No sky, weather, clouds, rain, wind, seasons, stars or sun inside a drum. No natural light: every garden runs on lamps or the sunline. The only winters are chilled tents over sections of orchard.
- No fire, smoke, candles or flames. Cooking is electric or on the 65 °C waste-heat loop.
- No soil (plants root in inert media), no vehicles on the Hollow floor (cabs come up through lift pavilions), no homes in the Keel or on line decks.
- By day nobody flies in the middle of the Spindle: within 75 m of the lit line the light burns. Flying halls are at its two ends, inside netting.
- Numbers not to contradict: radius 3,000 m, length 3,750 m, 110 s a turn; decks 4 m apart; Hollow floor at half a g, far bank 3 km up; the lit sunline stops 450 m short of each wall; a glide is 24.5 km and 140 s.
- Robots are appliances. Nothing computes or lives on the Lantern, and nobody sees it.

Where the docs are silent (most Hollows' layouts, most drums' interiors) you may invent, modestly and in the spirit of the drum, and say so under "Not canon" at the top of your file.

## Making it look good: what has been learned

1. **Light comes from the axis.** Everything on the floor is lit from straight overhead, like noon, at any hour. Sides of things get only the Hollow's glow and the bounce off the land. Do not fight it with darkness: use `amb` 0.3 to 0.4 by day, and get mood from the hour. A dawn or dusk (sun 0.3 to 0.6, exposure up to match) lets lamps and ten thousand windows shine against daylit land, and that mixture is where the beauty is. Full noon is the plainest light there is: use it only where brightness is the point (Lovage).
2. **Colour.** Tone mapping makes saturated greens go neon. Paint land a little greyer and lighter than you think ('#8aa466', not '#6f9c48'), and let the light's colour do the work. Give each drum its own palette: its dawn colours are in `15-canon.js`.
3. **Scale is the subject.** Put people where the camera passes (they are tiny, and that is the point), then show the same world from far enough off that they vanish into it. Fly close to something particular, then lift and let the land close over the sky.
4. **Look along the axis** for the cylinder: land rising on both sides, the sunline running to the far wall. **Look spinward** for the wave: the ground climbing ahead of you until it is overhead.
5. **Detail near the flight, plan everywhere.** Real trees, people and props within a couple of hundred metres of the camera; beyond that the painted plan carries everything, so paint it richly (walks, lamps, gardens, clumps, fields, squares).
6. **Things should move.** People stroll (the `walk` material), lamps drift (`move` on glow points), cabs climb the walls, water ripples. A world with nothing moving is a photograph.
7. **The end walls are cities.** Windows lit at dawn, dusk and night (`front.lit`, `back.lit`), houses in the drum's colours (`houses`, `houseMix`). From the axis an end wall is a disc of thousands of lights.
8. **Check every second.** Take a picture every four seconds of the flight and look at each. Fix the dull ones: move the camera, add a thing, change what it looks at. Then run it live through its own opening.

## How to work

- Write one file, `src/worlds/<your_file>.js`, exporting one world (or two if told). Do not edit any other file in `src/`: if the kit lacks something, build it in your own file, and say what you needed in your report. Shared files change under several hands at once.
- Test with `node tools/shot.mjs --file <your_file> ...` (a dev server is already running on port 5210). Save pictures under `out/<your_file>/`. If a page load fails with an error in a file that is not yours, someone is mid-edit: wait a few seconds and run it again.
- Finish with: `python tools/build.py --file src/worlds/<your_file>.js` clean; a contact sheet of the whole flight at `out/<your_file>/sheet.png`; a live run through the opening without errors; and a short report written to `out/<your_file>/report.md` (what the world shows, what is not canon, anything the kit should gain, frame rate and triangle counts).
