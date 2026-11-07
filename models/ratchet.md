# The ratchet: what holds the wish for children at two

*Working note, 6 Nov 2026, from a conversation with Jeff about whether the Shade's births really wait on deaths, and whether norms can hold two children against selection. It answers people.md's open question of 2 Nov 2026, how tightly the wish for children tunes to a place, which turns on who carries a placeless adult's keep. The model is `ratchet.py` (output in `ratchet-results.txt`), a companion to `stem_places.py`. Jeff's decisions of 6 Nov 2026 are in people.md's header; the rest is proposal, and the numbers are a model, not canon.*

## At a glance
- **Births never waited on deaths, and the docs now say so everywhere.** Earth gated households, not parity: an heir's marriage, and so his first children, waited on the farm (Hajnal's Europe, Japan's *ie*, the *Altenteil*). Nobody held a third child for a grandparent's funeral. people.md's stem places (2 Nov) already made the place the gate; economy.md and the glossary still said "births wait on deaths" and now say births follow places, wallets follow deaths.
- **A child in a drum is cheaper than any child on Earth.** Food, school, clinic and air are the commons', per head; nobody has to work; there are 120 years of time; a third costs its household ~20% of its discretionary wallet, and the child's 1.1 kW of commons falls on the whole drum. Earth's modern cases say culture decides in that regime (the Nordics at ~1.3–1.6 with everything subsidised, Israel at ~3 with the same subsidies), and selection works against a two-child culture.
- **Stem places damp the ratchet; they don't stop it.** A third child heads a household only if it finds one of the slots the childless free (0.1 a place a generation), so its fitness over a two-child household is that chance, which falls as more households have thirds, less whatever a third costs its siblings' prospects. Lack's principle tunes the wish to a place only if that cost is real: about one sibling's marriage per third child holds par; half that settles the drum ~8% over; where the commons carries the placeless and a third costs nothing, the wish climbs a standard deviation every ~800–2,000 years, a drum at par is 10% over in ~600–1,400 years (two to five times longer than with a place for every adult), and once it has counted it counts every century or two.
- **A price is what makes the cost real.** A posted price for a shareless child's keep, indexed to the Count, does two things at once: fewer households have thirds now, and a third-child household's other children are poorer matches, which is the cost Lack's principle needs. Singapore ran both halves (fees 1972–87, bonuses after). A pool with a lottery removes the selection altogether; custom with teeth (open-drums.md) holds for centuries; the Count comes to drums that did none of these.
- **Different drums do different things,** and age sorts them: a young drum runs on custom because it can; one that has counted once has a taste distribution custom can't hold, and prices, pools or counts again.

## What the docs said, and what they meant
| Slogan | What the mechanism does |
|---|---|
| "All other births wait on deaths" (economy.md) | Nobody waits to conceive. ~60% of babies arrive before the death that frees their share, and get it ~6 years later (stem model). |
| "A child born ahead of a death has no share until one frees" | True; the household's wallets thin ~20% a head meanwhile. Essentials are the drum's. |
| "A household's births follow its own deaths" | True of the share ledger over a generation, not of what a couple does. people.md's "births follow places, wallets follow deaths" is the accurate line. |
| "Selection tunes the wish for children to a place… by now that has finished" | Only where a third costs its siblings something real. Where the commons carries the placeless, it hasn't finished and won't. |

## Earth precedents, and where they stop
| Earth | What was gated | On what | Echo in the Shade |
|---|---|---|---|
| Northwest Europe (Hajnal 1965) | Marriage, so first births | A holding or a position; 10–20% never married | Places: a household in the late 20s |
| Stem families: Austria, Ireland, Japan's *ie* | The heir's marriage | The father's death or retirement (*Altenteil*) | The heir's first children did wait on a death; a third child never did |
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

## The model
`ratchet.py` is an age-structured cohort model of a 200 M drum at 120-year lives (Gompertz mortality, births at 35 ± 6) with ~90 M stem places, plus a latent *wish for a third* d, standard normal at founding. A household has a third when d exceeds a threshold T set by what a third costs it.

- **Stem rules.** Each place passes to one heir, who marries a non-heir from another place. At par, two-child households exactly staff the places, and the 5% childless places free 2 adult slots each: 0.1 a place a generation. Thirds compete for those slots; the losers are placeless and have no children. A third's chance of a slot is P = min(1, 0.1 ÷ 0.95p), where p is the share of households having a third: 1 at par (p = 10.5%), 0.53 at 20%, 0.35 at 30%, 0.21 at 50%.
- **Fitness.** A third-child household leaves 2 + P − m reproducing children, a two-child household 2. m is the cost a third puts on its siblings' prospects, in reproducing children: a shareless sibling is a poorer match for an heir, as a small portion was in Hajnal's Europe. m = 0 means the commons carries the placeless and nobody minds; m = 1 means a third costs the family one sibling's marriage.
- **Transmission.** S is the offspring-weighted mean of d minus its mean (the selection differential); each new cohort's mean rises by b × S, with b the parent–child regression of the wish, genes and culture together: 0.2, 0.35 and 0.5, bracketing twin studies' ~0.2–0.4 for completed fertility (Kohler, Rodgers & Christensen 1999; Mills & Tropf 2015) plus cultural transmission, which in pronatalist subcultures on Earth keeps 85–90% of children. Variance is held at 1 (cultural variation renewable).
- **Overshoot** is the stock of placeless adults, at 1.5× the excess births as `stem_places.py` found at steady state. The drum counts at 10% over: licences clear the excess to 2% under over ~15 years by lottery, so selection pauses; the Count ends at par.
- **Regimes.** *Stem* with m and a rent-like push-back k (T rises by k × overshoot); *person*, the earlier canon with a place for every adult (a third founds a household, fitness 3); *indexed*, a posted price that moves with the Count so p stays at par; *equal*, births by lottery.

