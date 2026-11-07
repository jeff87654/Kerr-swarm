#!/usr/bin/env python3
"""The fertility ratchet in a nation drum, under stem places (Kerr swarm, people.md).

Age-structured cohort model of a 200 M drum with 120-year lives and ~90 M
stem places, plus a latent "wish for a third child" d that is partly passed
from parents to children (b = parent-child regression, genes and culture
together). A household has a third when its d exceeds a threshold T set by
what a third costs it. Variance of d is held at 1 (cultural variation is
treated as renewable), so the mean can climb without limit.

Stem places (people.md, 2 Nov 2026): children belong to a place; each place
passes whole to one heir, who marries a non-heir from another place. At par,
households with 2 children exactly staff the places (one heir, one spouse
elsewhere), and the 5% childless places leave 2 adult slots each: 0.1 slots
a place a generation. Third children compete for those slots; the losers are
placeless and have no children. So a third child's fitness is
    w3 = 2 + P - m,   P = min(1, 0.1 / (0.95 p)),
where p is the share of households having a third, P the chance a third
finds a slot, and m the cost a third imposes on its siblings' prospects
(a shareless sibling is a poorer match for an heir), in reproducing children.
m = 0: the commons carries the placeless and nobody minds. m = 1: a third
costs the family one sibling's marriage. Lack's principle: the wish stops
climbing where P = m, i.e. at p* = 0.1 / (0.95 m).

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
SLOTS = 2 * CHILDLESS                     # adult slots the childless free, a place a generation
SECONDARY = 1.5                           # steady overshoot / excess births (stem_places.py)
YEARS = 3000
N0 = 200e6
COUNT_AT = 1.10
CLEAR_YEARS = 15.0
COUNT_TO = 0.98                           # a stop aims a little under par


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


def slot_chance(p):
    return min(1.0, SLOTS / max(1e-9, (1 - CHILDLESS) * p))


def selection_differential(mu, T, w3):
    """Offspring-weighted mean of d minus mu: households above T leave w3
    reproducing children, the rest 2 (the childless are independent of d)."""
    z = T - mu
    p = 1 - norm.cdf(z)
    phi = norm.pdf(z)
    num = w3 * p * (mu + phi / p) + 2 * (1 - p) * (mu - phi / (1 - p))
    den = w3 * p + 2 * (1 - p)
    return num / den - mu


def run(regime, b, years=YEARS, p0=None, m=0.0, k=0.0, log=False):
    pop = stable_pop()
    mu = np.zeros(AMAX + 1)
    if p0 is None:
        p0 = P_PAR
    T = norm.ppf(1 - p0)
    par_births_rate = None
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
            p, S, w3 = P_PAR, 0.0, 2.0
        else:
            p = third_share(mu_par, T_eff)
            if regime == "person":
                w3 = 3.0
            else:
                w3 = 2 + slot_chance(p) - m
            S = selection_differential(mu_par, T_eff, w3)
        if regime in ("stem", "indexed", "equal"):
            # births come from households, whose number is fixed by the places;
            # the fertile cohorts' size doesn't matter, their third-child share does.
            if par_births_rate is None:
                par_births_rate = pop[0]           # the stable cohort: at par, births = deaths
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
                # licences aim a little under par, as real stops do (Chervil's Margin)
                births = max(0.0, deaths - (pop.sum() - COUNT_TO * N0) / CLEAR_YEARS)
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
    print(f"par third-child share p_par = {P:.3f} (5% childless); slots freed a place a generation = {SLOTS:.2f}")
    print("\nStem places: a third child's chance of a slot, its fitness over a two-child family, and the")
    print("steady overshoot, by the share of households having a third (secondary settling x1.5):")
    print(f"{'p':>6s}{'children/couple':>17s}{'P(slot)':>9s}{'w3-2 (m=0)':>12s}{'over par':>10s}")
    for p in (0.105, 0.15, 0.2, 0.25, 0.3, 0.368, 0.5, 0.632, 1.0):
        print(f"{p:6.3f}{(2+p)*(1-CHILDLESS):17.2f}{slot_chance(p):9.2f}{slot_chance(p):12.2f}{100*over_at(p):9.0f}%")
    print("\nLack's equilibrium: the wish stops climbing where P = m, so p* = 0.1 / (0.95 m):")
    for m in (0.1, 0.2, 0.3, 0.5, 0.75, 1.0):
        ps = min(1.0, SLOTS / ((1 - CHILDLESS) * m))
        print(f"  m={m:.2f}  p*={ps:.2f}  children/couple={(2+ps)*(1-CHILDLESS):.2f}  settles {100*over_at(ps):.0f}% over par")
    print("\nSelection differential S (sd) at par, and years per 1 sd of drift:")
    for regime, w3 in (("person", 3.0), ("stem, m=0", 2 + slot_chance(P)), ("stem, m=0.5", 2 + slot_chance(P) - 0.5)):
        S = selection_differential(0, norm.ppf(1 - P), w3)
        print(f"  {regime:12s} S={S:.3f}  " + "  ".join(f"b={b}: 1 sd in {35/(b*S):,.0f} yr" for b in (0.2, 0.35, 0.5)))
    print("\nSweep, 3,000 years from a drum at par (p = 10.5%). first = years to the first Count (10% over);")
    print("%count = share of years counting; p1000/p3000 = third-child share of the parent cohort; max = pop/par.")
    print(f"{'regime':8s}{'m':>5s}{'k':>4s}{'b':>6s}{'first':>8s}{'Counts':>8s}{'%count':>8s}{'p1000':>7s}{'p3000':>7s}{'max':>7s}")
    runs = [("person", 0.0, 0), ("stem", 0.0, 0), ("stem", 0.0, 3), ("stem", 0.3, 0), ("stem", 0.5, 0), ("stem", 1.0, 0), ("indexed", 0.0, 0), ("equal", 0.0, 0)]
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
