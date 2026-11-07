# The ratchet: what holds the wish for children at two

*Working note, 6 Nov 2026, from a conversation with Jeff about whether the Shade's births really wait on deaths, and whether norms can hold two children against selection. It answers people.md's open question of 2 Nov 2026, how tightly the wish for children tunes to a place, which turns on who carries a placeless adult's keep. The models are `ratchet.py` (a cohort model; output in `ratchet-results.txt`) and `share_market.py` (a family-tree model built on `stem_places.py`; output in `out/`). Jeff's decisions of 6 Nov 2026 are in people.md's header; the rest is proposal, and the numbers are a model, not canon. Revised the same day: the first version of this note assumed a third child competes for the slots the childless free; the family-tree runs show every child competes alike, which removes most of the slowing I had credited to stem places (§ The share market).*

## At a glance
- **Births never waited on deaths, and the docs now say so everywhere.** Earth gated households, not parity: an heir's marriage, and so his first children, waited on the farm (Hajnal's Europe, Japan's *ie*, the *Altenteil*). Nobody held a third child for a grandparent's funeral. people.md's stem places (2 Nov) already made the place the gate; economy.md and the glossary still said "births wait on deaths" and now say births follow places, wallets follow deaths.
- **A child in a drum is cheaper than any child on Earth.** Food, school, clinic and air are the commons', per head; nobody has to work; there are 120 years of time; a third costs its household ~20% of its discretionary wallet, and the child's 1.1 kW of commons falls on the whole drum. Earth's modern cases say culture decides in that regime (the Nordics at ~1.3–1.6 with everything subsidised, Israel at ~3 with the same subsidies), and selection works against a two-child culture.
- **Stem places cap the overshoot; they don't slow the selection.** Heirs marry by age, not by their partner's birth order, so a third child's chance of heading a household is every child's chance: ~0.9 when the drum is 16% over par, ~0.8 at 29% over. A three-child household therefore leaves 3:2 the reproducing children of a two-child one, as it would with a place for every adult; the placeless just don't compound. The wish climbs a standard deviation every ~800–2,000 years either way; a drum at par is 10% over in ~450–1,000 years under stem places (290–440 with a place for every adult, the difference being only that the overshoot is a stock of placeless rather than growth), and once it has counted it counts a quarter to two-fifths of its years.
- **The marriage market doesn't supply Lack's cost.** I had supposed a shareless sibling spoils the others' matches, as a small portion did in Hajnal's Europe. The family-tree runs say no: with heirs marrying only share-holders, or like marrying like by share, the cost of a third to its siblings is zero within noise, because a third's share deficit is spread over the whole kin group and lands on children's waits, never on anyone's marriage. Lack's tuning needs a third to cost its line about one sibling's household (m ≈ 0.9–1); nothing in the share ledger or the wallet does that.
- **What the instruments do, then.** A posted price holds the population by moving the threshold, and the wish climbs behind it at full speed; it tunes the wish only through what it does to a family's portions, if portions decide matches. A pool with a lottery removes the selection. The Count caps the outcome. A portion economy, in which a non-heir marries an heir with a portion of the family's metal and the portion splits among the children, is the one Earth mechanism that puts the cost on the siblings, and whether a drum's metal can carry it is open.
- **Different drums do different things,** and age sorts them: a young drum runs on custom because it can; one that has counted once has a taste distribution custom can't hold, and prices, pools or counts again. Drums also differ on children born in rented rooms (banned with varying severity, frowned on, or nobody minds), and the last kind runs well above par.

## What the docs said, and what they meant
| Slogan | What the mechanism does |
|---|---|
| "All other births wait on deaths" (economy.md) | Nobody waits to conceive. ~60% of babies arrive before the death that frees their share, and get it ~6 years later (stem model). |
| "A child born ahead of a death has no share until one frees" | True; the household's wallets thin ~20% a head meanwhile. Essentials are the drum's. |
| "A household's births follow its own deaths" | True of the share ledger over a generation, not of what a couple does. people.md's "births follow places, wallets follow deaths" is the accurate line. |
| "Selection tunes the wish for children to a place… by now that has finished" | Only where a third costs its siblings a household. Nothing in the default canon does that, so it hasn't finished and won't. |

