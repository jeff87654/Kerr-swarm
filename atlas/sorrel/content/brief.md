# Writers' brief: the Sorrel Atlas

The Sorrel Atlas is an interactive cutaway map of **one nation drum, Sorrel**, on Herb Row in the raft Merrow. Its job is to show that a single drum of 200 million people holds a lifetime of places. It has two kinds of content:

1. **Landmarks:** about 200 hand-written places, from the quay outside the hull to the axle at the drum's heart. Each is pinned on the map and listed in an index.
2. **The generator:** every one of Sorrel's ~70,000 neighbourhoods (and every block of the Keel, the line decks and the Hollow floor) gets a deterministic card built from writing pools. Click anywhere on the map and a door opens.

The world bible in `docs/` is canon and wins every disagreement. Read this brief, then the docs it points to. The most useful are `docs/ashgrove.md` (Sorrel itself), `docs/raft-habitat.md` (the drum), `docs/drum-transport.md` (cabs), `docs/daily-life.md` (prices, light), `docs/eating-out.md` (Sorrel's restaurants), `docs/open-drums.md` (customs; note Sorrel is NOT an open drum), `docs/people.md`, `docs/economy.md`, `docs/food-system.md`, `docs/cuisine.md`, `docs/wander-year.md`, `docs/glossary.md`. The game's canon brief, `games/three-nights/content/brief.md`, is a good one-file summary of the setting and its voice. Read it.

## Sorrel in one paragraph

Sorrel is a **steady drum** of 200 million on Herb Row in Merrow, a 0.1 AU raft of ~6 × 10¹⁹ people. It runs the standard commons and an equal dividend (21.6 kWh a day, "kays"). It allots its **fixed goods by age**: the old get the High decks and the most Hollow time ("she's gone up" is a polite way to say someone has retired), and the elders have the Hollow's lake every morning at lamp-dawn. It is a **pool drum**: each place carries one birth right, which can be given but not sold; at a death the place returns to the pool and a child is born into it, and children are named for the dead whose places they take (the family sends the dead's family a note every year). Gin is sold near cost, with thiamine in it, as in the salt. Its dawn is a plain ramp, warm then white: Sorrel thinks painted dawns are for show. Its motto is "Lids on." Its ring counters serve a peppery broth. It keeps a dozen Windows behind the drum and every child goes once, at about eight, with one adult of their choosing. Lovage (next door along Herb Row) finds Sorrel "dim and a little drunk"; Sorrel finds Lovage "dazzling and a little vulgar". Rank in Sorrel lives in standing (posts held, years served), in what people make, and in old things: "the best chair in a room is the oldest".

## The drum (numbers you will need)

- Radius 3,000 m at the rim (1 g), length 3,750 m, one turn every **110 s**. **Out is down; the Hollow is up.**
- **Deck n** sits at radius **r = 3,000 − 4(n − 1) m**, with **weight g = r ÷ 3,000**. Decks are 4 m apart, ceilings ~3 m. Deck 376 is the Hollow's floor (r = 1,500 m, 0.5 g).

| Deck | r (m) | Weight | Around (km) | Deck speed (m/s) |
|---|---|---|---|---|
| 1 (rim) | 3,000 | 1.00 g | 18.8 | 172 |
| 16 | 2,940 | 0.98 g | 18.5 | 168 |
| 50 | 2,804 | 0.93 g | 17.6 | 160 |
| 77 | 2,696 | 0.90 g | 16.9 | 154 |
| 113 | 2,552 | 0.85 g | 16.0 | 146 |
| 150 | 2,404 | 0.80 g | 15.1 | 138 |
| 201 | 2,200 | 0.73 g | 13.8 | 126 |
| 250 | 2,004 | 0.67 g | 12.6 | 115 |
| 301 | 1,800 | 0.60 g | 11.3 | 103 |
| 330 | 1,684 | 0.56 g | 10.6 | 96 |
| 352 | 1,596 | 0.53 g | 10.0 | 91 |
| 361 | 1,560 | 0.52 g | 9.8 | 89 |
| 375 | 1,504 | 0.50 g | 9.4 | 86 |

