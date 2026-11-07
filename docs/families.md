# Families

*Design notes from a working session, 6 Nov 2026. How drums differ in the way a household passes and in how many children a family may have, and what each choice does, over thousands of years, to people's wish for children. Builds on people.md (places and shares, the placeless, counted drums, What births do to the gene pool), economy.md (the share, birth rights, rent, the posted price), open-drums.md (the Margin, custom with teeth) and sorrel.md. Jeff's decisions of 6 Nov 2026: drums differ in how they divide inheritances and hold family size, and the kinds of drum set out here are canon. Drums also differ on children born in rented rooms: some ban them, with varying severity, some frown on them and the children grow up poorer, and some don't mind, and those run well above par, with knock-on effects. The names of the kinds and of their institutions (the draw, portions, split estates, sibling households, room drums, the drum's own children) are proposals, and so is every figure. The figures come from three models (`models/regimes.py`, `models/ratchet.py`, `models/share_market.py`, written up in `models/ratchet.md`), not from canon. Checked the same day by an independent review, which corrected several overstatements.*

## Summary
- **Two choices make a drum's family life.** The first is how a household passes: whole to one heir (canon's stem places), to one heir with portions for the rest, split among all the children, or kept by the siblings together for life. The second is how births are held: by custom, by rent, by a posted price, by a market in rights, by a draw, or by the Count. How a household passes decides who carries an extra child's cost and what families are like. How births are held decides the drum's numbers, and where its people's wish for children ends up.
- **Wanting more children always pays a little.** About one couple in twenty has no children, so at par the rest must average 2.1, and a family that stops at two can't supply more than two. The families with a third replace the childless, so the couples who want a third out-breed the rest by at least the room the childless leave, shared among them: 0.105 ÷ the share who want one, counted in children who head households of their own. Children in a drum are cheap and nearly all grow up, so an extra child is always there to fill a vacancy. Inheritance rules decide how far above that floor the advantage sits; none that keeps a drum's households fixed gets below it.
- **So the wish for children climbs,** in every drum but one that replaces its childless with children nobody chose. Where custom holds births, a drum at par reaches its first Count in ~450–1,000 years; where rented rooms raise children freely, ~300–450. Inheritance rules stretch that by two-fifths at most, in the limit where portions or birth order decide every household (~600–1,400 years); portions as the family-tree model runs them barely slow it.
- **Where it ends depends on how births are held.** A draw for third children among the couples who want one holds the numbers and lets the wish saturate: after some thousands of years most couples want a third and about one in ten gets one. After that the draw only decides who, and the pressure moves to the leak, thirds born without a permit; how a drum answers those decides whether the draw stays steady. A posted price or a market in rights holds the numbers too, but the most eager always pay, so the wish grows stronger without end and the price follows it. Custom and rent hold only until the Count.
- **So old drums converge on the draw.** Holdings drums keep their places and shares in the family and add a draw for thirds; pool drums draw from unspent rights, though in drums like Sorrel, where rights can be given, most of the room moves by gift. In an old drum most people want more children than they may have, and the draw is the year's great day.
- **Medicine lowers the floor, and makes the first years harder (proposal).** At one in a hundred childless instead of one in twenty, the floor is a fifth as high and the wish climbs far more slowly under a draw. But clinics that improve put a drum over par at once, since couples who were childless now have children, so a drum run by custom counts sooner. Only children nobody chose stop the climb outright: the childless replaced by embryos drawn by lot from every family and carried by volunteers.
- **Sorrel's Register runs back ~23,000 years,** long enough at canon's one in twenty childless for the wish to have saturated under every rule but the drum's own children, and better medicine changes that only if the wish passes down weakly. So either most people in old drums want a third, or the wish passes from parents to children more weakly than the models assume, or old drums raise their own children. Which holds is left open.