### Lack's equilibrium
The wish stops climbing where a third's chance of a slot equals its cost to the siblings: p* = 0.1 ÷ (0.95 m).

| m | p* (households with thirds) | Children a couple | Steady overshoot |
|---|---|---|---|
| 1.0 | ~11% | 2.00 | At par |
| 0.75 | ~14% | 2.03 | ~2% over |
| 0.5 | ~21% | 2.10 | ~8% over |
| 0.3 | ~35% | 2.23 | ~18% over |
| 0.2 | ~53% | 2.40 | ~30% over |
| 0 | climbs without limit | → 2.85 | → ~64% over |

So "the wish tunes to a place" needs a third child to cost its family about one sibling's marriage. A drum whose shareless earn ~80% of a wallet by working and whose placeless have full lives is near m = 0 unless something else makes a shareless sibling a poor match.

### Results: 3,000 years from a drum at par
| Regime | m | k | First Count (yr), b = 0.2 / 0.35 / 0.5 | Share of years counting | Households with thirds at 1,000 yr | at 3,000 yr |
|---|---|---|---|---|---|---|
| Place for every adult | — | 0 | 440 / 340 / 290 | 12–18% | 25–67% | 78–97% |
| Stem | 0 | 0 | 1,430 / 850 / 620 | 12–22% | 20–35% | 39–68% |
| Stem | 0 | 3 | 2,150 / 1,250 / 890 | 7–21% | 17–33% | 43–70% |
| Stem | 0.3 | 0 | 2,820 / 1,640 / 1,170 | 2–13% | 16–24% | 25–32% |
| Stem | 0.5 | 0 | never | 0 | 14–18% | 19–21% (settles ~7% over) |
| Stem | 1.0 | 0 | never | 0 | 11% | 11% |
| Indexed price | — | — | never | 0 | 10.5% (held) | 10.5% (held) |
| Equal (lottery) | — | — | never | 0 | 10.5% | 10.5% |

- **The drift is the same at par whatever the places** (S = 0.087 sd; one standard deviation every ~800–2,000 years), because at par every third still finds a slot. Stem places bite as the thirds pile up: at 30% of households a third's fitness is a third of what it was, so the climb slows, and the overshoot is a bounded stock of placeless rather than compounding growth. The first Count comes two to five times later than with a place for every adult, and quietly: 1.4% over at 200 years, 5% at 500, 9% at 800 (m = 0, b = 0.35).
- **After the first Count it never settles.** The Count resets the population and not the wish, so the drum re-overshoots in a century or two and counts 12–22% of the time thereafter, with a hollow cohort echoing after each.
- **A third that costs its siblings holds.** m = 0.3 roughly doubles the time to the first Count; m = 0.5 settles the drum within the Count's margin; m = 1 holds par forever. This is the whole content of "who carries a placeless adult's keep."
- **An indexed price holds par and climbs.** With p pinned at par, selection runs at a constant 0.03 sd a generation (b = 0.35), 6.7 sd in 8,000 years: nobody is licensed, the drum never counts, and after a few millennia nearly every couple wants a third and only the tail pays for one. Unless the price also raises m, by making a third-child household's children poorer matches, which it does to the extent wealth matters in marrying an heir.
- **Only equal births stop the ratchet.** A pool whose excess rights go by lottery has no selection on the wish at all.

## What drums do (proposal)
Rungs 1–2 of people.md's ladder (a price, then penalties) are not counting; they are what steady drums do.

| Drum | What makes a third cost something | Earth echo | Lasts | Fails as |
|---|---|---|---|---|
| Custom holdings | The wallet while the child is shareless; the block's opinion | Tokugawa villages | Several centuries from a fresh distribution of wishes; a century or two after any Count | The placeless pile up; the Count |
| Priced holdings (most steady drums) | A posted price for a shareless child's keep, indexed to the Count; a purse under par | Singapore's fees and bonuses; China's fees | Indefinitely, if the price makes a shareless sibling a poor match; otherwise it climbs ~1 sd of wish a millennium | A gentry of thirds; hidden births among the poor |
| Open drums | Custom with teeth: the Ledger shows each block's births against deaths; blocks over par lose Margin loans and Hollow draws | Irrigation commons (Ostrom); village collective responsibility | Centuries; then most add a price or a pool | Smugness; raiding the Margin |
| Pool with a lottery (Sorrel) | Nothing needs to: births by right, excess rights by lot | China's licences, kindly run; Boulding without the market | Indefinitely; no selection | The shareless child; the wild-born |
| Pool with a market (Lovage) | The price of a right | Boulding 1964 | Indefinitely; selects for the rich and willing | The poor sell their child's right |
| Counted (rung 3+) | The fitting, licences by lot | China 1983, India 1976 | Decades at a time | Legitimacy (people.md) |

