# Drum transport: getting around inside a drum

*Design proposal from a working session, Oct 2026. Travel inside one nation drum (habitat-design.md, raft-habitat.md): between decks, around and along them, up to the Hollow, and down to the station rings, where raft-transport.md's glide cars take over. It replaces raft-habitat.md's sketch (lifts at ~5 m/s, avenue trams at 8 m/s). Energy is in W per person, time-averaged, against the 0.02 kW line for "lifts & in-drum trams" in energy-budget.md and daily-life.md (0.01 kW before the 3 km drum). The names (the Lattice, cabs, line decks, loops, cross-lines, collectors) are proposals. Revised Oct 2026: sized for a few journeys per person per day (Capacity). Cabs now carry one party each, so they're smaller and run in platoons, and the energy figures are revised. Revised again Oct 2026 for the 3 km nation drum (~200 M people), which is now the baseline; a 2 km drum's figures are given where they help. Revised Oct 29, 2026 after a consistency audit.*

## Summary
- **Inside a drum, speed is limited by riders, not by power.** Riding from the Keel up to mid-drum stores ~0.45 MJ in a rider's height (a 660 m climb on Earth), and the ride back down returns it. What's actually spent is drag, conversion losses and the cabs' own lights: **~7–12 W per person** depending on the day, inside the 20 W the budget allows.
- **The lift cap goes away.** Coriolis pushing riders sideways against a fixed floor caps lifts at ~6 m/s (~5 in a 2 km drum). Hang the cabin on a gimbal and the push becomes a tilt: at 20 m/s, 13° at the Keel to ~31° near the Hollow, with riders 3–10% heavier. Earth's fastest lift already runs at 21 m/s; the tilt is the only new part.
- **Weight is the limit a tilt can't remove.** Moving spinward makes riders heavier and antispinward lighter, by (1 ± speed ÷ deck speed)². Keeping riders between 0.3 and 1.2 g sets speed limits that depend on direction and depth: spinward ~18 m/s near the Keel and 30 near the Hollow, antispinward 30 near the Keel and ~21 near the Hollow. Along the axis, nothing changes.
- **The Lattice: one cab, door to door.**
  - Cabs (6 seats, one party each, gimballed cabins) run radially in raft-habitat.md's lift cores and horizontally in tubes on fifteen **line decks**, one in every 25 decks. On the trunks they couple into platoons that never stop.
  - Cabs stop only in berths off the line, so every ride is nonstop. Nobody changes vehicles inside the drum. Leaving it takes one change, from cab to glide car across a platform.
  - The tubes and shafts hold helium, not heliox: 40% of the drag, and nothing can burn in them.
- **Times, door to door, between random points:** ~6 minutes on average and ~12 at worst, against ~30 minutes for the sketch (~20 by bike).
  - A station platform is ~2 minutes from an average flat (~4½ by fixed-floor lift).
  - The next drum is ~8½ minutes door to door (~13 by fixed-floor lift). On raft-transport.md's reach formula, ~1.6 × 10¹⁰ people live within 20 minutes (~1.1 × 10¹⁰ on a raft of 2 km drums).
- **Capacity:** a few journeys a person a day comes to ~90 M rides an hour per drum at the peak, more than twice a day's traffic on all of Greater Tokyo's railways. Most stay inside: the Glide carries a daily round trip for ~45% of residents. It takes ten channels in every lift core, two pairs of loops along every row of cores, platoons of up to 40 cabs, station rings four decks deep and ~6–9 M cabs. All of it fits in ~11 m² of floor and ~60 kg of metal per person.
- **Energy:** a trip within the drum costs ~50 Wh per rider, a trip to a station ~12 Wh. A design day (~5 rides, most of them inside) comes to **~7 W per person**; a big day of ~7 rides, ~12. About three-quarters is drag.
  - **A bigger drum costs more here.** The Glide is free and cabs aren't, and in a 3 km drum more trips stay inside and they're longer. A 2 km drum's design day costs ~4 W.
  - **Real trips are shorter.** If destinations fall off over ~2 km, as a city's do, a design day costs ~5 W.
  - **30 m/s on the tubes is the knee.** 40 m/s would save ~20 seconds a trip and cost ~40% more energy.
  - **The design choices matter more than the speed.** Cramped tubes of heliox, still gas and solo cabs would use ~130 W per person at the same speeds. Roomy tubes, helium and gas that moves with the traffic each halve it, and platoons take off another 40%.
- **Riding is cheaper than walking.** A kilometre on foot burns ~30 kcal of food that took ~0.1 kWh to make. A cab spends ~10 Wh per rider-km.

## Setting
- **The drum** (habitat-design.md, raft-habitat.md): rim 3 km at 1 g, 3.75 km long, 376 decks every 4 m down to 1.5 km (0.5 g), ~200 M people. It turns once every 110 s, so its decks move at 86–172 m/s.
- **The air** is heliox at ~101 kPa, 0.40 kg/m³, a third the density of Earth's. Pressure rises ~4.4 kPa from the Hollow floor to the rim, at most ~4 Pa per metre (a third of Earth's rate), so fast lifts don't hurt ears.
- **Distances.** Between two random points the mean separation is ~480 m radially, ~3.6 km around and ~1.25 km along the axis. Crossing the drum is like crossing a city centre, except that it has 376 floors.
- **The three directions behave differently in a spinning drum:**
  - **Along the axis,** nothing changes. Speed is limited only by acceleration and drag.
  - **Radially,** Coriolis pushes riders sideways at 2ωv: 0.06 g at 5 m/s, 0.23 g at 20 m/s. Moving out releases centrifugal potential energy and moving in stores it: 6.4 kJ/kg from the Keel to mid-drum, 11.0 to the Hollow floor.
  - **Around,** weight scales as (1 ± u ÷ v_deck)², where u is speed along the deck and v_deck = ωr is 86–172 m/s.
- **Rules adopted.** Acceleration up to 1.5 m/s² (0.15 g, like fast lifts and metros), jerk up to 1.5 m/s³ (gentler where a cabin has to tilt fast), felt weight 0.3–1.2 g, tilts no faster than a tilting train's (~3–5° a second).

