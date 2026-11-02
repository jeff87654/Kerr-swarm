# Swarm layout: orbiting rings around the hole

*Design notes from a working session, Sept 2026. Builds on claude/habitat-design.md (deck drums: ~6 t heavy elements per person). Energy per person: claude/energy-budget.md. X-ray conversion: claude/xray-power.md. For a 10 M☉ hole at 10²² people and up, claude/ring-weave.md weighs a woven layout against this one. Tables rescaled to 15 kW of light per person, Sept 30. Nation-drum figures updated Oct 2026 for the 3 km drum (habitat-design.md).*

*Scope: **a design study for a 10 M☉ hole**, not this civilization's history. This civilization's ring era was around the starved Sgr A\* before it was fed: ~10²⁵ people at ~18 AU on 13-day orbits, with knot nights of hours to a couple of days (claude/hole-choice.md). Rings hold only while orbits take less than ~16 years (see Ring mechanics). At 1 kW/m² that caps a ring swarm at ~3 × 10²⁴ people around a 10 M☉ hole, ~6 × 10²⁶ around a mid-sized one and ~3 × 10²⁸ around a starved Sgr A\*. The mature civilization, Sgr A\* fed at 30% of Eddington, has no rings: collectors hover in a closed shell and habitats live in its shade (claude/full-swarm.md).*

## Assumptions
- 10 M☉ Kerr hole. The swarm sits where light is ~1 kW/m² (Earth-like), so the outer skin radiates at ~364 K.
- 15 kW of light caught per person: the common budget in energy-budget.md (~3.1 kWe delivered, plus 10% for knot nights) at the ~22% X-ray conversion in xray-power.md. That gives 0.067 people per m² of sky, or 0.042 per m² of ring band once overlaps are counted (~24 m² of band per person). The first version of these tables used 10 kW.
- Ring structure: a tapered carbon compression truss worth 10% of band mass (~0.67 t per person), with 1 MJ/kg effective compressive strength (buckling-limited). Tension members work at 3.3 MJ/kg.
- Transport: vacuum maglev with 400 kg per seat, 1 g acceleration, and 97% of kinetic energy recovered on braking (3% lost per trip).

## Ring mechanics
- Each ring orbits at orbital speed, so the hoop carries almost no tension.
- In the ring's frame, tides stretch it radially (3Ω²x) and squeeze it toward its orbital plane (Ω²z).
- Maximum band height is h ≈ 2√(3 f s_c)/Ω ≈ (1.1 km/s ÷ orbital speed) × orbit radius.
- Band height does not depend on what the band carries: a heavier load needs a proportionally heavier frame, so the frame's mass fraction (and h) stays fixed. Heavier habitats cost more frame per person, not a shorter band.
- Maximum radial depth is ≈ 2√(f s_t)/Ω, about the same as h. It never binds. Stacking habitats radially adds no people, because energy caps people per m² of sky.
- A band needs a truss about 2% of its height deep to avoid buckling. Rings therefore nest ~h/50 apart in radius, and the whole stack spans ~6% of the orbit radius.
- A rigid ring drifts off-center (the Ringworld instability), e-folding in ~0.22 orbits. Rings steer by varying reflectivity, since light pressure is enough.
- Tides on a nation drum (~6 km across) are ~1e-9 g, which is negligible.
- Band height and people per ring both scale as √(structure fraction × compressive strength).
- **What ends the ring era.** Stacked bands attract each other at 2πGΣ whatever their spacing, ~3 × 10⁻⁷ m/s² for ~650 kg/m² bands.
  - Tides push a nudged band back by Ω² × its gap from the next band. The gap is h/50 and h = 1.1 km/s ÷ Ω, so the restoring force is 22 m/s × Ω: it falls as 1/(orbital period).
  - Bands stay apart only while the period is under 22 m/s ÷ GΣ ≈ 16 years. The outer bands of a deep stack at a knot are pulled harder, so the real limit comes a bit sooner.
  - ~650 kg/m² is a planning middle. Bands that also carry the remote loads weigh ~450 kg/m² (limit ~23 years); people-only bands, with remote loads on rings of their own, weigh ~900 kg/m² (~11 years). The ~3 × 10²⁴ cap is good to a factor of ~2 either way.
  - That happens long before the swarm's mass matters: at the limit a 10 M☉ ring swarm weighs ~0.15% of its hole.