## Earth precedents, and where they stop
| Earth | What was gated | On what | Echo in the Shade |
|---|---|---|---|
| Northwest Europe (Hajnal 1965) | Marriage, so first births | A holding or a position; 10–20% never married | Places: a household in the late 20s |
| Stem families: Austria, Ireland, Japan's *ie* | The heir's marriage | The father's death or retirement (*Altenteil*) | The heir's first children did wait on a death; a third child never did |
| The portion (Ireland's "fortune", the German *Abfindung*) | A non-heir's marriage to an heir | The family's wealth, split among its children | The one mechanism that makes a third cost its siblings; no drum has it yet |
| Tokugawa Japan 1720–1850 (Smith 1977) | Family size | The holding, by norm; *mabiki*; a closed country | The nearest model of a drum: fixed land, no outlet, flat population for ~4 generations |
| Replacement fertility (Preston 1978) | Nothing; a response | A child's death prompts another birth | Births respond to deaths; they aren't gated by them |
| Inuit *atiq* | Nothing | A newborn carries a recent dead's name-soul | The naming custom, exactly |
| Plato, *Laws* V (5,040 lots) | Births, surplus sons | A fixed count of hearths; adoption into childless houses; colonies | The whole Shade mechanism, as a legislative fiction |
| Singapore 1972–2001 | Third births | Delivery fees and lost school places, reversed to bonuses when the sign flipped | The posted price and the purse |
| China 1980–2015 | Births | Licences, fees, the IUD | Rungs 2–4 of people.md's ladder |

- **The gap.** Earth never needed to match births to deaths one for one, because death did the matching: mortality was high and variable, children were insurance, and land bound through household formation and famine. When mortality fell, fertility fell below replacement on its own, everywhere, with nothing gating it. The Shade has low, predictable mortality and an exact count, which no Earth society had, and cheap children, which modern Earth doesn't. Tokugawa villages held a fixed holding by norm for four generations; a drum has to hold it for hundreds.

## Why children are cheap in a drum
| Cost of a child | Earth, middle class | A drum (economy.md, daily-life.md) |
|---|---|---|
| Food, health, schooling | The family's, ~15–25% of income a child for ~18 years | The commons, per head |
| Housing | The largest cost; among the strongest correlates of low fertility (Dettling & Kearney 2014) | The family's place, already held; a third crowds 78 m² |
| Parents' time | Lost wages, childcare | Nobody has to work; 120 years; tables and aunts |
| The wallet | — | Four wallets across five people: 21.6 → ~17 kWh a head |
| Falls on others | Little | The child's 1.1 kW of commons, on the whole drum |

- **The one fertility mechanism in the docs that works on the want is tables and aunts.** Allo-parenting meets much of the human wish to nurture without a birth, and at 120-year lives six adults in seven aren't raising a child.

## The share market: does a shareless sibling spoil a match?
`share_market.py` runs `stem_places.py`'s family tree (~15,000 people, stem places, shares freed by deaths and passed to the family's longest-waiting shareless member) with the wish for a third raised so that couples have 2.18 or 2.38 children, lets the drum settle 300 years over par, tags every household whose whole brood is born in a 30-year window, and follows the children for 120 years to see which head a household and how many grandchildren do. Three marriage markets: *none* (pairing by age, as in stem_places.py); *heir* (an established person marries only a share-holder); *assort* (like marries like by share).

| Children a couple | Market | Pop / par | Placeless at 45+ | Each child's chance of a household: two-child homes, a three-child home's first two, its third | w3 − w2 | m, by the children | m, by the line |
|---|---|---|---|---|---|---|---|
| 2.18 (16% over) | none | 1.16 | 7% | 0.94 / 0.96 / 0.90 | +0.94 | −0.04 | −0.07 |
| 2.18 | heir (two seeds) | 1.16–1.17 | 6–7% | 0.93–0.95 / 0.95 / 0.88 | +0.89–0.92 | −0.04…−0.01 | −0.02…+0.04 |
| 2.18 | assort | 1.16 | 7% | 0.94 / 0.95 / 0.86 | +0.90 | −0.03 | +0.03 |
| 2.38 (29% over) | none | 1.30 | 14% | 0.84 / 0.86 / 0.79 | +0.82 | −0.04 | −0.01 |
| 2.38 | heir | 1.27–1.29 | 13% | 0.83 / 0.86 / 0.75 | +0.80 | −0.05 | −0.02 |
| 2.38 | assort | 1.29 | 14% | 0.85 / 0.85 / 0.76 | +0.76 | 0.00 | +0.11 |