## The Lattice
### Cabs
- **One vehicle for every leg.** A cab moves radially in a shaft and horizontally in a tube without turning round, switching guideways at junctions, the way TK Elevator's MULTI cars move up and sideways on linear motors.
  - 6 seats, or room for a wheelchair, a pram or a cart; ~300 kg empty, ~3.5 m long, 2 m wide and 2.1 m tall, streamlined at both ends and faired top and bottom for the shafts.
  - Linear motors in the guideway drive them, and magnets guide them: no ropes, wheels or engines on board.
- **The cabin swings inside the cab,** on an actively driven two-axis gimbal. It tilts against sideways forces: Coriolis on radial runs, curves at junctions. Fore-and-aft acceleration (0.15 g) is felt as it is in a metro.
  - **It tilts about three-quarters of the way.** That leaves riders a ~0.06 g sideways push, less than the ~0.07 g that caps fixed-floor lifts. Tilting trains compensate 50–70% for the same reason: full compensation makes more riders sick.
  - On radial runs the tilt builds over the ~13 s it takes to reach speed, 1–2° a second.
- **One party per cab.** You call a cab at your lobby, and it takes you and whoever you're with, nobody else. At the peak a lobby sees a rider every ~45 s and a cab about once a minute, too few to share cabs without waiting (see Capacity), so cabs average ~1.4 riders, as Earth's cars do.
- **Platoons.** On the trunks (express shafts, loops and cross-lines), cabs close up nose to tail ~1 m apart and brake together, like the cars of a train. Platoons never stop: cabs join and leave them on the move at junctions.
- **Berths off the line.** Cabs stop only at your lobby, in a berth beside the shaft or tube, so through traffic never waits. A cab usually waits in the berth already, so the wait is ~15 s or less.
- **Sealed.** Cabs carry their own heliox, and their doors seal against the berth doors. A full cab's air lasts about an hour before CO₂ builds up; cabs carry scrubbers and oxygen hoods.
  - Cabs control their own pressure, as Earth's fastest lifts do. A ride from the Keel to the Hollow floor spans ~4.4 kPa.

### Lift cores
- **As raft-habitat.md:** a core every ~100 m, running through all 376 decks; ~5,200 cores of ~38,000 people each.
- **Ten channels per core.** In each direction, two express channels and three collectors.
  - **Express channels** carry platoons of up to 10 cabs at 20 m/s and never stop between line decks, the Keel and the Hollow.
  - **Collectors** run beside them. Every lobby's berths open off them, and cabs speed up and slow down there, between berths, express platoons and line decks.
  - Each in–out pair is joined at its top and bottom, so its gas circulates as a closed loop (see Energy).
  - Internal trips add short legs: routing often climbs past the nearest line deck to a higher one, so the average radial leg is ~260 m.
- **20 m/s at 0.15 g.** That's the knee: a full 1,500 m ride takes 89 s at 20 m/s and 71 at 30, but cabs spend most rides speeding up and slowing down.
  - From mid-drum to the Keel (750 m) takes 52 s, a little more than Guangzhou's record lift takes for 440 m.
  - The tilt rule that sets a seventh of rim speed (raft-habitat.md) would allow 25 m/s here. It saves ~3 s on an average ride for ~7% more energy.
- **Coriolis at 20 m/s** would tilt a fully compensating cabin 13° at the Keel, 17° at mid-drum and 25° near the Hollow floor, with riders 1.03×, 1.05× and 1.10× their local weight.
  - The steepest moment is the start of braking on the way up to the High decks, ~130 m below the Hollow floor, where braking takes 0.15 g off weight but not off Coriolis: ~31° with full compensation, ~24° at 75%. Cabs ease into that braking over ~3 s, adding a second or two to the ride, so the cabin tilts no faster than ~3° a second.
  - Speeding up or slowing down adds or takes away 0.15 g of weight, as in a lift. Felt weight stays within ~0.35–1.2 g.
- **Pressure** changes by at most ~80 Pa a second at 20 m/s, a third of what Earth's fastest lifts handle with pressure-controlled cars.

### Line decks
- **Fifteen line decks, one in the middle of each 25-deck band, each two decks deep** (13–14, 38–39 … 363–364; the first is in the Keel). Loops run on one level and cross-lines on the other, so the tubes cross on bridges. No flat is more than 12 decks (48 m) from one.
- **Tubes run along every row and column of cores:**
  - **Loops** go round the drum, two side by side along every row of cores, 74 per line deck, each a pair of one-way tubes (Capacity).
  - **Cross-lines** run along the axis, one pair per column of cores. There are 141 columns on every deck, ~130 m apart on deck 13 and ~70 m on deck 363, as the cores converge.
  - Tubes are low and wide (~3 × 5 m), so a cab blocks less than a third of one. Tubes and the interchanges where they meet the cores take about a third of a line deck. The rest is cab depots, workshops and freight sorting; nobody lives on a line deck.
  - Line decks take ~8% of the drum's floor (~8 m² per person), and the cores ~3.2 m². Both fit inside the 25 m² per person raft-habitat.md gives to streets and lift lobbies.
- **Cross-lines run at 30 m/s.** Along the axis, only drag argues for less.
- **Loops have posted limits that depend on direction and depth** (see Speed limits), set by the 0.3–1.2 g band and a 30 m/s cap.
- **Spinward runs high, antispinward runs low.** Near the Keel a spinward cab is held to 18 m/s; near the Hollow an antispinward one is held to 21. In between, from line deck 163 to 288, both directions run at 30. Routing picks the quickest line deck for the direction, and at the peak spreads trips onto neighbouring line decks so no loop overfills (see Capacity).
- **Junctions** turn cabs between loops and cross-lines at ~10 m/s on curves of ~70 m radius. A turn costs ~20 s.
- **Where loops make riders light** (antispinward on the high line decks, down to 0.3 g), 0.15 g of braking would feel like a 27° lean. There cabs accelerate and brake at half rate, and the cabin pitches part of the way.

### The Keel
- **Every core runs down to the rim deck.** There, cabs leave the shaft and sidestep along the axis to the nearest station ring (raft-habitat.md: ~9 along the drum). The sidestep is at most ~210 m, ~17 s on average.
- **Each station ring is a station four decks deep** round the whole drum: glide trains along the rim deck, cab berths on the three decks above (see Capacity).
- **Departures:** riders cross from cab to glide car, which passes out through the jacket and moat to a quay cradle (raft-transport.md).
- **Arrivals:** the quay's cradles can carry an arriving car round to the platform nearest most of its riders' homes before bringing it in.
- **Glide cars stay on the rim.** Each seat carries ~5 t of sealed water against X-rays (raft-transport.md), useless inside the drum. Lifting it through the decks would need shafts built for dozens of times a cab's load per seat.

