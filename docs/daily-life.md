# Daily life at 2 kW

*Design notes from a working session, Oct 2026. Builds on energy-budget.md (the line items), food-system.md and cuisine.md (food and its prices), habitat-design.md (the nation drum), full-swarm.md (life in the Shade), raft-transport.md (getting around) and matter-delivery.md (the cost of metal). "2 kW" means 2 kWe of delivered electricity per person, time-averaged, as in energy-budget.md. (If it meant light, a resident would get ~0.5 kWe, below the lean budget.) The resident lives in a nation drum on a raft in the Shade. Food uses cuisine.md's best-case prices, which suit a mature swarm. "The commons", "the wallet" and the culture notes are proposals. Travel revised Oct 2026 to raft-transport.md: ~1% of a car's kinetic energy lost per trip instead of 3%, free glides between neighbouring drums, and cyclers for long trips. How wallets are set, work, property and children are in economy.md. Revised again Oct 2026 for the 3 km nation drum (habitat-design.md, raft-habitat.md): cryocooling, the Hollow's sky, parks, cabs and the Glide's times change; the totals don't.*

## Summary
- **2 kWe is 48 kWh a day: a kWh every half hour.** That's two-thirds of the common budget (3.1 kWe) and twice the lean one (~1 kWe).
- **More than half the gap to the common budget is slack.** Express speeds (~0.4 kW, which cost time rather than comfort), planning-value food prices (~0.1) and the build-out's growth line (~0.1) can go. The real cuts are ~20% of compute, ~40% of manufacturing energy and ~20% of the hull's light and services.
- **Food is not where 2 kW bites.** The Vat table (sourdough, cheese, ramen, mycelium steak, wine) costs ~16% of the budget.
- **A proposed split:** a commons of ~1.1 kW per person (air, a Mill-table food credit, public light, services, upkeep, public compute) and a personal wallet of ~0.9 kW, 21.6 kWh a day, priced in kWh.
- **The luxuries are speed, light and mass.**
  - Speed: a trip costs speed squared, not distance. A cycler at 2 km/s crosses a million km in ~6 days for ~1 kWh; the express does it in 16 hours for ~220 kWh by tube car, ten days of a wallet (~110, five days, by cycler). The next drum is a free glide.
  - Light: a private 10 m² garden lit like an overcast day takes a fifth of a wallet.
  - Mass: new things cost ~25 kWh per kg, so a chair costs as much as fifty dinners.
- **Compute is the biggest line (0.8 kW) and the one people cut first.** Interactive compute can't run on the Lantern, which is 3 months to 1.4 years away by light. It runs in data halls on the raft.
- **Energy can't buy a child or a bigger flat.** Both are metal, which arrives only as fast as the hole grows.
- **For the swarm:** ~8.3 kW of light per person instead of 12.8. The same Lantern could feed ~2 × 10³³ people if the metal comes too; on today's metal they'd have ~55 m² of floor each instead of 100.

## The budget
kWe per person, time-averaged. Lean and Common are from energy-budget.md (food at planning values; travel as its vactrain at 3%).

| | Lean | **2 kW** | Common |
|---|---|---|---|
| **In the hull** | | | |
| Food, air & water | 0.34 | **0.33** | 0.45 |
| Lighting | 0.05 | **0.12** | 0.15 |
| Homes, public services & robots | 0.10 | **0.17** | 0.20 |
| Local repair & fabrication | 0.03 | **0.06** | 0.08 |
| Personal devices & edge compute | 0.02 | **0.04** | 0.05 |
| Fans & coolant pumps | 0.03 | **0.04** | 0.05 |
| Shield cryocooling | 0.02 | **0.02** | 0.02 |
| Lifts & in-drum trams | 0.01 | **0.02** | 0.02 |
| **Hull subtotal** | **0.60** | **0.80** | **1.02** |
| **On the raft** | | | |
| Travel | 0.12 | **0.10** | 0.48 |
| **Remote** | | | |
| Industry & recycling | 0.15 | **0.29** | 0.50 |
| Growth | 0 | **0.01** | 0.10 |
| Compute | 0.10 | **0.80** | 1.00 |
| **Total** | **0.96** | **2.00** | **3.09** |
| kWh per day | 23 | **48** | 74 |

