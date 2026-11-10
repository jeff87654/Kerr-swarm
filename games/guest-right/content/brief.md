# Builders' brief: Guest-Right

Guest-Right is a first-person game set in **Chervil**, an open nation drum on Herb Row in the Kerr swarm world bible (`docs/` at the repo root is canon). There is no violence in it. You are a twenty-year-old wanderer from the maker drum **Spelt**, most of the way round your wander year, with three nights on guest-right in Chervil. They happen to be the two days before Booking Day, and Booking Day itself. The job of the game is to make one drum feel like a place: lamplit streets you can walk, a hall you can eat in, a flat lent to you, shops, a school, baths, the Hollow with its far bank hanging overhead, and at the end the Long Flight down the axis in the dark.

Everything is built in code: geometry, textures, people, sound and music. The bar is high: it should look and feel like a finished commercial game with a stylised art direction, not a tech demo.

Read, in this order: this brief; `docs/open-drums.md` (Chervil, its customs, and the Booking Day scene this game stages); `docs/wander-year.md` (Marit's year, Pell, the cards home); `docs/eating-out.md`; then, for the setting's texture, `docs/daily-life.md`, `docs/raft-habitat.md`, `docs/ashgrove.md`, `docs/cuisine.md`, `docs/sorrel.md` (a neighbouring drum in full detail: Chervil shares its physics and its station rings, not its customs), `docs/drum-transport.md`, `docs/families.md` and `docs/glossary.md`.

## The drum in one page

- **A nation drum** is a spinning cylinder: radius 3,000 m at the rim, 3,750 m long, one turn every 110 s (ω = 0.0572 rad/s). About 200 million people (Chervil: 194,060,000, see the Ledger below). **Out is down; the middle is up.**
- **Deck n** is at radius r = 3,000 − 4(n − 1) m and weighs r ÷ 3,000 of rim weight. Decks are 4 m apart with ~3 m ceilings, so most of the drum is an indoor city of streets and arcades, lit by lamps. **Avenues run spinward, streets run along the axis.** Walking spinward you can see the floor curve up ahead of you.
- **Bands:** the Keel (decks 1–15, 1 g: food plant, water, freight, the nine station rings; nobody lives there), the Low decks (16–113: families, schools, inns), the Middle decks (114–301), the High decks (302–375: elders), and **the Hollow** (the open middle, 3 km across, floor at 0.5 g: lake, orchards, lawns, under a **sunline** along the axis; the far side hangs 3 km overhead, upside down and perfectly sharp, because filtered heliox has no haze).
- **The end walls** of the Hollow climb in thirty terraces toward the axis, lighter with every tier: the Third (a third of a g), the Quarter, the Tenth, the Twentieth. **The Spindle** is the axis itself: within 75 m of it you weigh under 3% of a g and fly in wing-sleeves. By day the sunline runs down its middle, so people fly only in the netted flying halls at its two ends. When the line is dark the whole Spindle opens.
- **Coriolis.** In the floor's own frame: going spinward makes you a little heavier, antispinward ("anti") lighter; a dropped cup lands ~2 cm anti; a throw along the axis flies true. Children learn: "axis flies true, spin sinks, anti floats." Spinball is the school game built on it.
- **Air is heliox:** sound runs 1.8× faster, so voices are bright and thin-edged and bare rooms ring (good rooms hang felt); wind instruments play ~10 semitones sharp for their size, so a flute is 1.2 m long. Heliox pulls heat from food ~4× faster than air, so **every dish comes under a lid**.
- **Money is energy.** A wallet is 21.6 kWh a day ("kays"). The commons (air, the free Mill table, lit streets, clinics, schools, cabs, the Glide) is for everyone. The luxuries are speed, light and new mass: new things cost ~25 kWh a kilogram, so everything is mended, remade and inherited, and a bright private garden is the plainest sign of wealth. Food is cheap; a tomato (0.5) is jewellery, an orchard apple (4.4) is a gift, gin (0.18) is too cheap to be one. An hour of someone's time is ~6 kWh in Chervil (twice Sorrel's).
- **Food** comes from the Mill (starch, sugar, fat, amino acids: the free table, with a bowl of the bitter Nine on it), the Vats (protein flour, dairy, mycelium steak, eggs without hens) and the Garden (lamp-lit produce: rare and dear). Kitchens hold and brew for free on the food plant's 65 °C waste-heat loop; searing costs power. The same loop heats the baths.
- **Getting about:** six-seat cabs, one party each, with gimballed cabins that lean against Coriolis, in lift cores every ~100 m (ten channels a core) and on line decks. Anywhere in the drum is within ~12 minutes. Between drums: **the Glide**, free, from the station rings: a car is let go at the quay, falls weightless for 140 s, and the next drum's rim catches it.
- **Light and the day:** homes at ~200 lux; streets lamp-lit; an atrium court may be lit like an overcast day. Home lamps ramp at 06:30. The sunline dawns 06:00–09:00, holds full sun 09:00–15:00, dusks to 18:00; then the lamp-night, which belongs to the machines. Lamps fade at 23:00.
- **People** live ~120 years, are proofread before birth, and look like all of humanity mixed. Names come from every language, worn smooth. Children are named for the dead whose shares they carry.

