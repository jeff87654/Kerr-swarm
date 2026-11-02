# Ring weave: getting rid of knot nights

*Design proposal from a working session, Sept 2026. An alternative to the orange-slice layout (swarm-rings.md) for where knot nights run long: a 10 M☉ hole at 10²² people and up. With a mid-sized hole (hole-choice.md), knot nights last hours and the orange slice stays the better build (see "When the orange slice is still the right call"). Uses ~22% X-ray conversion (xray-power.md) and ~1.65 kWe of firm load per person (energy-budget.md). Figures are for a 10²² swarm unless marked.*

*Scope: **a design study for a 10 M☉ hole**, not this civilization's history. This civilization's ring era was around the starved Sgr A\*, whose orange slice had knot nights of hours to a couple of days (hole-choice.md), so by this doc's own test the slice stayed the better build there (see "When the orange slice is still the right call"). The orange slice holds only while orbits take less than ~16 years (~3 × 10²⁴ people around a 10 M☉ hole); where the weave's own limit falls is open (see Scale). The mature civilization (Sgr A\* at 30% of Eddington) has no rings and no nights; its collectors hover and its habitats live on beamed power (full-swarm.md).*

## Summary
- **What sets a night.** A habitat goes dark while it passes through the shadow of a ring inside it. That takes band height ÷ (orbital speed × sine of the angle between the two rings). In the orange slice every ring crosses its neighbor at the shallowest possible angle, one band-width (~0.6°), so a single neighbor's shadow covers 1/6–1/4 of every orbit: 12–17 days per night at 10²², more than a year at 10²⁴.
- **The trade.** The same angle sets the price of changing rings: where two rings cross, a vehicle has to make up their velocity difference, ≈ orbital speed × angle. For any pair of rings, **the eclipse one casts on the other × their speed difference at the crossing ≈ band height**. The orange slice's free interchange exists only because neighbors sit one band-width apart, so their bands touch where they run parallel. That same closeness is what makes their shadows so long.
- **The fix: weave the rings.** Tilt ring planes evenly in all directions, no two closer than ~7°. People live on the inner, optically thin part of the stack; industry and compute on rings outside them; about a quarter of the light escapes. Local storage covers the rest.
- **At 10²²,** with bands a quarter of the tidal maximum: up to ~7 eclipses a day, typically ~1 hour each. The worst-placed habitat's longest night is ~21 hours (was 12–17 days). Storage is ~15–30 kg of flywheel per person (was 240–480 kg).
- **Costs.**
  - Changing rings costs ~12 km/s (~0.85 GJ a seat, about a third of one long trip) instead of being nearly free.
  - ~27% of the light escapes, so the hole must put out ~20.5 kW per person instead of ~15 (or it supports ~27% fewer people).
  - Inner rings are brighter than outer ones (lit 98% vs 66% of the time), so they carry more people per km.
- **Side benefits.** No Seam (every ring orbits prograde), a clear path for jets, and no deep knots where heat piles up.

## The three fixes compared
| Option (10²²) | Longest night | Light caught | Main cost |
|---|---|---|---|
| Orange slice as designed | 12–17 d | 100% | Flywheels 240–480 kg/person |
| Orange slice thinned to 66% / 36% / 15% of the sky | 6 / 3 / 1.2 d | 66 / 36 / 15% | Knots remain |
| Orange slice + superconducting lines along every ring | ~2 d (deep knot) | 100% | 2–18 kg of line per person; deep-knot habitats can't shed heat |
| Weave, as thick as the orange slice | ~3 d | ~81% | Outermost rings lit ~24% of the time |
| **Weave: thin residential shell, quarter-height bands** | **~21 h** | **73%** | **Ring changes ~12 km/s; hole ~37% brighter per person** |