- **Food:** the same diet as common, at best-case prices. Vat-table days, Mill days and feasts average ~7.9 kWh a day. At planning values the line is 0.45 and compute drops to 0.68.
- **Lighting:** the Hollow's sky holds full sun for fewer hours, and there are fewer bright parks (see Light).
- **Travel:** glides, tubes and cyclers at raft-transport.md's ~1% loss. At 0.10 kW it buys about four times the trips it did at 3%, and far more than the common budget's express pattern (see Getting around).
- **Industry:** ~100 kg remade per person per year, against ~134 kg (2%) in the common budget.
- **Growth:** the mature swarm needs only a few watts; the common budget's 0.10 covered the build-out.
- **Compute:** 0.50 on the raft (0.40 personal, 0.10 public services) and 0.30 on the Lantern.
- The hull's ~0.8 kW of heat needs ~2.0 m² of one-sided radiator per person in the Shade (2.5 in the common budget).
- **Drum size moves a few lines.** Against a 2 km drum, the 3 km nation drum saves ~8 W of cryocooling and ~17 W of Hollow sky per person (~11 W because its Hollow is a third smaller per person, ~6 W because the sunline now stops short of the end walls; raft-habitat.md), and its cabs need ~3–5 W more (drum-transport.md). So 0.01 kW moves from cryocooling to cabs, and the Hollow's saving goes to parks.

## The commons and the wallet (proposal)
Two layers. The commons is what the drum and raft run for everyone. The wallet is what each resident spends as they like, counted in kWh. Prices are energy.

| Commons | kW |
|---|---|
| Food credit: a Mill-table day, incl. air and water loops and kitchens | 0.23 |
| Public compute: raft services 0.10, Lantern batch work 0.30 | 0.40 |
| Public services & robots: schools, clinics, shops, offices, maintenance | 0.12 |
| Remaking infrastructure: decks, ducts, raft truss, rectennas (~40 kg/yr) | 0.12 |
| Public lighting: the Hollow's sky, parks, workplaces, corridors | 0.10 |
| Infrastructure repair | 0.04 |
| Fans & coolant pumps | 0.04 |
| Shield cryocooling | 0.02 |
| Lifts & in-drum trams | 0.02 |
| Growth | 0.01 |
| **Commons** | **1.10** |

| Wallet | kW | kWh/day | Share |
|---|---|---|---|
| Personal compute (raft data halls) | 0.40 | 9.6 | 44% |
| New things (~60 kg/yr) | 0.17 | 4.1 | 19% |
| Food beyond the Mill-table credit | 0.10 | 2.4 | 11% |
| Travel | 0.10 | 2.4 | 11% |
| Appliances & household robots | 0.05 | 1.2 | 6% |
| Personal devices | 0.04 | 1.0 | 4% |
| Home lighting | 0.02 | 0.5 | 2% |
| Mending & custom fabrication | 0.02 | 0.5 | 2% |
| **Wallet** | **0.90** | **21.6** | |

- **The commons alone carries ~1.1 kW per person, more than the whole lean budget.** A resident with an empty wallet eats the Mill table, walks lit decks, uses the clinics and schools, and rides the cabs and the Glide. They have no personal compute, no long trips and no new things.
- **"Mean" matters.** The commons is the same for everyone, so any inequality lives in the wallet. economy.md proposes an equal beam dividend, topped up by work paid from other people's wallets.
- **The year is the unit.** Beams are booked a year ahead (full-swarm.md), so a raft knows its energy for the year, and a wallet is naturally an annual allotment. Saving works by trade: one resident's banked kWh are another's spending.

## A day on the meter
A weekday for a resident who works in the drum's strain library (food-system.md). The meals are cuisine.md's Vat-table day. The air is heliox, so voices ring high and rooms run warm (habitat-design.md).