### Never break these

No sun, sky, weather or seasons inside a drum, and no stars visible from inside it. **No animals at all** (no birds, bees, fish, insects, pets; the one henhouse on Herb Row is in Tansy). No open fire, candles or smoke: electric hotplates, hand lamps. No currency but kWh. No villains, no weapons, no violence: problems are small and human. Robots are appliances, never characters. Minds are biological. Don't name real Earth religions, brands or places. Nobody in Chervil has seen the Lantern; almost nobody has seen a star (Chervil sends its eight-year-olds to a Window, as Sorrel does: Oona saw the River once, at eight).

## Chervil

All of this is canon (`docs/open-drums.md`, `docs/eating-out.md`, `docs/wander-year.md`) unless marked *new*.

- **An open drum, a hall drum:** "loud, crowded, fed by people". It runs 3% under par on purpose (**the Margin**), grants **guest-right** (any traveller may stay three nights in a Margin flat and eat at the halls), spends ~40% of its wallets on each other's time, and posts no price for a child. Sorrel thinks it lovely and a little pleased with itself. Lovage thinks it dim and charming. Rue's councillors come to its Ledger every Booking Day and take notes.
- **The Ledger** stands at every station ring: shares, people, the Margin, places, the year's births and deaths, guests tonight, and the names, each newborn beside the dead whose share they carry and each new householder beside the dead whose place they took. On Booking Day it reads 200,000,000 shares, 194,060,000 people, a Margin of 5,940,000, 90,000,000 places (2,673,000 held by the drum), 1,626,000 born and 1,617,000 died, and ~410,000 guests. Chervil's old Count board hangs beside it.
- **Cooked halls:** one long table a block, a paid cook and volunteers. Eating alone is possible and unusual. **Gin** is sold only in the halls, after six, where someone is always cooking.
- **Tables and aunts:** a child has a table: parents plus three or four adults who stood at the naming, called aunt whatever their sex.
- **The block court:** a block of ~3,000 meets once a week in its atrium to settle noise, heat, rooms and Hollow swaps, out loud and in minutes. It also gives the block's leave for a third child.
- **Light-painting:** the high art of open drums is the Hollow's dawn and dusk, three-hour sequences of colour on the sunline and the land, composed by lamp-painters and played once.
- **Visible mending:** the mend is shown, and a coat's seams tell its owners' story. **The long letter:** friends across the Shade are years away by light, so people write long, to be read once.
- **The calendar:** the Quiet (the day before Booking Day: no worlds, no messages; people sit in the halls and talk), Booking Day (the beam is booked, the Ledger is read, one question is voted on, and the Quiet's savings become a feast in every hall), the Long Flight (that night the sunline stays dark and the Spindle opens end to end; hundreds of thousands fly the axis with hand lamps till lamp-dawn), Knotnight, Homecoming, namings.
- **The ring counter** at every station ring: a free cup of Mill broth and a sticky rice ball. Chervil's comes with a sprig of whatever the hall cut that day.
- **Marit Vell's Hall**, "the Ring 2 hall": four hundred seats at one long table, a paid cook and eleven volunteers, nine of them over seventy. Thursday ramen (1.77). "You'll be seated next to someone. That's the point."
- **The Dawn Stand:** a coffee cart on the Hollow's back terraces, set up wherever the morning's painted dawn looks best. Cell-culture coffee 0.15, honeycomb steamed cake 0.30. "Ask whose dawn it is. The painter is often in the queue."

### The people the docs already have

- **Marit Vell (26)**, hall cook at the Ring 2 hall, four months back from her wander year. She holds her great-grandfather's place. Practical, quick, funnier than she lets on.
- **Jory**, her partner. Has books; has already measured her flat for them. Voted sun so the dawns would be longer for Oona's next one, and wouldn't say why.
- **Oona (81)**, one of Marit's aunts, a lamp-painter. This Booking Day's dawn is hers, a year in the making. She saw the River once, at eight, in a Window, and has tried to paint its brown-violet ever since. "In the middle," she says of her own dawn. "Next year I'll fix it."
- **Pell**, the baker at Spelt who keeps the crock room where wanderers leave a spoon of starter (off stage: he is the player's baker, and Marit's friend).

### The player

A wanderer of twenty from **Spelt** (a maker drum on Grain Row, home of the raft loaf), eleven legs into the year. Pell sent you with a spoon of this year's mother for Marit: "If any of your wanderers come through Chervil, send them to my table. We'll know the same baker." You are never named; people call you "wanderer", or "Spelt". You are a guest: curious, a little tired, good with your hands. You can't vote and you hold nothing here, and everyone feeds you anyway.

### The three days (*the staging is new; the Booking Day events are canon*)

- **Day one, a Thursday.** You arrive by glide at Station Ring 2 a little before ten. The guest desk signs you in and the draw gives you a Margin flat in **Candlewick**, the block straight above the station. Ramen at the long table at one. The afternoon and evening are yours.
- **Day two, the Quiet.** No worlds, no messages. The halls are full of people talking. The feast is being made ready, Oona is rehearsing her dawn on a model, the Hollow is open for the festival, and the block court sits in the evening.
- **Day three, Booking Day.** 06:00 Oona's dawn from the back terraces: first the brown-violet of the River, then rose, and for twenty minutes the far bank is gold while the near side is still dark. 08:30 the Ledger is read at Station Ring 2. 10:00 the booking arrives (flat, as it nearly always is) and the question is put: an extra hour of full sun in the Hollow, or a larger hall fund. 13:00 the feast: cultivated steak with herb butter, a salad cut generously for once, aged cheese, the Lovage sourdough everyone pretends Chervil makes, and an orchard apple cut crosswise for every two people, so everyone sees the star. 17:00 the vote: hall fund, by four points. 22:00 the Long Flight. 02:00 Oona on the elders' terrace with a glass of gin.
- **The fourth morning** you write your card home and go, or stay as long as you cook.

## The places the game builds (*names marked new are this game's*)

**Station Ring 2** (the Keel, decks 1–4, 1 g): the glide platform and its car bays; the Ledger hall with the Ledger and the old Count board; the ring counter; the guest desk; a Quaysides market lane; the Gate (quarantine, seen through glass); a lift lobby of cab berths.

**Candlewick** (*new*: a block of ~3,000 on decks 16–21, Ring Two, 0.98 g):
- **Wick Court**, its atrium: six decks tall, lit like an overcast day, ringed by planted terraces, where the block court sits and there is music most evenings. Its luminous ceiling is where Candlewick's lamp-painters try out their colours, so the court's light is never quite the same twice.
- **Ladle Row**, its avenue, running spinward past the hall. **Thread Street**, its street along the axis, where the menders are.
- **The hall** (Marit Vell's Hall): one room 124 m long with one table down it, which you can see curve up at both ends with the drum. An open kitchen at its middle.
- Shops: a greengrocer (glass cases, "the nearest thing to a jeweller's"), a bakery, a mender (visible mending), a dyer and tailor (colour weighs nothing: re-dyeing a coat for the festival costs ~0.1 kWh), a flute maker, Oona's lamp-painting studio (with a model Hollow and a tiny sunline for rehearsing dawns), a book room where long letters are read aloud (Jory's), a chair remaker, a toy library, a tea and coffee cart, a larder shop (crocks, ferments, cheese), a herb shop ("bring herbs, not gin"), a clinic.
- The baths (warm from the 65 °C loop; "the steam is where the drum's gossip lives"). The school, with a long hall for spinball. Two lift lobbies with stairs.
- Flats: the player's lent Margin flat on a terrace over the court; Marit's (her great-grandfather's place); Oona's; an old couple who let rooms; a family with children and aunts.

**The Hollow:** a glass lift pavilion among apple trees; the lake shore, a jetty and a robe house; orchard rows; lawns and a kite field; the festival green with a bandstand and long tables set out for Booking Day; the foot of the back wall and its lowest terraces (the Dawn Stand, the elders' terrace); the Third, where reels are danced at a third of a g; the Spindle lift; the back flying hall and wing-sleeve hire; the open Spindle on the night of the Long Flight. The whole floor can be walked.

## Voice (for every word a player reads)

- Plain, concrete, specific, warm, quietly funny. Short sentences. One exact detail beats three adjectives. The humour comes from physics and thrift.
- British spelling (colour, metre, grey, neighbour).
- **No em dashes or en dashes** (write number ranges out: "five to nine"). **No exclamation marks.** No rhetorical questions. No "not just X but Y". None of: testament to, tapestry, bustling, nestled, whispers of, symphony of, vibrant, hum of life, in a world where, delve, realm, beacon, labyrinthine, a dance of.
- People speak plainly, in translation: no modern Earth slang. They are kind without being soft. Chervil people ask where you've slept and whether you've eaten, in that order.
- Numbers are the docs' numbers. Don't invent physics; check it against the docs.
- New places, customs and people are allowed where the docs leave room. Keep them modest and plausible, and list every one in the game's README under "not canon".