## Layout: orange slice
- **Knot nights depend on the hole.** Around a 10 M☉ hole they run 12–17 days at 10²² (15 kW of light per person); claude/ring-weave.md weaves the rings to cut the worst night under a day, at the cost of ~27% of the light and free ring changes. Around a mid-sized hole (claude/hole-choice.md) they last hours, and the orange slice stays the better build.
- All rings share one axis, like orange segments, each turned w = h/r from the last. There are n = π/w rings.
- This is the least total band width that can cover a sphere (Jiang & Polyanskii 2017, proving Fejes Tóth's zone conjecture). 60 randomly tilted rings would need ~5× the width.
- Band area is π/2 × the sphere, so a given spot on a ring is lit ~64% of the time.
- **Knots:** both ends of the shared axis, where all rings cross, stacked h/50 apart. Neighbors there slide past each other at 1.1 km/s, the same value at any swarm size. Twice an orbit every part of a ring passes through a knot, where it is shaded from below and roofed from above ("knot night"). The shadow is much longer than the deep knot: away from the interchange line only a strip along one edge of each band is lit, so a habitat mid-band is dark 1/3 of each orbit, in two nights of 1/6 orbit each, and one near a band edge is dark ~1/2, in nights of up to 1/4 orbit (~0.23 in simulation; energy-budget.md).
- **Interchange line:** the great circle halfway between the knots, where neighboring rings run exactly parallel. Within 5° of it they drift less than 100 m/s apart, so ring changes there are nearly free.
- **The Seam:** after half a turn of the stack, the ring planes return flipped, as on a Möbius strip. The first and last rings border each other counter-rotating, 2× orbital speed apart. This is unavoidable in an orange slice, so place it between the innermost and outermost rings.
- Kerr: the disk doesn't shine evenly in all directions, so light per person varies along each ring. If the hole has jets, align the spin axis with the interchange line and leave a slot between two neighboring rings for them, costing a few percent of the light.

## Scale table
At 15 kW of light per person and 1 kW/m²:

| Swarm population | 10²¹ | 10²² | 10²³ | 10²⁴ |
|---|---|---|---|---|
| Heavy elements (~7.4 t/person with tiles and parasols) | 1.2 Earths | 12 Earths | 120 Earths | 1,200 Earths |
| Light used (Sun = 1) | 0.04 | 0.39 | 3.9 | 39 |
| Ring radius | 0.23 AU | 0.73 AU | 2.3 AU | 7.3 AU |
| Orbital speed, period | 196 km/s, 12.8 d | 110 km/s, 72 d | 62 km/s, 1.1 yr | 35 km/s, 6.2 yr |
| Max band height | 194,000 km | 1.09 M km | 6.1 M km | 34 M km |
| Ring spacing (~h/50) | 3,900 km | 22,000 km | 123,000 km | 690,000 km |
| Rings | 560 | 315 | 177 | 100 |
| People per ring | 1.8e18 | 3.2e19 | 5.7e20 | 1.0e22 |
| Within 1 day on own ring (20 km/s) | 3e16 | 1.5e17 | 3.9e17 | 3.9e17 |
| Deep knot night (≥10 layers), per passage | 0.4 d | 2.3 d | 13 d | 73 d |
| Full shadow per passage, mid-band / edge | 2.1 / 2.9 d | 12 / 17 d | 68 / 93 d | 1.0 / 1.4 yr |
| Time in ±5° interchange belt, per pass | 0.36 d | 2 d | 11 d | 63 d |

- 10²⁴ is close to the ring era's end around a 10 M☉ hole; past ~3 × 10²⁴ (orbits over ~16 years) the stack would collapse.

## Transport (10²² swarm)
- 20 km/s cruise, reached in 34 min at 1 g. A one-way trip costs 2.4 GJ, about 9 days of a person's common energy budget (energy-budget.md).
- 10 km/s: 0.6 GJ per trip, 1e17 people within a day. 50 km/s: 15 GJ per trip, 2.4e18 people.
- In 2D, each extra GJ of trip energy puts about 1.6e17 more people within a day's reach.
- Following the ring's curve at 20 km/s takes a ~0.005 g push toward or away from the hole. The band's tidal "hill" (0.15 MJ/kg from center to edge) is recoverable.
- Changing rings takes a radial hop of ~22,000 km, nearly free near the interchange line and at most 1.1 km/s anywhere else.

| Travel time | Distance | Own ring | Changing rings |
|---|---|---|---|
| 10 min | 880 km | 1e11 | same |
| 1 h | 32,000 km | 1.4e14 | same |
| 3 h | 175,000 km | 4e15 | same |
| 12 h | 820,000 km | 7e16 | 9e16 |
| 24 h | 1.7 M km | 1.5e17 | 3.9e17 |
| 1 week | 12 M km | 1.1e18 | 1.9e19 |

## Habitat size and spacing
- Habitat size cancels out of reach. Energy fixes people per m² of band (~24 m² each) and tides fix band height regardless of load, so a band carries ~4.6e10 people per km of ring length however they're chunked: ~16,000 nation drums across its height or ~2,700 world drums.
- A nation drum (~200 M, 3 km in radius) occupies a ~69 × 69 km patch (neighbors ~3 min apart at 1 g); a world drum (7 B) a ~400 × 400 km patch (~7 min apart). Past ~5–10 minutes of travel, reach is the same for either; the reach table applies to both.
- Where size does matter: (1) short trips: a world drum puts 7 B people under one hull; (2) getting out: trips usually start and end at the spin axis, and Coriolis limits elevator speed, so reaching the dock takes a few minutes in a nation drum and a quarter hour or more in a world drum; (3) heat plumbing: at ~1 kW of in-hull heat per person (energy-budget.md), radiators reach ~46 km from a world drum vs ~8 km for a nation drum — a modest cost.
- About 1.3e11 people live within 1,000 km (11 minutes by maglev) at any habitat size.
- Choose habitat size for life inside (community size, gravity, distance to the dock), not for transport.

## Open questions
- Which swarm size fits the metal inventory (population ≈ heavy elements ÷ ~7.4 t with tiles and parasols)?
- Knot nights: see claude/ring-weave.md for the woven alternative and when each layout wins. Smearing the knots helps in proportion to how far the ring axes spread; spread them all the way and you get the weave.
- The Kerr disk's actual angular brightness pattern, and whether the hole has jets. For a thin disk (the fed hole), full-swarm.md uses face-on brightening of ~2.6× at the poles; a starved hot flow is less directional.
- How a ring-era civilization hands over to the full swarm as the hole is fed (full-swarm.md, "From rings to the full swarm").
