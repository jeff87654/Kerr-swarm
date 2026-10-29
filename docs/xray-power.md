# X-ray power: turning the hole's light into electricity

*Design proposal from a working session, Sept 2026. Answers the open question in energy-budget.md about conversion efficiency. Companion to energy-budget.md, swarm-rings.md and habitat-design.md. Figures are per m² of collector facing ~1 kW/m² of X-rays unless marked. "Planning" values are far-future but not heroic.*

*Scope: **the ring era around a starved 10 M☉ hole.** The mature civilization (Sgr A* fed at 30% of Eddington) turns the disk's extreme UV into power with hovering mirror, furnace and turbine collectors at ~32%, and needs no X-ray tiles (full-swarm.md, hole-choice.md). The parasol analysis below carries over only in part: the fed disk's corona leaks ~20–40 W/m² of hard X-rays through those collectors, but from the whole Lantern, a source up to 130° across, so drums in the Shade shield their sides too, with their own water instead of iron (habitat-design.md).*

## Summary
- **Standard tile: ~22% of the hole's light becomes electricity** (range ~17–26%), not the 40% assumed for sunlight. The common budget then needs **~15 kW of light and ~23 m² of band per person**.
- The tile splits the spectrum, like a tandem solar cell:
  - a **silicon-carbide "X-ray-voltaic" skin** (0.3 mm) stops the soft half and turns ~25% of it directly into electricity;
  - behind X-ray-transparent foil insulation, a **2 mm iron plate** at ~850 K catches most of the hard half and drives **free-piston Stirling engines** at ~30%.
- **Iron is the real cost.** The standard tile adds ~0.6 t of heavy elements per person (~9% on top of 6.7 t). A 10 mm plate buys 3 more points for 1.3 t more per person. Skins alone reach ~13% with almost no metal.
- **~17% of the light passes straight through** as hard X-rays. Drums need **~8–10 cm iron parasols** on their hole-facing side, or the leak heats the 20 K hydrogen shield.
- **About one ~2 kW Stirling engine per person.**

## The light
- The swarm uses 0.04–39 L☉, which is 10⁻⁷–10⁻⁴ of the 10 M☉ hole's Eddington luminosity (3.3 × 10⁵ L☉). Black holes this dim are in the hard/quiescent state. Their X-rays follow a power law whose photon index softens to ~2.1 below ~10⁻⁵ Eddington (Plotkin et al. 2013) and extends to a few hundred keV, usually with jets.
- Planning spectrum: index 2.0, cut off at 300 keV. That's roughly equal energy in each factor of ten of photon energy:

| keV | 1–3 | 3–10 | 10–20 | 20–30 | 30–50 | 50–100 | 100–300 | >300 |
|---|---|---|---|---|---|---|---|---|
| Energy share | 21% | 23% | 13% | 7% | 9% | 11% | 12% | 4% |

- A brighter hard state (index 1.7, cutoff 150 keV) moves ~12 points of energy from soft to hard. The standard tile doesn't care (21.6% vs 21.7%). Skins alone drop from 13% to 10%.
- Not counted: any optical/IR from an outer disk or jet, which would need ordinary solar cells.

## Why X-rays are awkward
- **They can't be focused cheaply.** Mirrors reflect hard X-rays only at grazing angles (~1 mrad at 50 keV). Concentrating them takes ~1,000 m² of nanometre-smooth mirror per m² of aperture, so converters work at the ambient ~1 kW/m².
- **They penetrate.** Below ~15 keV, a fraction of a millimetre of almost anything stops them. Above ~50 keV, it takes millimetres to centimetres of iron. Iron and nickel are the only abundant heavy absorbers.
- **Every X-ray becomes a fast electron.** The electron shatters into thousands of charge pairs and lattice vibrations. Most of the energy ends as heat whatever you do, which caps PV-like conversion near 30%.
- **They pass through thin infrared-blocking foil.** This quirk helps. A plate can sit inside a foil greenhouse that X-rays cross but its own glow can't, so it runs hot at only 1 kW/m².

