# Food system: the Mill, the Vats, and the Garden

*Design proposal from a working session, Sept 2026. Companion to habitat-design.md and cuisine.md (what the kitchens make, sample days, calendar and culture). Figures are per person. "Efficiency" means electricity → food energy, including core processing. Values are far-future planning figures unless marked "today" or "best case". Best case means extraordinary-effort efficiencies, counted per calorie eaten (cuisine.md). In the mature civilization (full-swarm.md) power arrives by beam and there are no nights. Revised Oct 29, 2026 after a consistency audit.*

## Summary
- A person eats ~2,200 kcal/day ≈ 107 W. The common diet needs **~0.45 kW of electricity per person** (10.9 kWh/day). A ration floor is ~0.34 kW; a generous diet ~0.78 kW.
- At best-case efficiencies the common diet falls to ~0.33 kW (8.0 kWh/day), and an all-Mill day to ~0.23 kW (5.5 kWh/day). See cuisine.md.
- The same calories from LED-grown plants would take ~3.5 kW even with far-future tech (~11 kW today). Making bulk calories by chemistry is the whole game.
- Three tiers, each roughly an order of magnitude costlier per calorie than the one before:
  - **Mill** (abiotic chemistry), ~45–48%: starch, sugar, fat. About two-thirds of calories.
  - **Vats** (microbes, fungi, cell culture fed by the Mill), ~10–35%: protein, texture, dairy/egg/meat, essential oils, flavor. About a third of calories.
  - **Garden** (LED photosynthesis, plus any animals), ~3–5%: crisp produce, herbs, whole foods. About 2% of calories but ~17% of food power.
- The food plant is also the air plant. Its electrolyzers make ~1.2 kg O₂/person/day, of which ~0.65 kg is breathed.
- Equipment plus a 90-day reserve ≈ 0.1–0.2 t/person, inside the 0.35 t allocated in habitat-design.md.

## Design rules
- Every pass through a living cell loses roughly half the energy; photosynthesis loses ~95%+. So:
  - chemistry makes the bulk calories;
  - microbes are used where they add protein, texture or flavor that chemistry can't;
  - photosynthesis and animals are kept for what nothing else can make.
- Anaerobic fermentation is the exception: yeast and lactic bacteria keep ~95% of the sugar's energy, so leavening, brewing and souring are Mill-grade.
- Turn electricity into a safe, storable liquid first, and keep hydrogen/oxygen mixtures out of the vats.

## Flow
```
Electricity
 ├─ Electrolysis → O₂ (to the air) + H₂
 │    └─ H₂ + CO₂ → METHANOL (tank farm = battery + granary)
 │         ├─ Mill: sugars & starch; fats
 │         ├─ Vats: methanol-fed bacteria (protein), yeast (precision proteins)
 │         └─ Mill sugar → sugar-fed Vats: fungi, oils, algae, plant & animal cells, brewing
 └─ LEDs → Garden: produce, herbs (animals, if any, eat vat feed)
Waste → supercritical-water oxidation → CO₂, water, nitrogen, salts → back to the start
```

## Feedstocks
| Feedstock | Source | Role |
|---|---|---|
| H₂ + O₂ | Water, by heat-integrated solid-oxide electrolysis (~90%); ~150 g H₂/day | Root energy carrier. The O₂ goes to the habitat air |
| CO₂ | Exhaled air (~0.76 kg/day), vat off-gas, oxidized waste | Carbon |
| **Methanol** | CO₂ + 3H₂ over copper/zinc catalysts (~82% of the H₂ energy); ~0.8 kg/day | **Main food feedstock.** Liquid, storable, pumpable |
| Sugars and starch | Methanol, in the Mill | Bulk carbohydrate; feed for sugar-fed Vats |
| Fats | Methanol, in the Mill | Bulk fat |
| Ammonia | Urea from urine; small electrochemical top-up | Nitrogen for the Vats |
| Minerals | Recovered from oxidized waste | P, K, Ca, Mg, Fe, Zn, I, Se, NaCl |