### The Hollow and the Spindle
- **One core in four rises through the Hollow's floor as a pavilion,** ~1,300 in all, about one per 3 ha of park. No vehicles run on the floor itself.
- **Spindle lifts** climb the terraced end walls to the axis, 1.5 km in a little over 2 minutes at 12 m/s, and arrive in the flying halls at the Spindle's ends, clear of the sunline (raft-habitat.md). In the last ~400 m the Coriolis push outweighs what's left of the spin's pull, so the cabin swings until "down" points sideways. In the last ~50 m, braking takes over and "down" swings toward the axis, then fades to nothing.

### Streets
- Avenues and streets on every deck are for walking and cycling. Avenue trams are no longer needed for range; some decks may keep slow trolleys for short hops.
- **People walk slower higher up.** Walking speed scales with the square root of gravity (the walk–run transition keeps a fixed Froude number; Kram et al.): ~1.35 m/s on the Low decks, ~1.15 at mid-drum, ~1.0 on the High decks.
- The walk to the nearest core averages ~50 m, ~45 s.

## Times
**Door to door**, including the walks to and from the cores (~45 s each) and a 15 s wait for a cab. "Sketch" is raft-habitat.md's first design scaled to this drum: fixed-floor lifts at their Coriolis cap of 6.0 m/s after a 30 s wait, avenue trams at 8 m/s after a 45 s wait, and streets walked; or cycling at 5 m/s.

| Trip | Lattice | Sketch | Sketch, by bike |
|---|---|---|---|
| Same deck, 400 m down the street | 2.8 min | 5.8 | 3.3 |
| Same core, 50 decks up | 2.1 | 2.6 | 2.6 |
| Mid-drum (deck 201) to the Hollow floor | 2.5 | 4.0 | 4.0 |
| Mid-drum to the far side of the same deck | 6.4 | 17 | 17 |
| Low deck to a High deck, a quarter turn round and 1 km along | 6.2 | 28 | 18 |
| Deck 16 to deck 375, opposite side, end to end | 9.3 | 82 | 35 |
| **Random pairs: mean / 90th percentile / worst** | **6.2 / 7.8 / ~12** | **30 / 49 / ~84** | **20 / 31 / ~52** |

- **Everywhere in the drum is within about 12 minutes of everywhere else.** In a 2 km drum it was about 9.
- **The network and the speed each roughly halve the time.** The same Lattice at the sketch's speeds (5 m/s radially, 8 m/s horizontally) averages ~14 minutes, against the sketch's 30. At 20 and 30 m/s it averages ~6.
- **At the peak,** routing spreads trips over the line decks to keep loops under capacity. That adds ~5 s to the average trip on a design day and ~2–7 s on a heavy one (Capacity).
- Random destinations overstate trip lengths: real trips are mostly short, so typical times run lower. If destinations fall off over ~2 km, the mean trip is ~5 minutes; over ~1 km, ~4½.

**To a station platform** (door to the platform beside a glide car):

| From | Lattice | Sketch | Cab ride / lift ride to the Keel |
|---|---|---|---|
| Low decks (deck 76) | 1.9 min | 3.5 | 29 / 57 s |
| Mid-drum (deck 201) | 2.3 | 4.8 | 54 / 140 s |
| High decks (deck 326) | 2.8 | 6.2 | 79 / 224 s |
| Innermost deck (375) | 2.9 | 6.8 | 89 / 256 s |
| Average flat | 2.2 | 4.6 | |

- The sketch also walks the last ~100 m along the Keel to the station ring. The cab rides it.
- **The next drum is ~8½ minutes door to door:** ~2.2 to the platform, ~1.2 to clear the quay, 2.3 gliding, ~0.6 to come in, ~2.2 to the door. With fixed-floor lifts it would be ~13. In a 2 km drum it's ~7. At the peak, the walk between glide train and cab can add up to a minute at each end.
- **Reach.** raft-transport.md's formula counts only cab rides and quays: ~5.6 minutes for both ends here, ~4.8 in a 2 km drum (6 with fixed-floor lifts). With 140 s hops that gives ~80 drums (~1.6 × 10¹⁰ people) within 20 minutes and ~1,100 drums (~2.2 × 10¹¹) within an hour. A raft of 2 km drums reaches ~1.1 × 10¹⁰ and ~1.5 × 10¹¹: bigger drums' faster quays more than make up for their longer hops.
- **The High decks lose less.** The innermost deck is 2.9 minutes from a platform, against 6.8 by fixed-floor lift. Living at the top costs ~1 minute more than living at the bottom, not ~3½, so raft-habitat.md's "the way out is down" matters less.

## Speed limits
Loops on each line deck, keeping riders between 0.3 and 1.2 g, capped at 30 m/s. Felt weight at the limit is in brackets.

| Line deck | Radius | Local weight | Spinward | Antispinward |
|---|---|---|---|---|
| 13 | 2,952 m | 0.98 g | 17.5 m/s (1.20 g) | 30 m/s (0.67 g) |
| 38 | 2,852 m | 0.95 g | 20 (1.20) | 30 (0.63) |
| 63 | 2,752 m | 0.92 g | 22.5 (1.20) | 30 (0.60) |
| 88 | 2,652 m | 0.88 g | 25 (1.20) | 30 (0.57) |
| 113 | 2,552 m | 0.85 g | 27.5 (1.20) | 30 (0.54) |
| 138 | 2,452 m | 0.82 g | 29.5 (1.20) | 30 (0.50) |
| 163 | 2,352 m | 0.78 g | 30 (1.17) | 30 (0.47) |
| 188 | 2,252 m | 0.75 g | 30 (1.14) | 30 (0.44) |
| 213 | 2,152 m | 0.72 g | 30 (1.11) | 30 (0.41) |
| 238 | 2,052 m | 0.68 g | 30 (1.08) | 30 (0.38) |
| 263 | 1,952 m | 0.65 g | 30 (1.05) | 30 (0.35) |
| 288 | 1,852 m | 0.62 g | 30 (1.02) | 30 (0.32) |
| 313 | 1,752 m | 0.58 g | 30 (0.99) | 28.5 (0.30) |
| 338 | 1,652 m | 0.55 g | 30 (0.96) | 24.5 (0.30) |
| 363 | 1,552 m | 0.52 g | 30 (0.93) | 21 (0.30) |