- **Prevalence by age.** Canon's quiet-time split (25% open, 60% steady, 13% thin, 1% counted) holds for a Shade in which most steady drums already price births, and in which open drums are mostly in their first centuries. In a Shade of 10,000 years every drum has been round the cycle: holdings-by-custom is a museum piece, and drums price, pool or count. The story-time age, which the docs leave deliberately open, is partly a choice of where on the ratchet the typical drum sits.
- **The price in kWh is the open empirical question.** The model works in standard deviations of wish and in reproducing children; what a drum must charge to make a third child cost its siblings half a marriage is unknown, and Earth's elasticities are small and confounded (Singapore's fees were a few months' wages and are credited with little). The docs can say the price exists and climbs without saying its level.
- **Where the edit comes in.** people.md's quiet nightmare, a drum editing embryos toward wanting fewer children, is the regime that zeroes S at the source, and the model says the demand for it arrives by itself: after a few millennia of pricing, most couples carry a wish the drum can't meet, and a clinic that already corrects myopia is a short step from treating that wish as a condition. Edited lineages are out-bred by refusers, so an edited drum keeps its peace only by counting them. Left open.

## Edits made (6 Nov 2026)
- **people.md:** header; summary bullets on selection and on birth systems; the overspend bullet; the ladder (rungs 1–2 aren't counting; rung 1 is the posted price); "Steady with age" reworded; the gene-pool section carries Lack's equilibrium table and the model's timescales, and a new bullet on what drums do; the open question on the wish is answered with a pointer and what remains open; Method and Sources.
- **economy.md:** header; the summary bullet on children (dearest in metal, cheapest in kWh; nobody waits on a death); "all other births wait on deaths" (twice) reworded; Children: holdings, the overspend, the shareless child, and "Overbreeding still leaks" and "A child's purse" replaced by the leak and *The posted price and the purse*; A life on the ledger; Rich and poor; Earth anchors (Singapore; the obshchina line); Method; Sources.
- **open-drums.md:** header; a summary bullet on the weakness of slack; Children without counting (unpriced; custom with teeth; tables and aunts work on the want); Chervil's third-child line; the steady-drum row; A drum's history; What open drums struggle with (the ratchet); an open question; Method; Sources.
- **glossary.md:** header; The share; Holdings; a new entry, The posted price; Counted drums.
- **README:** a canon bullet, Births and the posted price; the doc list.
- **Not edited:** `docs/open-questions.md` is generated from the docs by `site/open_questions.py` and is rerun in this PR; ashgrove.md and the narrative docs already say nothing about births waiting on deaths.

## Open
- The price of a third in kWh, and how many households pay it.
- How far a shareless sibling really spoils a match for an heir in a drum where the shareless earn ~80% of a wallet: the m the canon's defaults imply.
- Whether the wish for children is as transmissible as the model assumes over a hundred generations, when every drum proofreads but doesn't edit.
- How custom with teeth works at block scale, and whether a block ever comes to count its own.
- Whether the edit arrives, and whether refusers of it are counted. (deliberately open)

## Method
- **Cohort model.** Ages 0–135; Gompertz m(a) = A e^{0.11a} with A fitted to a 120-year life expectancy; fertility shape normal(35, 6) on 20–50. Par third-child share p_par = 2 ÷ 0.95 − 2 = 10.5% at 5% childless (people.md's ~12% also replaces deaths before 35, which the model lacks).
- **Births under stem places** come from the places, not the fertile cohorts: births = par births × (1 + 1.5 × excess) where excess = (2 + p)(0.95) ÷ 2 − 1, the 1.5 from `stem_places.py`'s steady state (19%, 38%, 70% over at 2.25, 2.5, 3.0 children a couple; the model gives 19%, 38%, 64% at the same p).
- **Selection.** With z = T − μ, p = 1 − Φ(z), w3 = 2 + P − m, S = [w3 p(μ + φ/p) + 2(1 − p)(μ − φ/(1 − p))] ÷ (w3 p + 2(1 − p)) − μ. Each birth cohort's mean = the parents' fertility-weighted mean + b S.
- **Push-back.** T_eff = T + k × max(0, N ÷ N₀ − 1).
- **Count.** Starts when N > 1.10 N₀; births = deaths − (N − 0.98 N₀) ÷ 15 a year, S = 0; ends when N ≤ N₀.
- **Indexed.** T_eff = μ_parents + Φ⁻¹(1 − p_par) each year.
- `python3 ratchet.py` reproduces `ratchet-results.txt` (numpy, scipy; a few seconds).

## Sources
- J. Hajnal 1965, "European marriage patterns in perspective," in Glass & Eversley (eds), *Population in History*.
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
