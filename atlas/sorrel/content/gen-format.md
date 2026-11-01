# Generator pools: format and how they're used

Read `brief.md` first. This file is for the writers of the generator pools.

## What the generator does

Sorrel has ~70,000 neighbourhoods: blocks of ~3,000 people, ~210 m on a side and five or six decks deep, on the residential decks (16–375, skipping line decks). Clicking any of them on the map opens a card built from the pools below. The same neighbourhood always gets the same card. A reader will open dozens of cards, so every item must stand on its own, read well next to any other item, and be specific enough to be remembered.

A neighbourhood card looks like this (an example, assembled by hand):

> **Hazelmere** · Decks 141–146 · Ring Six · Owl · 0.81 g
>
> *A workshop town: three thousand people over a street of lathes and the smell of hot cellulose.* (types)
>
> **The middle.** A dim wood of hornbeam, two and a half hectares lit like a cloudy evening. The path runs spinward, so walkers get a little heavier toward the far end and swear they can feel it. (middles)
>
> **Eat.** The Mill Hall puts black vinegar on everything, and on Thursdays the night stew is green with whatever the herb pots gave up. (halls)
>
> **Makers.** A flute maker who tunes every pipe in the shop's own air, 1.2 m long. A dye shop whose algae blue is said to be bluer than anyone else's. (trades × 2)
>
> **You'll hear** a trolley bell on the arcade, two notes, the second one sharp. **You'll smell** amazake from the bath kitchen. (sounds, smells)
>
> **Custom.** New neighbours plant a herb on the stair outside their door. The stair is mostly basil. (customs)
>
> **The argument.** Whether to light the wood brighter for the children, or leave it dim for everyone else. (arguments)
>
> **A neighbour.** Odile Brannoc, 67, lamp-fitter: "I change a thousand lamps a year and I've never seen one fail. They retire." (residents)
>
> **History.** In the Eleven Days the wood was the only place in Ring Six with any light, from the baths' emergency lamps, and people slept under the hornbeams. (histories)

The code adds the address, weight, the Hour's and Ring's lines, cab times and nearby landmarks.

## Rules for every item

- Follow the voice rules in `brief.md` strictly: plain, concrete, warm, quietly funny, British spelling, **no em or en dashes in prose**, none of the banned phrases, no exclamation marks, no rhetorical questions.
- **Self-contained.** Never name a specific neighbourhood, person from canon, or deck number in a pool item. Don't refer to "the pears" (Ashgrove's alone) or the Daces. You may use these placeholders, which the code fills in:
  - `{name}`: this neighbourhood's name
  - `{hour}`: its Hour's name (Hare, Heron, Owl, Bee, Fox, Otter, Stag, Swift, Badger, Moth, Wolf, Lark)
  - `{ring}`: its Ring as a word (One … Nine)
  - `{years}`: a number of years ago (the code picks a plausible one; write "{years} years ago")
  Use placeholders sparingly: at most one per item, and only where they read naturally.
