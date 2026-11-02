# Element cycles: what's recycled, what's parked, what's lost

*Design proposal from a working session, Oct 2026. Element by element: how closed a drum's loops can be, split into what's lost but stays aboard (the inside ledger) and what leaves a raft (the outside ledger). Answers matter-delivery.md's open question on which element binds first, and so how much white-dwarf ore drums can use. Builds on habitat-design.md (the drum, its jacket and moat), food-system.md (the loops), matter-delivery.md (ores and their prices), full-swarm.md (growth and fuel), raft-transport.md (vehicles and shields), raft-habitat.md (radiators) and daily-life.md (the Yards). Figures are per person. "Solar mix" is Asplund et al. 2009 with neon left at the source, as matter-delivery.md ships it. Budgets assume stellar and white-dwarf ore; gas, while it flows, loosens them. The names (the two ledgers, the cold envelope, the frost) are proposals. Checked by an independent review, whose corrections are folded in. Revised Oct 2026 for the 3 km nation drum of ~200 M (raft-habitat.md): per person it has a lighter jacket and moat, a smaller glide fleet and longer radiator trunks. Revised Oct 29, 2026 after a consistency audit. Revised 1 Nov 2026 after a physics audit (Jeff's decisions): ~1.95 × 10³³ people hold ~6.6 × 10⁶ M☉, so growth's living-star ore now comes from the nuclear stellar disk and the inner bulge (matter-delivery.md), the cluster's gas lasts ~750 Myr, and the survival reserve banks ~60 kg of oxygen a person.*

## Summary
- **Two ledgers, two currencies.**
  - **Inside:** anything that drops out of a loop but stays aboard (residues, pipe scale, N₂ in the air, frost on the cryopanels, bones) is parked stock. It costs inventory and the energy to win it back: ~5–35 W a person in all.
  - **Outside:** anything that leaves a raft is lost to it. Planning prices it as gone for good, to be replaced from the frontier, though some would come back to other rafts within ~10⁵ years.
- **The outside budgets are tiny.**
  - **In bulk, about a milligram a person a year,** mostly carbon and oxygen, a tenth of the ~9–11 mg of new metal that arrives once growth tracks the hole. Replacing it costs ~0.25–0.5 W a person; a gram a year would cost 250–500 W.
  - **For the scarce elements, far less:** ~0.1 mg of nitrogen and ~0.1 µg each of phosphorus and potassium a year. At the planning white-dwarf share, those come only from living stars (the nuclear stellar disk's, then the inner bulge's), and every microgram of phosphorus lost a year beyond that cuts the usable white-dwarf share by ~20 points.
  - **For hydrogen and helium, ~1 mg,** since each milligram is ~5% of what the hole eats.
  - A drum may lose ~1.5 × 10⁻¹⁰ of its heavy elements a year. The ISS loses ~10% of its air.
