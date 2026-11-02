# Hole choice: stellar, mid-sized or galactic core

*Comparison from a working session, Sept 2026; revised for the full swarm. Companion to xray-power.md, energy-budget.md and swarm-rings.md. Same swarm assumptions throughout: ~1 kW/m² at the collectors and 3.24 kWe per person (common budget plus firm-load overhead), except the fed-hole Lantern rows, which use full-swarm.md's 2 kW/m² and 4.06 kWe. "Planning" values are far-future but not heroic. **Project baseline: Sgr A\* fed at 30% of Eddington and held there as it grows (full-swarm.md).** The starved-hole comparison below is the ring era's design space. This civilization's own ring era was around the starved Sgr A\* (see Where it works); the 10 M☉ column, worked out in swarm-rings.md and ring-weave.md, is a design study. Revised Oct 29, 2026 after a consistency audit; Nov 2026, when the ring era was settled on Sgr A\*.*

## Summary
- **Hard X-rays are the problem.** They can't be focused, so the X-ray tile's plate tops out near 850 K. They also need iron to stop, and PV-like conversion caps near 30%. Light that ordinary mirrors can focus unlocks a ~1,500 K furnace and a gas turbine.
- **A bigger hole doesn't give a cool thermal disk at this power.**
  - A thin disk forms only above ~1% of the Eddington luminosity: 3,300 L☉ for 10 M☉, 3.3 × 10⁶ L☉ for 10⁴ M☉, and 1.4 × 10⁹ L☉ for Sgr A*.
  - Even Sgr A*'s disk would peak in the extreme ultraviolet (kT ≈ 15–26 eV).
- **At the ring swarm's power (~0.2–30 L☉), any bigger hole is starved.**
  - Its thin, hot gas (electrons at ~5 × 10¹⁰ K) glows by synchrotron.
  - The peak wavelength grows with mass: mid/far-infrared for a mid-sized hole, submillimetre for Sgr A*. Sgr A* does exactly this today, at ~200 L☉.
- **A mid-sized hole (~10³–10⁴ M☉) is the sweet spot for a starved hole: ~43% (33–51%).** Collectors need ~40 kg of metal per person instead of ~630 kg. Orbits take days and knot nights last hours.
- **The galactic-core hole is too big for a starved 10²¹–10²⁴ swarm.**
  - At 1 kW/m² the swarm sits only 30–150 r_g out, orbiting at 8–18% of light speed.
  - Its glowing region is ~0.3 AU across, too big and too dim per unit area to focus into a hot furnace. That gives ~27% at 10²⁴ people and ~7% at 10²².
  - It works (~37%) only for ~10²⁵ people using its natural ~230 L☉.
- **Fed near the Eddington limit, all three converge on ~30–35%** (see below). No iron is needed, but the civilization has to be enormous and orbits take millennia. This is the project's chosen path: Sgr A* at 30%, held there as the hole grows, with hovering collectors and habitats in their shade (full-swarm.md).

## The comparison (starved holes, ring era)
| | 10 M☉ (original design, now a design study) | Mid-sized, 10⁴ M☉ | Galactic core (Sgr A*), 4.3 × 10⁶ M☉ |
|---|---|---|---|
| Swarm power as share of Eddington (10²²–10²⁴ people) | 10⁻⁶–10⁻⁴ | 10⁻⁹–10⁻⁷ | 10⁻¹¹–10⁻¹⁰ |
| Where the light comes out | Hard X-rays, 1–300 keV | Infrared synchrotron, ~10–50 µm | Submillimetre synchrotron, ~0.6–1.7 mm |
| Glowing region | ~150–1,500 km | ~100,000 km | ~0.2–0.4 AU |
| Can it be focused? | No | Easily, with thin metal mirrors | Barely: the source is too big |
| Converter | SiC skin + iron plate + Stirling | Mirror + ~1,500 K furnace + helium turbine | Mirror + 650–900 K furnace + Stirling |
| Efficiency, planning (range) | 22% (17–26%) | 43% (33–51%) | 27% (19–35%) at 10²⁴; 16% at 10²³; 7% at 10²² |
| Light per person | 15 kW | 7.6 kW | 12 kW at 10²⁴ |
| Collector metal per person | ~630 kg | ~40 kg | ~60 kg at 10²⁴ |
| Swarm radius, 10²² / 10²⁴ | 0.73 / 7.3 AU | 0.52 / 5.2 AU (5,300 / 53,000 r_g) | 1.3 / 6.5 AU (30 / 154 r_g) |
| Orbital speed, 10²² / 10²⁴ | 110 / 35 km/s | 4,100 / 1,300 km/s | 0.18c / 0.08c |
| Orbit, 10²² / 10²⁴ | 72 d / 6.2 yr | 1.4 d / 43 d | 6 h / 2.9 d |
| Mid-band knot night, 10²² / 10²⁴ | 12 d / 1 yr | 5.5 h / 7 d | 1 h / 12 h |
| Band height and ring count at 10²² | ~1.1 M km, ~315 rings | ~21,000 km, ~12,000 rings | — |
| Flywheel per person at 10²² | ~290 kg | ~6 kg | — |

