#!/usr/bin/env python3
"""The fertility ratchet in a nation drum (Kerr swarm, people.md, families.md).

Age-structured cohort model of a 200 M drum with 120-year lives and ~90 M
stem places, plus a latent "wish for a third child" d that is partly passed
from parents to children (b = parent-child regression, genes and culture
together). A household has a third when its d exceeds a threshold T set by
what a third costs it. Variance of d is held at 1 (cultural variation is
treated as renewable), so the mean can climb without limit.

The floor. At par every couple that has children must average 2 / 0.95 =
2.105, because 5% have none; a two-child family can't supply more than two,
so families with a third replace the childless and leave at least
    w3 - w2 >= 0.105 / p
more reproducing children than two-child families, where p is the share of
fertile families with a third. Children in a drum are cheap and nearly all
reach adulthood, so an extra child is always there to fill a vacancy; no
inheritance rule gets below the floor (regimes.py, share_market.py).

Regimes:
  stem      canon's places, run by custom: each place passes whole to one heir
            and heirs marry by age, so every child has the same chance of a
            household, f = 1 / (1 + excess), excess = (2 + p)(0.95) / 2 - 1,
            and w3 = 3f, w2 = 2f (share_market.py measures exactly this, and
            finds a share-based marriage market changes nothing). k: rent
            pushing back (T rises by k * overshoot)
  ranked    portions or birth order decide every household (the idealized
            limit: share_market.py's portion market barely moves stem): two-
            child families place both children and three-child families
            share what the childless leave, w3 = 2 + min(1, 0.105 / p), w2 = 2
  person    rented rooms tolerated (the earlier canon, a place for every
            adult): a third child founds a household, w3 = 3, growth compounds
  draw      a draw for thirds (or a pool's lottery of unspent rights): births
            held at par; permits for a third go by lot among couples who want
            one, so wanters leave 2 + min(1, 0.105 / p) and others 2, p the
            share wanting; nobody counts
  indexed   a posted price that moves with the Count, or a market in rights:
            the most eager tenth pay, so p stays at par and selection on the
            wish's intensity runs at full speed forever; nobody counts
  own       the drum's own children: the childless replaced by children drawn
            by lot from every family's embryos and raised by volunteers: no
            selection

Births under stem and ranked come from the places: par births x (1 + 1.5 x
excess), the 1.5 the stock of placeless stem_places.py found at steady state.
A drum 10% over par counts: licences clear the excess over ~15 years by
lottery (never fewer than half the par births), selection pauses, and the
Count ends at par.

Usage: python3 ratchet.py            (prints the tables in ratchet-results.txt)
Needs numpy and scipy; runs in under a minute.
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


def floor_gain(p):
    """The least a third can gain over two children: what the childless leave,
    shared among the families with thirds (the draw and ranked achieve it)."""
    return min(1.0, P_PAR / max(1e-9, p))


def run(regime, b, years=YEARS, p0=None, k=0.0, log=False, every=100):
    pop = stable_pop()
    mu = np.zeros(AMAX + 1)
    if p0 is None:
        p0 = P_PAR
    T = norm.ppf(1 - p0)
    par_births_rate = pop[0]                   # the stable cohort: at par, births = deaths
    counting = False
    years_counting = counts = 0
    first_count = None
    half_want = most_want = None
    min_ratio = max_ratio = 1.0
    hist = []
    for t in range(years):
        deaths_by_age = pop * (1 - np.exp(-MORT))
        deaths = deaths_by_age.sum() + pop[-1] * np.exp(-MORT[-1])   # the last cohort dies too
        w = pop * FSHAPE
        mu_par = (w * mu).sum() / w.sum()
        ratio = pop.sum() / N0
        over = max(0.0, ratio - 1)
        T_eff = mu_par + norm.ppf(1 - P_PAR) if regime == "indexed" else T + k * over
        p = third_share(mu_par, T_eff)          # share having (or, under a draw, wanting) a third
        if regime == "own":
            S = 0.0
        elif regime == "person" or regime == "indexed":
            S = selection_differential(mu_par, T_eff, 3.0, 2.0)
        elif regime == "stem":
            f = child_chance(p)
            S = selection_differential(mu_par, T_eff, 3 * f, 2 * f)
        elif regime in ("ranked", "draw"):
            S = selection_differential(mu_par, T_eff, 2 + floor_gain(p), 2.0)
        else:
            raise ValueError(regime)
        if regime in ("stem", "ranked"):
            # births come from households, whose number is fixed by the places;
            # the fertile cohorts' size doesn't matter, their third-child share does.
            excess_share = (2 + p) * (1 - CHILDLESS) / 2 - 1   # excess births / par births
            births = par_births_rate * (1 + SECONDARY * max(0.0, excess_share) + min(0.0, excess_share))
        elif regime == "person":
            births = (w.sum() / 2) * (2 + p) * (1 - CHILDLESS)
        else:
            births = par_births_rate              # draw, indexed, own: births held at par
        if regime == "draw":
            if half_want is None and p >= 0.5:
                half_want = t
            if most_want is None and p >= 0.9:
                most_want = t
        if regime in ("stem", "ranked", "person"):
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
        if log and t % every == 0:
            hist.append((t, ratio, mu_par, p))
    after = years - first_count if first_count is not None else 0
    return dict(first_count=first_count, years_counting=years_counting, counts=counts,
                counting_after=(years_counting / after if after > 0 else 0.0),
                mu_end=mu_par, p_end=p, min_ratio=min_ratio, max_ratio=max_ratio, hist=hist,
                half_want=half_want, most_want=most_want)


def over_at(p):
    """Steady overshoot at a fixed third-child share, stem places."""
    excess = (2 + p) * (1 - CHILDLESS) / 2 - 1
    return SECONDARY * excess if excess > 0 else excess


if __name__ == "__main__":
    P = P_PAR
    print(f"par third-child share p_par = {P:.3f} (5% childless)")
    print("\nA third's advantage over two children (reproducing children), by the share of fertile families with")
    print("a third: under stem places run by custom (f, every child alike), at the floor no rule gets below")
    print("(0.105 / p: ranked portions or birth order, or a lottery among those who want one), and the steady")
    print("overshoot where births aren't held (stem, ranked):")
    print(f"{'p':>6s}{'children/couple':>17s}{'stem f':>8s}{'floor':>7s}{'over par':>10s}")
    for p in (0.105, 0.15, 0.2, 0.25, 0.3, 0.368, 0.5, 0.632, 0.8, 1.0):
        print(f"{p:6.3f}{(2+p)*(1-CHILDLESS):17.2f}{child_chance(p):8.2f}{floor_gain(p):7.2f}{100*over_at(p):9.0f}%")
    print("\nSelection differential S (sd) at par, and years per 1 sd of drift. At par every rule but 'own'")
    print("gives a third a whole extra household, so they start alike and part as the thirds pile up:")
    S = selection_differential(0, norm.ppf(1 - P), 3.0, 2.0)
    print(f"  S={S:.3f}  " + "  ".join(f"b={b}: 1 sd in {35/(b*S):,.0f} yr" for b in (0.2, 0.35, 0.5)))
    print("\nSweep, 3,000 years from a drum at par (p = 10.5%). first = years to the first Count (10% over);")
    print("%count = share of all years counting, %after = share of the years after the first Count;")
    print("p1000/p3000 = share having a third (draw: wanting one) in the parent cohort; max = pop/par;")
    print("draw: years until half, and nine in ten, want a third.")
    print(f"{'regime':8s}{'k':>4s}{'b':>6s}{'first':>8s}{'Counts':>8s}{'%count':>8s}{'%after':>8s}{'p1000':>7s}{'p3000':>7s}{'max':>7s}{'half':>7s}{'90%':>7s}")
    runs = [("person", 0), ("stem", 0), ("stem", 3), ("ranked", 0), ("draw", 0), ("indexed", 0), ("own", 0)]
    for regime, k in runs:
        for b in (0.2, 0.35, 0.5):
            r = run(regime, b, k=k, log=True)
            fc = "never" if r["first_count"] is None else str(r["first_count"])
            p1000 = [h[3] for h in r["hist"] if h[0] == 1000][0]
            hw = "-" if r["half_want"] is None else str(r["half_want"])
            mw = "-" if r["most_want"] is None else str(r["most_want"])
            if regime != "draw":
                hw = mw = ""
            print(f"{regime:8s}{k:4d}{b:6.2f}{fc:>8s}{r['counts']:8d}{100*r['years_counting']/YEARS:8.0f}"
                  f"{100*r['counting_after']:8.0f}{p1000:7.2f}{r['p_end']:7.2f}{r['max_ratio']:7.2f}{hw:>7s}{mw:>7s}")
    print("\nb = 0.35, every 250 years: share having a third (draw: wanting one) and pop/par")
    print(f"{'year':>6s}" + "".join(f"{r:>16s}" for r in ("stem", "ranked", "draw")))
    rs = {r: run(r, 0.35, log=True, every=250)["hist"] for r in ("stem", "ranked", "draw")}
    for i in range(len(rs["stem"])):
        t = rs["stem"][i][0]
        print(f"{t:6d}" + "".join(f"{rs[r][i][3]:9.2f} ({rs[r][i][1]:.2f})" for r in ("stem", "ranked", "draw")))
    print("\nDraw, b = 0.35, 10,000 years: the share wanting a third saturates; the mean wish creeps on:")
    r = run("draw", 0.35, years=10000, log=True)
    for t, ratio, mu, p in r["hist"]:
        if t % 2000 == 0:
            print(f"  t={t:5d}  mu={mu:.2f} sd  wanting a third {p:.2f}")
    print("\nIndexed price or market, b=0.35, 10,000 years: the mean wish climbs without slowing")
    print("(the price, in sd of wish, keeps pace):")
    r = run("indexed", 0.35, years=10000, log=True)
    for t, ratio, mu, p in r["hist"]:
        if t % 2000 == 0:
            print(f"  t={t:5d}  mu={mu:.2f} sd")
    print("\nMedicine. The same drum with fewer couples childless, from two starts: the wish already set for")
    print("the new par (as if the clinics had always been that good), and the wish set for canon's 5% (the")
    print("clinics improve in a drum that was at par), which puts the drum over par at once. Custom: first")
    print("Count (b = 0.35). Draw: share wanting a third at 3,000 / 9,500 / 23,000 years (Sorrel's Register).")
    saved = (globals()["CHILDLESS"], globals()["P_PAR"])
    for c0 in (0.05, 0.02, 0.01):
        globals()["CHILDLESS"] = c0
        globals()["P_PAR"] = 2 / (1 - c0) - 2
        for label, p0 in (("set for new par", None), ("set for 5%", 2 / 0.95 - 2)):
            if c0 == 0.05 and p0 is not None:
                continue
            fc = run("stem", 0.35, p0=p0)["first_count"]
            line = f"  childless {c0:4.0%} ({label:15s}): custom first Count {fc} yr; draw wanting a third"
            for b in (0.2, 0.35, 0.5):
                h = {t: p for t, ratio, mu, p in run("draw", b, p0=p0, years=23000, log=True, every=500)["hist"]}
                line += f"  b={b}: {h[3000]:.2f}/{h[9500]:.2f}/{h[22500]:.2f}"
            print(line)
    globals()["CHILDLESS"], globals()["P_PAR"] = saved