- Without the cap, the two limits meet near deck 245 (r ≈ 2,025 m) at ~38.5 m/s. At the rim they would be 16 spinward and 78 antispinward; on the Hollow floor, 47 and 19.
- Weight changes as the cab speeds up, ~0.02 g a second over ~20 s: like a lift, but slower.
- Cross-lines are 30 m/s on every line deck, and weight doesn't change on them.
- The sketch's 8 m/s trams changed weight by 10–20%. At the limits, loops change it far more: riders on the highest loops gain ~80% going spinward (to ~0.93 g) and lose ~40% going antispinward. Nobody is ever heavier than 1.2 g or lighter than 0.3 g, and riders sit or hold on, as in a metro.

## Energy
*Revised Oct 2026. The first version, for a 2 km drum, assumed 12-seat cabs averaging 4 riders and put a day of six rides (two to stations, four inside the drum) at ~3.8 W. Cabs that carry one party (Capacity) carry fewer riders each, which raised that day to ~6.2 W. A 2 km drum's design day, four station rides and two inside, cost ~4.1 W. Revised again for the 3 km drum, where trips inside are ~1.5× as long and more of them stay inside.*

### Where it goes
Per rider, planning case: 1% of the energy moved is lost per trip, as in raft-transport.md. Helium in the tubes and shafts; 1.4 riders a cab, plus 20% for cabs moving empty; platoons on the trunks.

| | Trip within the drum | Trip to a station |
|---|---|---|
| Drag in tubes | 124 kJ | 0.3 kJ |
| Drag in shafts | 15 | 20 |
| Cab lights, air and controls (60 W per cab) | 14 | 3.9 |
| Magnetic guidance | 10 | 0.3 |
| Potential energy lost (1% of the climb) | 13 | 19 |
| Kinetic energy lost (1%) | 3.2 | 0.9 |
| **Total** | **~180 kJ (50 Wh)** | **~44 kJ (12 Wh)** |

| Day (Lattice rides per person) | W per person |
|---|---|
| Design day: two round trips each, one of them to another drum for the ~45% the Glide can carry (1.8 at stations, 3.1 inside) | 7.4 |
| Home day: two round trips inside (4 inside) | 8.3 |
| Big day: three round trips each, the Glide full (1.8 at stations, 5.1 inside) | 11.5 |
| For comparison: a 2 km drum's design day (4 at stations, 2 inside), there / here | 4.1 / 6.2 |