- **Bands:** the **Keel** (decks 1–15, ~1 g, no homes: the food plant, water works, methanol tank farm, survival reserve, waste oxidation, recyclers, workshops, and the nine station rings); **Low decks** (16–113, 0.98–0.85 g, ~67 M people: families, schools, sport, inns for visitors); **Middle decks** (114–301, 0.85–0.6 g, ~102 M: most homes and work); **High decks** (302–375, 0.6–0.5 g, ~30 M: in Sorrel, the elders, by allotment); **the Hollow** (inside r = 1,500 m).
- **Line decks** (nobody lives on them): fifteen, each two decks deep: **13–14, 38–39, 63–64, 88–89, 113–114, 138–139, 163–164, 188–189, 213–214, 238–239, 263–264, 288–289, 313–314, 338–339, 363–364** (the first is in the Keel). Loops run round the drum on one level, cross-lines along the axis on the other; tubes hold pure **helium** (nothing burns there; crews wear masks); the rest of each line deck is cab depots, workshops and freight sorting. Posted loop limits: **"spinward high, antispinward low"**: near the Keel a spinward cab is held to ~18 m/s (riders feel 1.2 g), near the Hollow an antispinward one to ~21 m/s (riders feel 0.3 g); in the middle both run 30 m/s. Cross-lines run 30 m/s.
- **The Lattice:** six-seat cabs, one party each, with gimballed cabins that lean against Coriolis (13° at the Keel to ~31° near the Hollow at 20 m/s). Lift cores every ~100 m (~5,200 of them, each serving ~38,000 people), ten channels each. Any two points are ~6 minutes apart door to door, ~12 at worst. Deck 77 to the rim in ~30 s; to deck 361 in ~71 s; deck 361 to the Hollow floor ~14 s. Station platform from an average flat ~2.2 minutes. ~6–9 M cabs. "The cab is a room": most people never see the tubes.
- **Walking speed** falls with weight: ~1.35 m/s on the Low decks, ~1.15 mid-drum, ~1.0 on the High decks. A kilometre on foot costs ~30–38 kcal of food; riding is the thrifty choice.
- **Coriolis:** "axis flies true, spin sinks, anti floats". Going spinward makes you heavier by (1 + u/v)², antispinward lighter (v is the deck speed above). A dropped cup lands ~2 cm antispinward per metre of fall, and children say "anti". A leap at a third of a g lands a hand's width spinward. Flying across the axis bends your path ("crosswise" is the hard way).
- **Jumps:** a standing jump that clears 0.5 m on Earth clears ~0.55 m on the Low decks, ~0.7 mid-drum, ~1 m on the Hollow floor, 1.5 m at a third of a g, ~5 m at a tenth, ~10 m at a twentieth (the top terraces: "a child can jump the height of a house"). Things fall slower: at half a g a dive takes 1.4 times as long.
- **Air:** heliox. Sound is ~1.8× faster: voices bright and thin-edged, rooms ring (good rooms hang felt), a flute is ~1.2 m long, an organ's biggest pipes nearly twice Earth's length, and old recordings sound "spoken through a blanket". Helium chills skin, so rooms run warm, a hot bath is the cheapest luxury, and food comes **under lids**. Pressure is ~4% higher at the rim than the Hollow.
- **Light:** homes ~200 lux; workplaces and corridors lamp-lit; a neighbourhood's park light is ~53 W a head (~160 kW for 3,000 people): enough for one bright court (~5,000 m² at 10,000 lux, overcast-day bright, for twelve hours) or a **dim wood** (~2.6 ha at ~1,000 lux). Which one is a civic vote. A private garden lit like an overcast day costs ~0.5 kWh per m² a day: a bright home is the plainest sign of wealth. Herbs and orchard trees in lit parks get their light free.
- **The Hollow:** 3 km across, 3.75 km long; its floor is ~35 km² at 0.5 g, 9.4 km around. The far bank hangs 3 km overhead, upside down and perfectly sharp (filtered heliox carries no dust). **Sorrel's sunline:** lamp-dawn ramps 06:00–09:00, full brightness (100,000 lux, a clear noon) 09:00–15:00, dusk 15:00–18:00, then lamp-night. The lit line stops ~450 m short of each end wall, so the floor's last ~750 m before each wall dims toward it. The Hollow holds ~1.4 M at beach density, so Sorrel shares it out **by deck: a six-hour turn about every eight weeks**, with extra hours for elders and the lake for elders every morning at lamp-dawn. Guests come up with a host deck's turn or take the end-wall terraces at dusk. ~1,300 lift cores rise through the floor as **pavilions** (about one per 3 ha); no vehicles run on the floor.
- **End walls:** terraced, climbing from the floor (0.5 g) toward the axis. A terrace's weight is r ÷ 3,000: a third of a g at r = 1,000 m, a quarter at 750 m, a tenth at 300 m. Top terraces (~150 m from the axis) get little direct light and are gardens. The terraces of the end walls are, with the Court-style atria, the only places in Sorrel with windows. **Spindle lifts** climb the end walls at 12 m/s, 1.5 km in a little over 2 minutes; near the top "down" swings sideways, then toward the axis, then fades.
- **The Spindle:** within ~75 m of the axis you weigh under 3% of a g: flying country, in **wing-sleeves** (fabric fins wrist to hip, hired at the gate). By day people fly only in the netted **flying halls** at each end (within 75 m of the axis and out to ~300 m from each end wall); in the lamp-night the whole Spindle opens. The sunline hangs on a tensioned spar from axle to axle; its spar carries power from the front axle and coolant to the back.
- **The axles:** the **front axle hall** is power in (~160 GW through a rotary joint). The **back axle hall** is heat out: pipes as wide as rooms carry ~220 m³ a second of ammonia through the great rotary joint, "the loudest place" in the drum. From the back axle a chamber that turns with Sorrel slowly stops turning (a little under two minutes), and a short armoured car runs on a shielded track out through the radiator layer to **the Windows**: a dozen long low galleries, each seating ~150, with tiered couches and a long shutter, red-lit for twenty minutes so eyes wake up. The sky: **the River** (pale gold band of stars; brown-violet dusty edges the back crews call **"bruise"**), **the Shelf** (fainter glow above and below), and black shapes where nothing shines: other rafts, about a sixth of the sky.
- **Outside the hull:** a 50 m **hydrogen jacket** at 20 K (cosmic-ray shield; cryopanels in the guard vacuum between hull and jacket freeze whatever the hull leaks), then **the moat**, ~0.5 m of the drum's own water outside the jacket over the sides and front cap (the X-ray shield, held near 290 K by the coolant loop), then **the quay**, a band of track round the waist at ~3,050 m, moving at 174 m/s, where cradles let glide cars go and catch them. Beyond: the **mid-raft**, a dark hall 3.75 km deep flooded with the Lantern's hard X-rays (lethal to an unshielded person within minutes), rectennas in front, radiators behind. A **glide** is 140 s of weightless free fall to the next drum, through aft-facing windows behind a metre of water; every drum wears rings of quay lights round its waist, rank behind rank. Back crews work the radiator panels on sleds and see the stars on ordinary days.
- **Rhythm:** lamps in homes ramp up at 06:30 and fade toward 23:00. kWh are cheapest in the lamp-night (laundry at 01:00). The machines take the night: batch work, fabrication, slow vat lines. Weekdays exist.
- **Prices (kWh):** herbs from the pot 0.03; boiling a litre 0.045; coffee 0.15; a gin 0.18; a pint 0.38; a tomato 0.5; side salad 0.59; mycelium steak 0.84; noodles in broth 0.96; slow cycler leg 1.1; ramen 1.77; Vat-table dinner 2.48; cultivated steak 2.91; an hour of someone's time ~3 in Sorrel; an orchard apple 4.4; a new shirt 5; a day of personal compute 9.6; new shoes 20; remade wing-sleeves ~18; express cycler leg 111; a new chair 125; a new sofa 1,000. New mass costs ~25 kWh a kilogram, so things are mended, altered, remade and inherited; fashion lives in linings, collars and dye ("this season's hard algae blue").
- **Food:** the Mill table is free (jook in the morning, glass noodles and starch jellies at noon, stew with a starch swallow at night, Mill lager, **the Nine** on every table); the Vat table adds texture and flavour (sourdough, cheese, vat egg, mycelium steak). Inverted scarcity: pastry is cheap, salad a treat, tomatoes sold like jewellery. **Waste-heat cooking** on the food plant's free 65 °C loop (onsen custards, amazake, black garlic, broths below a simmer). Blights take out one vat line and become vintages ("the orange-steak year", when Sorrel's *Fusarium* line failed and the drum ate *Neurospora*; Sorrel still cooks orange steaks on the anniversary).
- **People:** look like all of humanity mixed together; names from every Earth language, worn smooth (speech and names "in translation"). Lives ~120 years. ~1.7 M births and deaths a year in Sorrel (~4,600 a day). Every embryo is proofread at the clinics (a norm, not a law).