- **Rings end where orbits pass ~16 years** (full-swarm.md; ~11–23 years depending on how heavily the bands are loaded): ~3 × 10²⁴ people around 10 M☉, ~6 × 10²⁶ around 10⁴ M☉, ~3 × 10²⁸ around Sgr A* (if its starved light could be used that far out).

## Why the galactic-core hole disappoints (when starved)
- **Too deep in the well.** Flux fixes the swarm radius at r ≈ 1.17 AU × √(L/L☉), but Sgr A*'s gravitational radius is 0.043 AU.
  - A 10²⁴ swarm sits at ~150 r_g: relativistic orbits, and clocks running ~1% slow.
  - Frame dragging swings the ring planes around the spin axis every ~1,000 orbits (~8 years). Rings at different radii swing at different rates, so the orange slice needs constant station-keeping.
  - The swarm also sits inside the hot accretion flow and blocks the hole's natural supply.
- **Too dim per unit area.** Mirrors can't concentrate light to a higher flux than the surface it left.
  - Sgr A*'s glow comes from a region about as wide as Mercury's orbit. At the swarm's power, its surface flux matches only a ~1,700 K blackbody.
  - So the furnace can only run at ~900 K, which is X-ray-tile territory again.
- **Where it works:** at its natural ~230 L☉ (the EHT gives 180–240 L☉), ~10²⁵ people at ~18 AU (~420 r_g). Orbits run at 0.05c and take 13 days; efficiency is ~37% (27–44%). The civilization's ring era was here, before feeding. Orange-slice knot nights last a sixth of an orbit: hours while the rings were sparse, ~2 days mid-band once they filled the sky. So the ring era had no winters; those came with the layer era's long eclipses (sgr-a-scope.md).
- **Upside if antennas mature:** each submillimetre wave from 5 × 10¹⁰ K electrons is intensely "hot" per mode. So antenna-plus-rectifier arrays ("rectennas") aren't bound by the furnace limit. Microwave rectennas reach ~90%, but nobody yet has efficient rectifiers at submillimetre wavelengths.

## Why the mid-sized hole works (when starved)
- **Compact and intensely bright.** Its glowing region is ~100,000 km across, so its surface flux matches a ~10,000–30,000 K blackbody. Mirrors can concentrate it as hard as the furnace materials allow.
- **Infrared is easy to focus.**
  - Aluminium-film mirrors reflect ~98% at 10–50 µm and need only micron-level accuracy.
  - A graphite or SiC cavity at ~1,500 K feeds a closed helium turbine at ~62% of Carnot, with radiators at ~400 K.
  - Planning 43%; ~51% at the optimistic end (an 1,800 K furnace with better mirrors and turbine).
- **Light hardware.** Mirrors, furnace, turbine, radiator and frame come to ~3 kg/m², versus ~25 kg/m² for the X-ray tile. There's no iron plate. Drums still want an X-ray parasol for the small share (~1%) that comes out as X-rays; that spectrum is uncertain. (The full swarm's hovering collectors can weigh ~10–15 kg/m², because a closed Lantern is held up by its own trapped infrared; full-swarm.md.)
- **Geometry.**
  - Orbits take days, so knot nights last hours and flywheels shrink ~50×.
  - Bands are narrow (~21,000 km tall at 10²², versus ~1.1 million km), with ~12,000 rings only ~400 km apart.
  - Tides stay near 10⁻⁶ g.
