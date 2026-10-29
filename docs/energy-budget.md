# Energy budget per person

*Design proposal from a working session, Sept 2026. Companion to habitat-design.md, food-system.md, swarm-rings.md, xray-power.md, full-swarm.md, daily-life.md and raft-transport.md. Figures are time-averaged kW of delivered electricity (kWe) per person unless marked "light". Revised Oct 2026: in the full swarm, interactive compute runs on the rafts, not the Lantern (daily-life.md). Revised again Oct 2026: the nation drum is now 3 km in radius (habitat-design.md), which moves ~0.01 kW per person from shield cryocooling to cabs; totals are unchanged. Revised Oct 29, 2026 after a consistency audit.*

## Summary
- A comfortable common life needs **~3.1 kWe per person: ~1.0 inside the habitat, ~0.5 for vactrain travel and ~1.6 remote** (industry, growth, compute). The plausible range runs from ~1 kWe (lean) to ~13 kWe (generous).
- **Ring era (10 M☉ hole):** the hole's X-rays convert at **~22%** with the standard tile (xray-power.md), not the 40% first assumed for sunlight. With 10% for carrying firm loads through knot nights, the common budget needs **~15 kW of light** per person. swarm-rings.md's tables now use 15 kW (they first assumed 10).
- **Full swarm (Sgr A* at 30% of Eddington, full-swarm.md):** hull, travel, industry, growth and interactive compute arrive by microwave beam from the Lantern at ~75%; batch compute runs on the Lantern itself; there are no nights, so the margin drops to 3%. The common budget needs **~4.1 kWe generated and ~12.8 kW of light** per person at ~32% conversion.
- The habitat's own heat load is **~1 kW, not 10**. Radiators shrink from ~12 m² to ~1.2 m² per person (two-sided); in the Shade, where radiators work one-sided, ~2.5 m².
- Food, air and water are the largest in-hull item (~45% of habitat heat). Bright lighting is the largest discretionary one.
- Travel is the one local item that can outgrow everything else. Compute is the one item with no natural ceiling.
- The 10 kW placeholder matches US primary energy per person (9.3 kW in 2024). Only ~3.2 kW of that reaches useful energy services, about the same as the common budget here.
- daily-life.md works through a 2 kWe life: more than half the gap to the common budget is slack (express travel, planning-value food prices, the build-out's growth line).

## Where the heat lands
| Tier | Items | What it sets | Can it pause? |
|---|---|---|---|
| In the hull | Food/air/water, lighting, homes and services, local fabrication, devices, fans and pumps, shield cryocooling, lifts | Habitat radiators and heat plumbing | Mostly firm. Food production and cryocooling can pause for days to weeks |
| On the band | Vactrain track losses | Band area near people, not habitat radiators | Mostly firm |
| Anywhere | Industry, growth, compute | Only the swarm's total population | Yes: these can follow the light and need no night storage |

- Remote loads can go on rings of their own, or along band edges where knot nights are longest. People's stretch of band then carries only firm loads: ~7.5 kW of light per person (common), or ~12 m² of band instead of 23. People pack ~2× denser, and the number of people within a few hours' trip rises about as much.
- In the full swarm, "anywhere" splits three ways.
  - **Batch compute** (research, archives, long simulations) sits on the Lantern, beside the power, and skips the beam losses.
  - **Interactive compute** (assistants, games, shared worlds, the rafts' own services) can't: the Lantern is 0.08–0.43 pc from the Shade, 3 months to 1.4 years each way by light. It runs in data halls on the rafts, on beamed power. Planning puts half the compute line here.
  - **Industry and growth** stay in the Shade, where the metal is, and are beamed like the hull and travel loads.

## Budget
kWe per person, time-averaged.

| | Lean | Common | Generous |
|---|---|---|---|
| **In the hull** | | | |
| Food, air & water (food-system.md) | 0.34 | 0.45 | 0.78 |
| Lighting | 0.05 | 0.15 | 0.60 |
| Homes, public services & robots | 0.10 | 0.20 | 0.40 |
| Local repair & fabrication | 0.03 | 0.08 | 0.20 |
| Personal devices & edge compute | 0.02 | 0.05 | 0.20 |
| Fans & coolant pumps (~5% of heat moved) | 0.03 | 0.05 | 0.11 |
| Shield cryocooling (nation drum) | 0.02 | 0.02 | 0.02 |
| Lifts & in-drum trams | 0.01 | 0.02 | 0.03 |
| **Hull subtotal** | **0.60** | **1.02** | **2.33** |
| **On the band** | | | |
| Vactrain | 0.12 | 0.48 | 3.37 |
| **Anywhere** | | | |
| Industry & recycling | 0.15 | 0.50 | 1.50 |
| Growth (metal and new habitat) | 0 | 0.10 | 0.50 |
| Compute | 0.10 | 1.00 | 5.00 |
| **Remote subtotal** | **0.25** | **1.60** | **7.00** |
| **Total delivered** | **0.96** | **3.09** | **12.7** |
| Habitat share of total | 62% | 33% | 18% |
| Light per person, ring era (22% conversion) | 4.7 kW | 15 kW | 60 kW |
| Light per person, full swarm (32%, beamed; half of compute on the rafts) | 4.1 kW | 12.8 kW | 52 kW |

## Line notes
- **Food, air & water:** from food-system.md (ration, common and generous diets). ~15% of the common total but ~45% of the habitat's heat.
- **Climate control:** no heating is ever needed. Waste heat always exceeds losses, so a habitat only ever sheds heat.
  - Cooling is fans and liquid loops carrying heat to radiators, ~5% of the heat moved.
  - Hot water comes free from waste heat, e.g. the 60–70 °C thermophilic vats.
- **Lighting,** at 250 lm/W:
  - Interiors (100 m² at ~200 lux average): ~45 W.
  - The Hollow's sky in a nation drum at full-sun brightness (100,000 lux, 12 h/day): ~30 W per person, because there's only ~0.18 m² of it per person (raft-habitat.md's sunline, which stops short of the end walls; ~50 W in a 2 km drum with a full-length line).
  - Parks are the expensive part. Every 10 m² at overcast-daylight brightness (10,000 lux, 12 h/day) costs 0.2 kW. Generous ≈ 25 m² of daylit park per person.
  - Light is the luxury. Garden herbs and orchard trees in bright parks get their light for free (food-system.md).
- **Shield cryocooling (new):** holding the LH₂ jacket at 20 K against ~0.3 W/m² leaking through multilayer insulation on both faces, with coolers at 30% of Carnot.
  - ~17 W per person in the 3 km nation drum (~25 W in a 2 km drum), ~100 W in a town drum, ~6 W in a world drum. Like rock shielding, it favors big drums.
  - If the coolers stop, the shield takes ~80 years to boil off. They can pause only as long as the boil-off can be used or stored, since nothing vents (element-cycles.md): a 55-day cut's ~4 kg a person goes to the survival fuel cells.
- **Homes, services & robots:** an efficient modern household uses ~0.1 kW per person once heating and cooling are removed. Add schools, hospitals, shops, offices and service robots.
- **Lifts and cabs:** rim to axis takes ½ × (rim speed)² per kg, ~15 kJ/kg in a nation drum (~1 MJ for a rider, ~5 MJ with a share of the cab), and nearly all of it comes back on the way down. Drag is the real cost: drum-transport.md's cabs need ~7–12 W per person in the 3 km drum (~4–7 in a 2 km one), more where trips stay inside a big drum instead of taking the free Glide.
- **Industry & recycling:** reprocessing 1% / 2% / 4% of each person's ~6.7 t of heavy elements per year, at 60 / 110 / 170 MJ/kg, gives 0.13 / 0.47 / 1.4 kW.
- **Growth pays mostly for metal.** A new person's habitat costs ~0.75 TJ to build (6.7 t at ~100 MJ/kg, plus 2.2 t of LH₂ at ~30 MJ/kg), but gathering their 6.7 t of heavy elements from stars costs ~25–55 PJ, ~50,000× more (matter-delivery.md).
  - Metal arrives slowly, so growth is slow. During the build-out from 3% to 30% of Eddington it runs ~2 × 10⁻⁸ a year; after that the hole is held at 30% and the civilization grows with it, ~1–4 × 10⁻⁹ a year (doubling every ~0.5 Gyr once the hole has spun up; full-swarm.md).
  - Gathering that metal costs ~0.1 kW per person at the start of the build-out, when the population is small, and a few watts once growth tracks the hole.
  - The common value keeps 0.10 kW, which covers the build-out; in the mature swarm most of it is slack.
  - An early draft assumed 0.4%/yr growth. That would need ~18,000 M☉/yr of metal, ~450,000× what the frontier delivers.
- **Compute:** US data centres use ~60 W per person (2024) and are heading for ~140 W by 2030 (IEA base case). The world average is ~6 W.
  - The 1 kW common value is a guess for an AI-saturated economy.
  - It's the only line that could make 10 kW look small, and the obvious thing to put on remote rings, or on the Lantern.
  - Latency limits where it can go. Interactive use needs its data halls within a few thousand km of the user (a hundredth of a second by light); work that can wait can go anywhere.
  - In the full swarm each kWe moved from the Lantern to a raft costs ~1.2 kW more light, for beam losses.

## Travel
Vacuum maglev per swarm-rings.md: 400 kg per seat, 1 g, 3% of kinetic energy lost per trip, 20 km/s cap.

**On a raft in the Shade** (raft-transport.md), ~1% is the planning loss and 3% the conservative case. Hops between neighbouring drums are free glides from rim to rim, and long trips ride cyclers, where only a ~200 kg capsule is sped up. The common pattern below costs ~0.16 kW at 1%.

| Trip (fastest schedule) | Distance | Peak speed | Energy lost |
|---|---|---|---|
| 2 min | 35 km | 0.6 km/s | 2 MJ (0.6 kWh) |
| 10 min | 880 km | 2.9 km/s | 52 MJ (14 kWh) |
| 30 min | 7,900 km | 8.8 km/s | 470 MJ (130 kWh) |
| 1 h | 32,000 km | 17.6 km/s | 1.9 GJ (520 kWh) |
| 68 min or longer | 41,000 km and up | 20 km/s (cap) | 2.4 GJ (670 kWh) |

- Flat out at 1 g, each km costs ~60 kJ (16 Wh) per seat, so energy scales with distance until the cap.
- A long trip costs ~9 days of a person's common budget, or ~4 weeks of their in-hull energy.
- Slower schedules are far cheaper: 1.25× the fastest time cuts energy 4×, 1.5× cuts it ~7×, and 2× cuts it ~14×. Express vs. economy is a real price difference.
  - Energy goes with the square of top speed, not with distance: once at cruise a vacuum maglev coasts free. A sleeper at 2 km/s costs 6.7 kWh per trip at any length (daily-life.md).
- Scenarios:
  - Lean: one long trip a year (one-way) plus a 10-minute round trip each month → 0.12 kW.
  - Common: two long round trips a year plus a 10-minute round trip each week → 0.48 kW. The same trips at economy speeds cost ~0.06 kW.
  - Generous: a long round trip each month plus a 30-minute round trip each week → 3.4 kW.
- The trap:
  - A daily 10-minute hop each way costs 1.2 kW, more than the whole habitat.
  - An hour a day in transit, as people have tended to spend across eras and cultures, would cost 10.8 kW flat out (2.7 kW on an economy schedule).
  - So daily life has to stay inside the drum, and long travel has to be priced or rationed.
    - On a raft, glides to neighbouring drums are free (raft-transport.md), so daily life can spill a few drums out.
- Track losses heat the band (or the raft), not the habitat.

## From electricity to light and band area (ring era)
| | Lean | Common | Generous |
|---|---|---|---|
| Light per person: skins only 13% / standard tile 22% / heavy tile 25% | 7.9 / 4.7 / 4.1 kW | 25 / 15 / 13 kW | 102 / 60 / 53 kW |
| Population vs. 10 kW of light (22%) | ×2.1 | ×0.68 | ×0.17 |
| People-band light, firm loads only (22%) | 3.6 kW | 7.5 kW | 28.5 kW |
| People-band area per person | 5.6 m² | 11.7 m² | 45 m² |

- Firm loads (hull and travel) carry a 10% overhead for knot-night storage or transmission. Flywheels need less; hydrogen storage needs more. Remote loads need none.
- Conversion figures are from xray-power.md: a silicon-carbide X-ray-voltaic skin in front of a 2 mm iron plate driving Stirling engines. Skins alone (13%) save ~0.6 t of metal per person; a 10 mm plate (25%) costs 1.3 t more.
- **Full swarm:** the Lantern generates ~4.06 kWe per person for the common budget: 0.5 of batch compute used on the spot, plus 2.59 kWe of beamed loads (hull, travel, industry, growth and 0.5 of interactive compute) × 1.03 margin ÷ 0.75 beam chain. At ~32% that's ~12.8 kW of light (full-swarm.md). With all compute on the Lantern it was 3.88 kWe and ~12.2 kW.

## Heat and radiators
- At 300 K, two-sided, emissivity 0.9, radiators shed ~830 W/m²: ~1.2 m² per person (common), 0.7 (lean), 2.8 (generous). The old 10 kW needed 12.
- A world drum sheds ~7 TW through radiators reaching ~46 km from the drum (was 70 TW over ~165 km). A nation drum's reach is ~8 km (was ~28). Heat no longer limits drum size.
- Heat pumps to run radiators hotter aren't worth their power at these loads.
- **In the Shade,** the Lantern's warm skin fills part of the sky, so rafts radiate only from their backs, in the shadow of their fronts (full-swarm.md). One-sided at 300 K, a radiator sheds ~410 W/m²: ~2.5 m² per person for the common hull load, 1.5 (lean), 5.6 (generous). Beam, industry and data-hall losses radiate hotter from the raft's structure.

## Knot nights (ring era; correction to swarm-rings.md)
- **The full swarm has no knot nights.** Power arrives by beam, and storage covers only hours of outage. A total cut is survived on a reserve: fuel cells burning shield hydrogen with banked oxygen carry ~50–100 W per person of air handling for up to the air's ~55-day oxygen margin (full-swarm.md). Glow sails, heat engines run on the Lantern's own waste heat, can stretch that indefinitely at a ration level of ~0.4 kW per person, except near the disk plane (governance.md).
- **This section describes the orange slice around a 10 M☉ hole.** claude/ring-weave.md offers a woven layout where eclipses last about an hour (worst ~21 hours at 10²²) and storage falls to ~15–30 kg of flywheel per person, at the cost of ~27% of the light. Around a mid-sized hole (claude/hole-choice.md), orange-slice nights last only hours.
- Away from the interchange line, neighboring bands overlap as seen from the hole. Each band is lit only along a strip on one edge; the rest sits in the shadow of the next ring in. At angle θ from the interchange line the lit share of each band is cos θ, and the lit strip switches edges at each knot.
- So a habitat's shadow depends on where it sits across the band:
  - Mid-band: lit 2/3 of the time, in two nights per orbit of 1/6 orbit each.
  - Near the edges: lit ~1/2, in two nights of up to 1/4 orbit each (~0.23 in the simulation, which the table uses).
  - Band average: 2/π ≈ 64%, as swarm-rings.md says.
- Checked by direct simulation of 200 nested rings.

At 15 kW of light per person and 1 kW/m²:

| Swarm population | 10²¹ | 10²² | 10²³ | 10²⁴ |
|---|---|---|---|---|
| Orbit | 12.8 d | 72 d | 1.1 yr | 6.2 yr |
| Night, mid-band / edge | 2.1 / 2.9 d | 12 / 17 d | 68 / 93 d | 1.0 / 1.4 yr |
| Flywheel to carry 0.7–1 kW (3 MJ/kg) | 40–85 kg | 240–480 kg | 1.4–2.7 t | 8–15 t |

- The deep knot (≥10 layers) is only the bottom of a much longer night.
- Getting through a night:
  - The food plant can pause for up to the ~55-day O₂ margin (food-system.md), then run 1.5–2× by day. Cryocooling can pause too. That leaves ~0.7 kW of firm load.
  - Up to ~10²², flywheels are affordable: 3–7% of the ring era's ~7.4 t heavy-element budget.
  - At 10²³ and above, storage is too heavy, and ~21% of the ring's energy must move along the ring from lit to dark stretches. The vactrain tracks are the natural power line.
- Interruptible loads belong where nights are longest: band edges and dedicated rings.

## Earth anchors
- US 2024: 94.2 quads of primary energy = 9.3 kW per person. 61.5 quads were rejected as waste heat, leaving ~3.2 kW of useful energy services (LLNL).
- Data centres: 415 TWh worldwide in 2024 (~6 W per person worldwide, ~60 W per person in the US), ~945 TWh by 2030 (IEA base case).

## Open questions
- Settled: ~12.8 kW of light per person in the full swarm, with half of compute on the rafts (full-swarm.md); the ring-era tables (swarm-rings.md and the knot-night table above) now use ~15 kW.
- Compute per person. Minds stay biological in this setting (governance.md). If they ran as software, a digital person's watts against a biological person's ~12.8 kW of light would set a sharp exchange rate (economy.md). Batch compute lives on the Lantern; interactive compute has to sit within a few thousand km of its users. How the line really splits between them is open (planning: half each).
- How long-distance travel is priced or rationed.
- Ring-era knot-night strategy: see claude/ring-weave.md. Along-ring lines can't fix the deep knot, where habitats can't shed heat; weaving can, at a cost in light. Which layout wins depends on hole size and swarm size.
- Settled in matter-delivery.md: gathering heavy elements costs ~4,000–8,000 GJ per kg from stars (minimum), or ~0.01–0.1 GJ per kg to process gas plus up to ~60 to collect it, so a new person's metal costs ~25–55 PJ from stars.

## Sources
- LLNL, 2024 US energy flow chart: https://flowcharts.llnl.gov/
- IEA, Energy and AI (2025), energy demand from AI: https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai
- IEA, Energy and AI, executive summary: https://www.iea.org/reports/energy-and-ai/executive-summary