## Sorrel's geography (new, for the Atlas)

These are proposals that every writer must use consistently.

### Addresses
Sorrelers give an address as **deck, ring, hour**: "seventy-seven, Three, Bee" is deck 77, Ring 3, the Hour of the Bee. The Lattice numbers its cores, but nobody says those aloud.

### The nine Rings (along the axis, front to back)
The drum's 3,750 m length is cut into nine **Rings**, each ~417 m long and named for the **station ring** in the Keel beneath its middle, where the glide trains come and go. **Ring 1 is at the front** (the power end, nearest the front cap, where the beam comes in) and **Ring 9 at the back** (the heat end, nearest the back cap, the radiators and the Windows). A Ring runs through every deck, Keel to Hollow. Each station ring serves one level of glide lanes:
- **Rings 1, 3, 7 and 9:** lanes along Herb Row, to **Lovage** one way and **Tansy** the other.
- **Rings 2, 4, 6 and 8:** lanes across the rows, to **Chervil** one way and **Rue** the other.
- **Ring 5:** the tube level: tube cars and capsules for **cyclers**, anywhere further than a glide. Wanderers and long-trippers leave from here.
- Ring 3 is the Daces' ring: the **Gate** where Teo works is on its inbound platform, and **Keel Baths Kitchen** is in its Quaysides.