| Time | What happens | kWh |
|---|---|---|
| 06:30 | Lamps ramp to morning; twenty minutes by a 2,500-lux light panel | 0.01 |
| 06:45 | A hot shower. The heat is free (the vats' 65 °C waste-heat loop); pumping and cleaning the water cost a little | ~0.05 |
| 07:00 | Breakfast: sourdough toast, cultured butter, berry jam, soft-scrambled vat egg, coffee with milk | 1.26 |
| 07:30 | Cab down to the rim and into a glide car. The quay lets it go; it flies for 140 seconds, weightless, and the next drum's rim catches it. Cab in. About nine minutes door to door | ~0 |
| 08:00 | Work: tending starter lines and phage-resistant stocks. The workplace's light, robots and compute are commons | — |
| 12:00 | Lunch: shoyu ramen with protein-flour chashu and cultivated pork fat | 1.77 |
| 15:30 | Aged cheese on crackers, dark chocolate, black tea | 0.62 |
| 16:30 | Glide home, then an hour on the inner deck at half a g, under the Hollow's sky as it eases toward evening | ~0 |
| 18:30 | Dinner: mycelium steak basted with butter and beef fat, frites, béarnaise, a salad with cherry tomatoes, a glass of wine, crème caramel | 2.48 |
| 20:00 | Two hours in a shared world with friends a few thousand km away, a hundredth of a second by light | allowance |
| 21:30 | A load of laundry | ~0.2 |
| 23:00 | Lamps dim. The raft's batch work and fabrication run harder through the lamp-night | — |

- **Food:** the meals come to 6.13 kWh; with waste, air loops and kitchens, 7.75. The commons' credit covers 5.5, so the wallet pays 2.25.
- **Home:** lighting ~0.5, appliances and the cleaning robot ~1.2, devices ~1.0.
- **Personal compute:** 9.6 kWh. The allowance runs all day: assistant, tutor, the evening's world.
- **Travel:** ~0. The Glide is free.
- **The Hollow:** an hour there every day is ~9× an equal share (economy.md). This resident lives on a high deck, or buys other people's Hollow hours.
- **Spent from the wallet:** ~14.5 of 21.6 kWh. The other ~7 goes to the travel and goods accounts, for a trip or a new jacket.

## Prices
For scale, the whole 2-kW budget uses a kWh every half hour, and the wallet a little under a kWh an hour. Food is at cuisine.md's best case; travel at raft-transport.md's ~1% loss.

| Item | kWh |
|---|---|
| A glide to the next drum, 140 seconds | ~0 |
| Herbs from the pot (5 g) | 0.03 |
| Boiling a liter from the 65 °C tap | 0.045 |
| A cup of cell-culture coffee | 0.15 |
| An evening of home light (5 h) | 0.16 |
| A standard drink of gin | 0.18 |
| 1,000 km in 30 minutes | 0.2 |
| A load of laundry | ~0.2 |
| A pint of beer | 0.38 |
| A tomato | 0.50 |
| A side salad | 0.59 |
| A bowl of noodles in broth | 0.96 |
| A cycler across a million km (6 days at 2 km/s) | 1.1 |
| 5,000 km in an hour | 1.5 |
| A bowl of ramen | 1.77 |
| A Vat-table dinner | 2.48 |
| A cultivated steak (200 g) | 2.91 |
| An orchard apple | 4.4 |
| A new shirt (0.2 kg) | 5 |
| 1,000 km flat out (11 minutes) | 5.5 |
| A day of personal compute (typical) | 9.6 |
| A new pair of shoes (0.8 kg) | 20 |
| An express leg (20 km/s), by cycler | 111 |
| A new chair (5 kg) | 125 |
| An express leg (20 km/s), by tube car | 222 |
| A new sofa (40 kg) | 1,000 |
| A new person's metal | 7–15 billion |

An orchard apple, a new shirt and 1,000 km flat out cost about the same. A chair costs fifty dinners. An express leg costs ten days of a wallet, or five by cycler.

## Light
- **Lighting is only 6% of the budget, but it decides whether a place feels rich or poor.** At 250 lm/W, lighting a square meter to overcast-day brightness (10,000 lux) for 12 hours a day costs ~20 W.
- **Interiors, ~45 W:** homes at ~200 lux (~20 W per person, from the wallet), workplaces and corridors (~25 W, commons). Decks are 4 m apart, so most rooms are low and lamp-lit, like the inside of a very large building.
- **The Hollow's sky, ~22 W:** the inner deck is the drum's only open sky, 0.18 m² per person. At 2 kW it holds full-sun brightness (100,000 lux) for ~6 hours around midday and ramps over 3 hours either side. The common budget gives it 12 full hours (~30 W). In a 2 km drum, with 0.27 m² each, the same 6 hours took ~33–39 W.
- **Parks, ~53 W:** ~2.6 m² of overcast-day park per person, or ten times the area at 1,000 lux: what the smaller Hollow saves goes here. A neighbourhood of 1,000 people can have one bright square of ~2,600 m² or a dim wood of ~2.6 ha. Which one is a civic choice.
- **Light is the luxury good.** A private 10 m² garden at 10,000 lux for 12 hours costs 4.8 kWh a day, ~22% of a wallet. A bright home is the plainest sign of wealth.
- **Light is also health.** Bright mornings set the body clock, and a session at a few thousand lux costs ~0.01 kWh, so the commons can afford them for everyone.
- Herbs and orchard trees in the parks get their light free (food-system.md).

## Food
- **Food is ~16% of the budget** at best-case prices: a Vat-table day is 7.75 kWh (323 W), a Mill-table day 5.5 (230 W) (cuisine.md).
- **The commons' food credit is a Mill-table day:** jook, glass noodles, starch jellies, the Nine, a Mill lager. Nobody goes hungry.
- **The Vat table costs 2.25 kWh a day more,** ~10% of a wallet. Most residents eat it most days.
- **Treats, as a share of a day's wallet:** a cultivated steak 13%, a bottle of gin 13%, an orchard apple 20%. An apple a day is an indulgence; an apple brought to dinner is a gift.
- Inverted scarcity holds (food-system.md): pastry is cheap and salad a treat, and spirits are nearly free (the gin problem).

## Getting around
- **Speed, not distance, is the price.** raft-transport.md loses ~1% of a car's peak kinetic energy per trip (energy-budget.md's 3% is the conservative case). Once at cruise a car coasts for free, so for a given top speed a trip costs the same at any length.
- **Three ways to go** (raft-transport.md):
  - **The Glide.** Drums let cars go from their rims and catch them on neighbours' rims. It's free, about 140 seconds per drum.
  - **Tube cars** at 1 g, up to the 20 km/s express, for trips of minutes to a day. ~400 kg per seat.
  - **Cyclers,** trains that never stop. You board and leave by capsule, so only ~200 kg is sped up per traveller: half a tube car's price.

