# Kerr swarm

Worldbuilding for a far-future human civilization living around a Kerr black hole. The baseline is Sgr A\* fed at 30% of its Eddington luminosity and held there as it grows: the hole's glowing envelope (the Lantern) beams power to rafts of nation drums in the Shade outside it. Population is very high (~10³³ people) and resources per person are tight: about 2 kWe of electricity, ~6.7 t of heavy elements and ~3 m² of raft area each.

This repository is the source of truth for the design docs. The older Google Drive mirror is retired.

## Canon decisions

When docs disagree, `full-swarm.md` (Oct 2026 revisions) is the baseline for the mature civilization, and the newer detailed docs (`element-cycles`, `raft-habitat`, `drum-transport`, `governance`, `economy`) beat older ones. Ring-era docs stay valid for ring-era numbers. Decisions from the consistency audit of 29 Oct 2026:

- **Raft area:** 3 m² per person, sized for the 2 kWe life. A raft at the full common budget would need ~3.5 m² for its radiators.
- **Growth horizon:** ~2 Gyr (hole grows ~19×). Drums take ~75% of their metal from white dwarfs (`element-cycles.md`); 1.1 Gyr is only the all-solar-mix case.
- **Metal:** the 30% civilization holds ~4.3 × 10⁶ M☉ of heavy elements.
- **Travel shields:** sealed water only. Polyethylene is banned because it leaks hydrogen.
- `hole-choice.md` uses 4.06 kWe per person for the fed-hole rows. Cryocoolers pause only while boil-off is used or stored.

## Docs

All in [`docs/`](docs/).

**The mature civilization**
- [full-swarm.md](docs/full-swarm.md): the Lantern and the Shade, the baseline layout and growth at 30%
- [matter-delivery.md](docs/matter-delivery.md): where the metal comes from and how it arrives
- [element-cycles.md](docs/element-cycles.md): what's recycled, parked or lost, element by element
- [sgr-a-scope.md](docs/sgr-a-scope.md): feeding Sgr A\*, disk control, metal supply, the layer era

**Habitats and getting around**
- [habitat-design.md](docs/habitat-design.md): the standard deck drum and its water moat
- [raft-habitat.md](docs/raft-habitat.md): a 3 km nation drum standing in a raft
- [drum-transport.md](docs/drum-transport.md): travel inside a drum (the Lattice, cabs, the Spindle)
- [raft-transport.md](docs/raft-transport.md): travel between drums (the Glide, tubes, cyclers)

**Energy and food**
- [energy-budget.md](docs/energy-budget.md): the per-person power budget
- [xray-power.md](docs/xray-power.md): turning the hole's X-rays into electricity
- [food-system.md](docs/food-system.md): the Mill, the Vats and the Garden
- [cuisine.md](docs/cuisine.md): what the kitchens make and what it costs

**Society**
- [daily-life.md](docs/daily-life.md): a day on 2 kWe
- [economy.md](docs/economy.md): dividends, wages, places and birth rights
- [governance.md](docs/governance.md): who holds the Lantern
- [ashgrove.md](docs/ashgrove.md): narrative sketch of a family in a nation drum

**Earlier eras and alternatives**
- [hole-choice.md](docs/hole-choice.md): stellar, mid-sized or galactic-core hole
- [swarm-rings.md](docs/swarm-rings.md): the orange-slice ring layout
- [ring-weave.md](docs/ring-weave.md): a woven ring layout to remove knot nights
