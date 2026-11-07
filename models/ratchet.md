# The ratchet: models of the wish for children

*Working note, 6 Nov 2026, from a conversation with Jeff about whether the Shade's births really wait on deaths, whether norms can hold two children against selection, and how drums differ in family size and inheritance. Three models: `ratchet.py` (a cohort model of a drum; output in `ratchet-results.txt`), `share_market.py` (a family tree on `stem_places.py`; outputs in `out/`) and `regimes.py` (a generation model of every inheritance and birth rule; outputs in `out/`). The canon they feed is people.md § What births do to the gene pool and families.md, which sets out the kinds of drum; the numbers are models, not canon. This note was revised three times on 6 Nov as the models, and then an independent review, falsified earlier claims (§ What changed).*

## At a glance
- **Births never waited on deaths.** Earth gated households, not parity: an heir's marriage, and so his first children, waited on the farm (Hajnal's Europe, Japan's *ie*, the *Altenteil*). Nobody held a third child for a grandparent's funeral. In the docs, births follow places and wallets follow deaths.
- **A child in a drum is cheaper than any child on Earth.** Food, school, clinic and air are the commons', per head; nobody has to work; there are 120 years of time; a third costs its household ~20% of its wallet, and the child's 1.1 kW of commons falls on the whole drum. Earth's modern cases say culture decides in that regime, and selection works against a two-child culture.
- **There is a floor under the wish.** About one couple in twenty has no children, so at par the rest must average 2.1 children who head households, and a family of two leaves at most two. The families with a third replace the childless, so couples who want a third out-breed the rest by at least 0.105 ÷ the share who want one. Every child in a drum grows up and can fill a vacancy, so no rule that keeps a drum's households fixed gets below the floor; only replacing the childless with children nobody chose removes it.
- **Inheritance rules set how far above the floor a third sits.** Under canon's stem places every child's chance of a household is the same (~0.9 at 16% over par) whether heirs marry by age or by share, and only a little less when they choose by portion. Ranking children by family size (portions or birth order deciding every household) brings it to the floor; split estates and sibling households sit between.
- **Birth rules set the numbers and the ending.** Custom and rent hold until a Count, in ~450–1,000 and ~300–450 years from par. A price or a market holds the numbers while the wish's strength climbs without end. A draw for thirds among the couples who want one holds the numbers and lets the wish saturate, and then rests on how the drum answers thirds born without a permit.
- **Medicine lowers the floor, and pushes a drum over par first.** At 1% childless instead of 5% the floor is a fifth as high, but a drum whose clinics improve has more births at once, so a custom drum counts in ~330 years instead of ~600, and its wish climbs more slowly only after that.