- **A design day uses ~0.64 MJ per person: ~7.4 W.** With 3% losses it's ~9.4 W; with 0.3%, ~6.7. energy-budget.md's line is 20 W, raised from 10 for the 3 km drum and paid for by its ~8 W lower cryocooling.
- **Why it costs more than in a 2 km drum.** The Glide is free and cabs aren't. A 2 km raft's Glide takes everyone out and back each day, and a 3 km raft's ~45%, so more trips stay inside, and those are ~1.5× as long. A 2 km drum's design day would cost ~6.2 W here.
- **Real trips are shorter.** If destinations fall off over ~2 km (a mean trip of ~3 km instead of ~5), a design day costs ~4.9 W and a big day ~7.5; over ~1 km, ~3.7 and ~5.6.
- **Lifting is nearly free.** The climb is stored, not spent. A ride from an average flat to the Keel releases ~410 kJ per rider (~1.9 MJ with the rider's share of the cab), and the ride home takes it back. At 1% per trip, ~19 kJ is lost.
- **Rush hours move power as well as people.** Counting the cabs, a drum's station traffic moves ~94 GWh of potential energy each way a day, ~9 GW at the peak. If its residents go out as its visitors come in, the two cancel. A home drum that empties every morning makes power then and uses it in the evening.
- **Drag is about three-quarters of the bill,** and it grows with the square of speed.
- **Sharing cabs would cut it** (2 riders a cab: ~5.3 W on a design day), but at the cost of waiting at the lobby (Capacity).

### Speed against energy
| Cap, radial / horizontal | Mean trip | 90th percentile | Design day, W per person | Home day |
|---|---|---|---|---|
| 5 / 8 m/s (the sketch's speeds) | 13.6 min | 19.6 | 3.2 | 3.2 |
| 10 / 10 m/s | 10.8 | 15.2 | 3.4 | 3.6 |
| 20 / 20 m/s | 7.1 | 9.4 | 5.4 | 5.7 |
| **20 / 30 m/s (baseline)** | **6.2** | **7.8** | **7.4** | **8.3** |
| 20 / 40 m/s | 5.8 | 7.2 | 10.4 | 12.2 |
| 30 / 60 m/s | 5.6 | 6.8 | 15.5 | 18.3 |

- Going from the sketch's speeds to the baseline more than halves trip times for ~4 W per person on a design day. Past 30 m/s, each step saves ~20 seconds and costs 3–8 W.
- At the sketch's speeds the bill is ~3 W, mostly the cabs' lights and air over longer rides, and conversion losses.
- **A slow setting** (20 m/s on the tubes) saves ~2–3 W for ~1 minute on a trip within the drum: one for lean years, or the Dark.

### Keeping drag down
At 30 m/s on a design day, a careless Lattice would cost ~130 W per person:

| Design | W per person |
|---|---|
| Cramped tubes and shafts of heliox, gas standing still, cabs running solo | 128 |
| + roomy tubes and shafts (a cab blocks about a third) | 65 |
| + helium in the tubes and shafts | 28 |
| + one-way tubes in closed loops, so the traffic drags its gas along | 12.8 |
| + platoons on the trunks | 7.4 |

- **Helium.** The Lattice's tubes and shafts hold pure helium (0.16 kg/m³, against heliox's 0.40) at about the drum's pressure.
  - Helium's pressure falls off toward the axis less steeply than heliox's. A shaft matched to the drum's air at mid-drum differs from it by ~1.5 kPa (1.5%) at the Keel and ~1.1 kPa at the Hollow floor. Berth seals hold that easily, so no airlocks are needed. Tubes on a line deck sit at one radius and match exactly.
  - Helium is free (habitat-design.md), and nothing can burn in it.
  - Crews wear masks, and oxygen that leaks in at the berths is scrubbed out.
- **Gas that moves with the traffic.** Every loop is a closed ring, and every pair of one-way tubes (cross-lines, shafts) is joined at its ends. So the traffic sets its gas circulating, ~35–45% as fast as the cabs in tubes and ~25% in shafts. Drag goes with the cabs' speed relative to the gas, squared, so this roughly halves it.
- **Platoons.** Close-coupled cabs ride in each other's wake, like the cars of a train: a platoon of ten has ~3× the drag of one cab, not ~10×. Averaged over the day, including quiet hours when cabs run alone, a cruising cab has ~45% of its solo drag in a tube and ~40% on an express run. Cabs speed up and slow down alone, so the net cut is about half.
- **Shafts are the awkward part.** A cab climbs floor-first, so it pushes 7 m² of floor through the gas against 4.2 m² of nose in a tube. Fairings top and bottom and stacked platoons keep shaft drag to about an eighth of a design day's bill.
- **The next lever,** if the budget ever needs it: tubes at a quarter of the drum's pressure would cut drag ~4×, but every place a shaft meets a tube would need an airlock.

### Walking against riding
- **A kilometre on foot burns ~38 kcal above resting at 1 g** and ~30 at 0.5 g. Walking gets cheaper in low gravity, but much less than weight does (Farley & McMahon). At cuisine.md's ~2–3.5 Wh per kcal, that's ~0.06–0.13 kWh of food per km.
- **A cab spends ~10 Wh per rider-km,** 6–13× less.
- So a daily 2 km walk (~5–11 W of food) costs about as much electricity as a resident's cab rides. People still need the exercise at 0.5–1 g; it just isn't free.

## Capacity
*Added Oct 2026: what the Lattice needs to carry a few journeys per person per day.*

### Demand
- **A journey out of the drum takes two Lattice rides,** one in each drum. Drums send and receive about as many people, so each carries both its residents' rides and its visitors'.
- **The Glide sets how many leave.** raft-transport.md stacks its lane levels along the drum at a 2 km drum's spacing, so a 3 km drum gets nine: enough for a daily round trip for ~45% of its residents. A 2 km drum's six carry everyone. The rest of the day's trips stay inside.
- **The peak hour is 1.5× the average hour of a 16-hour day,** as raft-transport.md sized the Glide: ~9.4% of a day's rides.

| Day (per person) | Lattice rides | Per drum per day | Peak hour |
|---|---|---|---|
| **Design day:** two round trips, one of them to another drum for the ~45% the Glide carries | 4.9 (1.8 at stations) | ~975 M | ~91 M |
| Home day: two round trips inside | 4 | ~800 M | ~75 M |
| Big day: three round trips, the Glide full | 6.9 (1.8 at stations) | ~1.37 B | ~129 M |

- **For scale,** all of Greater Tokyo's railways carry ~40 M passengers a day. A drum's design-day peak hour is more than twice that.
- **The design day fills the Glide at its design peak.** A home day has no station rides; a big day adds a third round trip inside.

### One party per cab
- **A lobby (one core on one deck) serves ~100–115 people.** At the peak of a design day it sees a rider arrive or leave about every 45 s; on a big day, every ~30 s.
- **Waiting doesn't fill cabs.** In a minute, ~0.15 more riders turn up bound for any station ring, and fewer for anywhere else. Collecting riders from several decks costs ~15 s a stop.
- **So cabs carry one party,** ~1.4 riders, and are small. Capacity comes from platoons on the trunks, not from full cabs.
- Riders pouring off a glide train are the exception. Sorted by neighbourhood, they could share at ~3 a cab, cutting the cab traffic at the station rings by about a quarter. Departing riders still come one party at a time.

### What a channel carries
Within a platoon, cabs ride ~1 m apart and brake together. Between platoons, each keeps room to stop short of where the one ahead is, braking at 0.3 g.

| Channel | One cab at a time | Platoons of 10 | Of 20 | Of 40 |
|---|---|---|---|---|
| Express shaft, 20 m/s | ~840 cabs/h | ~6,300 | ~10,000 | ~14,000 |
| Tube, 30 m/s | ~620 | ~5,000 | ~8,300 | ~12,400 |
| Collector (cabs speeding up and slowing down) | ~1,100 | pairs: ~2,000 | — | — |

- For comparison, a motorway lane carries ~2,000 human-driven cars an hour. Platoons are what lets a 3 × 5 m tube outdo it six times over.

### Lift cores
Per core, at the peak:

| | Design day | Home day | Big day |
|---|---|---|---|
| Cabs reaching the core's foot, each way | ~2,300–2,700 | — | ~2,300–2,700 |
| Busiest express flow, one way (one channel carries ~6,300) | ~3,100 | ~2,300 | ~4,100 |
| Busiest collector flow, one way (three collectors) | ~1,600 | ~1,850 | ~2,600 |
| Busiest line-deck junction, cabs in and out | ~1,900 | ~2,100 | ~3,200 |

- **The foot of each core carries all of its station traffic:** on a design day ~2,300 cabs an hour each way with riders in them, and up to ~2,700 allowing a fifth more for empty moves. That's less than in a 2 km drum, whose residents all glide out. In a balanced drum, cabs that bring residents down take visitors up; in a home drum they go back up empty.
- **The express channels are busiest higher up,** where trips inside join them: ~3,100 cabs an hour on a design day, half of one channel, mostly in platoons of ten. Two each way leave room for big days (~65% of one) and for failures.
- **The busiest collectors are a few hundred metres in from the rim,** where the crowded Low and Middle decks meet the line decks. Three each way run at ~50% on a design day. On a big day they reach ~80%, and cabs close up into pairs.
- **Berths:** four at every lobby, ~7.8 M in all. A lobby sees a cab about once a minute at the peak, and overnight its berths park most of the fleet, the line decks' depots the rest.
- **Floor:** ten channels (~21 m² each, so a cab climbing floor-first blocks about a third of one), four berths, a waiting area and stairs: ~320 m² a deck per core, ~3.2 m² per person.

### Line decks
- **Two pairs of loops along every row of cores.** A 3 km drum sends more trips inside, and they're longer, so with one pair per row, as in a 2 km drum, the loops would run at 100–125% of 40-cab capacity on heavy days even with the best routing. A second pair beside the first doubles them.
- **The quickest routes would still jam the middle.** With random destinations on a home day, they'd put ~23,500 riders an hour on each of the busiest loop tubes, twice what a tube carries in 20-cab platoons.
- **So at the peak, routing spreads the load.** A line deck whose loops or cross-lines fill up gets a little dearer in the router's sums, and trips move to the next one up or down:

| | Design day | Home day | Big day |
|---|---|---|---|
| Busiest loop tube | ~8,300 riders/h (~5,900 cabs) | ~11,700 (~8,400) | ~13,000 (~9,300) |
| Platoons it needs | 20 cabs (71% full) | 40 cabs (68% full) | 40 cabs (75% full) |
| Busiest cross-line tube | ~7,700 riders/h | ~10,900 | ~12,400 |
| Time it costs | ~5 s a trip | ~2 s | ~7 s |

- **The busiest loop tube** on a big day passes a 40-cab platoon, ~180 m long, every ~15 s. Each platoon opens gaps ahead of a junction for cabs joining and closes the gaps cabs leave.
- **Neighbourly trips change the picture.** If destinations fall off over ~1 km (cutting the mean trip from ~5 km to ~2), the busiest loop tube on a home day carries ~5,600 riders an hour even on the quickest routes; over ~2 km, ~12,100, which routing spreads.
- **So the line decks are built for the worst case** (random destinations, every resident travelling) and will mostly run well under half full.
- **Two levels.** Every core sits on a crossing of a loop and a cross-line, ~5,200 crossings per line deck, each carrying thousands of cabs an hour both ways. They can't cross on the flat, so loops and cross-lines run on separate levels, and each interchange has ramps between them and the core's channels.

### Station rings
Each of the nine rings, at the peak of a design (or big) day:

| | |
|---|---|
| Riders, each way | ~1.85 M an hour (~510 a second) |
| Cabs through its berths | ~730 a second, few of them empty: cabs that bring departing riders take arriving ones |
| Cab berths (20 s to drop off, 30 to pick up, a quarter spare) | ~23,000: ~100 km of kerb, six faces round the 18.8 km ring |
| Glide trains of 1,000 seats | one every ~1.9 s each way |
| Trains at the platforms (~90 s each) | ~50, ~5 km of platform |
| Passages through the jacket | ~1 a second; ~60 locks if each takes a minute |

- **Each ring is a station four decks deep** round the whole drum: glide trains along the rim deck, cab berths on island platforms on the three decks above.
- **The train and lock counts assume each train unloads and reloads in one stop.** Separate inbound and outbound trains would double them, to ~90 trains at the platforms and ~120 locks per ring.
- **Each ring passes as many people every hour as Shinjuku,** the world's busiest station, does in a day (~3.5 M).
- **The Glide sets these numbers.** Each ring serves one lane level, sized as raft-transport.md sized them: 1,000-seat trains a few seconds apart, peaks 1.5× the average hour. So each ring carries what a 2 km drum's did; the 3 km drum just has more of them.
- **No Earth-style rush.** If 30% of each commute fell in a single hour, station flows would be 1.6× the design peak. The cores could take it, and the rings with more berths. The Glide couldn't, so drums stagger their days; economy.md's time-of-day prices are one way.

### Fleet
| | Design day | Home day | Big day |
|---|---|---|---|
| Cabs moving at the peak | ~4.9 M | ~5.2 M | ~7.5 M |
| Fleet, with a fifth spare | ~5.8 M | ~6.3 M | ~9.0 M |
| People per cab | ~34 | ~32 | ~22 |

- At ~300 kg each, that's ~9–14 kg of cab per person. Maintenance sheds sit on the line decks.

### Space, mass and power
| | Per person |
|---|---|
| Cores: channels, berths, lobbies, stairs | ~3.2 m² |
| Line decks (fifteen, two decks deep) | ~8 m² |
| Station rings | ~0.03 m² |
| **Floor in all** | **~11 m², of raft-habitat.md's 25 m² for streets and lobbies** |
| Guideway: ~78,000 km of shaft, ~47,000 km of tube | ~47 kg |
| Cabs | ~9–14 kg |
| **Metal in all** | **~60 kg, ~2.5% of habitat-design.md's 2.5 t of floors and services** |

- **Power at the peak.** ~18,000 cab trips start every second. Their regenerative drives cycle ~12 GW of kinetic energy, and on a design day ~9 GW of potential energy goes each way through the Keel. Almost all of it comes back. Losses peak at ~16 W per person, ~3.3 GW a drum, ~2% of the hull's power.

### Running it
- **Failures.** A stalled cab blocks one channel, and traffic moves to its twin. Losing an express channel halves a direction's express capacity, and the other still carries a design-day peak (~3,100 of its ~6,300 cabs an hour). Losing a collector leaves two-thirds. On a line deck, platoons divert to the loop beside them. A stalled cab is pushed to the nearest berth by the guideway's motors, or by the cab behind it.
- **The Hollow fills before the Lattice does.** Its beach-density crowd (~1.4 M, economy.md) arriving in an hour is ~780 cabs an hour per pavilion core, an eighth of one express channel.
- **Evacuation is paced by the Glide.** At its design peak, a drum's nine rings send out ~17 M people an hour, so emptying a drum takes ~12 hours, and the station rings could never hold everyone at once. People are called down as trains come, six to a cab, a fraction of a design day's cab traffic. A single core cleared on its own (~38,000 people, ~6,400 cabs) can be brought down to the Keel in ~15–25 minutes, limited by the collectors that carry the Low decks.

## Side effects
- **Spin.** A home drum whose commuters glide out each morning (~45 M people, nearly three hours of its nine rings at their peak) sends ~3 Mt out through its rim. It slows by ~0.1%: weight falls 0.2% and the quays slow by ~0.2 m/s, which glide catches would notice before people do.
  - Pumping ~3 Mt of the moat's water into tanks at mid-drum trims it, and the water goes back out at night through turbines. That leaves ~48 g/cm² in the moat for the day, above the ~44 g/cm² habitat-design.md says still shields the jacket.
  - A drum with as many visitors as commuters doesn't need to.
- **Stairs.** Every core has them. The Keel to mid-drum is a 660 m climb in Earth terms (~540 kcal); the Keel to the innermost deck, ~1,120 m.
- **The Dark.** In a beam cut, riders going down pay for riders going up, and the tubes slow to 10 m/s. Rationed to two rides a day (one to a station, one inside), the Lattice needs ~2 W per person, 2–4% of the survival reserve (50–100 W; daily-life.md).
- **Freight** rides the same cabs off-peak: food and goods up from the Keel and the Quaysides, waste back down. At a few kg per person each way a day, it's a few percent of cab trips.
- **Emergencies.** Any cab can be an ambulance; a stretcher lies level on the gimballed floor.
- **Fire.** Nothing burns in a helium tube, and smoke can't travel between decks through the shafts.

## Culture (proposals)
- **"Spinward high, antispinward low."** Children learn which way is quick on which deck, and loop signs post two limits.
- **Weight is part of the ride.** Spinward on a low loop, riders feel 1.2 g; antispinward on a high one, 0.3 g. Some people choose their route for the feeling.
- **The cab is a room.** Most people know the Lattice as a small private room that hums, leans a little and opens somewhere else. Nobody sees the tubes, or the platoon their room has joined.
- **Walking costs food.** A long walk is a small indulgence, and exercise; riding is the thrifty choice.
- **The staggered day.** Drums can't all start work at once, so a drum's working hours are part of its character, and of its rents: a drum whose day starts early lets more cheaply.

## Knock-on changes
- **raft-habitat.md:** "Getting around inside" summarizes this doc. Its drum-size table runs this model at each radius: trips inside, the next drum, reach, and the innermost deck to the rim. Gimballed cabs run radially at about a seventh of rim speed: ~10 m/s in a town drum, ~20 in a 2 km drum, ~45 in a world drum, and 20 (rather than the 25 the rule allows) in the 3 km nation drum. Oct 2026: its energy line is ~7–12 W, and its capacity line notes two pairs of loops per row.
- **habitat-design.md:** a lift with a fixed floor at 5 m/s pushes riders sideways by ~0.06 g; gimballed cabs turn the push into a lean.
- **energy-budget.md, daily-life.md:** their line for lifts and in-drum trams is now 20 W per person, paid for by the 3 km drum's lower cryocooling (~17 W against ~25).
- **raft-transport.md:** fixed-floor lifts would be capped at ~6 m/s. With cabs, its next drum is ~8½ minutes door to door, its reach formula's cab rides and quays take ~5.6 minutes, and ~1.6 × 10¹⁰ people live within 20 minutes. Its Glide capacity sets the Lattice's design peak, with nine lane levels per drum, and each station ring needs ~60 locks through the jacket.
- **daily-life.md:** its commute to the next drum is ~8½ minutes.
- **ashgrove.md:** uses the Lattice, with this doc's timings (deck 77 to the rim in ~30 s, to deck 361 in ~71 s).
- **raft-habitat.md's sunline (Oct 2026):** Spindle lifts arrive in its flying halls.

## Open questions
- How much tilt riders accept, and how much compensation (~75% here) is best for people raised in a spinning drum.
- Real trip lengths, which set how many loops and cross-lines each line deck needs, and the energy bill. Built for random destinations, the line decks would mostly run under half full, and with destinations within ~2 km cabs would need ~5 W per person on a design day, not ~7.4.
- How much of a 200 M drum's life stays inside it. The Glide carries ~45% of residents out and back each day; more lane levels (closer than ~420 m) would send more out, and spare the cabs.
- How peaky days are. Everything here is sized for peaks 1.5× the average hour; an Earth-style rush would need more of the Glide, not more of the Lattice.
- How glide trains pass the jacket: ~60 locks per ring if each takes a minute per train.
- Platoon safety: between platoons this doc keeps room to stop short of where the platoon ahead is. Following closer, on the assumption that a platoon can't stop faster than its own brakes, would roughly double what a tube carries.
- Whether arriving riders share cabs by neighbourhood, which would cut the cab traffic at the station rings by about a quarter.
- Whether cores should open onto the Hollow's floor at all, or only around its edges.
- Keeping the Lattice's helium pure, with oxygen leaking in at every berth.
- World drums: radial cabs at ~45 m/s need pressure-controlled cabins, since pressure differs 16% across their decks.
- Whether freight gets its own shafts.

## Method
- Drum: R = 3,000 m, ω = 0.0572 rad/s, L = 3,750 m; deck n at r = 3,000 − 4(n − 1) m. Residents in proportion to floor (2πrL) on decks 16–375; destinations in proportion to floor on decks 1–376. The 2 km figures use the same model with R = 2,000 m, L = 2,500 m, decks 11–250 and 1–251; town and world drums in raft-habitat.md use it with radial cabs at 10 and 45 m/s.
- Heliox (21 kPa O₂ + 80 kPa He at 300 K): ρ = 0.398 kg/m³, sound 635 m/s. Helium at 101 kPa: 0.162 kg/m³. Pressure gradient ρω²r.
- Coriolis tilt: tan θ = 2ωv ÷ (ω²r ± radial acceleration). While cruising at the innermost deck (r = R/2), a tilt θ allows v = tan θ × rim speed ÷ 4; 30° gives 0.144 × rim speed, and ~35° at the start of braking, in any drum size. Residual sideways push with 75% tilt: 0.25 × 2ωv = 0.058 g at 20 m/s (0.071 g in a 2 km drum).
- Weight on a loop: (ωr ± u)² ÷ r. Limits: u_spin = √(1.2 g r) − ωr, u_anti = ωr − √(0.3 g r).
- Motion: trapezoidal profile at 1.5 m/s², plus 1 s for jerk; sketch lifts 6.0 m/s (0.07 g ÷ 2ω; 4.9 in a 2 km drum) at 1 m/s².
- Trip model, Monte Carlo over 200,000 random pairs:
  - walk to the nearest core (mean Manhattan distance (s_φ + s_z) ÷ 4; cores 100 m apart along the axis and 100 m × r ÷ 2,250 around: 37 rows of 141 columns, 5,217 cores) at 1.35 √(g ÷ g₀) m/s;
  - a 15 s wait; a radial ride to the quickest line deck; 5 s per change between shaft and tube;
  - loop leg (direction chosen for speed) and cross-line leg, with 20 s per junction turn;
  - a radial ride and a walk; or a walk on the deck plus a radial ride, whichever is quicker.
  - Sketch: 30 s lift wait, 45 s tram wait, trams at 8 m/s and 1 m/s², streets walked; bike at 5 m/s plus 30 s.
  - Worst case: a search over extreme corners with walks from the far corner of a core's cell.
- Station rings at z = (2i + 1) L ÷ 18 for i = 0–8; sidestep at up to 20 m/s. Quays: 73 s out, 37 s in (a 2 km drum's 60 and 30, scaled with the drum's turn); glide 140 s. Reach: raft-transport.md's formula with 5.6 minutes of cab rides and quays (4.8 in a 2 km drum, which saved 1.2 minutes on the sketch's 6).
- Energy per rider: 70 kg + 300 kg × 1.2 (for empty moves) ÷ 1.4 riders = 327 kg. Loss = 1% (planning) of potential energy (½ω²|Δr²|) plus kinetic energy per leg.
  - Drag ½ρ·CdA·(v − U)|v − U|, U = κ × the line's speed. Solo CdA 2.5 m² in tubes (4.2 m² nose) and 5 m² in shafts (7 m² floor, faired); platoons × 0.45 in tubes and × 0.4 on express runs, daily averages (0.4 assumes most express traffic runs in full platoons of ten; 0.5 would add ~0.2 W to a design day); κ = 0.35 in tubes and 0.25 in shafts. Cab drag × 1.2 ÷ 1.4 per rider.
  - Guidance 0.1% of felt weight; 60 W per cab in service.
  - Design day: 1.8 station rides and 3.1 rides within the drum per person; home day 4 inside; big day 1.8 and 5.1. Neighbourly variants weight trips by exp(−D ÷ D₀), D₀ = 1 or 2 km.