m by the children is 2 × (a two-child home's chance − a three-child home's first two's chance); m by the line is the third's own chance less the three-child home's advantage in grandchildren who head households, in reproducing-child units. Each run has 800–1,160 two-child and 430–760 three-child households; the noise on m is about ±0.05.

- **Every child's chance is the same.** It is the ratio of adult slots to children, f ≈ 1 ÷ (1 + excess births): 0.92 at 2.18 children a couple, 0.84 at 2.38, and the model's thirds come within a few points of it. Birth order costs a third 3–8 points, because it is born last and reaches the age of inheriting when more of its cohort is already placed; its elder siblings pay nothing for it.
- **The share doesn't reach the marriage.** Even when heirs take only share-holders, a third's deficit falls on the longest-waiting shareless person in the kin group, who is usually a child of someone, and clears at the next family death; adults without a share at marrying age are 4% of the drum at 16% over and 11–13% at 29%, spread across two- and three-child homes alike (1–6% of tagged children in either are still shareless at the end). The thing I had taken from Hajnal, that a portion-less sibling marries down, needs the family's wealth to be *divided* among its children; a share is per person and comes from a death, and the commons is per head, so there is nothing to divide.
- **So m is what a drum's institutions add, not what its ledger gives.** The ledger gives m ≈ 0.

## The cohort model
`ratchet.py` is an age-structured cohort model of a 200 M drum at 120-year lives (Gompertz mortality, births at 35 ± 6) with ~90 M stem places, plus a latent *wish for a third* d, standard normal at founding. A household has a third when d exceeds a threshold T set by what a third costs it.

- **Stem rules.** Each place passes to one heir; the other children marry heirs elsewhere or stay placeless and childless. Every child's chance of heading a household is f = 1 ÷ (1 + excess), excess = (2 + p)(0.95) ÷ 2 − 1, with p the share of households having a third (the share market, above).
- **Fitness.** A three-child household leaves 3f − m reproducing children, a two-child household 2f. m is any cost a third puts on its line beyond f, in reproducing children: m = 0 is the ledger; m = 1 means a third costs the family one sibling's household, as a portion split three ways would.
- **Transmission.** S is the offspring-weighted mean of d minus its mean (the selection differential); each new cohort's mean rises by b × S, with b the parent–child regression of the wish, genes and culture together: 0.2, 0.35 and 0.5, bracketing twin studies' ~0.2–0.4 for completed fertility (Kohler, Rodgers & Christensen 1999; Mills & Tropf 2015) plus cultural transmission, which in pronatalist subcultures on Earth keeps 85–90% of children. Variance is held at 1 (cultural variation renewable).
- **Overshoot** is the stock of placeless adults, at 1.5× the excess births as `stem_places.py` found at steady state (1.5–1.8× in the share-market runs). The drum counts at 10% over: licences clear the excess to 2% under over ~15 years by lottery, never licensing fewer than half the par births, so selection pauses; the Count ends at par.
- **Regimes.** *Stem* with m and a rent-like push-back k (T rises by k × overshoot); *person*, the earlier canon with a place for every adult (a third founds a household, fitness 3); *indexed*, a posted price that moves with the Count so p stays at par; *equal*, births by lottery.

### Lack's equilibrium
The wish stops climbing where a child's chance of a household equals the cost of a third to its line, f = m, which is 2 ÷ m children a couple.

| m | Children a couple | Households with thirds | Steady overshoot |
|---|---|---|---|
| 1.0: one sibling's household | 2.00 | ~11% | At par |
| 0.95 | 2.11 | ~22% | ~8% over |
| 0.9 | 2.22 | ~34% | ~17% over |
| 0.8 | 2.50 | ~63% | ~38% over |
| 0.7 | 2.86 | every household | ~64% over |
| 0.5 or less | would need 4 a couple to bind | climbs without limit | → ~64% over, counting on the way |

So "the wish tunes to a place" needs a third child to cost its family nearly a whole sibling's household. A drum whose shareless earn ~80% of a wallet by working, whose placeless have full lives, and whose heirs marry by age is at m = 0, and even a drum that somehow put half a household's cost on the siblings would not settle.

### Results: 3,000 years from a drum at par
| Regime | m | k | First Count (yr), b = 0.2 / 0.35 / 0.5 | Share of years counting | Households with thirds at 1,000 yr | at 3,000 yr |
|---|---|---|---|---|---|---|
| Place for every adult | — | 0 | 440 / 340 / 290 | 15–26% | 25–64% | 75–96% |
| Stem | 0 | 0 | 990 / 600 / 450 | 25–42% | 26–61% | 68–93% |
| Stem | 0 | 3 | 1,430 / 840 / 600 | 20–40% | 20–51% | 68–90% |
| Stem | 0.5 | 0 | 1,870 / 1,110 / 800 | 10–29% | 16–31% | 38–75% |
| Stem | 0.8 | 0 | never / 2,820 / 2,000 | 0–8% | 13–16% | 18–33% (settles ~38% over) |
| Stem | 0.9 | 0 | never | 0 | 11–13% | 14–19% (settles ~17% over) |
| Stem | 1.0 | 0 | never | 0 | 11% | 11% |
| Indexed price | — | — | never | 0 | 10.5% (held) | 10.5% (held) |
| Equal (lottery) | — | — | never | 0 | 10.5% | 10.5% |

- **The drift is the same whatever the places** (S = 0.087 sd at par; one standard deviation every ~800–2,000 years), because f is a common factor and cancels. Stem places change only what the drift does to the population: a bounded stock of placeless, 1.5× the excess births, instead of compounding growth, so the first Count waits for a quarter of households to have thirds rather than for a tenth. That is 1.5–2.3× the time, not the two- to fivefold the first version of this note claimed, and it comes quietly: 1.5% over at 200 years, 7% at 500, 10% at 600 (m = 0, b = 0.35).
- **After the first Count it never settles.** The Count resets the population and not the wish; with most households wanting thirds the drum re-overshoots in a generation and counts a quarter to two-fifths of its years, with a hollow cohort echoing after each. Rent pushing back (k = 3) buys ~40% more time and changes nothing after.
- **Only a cost near a whole household holds.** m = 0.5 doubles the time to the first Count and then counts like the rest; m = 0.8 settles ~38% over, beyond the Count's trigger, so it counts a little; m = 0.9 settles ~17% over, which a drum could carry as a standing stock of placeless if it never counted; m = 1 holds par. This is the whole content of "who carries a placeless adult's keep": not the kWh, which the ledger spreads, but whether a third child costs one of its siblings a household.
- **An indexed price holds par and climbs.** With p pinned at par, selection runs at a constant 0.03 sd a generation (b = 0.35), 6.7 sd in 8,000 years: nobody is licensed, the drum never counts, and after a few millennia nearly every couple wants a third and only the tail pays for one. The price tunes the wish only if it also raises m, which it does to the extent a household's wealth decides its children's matches.
- **Only equal births stop the ratchet.** A pool whose excess rights go by lottery has no selection on the wish at all.

## What drums do (proposal)
Rungs 1–2 of people.md's ladder (a price, then penalties) are not counting; they are what steady drums do.

| Drum | What makes a third cost something | Earth echo | Lasts | Fails as |
|---|---|---|---|---|
| Custom holdings | The wallet while the child is shareless; the block's opinion | Tokugawa villages | Several centuries from a fresh distribution of wishes; a generation after any Count | The placeless pile up; the Count |
| Priced holdings (most steady drums) | A posted price for a shareless child's keep, indexed to the Count; a purse under par | Singapore's fees and bonuses; China's fees | Holds the population indefinitely; the wish climbs ~1 sd a millennium behind it, so the price climbs too | A gentry of thirds; hidden births among the poor; in the end nearly everyone wants what only the rich have |
| Portioned holdings | A non-heir marries an heir with a portion of the family's metal, and the portion splits among the children; a third child costs its siblings a third of theirs | Ireland's fortune; the *Abfindung*; the dowry everywhere | Indefinitely, if portions decide matches: the one regime in which the wish tunes itself | Needs metal to be the thing that gates marriage; makes a market in brides and grooms |
| Open drums | Custom with teeth: the Ledger shows each block's births against deaths; blocks over par lose Margin loans and Hollow draws | Irrigation commons (Ostrom); village collective responsibility | Centuries; then most add a price or a pool | Smugness; raiding the Margin |
| Pool with a lottery (Sorrel) | Nothing needs to: births by right, excess rights by lot | China's licences, kindly run; Boulding without the market | Indefinitely; no selection | The shareless child; the wild-born |
| Pool with a market (Lovage) | The price of a right | Boulding 1964 | Indefinitely; selects for the rich and willing | The poor sell their child's right |
| Counted (rung 3+) | The fitting, licences by lot | China 1983, India 1976 | Decades at a time | Legitimacy (people.md) |

- **Children in rented rooms** (Jeff, 6 Nov): drums differ. Some ban a birth to a household without a place, with varying severity; some frown on it and let it happen, and those children grow up poorer; some don't mind. In the model a drum of the last kind is the *person* regime, with a child's chance of a household no longer capped by the places, so its population runs well above par, its rents rise two- to fourfold (economy.md), its commons thins, and it reaches its first Count in 290–440 years. That is a drum with its own character, not a failed one: the rooms are where its people live.
- **Prevalence by age.** Canon's quiet-time split (25% open, 60% steady, 13% thin, 1% counted) holds for a Shade in which most steady drums already price births, and in which open drums are mostly in their first centuries. In a Shade of 10,000 years every drum has been round the cycle: holdings-by-custom is a museum piece, and drums price, portion, pool or count. The story-time age, which the docs leave deliberately open, is partly a choice of where on the ratchet the typical drum sits.
- **The price in kWh is the open empirical question.** The model works in standard deviations of wish and in reproducing children; what a drum must charge to hold p at par is unknown, and Earth's elasticities are small and confounded (Singapore's fees were a few months' wages and are credited with little). The docs can say the price exists and climbs without saying its level.
- **Where the edit comes in.** people.md's quiet nightmare, a drum editing embryos toward wanting fewer children, is the regime that zeroes S at the source, and the model says the demand for it arrives by itself: after a few millennia of pricing, most couples carry a wish the drum can't meet, and a clinic that already corrects myopia is a short step from treating that wish as a condition. Edited lineages are out-bred by refusers, so an edited drum keeps its peace only by counting them. Left open.

## Edits made (6 Nov 2026)
- **First pass (PR #22). people.md:** header; summary bullets on selection and on birth systems; the overspend bullet; the ladder (rungs 1–2 aren't counting; rung 1 is the posted price); "Steady with age" reworded; the gene-pool section carries Lack's equilibrium table and the model's timescales, and a new bullet on what drums do; the open question on the wish is answered with a pointer and what remains open; Method and Sources. **economy.md:** header; the summary bullet on children (dearest in metal, cheapest in kWh; nobody waits on a death); "all other births wait on deaths" (twice) reworded; Children: holdings, the overspend, the shareless child, and "Overbreeding still leaks" and "A child's purse" replaced by the leak and *The posted price and the purse*; A life on the ledger; Rich and poor; Earth anchors (Singapore; the obshchina line); Method; Sources. **open-drums.md:** header; a summary bullet on the weakness of slack; Children without counting (unpriced; custom with teeth; tables and aunts work on the want); Chervil's third-child line; the steady-drum row; A drum's history; What open drums struggle with (the ratchet); an open question; Method; Sources. **glossary.md:** header; The share; Holdings; a new entry, The posted price; Counted drums. **README:** a canon bullet, Births and the posted price; the doc list.
- **Second pass (this PR), after the share-market runs:** people.md's gene-pool section (every child's chance, not a third's; the Lack table in m near one; the timescales; the price holds the population, not the wish; the portion as the one self-tuning regime; rented rooms), the "Steady with age" bullet, the summary bullet, the open question and the Method bullet; the glossary's posted price; economy.md's posted price; open-drums.md's Chervil line; README's canon bullet; `ratchet.py` (the stem rule, and a floor of half the par births under a Count, which had let a lull in deaths licence nobody for a generation) and this note.
- **Not edited:** `docs/open-questions.md` is generated from the docs by `site/open_questions.py` and is rerun in each PR; ashgrove.md and the narrative docs say nothing about births waiting on deaths.

## Open
- The price of a third in kWh, and how many households pay it.
- Whether any drum runs portions: whether metal, which economy.md makes the dearest thing in a child, is also what a non-heir brings to an heir's place, and whether that decides matches enough to make m near one.
- Whether the wish for children is as transmissible as the model assumes over a hundred generations, when every drum proofreads but doesn't edit.
- How custom with teeth works at block scale, and whether a block ever comes to count its own.
- Which drums let children be born in rented rooms, and what their rents and commons look like after a few centuries.
- Whether the edit arrives, and whether refusers of it are counted. (deliberately open)

## Method
- **Cohort model.** Ages 0–135; Gompertz m(a) = A e^{0.11a} with A fitted to a 120-year life expectancy; fertility shape normal(35, 6) on 20–50. Par third-child share p_par = 2 ÷ 0.95 − 2 = 10.5% at 5% childless (people.md's ~12% also replaces deaths before 35, which the model lacks).
- **Births under stem places** come from the places, not the fertile cohorts: births = par births × (1 + 1.5 × excess) where excess = (2 + p)(0.95) ÷ 2 − 1, the 1.5 from `stem_places.py`'s steady state (19%, 38%, 70% over at 2.25, 2.5, 3.0 children a couple; the model gives 19%, 38%, 64% at the same p; the share-market runs give 16% and 29% over at 2.18 and 2.38, 1.8× and 1.5× the excess).
- **Selection.** With z = T − μ, p = 1 − Φ(z), f = 1 ÷ (1 + max(0, excess)), w3 = 3f − m, w2 = 2f (person regime: 3 and 2), S = [w3 p(μ + φ/p) + w2(1 − p)(μ − φ/(1 − p))] ÷ (w3 p + w2(1 − p)) − μ. Each birth cohort's mean = the parents' fertility-weighted mean + b S.
- **Push-back.** T_eff = T + k × max(0, N ÷ N₀ − 1).
- **Count.** Starts when N > 1.10 N₀; births = max(½ par births, deaths − (N − 0.98 N₀) ÷ 15) a year, S = 0; ends when N ≤ N₀.
- **Indexed.** T_eff = μ_parents + Φ⁻¹(1 − p_par) each year.
- **Share market.** `share_market.py` subclasses `stem_places.Model`: phase 1 of 300 years without places, places on and 400 years to settle, shares reset and 200 more, a par snapshot, then the wish raised to 2 + e children a couple (e = 0.3, 0.5) and 300 years to settle, a 30-year tagging window and 120 years of follow-up. Households are tagged by their whole brood's birth in the window and sized by it; a child "heads a household" if it or its spouse holds a place by the end. `python3 share_market.py <none|heir|assort> [e] [seed]`; ~2 minutes a run; outputs in `out/`.
- `python3 ratchet.py` reproduces `ratchet-results.txt` (numpy, scipy; a few seconds).

## Sources
- J. Hajnal 1965, "European marriage patterns in perspective," in Glass & Eversley (eds), *Population in History*.
- C. Arensberg & S. Kimball 1940, *Family and Community in Ireland* (the match and the fortune).
- T. C. Smith 1977, *Nakahara: Family Farming and Population in a Japanese Village, 1717–1830*.
- S. H. Preston (ed.) 1978, *The Effects of Infant and Child Mortality on Fertility* (the replacement effect).
- Plato, *Laws* V, 737e–741a (the 5,040 lots).
- Population planning in Singapore (Wikipedia): https://en.wikipedia.org/wiki/Population_planning_in_Singapore
- D. Lack 1947, "The significance of clutch-size," *Ibis* 89.
- H.-P. Kohler, J. L. Rodgers & K. Christensen 1999, "Is fertility behavior in our genes? Findings from a Danish twin study," *Population and Development Review* 25(2).
- M. C. Mills & F. C. Tropf 2015, "The biodemography of fertility: a review and future research frontiers," *Kölner Zeitschrift für Soziologie und Sozialpsychologie* 67 (Suppl. 1).
- L. J. Dettling & M. S. Kearney 2014, "House prices and birth rates," *Journal of Public Economics* 110.
- K. Boulding 1964, *The Meaning of the Twentieth Century*; E. Ostrom 1990, *Governing the Commons*.
- D. S. Falconer & T. F. C. Mackay 1996, *Introduction to Quantitative Genetics* (the breeder's equation).