- **Other masses.** A 10³ M☉ hole gives the same efficiency with slower orbits (4–137 days) and shorter peaks (2–12 µm). Above ~10⁵ M☉, a 10²² swarm becomes relativistic.
- **In the sky:** a pinpoint infrared sun, a fifth to two-fifths of the Sun's apparent width at 10²².
- **Where such holes live:** globular-cluster cores and dwarf-galaxy nuclei. Both are old and metal-poor, a natural home for a metal-limited civilization.

## Fed near the Eddington limit
If the civilization is big enough to use ~30–100% of the hole's Eddington luminosity, every hole gets a real thin disk. The disk is still hot:

| | 10 M☉ | 10⁴ M☉ | Sgr A* |
|---|---|---|---|
| Luminosity (0.3–1 Eddington) | 1–3 × 10⁵ L☉ | 1–3 × 10⁸ L☉ | 4–14 × 10¹⁰ L☉ |
| Disk light peaks at | ~4–5 keV (soft X-rays); ~90% above 1 keV | ~0.5–0.7 keV; ~75% in 0.1–1 keV | ~80–110 eV (extreme UV); ~90% in 10–300 eV |
| Plus a hot corona | 5–20% hard X-rays (more in the "very high" state) | 5–15% | ~5% |
| Grazing angle for mirrors | <1° (~100 m² of mirror per m² of aperture) | ~5–10° | ~3–5° (most of the light is above ~100 eV) |
| Efficiency, planning (range), 400 K skin | ~28% (22–35%) | ~32% (24–42%) | ~34% (25–45%) |
| Efficiency across the Lantern (2 kW/m² average) | ~26% | ~30% | ~32% |
| Lantern radius (2 kW/m² average) | 260–480 AU | 0.04–0.07 pc | 0.82–1.5 pc |
| Orbit, middle of the Shade | ~1,500–2,700 yr | ~8,400–15,000 yr | ~39,000–65,000 yr |
| People (Lantern and Shade) | 2.4–7.6 × 10²⁷ | 2.9–9.6 × 10³⁰ | 1.27–4.2 × 10³³ |
| Heavy elements needed (6.7 t/person) | 8–26 M☉ | 1–3.2 × 10⁴ M☉ | 4.3–14 × 10⁶ M☉ |
| Fuel | ~10⁻⁷ M☉/yr | ~10⁻⁴ M☉/yr | ~0.02–0.06 M☉/yr |

- **Efficiency converges on ~30–35%.** The light is now absorbed in microns (no iron), and the glowing surfaces are hot enough that focusing isn't limited by the source. But soft X-rays and extreme UV reflect only at shallow grazing angles (~3–5° for a fed supermassive hole's ~100–300 eV light), and each bounce loses ~20–30%. That caps optics at ~75–80%, times a ~1,500 K turbine at ~45%. A SiC skin (~20–25% on this light, less for extreme UV absorbed right at the surface) is the fallback.
- **It never beats the starved mid-sized hole (43%)**, whose infrared reflects ~98% off ordinary mirrors. The optimistic end (hotter furnaces, better grazing optics) reaches ~45%.
- **The hard part is scale, not physics.**
  - Orbits take millennia, so rings fail (they need orbits under ~16 years) and knot nights would last centuries. The answer is to split light from life: collectors hover in a closed shell, the Lantern, and habitats live outside it in its shade on beamed power (full-swarm.md). Nobody sees a night.
  - **Light pressure becomes structural.** A perfect absorber that re-emits nothing balances gravity at ~25 kg/m² × (L/L_Edd), at any hole mass.
    - A real collector radiates its heat and beams its power outward, which pushes back. That leaves about a quarter of the push, times the disk's brightness in that direction (~2.6 at the poles, near zero edge-on).
    - But a closed shell of collectors also traps its own infrared, which pushes 5–20× harder than that, evenly in every direction. At 30% a closed Lantern can carry ~10–40 kg/m², and it hovers without orbiting (full-swarm.md).
    - Thin mirrors outside such a shell must be tied down.
  - At 10 M☉ the Shade orbits at only ~7 km/s, and the collectors need soft-X-ray mirrors at under 1° grazing, the weakest link.
  - A 10 M☉ swarm needs about as many heavy elements as the hole weighs: a large star cluster's worth.
  - A Sgr A* swarm at 1–2 pc overlaps the old nuclear star cluster and circumnuclear disk, which have to be mined or cleared. Orbits are set mostly by the swarm's own mass, not the hole's. Its heavy elements are about half a percent of the Milky Way's.