| Top speed | Tube car, kWh per trip | Cycler, kWh per trip | Distance per day at cruise |
|---|---|---|---|
| 0.17 km/s (Glide) | 0 | — | 15,000 km |
| 1 km/s | 0.56 | 0.28 | 86,000 km |
| 2 km/s | 2.2 | 1.1 | 173,000 km |
| 5 km/s | 14 | 7 | 430,000 km |
| 10 km/s | 56 | 28 | 860,000 km |
| 20 km/s (express) | 222 | 111 | 1.7 M km |
| 40 km/s | 889 | 444 | 3.5 M km |

- **Short trips are free or nearly so.** The next drum, ~24 km away, is 140 seconds of free flight and ~8½ minutes door to door. ~1.6 × 10¹⁰ people live within 20 minutes by Glide and ~2 × 10¹¹ within an hour. Inside the drum, ~200 M people are within ~12 minutes by cab. Flat out at 1 g, 1,000 km takes 11 minutes and ~5.5 kWh, or 30 minutes and ~0.2.
- **Long trips trade days for kWh.** A million km takes 6 days at 2 km/s (~1 kWh by cycler), 2.3 days at 5 km/s (~7) or 16 hours by express (~110 by cycler, ~220 by tube car).
- **A 2-kW travel year (~840 kWh, ~0.1 kW)** buys about four times what it did at 3%:
  - a round trip to a neighbouring drum most days, by Glide (free, but booked at the peak, when it has seats for ~45% of residents a day);
  - a weekly round trip of 5,000 km, an hour each way, by tube (~160);
  - two long round trips a year at 7 km/s, by cycler (~55);
  - a voyage across a 0.1 AU raft and back each year, nine days each way at 20 km/s by cycler (~220);
  - a monthly round trip of 1,000 km flat out (~130);
  - ~280 kWh to spare, or two more express legs by cycler.
  - The first three alone, the old pattern, now cost ~210.
- **The common budget's travel line (0.48 kW) assumed express schedules at 3%.** At 1% the same trips cost ~0.16 kW, or ~0.02 kW at economy speeds.
- **Express is still the splurge, but a reachable one.** One express leg by tube car (~220 kWh) is ten days of a wallet, or ~18 days without personal compute; by cycler it's half that. A 40 km/s leg by cycler (~440) is three weeks.
- **Reach.** At the raft's ~3 m² per person (full-swarm.md), ~3 × 10⁹ people live within 50 km and ~3 × 10¹⁶ within a day at 2 km/s. People don't run out of places to go; they run out of days.
- **Cyclers are a way of life.** The slow lines never stop: you board by capsule and live aboard for days or weeks. Cheap and sociable, like an ocean crossing.
- Inside the drum, the cabs are commons, and so is the Glide, which costs nothing to run. Trips to other drums leave from the rim, which is nearer than the axis for everyone. Between rafts, which pass at 100–300 km/s, almost nobody travels.