## The floor under the wish
- **Why there is a floor.** A drum at par replaces each couple with a couple. If one couple in twenty has no children, the couples who have children must leave 2 ÷ 0.95 ≈ 2.1 children who head households of their own, on average. A family of two can leave at most two, so the families with a third must make up the difference: they out-breed families of two by at least 0.105 ÷ their share. Counting the few who die before 35 the room is a little more, ~0.12, which is canon's ~12% of families with a third at par; the models leave the early dead out. It's an accounting identity for any drum whose households are fixed by its places and filled from its own children.
- **What selection sees.** Where some couples who want a third don't get one (a draw, a price), the families who have one still carry the identity, and the advantage of wanting a third is the same room shared among everyone who wants one. So the floor is set by the share who want a third, which is the share who have one only where nothing rations thirds. It assumes couples who don't want a third don't have one, and that childlessness has nothing to do with the wish. The childfree, who want none, are replaced like the infertile, and selection thins them too.
- **What a sibling's cost can and can't do.** A rule that makes a third cost its siblings (a smaller portion, a poorer match, a later place) only moves households between children, since the drum has the same places either way. The room the childless leave still goes to someone's extra child, and only families with extras have one. Lack's principle tunes birds' clutch sizes because an extra chick can starve its brood and fledge none. An extra child in a drum starves no one; it grows up and takes a vacancy.
- **The floor falls as the wish spreads.** At par it is a whole child: every third finds a household. When three couples in ten want a third it is a third of a child, and when most do it is a tenth. Rules that rank children by family size or draw thirds by lot reach the floor by construction, since they place every child of a two-child family first. Rules that leave every child alike let the advantage run near a whole child.