Why methanol and not the alternatives:
- **Methanol** is the most efficient route to edible biomass demonstrated at scale.
  - ICI's Pruteen got 0.52 g of biomass per g of methanol (~45–50% of its energy) and ran at 50–60 kt/yr in the 1980s. China announced a 10,000 t methanol-protein demonstration in 2024.
  - Methanol can also run fuel cells, so the tank farm doubles as the habitat's battery.
  - The cost is toxicity: it needs a real safety culture around "wood alcohol". Each person's share of the plant handles a dozen or more lethal doses a day, and it is the obvious bootleg feedstock if ethanol is taxed or rationed (see Risks).
- **Hydrogen fed directly to knallgas bacteria** is the simplest route: one step, and Solar Foods produces it commercially today. But the cells burn ~7–8 H₂ per CO₂ fixed (~15–25% electricity→food today), and H₂/O₂ mixtures in the vats are a blast hazard. It's kept as a backup and for small habitats and ships.
- **Methane** is out: the Sabatier step discards ~20% of the hydrogen's energy as heat, and methanotrophs are oxygen-hungry.
- **Acetate** is non-toxic, but electrochemical production is ~39% efficient today and the streams are dilute. Niche use: vinegar and a few cultures.

## Tier 1: the Mill (abiotic chemistry)
Each chain is electrolysis (90%) × methanol synthesis (82%) × a downstream step. Best case, with extraordinary engineering effort: ~65–70% for sugar, starch and fat, ~55% for amino acids.
- **Sugar and starch** (~45% overall; downstream ~61%, recovering the hydrogen released when methanol is dehydrogenated to formaldehyde).
  - Enzyme cascades build C₃ → C₆ sugars, then glucose, fructose, sucrose, lactose, rare sugars, and starches with tunable amylose/amylopectin: glutinous to firm, plus resistant starch as fiber.
  - Descends from the 2021 cell-free CO₂→starch work. This is the most speculative piece and the biggest lever.
- **Fat** (~48%; downstream ~65%).
  - Methanol → ethylene → Ziegler-type chain growth gives the same even-numbered straight-chain fatty acids nature makes, unlike Fischer–Tropsch's odd and branched mix.
  - Triglycerides are built to spec: butter-style (with short-chain acids for flavor), cocoa-butter equivalent, frying and baking fats, MCT.
  - Z-selective catalysis makes oleic acid for olive-style oils. At best case, precise synthesis also makes linoleic and α-linolenic acid, shrinking the oil vats to a DHA line.
  - Saturated fat is held near 10% of calories.
- **Amino acids** (~35% planning estimate; ~55% best case). Chemical synthesis plus enzymatic resolution to the L forms (industrial since the 1960s). They make an all-Mill diet nutritionally complete: sweet-savory nonessential amino acids in cooking, and the nine bitter essential ones as a table condiment ("the Nine", cuisine.md). At best case they are the cheapest protein in the system.
- **Small molecules**: vitamins, acids (acetic, citric, lactic), aroma compounds, caffeine. Negligible tonnage.
- **Possible later Mill products** (cuisine.md): fibers and gums, periodic proteins such as gelatin, and ribosome reactors (cell-free protein synthesis, ~46% best case). If ribosome reactors work, most precision-fermentation products move from the Vats to the Mill.

## Tier 2: the Vats (biology fed by the Mill)
| Culture | Feed | Products | Efficiency | Best case, per kcal eaten |
|---|---|---|---|---|
| Methylotrophic bacteria | Methanol | Protein flour (~70–80% protein); extruded fibrous "chicken"; curds; surimi; protein for pasta and bread | ~35% | ~35% (45% combustion basis) |
| Methylotrophic yeast (*Komagataella*/Pichia) | Methanol | Precision-fermented casein, whey, egg proteins, gelatin, gluten, myoglobin, rennet | ~15% | ~20% |
| Filamentous fungi | Sugar | Mycoprotein; sliceable mycelium steaks and bacon; koji; tempeh-style cakes | ~25% | ~27% |
| Oleaginous yeast, thraustochytrids | Sugar | Essential omega-6/omega-3 oils incl. DHA; lecithin | ~25% | ~44% |
| Dark-grown microalgae | Sugar | "Greens" purées and pastas; pigments (lutein, blue phycocyanin); β-glucan | ~20% | ~30% |
| Plant cell culture | Sugar | Cocoa, coffee, tea, berry and fruit purées | ~20% | ~30% |
| Animal cell culture | Sugar + amino acids + fermented growth factors | Cultivated meat, fish and fat, mostly blended with mycelium | ~10% | ~20% |
| Brewing and culturing organisms | Sugar, other products | Bread, beer, wine, spirits, yogurt, cheese ripening, pickles, vinegar, kombucha, bacterial cellulose (nata de coco) | ~43% (95% of Mill sugar) | ~64% |
| Mushrooms | Residues: spent mycelium, garden stalks, spent coffee grounds | Oyster, shiitake, king oyster, lion's mane | Residue-limited (~20–30 g fresh/day) | — |
| Knallgas bacteria (backup) | H₂ + O₂ + CO₂ | Protein flour | ~30% | — |