## What changed
- **First version (PR #22).** Assumed a third competes only for the slots the childless free, a chance of 0.1 ÷ 0.95p, and that a share-based marriage market could add a cost m to its siblings. It said stem places slow the drift two- to fivefold, that a pool with a lottery removes the selection, and gave a Lack table in which m = 0.5 settles a drum ~8% over par.
- **Second version (PR #23, first commit).** The family tree (`share_market.py`) showed every child's chance of a household is the same, ~1 ÷ (1 + excess births), and m ≈ 0 under three marriage markets: stem places cap the overshoot but don't slow the selection. A new Lack table needed m ≈ 1 to hold par.
- **Third version.** That Lack table broke an accounting identity: the room the childless leave must go to someone's extra child, so a third's cost to its siblings only moves households between children, and a family with a third leaves at least 0.105 ÷ p more than a family of two (the floor). The first version's slot chance turns out to be exactly the floor: it described a drum that ranks children by family size, not canon's stem places. The lottery pool doesn't remove selection either: only couples who want a third use a drawn right, so wanting pays by the floor. `regimes.py` measures every rule against the floor, and families.md is the typology.
- **Fourth version, after an independent review.**
  - The floor is stated in the share *wanting* a third, which is the share having one only where nothing rations thirds.
  - Split estates are outside it, since they fix no number of households.
  - Rank, order, the draw and the market reach the floor by construction; the model confirms the arithmetic for them rather than testing it.
  - "The draw is the only ending steady in numbers and wish" is withdrawn. The drum's own children is steadier. A draw with a price on unpermitted thirds is a priced drum at the margin. The mean wish creeps on under a draw after the share wanting saturates.
  - `regimes.py` had credited each generation's advantage to the next generation's share wanting, an off-by-one, now fixed; its stem regime is primogeniture, not canon's line rule, and is now labelled so.
  - The medicine runs now start from canon's wish as well as from the new par, which shows a drum going over par when its clinics improve.
  - The years counting after a first Count are now the share of the years after it (two-fifths to a half for custom), not of all 3,000.
  - Sorrel's giftable rights move most of its room by gift, not lottery; people.md's lottery of unspent rights now includes the childless who never give theirs away.

## Earth precedents, and where they stop
| Earth | What was gated | On what | Echo in the Shade |
|---|---|---|---|
| Northwest Europe (Hajnal 1965) | Marriage, so first births | A holding or a position; 10–20% never married | Places: a household in the late 20s |
| Stem families: Austria, Ireland, Japan's *ie* | The heir's marriage | The father's death or retirement (*Altenteil*) | The heir's first children did wait on a death; a third child never did |
| The portion (Ireland's fortune, the German *Abfindung*) | A non-heir's marriage to an heir | The family's wealth, split among its children | Portion drums (families.md) |
| South German marriage laws, 19th c. (Knodel 1967) | Marriage among the poor | Proof of means | Split estates' minimum; births moved outside marriage |
| Tibetan fraternal polyandry (Goldstein 1976) | Marriage, so households | Keeping a holding whole | Sibling households |
| Tokugawa Japan 1720–1850 (Smith 1977) | Family size | The holding, by norm; *mabiki*; a closed country | The nearest model of a drum: fixed land, no outlet, flat population for ~4 generations |
| Plato, *Laws* V (5,040 lots) | Births, surplus sons | A fixed count of hearths; adoption into childless houses; colonies | The whole Shade mechanism, as a legislative fiction |
| Singapore 1972–2001 | Third births | Delivery fees and lost school places, reversed to bonuses when the sign flipped | The posted price and the purse |
| China 1980–2015 | Births | Licences, fees, the IUD | Rungs 2–4 of people.md's ladder |

- **The gap.** Earth never needed to match births to deaths one for one, because death did the matching. The Shade has low, predictable mortality, an exact count and cheap children, so selection on the wish for children has nothing to slow it but the drum's own rules, for thousands of years. Earth's own intergenerational fertility correlations predict the same climb after a transition (Kolk, Cownden and Enquist 2014; Collins and Page 2019).

## Why children are cheap in a drum
| Cost of a child | Earth, middle class | A drum (economy.md, daily-life.md) |
|---|---|---|
| Food, health, schooling | The family's, ~15–25% of income a child for ~18 years | The commons, per head |
| Housing | The largest cost; among the strongest correlates of low fertility (Dettling & Kearney 2014) | The family's place, already held; a third crowds 78 m² |
| Parents' time | Lost wages, childcare | Nobody has to work; 120 years; tables and aunts |
| The wallet | — | Four wallets across five people: 21.6 → ~17 kWh a head |
| Falls on others | Little | The child's 1.1 kW of commons, on the whole drum |

## The family tree: does a third cost its siblings?
`share_market.py` runs `stem_places.py`'s family tree (~15,000 people, stem places, shares freed by deaths and passed to the family's longest-waiting shareless member) with the wish for a third raised so that couples have 2.18 or 2.38 children, lets the drum settle 300 years over par, tags every household whose whole brood is born in a 30-year window, and follows the children for 120 years.

| Children a couple | Market | Pop / par | Each child's chance of a household: two-child homes / a three-child home's first two / its third | A third's advantage (w3 − w2) | m, by the children | m, by the line |
|---|---|---|---|---|---|---|
| 2.18 | by age (canon) | 1.16 | 0.94 / 0.96 / 0.90 | +0.94 | −0.04 | −0.07 |
| 2.18 | heirs take only share-holders (two seeds) | 1.16–1.17 | 0.93–0.95 / 0.95 / 0.88 | +0.89–0.92 | −0.04…−0.01 | −0.02…+0.04 |
| 2.18 | like marries like by share | 1.16 | 0.94 / 0.95 / 0.86 | +0.90 | −0.03 | +0.03 |
| 2.18 | heirs take the largest portion (two seeds) | 1.12–1.15 | 0.95 / 0.92–0.94 / 0.86–0.89 | +0.84–0.85 | +0.02…+0.04 | +0.10…+0.12 |
| 2.38 | by age | 1.30 | 0.84 / 0.86 / 0.79 | +0.82 | −0.04 | −0.01 |
| 2.38 | share-holders only | 1.27–1.29 | 0.83 / 0.86 / 0.75 | +0.80 | −0.05 | −0.02 |
| 2.38 | like by share | 1.29 | 0.85 / 0.85 / 0.76 | +0.76 | 0.00 | +0.11 |
| 2.38 | largest portion | 1.28 | 0.91 / 0.85 / 0.77 | +0.65 | +0.13 | +0.17 |

- **Every child's chance is the ratio of adult slots to children,** ~1 ÷ (1 + excess births): 0.92 at 2.18 children a couple, 0.84 at 2.38. A third pays 3–8 points for being born last.
- **A share doesn't reach the marriage.** A third's share deficit lands on the longest-waiting shareless member of the kin group and clears at the next family death.
- **A portion reaches it, a little.** Heirs who take the largest portion cut a third's advantage from ~0.9 to ~0.85, and from ~0.8 to ~0.65 when half of couples want a third, because most households come down the line rule at a death, not through a marriage. This is the realistic test of portions; the generation model's rank regime is the limit where the marriage market decides everything.

## The generation model: every rule against the floor
`regimes.py`: ~4,000 places, whole generations, a heritable wish for a third (b = 0.5), 5% childless by chance, at most three children, one regime per rule (families.md § Method). The advantage selection sees, couples who wanted a third against couples who didn't, credited to their own generation and binned by the share of that generation wanting one; mean ± standard error over four runs (`out/regimes_table.txt`). The last column is the mean wish at generation 150, in standard deviations of an individual's wish (a couple's mean has variance ½, so these run √2 higher than the cohort model's household units).

| Rule | 0.25–0.35 | 0.45–0.55 | 0.75–0.85 | 0.90–1.00 | Size of a generation / par | Mean wish at the end |
|---|---|---|---|---|---|---|
| The floor, 0.105 ÷ p | 0.35 | 0.21 | 0.13 | 0.11 | — | — |
| Stem places to the eldest (primogeniture), heirs marrying at random | 0.86 | 0.74 | 0.61 | 0.57 | 1.06–1.43 | 2.53 |
| Portions decide every household | 0.35 | 0.21 | 0.13 | 0.11 | 1.03–1.43 | 2.33 |
| Portions, softly (× lognormal 0.5) | 0.44 | 0.30 | 0.20 | 0.17 | 1.04–1.43 | 2.41 |
| Birth order decides every household | 0.35 | 0.21 | 0.13 | 0.11 | 1.04–1.43 | 2.33 |
| A draw among couples who want a third | 0.35 | 0.21 | 0.13 | — | 1.00 | 1.71 |
| Rights to the most eager (price or market) | 0.36 | 0.21 | 0.13 | 0.11 | 1.00 | 4.62 |
| Sibling households, excess leave by lot | 0.80 | 0.69 | 0.60 | 0.58 | 1.07–1.49 | 2.53 |
| Sibling households, third-born leave first (4 / 12 a generation) | 0.66–0.68 | 0.48–0.52 | 0.34–0.38 | 0.29–0.34 | 1.05–1.49 | 2.44–2.45 |
| Split estates, a couple's minimum (random / like with like) | 0.41–0.45 ±0.02 | 0.25–0.28 ±0.02 | 0.28–0.35 ±0.09 | 0.31–0.36 ±0.05 | 0.29–1.63 | 2.16–2.23 |
| Split estates, each partner's minimum | 0.66 ±0.01 | 0.57 ±0.02 | 0.59 ±0.07 | 0.66 ±0.02 | 0.14–1.53 | 2.35 |

- **Ranking, the draw and the market sit on the floor by construction.** Each places every child of a two-child family before any other, so the model confirms the identity for them rather than testing it. Nothing sits below the floor except, in single generations, split estates, which fix no number of households.
- **The draw and the market differ in what climbs.** Under both the share wanting a third saturates, but under a draw the wish then creeps (1.71 sd at generation 150), while under rights to the most eager its strength climbs linearly (4.62 sd), since the eager always win.
- **Primogeniture isn't canon.** The model's stem regime gives every place to the eldest, so a third gains only a younger child's chance, about 1.105 ÷ (1 + p); canon's line rule gives every child the same chance, 2.105 ÷ (2 + p) (the cohort model and the family tree), 0.13–0.15 more once most couples want a third.
- **Split estates swing.** A generation born to thick holdings is followed by a thin one; whole generations and couples paired once with no re-matching exaggerate it, and overlapping lives would damp it. Their per-generation advantage has a standard deviation of ~0.7, so the bins are long averages.

## The cohort model
`ratchet.py` is an age-structured cohort model of a 200 M drum at 120-year lives (Gompertz mortality, births at 35 ± 6) with ~90 M stem places and a latent wish for a third d, standard normal at founding; a household has a third when d exceeds a threshold. Each cohort's mean rises by b × S, S the offspring-weighted mean of d minus its mean, b = 0.2, 0.35 and 0.5 (twin studies' ~0.2–0.4 for completed fertility, plus culture; Kohler, Rodgers & Christensen 1999; Mills & Tropf 2015). Variance is held at 1.

| Regime | Fitness of a third / of two | Births |
|---|---|---|
| Custom (stem places by canon's line rule) | 3f / 2f, f = 1 ÷ (1 + excess) | From the places: par × (1 + 1.5 × excess) |
| Custom, rent pushing back (k = 3) | as custom, threshold + 3 × overshoot | as custom |
| Ranked (portions or birth order deciding every household) | 2 + 0.105 ÷ p / 2 | as custom |
| Rented rooms (a home for every couple) | 3 / 2 | Compounding |
| The draw | wanting: 2 + 0.105 ÷ p / not: 2 | Held at par |
| Price or market | 3 / 2 for the eager tenth; the threshold moves with the mean | Held at par |
| The drum's own children (`own`) | no selection | Held at par |

A Count at 10% over par clears to 2% under over ~15 years by lot, never licensing fewer than half the par births, and pauses selection.

| Regime | First Count, b = 0.2 / 0.35 / 0.5 | Share of later years counting | Share with a third (draw: wanting one) at 1,000 / 3,000 yr |
|---|---|---|---|
| Rented rooms | 440 / 340 / 290 | 18–29% | 0.25–0.64 / 0.75–0.96 |
| Custom | 990 / 600 / 450 | 37–49% | 0.26–0.61 / 0.68–0.93 |
| Custom, rent pushing back | 1,430 / 840 / 600 | 39–50% | 0.20–0.51 / 0.68–0.90 |
| Ranked | 1,430 / 850 / 620 | 26–37% | 0.20–0.34 / 0.38–0.63 |
| The draw | never | 0 | 0.20–0.37 / 0.42–0.73; half want one at 3,810 / 2,180 / 1,530 yr |
| Price or market | never | 0 | 0.105, held; the wish's mean climbs ~1 sd every 2,020 / 1,160 / 810 yr |
| The drum's own children | never | 0 | 0.105 |

And with fewer couples childless (`ratchet-results.txt`, last section, b = 0.35), from a wish set for the new par and from one set for canon's 5% (the clinics improve in a drum that was at par):

| Childless | Par thirds | Custom: first Count (new par / from 5%) | Draw: wanting a third at 9,500 / 23,000 yr (new par; from 5%) |
|---|---|---|---|
| 5% | 10.5% | 603 yr | 0.91 / 0.98 |
| 2% | 4.1% | 1,247 / 410 yr | 0.64 / 0.89; 0.69 / 0.90 |
| 1% | 2.0% | 2,167 / 330 yr | 0.31 / 0.68; 0.46 / 0.75 |

At b = 0.2 and 1% childless, 0.43–0.56 want a third at 23,000 years; at b = 0.5, 0.81–0.84.

## Open
- How strongly the wish passes down over thousands of years. Everything scales with b, and a fast churn of fashions lowers it (Kolk et al. 2014).
- Sorrel's Register runs back ~23,000 years, long enough at 5% childless for the wish to have saturated under every rule but the drum's own children, and better medicine prevents that only if b is near 0.2. Canon must choose between saturation, weak transmission and the drum's own children (families.md, deliberately open).
- How drums with a draw answer thirds born without a permit, which decides whether the draw stays steady.
- The posted price in kWh, and where priced drums cap it.
- Whether the edit arrives, and whether refusers of it are counted (people.md; deliberately open).

## Method
- `python3 ratchet.py > ratchet-results.txt` (numpy, scipy; ~1 min, most of it the medicine runs to 23,000 years).
- `python3 share_market.py <none|heir|assort|portion> [e] [seed] > out/<market>_<e>_<seed>.txt` (~2 min a run).
- `python3 regimes.py table > out/regimes_table.txt` (~10 min, four runs of twelve regimes); `python3 regimes.py all > out/regimes_all_b0.5_s1.txt`; variants: `out/regimes_b0.5_s2.txt` (seed 2), `out/regimes_b0.2_s1.txt` (b = 0.2), `out/regimes_joint_cap12.txt` (12 a generation), `out/regimes_partible_h1.0.txt` (split estates with a minimum of a whole place a couple, where most founder couples fall below it and the drum halves in a generation).

## Sources
- J. Hajnal 1965, "European marriage patterns in perspective," in Glass & Eversley (eds), *Population in History*.
- C. Arensberg & S. Kimball 1940, *Family and Community in Ireland* (the match and the fortune).
- T. C. Smith 1977, *Nakahara: Family Farming and Population in a Japanese Village, 1717–1830*.
- Plato, *Laws* V, 737e–741a (the 5,040 lots).
- Population planning in Singapore (Wikipedia): https://en.wikipedia.org/wiki/Population_planning_in_Singapore
- J. Knodel 1967, "Law, marriage and illegitimacy in nineteenth-century Germany," *Population Studies* 20(3): 279–294.
- M. C. Goldstein 1976, "Fraternal polyandry and fertility in a high Himalayan valley in northwest Nepal," *Human Ecology* 4(3): 223–233.
- R. A. Fisher 1930, *The Genetical Theory of Natural Selection*.
- D. Lack 1947, "The significance of clutch-size," *Ibis* 89.
- M. Kolk, D. Cownden & M. Enquist 2014, "Correlations in fertility across generations: can low fertility persist?" *Proceedings of the Royal Society B* 281: 20132561.
- J. Collins & L. Page 2019, "The heritability of fertility makes world population stabilization unlikely in the foreseeable future," *Evolution and Human Behavior* 40(1): 105–111.
- H.-P. Kohler, J. L. Rodgers & K. Christensen 1999, "Is fertility behavior in our genes? Findings from a Danish twin study," *Population and Development Review* 25(2).
- M. C. Mills & F. C. Tropf 2015, "The biodemography of fertility: a review and future research frontiers," *Kölner Zeitschrift für Soziologie und Sozialpsychologie* 67 (Suppl. 1).
- L. J. Dettling & M. S. Kearney 2014, "House prices and birth rates," *Journal of Public Economics* 110.
- D. S. Falconer & T. F. C. Mackay 1996, *Introduction to Quantitative Genetics* (the breeder's equation).