- **Bands.** Tag each item with the bands it suits: `"low"` (decks 16–113: families, children, schools, sport, inns, ~0.9 g), `"middle"` (114–301: most homes and work, ~0.7 g), `"high"` (302–375: in Sorrel, elders by allotment, mostly over ~85, ~0.55 g, near the Hollow). Use all three when it fits anywhere. Make sure each band gets plenty of its own items: something that only makes sense with children belongs to `low`; something about elders and lightness belongs to `high`.
- **Light.** Each neighbourhood's middle is either `"bright"` (a court lit to overcast-day brightness, ~10,000 lux, for twelve hours), `"dim"` (a dim wood or long garden at ~1,000 lux), or `"court"` (an atrium or square lit some other way: a hall, a stair, a pool, a market, lamp-lit like a room). Items in other pools that only make sense with one kind of middle carry `"needs": "bright"` or `"needs": "dim"`; otherwise `"needs": null`.
- **Variety.** Cover the whole of life: children, work, food, sound, light, water, weight and Coriolis, heliox, thrift and mending, the dead and the newborn, music, games, quarrels, love, old age, rotas, the Lattice, the Hollow turn, the Window, Booking Day, Knotnight, Summer Day, the Eleven Days, going dark. Don't let any one idea (pears, gin, the Nine, lids) appear in more than a handful of items across your pools.
- **Physically true.** Check weights (g = r ÷ 3,000), prices (brief.md's list), light levels and the canon constraints (no animals, fire, weather, sky, stars inside).

## The pools

Each output file is one JSON object with the keys listed for it. Every item is an object.

### `gen-places-a.json`: types, middles, halls
- **`types`**: the neighbourhood's identity line, shown in italics under its name. `{ "bands": [...], "text": "..." }`, 12–28 words, starting "A … town:" or similar (a school town, an inn town, a workshop town, a stair town, a wood town, a choir town, a quiet town, a garden town, a lending town …), each with one telling specific. At least 15 per band (an item may serve several bands).
- **`middles`**: the neighbourhood's middle: its court, square, wood, garden or atrium. `{ "light": "bright" | "dim" | "court", "bands": [...], "text": "..." }`, 35–70 words. Name what's planted or built there, how it's lit, how high it goes (atria cut through several decks; 4 m a deck), what weight does to it, who uses it. Plants that work: herbs, tomatoes, strawberries, fruit trees in tubs or espaliered (quince, fig, medlar, damson, plum, cherry, apple, lemon), tea, ferns, moss, ivy, hornbeam, birch, yew, hazel, bamboo, climbing roses, vines, grasses, mushrooms on residue logs. Other middles: a pool, a spinball court, a climbing wall up an atrium, a stair garden, a market hall, a felt-hung music room, a long reading room. At least 25 bright, 25 dim and 20 court.
- **`halls`**: where the neighbourhood eats: its Mill Hall (free Mill-table meals, robots cook, regulars run the room) or a cooked hall, canteen or counter, and what makes it particular. `{ "bands": [...], "text": "..." }`, 20–45 words. At least 50.

### `gen-places-b.json`: trades, sounds, smells, rare
- **`trades`**: one shop, workshop, office, service or small institution. `{ "bands": [...], "text": "..." }`, 12–30 words, a whole sentence that names it and gives one specific. Menders, tailors, dyers, cobblers, flute makers, chair remakers, lamp makers, glaziers, weavers of spun cellulose, a tool library, a toy library, a seed and strain counter, tutors, a clinic, a greengrocer, a herb shop, a tea room, a gin cellar, a bath, a sound studio, a slate shop, a bookbinder, a clock mender, a knife grinder, a fabricator shop, a world room, a dance school, a fitting room for wing-sleeves, a lettering shop for name plaques … At least 110, spread over the bands.
- **`sounds`**: what you hear. `{ "bands": [...], "text": "..." }`, 6–20 words, a noun phrase that follows "You'll hear". Heliox matters: bright voices, ringing rooms, long pipes, felt. At least 60.
- **`smells`**: what you smell. `{ "bands": [...], "text": "..." }`, 4–16 words, a noun phrase that follows "You'll smell". At least 50.
- **`rare`**: unusual things only a few neighbourhoods have (shown on about one card in eight). `{ "bands": [...], "needs": null, "text": "..." }`, 30–60 words. A heliox organ in an atrium, a stair where a famous runner trained, a flat kept as it was in the Eleven Days, a wall of name plaques, a hall with a Lovage chef who swapped in, a court with a single lemon tree that has outlived four light votes … At least 36.

### `gen-life.json`: customs, arguments, residents, histories
- **`customs`**: a local custom. `{ "bands": [...], "needs": null | "bright" | "dim", "text": "..." }`, 15–45 words. Small, specific, often funny, often tender. At least 120.
- **`arguments`**: the neighbourhood's current quarrel. `{ "bands": [...], "needs": ..., "text": "..." }`, 12–35 words, phrased as what's in dispute ("Whether …", "Who …", "The …"). At least 75.
- **`residents`**: a neighbour and what they say. `{ "bands": [...], "role": "lamp-fitter", "age": [40, 75], "line": "..." }`. `role` is a job or station in life (lower case); `age` the range they could be (Low decks: children from 8, parents, workers; High decks: mostly 85–118); `line` is 8–30 words of their own speech, in quotes-free plain text. The code adds a name. At least 150, with roles from every walk of Sorrel's life (Gate hands, cooks, menders, teachers, lamp-fitters, cab engineers, back-crew veterans, choir leaders, strain librarians, Keel shift crews, wedding remakers, the Hollow rota clerk, a child who is very good at spinball …).
- **`histories`**: something that happened here. `{ "bands": [...], "text": "..." }`, 15–45 words, past tense. Use `{years}` for a time ago, or tie it to a named event (the Eleven Days, 74 years ago; the Summer, ~1,100 years ago; the Count, ~640 years ago; the orange-steak year, undated; a blight; a flood from a trim tank; a cab-core fire; a famous wedding; a record in the Round). At least 75.