- Chain efficiencies:
  - methanol-fed bacteria: 0.74 (electricity→methanol) × 0.55 (biomass yield) × 0.87 (RNA removal, drying);
  - sugar-fed cultures: 0.45 × 0.45–0.55.
- **Accounting note:** protein's food energy (4 kcal/g) is only ~70% of its combustion energy, because the nitrogen leaves the body as urea. Microbial yields are quoted on combustion energy, so the planning figures for protein-heavy lines are 25–30% optimistic per calorie eaten. Corrected, the common diet needs ~+35 W and the ration ~+15 W. No ranking changes. Best-case figures are already per calorie eaten.
- At best case, the Mill's amino acids (55%) are cheaper protein than any living cell (20–35%). The Vats sell texture and flavor, not nutrition.
- Microbial biomass is RNA-rich. An RNA-reduction step, as Quorn uses, keeps nucleic acids under ~2 g/day to avoid uric acid, gout and stones.
- Thermophilic strains (60–70 °C) are preferred: fewer contaminants, and they reject heat hotter, which cuts radiator area ~⅓ versus 37 °C cultures. Their waste heat also supplies the kitchens' hot water.
- Precision fermentation is small in tonnage but big in cuisine: real cheese needs casein, meringue needs egg white, gummies need gelatin, and open-crumb bread and chewy noodles need gluten. On a Western-style day it is the Vats' biggest energy line, bigger than meat (cuisine.md).
- Spent precision-fermentation yeast becomes yeast extract, the umami base, much as Marmite began as a brewery by-product.
- Mushrooms beyond the residue supply cost about as much as Garden produce.

## Tier 3: the Garden
- LED hydroponics at ~3% electricity→food including climate control (today ~1%; best case ~5%). This assumes:
  - red-weighted LEDs near their ~5.5 µmol/J physical limit (today 3.9–4.3);
  - compact engineered crops;
  - high-CO₂ (optionally low-O₂) enclosures to suppress photorespiration.