- Gas moving with the traffic: N cabs × ½ρ·CdA·(v − U)² = wall friction ½ρ·C_f·P·C·U², with C_f = 0.005 and perimeter P = 16 m on a loop of length C. With platooned cabs, κ ≈ 0.45 at the peak and ~0.35 averaged over the day.
- Platoon drag: a platoon of n close-coupled cabs ≈ 1 + 0.25(n − 1) solo cabs.
- Walking: net ~2.3 J/kg per metre at 1 g (38 kcal/km for 70 kg), ~0.9× at 0.75 g and ~0.8× at 0.5 g.
- Capacity:
  - Demand: 199.3 M people; rides per person per day as in the table; peak hour 1.5 ÷ 16 of the day (raft-transport.md). Glide share: nine lane levels against the ~20 a daily round trip for everyone would need, 0.445 of a round trip per resident per day. Lobby: one core on one deck, 5,217 × 376.
  - Channel capacity: v × n ÷ (n × pitch + v² ÷ 2a_e + 0.3 s × v + 10 m), a_e = 3 m/s²; pitch 3.1 m stacked in shafts, 4.5 m nose to tail in tubes.
  - Core flows: station and internal legs from the trip model, 1.4 riders a cab, 20% empty moves. Lobby ends and line-deck ends accelerate and brake in a collector (up to 133 m, or the whole leg if it's under 266 m); the Keel end is an express terminal.
  - Loop loads: rider-km on each line deck and direction ÷ (74 loops × circumference). Cross-lines: riders crossing the drum's mid-length ÷ (2 directions × 141). Balancing: a time penalty per line deck and direction, and per line deck's cross-lines, raised over 60 rounds toward a target of 60% of 20-cab capacity on a design day and of 40-cab capacity on heavy days. Loads settle at 68–75%, the most the loops can even out. With 37 loops per line deck the targets can't be met: loads settle at 100–125% of 40-cab capacity on heavy days.
  - Neighbourly destinations: weight exp(−D ÷ D₀), D₀ = 1 or 2 km, D = |Δr| + arc + |Δz|.
  - Stations: 20 s to drop off, 30 s to pick up, ×1.25; 4.5 m of kerb per berth; trains of 1,000 seats, 100 m long, ~90 s at the platform; two lock passages per train.
  - Fleet: (ride + 25 s dwell) × cab trips × 1.2 for empty moves, + 20% spare.
  - Evacuation: 6 riders a cab; the Low decks' cabs (rides under 266 m, ~23% of a core's residents) use the three down collectors all the way, at ~3,300 cabs an hour singly or ~6,000 paired; the rest go express (2 × 6,300). Drum: 199.3 M ÷ (9 rings × 1.85 M an hour).
  - Floor: 21 m² per channel, 10 m² per berth, 50 m² waiting, 20 m² stairs per core per deck; line decks two deck-slots each. Metal: 60 kg/m of shaft, 100 kg/m of tube, 300 kg per cab.