## Things
- **Industry & recycling at 0.29 kW remakes ~100 kg per person per year,** at ~90 MJ/kg: ~1.5% of each person's 6.7 t, against the common budget's 2% at 110 MJ/kg. The average kilogram stays in use ~65 years instead of ~50.
  - About 40 kg is infrastructure (decks, ducts, raft truss, rectennas) and 60 kg personal goods.
- **Mass is the price: ~25 kWh per kg.** That's a blended figure; spun cellulose is cheaper, electronics and nanocarbon dearer. A shirt is 5 kWh, shoes 20, a chair 125 (fifty dinners) and a sofa 1,000 (46 days of a wallet).
- **So things are light, durable, mended and inherited.** Mending runs on the cheap local-fabrication line. As with food, energy counts grams: dye, pattern and finish cost almost nothing, so fashion lives in surfaces and alterations rather than new garments.
- **For scale:** Americans discarded ~36 kg of clothing and footwear and ~34 kg of furniture per person in 2018 (EPA). The 2-kW resident remakes about that much a year, but it also has to cover tools, toys, devices and kitchenware.

## Compute
- **Compute is the biggest line: 0.8 kW, 40% of the budget, and the swing line.** It's ~13× what US data centres drew per person in 2024 (energy-budget.md).
- **Interactive compute has to run on the raft.** The Lantern is 0.08–0.43 pc from the Shade: 3 months to 1.4 years each way by light.
  - Assistants, tutors, games, shared worlds, medical support and the raft's own services run in data halls on the raft, on beamed power (0.50 kW per person here).
  - The Lantern keeps work that can wait years: research, archives and long simulations (0.30).
- **full-swarm.md and energy-budget.md now use this split** for the common budget too: half its compute on the rafts. Each kWe moved to a raft costs ~1.2 kW more light, for beam losses, so the common budget needs ~12.8 kW of light per person instead of ~12.2, and the same Lantern feeds ~5% fewer people (~1.27 × 10³³).
- **Personal compute (0.40 kW, 9.6 kWh a day) is 44% of a wallet,** and the first thing people cut to afford something. Going dark for about three weeks pays for an express leg by tube car, or twelve days by cycler.
- **Real-time reach.** Talk without noticeable lag (a tenth of a second each way) reaches everyone within ~30,000 km, ~10¹⁵ people. Calls across a raft take seconds to minutes, between rafts minutes to hours, across the Shade years.
- **Machine country is a letter away.** Minds stay biological in this setting (governance.md), so nobody lives on the Lantern. A job sent there comes back months to years later, and its rules are written and audited at the same remove.

## What energy can't buy
- **A child.** A new person needs 6.7 t of new metal, which costs ~25–55 PJ to gather (matter-delivery.md): 400,000–900,000 years of a 2-kW budget. Metal arrives only as fast as the hole grows (~10⁻⁹ a year; full-swarm.md), so births match deaths: about two children per couple, on average. Every new household lives in an older one, remade. How shares for children are allotted is in economy.md.
- **Floor space.** It's metal too, ~50 kg per m² (habitat-design.md). The baseline drum gives 100 m² per person; the crowded variant below gives ~55.

## Rhythm
- **No night, no season.** The Shade's beam is steady, and the lamps keep a 24-hour day because bodies want one (full-swarm.md).
- **The lamp-night belongs to the machines.** Lights, kitchens and evening compute peak in the habitat's day. Flywheels and the methanol tank farm cover the hours, and the raft's batch work, fabrication runs and slower vat lines take up the night.
- **The Dark.** If the beam is cut, the drum drops to ~50–100 W per person of air handling on its survival reserve, a ~96% cut, for ~55 days (food-system.md). Larders, herb pots and reserves are household virtues as well as public ones.
  - The Glide keeps running, so neighbouring drums can pool food and parts. A raft whose cyclers run fast can brake them for months more of air and food (raft-transport.md).
  - A raft with glow sails, away from the disk plane, can live on the Mill table for as long as the cut lasts, on heat engines run by the Lantern's own glow (governance.md).

