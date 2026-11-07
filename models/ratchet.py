#!/usr/bin/env python3
"""The fertility ratchet in a nation drum, under stem places (Kerr swarm, people.md).

Age-structured cohort model of a 200 M drum with 120-year lives and ~90 M
stem places, plus a latent "wish for a third child" d that is partly passed
from parents to children (b = parent-child regression, genes and culture
together). A household has a third when its d exceeds a threshold T set by
what a third costs it. Variance of d is held at 1 (cultural variation is
treated as renewable), so the mean can climb without limit.

Stem places (people.md, 2 Nov 2026): children belong to a place; each place
passes whole to one heir, and the other children marry heirs elsewhere or
stay placeless and childless. Heirs marry by age, not by the partner's birth
order, so every child has the same chance of heading a household:
    f = 1 / (1 + excess),   excess = (2 + p)(0.95) / 2 - 1,
the ratio of adult slots (two a place) to children. share_market.py, a
family-tree run of stem_places.py, confirms it: at 2.18 children a couple
each child's chance is ~0.92 (thirds ~0.90), at 2.38 ~0.84 (thirds ~0.79),
whether or not heirs insist on a spouse with a share. So a three-child
household leaves 3f reproducing children against a two-child household's
2f: the same 3:2 as with a place for every adult. Stem places cap the
overshoot (the placeless don't breed) without slowing the selection.
m is any further cost a third puts on its line, in reproducing children;
share_market.py measures it at zero within noise even when heirs marry only
share-holders, because a third's share deficit is spread across the whole
kin group and lands on children's waits, not on anyone's marriage. The wish
stops climbing where f = m: only m near 1 (a third costs one sibling's
marriage) holds par; m = 0.5 would need 4 children a couple to bind.

The selection differential S is the offspring-weighted mean of d minus its
mean; each new cohort's mean rises by b * S. Overshoot is the stock of
placeless adults (plus their share of the secondary settling people.md's
family-tree model found, ~1.5x the excess births at steady state). A drum
10% over par counts: licences clear the excess over ~15 years by lottery, so
selection pauses; the Count ends at par.

Regimes:
  stem        as above, with m and feedback k (rent: T rises by k * overshoot)
  person      the earlier canon, a place for every adult: a third child founds
              a household, w3 = 3, growth compounds
  indexed     a posted price moves with the Count so p stays at par; no Count
  equal       births by lottery: no selection

Usage: python3 ratchet.py            (prints the tables in ratchet-results.txt)
Needs numpy and scipy; runs in a few seconds.
"""
import numpy as np
from scipy.stats import norm
from scipy.optimize import brentq

AMAX = 135
GEN_MEAN, GEN_SD = 35.0, 6.0
LIFE = 120.0
CHILDLESS = 0.05
P_PAR = 2 / (1 - CHILDLESS) - 2          # third-child share at par, ~10.5%
SECONDARY = 1.5                           # steady overshoot / excess births (stem_places.py)
YEARS = 3000
N0 = 200e6
COUNT_AT = 1.10
CLEAR_YEARS = 15.0
COUNT_TO = 0.98                           # a stop aims a little under par
COUNT_FLOOR = 0.5                         # a Count never licenses fewer than half the par births


def gompertz(life):
    B = 0.11
    ages = np.arange(AMAX + 1)

    def e0(A):
        m = A * np.exp(B * ages)
        return np.cumprod(np.exp(-m)).sum()

    A = brentq(lambda a: e0(a) - life, 1e-9, 1e-1)
    return A * np.exp(B * ages)


MORT = gompertz(LIFE)
AGES = np.arange(AMAX + 1)
FSHAPE = norm.pdf(AGES, GEN_MEAN, GEN_SD)
FSHAPE[(AGES < 20) | (AGES > 50)] = 0
FSHAPE /= FSHAPE.sum()


def stable_pop():
    surv = np.cumprod(np.exp(-MORT))
    surv = np.concatenate([[1.0], surv[:-1]])
    return surv / surv.sum() * N0


def third_share(mu, T):
    return 1 - norm.cdf(T - mu)