| Couples wanting a third (where nothing rations thirds, having one) | Children a couple | Advantage where every child is alike (canon's line rule, by custom) | The floor | Where only places hold births, the drum sits |
|---|---|---|---|---|
| 10.5% (par) | 2.00 | 1.00 | 1.00 | At par |
| 20% | 2.09 | 0.96 | 0.53 | ~7% over |
| 30% | 2.18 | 0.92 | 0.35 | ~14% over |
| 50% | 2.38 | 0.84 | 0.21 | ~28% over |
| 80% | 2.66 | 0.75 | 0.13 | ~49% over |
| All | 2.85 | 0.70 | 0.11 | ~64% over |

  The models stop at three children. Where births aren't rationed, a wish that has reached everyone would go on to fourths, so the last row is a point on the way, not an end.
- **How a household passes sets where the advantage sits above the floor.** From the family tree (canon's line rule, 120-year lives) and the generation model (whole generations, b = 0.5, four runs):

| How a household passes | 3 couples in 10 want a third | Half do | 8 in 10 | Nearly all | The drum's numbers |
|---|---|---|---|---|---|
| The floor | 0.35 | 0.21 | 0.13 | 0.11 | — |
| Whole to one heir by canon's line rule, heirs marrying by age | 0.94 | 0.82 | ~0.75 | ~0.70 | The placeless pile up |
| As above, heirs choosing the largest portion | 0.84–0.85 | 0.65 | — | — | The placeless pile up |
| Whole to the eldest (primogeniture), heirs marrying at random | 0.86 | 0.74 | 0.61 | 0.57 | The placeless pile up |
| Whole to one heir, portions one consideration among several | 0.44 | 0.30 | 0.20 | 0.17 | The placeless pile up |
| Whole to one heir, portions or birth order deciding every household | 0.35 | 0.21 | 0.13 | 0.11 | The placeless pile up |
| Kept by the siblings, the excess leaving by lot | 0.80 | 0.69 | 0.60 | 0.58 | Leavers pile up |
| Kept by the siblings, third-born leaving first | 0.66–0.68 | 0.48–0.52 | 0.34–0.38 | 0.29–0.34 | Leavers pile up |
| Split among all, with a minimum a couple needs to have children | ~0.4 | ~0.25 | ~0.3 | ~0.3 | Swings, a third of par to 1.6× |
| Split among all, with a minimum each partner needs | ~0.65 | ~0.55 | ~0.6 | ~0.65 | Swings wider |

  Canon's line-rule row is the family tree at 30% and 50% (by age) and every child's chance beyond. Split estates hold no fixed number of households, so the identity doesn't bind them: their advantage swings from one generation to the next, sometimes below zero, and the figures are long averages with errors of up to ±0.1.
- **Earth runs the same arithmetic.** Where completed family size passes from parents to children, by genes or by upbringing, the lines with more children grow, and fertility rises again after a transition unless new low-fertility ways of living keep arriving faster than selection can catch them (Kolk, Cownden and Enquist 2014; Collins and Page 2019). The drum's models take the parent–child regression of the wish at 0.2–0.5. A Shade with a fast churn of fashions would sit at the low end or below, and everything here would run slower.

## How a household passes
### Whole to one heir (canon)
- **The rule.** A place passes whole to one heir, usually a great-grandchild in their late 20s; the other children marry heirs elsewhere, wait, or stay placeless (people.md). Heirs marry by age and liking, not by a partner's birth order or share.
- **Who carries an extra child.** Everyone a little: a third's chance of a household is every child's chance, so its cost spreads over the whole drum as a slightly longer wait for everyone, a few more placeless and a thinner commons. A share-based marriage market changes nothing, since a third's share deficit lands on some child's wait, not on anyone's marriage. Primogeniture, the heir fixed as the eldest, takes a little off a third's advantage, since the extra child is always a younger one.
- **The wish** climbs at nearly the full speed it would with a place for every adult; stem places cap the drum's numbers, not the selection.

### Portions (proposal)
- **The rule.** The place still passes whole to one heir. The other children each carry a portion when they marry: a share of the family's savings, belongings and Hollow hours, and, where fixed goods are owned and inherited (economy.md's gentry drums), a claim on rents. An heir marries the best portion they can, and the incoming portion pays out the heir's own siblings, as the Irish farmer's bride's fortune paid his sisters' (Arensberg and Kimball 1940). Three children split what two would have.
- **Family life.** Matches and matchmakers; the portion a public number; marriage late, after the bargaining; a respectable class of unmarried aunts and uncles; the younger children of big families marrying placeless partners or entering houses. "A third is a mortgage on its sisters' matches."
- **The wish.** In the family tree, heirs who choose by portion take a third's advantage from ~0.94 to ~0.85 when three couples in ten want a third, and from ~0.82 to ~0.65 when half do. Most households come down the line rule at a death, not through a marriage, so the market reaches only part of who heads one. Where heirs are named young and marry strictly by portion, the advantage falls to the floor and the first Count comes about two-fifths later than by custom. Portions don't hold the wish; they decide who pays for it: the younger children of big families.
- **How it fails.** Portions make wealth tell in every marriage, and a gentry of portions marries itself.

### Split estates (proposal)
- **The rule.** No heir. The place and the family's shares are one estate, split equally among the children as each marries, with a room kept for the old as Central European farmers kept the *Altenteil*. A couple may have children only if their holdings together reach a minimum, as Württemberg and Bavaria made the poor prove their means before marrying in the nineteenth century.
- **Family life.** Small homes; marriages that assemble a holding from two thin ones; equality between brothers and sisters; an early start; no placeless and no heirs. Poverty when the minimum creeps down.
- **The wish.** It climbs anyway. A spouse's holding makes up for a third child's thin one, so the in-laws carry part of the cost, and a split-estate drum holds no fixed number of households for the floor to bind. Over the long run a third's advantage averages a little above the floor while few want one and two to three times it once most do. The numbers swing: a generation born when holdings are thick is followed by a thin one, from a third of par to 1.6× in a model of whole generations (overlapping lives would damp it, and so would couples free to re-match). Requiring each partner, not each couple, to meet the minimum makes both worse.
- **How it fails.** Without a law the minimum creeps down, as Ireland's plots did before the Famine. The German laws mostly moved births outside marriage instead of stopping them (Knodel 1967). Split-estate drums are rare and seldom last.

### Sibling households (proposal)
- **The rule.** A place stays with the sibling group for life. Partners visit and never move, as among the Mosuo (Cai Hua 2001) and in the Nayar's matrilineal houses of Kerala. Children belong to their mother's place, or to whichever place the couple names at the birth, and uncles raise their sisters' children. A place is sized for a lineage, a sibling group of two to four in each generation and ~7–14 people at once (three to six times canon's 78 m², and that many fewer places), and when a generation outgrows it the excess leave for houses and Margin flats.
- **Family life.** Big households three generations deep; no wedding ever moves anyone; few couples share a home; every adult is an aunt or an uncle to someone in the next room. Tibet's fraternal polyandry kept holdings whole the same way and left many women unmarried (Goldstein 1976).
- **The wish.** If the excess leave by lot, as fast as by custom. If a mother's third and later children leave first, about two and a half to three times the floor once most couples want a third: slower than custom, never still.
- **How it fails.** Over who stays. A household that sends its own away when it overflows has a quarrel in every generation.