- At that efficiency lettuce costs ~6 kWh/kg fresh (today's farms: 10–18; technical potential: 3–7).
- Crops are chosen by flavor per watt and by what chemistry can't fake: herbs, greens, microgreens, tomatoes, peppers and chilies, cucumbers, strawberries, alliums, tea.
  - Grains, pulses and nuts are low value per watt and reserved for ritual.
  - Tree fruit (~1.5%; ~2.5% best case) is a delicacy.
  - Herbs are the cheapest Garden food per dish: 5 g a day costs ~1–2 W. The herb pot is the last of the Garden to go dark.
- **Animals, if kept:** fish or hens on vat feed, ~3–6% depending on species. The energy math puts them in the same luxury tier as fresh produce. Whether to keep them at all is a cultural and ethical call.
- **Dual-use light:** if the parks or the Hollow's sky are brightly lit for wellbeing, herbs and orchard trees there get their light for free.
- **No natural light anywhere.** The ring era's starved hole shines in the submillimetre (a 10 M☉ hole would shine in X-rays) and the fed hole in extreme UV, and in the full swarm nobody in the Shade sees the disk at all. Every garden runs on lamps.
- Produce is the one food worth trading between habitats on the same raft. Between rafts, which pass each other at 100–300 km/s, goods almost never move; recipes and culture genomes travel by laser instead (full-swarm.md).

## Per-person energy budget
| | Ration | Common | Generous |
|---|---|---|---|
| Intake, kcal/day | 2,200 | 2,220 | 2,400 |
| Mill / Vats / Garden, kcal | 1,570 / 630 / 0 | 1,430 / 750 / 40 | 1,250 / 950 / 200 |
| Production, W | 267 | 378 | 684 |
| Total, W (incl. 5% waste, 25 W air/waste loops, 30 W kitchens) | 336 | **452** | 775 |
| kWh/day | 8.1 | 10.9 | 18.6 |
| Garden share of production power | 0% | 17% | 41% |

- Common diet, kcal → W:
  - Mill: carbs 950 → 102; fats 480 → 48.
  - Vats: omega oils 150 → 29; bacterial protein 250 → 35; fungal foods 150 → 29; precision proteins 80 → 26; cultivated meat 60 → 29; plant cells 40 → 10; algae 20 → 5.
  - Garden: produce 40 (≈200 g) → 65.
- At today's efficiencies (where they exist), the common diet needs ~1.0 kW and the generous diet ~1.9 kW.
- At best-case efficiencies, the common diet needs ~0.33 kW (8.0 kWh/day; Garden 15% of production). A Mill-table day (Mill, ferments, amino acids, herbs) needs ~0.23 kW (5.5 kWh/day). Sample menus with per-meal costs are in cuisine.md.
- If the sugar mill only reaches 30%, the common diet rises to ~0.5 kW.
- Everything scales linearly with intake.
- Against energy-budget.md's ~3.1 kWe common budget, food is ~15% at planning values and 7–10% at best case. On the ~1 kWe lean budget it is a quarter to a third.

## Energy per serving
A common-table day is 10.9 kWh at planning values and ~8.0 kWh at best case. "—" means not re-priced.

| Item | kWh (planning) | Share of a day | kWh (best case) |
|---|---|---|---|
| Herbs (5 g) | 0.05 | <1% | 0.03 |
| Pat of butter (10 g) | 0.17 | 2% | 0.12 |
| Cup of cell-culture coffee | 0.23 | 2% | 0.15 |
| Vat egg (70 kcal) | 0.41 | 4% | — |
| Slice of cheese (30 g) | 0.44 | 4% | 0.33 |
| Pint of beer | 0.57 | 5% | 0.38 |
| Chocolate bar (50 g) | 0.84 | 8% | 0.59 |
| Tomato (120 g) | 0.85 | 8% | 0.50 |
| Side salad (150 g) | 0.97 | 9% | 0.59 |
| Bowl of noodles in broth (500 kcal) | 1.36 | 13% | 0.96 |
| Hybrid burger patty | 1.37 | 13% | — |
| Hen's egg | 1.63 | 15% | — |
| Bottle of gin (700 mL) | 4.2 | 39% | 2.8 |
| Farmed fish fillet (150 g) | 4.65 | 43% | — |
| Cultivated steak (200 g) | 5.81 | 54% | 2.91 |
| Orchard apple | ~7.4 | ~68% | ~4.4 |

A salad costs about as much as a bowl of noodles. Beer is cheaper than a tomato. An orchard apple costs more than a steak, or a bottle of gin. The ordering holds at best case. More items (ramen, pizza, tiramisu, mycelium steak) are priced in cuisine.md.

## What the kitchens can make
Detailed menus, techniques and sample days are in cuisine.md.
- **Cheap (Mill-grade):** starch noodles and jellies, extruded "rice", mochi, tapioca pearls, starch-and-HPMC loaves, crackers and fried snacks, confectionery, compound chocolate, non-dairy ice cream, cream sauces, soups, stews. Ferments cost almost nothing extra.
- **Vat-grade:**
  - wheat-style baking: open-crumb bread, laminated pastry and chewy noodles need gluten from precision fermentation. Flour is only ~12% protein, so bread costs ~1.3× a Mill cracker per calorie;
  - dairy and egg: real cheese, yogurt, custard, meringue, gelatin desserts, scrambled and baked "egg";
  - meat and fish: sausages, burgers, nuggets, pâté, mycelium steaks, fibrous chicken-style protein, surimi, cultivated sashimi. Species flavor lives mostly in the fat, so a few grams of cultivated fat on a mycelium or protein-flour base reads as that animal;
  - ferments: miso and soy-sauce analogs (protein + koji), fish-sauce analogs.
- **Flavor toolkit:** Maillard reaction flavors, yeast extract and nucleotides (umami), synthesized aromas (vanillin, fruit esters, allium, smoke), cultivated animal fat as a meatiness booster, fresh Garden herbs.
- **Infeasible or luxury-only:**
  - turgor crunch and juicy cell structure (raw apple, celery, grapes, citrus segments);
  - bone-in, skin-on or marbled whole cuts, and whole fish;
  - natural kernels (brown rice, beans, nuts, popcorn), with extruded "rice" and roasted protein-fat "nuts" standing in;
  - shell eggs with a separate yolk.
- Crunch comes from the fryer and oven, not the field.
- **Cooking heat:** boiling a liter from the vats' 65 °C waste-heat water takes ~0.045 kWh (0.10 kWh from cold). A big pot held at a rolling boil costs about a third as much as the noodles in it, so lids, pressure cookers and one-pot methods are the norm.

## Nutrition safeguards
- Vitamins come from fermentation or synthesis. With no sunlight, vitamin D is mandatory: D₃ from engineered yeast, or D₂ from UV-treated fungi.
- **Thiamine goes in everything basic.** Mill starch, sugar and ethanol carry none, so a heavy drinker on Mill food is at high risk of Wernicke's. Fortify salt, staples and the amino-acid condiment, as Australia has fortified bread flour since 1991. Fortifying alcohol itself is worth considering.
- Protein: at least ~60 g/day with ~20 g of essential amino acids. On an all-Mill diet these come as free amino acids. Pellagra (fat, starch and sugar with too little protein and niacin) is the historical warning.
- DHA: ~0.5 g/day from the oil vats, well under 1 W.
- Fiber target ~30 g/day: resistant starch, fructans, bacterial cellulose, fungal chitin-glucan, algal β-glucan. Live-culture ferments support the microbiome.
- Whole-food diversity (Garden, plant cells, algae, fungi) is kept as insurance. Diets built from purified components have a history of late-surfacing gaps: essential fatty acids, selenium and trace metals in long-term TPN.

## Life-support integration
- **Oxygen:** electrolyzers make ~1.2 kg O₂/person/day. About 0.65 kg is breathed; the rest goes to aerobic vats and waste oxidation. Making food and regenerating air are the same process.
- **Carbon:** exhaled CO₂ (~0.76 kg/day) and vat off-gas go back to methanol synthesis. Waste is fully mineralized, so food is rebuilt from molecules, never "recycled".
- **Nitrogen:** urea → ammonia → Vats. Nitrogen that waste oxidation turns into N₂ is caught and re-fixed as ammonia (~2–4 W a person), and the heliox is held under ~10 Pa of N₂ (element-cycles.md).
- **Heat:** ~0.35 kW of process heat plus ~0.1 kW released by people needs ≈0.4–0.55 m² of 300 K radiator per person (about twice that one-sided, as in the Shade). Hot steps are heat-integrated, and thermophilic vats shrink their share.
- **The hydrogen shield is not free food.**
  - Every calorie eaten turns oxygen into water; only electrolysis turns it back.
  - In a prolonged power shortfall, the usable O₂ margin runs out before a 90-day food reserve does: 21→16 kPa ≈ 36 kg ≈ 55 days. At the end of that margin the air is about as thin as Mexico City's.
  - So emergency power goes to the electrolyzers first (their H₂ can be banked in the shield), and the Garden is dimmed first.
  - In the full swarm this margin sets how long a raft survives a total beam cut (full-swarm.md), unless it carries glow sails: heat engines on the Lantern's own glow that can run a ration diet indefinitely, away from the disk plane (governance.md). Air handling still needs ~50–100 W per person, from a survival reserve of fuel cells burning shield hydrogen with ~60 kg of banked oxygen each. Fuel cells must not draw on the cabin's oxygen, or they eat the margin.

## Mass and floor space (common diet)
- Vats: ~10–12 L working volume (~20 L with turnaround and redundancy); ~30–60 kg with broth and ancillaries.
- Mill: ~10–20 kg.
- Garden: ~1 m² of growing area in stacked racks (~0.25 m² of floor); ~30–50 kg.
- Reserve: 90 days of dry goods ≈ 45 kg.
- **Total ≈ 0.1–0.2 t/person** vs the 0.35 t allocation. The slack buys a larger reserve; gardens are limited by power, not mass.
- Floor space ~0.5 m² per person, on the rim decks.

## Risks and story hooks
- **Blights are phages, not droughts.** A phage or contaminant sweeping through monoculture vats is this civilization's famine. Core infrastructure includes strain libraries, phage-resistant lines, and several organism families per product. Starter lineages become heirlooms.
  - A blight takes out one line, not the calories. The Mill carries the day while the line regrows from library stock: ~27 doublings from vial to vat, so ~3 days for protein flour, about a week for yeast and fungi, a month or more for animal cells, plus sterilization.
  - Each line has a fallback "blight menu" from the Mill: free amino acids for protein flour, starch loaves and custards and coconut-style "blight cheese" for precision proteins.
  - Real precedents: phage is the classic cause of failed dairy fermentations, and in 2009 a vesivirus in Genzyme's hamster-ovary cell plant halted Cerezyme and Fabrazyme production.
  - Switching organism families changes the taste (Fusarium vs Neurospora mycoprotein), so blight years become vintages.
- **The gin problem.** Ethanol is nearly free: a standard drink costs ~0.2–0.3 kWh, and a bottle of gin less than an orchard apple. Taxing or rationing it invites bootlegging, and the bootlegger's easiest feedstock is the food plant's methanol. Each habitat has to choose between cheap alcohol and methanol poisoning.
- **Night and the food calendar.** This civilization's winters came in the layer era: a 0.1 AU raft's typical eclipse, ~16 days at 3% of Eddington (sgr-a-scope.md), fits the ~55-day O₂ margin, so the food plant can pause and the habitat eats from its larder. Its ring era, around the starved Sgr A\*, had knot nights of hours to a couple of days (hole-choice.md). In the 10 M☉ ring design study, a ~5 × 10²² ring swarm (15 kW of light per person) has mid-band knot nights of ~40 days, a true winter, and at 10²³ nights run 68–93 days and need power sent along the ring (energy-budget.md). The full swarm has no nights: the plant runs steadily, and the margin matters only if the beam is cut (cuisine.md).
- Catalyst poisoning at the Mill. Methanol or formaldehyde contamination, hence strict quality control.
- Power shortfalls hit the luxury tiers first: Garden, then cultivated meat, then precision vats. The Mill goes last. A raft riding out a cut on glow sails lives at the ration floor for as long as the cut lasts.
- **Inverted scarcity:** for most of history, fat and sugar were luxuries and greens were cheap. Here pastry is cheap and salad is a treat.
- Heliox conducts heat ~4× better than air, so food cools fast. Hot pots, covered dishes and warm dining rooms suit it.
- If food credits were denominated in energy, the per-serving table would be the literal price list.

## Plausibility ladder
- **Demonstrated at scale:**
  - chemistry: electrolysis, methanol synthesis, methanol-to-olefins, Ziegler alcohols, edible fat from Fischer–Tropsch paraffin (Germany, WWII), and chemical amino-acid synthesis with enzymatic resolution;
  - microbial protein: methanol-fed (Pruteen), knallgas (Solar Foods), mycoprotein (Quorn, Meati);
  - fermentation: precision proteins in *Pichia* (heme, whey), fermentation-produced chymosin (since 1990), vitamins;
  - LED vertical farms.
- **Lab or pilot:** cell-free CO₂→starch and hexoses; CO₂-derived fats (Savor); CO₂→acetate→food; plant-cell cocoa and coffee; cultivated meat (early commercial); cell-free protein synthesis (short-lived).
- **Extrapolated:** 90% electrolysis, a 45% sugar mill, 35% bacterial protein, 10% cultivated meat, 3% LED produce; precision gluten; long-lived ribosome reactors.

| Route | Today | Planning value | Best case |
|---|---|---|---|
| LED produce | ~1–1.5% (lettuce); ~1.7% wheat, lighting only | 3% | ~5% |
| Knallgas protein | ~15–25% | 30% | — |
| Methanol-fed protein | ~25% (estimated from Leger et al. component values) | 35% | ~45% (~35% per kcal eaten) |
| CO₂→acetate→algae | ~18% (lab) | — | — |
| Sugar/starch from CO₂ | Lab only; ~7% sunlight→starch theoretical | 45% | 65–70% |
| Fat from CO₂ | Pilot; no published efficiency | 48% | 65–70% |
| Amino acids from CO₂ | — | ~35% (estimate) | ~55% |

## Open questions
- Total power per person: energy-budget.md puts the common budget at ~3.1 kWe, so food is ~15% of it (7–10% at best case).
- Do ribosome reactors work? If so, precision proteins move from the Vats into the Mill at ~46%.
- Animals: settled as a rare luxury (eating-out.md): Herb Row has one henhouse, with eggs at ~1.6 kWh.
- Average intake (body size, activity, age structure).
- Rationing and pricing: settled in daily-life.md and economy.md. The commons gives everyone a Mill-table day, and everything else is priced in kWh, so the per-serving table is the price list. Alcohol policy is still open.

## Sources
- Leger et al. 2021, PNAS (electrolysis 70%, H₂→biomass 32%, methanol→biomass 45%): https://pmc.ncbi.nlm.nih.gov/articles/PMC8255800/
- Linder 2019, Frontiers in Sustainable Food Systems (Pruteen yield and scale): https://www.frontiersin.org/journals/sustainable-food-systems/articles/10.3389/fsufs.2019.00032/full
- Chinese Academy of Sciences 2024 (methanol-protein demonstration): https://www.cas.cn/cm/202401/t20240102_4993690.shtml
- Solar Foods (Solein, Factory 01): https://solarfoods.com/science/ and https://solarfoods.com/factory-01/
- Järviö et al. 2021, Science of the Total Environment (knallgas protein energy use): https://www.sciencedirect.com/science/article/pii/S0048969721008317
- Yu & Lu 2019 (*C. necator* growth stoichiometry): https://www.sciencedirect.com/science/article/abs/pii/S1369703X19303080
- Hann et al. 2022, Nature Food (CO₂→acetate→food): https://www.nature.com/articles/s43016-022-00530-x
- Cai et al. 2021, Science (cell-free starch from CO₂): https://www.science.org/doi/10.1126/science.abh4049
- Chemistry World on Savor's CO₂-derived fats: https://www.chemistryworld.com/news/how-is-carbon-dioxide-being-turned-into-food-in-the-lab/4022138.article
- Signify 2025 (horticultural LED efficacy): https://www.usa.lighting.philips.com/application-areas/specialist-applications/horticulture/press-releases/2025/signify-introduces-4-channel-philips-greenpower-led-toplighting-force
- Kusuma et al. 2020, Horticulture Research (LED efficacy limits): https://www.nature.com/articles/s41438-020-0283-7
- Vertical-farm energy benchmarking review, 2025: https://www.sciencedirect.com/science/article/pii/S2451904924007832
- Graamans et al. 2018 (plant factories vs greenhouses): https://research.wur.nl/en/publications/plant-factories-versus-greenhouses-comparison-of-resource-use-eff/
- Asseng et al. 2020, PNAS (vertical-farm wheat): https://www.pnas.org/doi/10.1073/pnas.2002655117
- Zhu, Long & Ort 2008 (maximum photosynthetic efficiency): https://experts.illinois.edu/en/publications/what-is-the-maximum-efficiency-with-which-photosynthesis-can-conv/
- FSANZ, thiamin fortification of bread-making flour (1991): https://www.foodstandards.gov.au/consumer/food-fortification/thiamin-fortification
- Scientific American 2009, Genzyme vesivirus contamination: https://www.scientificamerican.com/blog/news-blog/virus-hits-genzyme-plant-halting-pr-2009-06-17/