### The twelve Hours (around the drum)
Around the drum, Sorrel is cut into twelve **Hours**, 30° each, numbered like a clock and counted **spinward**. Each is a wedge from the Keel to the Hollow, all along the drum: ~16.7 M people, a county. They are named for **animals nobody in Sorrel has ever seen** (animal words survive only as names):

| No. | Hour | Across the Hollow (overhead) |
|---|---|---|
| One | Hare | Stag |
| Two | Heron | Swift |
| Three | Owl | Badger |
| Four | Bee | Moth |
| Five | Fox | Wolf |
| Six | Otter | Lark |
| Seven | Stag | Hare |
| Eight | Swift | Heron |
| Nine | Badger | Owl |
| Ten | Moth | Bee |
| Eleven | Wolf | Fox |
| Twelve | Lark | Otter |

- People belong to their Hour more than their Ring: it's where their family has lived, up and down the same wedge, for generations. Each Hour has its own colours, a club for the Round (below), a few words of its own, and a dish. Rivalries run across the Hollow: you can see the Hour opposite yours hanging overhead, upside down, 3 km away.
- **Ashgrove is in Bee** (Four), Ring 3, decks 73–78. Bee children wrap and brush the pears. Nobody in Sorrel has seen a bee.
- **The Round** is the twelve Hours' great race, run once a year on the **Round Arcade**, an arcade that runs right round deck 201 (13.8 km). There are two Rounds: the **Heavy Round**, run spinward (runners ~10% heavier), and the **Light Round**, run antispinward (~10% lighter). Sorrel keeps separate records for axis, spin and anti.