## How births are held
### Custom
- **The rule.** No price and no permit: a third is a family's business, held to two by opinion, by the wallets it thins, and in open drums by custom with teeth (open-drums.md).
- **The wish** climbs at nearly full speed. A drum at par reaches 10% over and its first Count in ~450–1,000 years (~600–1,400 where rent pushes back), and after that spends two-fifths to a half of its years counting unless it adds a price, a draw or a pool. Young drums and open drums run this way, and it holds for their first centuries.

### Rented rooms (Jeff)
Every holdings drum has to say what happens when a couple without a place has a child in rented rooms. Drums answer differently.

| Rule | What it looks like | What it does |
|---|---|---|
| Banned | From a fine to the loss of Hollow hours, deck seniority or posts (rung 2 of people.md's ladder); severity varies | Closes the leak; the wish climbs as under custom |
| Frowned on | The children are born and grow up crowded and long shareless, and inherit only if the line rule reaches them | Between custom and a home for every couple: a leak that rent partly prices |
| Allowed | Rooms are homes, and any couple who can rent raises children | Households compound as with a place for every adult: 10% over and a first Count in ~300–450 years from par, or a drum that lives thin |

- **What a room drum is like.** Young, crowded, cheerful and loud. Rents run two to four times a steady drum's (economy.md), which works as a price on everyone young, not only on would-be parents; the old who let rooms are rich and the renting young are a class; the commons thins per head; and the drum hits its first Dark harder than its neighbours. It also draws people who want big families from along the row, who swap in, which speeds it up and slows its neighbours.

### The posted price (economy.md)
- **The rule.** A charge for a shareless child's keep, posted beside the Count, with a purse the other way under par. Most steady drums run one.
- **The wish.** The price holds the numbers by deciding who has thirds, and the most eager always pay, so the strength of the wish climbs a standard deviation every ~800–2,000 years without slowing, and the price has to climb with it. A price can't rise forever against a fixed wallet; a priced drum eventually caps it, and then needs a draw.

### A market in rights (Lovage)
- **The rule.** Birth rights can be sold (economy.md). A third comes from buying one.
- **The wish.** As under a price: the rich and the most eager have the thirds, and rights grow dearer every century.

### The draw (proposal)
- **The rule.** Each year the drum issues as many permits for a third child as its childless households and early dead leave room for, and draws them by lot among couples with two who want a third. A permitted third pays no price. The pool drums' version is people.md's lottery of unspent birth rights. In a pool drum whose rights can be given, as Sorrel's can, most of the room moves by gift from the childless to kin and friends, which favours the well connected and those who ask hardest, and the lottery takes only what's left.
- **The wish.** Wanting a third still pays, since only those who enter can win, but by exactly the floor. Half of couples want a third after ~1,500–3,800 years, and four in five or more after ~10,000 (more slowly the more weakly the wish passes down). After that the draw only decides who, and the numbers don't move, so long as the thirds born without a permit stay few.
- **Thirds without a permit.** As the wish spreads, more couples who lose the draw have a third anyway, and how the drum answers them decides whether the draw stays steady. Priced, they make the drum a priced drum at the margin: the most eager pay, and the strength of the wish climbs again. Penalised, as people.md's rung 2 penalises, the same happens more slowly. Refused at the clinic, thirds are licensed, which is counting them (rung 3). Most drums with a draw penalise and shame, and lean on the lot's fairness to keep the unpermitted few.
- **What makes it hold.** It is public and fair. The draw runs at every station ring, each permit is named for a household that ended without an heir, and winners often name the child for it, as children elsewhere are named for the dead whose share they carry. Nobody is exempt. A drum with a draw lives or dies by whether people believe the lot.

### The Count (people.md)
- **What it does.** Licences by lot, the fitting and a stop. It resets the drum's numbers and not the wish, so a drum that comes out of a Count without a price, a draw or a pool comes back to one within a few centuries.

### The drum's own children (proposal; rare)
- **The rule.** The childless and the early dead aren't replaced by anyone's third. The clinic draws embryos by lot from every family's banked proofreading samples, and volunteers carry them; the children are raised by their carriers or by tables, and carry the drum's name.
- **What it does.** The genes behind the wish gain nothing, since every family is equally likely to be drawn, and this is the one rule under which the wish doesn't climb. Its cultural part still follows whoever raises the child, so drums that do it give the raising to tables and houses rather than to the couples who asked. Few drums can stomach it.

### Medicine (every drum, more or less)
- **The floor is set by the childless.** A drum whose clinics leave fewer couples involuntarily childless has less room to fill and a lower floor under every rule. But clinics that improve put a drum over par at once, since couples who were childless now have children, and its people's wish was set for the old par: a custom drum counts sooner, and a drum with a draw issues fewer permits and climbs more slowly from there.

| Couples childless | Families with a third at par | The floor when 3 couples in 10 want one | Custom: first Count (wish set for this par / for 1 in 20) | A draw: couples wanting a third after 9,500 / 23,000 years (set for this par / for 1 in 20) |
|---|---|---|---|---|
| 1 in 20 (canon) | 10.5% | 0.35 | ~600 years | 91% / 98% |
| 1 in 50 | 4% | 0.14 | ~1,250 / ~410 years | 64% / 89%; 69% / 90% |
| 1 in 100 | 2% | 0.07 | ~2,170 / ~330 years | 31% / 68%; 46% / 75% |

*(b = 0.35. At b = 0.2 and one in a hundred, about half of couples want a third after 23,000 years.)*

- **The childfree count too.** Couples who want no children are replaced like the infertile, so selection thins them, and the floor falls over the generations toward whatever medicine can't fix and the few who die before 35 (~0.7%).

## Kinds of drum
| Kind | A household passes | Births are held by | Family life | The wish | Canon has |
|---|---|---|---|---|---|
| Custom holdings | Whole to one heir | Custom; in open drums, custom with teeth | Couples wait for a place; a third is notable; tables of aunts | Climbs at nearly full speed; first Count in ~450–1,000 years, then counting two-fifths to half its years | Chervil (open) |
| Room drums | Whole to one heir, but rented rooms raise children | Rent | Young, crowded, loud; a renting class; dear rooms | Compounds; first Count in ~300–450 years, or lives thin | Some thin drums |
| Priced holdings | Whole to one heir | The posted price | A third is a bill the comfortable pay | Numbers held; its strength climbs behind the price, and the price with it | Most steady drums |
| Drawn holdings | Whole to one heir | A draw for thirds; thirds without a permit penalised or priced | Draw Day is the year's great day | Saturates: most couples want a third, about one in ten gets one; then presses on the leak | Old steady drums |
| Portion drums | Whole to one heir; the others carry portions | Custom or a price | Matches and matchmakers; late marriage; respectable unmarried aunts and uncles | Barely slower than custom; the placeless pile up | None written |
| Split-estate drums | Split among all the children | A minimum to have children, by law | Small homes; marriages that assemble a holding; no heirs | Climbs; the numbers swing | None written; rare |
| Sibling households | Kept by the siblings for life; partners visit | The place's size: the excess leave | Big households; uncles raise sisters' children | Climbs, more slowly if third-born leave first | None written |
| Pool drums with gifts and a draw | Shares from the pool; places by age | Two rights a couple; the childless give theirs to kin and friends; unspent rights drawn by lot | A third is a gift or luck | Saturates; gifts favour the well connected | Sorrel |
| Pool drums with a market | Shares from the pool; places and goods by auction | Rights, sold | Big families are rich | Strength climbs without end; rights dearer every century | Lovage |
| Counted drums | Any | Licences by lot, the fitting | The Count board | Numbers reset, not the wish | Rue |

- **Mixes are common.** A drum can run portions with a draw, a price with a ban on rooms, or sibling households in its high decks and stem places in its low ones. The table names the poles.
- **In canon's quiet-time split** (open-drums.md), open drums (~25%) are mostly custom holdings with a Margin, some with a draw; steady drums (~60%) are priced and drawn holdings and pool drums, with portion drums and sibling households among them; thin drums (~13%) are room drums and overspent custom holdings; counted drums (~1%) are counted.

## A drum's life
- **Custom first.** A new or newly settled drum runs on custom, since a fresh spread of wishes holds two for centuries.
- **Then a Count.** In ~450–1,000 years (~300–450 if rooms raise children) the drum reaches 10% over par, often after a bad year, and counts.
- **Then a choice.** Most come out priced; some keep a Margin and run custom with teeth (Chervil, Madder), which buys centuries more; some become pool drums (Sorrel, ~640 years ago); some draw. Those that choose nothing count again within a few centuries.
- **Then the draw.** A price can't climb forever, and a Margin can't hold forever, so over thousands of years most drums come to a draw: holdings drums keep their places and shares in the family and draw for thirds, and pool drums draw from unspent rights. Old drums differ in what they draw for, how they treat thirds born without a permit and how much their clinics have cut childlessness, not in whether they draw.

## What it feels like
- **Wanting a third is an old drum's commonest ache.** Most people in an old drum grew up wanting more children than they had, and so did their parents. Tables of aunts, fostering and houses matter more as the wish spreads; they are how a drum meets a want it can't grant.
- **Draw Day.** The year's permits are drawn at every station ring, each read out with the name of the household that ended without an heir. Winners are congratulated like newlyweds. Couples who enter for twenty years and never win are a recognised kind of person, and so are the ones who stop entering, and the ones who have a third anyway and take what the drum gives them for it.
- **The price as a class line.** In priced drums thirds cluster among the comfortable, and "third-born" carries a whiff of money. The poor's thirds are unpermitted, wild-born, or swapped out to drums with rooms.
- **The match.** In portion drums families bargain, portions are public, and a big family's youngest marries late or enters a house. Gossip is about portions the way other drums gossip about places.
- **Uncles.** In sibling households a child's mother's brothers raise it and its father visits. Inheritance never moves anyone; leaving does, and the leavers are honoured at a farewell meal.
- **Rooms.** In room drums the landlords are old and the tenants are young families; rent is the whole of politics, and the neighbours grumble about the swaps.

## Open questions
- Which kinds of drum sit where on Merrow, and their names.
- How strongly the wish for children passes from parents to children over thousands of years. The models take a regression of 0.2–0.5; a fast churn of fashions would lower it (Kolk et al. 2014), and everything here would run slower.
- How canon squares Sorrel's ~23,000-year Register with the floor: whether most people in old drums want a third, whether the wish passes down weakly, or whether old drums raise their own children. (deliberately open)
- How drums with a draw answer thirds born without a permit once most couples want one.
- The posted price in kWh, and where a priced drum caps it.
- Whether any drum raises the drum's own children, and who raises them.
- How much childlessness each drum's clinics leave, and how a drum gets through the overshoot when they improve.

## Method
- **The floor.** At par the households that have children must average 2 ÷ (1 − c) children who head households, where c is the share childless (~5%). A family of two leaves at most 2, so families with a third average at least 2 + (2 ÷ (1 − c) − 2) ÷ p, with p their share; where thirds are rationed, the same room spread over the share who want one bounds the advantage of wanting one. It holds exactly for a drum whose households are fixed by its places and filled from its own children, where couples who don't want a third never have one and childlessness is independent of the wish. Children who die young or only children raise the floor (to ~0.12 ÷ p with the early dead); households of one would lower it; split estates, which fix no number of households, are outside it. Rules that place every child of a two-child family before any other child reach it exactly.
- **The generation model** (`models/regimes.py`): ~4,000 places, whole generations of ~35 years, a heritable wish for a third (child = mean + b × (midparent − mean) + noise, variance held at 1), a couple having a third when the mean of their wishes passes a threshold set for 10.5% at the start, 5% of couples childless by chance, never more than three children. One regime per inheritance or birth rule; the advantage selection sees is the difference in children who head households between couples who wanted a third and couples who didn't, credited to the generation of those couples. `python3 regimes.py table` prints the advantage by the share wanting a third, mean ± standard error over four runs at b = 0.5 (the table above), and `python3 regimes.py all` the trajectories. Rank, order, the draw and rights to the most eager reach the floor by construction, so the model confirms the arithmetic for them; the family tree is the realistic test of portions. The model's stem places pass to the eldest child. Split-estate drums start with holdings of 0.5 ± 30% of a place each, a minimum of 0.7 of a place a couple, and couples paired once with no re-matching. Sibling households hold 4 or 12 adults a generation; each woman's partner is drawn from the men kept in other places, and every man kept counts as heading a household.
- **The family tree** (`models/share_market.py`, on `models/stem_places.py`): ~15,000 people with 120-year lives and canon's line rule, the wish raised to 2.18 or 2.38 children a couple, every household whose brood is born in a 30-year window followed for 120 years. Four marriage markets: by age (canon), heirs taking only share-holders, like marrying like by share, and heirs choosing the largest portion (1 ÷ the number of siblings).
- **The cohort model** (`models/ratchet.py`): an age-structured drum of 200 M at 120-year lives, with the wish's mean rising by b × the selection differential each cohort; b = 0.2, 0.35 and 0.5; stem and ranked drums settle 1.5× their excess births over par; a Count at 10% over clears to 2% under over ~15 years by lot and pauses selection. Regimes: custom (every child alike), rent pushing back, ranked (the floor, places capping births), rooms (a home for every couple), the draw (the floor, births held at par), a price or market (the most eager tenth pay), the drum's own children (no selection). Its medicine section reruns custom and the draw with 2% and 1% childless, from a wish set for the new par and from one set for canon's 5%.
- **First Counts** quoted are from par with b = 0.5 (fastest) to 0.2 (slowest); the draw's saturation times likewise.

## Sources
- R. A. Fisher 1930, *The Genetical Theory of Natural Selection* (the fundamental theorem: selection raises whatever is heritable and makes for more offspring).
- D. Lack 1947, "The significance of clutch-size," *Ibis* 89.
- M. Kolk, D. Cownden & M. Enquist 2014, "Correlations in fertility across generations: can low fertility persist?" *Proceedings of the Royal Society B* 281: 20132561.
- J. Collins & L. Page 2019, "The heritability of fertility makes world population stabilization unlikely in the foreseeable future," *Evolution and Human Behavior* 40(1): 105–111.
- C. Arensberg & S. Kimball 1940, *Family and Community in Ireland* (the match and the fortune).
- J. Knodel 1967, "Law, marriage and illegitimacy in nineteenth-century Germany," *Population Studies* 20(3): 279–294.
- M. C. Goldstein 1976, "Fraternal polyandry and fertility in a high Himalayan valley in northwest Nepal," *Human Ecology* 4(3): 223–233.
- Cai Hua 2001, *A Society without Fathers or Husbands: The Na of China*.
- K. Gough 1961, "Nayar: Central Kerala," in D. Schneider & K. Gough (eds), *Matrilineal Kinship*.
- J. Hajnal 1965, "European marriage patterns in perspective," in Glass & Eversley (eds), *Population in History*.