## Power by hole size (fed at 30%, 300 K Lantern)
Electricity delivered to the habitats, from full-swarm.md's model with the Lantern's skin averaging ~300 K (~380 K at the poles) instead of the baseline's ~420 K. "With jets" is the steady spin tap with the spin held at 0.9 (full-swarm.md). People at 3.09 kWe each; heavy elements at 6.7 t each.

| Hole | Disk light | Lantern radius | Electricity, disk only | With jets (heat engines / direct conversion) | People, disk only / with direct jets | Heavy elements, same |
|---|---|---|---|---|---|---|
| 10 M☉ | 3.8 × 10³¹ W | 500 AU | 8.5 × 10³⁰ W | 1.9 / 2.5 × 10³¹ W | 2.8 × 10²⁷ / 8 × 10²⁷ | 9 / 27 M☉ |
| 10³ M☉ | 3.8 × 10³³ W | 5,000 AU | 9.6 × 10³² W | 2.0 / 2.6 × 10³³ W | 3 × 10²⁹ / 8.5 × 10²⁹ | 1,000 / 2,800 M☉ |
| 10⁴ M☉ | 3.8 × 10³⁴ W | 0.076 pc | 9.9 × 10³³ W | 2.0 / 2.6 × 10³⁴ W | 3.2 × 10³⁰ / 8.5 × 10³⁰ | 1.1 / 2.9 × 10⁴ M☉ |
| 10⁶ M☉ | 3.8 × 10³⁶ W | 0.76 pc | 1.0 × 10³⁶ W | 2.0 / 2.7 × 10³⁶ W | 3.3 × 10³² / 8.6 × 10³² | 1.1 / 2.9 × 10⁶ M☉ |
| Sgr A* | 1.6 × 10³⁷ W | 1.56 pc | 4.6 × 10³⁶ W | 8.8 × 10³⁶ / 1.15 × 10³⁷ W | 1.5 × 10³³ / 3.7 × 10³³ | 5.0 × 10⁶ / 1.3 × 10⁷ M☉ |
| 10⁸ M☉ | 3.8 × 10³⁸ W | 7.5 pc | 1.0 × 10³⁸ W | 2.1 / 2.7 × 10³⁸ W | 3.4 × 10³⁴ / 8.7 × 10³⁴ | 1.1 / 2.9 × 10⁸ M☉ |
| 10⁹ M☉ | 3.8 × 10³⁹ W | 24 pc | 1.1 × 10³⁹ W | 2.1 / 2.7 × 10³⁹ W | 3.5 × 10³⁵ / 8.8 × 10³⁵ | 1.2 / 3.0 × 10⁹ M☉ |
| 10¹⁰ M☉ | 3.8 × 10⁴⁰ W | 74 pc | 1.1 × 10⁴⁰ W | 2.1 / 2.8 × 10⁴⁰ W | 3.6 × 10³⁶ / 8.9 × 10³⁶ | 1.2 / 3.0 × 10¹⁰ M☉ |