## Culture (proposals)
- **Luxury is speed, light and new mass; food isn't luxury.** The express fare is the signature splurge, a bright private garden the signature display, and new furniture a life-event gift (a marriage, a birth).
- **Thrift has a shape.** The virtues are mending, slow travel, lids on pots and dark weeks, not small portions. "Going dark" (shutting off one's worlds to save for something) may become a ritual fast.
- **Heirlooms are normal.** At ~65 years per kilogram, much of what a person owns was made before they were born.
- **The time-rich travel far.** With trips priced by speed, cyclers, slow lines and week-long journeys become social institutions.
- **Gifts are measured in kWh, whether or not anyone says so.** An apple brought to dinner is generous; a bottle of gin is not.

## Stretching and splurging
| Choice | Effect on a 21.6 kWh/day wallet |
|---|---|
| Mill-table day instead of Vat table | Saves 2.25 kWh (10%) |
| A dark day (no personal compute) | Saves 9.6 kWh (44%) |
| Slow cycler instead of express tube car, a million km | Saves ~220 kWh (ten days) |
| An orchard apple every day | 4.4 kWh a day (20%) |
| A private 10 m² garden at overcast brightness | 4.8 kWh a day (22%) |
| An express leg, tube car / cycler | 222 / 111 kWh (10 / 5 days) |
| A sofa | 1,000 kWh (46 days) |

## What 2 kW means for the swarm
- **Light per person is ~8.3 kW,** down from ~12.8 at the common budget: 0.30 kWe of Lantern compute, plus 1.70 kWe beamed at 75% with a 3% margin, at the Lantern's 32.4% on the 98% of light it catches.
- There are two ways to get there:
  - **More people under the same Lantern:** ~2 × 10³³ (×1.54). At 6.7 t each they need ~1.5× the metal. On the same metal each gets ~4.4 t, or ~55 m² of floor instead of 100, so the crowded 2-kW world is also a smaller-flat world.
  - **The same people under a dimmer hole:** a feed at ~20% of Eddington. A Lantern with infrared-mirror inner walls still floats there; black walls need ~30% (full-swarm.md).
- Hull radiators shrink to ~2.0 m² per person (one-sided), from 2.5.
- Ring era (10 M☉, 22% conversion, 10% firm-load overhead): ~9.5 kW of light per person instead of ~15.

## Earth anchors
- **The 2000-watt society.** ETH Zurich's 1998 vision caps each person at 2,000 W of continuous primary energy, ~17,500 kWh a year: the same 48 kWh a day. Switzerland was last there around 1960. It now uses ~4,700 W per person, and the world averages ~2,500 W.
- **But that's primary energy.** Only about a third reaches end users: in 2024 the US turned 9.3 kW per person into ~3.2 kW of energy services (LLNL, energy-budget.md). 2 kWe delivered as electricity is roughly three times the useful energy of the Swiss target. The swarm must make its food and air from it, which Earth gets from sunlight, but it has no heating, furnaces or cars to run.
- **Compute:** 0.8 kW per person is ~13× what US data centres drew per person in 2024.
- **Goods:** ~60 kg a year of new personal goods, against ~70 kg of clothing, footwear and furniture discarded per American in 2018 (EPA).

## Open questions
- How low a wallet can go, and what its median is. economy.md proposes an equal dividend plus earnings; with a mean of 2 kW, the spread depends on how much people spend on each other's time.
- Which 2-kW world: crowded (more people, ~55 m² floors) or dimmer (same people, ~20% of Eddington)?
- What people do for work when production is automated: economy.md's answer is care, teaching, kitchens, craft, stewardship, governance and culture, paid from other people's wallets.
- Lifespans: longer lives mean fewer births per year at the same replacement rate (economy.md tabulates it).
- How heirlooms and going dark shape status.
- With ~1.6 × 10¹⁰ people a free 20-minute glide away, do drums specialise: home in one, work or schooling in the next? economy.md: slowly, over centuries, since floor costs ~1,250 kWh a m² to rebuild.

## Sources
- 2000-Watt Society (official site): https://www.2000watt.swiss/en/english.html
- Wikipedia, 2000-watt society: https://en.wikipedia.org/wiki/2000-watt_society
- US EPA, durable goods: furniture and furnishings, 2018: https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/durable-goods-product-specific-data
- US EPA, nondurable goods: clothing and footwear, 2018: https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/nondurable-goods-product-specific-data
- LLNL energy flow chart and IEA data-centre figures: see energy-budget.md.