- **The drum's 20 K jacket makes that possible.** Anything heavier than helium that leaks through the hull freezes on cryopanels in the jacket's insulating vacuum, so the hull's leaks are an inside matter. Every other exit has to open into the cold too: berth vestibules, freight locks, rotary joints, reliefs, boil-off, fire dumps.
- **What can leak is what sits outside the cold:** the moat, radiator fluid, travel shields, vehicle cabins, suits, the Yards, the raft's frame and the Lantern, a tenth to a quarter of each person's metal. Most of it is bare solids, which can't leak, and sealed liquids, which mustn't.
- **The hydrogen surprise.** Polyethylene travel shields would give off radiolytic hydrogen at ~4–16 g a person a year in the mid-raft's X-ray flood: ~140–580× what the hole eats, emptying the cluster's stripped gas in ~2–8 Myr. Sealed water recombines what radiolysis splits, so shields are water, and no hydrogen-bearing solid sits in the flood.
- **What binds is phosphorus, potassium or chlorine, depending on the mineral loop.** Each needs 8–58% of what a solar-mix 6.7 t carries. Bodies set phosphorus's floor (~0.6 kg, mostly bone); potassium and chlorine are mostly pipeline and reserve.
  - **Lean loop** (two weeks in the pipeline, a month's float, 99.9% recovery): phosphorus binds at ~22%. Drums can take up to ~78% of their metal as white-dwarf carbon and oxygen, and the living stars (the disk's and the inner bulge's) then cover ~2 Gyr of growth instead of ~1.1.
  - **Comfortable loop** (two months, 90 days, 99%): potassium binds at ~58%; ~42% white dwarfs; ~1.4 Gyr.
- **Nitrogen never binds on stock.** A solar mix carries ~380 kg a person, against ~2–5 kg needed. Its risks are losses: N₂ building up in the heliox (each 10 Pa holds ~60 g a person) and ammonia leaking from exposed radiator panels, which must lose under ~5 × 10⁻⁸ of their charge a year.
- **Phosphorus is lost inward, nitrogen outward.**
- **Feasible recovery per pass:** carbon, oxygen and hydrogen ~100%; nitrogen ~100%, with N₂ re-fixed at ~9–13 kWh/kg (~2–4 W a person); phosphorus 99.9% (today's best ~90–98%); salts 99.9%; the Yards' materials ~98–99.5%, with residues reprocessed.
- **Scarce elements come in grams.** A solar mix gives each person ~400 g of copper, ~3 g of platinum, ~2 g of iodine and ~1.5 g of neodymium, and stars carry almost no lithium. Wiring, storage, magnets and catalysts are built around that, and medicine borrows them.

## Two ledgers
### Inside: parked, not lost
- **What counts:** anything that drops out of a loop but stays inside a drum's hull or its cold envelope: residues waiting to be reprocessed, scale in pipes and reactors, dust, sediments, gas building up in the air, frost on the cryopanels, bones that are kept.
- **What it costs:** stock and energy.
  - Parked stock = throughput × (1 − recovery per pass) × time until it's reprocessed.
  - Chemistry wins most of it back for a few MJ/kg. The backstop is brute force: ionize it and sort the ions by mass, the plasma catch's refinery run small (matter-delivery.md). That's ~0.2–0.5 GJ/kg near the floor of ~30 eV an ion, and ~0.7–2 GJ/kg with today's plasma sources.
- So nothing aboard is unrecoverable. The question for each element is how much sits parked, and whether that stock is affordable.

### Outside: replaced at the frontier's price
- **What counts:** anything that leaves the raft. Its raft loses it for good; for planning, so does the civilization (see Where lost atoms go).

| Phase | Growth a year | New metal a person a year |
|---|---|---|
| Build-out, 3% → 30% of Eddington (0.04 M☉/yr) | ~10⁻⁷ falling to ~10⁻⁸ (average ~2 × 10⁻⁸) | ~600 mg at the start, ~60 at the end |
| Held at 30%, today (0.015 M☉/yr) | ~3.5 × 10⁻⁹ | ~24 mg |
| Spun up and after (0.009–0.03 M☉/yr) | ~1.4 × 10⁻⁹ | ~9–11 mg |

- **The bulk budget is ~1 mg a person a year,** a tenth of the long-run stream: ~1.5 × 10⁻¹⁰ of a person's 6.7 t. The average atom stays ~7 billion years. The ISS loses ~0.3–0.5 kg of air a day, ~10% a year, nearly 10⁹ times faster.
- **Price of a milligram a year,** in W a person, at matter-delivery.md's lifting costs:

| Ore | Minimum | Planning (×2) |
|---|---|---|
| Stars | 0.13–0.25 | 0.25–0.5 |
| White dwarfs (carbon and oxygen only) | ~0.12 | ~0.25 |
| Gas | 3 × 10⁻⁷–2 × 10⁻³ | — |

  - The whole bulk budget costs ~0.25–0.5 W a person, a tenth of the growth line's few watts. It's a soft limit: carbon and oxygen lost beyond it cost energy, ~0.25 W per mg, and white dwarfs hold plenty.
  - **Gas** is nearly free in energy but limited in flow. While the bar feeds the Central Molecular Zone, it carries ~16–94 mg a person a year of every heavy element in solar proportions, which loosens each budget below in proportion to its spare flow. Whether it still does in the setting's era is matter-delivery.md's open "Epoch" question.

### Scarce elements have budgets of their own
- **At the planning white-dwarf share (~75%, below),** the stream's phosphorus, potassium, chlorine and nitrogen come only from the living stars, and growth uses nearly all of them. What's left over is each element's loss budget.

| Element | Share of shipped ore | Loss budget, a person a year | Beyond it, each unit lost |
|---|---|---|---|
| Phosphorus | 0.048% | ~0.1 µg | Cuts the white-dwarf share by ~20 points per µg: ~0.4 Gyr less growth |
| Potassium | 0.025% | ~0.15 µg | ~40 points of the share per µg |
| Chlorine | 0.036–0.068% | ~0.4–1 µg | ~15–30 points per µg |
| Nitrogen | 5.7% | ~0.13 mg | ~20 points per 0.1 mg |
| Carbon, oxygen | White dwarfs | The bulk budget | Energy only, ~0.25 W per mg |

- **The price is horizon, not energy.** Extra stellar ore replaces white-dwarf ore at about the same lifting cost, so the energy premium is small (~0.01–0.5 W per µg of phosphorus). What runs out is the living stars' finite stock.
- **So the scarce elements must essentially never leave.** Phosphorus and potassium don't make gases and stay in bodies, food and brine, all inside the cold, so their danger is cultural (below). Nitrogen sits in exposed ammonia.

## What a person's metal holds
If all of a person's 6.7 t were shipped solar mix:

| Element | In 6.7 t of solar mix | Needed, lean–comfortable | Share needed |
|---|---|---|---|
| Phosphorus | 3.2 kg | 0.72–1.07 kg (bodies 0.62) | 22–33% |
| Potassium | 1.7 kg | 0.31–0.98 kg | 18–58% |
| Chlorine | 2.4–4.5 kg | 0.35–1.28 kg | 8–53% |
| Sodium | 16 kg | 0.28–0.93 kg | 2–6% |
| Calcium | 35 kg | 0.86–1.05 kg | 2–3% |
| Iodine | 1.8 g | 20–50 mg | 1–3% |
| Nitrogen | ~380 kg | 2.1–4.6 kg | ~1% |
| Sulfur, magnesium, iron, zinc, copper, selenium, molybdenum | — | — | Under 1% |

- **"Needed"** is what sits in bodies (0.8× a 70 kg reference man), in the vats, garden and brines, in the loop's pipeline, in the reserve's mineral float, and parked as residues.
  - Lean: two weeks in the pipeline; a month's float, enough for the 55-day Dark at reduced intake; 99.9% recovery with residues reprocessed yearly.
  - Comfortable: two months; 90 days at full intake (food-system.md's reserve); 99% with residues reprocessed every decade.
- **Phosphorus has a floor; potassium and chlorine have a pipeline.** Bodies hold ~87% of a lean loop's phosphorus. Potassium and chlorine each cycle ~2 kg a year, so every day they spend between people costs ~5–7 g a person, and a comfortable loop holds three times what a lean one does.

### How much white-dwarf ore drums can use
| | Lean loop | Comfortable loop |
|---|---|---|
| Binds first | Phosphorus, at 22% | Potassium, at 58%; chlorine close behind if the meteoritic value is right |
| White dwarfs can supply up to | ~78% | ~42% |
| A drum's metal is then | ~93% carbon and oxygen | ~81% |
| The living stars cover growth to (disk and inner bulge; disk alone) | Hole ×19, ~2.0 Gyr; ×13, ~1.7 Gyr | Hole ×8, ~1.4 Gyr; ×5.5, ~1.1 Gyr |

- **The float decides between phosphorus and potassium.** Covering the whole 55-day Dark at full intake, potassium ties phosphorus at ~77%; at food-system.md's 90 days, potassium binds at ~69% (~1.8 Gyr, hole ×14).
- **Planning: a lean loop with margin,** ~75% white dwarfs. The living stars of the disk and the inner bulge then last ~2.0 Gyr instead of ~1.1, using ~9 × 10⁷ M☉ of the disk's ~1–1.6 × 10⁸ M☉ of white-dwarf carbon and oxygen. Gas, while it flows, stretches this further.
- **At ~93% carbon and oxygen** the rest is ~0.5 t a person: ~160 kg of iron, ~85 kg each of magnesium, silicon and nitrogen, ~40 kg of sulfur, and smaller shares. That's about what a drum of composites, polymers, water and glass needs.
- **Today's drums may carry a surplus.** If the build-out used none of the cluster's own white dwarfs, today's solar-mix drums each hold ~2.5 kg more phosphorus and ~1.4 kg more potassium than a lean loop needs: 3.5 and 4.5 new people's worth. Banked rather than built into materials, it lets early growth lean harder still on white dwarfs.
- **The heliox suits the metal.** A solar mix could spare ~60 kPa of N₂ at most, and at 75% white dwarfs ~15 kPa. An Earth-like 78 kPa would take ~470 kg of nitrogen a person, more than a solar mix's whole share.

### Scarce elements
| Element | A person's share, all solar mix | What that rules out |
|---|---|---|
| Copper | ~400 g | Copper wiring: conductors are aluminium, sodium or nanocarbon |
| Zinc, fluorine | ~1 kg, ~0.3 kg | Fluoropolymers beyond seals and membranes |
| Lithium | ~5 g from gas; stars burn theirs, so stellar ore carries almost none | Lithium batteries (a 10 kWh pack holds ~1 kg): storage is flywheels and methanol, as planned |
| Platinum, iridium | ~3 g, ~2 g | Precious-metal catalysts beyond grams |
| Boron | ~2 g from gas; stars burn much of theirs | Borosilicate glass; boron-based superconductors |
| Iodine | ~1.8 g | Nothing but contrast imaging: people need ~20–50 mg |
| Neodymium, dysprosium | ~1.5 g, ~0.8 g | Rare-earth magnets (an EV motor uses ~1–2 kg): alnico and iron-cobalt instead, from ~40 kg of nickel and ~2 kg of cobalt |
| Gold, silver, indium | ~0.7, ~0.4, ~0.3 g | Plating and transparent conductors beyond traces |

- At ~75% white dwarfs, divide by four.
- **These are loans, not consumables.** Each needs ≥99.9% recovery per pass and no dissipative uses: every gram tracked from fabrication to return.
- **Medicine borrows them.** A contrast CT takes ~22–30 g of iodine, a dozen or more people's whole share. A gadolinium MRI dose (~1.1 g) is more than one person's, and a year of lithium therapy (~70 g) is ~14 people's even from gas. Nearly all of it leaves in the urine within days, so a clinic's drains are a mine.

## The inside ledger
| | Loop throughput, a person a year | Recovery per pass: today → planning | Where the rest waits | Parked at planning | Energy, a person |
|---|---|---|---|---|---|
| Carbon, oxygen, hydrogen | Hundreds of kg | ISS water 98% → ~100% | CO₂ and vapour in the air; frost on the cryopanels; carbonate scale | Kilograms | In the food plant's budget |
| Nitrogen | 6–7 kg | Urine nitrogen to ammonia 95–99% → ~100% with N₂ re-fixed | N₂ in the heliox | ≲60 g (≤10 Pa) | ~2–4 W |
| Phosphorus | 0.8–1 kg | ~90–98% (from sludge ash) → 99.9% | Scale, filter cake, dust, sediments, bones | ~1–10 g | Small |
| Potassium, sodium, chlorine | 1.5–2.6 kg each | → 99.9% | Pipeline, float, brines | Set by the pipeline and float | Small |
| Calcium, magnesium, sulfur | 0.15–0.5 kg each | → 99%+ | Carbonate and phosphate scale | Tens of grams | Small |
| Trace nutrients | Milligrams to grams | → 99–99.9% | Residues; iodine and selenium as vapours | Milligrams | Small |
| Things (the Yards) | ~100 kg | → 98–99.5%, residues reprocessed | Slag, dust, swarf, off-spec parts | 5–20 kg | ~3–30 W |

**Carbon, oxygen and hydrogen.**
- Closed by the food plant's chemistry: waste is oxidized to CO₂ and water, and electrolysis and methanol synthesis rebuild everything (food-system.md). The ISS already recovers 98% of its water.
- What's left over stays aboard: CO₂ and water vapour in the air (~5 kg of CO₂ a person at 0.5 kPa), carbonate scale, and frost.
- **The frost.** Whatever the hull leaks crosses into a guard vacuum between the hull and the jacket's insulation. Cryopanels there (20 K arrays behind 80 K shrouds, as in industrial cryopumps) freeze everything heavier than helium before it can reach the insulation: ~15 g of oxygen a person a year if the hull leaks 10⁻⁴ of its air annually.
  - Panels are isolated a bank at a time, warmed, and their catch pumped home.
  - Helium doesn't freeze at 20 K. What leaks (~7 g a person a year at the same rate) is pumped home continuously.

**Nitrogen.**
- Urine carries ~11 g a day, mostly urea, ~85% of what people excrete. Hydrolysed and stripped, it goes back to the Vats as ammonia (food-system.md), at 95–99% per pass.
- Feces, spent biomass and residues go through waste oxidation, which turns most of their nitrogen into N₂, as does any denitrifying corner of a vat or garden. ~25–35% of the loop's 6–7 kg a year passes through N₂.
- **Catch it at the source and re-fix it.** Ammonia from electrolytic hydrogen takes ~9–13 kWh per kg of nitrogen today (~7.2 MWh a tonne of ammonia with solid-oxide cells, ~10–11 with alkaline), ~7 at the thermodynamic floor: ~2–4 W a person.
- **The sink to watch is the air.** Heliox carries almost no nitrogen, but every 10 Pa of N₂ allowed to build up holds ~60 g a person; a kilopascal holds ~6 kg, four times the nitrogen in everyone's bodies. Planning holds it under ~10 Pa.

**Phosphorus.**
- People excrete ~1.4 g a day, ~60–65% in urine. RNA stripped from microbial protein (food-system.md) and spent biomass add half as much again or more: ~0.8–1 kg a year through the loop.
- Waste oxidation turns all of it to phosphate, which precipitates as calcium phosphate or struvite. Today's plants recover under half from wastewater and ~90% (up to ~98%) from sludge ash. A drum's concentrated, fully oxidized stream can plan on 99.9%.
- What escapes goes to reactor scale, filter cake and dust, and comes back with acid washes. Parked: ~1 g a person at 99.9% reprocessed yearly; ~0.1 kg at 99% reprocessed each decade; at today's 90%, ~1 kg a decade, as much as everyone's bodies.
- **Three sinks need rules:**
  - **Bones,** ~0.5–0.7 kg of phosphorus a skeleton. A drum that kept its dead would park ~6–8 g a person a year: about a body's worth per resident each century.
  - **Soil.** 0.3 m of soil holds ~0.2–0.4 kg of phosphorus per m², so raft-habitat.md's ~5 m² of park a person would hold 1–2 kg, more than the bodies, along with ~2 t of soil. Parks root in inert media on recycled nutrient solution.
  - **Lakes.** Sediments trap phosphorus, so a lake in the Hollow (raft-habitat.md) is kept starved and clear.

**Potassium, sodium and chlorine.**
- Salts come back cleanly from oxidized brine by evaporation, electrodialysis and crystallization, at 99.9%.
- Their stock is set by how long they spend between people. Each cycles ~1.5–2.6 kg a year, so the pipeline and the Dark's float decide whether potassium or chlorine binds before phosphorus.
- To keep them under it: fast loops, and a float sized for reduced intake through a Dark. Kidneys hold on to sodium and chloride well and to potassium less well, so potassium sets the float.
- A chloride-light table (more glutamate, less table salt) gives chlorine more room, but only down to ~2.3 g of chloride a day. Below that, chloride depletion sustains metabolic alkalosis, as the chloride-deficient infant formulas of 1978–79 showed, and citrate salts add an alkali load of their own.

**Calcium, magnesium and sulfur.** Plentiful: under 3% of their share. Their nuisance is scale, calcium carbonate and phosphate on reactor walls, a known trouble of supercritical-water oxidation, cleared by acid washes.

**Trace nutrients.** Iron, zinc, copper, manganese, iodine, selenium, molybdenum and cobalt pass through at milligrams to grams a year and come back from oxidation residues at 99–99.9%. Iodine and selenium form vapours (iodine, methyl selenides), which end up on the cryopanels or on scrubbers.

**Things.**
- The Yards remake ~100 kg a person a year (daily-life.md). Each pass loses ~0.5–2% to slag, dust, swarf and off-spec parts: 5–20 kg a person parked if residues wait a decade, 0.07–0.3% of the 6.7 t.
- Chemistry recovers most of it cheaply. Plasma-sorting everything at the near-floor ~0.2–0.5 GJ/kg would cost ~3–30 W a person, against the Yards' ~290 W; at today's ~0.7–2 GJ/kg, ~10–130 W.
- Products are designed to come apart, so copper never ends up as a tramp element in iron.

## The outside ledger
### The cold envelope
- **The drum's jacket is a cold trap.** The hull sits inside the jacket's insulating vacuum (energy-budget.md's multilayer insulation on both faces), and the guard cryopanels catch what the hull leaks (The frost). Whatever leaks from the moat's inner face freezes on the jacket's cold outer wall. So the drum's air, and everything inside it, never faces space.
- **So every exit opens into the cold too:** berth vestibules, freight locks, the rotary joints at the front and back caps, pressure reliefs and the jacket's boil-off. Fire dumps go to a dedicated tank inside the cold.
- **Pressurized rooms outside the jacket stay small:** the still side of the back axle, the Windows and their car (ashgrove.md). At a 10⁻³-a-year leak, ~7 × 10⁴ m³ of heliox a drum spends a tenth of the bulk budget; anything bigger gets a cold guard gap of its own.
- **What's left outside the cold** is the moat, radiator fluid, travel shields, vehicle cabins, suits, the Yards and data halls, the raft's frame and the Lantern: a tenth to a quarter of each person's metal, depending on raft size.

### The ledger
| Route | Exposed, a person | Careless | Designed | Rule |
|---|---|---|---|---|
| Cabin air | ~0.15 t of oxygen | ISS-like leaks: ~13 kg a year | ~0, frozen on the cryopanels | The hull sits inside the cold |
| Locks and berths | ~0.54 train departures a year | ISS docking, in heliox: ~0.04 kg a year | ~0 | Vestibules are cryopumped inside the cold |
| Vehicle skins | ~3,100 m² a train | ~0.5–5 g of water a year | ~0 | Trains never breathe cabin air |
| Vehicle cabins | ~9 g of oxygen in trains, ~40–160 g in cycler berths | ISS-like: ~5–15 g a year | ≤0.1 mg a year | Welded, metal-sealed: ≲10⁻⁶ a year |
| Crews outside | Suits and airlocks | ISS: ~0.4 kg of oxygen a spacewalk, in heliox | ≤0.1 mg a year in all | Hard suits; airlocks into the cold |
| The moat | ~0.26 t of water, 0.52 m² | — | ≤0.1 mg a year | Sealed, metal-lined, self-sealing cells; radiolysis recombined |
| Travel shields | ~0.08 t of water | — | ≤0.05 mg a year | Sealed tanks, ~6 × 10⁻¹⁰ a year |
| Radiator fluid | ~2–4 kg; ~3 m² of panel | At 10⁻⁴ a year: 0.2–0.4 g a year | ≤0.1 mg a year | Compartments; leak-chasers; radiolysis traps |
| Solids in the X-ray flood | The raft's frame, rectennas, radiators | Polyethylene shields: 4–16 g of hydrogen a year | ≤0.1 mg a year | Bare carbon, ceramic and metal only |
| Yards and data halls | ~100 kg a year through industry | — | ≤0.1 mg a year | Closed chambers; ≤10⁻⁹ escapes |
| The Lantern | ~70 kg; ~6 m² | — | ~0.002–0.2 mg a year | Mostly blown back onto its own walls |
| The dead | ~0.6–0.8 kg of phosphorus a body | Sent away: 7–10 g of phosphorus a year | 0 | The dead come home |
| Fires | ~11 t of oxygen in a 100 m compartment | Vented overboard | Dumped into a tank in the cold | Nothing vents |
| **Total, heavy elements** | | **~13 kg a year, nearly all air** | **≲1 mg a year** | |

- **Locks.** At the ISS's practice, ~0.3 kg of air lost for each Soyuz or Progress visit (~0.07 kg in heliox terms, which carries a quarter of the heavy elements), raft travel would lose ~0.04 kg a person a year: ~40,000× the budget. The vestibule between hatches is pumped back into the drum and cryopumped inside the cold, so it loses nothing.
- **Vehicles.**
  - **Skins.** A 1,000-seat train's skin carries ~1 g of water for every molecular layer it picks up. So trains wait in plain vacuum berths and passengers board through docking hatches: a train's skin never meets the heliox. (Lining berths with 20 K walls would cost ~120 W a person of cryocooling for the trains' own glow.)
  - **Cabins.** They hold heliox outside the cold: ~9 g of oxygen a person in glide trains and ~40–160 g in cycler berths. Welded, metal-sealed hulls hold them to ≲10⁻⁶ a year, and the capsule docks on cycler trunks, out in the mid-raft, carry cryopanels of their own.
- **Crews outside.** The ISS loses ~1.6 kg of air per US spacewalk, ~0.4 kg in heliox terms. The crews' allotment of 0.1 mg a person, ~20 kg a drum a year, covers ~50 of those. So radiator crews (ashgrove.md) wear hard suits sealed like the drum, cooled by radiators rather than boiling off water as today's suits do, and pass through airlocks into the cold: milligrams a shift.
- **The moat** is the biggest heavy-element inventory outside the cold. Its share, 0.1 mg a year, is ~4 × 10⁻¹⁰ of it, so it's welded and metal-lined, and nothing vents.
  - Radiolysis splits ~0.08–0.21 kg of its water a person a year (habitat-design.md), ~9–23 g of hydrogen. Recombined inside the tank, it costs nothing.
  - Punctures: if self-sealing layers close a hole within a gram (about a second), a nation drum can afford ~20,000 a year; if it bleeds a kilogram before it's patched, ~20.
- **Radiator fluid.**
  - The hull's heat leaves as two-phase ammonia (raft-habitat.md), ~2–4 kg a person, mostly in trunk lines, through panels that must face open sky.
  - Ammonia's nitrogen comes from the living stars, so the loop shares nitrogen's ~0.13 mg budget: under ~5 × 10⁻⁸ of its charge a year. At 10⁻⁴ a year the nitrogen lost would exceed what the whole stream carries. That's what radiator crews are for: every leak they chase is metal.
  - **Radiolysis.** Panels in the X-ray flood take ~1–10 MGy a year, splitting ~1–7 g of N₂ and ~0.2–2 g of H₂ from each kg of ammonia in them. Two-phase loops purge such gas; here the traps send it inside the cold, where it's already a Haber–Bosch feed.
  - **Option: propylene in the panels,** with ammonia kept inside the cold and the heat handed across at the back axle. Propylene is carbon, a Mill product (food-system.md's methanol-to-olefins chemistry), so its losses cost only energy, ~0.25 W per mg: a loop ten times leakier costs a fraction of a watt. The price: ~485,000 kg/s a drum instead of ~135,000 (~970 m³/s of liquid instead of ~220, about the same vapour), ~4% more radiator for the exchanger's ~3 K step, and traps for its radiolytic hydrogen.
  - **Hot loops** (data halls, Yards, rectennas, 350–600 K) sit wholly outside the cold. They run water or sodium, never NaK: potassium has the tightest budget of all.
- **Travel shields: the hydrogen surprise.**
  - raft-transport.md allows water or polyethylene. In the mid-raft's X-ray flood (20–40 W/m²), glide cars, tubes and cycler trunks absorb ~0.2–0.75 W a person.
  - Polyethylene gives off hydrogen at ~3.3 molecules per 100 eV: ~4–16 g a person a year, ~140–580× what the hole eats, emptying the cluster's stripped gas in ~2–8 Myr. Its front 10–30 cm takes ~2–7 MGy a year, enough to embrittle it within about a year.
  - Water splits ~7× less readily, and in a sealed tank it recombines. Shields are sealed water: ~0.08 t a person, held to ~6 × 10⁻¹⁰ a year (0.05 mg), sealed like the moat.
  - The same goes for every polymer in the flood: matrices, insulation and seals give off H₂, CH₄, CO and CO₂ the same way. Exposed structure is bare carbon, ceramic or metal.
- **The Yards and data halls.** Industry outside the drums runs in closed vacuum chambers. Their heat goes to warm condensers and the hot panels; only small, shaded cold stages at their exhausts catch volatiles (a Yard's ~290 W a person landing on 20 K walls would need ~14 kW of cryocooling). At most ~10⁻⁹ of the ~100 kg a person a year may escape.
- **The Lantern.**
  - Inside, the disk's light holds up ~7.5 kg/m² on average (~20 over the poles), so dust shed inward away from the disk plane is pushed back onto the walls. Near the plane the light holds up almost nothing, and what's shed there falls toward the hole.
  - A disk wind carrying ~1% of the light at ~0.1c would sputter loose ~0.002–0.2 mg of atoms a person a year. They're photoionized; whether the light pushes them back out or the hole takes them is open.
  - The outer skin's own glow pushes what it sheds out through the Shade. Its erosion rate is unknown.
- **Fires.** Venting a burning compartment overboard is a spacecraft habit. A 100 × 100 × 4 m compartment holds ~11 t of oxygen, ~55 years of its drum's whole budget. Fire dumps go to a tank inside the cold.

### Hydrogen and helium
- **"Free" means cheap, not unlimited.** The cluster's stripped gas covers fuel and shields for ~750 Myr (matter-delivery.md), and the hole eats ~12–19 mg a person a year. Every milligram a person a year lost is ~5% of today's fuel line.
- So the jacket (2.2 t a person) may lose at most ~4.5 × 10⁻¹⁰ a year, the cabin's helium is pumped home from the guard vacuum, the moat's radiolysis is recombined, and hydrogen-bearing solids stay out of the X-rays.
- **Boil-off can't be vented either.** A 55-day beam cut boils ~4 kg of the jacket a person, about half the ~7.6 kg the survival fuel cells burn with the ~60 kg of banked oxygen, so all of it is used and the rest is drawn from the jacket. energy-budget.md's coolers can pause freely only if nothing vents.

### Where lost atoms go
- **Leaked gas stays in the Shade at first,** ionized by the X-ray leak and mixing into a thin halo. Rafts' fronts sweep it up within ~10⁵ years, and it comes back to whoever remakes them (daily-life.md's ~40 kg a year of infrastructure includes rectennas).
- **But it may not stay.** The X-ray leak can Compton-heat thin gas toward ~3 × 10⁸ K, hot enough to escape the Shade, over a similar ~3 × 10⁵ years. Which wins is open.
- **So a leak is lost to its raft for sure,** and partly its neighbours' windfall. Planning prices all of it as gone, which makes the outside budgets conservative.
- **Haze.** Held for ~10⁵ years, the bulk budget keeps ~35 stray atoms per cm³ in the Shade. A gram a person a year would hold ~35,000, enough to cloud the longer microwave bands (full-swarm.md) if the gas stays cool; a swarm as leaky as the ISS, ~5 × 10⁸.

## Rules
1. **Nothing vents.** Reliefs, purges, boil-off, fire dumps and locks all open into the cold.
2. **Heavy elements live inside a cold envelope, or behind welded, metal-sealed walls.**
3. **Vehicles never breathe cabin air.** People board through cryopumped hatches; freight moves in sealed canisters.
4. **Everything outside the cold has a leak budget:** the moat ~4 × 10⁻¹⁰ a year, shields ~6 × 10⁻¹⁰, cabins ~10⁻⁶, ammonia ~5 × 10⁻⁸. Liquids sit in compartmented, self-sealing cells, and radiolysis gas goes back inside.
5. **No hydrogen-bearing solids in the X-ray flood.** Shields are sealed water; exposed structure is bare carbon, ceramic or metal.
6. **Minerals keep moving:** short pipelines, small floats, 99.9% per pass, residues reprocessed yearly.
7. **No soil, no NaK, and no dissipative uses of scarce elements.** Rare elements carry passports.
8. **The dead come home.**

## Culture and story hooks (proposals)
- **The dead are phosphorus.**
  - A body holds the phosphorus of ~1.3–1.6 t of ore, a fifth to a quarter of a new person's metal.
  - If the swarm sent its dead away, it would use up all the phosphorus in the nuclear disk's living stars in ~850–1,100 years.
  - So bodies go back into the loop, and funerals are about what's kept: a name, a voice, a pinch of ash in glass.
  - Ossuaries are a rich drum's vanity. One that kept its dead for a century would park as much phosphorus as its living carry.
- **The frost.** Frost crews isolate the cryopanels around the hull a bank at a time, warm them and pump the drum's lost air home. Oxygen frost mixed with organics, or ozone, can detonate on warm-up, as in industrial cryopumps: it's the most dangerous chore in the drum.
- **Leak-chasers.** Radiator crews (ashgrove.md) chase ammonia leaks because every milligram outside is nitrogen the living stars can't spare. A crew's pride is grams saved.
- **Parks without soil, lakes kept clear.** Gardens root in inert media, and the Hollow's lake is clear because it's starved.
- **Medicine's loans.** Contrast, gadolinium and lithium are lent and collected; a hospital's drains are a mine.
- **Passports for metal.** Every gram of copper, platinum or neodymium is tracked from fabrication to return, and losing one is a civic offence.

## Knock-on changes
- **matter-delivery.md:** its open question on an element-by-element budget is answered here, and its white-dwarf lines point here.
- **raft-transport.md:** travel shields are sealed water, since polyethylene bleeds hydrogen; trains wait in vacuum berths and never breathe cabin air; cabins are welded and metal-sealed.
- **habitat-design.md:** cryopanels in the guard vacuum around the hull make the jacket the drum's cold trap; the moat is sealed, and its radiolysis is recombined, never vented.
- **food-system.md:** nitrogen that ends as N₂ is caught and re-fixed; the heliox carries almost none.
- **energy-budget.md:** the shield's coolers can pause, but the boil-off is kept, never vented.
- **raft-habitat.md, ashgrove.md:** no edits. Ammonia stays in the panels, held to ~5 × 10⁻⁸ a year; the propylene option is open below.

## Open questions
- **Ammonia or propylene** in the exposed panels: ammonia must lose under ~5 × 10⁻⁸ a year, since its nitrogen comes only from the living stars; propylene's losses cost only energy, but it needs ~4× the liquid flow. Both need radiolysis traps, and the yields for liquid ammonia under these doses need checking.
- **Whether leaked gas comes back** (swept up by rafts) or boils out of the Shade (Compton-heated).
- **The Shade's debris,** which sets puncture rates for the moat, panels, shields and cabins.
- **How lean the mineral loop can be:** the Dark's float against the 55-day reserve, and how little potassium people can live on for two months.
- **The Sun's chlorine,** photospheric 5.50 against meteoritic 5.23, which decides whether chlorine or potassium binds in a comfortable loop.
- **Gas:** whether the bar still feeds the CMZ in the setting's era (matter-delivery.md), which would loosen every budget here.
- **Banking today's surplus** phosphorus and potassium for growth, and whether the build-out used the cluster's white dwarfs.
- **The Lantern:** atoms sputtered inside, matter shed near the disk plane, and the outer skin's erosion.
- **How cheap deep reprocessing gets:** ~0.2–0.5 GJ/kg near the floor, ~0.7–2 today.

## Method
- **Abundances:** Asplund et al. 2009, photospheric where measured, meteoritic for lithium, selenium, iodine, platinum and other elements the photosphere can't give; Z = 0.0134. Neon (9.4% of heavy elements) is left at the source, so shares are of the shipped mix. Chlorine runs from meteoritic (log ε = 5.23) to photospheric (5.50). Lithium and boron are gas values; stars destroy most of theirs.
- **Bodies:** 0.8× a 70 kg reference man (CRC: phosphorus 780 g, ~85% of it in bone; potassium 140 g; sodium 100 g; chlorine 95 g; calcium 1 kg; nitrogen 1.8 kg).
- **Loops:** intake equals excretion: nitrogen 12.8, phosphorus 1.4, potassium 3.5, sodium 3.5, chlorine 5.0, calcium 1.0 g a day (Rose et al. 2015 for nitrogen, phosphorus and potassium). Loop throughput = excreta × 1.2–2.0 for RNA streams, spent media and residues, phosphorus highest. Standing stock in vats, garden and brines: 25–50 g each of phosphorus and potassium, 40–80 g of chlorine, 75–150 g of nitrogen.
- **Needed** = bodies + standing stock + throughput × pipeline time (14 or 60 days) + intake × float (30 or 90 days) + throughput × (1 − recovery) × reprocessing interval (99.9% and 1 year, or 99% and 10 years).
- **White-dwarf limit:** w = 1 − needed ÷ (6.7 t × share). The living stars' shipped metal (the disk's 1.9 × 10⁷ M☉ less neon, ~1.7 × 10⁷, plus ~0.9 × 10⁷ from the inner bulge) lasts until (1 − w) × 6.6 × 10⁶ M☉ × (hole mass ÷ today's − 1) uses it up, with the hole ×1.4 by 150 Myr and doubling every ~0.5 Gyr after (full-swarm.md).
- **Stream and prices:** full-swarm.md's growth table and 6.7 t a person; matter-delivery.md's lifting costs, ×2 for planning. Those are per kg of all heavy elements; per kg shipped they're ~10% higher.
- **Loss budgets:** an element's budget = (1 − w) × stream × share − needed × growth rate, at w = 0.75 and growth 1.4 × 10⁻⁹ a year. Beyond it, each unit lost cuts w by 1 ÷ (stream × share).
- **Cabin gas:** 532 m³ of drum a person at 295 K; 21 kPa of oxygen, 80 kPa of helium. Heliox carries 0.27 kg of heavy elements per m³ against air's 1.18, which scales the ISS figures.
- **ISS:** ~0.6–1 lb of air a day from ~1,080 kg (915.6 m³ pressurized); 0.64 lb per Soyuz or Progress visit, 3.6 lb per US spacewalk, 35.3 lb per Russian (NASA).
- **Travel:** ~325 one-way trips a person a year (the Glide's design peak, a daily round trip for ~45% of residents) in 1,000-seat trains at an assumed 60% load, ~0.54 departures a person a year; ~0.010 seats a person (raft-transport.md); train skin 3,100 m² (100 × 10 × 5 m), cabin ~3 m³ a seat; cycler berths for ~3% of a raft's people at ~5–20 m³ each; one molecular layer of water ~3 × 10⁻⁷ kg/m².
- **Shield radiolysis:** 20–40 W/m² face-on; cars, tubes and trunks ~0.012–0.025 m² face-on-equivalent a person (~0.02–0.04 in a 2 km drum, whose glide fleet was larger per person); 75% absorbed over 10–30 g/cm²; G(H₂) = 3.3 per 100 eV for polyethylene (IAEA), 0.45 for water.
- **Radiators:** ~2–4 kg of fluid a person, mostly trunk lines (~220 m³/s across a 24.5 km cell, whose panels reach ~11.5 km from the axle; ~1–2 kg in a 2 km drum's 13 km cell); panels of 3–10 kg/m² absorbing ~1–3% of the flood; liquid-ammonia radiolysis taken as G(N₂) ≈ 0.25 and G(H₂) ≈ 0.8 per 100 eV (unchecked). Two-phase at 300 K: ammonia 1.17 MJ/kg, propylene 0.33 MJ/kg; 160 GW a drum.
- **Moat:** 0.52 m² a person (0.79 in a 2 km drum); radiolysis 0.03–0.08% a year (habitat-design.md).
- **Lantern:** a wind carrying 1% of the light at 0.1c; sputtering 10⁻⁵–10⁻³ atoms per proton at ~20 u; 6 m² a person.
- **Where lost atoms go:** the Shade at 0.91–1.23 pc; sweeping from raft fronts (3 m² a person) at 10–20 km/s; Compton heating time m_ec² ÷ (4σ_T c U) in 30 W/m² of leak, with a Compton temperature of ~3 × 10⁸ K for a ~100 keV mean.
- **Nitrogen re-fixing:** 25–35% of loop nitrogen through N₂; 7.2–11 MWh a tonne of ammonia (8.8–13.4 kWh per kg of nitrogen); floor 20.1 GJ a tonne.
- **Deep reprocessing:** ~30–75 eV an ion at ~16 u is 0.2–0.5 GJ/kg; today's plasma sources ~100–300 eV an ion.
- **Jacket boil-off:** ~17 W a person of cryocooling at 47 W per W is ~0.36 W of heat leak; 446 kJ/kg of hydrogen. A 2 km drum's ~25 W would boil ~6 kg in 55 days.

## Sources
- Asplund, Grevesse, Sauval & Scott 2009, The chemical composition of the Sun: https://arxiv.org/abs/0909.0948
- CRC Handbook, chemical composition of the human body (via BioNumbers): https://bionumbers.hms.harvard.edu/files/CRC%20Handbook-Chemical%20Composition%20of%20the%20Human%20Body.pdf
- Rose et al. 2015, The characterization of feces and urine: https://www.ncbi.nlm.nih.gov/pubmed/26246784
- NASA, Status of ISS Water Management and Recovery (ICES 2023-097): https://ntrs.nasa.gov/api/citations/20230006217/downloads/ICES%202023-097%20Status%20of%20ISS%20Water%20Management%20and%20Recovery.pdf
- NASA, Trending of Overboard Leakage of ISS Cabin Atmosphere (2011): https://ntrs.nasa.gov/api/citations/20110012997/downloads/20110012997.pdf
- Ad Astra, The ISS is cracking (normal leak ~0.6 lb a day): https://www.adastraspace.com/p/iss-air-leaks-2030
- Phosphorus recovery from sewage sludge ash, review (Journal of Environmental Management, 2023): https://www.sciencedirect.com/science/article/abs/pii/S0301479723014792
- The assessment of phosphorus recovery potential in sewage sludge incineration ashes: https://pmc.ncbi.nlm.nih.gov/articles/PMC9898428/
- Ammonia Energy Association, Haldor Topsoe's solid-oxide electrolyzer (7.2 vs ~10 MWh a tonne): https://ammoniaenergy.org/articles/green-ammonia-haldor-topsoes-solid-oxide-electrolyzer/
- UNFCCC, green ammonia production (9.4–11 MWh a tonne): https://unfccc.int/sites/default/files/resource/A6.4._PMM006_Supplementary_Information.pdf
- Electrolysis-based Haber–Bosch energy use and its thermodynamic minimum (20.1 GJ a tonne): https://www.researchgate.net/figure/Energy-consumption-of-various-electrolysis-based-Haber-Bosch-processes-academic-and_fig3_344163055
- IAEA-TECDOC-1420, Advances in radiation chemistry of polymers (G(H₂) of polyethylene): https://www-pub.iaea.org/MTCD/Publications/PDF/TE_1420_Web.pdf
- Iodinated contrast doses in CT (22.5–30 g of iodine): https://ajronline.org/doi/10.2214/ajr.184.1.01840031