- **Thinning alone:** every ring still passes through the same two knots. Nights shrink only in proportion to the gaps between rings, so a one-day night means letting ~85% of the light go.
- **Transmission** is affordable but doesn't reach the heart of the problem.
  - A ring's total output never changes (the shadow pattern is fixed in space and the ring turns through it), so a line only has to carry power from lit stretches to dark ones: at most ~3% of the ring's firm load past any point, over up to ~20° of arc (~35 million km).
  - A superconducting line at 10 MV DC and 1,000 A/mm² weighs ~18 kg per person at 10²², ~56 kg at 10²³ and ~180 kg at 10²⁴; at 100 MV, a tenth of that. Today's high-temperature superconductors lean on scarce elements (rare earths, barium), which also pushes toward the higher voltage.
  - In the deep knot (≥10 bands stacked; ~2 days per pass at 10²², ~13 at 10²³, ~70 at 10²⁴), a habitat is sandwiched between other bands, so its radiators face warm band surfaces instead of cold sky. Power delivered there becomes heat it can't shed. Lines shrink knot night to the deep knot; they don't remove it.
- **Weaving alone,** at the orange slice's band area, cuts the worst night to ~3 days, but the outermost rings sit behind so many others that they're lit only a quarter of the time. Thinning the residential part fixes both. Weaving and thinning are one fix, not alternatives.

## Layout
- **Tilts.** Ring planes spread evenly over all orientations, like the strands of a ball of yarn wound in every direction. Every ring crosses every other ring twice an orbit; each crossing's shadow passes in minutes to hours.
- **Spin axis clear.** Keep every ring plane at least ~10° from the hole's spin axis.
  - All rings then orbit prograde, so near-parallel rings always co-rotate. The Seam disappears.
  - Jets, if any, have a clear path.
  - It costs ~10% on the spacing between tilts and ~1% of the light.
- **Stack by use.** Optical depth here is the fraction of the sky a set of bands would cover if none of them overlapped.
  - Innermost: residential rings, to optical depth 0.45. They catch ~36% of the light.
  - Outside them: rings for industry, growth and compute, to optical depth ~1.3. They catch another ~37%, and the last ~27% escapes.
  - The split matches the budget: firm loads need ~7.5 kW of light per person, remote loads ~7.3 kW (energy-budget.md).
  - The innermost residential rings are lit 98% of the time, the outermost 66%, and 81% on average, so they need ~7.7–11.4 m² of band per person (9.3 on average).
  - Remote rings are lit 27–64% of the time. Their loads follow the light.
  - Total band is ~27 m² per person (orange slice ~24). Catching 86% of the light would take optical depth 2 and ~35 m², and would roof the residential rings more.
- **Band height.** Build bands at about a quarter of the tidal maximum: ~343,000 km instead of ~1.37 million at 10²².
  - Nights and ring-change speeds both shrink roughly as the square root of band height (ring-change energy in proportion to it).
  - The truss shrinks as its square: 10% of band mass → ~0.6%, saving ~0.6 t of carbon per person. This isn't unique to the weave: short bands save the same truss in an orange slice, where they add rings but don't shorten nights.
  - The price: 4× as many rings (~335 residential, ~970 in all, nested ~6,900 km apart in a stack ~5% of the orbit radius deep), and ~15% fewer people within a day's travel on your own ring (~1.3 × 10¹⁷ vs ~1.5 × 10¹⁷).
- **Storage, not long lines.** Each habitat holds ~0.3–0.7 days of its average draw: ~15–30 kg of flywheel, or ~4–9 kg of oxygen cycled through hydrogen fuel cells. Flexible loads (~30% of the draw, mainly the food plant) run harder in the light. Lines across the band help but aren't needed.

## Nights and costs at 10²²
The weave sits at 0.85 AU (102 km/s, 91-day orbit), farther out than the orange slice's 0.73 AU because the hole must be brighter per person.