def child_chance(p):
    """A child's chance of heading a household under stem places: adult slots
    (two a place) over children, the same for every child."""
    excess = (2 + p) * (1 - CHILDLESS) / 2 - 1
    return 1.0 / (1.0 + max(0.0, excess))


def selection_differential(mu, T, w3, w2=2.0):
    """Offspring-weighted mean of d minus mu: households above T leave w3
    reproducing children, the rest w2 (the childless are independent of d)."""
    z = T - mu
    p = 1 - norm.cdf(z)
    phi = norm.pdf(z)
    num = w3 * p * (mu + phi / p) + w2 * (1 - p) * (mu - phi / (1 - p))
    den = w3 * p + w2 * (1 - p)
    return num / den - mu


def run(regime, b, years=YEARS, p0=None, m=0.0, k=0.0, log=False):
    pop = stable_pop()
    mu = np.zeros(AMAX + 1)
    if p0 is None:
        p0 = P_PAR
    T = norm.ppf(1 - p0)
    par_births_rate = pop[0]                   # the stable cohort: at par, births = deaths
    counting = False
    years_counting = counts = 0
    first_count = None
    min_ratio = max_ratio = 1.0
    hist = []
    for t in range(years):
        deaths_by_age = pop * (1 - np.exp(-MORT))
        deaths = deaths_by_age.sum() + pop[-1] * np.exp(-MORT[-1])   # the last cohort dies too
        w = pop * FSHAPE
        mu_par = (w * mu).sum() / w.sum()
        ratio = pop.sum() / N0
        over = max(0.0, ratio - 1)
        if regime == "indexed":
            T_eff = mu_par + norm.ppf(1 - P_PAR)
        else:
            T_eff = T + k * over
        if regime == "equal":
            p, S = P_PAR, 0.0
        else:
            p = third_share(mu_par, T_eff)
            if regime == "person":
                w3, w2 = 3.0, 2.0
            else:
                f = child_chance(p)
                w3, w2 = 3 * f - m, 2 * f
            S = selection_differential(mu_par, T_eff, w3, w2)
        if regime in ("stem", "indexed", "equal"):
            # births come from households, whose number is fixed by the places;
            # the fertile cohorts' size doesn't matter, their third-child share does.
            excess_share = (2 + p) * (1 - CHILDLESS) / 2 - 1   # excess births / par births
            births = par_births_rate * (1 + SECONDARY * max(0.0, excess_share) + min(0.0, excess_share))
        else:
            births = (w.sum() / 2) * (2 + p) * (1 - CHILDLESS)
        if regime in ("stem", "person"):
            if not counting and ratio > COUNT_AT:
                counting = True
                counts += 1
                if first_count is None:
                    first_count = t
            if counting:
                # licences aim a little under par, as real stops do (Chervil's Margin),
                # but never below half the par cohort: a drum stretches a Count rather
                # than skip a generation when a thin cohort reaches old age and deaths lull
                births = max(COUNT_FLOOR * par_births_rate, deaths - (pop.sum() - COUNT_TO * N0) / CLEAR_YEARS)
                S = 0.0
                years_counting += 1
                if ratio <= 1.0:
                    counting = False
        mu_child = mu_par + b * S
        pop_new = np.zeros_like(pop)
        mu_new = np.zeros_like(mu)
        pop_new[1:] = pop[:-1] - deaths_by_age[:-1]
        mu_new[1:] = mu[:-1]
        pop_new[0] = births
        mu_new[0] = mu_child
        pop, mu = pop_new, mu_new
        min_ratio = min(min_ratio, ratio)
        max_ratio = max(max_ratio, ratio)
        if log and t % 100 == 0:
            hist.append((t, ratio, mu_par, p))
    return dict(first_count=first_count, years_counting=years_counting, counts=counts,
                mu_end=mu_par, p_end=p, min_ratio=min_ratio, max_ratio=max_ratio, hist=hist)


def over_at(p):
    """Steady overshoot at a fixed third-child share, stem places."""
    excess = (2 + p) * (1 - CHILDLESS) / 2 - 1
    return SECONDARY * excess if excess > 0 else excess