## The standard tile, front to back
| Layer | Build | Temperature | Job |
|---|---|---|---|
| Skin | 0.3 mm 4H-SiC diode, no oxide layers; ~1.5 kg/m² with contacts and frame | ~340 K | Stops ~53% of incident energy, mostly below 15 keV. Each 10 keV X-ray frees ~1,300 charge pairs; ~25% of absorbed energy → electricity |
| Skin cooling | Small heat pipes behind the skin, routed around the plate to the radiator | ~340 K | Carries ~400 W/m² of skin waste heat |
| Foil insulation | ~40 nickel foils, 0.1 µm each; effective emissivity ~10⁻³ | 340 → 850 K | Keeps the plate hot; transparent above ~15 keV |
| Plate | 2 mm iron, sodium heat pipes every ~20 cm | ~850 K | Absorbs ~28% of incident energy, mostly 15–100 keV |
| Engine | Free-piston Stirling, helium, linear alternator; ~2 kW per ~25 m² tile | 850 K hot, 350 K cold | ~35% of the heat it receives; ~30% of the plate's absorbed energy after insulation leaks |
| Back | Foil insulation, then the radiator face | ~335 K | Sheds ~630 W/m² outward |

- Machinery (heat pipes, foils, engine, radiator, frame) is ~7 kg/m². The whole tile is ~25 kg/m².
- The skin needs no insulation in front. It faces the swarm's interior, which is lined with other skins at the same temperature, so its net radiation inward is ~zero. All waste heat leaves from the back.

## Ledger
Per 1 kW/m² incident, planning values, index-2.0 spectrum.

| | Absorbed | Converted | Electricity |
|---|---|---|---|
| SiC skin | 530 W | 25% | 134 W |
| Foils | 17 W | half reaches the plate | — |
| Iron plate | 271 W (+8 from foils) | 30% | 83 W |
| Scattered back out | 9 W | — | — |
| Passes through | 172 W | — | — |
| **Total** | | | **~217 W (22%)** |

- Conservative (skin 20%, engines at 50% of Carnot, leakier foils): 17%.
- Optimistic (skin 30%, engines at 68% of Carnot, tighter foils): 26%.

## Why each stage stops where it does
- **Skin.** Freeing one charge pair in SiC costs ~7.8 eV of X-ray energy, but the pair delivers only ~2.5 eV at the diode's voltage.
  - A near-perfect diode keeps ~30%; the planning value is 25%.
  - Silicon (1.1 eV gap, 3.6 eV per pair) manages ~15%.
  - Wide-gap SiC is the best choice among abundant elements, and it's radiation-hard.
- **Plate.** The foils leak ~15% of the heat at 850 K, and hotter plates leak faster, so ~850 K is the sweet spot.
  - A Stirling at 60% of Carnot between 850 K and 350 K gives ~35%, or ~30% net.
  - NASA's Advanced Stirling Convertor reached 38% at 850 °C / 90 °C (56% of Carnot), and one unit has run ~45,000 h.

## Alternatives considered
| Route | Planning value | Verdict |
|---|---|---|
| Thermophotovoltaic cells facing the plate (photon-recycling "air-bridge" type) | ~21% of plate heat | Today's 44% record needs a 1,435 °C emitter. At this flux the plate facing the cells sits near 830 K, where ~1% of its glow is above any useful bandgap. Low-gap cells also need scarce In, Ga, As, Sb |
| Thermoelectrics on the plate | ~20% of plate heat (ZT 2–3) | Solid-state fallback; ~19% tile total |
| Scintillator + solar cell | ~10% | Scintillators darken under ~10¹⁰ Gy/yr |
| Vacuum photoelectric foil stack | ~10–15% | Collects fast electrons against kilovolts, but secondary electrons short it out. Niche: high-voltage DC |
| Thick SiC instead of iron | ~18% tile total at 5 mm | Similar metal, ~20% more band. Fast electrons from hard X-rays slowly knock carbon atoms out of place |
| Grazing-incidence concentrators | Plates could run at ~1,300–1,500 K on ~10× less iron | Needs ~1,000 m² of ultra-smooth mirror per m² of aperture. A late-era upgrade |
| Warm skin (~500 K) with its own small engine | +3–4 points | Needs front foils or an all-warm interior. Worth it once tiles are mature |

## The iron dial
| | Skins only | Standard (2 mm) | Heavy (10 mm) |
|---|---|---|---|
| Efficiency, planning (range) | 13% (11–16%) | 22% (17–26%) | 25% (20–30%) |
| Tile mass | 1.5 kg/m² | 25 kg/m² | 88 kg/m² |
| Light per person (common) | 24 kW | 15 kW | 13 kW |
| Band per person | 38 m² | 23 m² | 20 m² |
| Collector metal per person, incl. truss share | 0.06 t | 0.63 t | 1.9 t |
| Light passing through | 47% | 17% | 7% |

- Past ~2 mm, iron buys little: 1.3 t more per person for 3 points and ~3 m² less band.
- Skins only save ~0.6 t per person (~8% more people per unit metal). But they need 1.6× the light and band: a wider swarm, longer knot nights, and people spread 1.6× thinner. They suit remote rings (industry, compute) if metal is scarcer than light.