| Band height | Full (1.37 M km) | **Quarter (343,000 km)** | Tenth (137,000 km) |
|---|---|---|---|
| Rings: residential / all | 84 / 242 | 335 / 968 | 838 / 2,420 |
| Closest pair of tilts | 13.3° | 6.7° | 4.2° |
| Typical eclipse | 4.5 h | 1.2 h | 27 min |
| Longest night, worst habitat | 1.4 d | 0.9 d | 0.6 d |
| Storage, worst / median habitat (days of its draw) | 1.2 / 0.6 | 0.7 / 0.3 | 0.5 / 0.2 |
| Flywheel, worst habitat | ~55 kg | ~32 kg | ~23 kg |
| Nearest ring change | 24 km/s, 3.3 GJ | 12 km/s, 0.85 GJ | 7.4 km/s, 0.33 GJ |
| Truss, share of band mass | 10% | 0.6% | 0.1% |

- Eclipses per day run from ~0 on the innermost ring to ~7 on the outermost residential ring (two per orbit for every ring inside yours).
- The pattern is fixed in space, so each habitat's eclipse timetable repeats exactly every orbit.
- The longest nights are **tangles**: stretches where several crossings line up and their shadows run together.

## Scale
| Swarm population | 10²¹ | 10²² | 10²³ | 10²⁴ |
|---|---|---|---|---|
| Orbit (weave) | 16 d | 91 d | 1.4 yr | 7.9 yr |
| Orange-slice nights (as designed, 15 kW) | 2–3 d | 12–17 d | 68–93 d | 1.0–1.4 yr |
| Weave, quarter-height bands: worst night | 3 h | 0.9 d | 6.5 d | 48 d |
| Band height for a ≤1-day worst night | full (244,000 km) | ~450,000 km | ~36,000 km | ~2,900 km |
| Residential rings at that height | ~150 | ~260 | ~10,000 | ~400,000 |
| Nearest ring change at that height | 31 km/s | 13 km/s | 1.2 km/s | 0.1 km/s |

- Nights scale with the orbit. Holding them fixed means shrinking bands roughly as 1/population.
- From ~10²³ up, the weave becomes a fine mesh of thousands of short rings, in which ring changes are cheap but each ring is a narrow strip.
- At 10²⁴ even that takes ~400,000 rings. A week-long worst night is the practical compromise there: ~180,000 km bands, ~6,400 residential rings, ~350 kg of flywheel per person.
- The weave favors swarms of 10²²–10²³.
- **Where the weave's ring era ends is open.** The ~16-year limit in swarm-rings.md comes from parallel bands stacked along much of their length. Woven neighbours cross at several degrees and overlap on well under 1% of their length, so that pull mostly vanishes, and the weave could outlast the slice. If the stacking pull did apply, quarter-height bands nested h/50 apart would hit it at ~4-year orbits (~4 × 10²³ people). It needs its own analysis.

## Connectivity
- **Ring changes happen at crossings.** A vehicle rides a track running up its own band (across the direction of travel) until it matches the other ring's velocity, then hops the radial gap.
- Each ring has ~6 near-parallel neighbors at the costs in the table. A ring tilted 60° away is ~9 hops (~8 GJ at quarter height); jumping there directly would cost ~62 GJ.
- Stack rings so that similar tilts sit near each other in radius, to keep the radial hops short.
- **Contrast with the orange slice:** there, a far ring is far away but cheap to reach (60° along the interchange belt is ~2 months at 20 km/s, ~2.4 GJ). In the weave every ring crosses yours, but most are moving the wrong way.
- **Freight:** every residential ring has remote rings within ~4° of its tilt: ~7 km/s, ~0.75 MJ/kg, ~5 W per person for 200 kg of goods a year. Compute needs no freight; data goes by laser.
- Travel along your own ring is unchanged (swarm-rings.md, energy-budget.md).