- **Share of the disk's light that reaches the habitats as electricity:** ~23% around 10 M☉, rising to ~29% around 10¹⁰ M☉ as the light softens; ~28% around Sgr A*.
- **Against the baseline:** the 2 kW/m² Lantern delivers ~25% counting the compute it runs (24% beamed to the habitats). The cooler skin buys ~12% more power for a Lantern nearly twice as wide (1.56 vs. 0.82 pc around Sgr A*), and slower messages.
- **Jets** (spin held at 0.9, feed ×2.1) multiply the power by ~2 with heat engines or ~2.5 with direct conversion. Around 10 M☉, whose disk light converts worst, it's ×2.2 / ×2.9. Holding the spin at 0.8 gives ×2.6 / ×3.5.
- **Shedding the jets' waste heat at 300 K** as well needs ~60% more radiating area with heat engines, ~30% with direct conversion.
- **Everything scales with hole mass and feeding level.** At the Eddington limit it's ×3.3, but the disk flickers. Held at a fixed share of Eddington, a fed hole grows, and the civilization with it (full-swarm.md, Growth at 30%).
- **Metal binds first for big holes.** A 10⁹ M☉ hole's disk alone could power ~3.5 × 10³⁵ people, who would need ~1.2 × 10⁹ M☉ of heavy elements: about all of a Milky-Way-size galaxy's. Beyond that, jets buy richer people, not more of them.

## Caveats
- The starved-flow spectra are scaled from Sgr A* (electron temperature ~5 × 10¹⁰ K, emitting region ~5 r_g). No mid-sized hole this dim has been measured.
- Scaled the same way, the 10 M☉ hole's hot flow would peak in the visible/UV at the dim end of its range. Real black-hole binaries at these Eddington ratios are X-ray bright, but how much comes out as visible/UV at 10⁻⁶ Eddington isn't pinned down. If much of it did, solar-type cells (~45–50%) would beat the X-ray tile.
- Near-Eddington spectra use a thin disk (spin 0.9) with colour corrections of 1.7 (10 M☉), 1.4 (10⁴ M☉) and 1.0 (Sgr A*). Real near-Eddington flows thicken ("slim disks"), drive winds and beam their light, which shifts the numbers somewhat but not the conclusions.
- The thin disk's brightness by direction (face-on vs. edge-on) is first-order for the fed designs; full-swarm.md uses the Newtonian pattern with limb darkening.

## Method
- Thin-disk peak temperature: Newtonian thin disk with its inner edge at the ISCO for spin 0.9 (2.32 r_g, efficiency 15.6%).
- Starved-flow synchrotron peak: an optically thick sphere of radius 5 r_g at 5.4 × 10¹⁰ K, calibrated so Sgr A* at 8 × 10²⁸ W peaks at 10¹² Hz.
- Furnace limit: concentrated flux is at most half the source's surface flux. The glowing region is 7 r_g (planning), 10 r_g (conservative) or 5 r_g (optimistic).
- Optics and absorptance 0.94 for infrared/submillimetre, 0.75–0.8 for grazing-incidence extreme UV and soft X-rays. Engine at 62% of Carnot, radiator at 400 K, furnace ≤ 1,500 K (1,200 / 1,800 K bounds).
- Efficiency and luminosity are solved together: a less efficient swarm needs more light, so it sits further out.
- Geometry uses the swarm-rings.md formulas (band height ≈ 1.1 km/s ÷ orbital speed × radius; ring count = π × orbital speed ÷ 1.1 km/s). Flywheels carry 0.85 kW through a mid-band night at 3 MJ/kg.
- Fed-hole rows for the Lantern and Shade come from full-swarm.md (sphere at 2 kW/m² average, beam losses included).

## Sources
- EHT Sgr A* Paper V (2022): bolometric luminosity 6.8–9.2 × 10³⁵ erg/s, accretion rate 5–10 × 10⁻⁹ M☉/yr: https://eventhorizontelescope.org/publications/first-sagittarius-event-horizon-telescope-results-iv-variability-morphology-and-0
- von Fellenberg et al. 2018, Sgr A* in the far infrared; SED peak near 10¹² Hz: https://arxiv.org/abs/1806.07395
- Dexter et al. 2010, the submillimetre bump; electron temperature ≈ 5.4 × 10¹⁰ K: https://arxiv.org/abs/1005.4062
- Rectenna efficiencies (90.6% at 2.45 GHz): https://en.wikipedia.org/wiki/Rectenna