## Knock-on effects
- **Light per person:** ~15 kW for the common budget (energy-budget.md first used 8.1 kW at 40%; swarm-rings.md first assumed 10 kW, and its tables now use 15).
  - Compared with 10 kW, at a given population the swarm is ~1.22× wider and orbits take ~1.35× longer: a 10²² swarm sits at ~0.73 AU, with a ~72-day orbit and ~12-day mid-band knot nights, and flywheels grow ~1.35×.
- **Metal per person:** ~6.7 t → ~7.3 t with standard tiles, plus parasols.
- **Drum parasols:** hard X-rays leak through the tile at ~170 W/m².
  - Landing in 20 K hydrogen, every watt costs ~50 W of cryocooling.
  - An iron parasol on each drum's hole-facing side cuts the leak to ~1 W/m² at 8 cm and ~0.3 W/m² at 10 cm, comparable to the shield's own insulation leak.
  - That's ~80 kg per person in a nation drum (3 km; ~120 kg in a 2 km drum), ~25 kg in a world drum and ~470 kg in a town drum. Big drums win again.
  - In the full swarm the leak through the Lantern is ~20–40 W/m², but it comes from a wide source, so a front parasol leaves a drum's sides bare. Drums there wear their own water as a moat over the front cap and sides instead (habitat-design.md).
- **Engines:** Stirlings supply ~1.2 kW per person on average. At a 64% lit fraction, that's ~2 kW of engine each, so about one engine per person: ~10²² engines in a 10²² swarm, and a large maintenance-robot economy.
- **Knot nights:** a 2 mm plate cools by a few hundred kelvin over a multi-day night and rewarms in a few hours at dawn. The loss is under 1%. The skin restarts instantly.
- **Radiation dose:** the skin absorbs ~500 W/m² in ~1 kg/m², about 10¹⁰ Gy/yr.
  - Soft X-rays can't knock atoms out of place in SiC (their electrons fall below the ~100 keV threshold), so the damage is mostly ionization, which covalent crystals tolerate. Skins avoid oxide layers.
  - Hard X-rays passing through do displace a few carbon atoms, so skins are annealed or recycled on a schedule.
  - Iron doesn't care at 850 K.
- **Shingled bands:** where another ring sits behind a lit strip (about a third of lit area), X-rays passing through land on that ring's plates. That recovers under a point and isn't counted.

## Open questions
- Any optical/IR from the starved hole's outer disk or jet. (The fed hole's output is worked out in hole-choice.md and full-swarm.md.)
- Skins only on remote rings (saves metal) vs. standard tiles everywhere (saves light, reach and knot-night storage).
- Parasols vs. placing drums behind heavy tiles.

## Method
- 1-D Monte Carlo photon transport at normal incidence: photoelectric absorption with K-shell fluorescence, Klein–Nishina Compton scattering, coherent scattering ignored. Elam cross sections via the xraydb package; 60,000 photons per case.
- Skin: collection × open-circuit voltage × fill factor ÷ pair energy. Planning: 0.90 × 2.5 V × 0.88 ÷ 7.83 eV = 25%.
- Plate: foil effective emissivity 1.5 × 10⁻³ (front plus back), engine at 60% of Carnot, cold end 350 K. The best plate temperature is ~830–870 K.
- TPV check: detailed balance with a grey emitter (emissivity 0.9) and cells at 340 K absorbing 95% above the gap, with 99.5% sub-gap reflectance and 5% external radiative efficiency.
- Per person: 3.24 kWe (common budget plus 10% firm-load overhead), 1.56 m² of band per kW of light (swarm-rings.md), truss at 10% of added mass.
- Full-swarm shielding: superseded by habitat-design.md's moat, computed with this method extended to 6 MeV and to a wide source.

## Sources
- Plotkin, Gallo & Jonker 2013, X-ray spectral evolution of black hole binaries toward quiescence: https://arxiv.org/abs/1306.1570
- 4H-SiC electron–hole pair creation energy, 7.83 eV: https://arxiv.org/abs/2311.03902
- NASA TM-2015-218461, Advanced Stirling Convertor development (38% at 850 °C / 90 °C; ~45,000 h on one unit): http://large.stanford.edu/courses/2018/ph241/long1/docs/nasa-tm-2015-218461.pdf
- Air-bridge thermophotovoltaic cells, 44% at 1,435 °C (Joule 2024): https://www.sciencedaily.com/releases/2024/05/240523205102.htm
- xraydb (Elam X-ray cross-section tables): https://pypi.org/project/xraydb/