## Living in the weave
- From any habitat, other rings' bands cross the sky at every angle. A few times a day one of their shadows sweeps over.
- Inner rings are prime real estate: the steadiest light and the densest population. Outer residential rings are dimmer, with more band per person.
- Rings in different shells slide past each other at up to ~200 km/s, thousands of km apart. Traffic between rings has to thread the gaps.
- Knot nights survive wherever the orange slice is still the right call (below), and in machine-only rings where nobody minds.

## When the orange slice is still the right call
Builders would see knot nights coming as clearly as we did, so the orange slice gets built only where it wins on the numbers.
- **Mid-sized hole (hole-choice.md).** Orbits take ~1.4 days at 10²², so knot nights last ~5–8 hours and the deep knot ~1 hour. Flywheels are ~6 kg per person. The slice catches all the light with the least band and keeps free ring changes, so a weave would throw away a quarter of the light for nothing.
- **Small 10 M☉ swarms.** Below ~10²¹ people, nights are hours to ~3 days and storage is cheap. An early swarm that starts as a slice is locked in: light pressure (~10⁻⁸ m/s² on a loaded band) would take tens of thousands of years to re-tilt a ring by 10°. Growing past ~10²² means building new rings woven, and thinning or retiring the old slice, whose full coverage would otherwise shade everything outside it.
- **A light-starved 10 M☉ swarm at 10²².** Here it's a close call. The slice keeps ~37% more people per unit of the hole's light and free ring changes, for ~3–7% of the heavy-element budget in flywheels (less if its bands are shortened too) and a ~2-day brownout per deep-knot pass, when habitats must bank their heat. A civilization short of light rather than metal could rationally keep it.
- **At 10²³ and up around a 10 M☉ hole,** no one would: nights of 2–3 months and deep knots of ~2 weeks.

## Knock-on changes
- **swarm-rings.md:** the orange slice stays as the least-band way to cover the sky. Its knots, Seam and interchange belt, and the knot-night and interchange rows of its scale table, describe that layout only.
- **energy-budget.md:** the knot-night section is superseded. Firm-load overhead for storage could fall from 10% to a few percent; figures here keep 10% as margin. Light caught per person is unchanged (~7.5 kW firm, ~7.3 kW remote), but the hole must supply ~20.5 kW per person.
- **xray-power.md:** plates see hour-long eclipses instead of multi-day nights. A 2 mm plate cools ~10–70 K per eclipse-hour, so many small thermal cycles replace a few large ones.

## Open questions
- The actual tilt set and stack order. A space-filling order through the tilts would keep near-parallel rings close in radius.
- Roofing: remote rings cover ~55–75% of the residential rings' outward view. If residential radiators and tile backs run too warm under them, move the remote rings farther out, where they run colder.
- The Kerr disk's brightness by direction, now that each ring samples a different range of latitudes.
- The hole's feed rate: the weave needs ~37% more output per person.
- Where the weave's ring era ends, given that its bands cross rather than stack.

## Method
- Rings are great-circle bands of angular width (band height ÷ radius) as seen from the hole, nested in radius. A habitat is dark when any ring inside it covers its direction.
- Orbital phase is binned at 2¹⁷–2²² steps per orbit, with 7–20 positions across the band. Every ring was scanned for the 84-, 335- and 838-ring stacks.
- Tilts come from repulsion on the space of lines through the hole, or on a cap leaving 10° around the spin axis; a Fibonacci spiral above 1,000 rings. Stack order is random.
- Checked against energy-budget.md: the orange slice gives mid-band habitats dark 1/3 of the time in nights of 1/6 orbit, and edge habitats dark ~0.46 in nights of ~0.23.
- Storage is the largest running shortfall when 70% of each habitat's average draw is held firm and surplus goes to flexible loads.
- Ring-change energy assumes a 400 kg seat and 3% of the kinetic energy lost per change, as for any trip (swarm-rings.md).
- Worst nights above ~1,000 rings are extrapolated as (ring count)^−0.47 from the full scans (±25%).