- Spin: I ≈ 1.2 × 10¹⁹ kg·m² (shield hydrogen at ~3,025 m, contents spread over the decks, the moat at ~3,060 m, inside water at ~2,250 m); 45 M × 70 kg leaving from r = 2,250 m through quays at 3,050 m; trim water moved from ~3,060 m to 2,250 m.

## Sources
- Hitachi, World's fastest elevator at Guangzhou CTF Finance Centre (21 m/s, 440 m in ~42 s, pressure control), 2019: https://www.hitachi.com/en/press/articles/2019/09/0927/
- TK Elevator, MULTI rope-free elevator: https://www.tkelevator.com/global-en/products/innovations/multi/
- Kram, Domingo & Ferris, Effect of reduced gravity on the preferred walk–run transition speed, J. Exp. Biol. (1997): https://journals.biologists.com/jeb/article-abstract/200/4/821/7425/Effect-of-Reduced-Gravity-on-The-Preferred-Walk
- Farley & McMahon, Energetics of walking and running: insights from simulated reduced-gravity experiments, J. Appl. Physiol. (1992): https://journals.physiology.org/doi/abs/10.1152/jappl.1992.73.6.2709
- KTH, Tilting trains: technology, benefits and motion sickness: https://www.kth.se/polopoly_fs/1.206364.1600689418!/Menu/general/column-content/attachment/Tilting%20trains%20-%20technology%20benefits%20and%20motion%20sickness.pdf
- Wikipedia, Transport in Greater Tokyo (~40 M rail passengers a day): https://en.wikipedia.org/wiki/Transport_in_Greater_Tokyo
- Nippon.com, Shinjuku Station (3.53 M passengers a day, 2017; Guinness's busiest station): https://www.nippon.com/en/features/h00273/shinjuku-station-is-enormous!-daily-passengers-equivalent-to-population-of-yokohama.html