if __name__ == "__main__":
    P = P_PAR
    print(f"par third-child share p_par = {P:.3f} (5% childless)")
    print("\nStem places: every child's chance of heading a household f, a third's advantage over a")
    print("two-child household (f, at m = 0), and the steady overshoot, by the share of households with a third:")
    print(f"{'p':>6s}{'children/couple':>17s}{'f':>7s}{'w3-w2 (m=0)':>13s}{'over par':>10s}")
    for p in (0.105, 0.15, 0.2, 0.25, 0.3, 0.368, 0.5, 0.632, 1.0):
        f = child_chance(p)
        print(f"{p:6.3f}{(2+p)*(1-CHILDLESS):17.2f}{f:7.2f}{f:13.2f}{100*over_at(p):9.0f}%")
    print("\nLack's equilibrium: the wish stops climbing where f = m, so children a couple = 2 / m:")
    for m in (0.5, 0.7, 0.8, 0.9, 0.95, 1.0):
        ch = 2.0 / m
        ps = ch / (1 - CHILDLESS) - 2
        note = "" if ps <= 1.0 else "  (more than a third for every household)"
        print(f"  m={m:.2f}  children/couple={ch:.2f}  p*={ps:.2f}  settles {100*over_at(min(ps, 1.0)):.0f}% over par{note}")
    print("\nSelection differential S (sd) at par, and years per 1 sd of drift (f = 1 at par, so stem = person):")
    for regime, w3, w2 in (("person", 3.0, 2.0), ("stem, m=0", 3.0, 2.0), ("stem, m=0.5", 2.5, 2.0), ("stem, m=0.9", 2.1, 2.0)):
        S = selection_differential(0, norm.ppf(1 - P), w3, w2)
        yrs = "  ".join(f"b={b}: 1 sd in {35/(b*S):,.0f} yr" for b in (0.2, 0.35, 0.5)) if S > 1e-6 else "no drift"
        print(f"  {regime:12s} S={S:.3f}  {yrs}")
    print("\nSweep, 3,000 years from a drum at par (p = 10.5%). first = years to the first Count (10% over);")
    print("%count = share of years counting; p1000/p3000 = third-child share of the parent cohort; max = pop/par.")
    print(f"{'regime':8s}{'m':>5s}{'k':>4s}{'b':>6s}{'first':>8s}{'Counts':>8s}{'%count':>8s}{'p1000':>7s}{'p3000':>7s}{'max':>7s}")
    runs = [("person", 0.0, 0), ("stem", 0.0, 0), ("stem", 0.0, 3), ("stem", 0.5, 0), ("stem", 0.8, 0), ("stem", 0.9, 0), ("stem", 1.0, 0), ("indexed", 0.0, 0), ("equal", 0.0, 0)]
    for regime, m, k in runs:
        for b in (0.2, 0.35, 0.5):
            r = run(regime, b, m=m, k=k, log=True)
            fc = "never" if r["first_count"] is None else str(r["first_count"])
            p1000 = [h[3] for h in r["hist"] if h[0] == 1000][0]
            print(f"{regime:8s}{m:5.1f}{k:4d}{b:6.2f}{fc:>8s}{r['counts']:8d}{100*r['years_counting']/YEARS:8.0f}{p1000:7.2f}{r['p_end']:7.2f}{r['max_ratio']:7.2f}")
    print("\nStem, m=0, k=0, b=0.35, every 100 years:")
    r = run("stem", 0.35, log=True)
    for t, ratio, mu, p in r["hist"][:16]:
        print(f"  t={t:4d}  pop/par={ratio:.3f}  mu={mu:.2f}  thirds={p:.3f}")
    print("\nIndexed price, b=0.35, 10,000 years: the mean wish climbs (the price in sd of wish keeps pace):")
    r = run("indexed", 0.35, years=10000, log=True)
    for t, ratio, mu, p in r["hist"]:
        if t % 2000 == 0:
            print(f"  t={t:5d}  mu={mu:.2f} sd")