### The Hollow's floor plan
- **The lake:** Hours Fox to Stag (5–7), Rings 4–6, ~3 km² and 2 m deep (~6 Mt of the drum's inside water). Its **jetty** and the **elders' bench** are in Otter, Ring 5.
- **The orchards:** Hours Heron to Bee (2–4), Rings 3–7: apples mostly. Ashgrove's cab pavilion comes up among them.
- **The lawns:** Hours Swift to Moth (8–10), Rings 2–8: picnic grounds and the kite field.
- **The grounds:** Hours Wolf to Hare (11–1), Rings 3–7: half-g athletics, spinball fields, the bandstand.
- **The Dim Ends:** the floor in Rings 1 and 9, within ~750 m of each end wall, where the sunline's light falls away: woods and shade gardens, the drum's evening places.
- Pavilions everywhere, ~170 m apart.

### History you can use (proposals)
- **The Register of Places** runs back about 23,000 years without a gap.
- **The Count:** about 640 years ago Sorrel, then a holdings drum, posted a Count after a dairy-yeast blight caught its thin households; births stopped for 17 years. When it came down, the assembly made Sorrel a pool drum with one birth right per place, giftable not sellable. The old Count board still hangs in the Register hall.
- **The Summer:** about 1,100 years ago a fault in the back-cap rotary joint cut the drum's heat flow by a third for forty days. Sorrel dimmed its lamps and kitchens to match and the rooms still ran three or four degrees warm. It was the only summer Sorrel has ever had, and **Summer Day** is still kept with cold food.
- **The Eleven Days** (74 years ago, canon): a beam gap; the drum dropped to its survival load; no lamps, kitchens or worlds; cabs crawled, two trips a day; people walked the stairs and ate their larders; the Glide kept running and the rows passed food and parts along; Merrow braked its slow cyclers for three days of air. Hedda Dace was nineteen.
- **The orange-steak year** (canon, undated): don't date it.
- Nearly every drum has counted at some point; Knotnight and Booking Day are Sorrel's two big festivals (ashgrove.md).

## Canon places already in Sorrel (don't contradict; reuse where your section covers them)
- **Ashgrove** (decks 73–78, Ring 3, Bee): ~3,000 people, ~230 m on a side, five lift cores. **The Court**: atrium cut through all six decks, floor on deck 73 (~90 × 60 m), ceiling the underside of deck 79, 24 m up; planted terraces on each deck; the Court is lit to 10,000 lux and the terraces get a grey quarter-light because the Court has won the light vote six times running, "mostly because of the pears". **The pears:** three espaliered pear trees on the Court's brightest wall, older than anyone living; the youngest class wraps them in chilled tents for a six-week winter, unwraps them, and dabs the blossom with brushes; the first two pears go to the oldest resident and the newest baby, the rest by lottery. **The Long Arcade** runs spinward across Ashgrove on deck 75, with a slow trolley. **Pear Street** runs along the axis and crosses it at the Court. **The Mill Hall** (three free Mill-table meals; "nobody under thirty admits to eating here, and most of them do"). **The baths** (the warmest room in Ashgrove; 65 °C loop). **The greengrocer's** (tomatoes in a glass case; "the nearest thing Ashgrove has to a jeweller's"). **Dace's** (Anselm's mending shop, between a clinic and a stair, on the Long Arcade; ~3 kays an hour). **The school** on deck 75 (spinball at break in the long hall). **The Thiamine** (gin cellar on Pear Street, two corners from the Court, sign "Fortified, like our salt"; at your fifth gin they cut you off and bring free jook). The Daces' flat is on deck 77 off Pear Street; Ilka lives across Pear Street.
- **The Daces:** Anselm (52, mender), Teo (44, the Gate at Station Ring 3), Wren (15, heliox flute), Ossian (8), Hedda (93, retired back-crew hand, deck 361, Ring 3, Bee, with a 4 m² bright garden and a tomato vine she talks to). Ossian is named for Ossian Hale, a lift engineer from deck 286.
- **Station Ring 3:** the Gate (quarantine for anything biological; sequencer bay, cold room, clean benches; spot-checks one crate in fifty), the Quaysides, **Keel Baths Kitchen** (everything cooked on the 65 °C loop, one seared thing per plate, eaten in robes), Sorrel's **ring counter** (a cup of peppery Mill broth and a sticky rice ball, free).
- **The strain library** (with an isolation vault; registered starters can be regrown from their genomes within a week).
- **The Larder** (deck 352, among the elders' flats: Knotnight all year, only food that keeps; on the second Tuesday the elders cook their blight-year dishes from memory).
- **Axis Tea Room** (inside the netting of the flying hall: tea brewed in the lift lobby and sent up in lidded bulbs, since nothing boils at the axis; the house pour from a metre off bends a hand's width spinward; netted dumplings; crumbs float, order the mochi).
- **The lake, its jetty and the elders' bench; the orchards; the Spindle lifts; the flying halls with wing-sleeve hire; the back axle hall; the Windows.**

## Voice and rules (strict)

- **Plain, concrete, specific, warm, quietly funny.** Short sentences. One exact detail beats three adjectives. Physics as texture, never lecture. The humour comes from physics and thrift: a coat with four owners' mends, a cup that lands anti, a vote won "mostly because of the pears".
- **British spelling** (neighbour, colour, metre, grey, theatre, organise, licence as a noun, programme).
- **No em dashes or en dashes in prose.** Use commas, colons, full stops or parentheses. (Number ranges like "0.98–0.85 g" are fine.)
- **Banned:** "testament to", "tapestry", "bustling", "nestled", "whispers of", "a symphony of", "vibrant", "hum of life", "in a world where", "delve", "realm", "beacon", "labyrinthine", "a dance of", "the heart of" used figuratively, "not just X but Y", "it's not X, it's Y" framing, rhetorical questions, exclamation marks, scare quotes around your own coinages.
- People speak plainly, in translation: no modern Earth slang, no "folks", no "awesome", no corporate talk.
- Nobody is a villain. Problems are small and human: a rota, a noisy flute, a feud over the court's light, a missing crock.
- **Canon constraints, never break these:** no sun, sky, weather or seasons inside the drum (Hours named for animals and Weather Row are just names); no stars visible from inside (only the Windows, the back crews, and the apple's seeds); **no open fire, candles, smoking or wood stoves** (hand lamps, electric cooking); **no animals** (no pets, bees, birds, fish, insects kept), except that Tansy, a neighbouring drum, has the Row's only henhouse; no ships, planets, moons, tidal beaches or mountains; no currency except kWh ("kays"); places can't be bought or sold; two children is normal and a third is notable; nobody lives on the Lantern or sees it; minds are biological; robots are appliances (cooking robots in halls, cleaning robots), never characters; nothing travels between rafts except light.
- **Spiritual life** exists but is quiet and plural: meeting rooms for silence, a small faith that keeps the River as holy ("everything fell out of the River"), old faiths worn smooth. Don't name real Earth religions.
- Keep invented numbers modest and consistent with the figures above. Check every weight against g = r ÷ 3,000. Sorrel's elders get the High decks by age, so High-deck residents are mostly over ~85; Low-deck families have children; nobody lives in the Keel or on line decks (they work there).
- Don't reuse canon characters except where the canon puts them (Teo at the Gate, Anselm at Dace's, Hedda on deck 361 and the elders' bench, Ilka on Pear Street, the Daces in Ashgrove). Invent new people with names from many languages, worn smooth.

## Landmark format

Write a JSON array to your output file. Each entry:

```json
{
  "id": "keel-baths-kitchen",
  "name": "Keel Baths Kitchen",
  "kind": "eat",
  "zone": "keel",
  "deck": 3,
  "deckTo": null,
  "ring": 3,
  "hour": 6,
  "r": null,
  "wall": null,
  "blurb": "Everything cooked on the food plant's free 65 °C loop, eaten in robes in rooms the same pipes warm.",
  "text": "60–130 words: the main entry. What it is, what it's like to be there (light, sound, weight, smell), who goes, one memorable specific.",
  "detail": "Up to 35 words: one practical fact. A price in kWh, opening hours, how to get in, a custom, a number.",
  "who": { "name": "Orla Marsh", "age": 58, "role": "head cook", "line": "Up to 30 words in their own voice." },
  "canon": "eating-out.md",
  "tags": ["waste-heat", "baths"]
}
```

- **id:** unique kebab-case.
- **kind:** one of `home` (neighbourhoods, streets, flats, inns), `civic` (offices, registers, courts, the Gate, stations), `eat` (food and drink), `water` (baths, pools, the lake, tanks), `green` (courts, gardens, woods, orchards, light), `work` (works and crews: the food plant, machines, maintenance), `make` (workshops, shops, markets, crafts), `culture` (schools, libraries, museums, music, theatre, art), `play` (sport, flight, games), `rites` (namings, funerals, memorials, chapels, the Window, quiet places).
- **zone:** `outside` (jacket, moat, quay; r ≥ 3,000), `keel` (decks 1–15), `line` (a line deck), `deck` (residential decks 16–375), `hollow` (the Hollow's floor or air), `wall` (the terraced end walls), `spindle` (within ~75 m of the axis), `axle` (the axle halls), `beyond` (outside the drum: the glide hall, radiator layer, Windows, data-hall vaults).
- **deck / deckTo:** for `keel`, `line`, `deck` zones. deckTo for places spanning several decks, else null.
- **ring:** 1–9. Required for every zone except `beyond` and `axle` (use null there). For `wall`, ring is 1 for the front wall and 9 for the back wall. For `spindle`, the ring nearest the place.
- **hour:** 1–12 (Hare = 1 … Lark = 12). Use null only for things that run all the way round (a whole station ring, the jacket, the quay, the sunline).
- **r:** radius in metres from the axis, for `hollow` (1,500 for the floor; less for things in the air), `wall` (75–1,500), `spindle` (0–75), `outside` (3,000–3,060). Else null.
- **wall:** "front" or "back" for `wall`, `spindle` and `axle` zones (which end), else null.
- **at:** optional, `{ "deg": degrees spinward from the start of Hour One, "z": metres from the front cap }`. An exact spot instead of the one the atlas picks inside the place's Ring and Hour. Places that the 3D Sorrel game builds carry the spot where the game stands them, so the two agree; move both together.
- **who:** optional, for about half the entries. Ages must suit the band.
- **canon:** the doc a place comes from, only if it already exists there. Otherwise omit the key or null.
- Spread places over all twelve Hours and all nine Rings. Use real deck numbers in your band, not round numbers only.
- Write every entry as if for a guidebook a Sorreler would actually use: specific, lived-in, true to the physics.
