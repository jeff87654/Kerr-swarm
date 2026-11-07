#!/usr/bin/env python3
"""Which inheritance rules hold the wish for children (Kerr swarm, docs/families.md).

A discrete-generation lineage model, a companion to ratchet.py (the cohort
model) and share_market.py (the family tree). A generation is ~35 years. Every
adult carries a heritable wish for a third child, d; a couple has a third when
the mean of their two wishes exceeds a fixed threshold T, set so that 10.5% do
at the start, which at 5% childless replaces the drum (par). A child's wish is
    d = mu + B (midparent - mu) + sqrt(1 - B^2 / 2) z,
so the mean responds to selection by B times the selection differential on
midparents (the breeder's equation), and the variance stays at 1. Nothing is
counted: the model shows what each rule does to the wish and the numbers when
the drum leaves it alone.

Regimes, by what decides who has children:
  stem      places pass whole to the eldest child (primogeniture: canon's line
            rule gives every child the same chance, so a third gains a little
            more there; see share_market.py); heirs marry other families'
            children at random; a place whose couple was childless goes to an
            adopted heir, also at random
  rank      the portion drum: as stem, but a family's non-heirs split one
            portion, so a third halves its siblings', and heirs and adoptions
            take the largest portions first
  softrank  as rank, with the portion one consideration among others
            (score = portion x lognormal(0, 0.5))
  order     as stem, but heirs take second-born children before thirds
  draw      as stem, but a third birth needs a permit; permits to replace the
            childless go by lot among couples who want a third (a holdings
            drum's draw, or a pool's lottery of unspent rights)
  bid       as draw, but permits go to the couples who want a third most
            (a rights market, or a price indexed to hold births at par)
  joint     closed lineages: a child belongs to its mother's place for life;
            partners visit and never move; a place keeps CAP adults a
            generation, the excess leave at random and have no children, and
            places short of people take leavers in
  joint3    as joint, but children beyond their mother's second leave first
  partible  no places: a couple's estate (space and shares together) splits
            equally among its children; a couple may have children only if
            their estates together reach HMIN of a par place's; the estate of
            anyone who leaves no children goes to their nieces and nephews,
            else to everyone
  partible-a  as partible, with couples matched by estate (like marries like)
  partible-i  as partible, but each partner must bring half the minimum: a
            spouse's estate can't make up for a third child's thin one

Simplifications worth knowing. Families have two or three children, never
more, so where births aren't rationed the wish would go on to fourths once
everyone wants a third. rank, order, draw and bid reach the floor (0.105 / p)
by construction: they place every child of a two-child family before any
other, so the model confirms the arithmetic for them rather than testing it;
share_market.py's portion market is the realistic test. In joint drums each
woman's partner is drawn with replacement from the men kept in other places,
every man kept in a place counts as heading a household, and a place with no
women takes one leaver in even above its cap. Split-estate couples are paired
once (at random, or like with like) with no re-matching, which inflates both
the couples below the minimum and the swings.

Usage: python3 regimes.py [regime ...] [--gens N] [--seed S] [--b B] [--hmin H] [--cap C]
       python3 regimes.py all          every regime, 150 generations, b = 0.5
       python3 regimes.py table        each regime's advantage by the share wanting a third
Prints, every few generations: the share of bearing couples with a third (p),
the generation's size against par, the share of adults without a household
(or, in partible drums, below the minimum), the mean wish, and the realized
advantage of a three-child family over a two-child one in children who
themselves head households (w3 - w2), averaged over the window.
"""
import math
import random
import statistics
import sys
from collections import defaultdict
from statistics import NormalDist

C0 = 0.05                      # couples childless by chance
P_PAR = 2 / (1 - C0) - 2       # third-child share that replaces them, ~10.5%
ND = NormalDist()


class Agent:
    __slots__ = ("id", "d", "sex", "fam", "order", "nsib", "home", "x", "parents")

    def __init__(self, aid, d, sex, fam, order, nsib, home, x, parents):
        self.id, self.d, self.sex, self.fam = aid, d, sex, fam
        self.order, self.nsib, self.home, self.x = order, nsib, home, x
        self.parents = parents


class Sim:
    def __init__(self, regime, P=4000, B=0.5, seed=1, cap=4, hmin=0.7):
        self.regime = regime
        self.P, self.B, self.cap, self.hmin = P, B, cap, hmin
        self.rng = random.Random(seed)
        self.T = math.sqrt(0.5) * ND.inv_cdf(1 - P_PAR)   # midparent ~ N(mu, 1/2)
        self.next_id = 0
        self.next_fam = 0
        self.vacant = []
        self.adults = self._founders()
        self.fam_n = {}            # family id -> children born
        self.fam_want = {}         # family id -> the couple wanted a third
        self.log = []

    # ---------- founders ----------
    def _agent(self, d, sex, fam, order, nsib, home, x, parents=()):
        a = Agent(self.next_id, d, sex, fam, order, nsib, home, x, parents)
        self.next_id += 1
        return a

    def _founders(self):
        rng, P = self.rng, self.P
        out = []
        if self.regime.startswith("joint"):
            for pl in range(P):
                for k in range(self.cap):
                    out.append(self._agent(rng.gauss(0, 1), k % 2, -1, 1, 2, pl, 0.0))
        elif self.regime.startswith("partible"):
            xs = [rng.lognormvariate(0, 0.3) for _ in range(2 * P)]
            s = sum(xs)
            for x in xs:
                out.append(self._agent(rng.gauss(0, 1), rng.randrange(2), -1, 1, 2, None, x * P / s))
        else:
            for pl in range(P):
                # each place starts with a couple's two children: the heir and one other
                f = self.next_fam
                self.next_fam += 1
                out.append(self._agent(rng.gauss(0, 1), 0, f, 1, 2, pl, 0.0))
                out.append(self._agent(rng.gauss(0, 1), 1, f, 2, 2, pl, 0.0))
        return out

    # ---------- births ----------
    def child_d(self, mp, mu):
        B = self.B
        return mu + B * (mp - mu) + math.sqrt(1 - B * B / 2) * self.rng.gauss(0, 1)

    def bear(self, couples, mu, rights=None):
        """couples: list of (a, b, home). Returns children, family sizes, and
        counts: bearing couples, with a third, wanting a third."""
        rng = self.rng
        kids = []
        nb = n3 = want = 0
        plan = []
        for a, b, home in couples:
            if rng.random() < C0:
                plan.append((a, b, home, 0, None))
                continue
            mp = (a.d + b.d) / 2
            w = mp > self.T
            nb += 1
            want += w
            plan.append((a, b, home, 3 if w else 2, mp))
        if rights is not None:
            # draw / bid: thirds only with a permit; enough permits to hold births at par
            R = max(0, 2 * self.P - 2 * nb)
            wanters = [i for i, t in enumerate(plan) if t[3] == 3]
            if len(wanters) > R:
                if rights == "lot":
                    win = set(rng.sample(wanters, R))
                else:
                    wanters.sort(key=lambda i: -plan[i][4])
                    win = set(wanters[:R])
                for i in wanters:
                    if i not in win:
                        a, b, home, n, mp = plan[i]
                        plan[i] = (a, b, home, 2, mp)
        for a, b, home, n, mp in plan:
            f = self.next_fam
            self.next_fam += 1
            self.fam_n[f] = n
            self.fam_want[f] = (mp is not None and mp > self.T)
            if n == 3:
                n3 += 1
            if n == 0:
                continue
            X = (a.x + b.x) if self.regime.startswith("partible") else 0.0
            for k in range(n):
                kids.append(self._agent(self.child_d(mp, mu), rng.randrange(2), f, k + 1, n,
                                        home, X / n, (a.id, b.id)))
        return kids, nb, n3, want

    # ---------- allocation: who heads a household ----------
    def stem_alloc(self, adults):
        rng = self.rng
        by_home = defaultdict(list)
        for a in adults:
            by_home[a.home].append(a)
        heirs, non = {}, []
        for pl, kids in by_home.items():
            kids.sort(key=lambda a: a.order)
            if pl is not None and pl >= 0:
                heirs[pl] = kids[0]
                non.extend(kids[1:])
            else:
                non.extend(kids)
        vacant = [pl for pl in range(self.P) if pl not in heirs]
        need = len(heirs) + 2 * len(vacant)
        r = self.regime
        if r in ("rank", "softrank"):
            def key(a):
                portion = 1.0 / max(1, a.nsib - 1)
                if r == "softrank":
                    portion *= rng.lognormvariate(0, 0.5)
                return (-portion, rng.random())
            non.sort(key=key)
        elif r == "order":
            non.sort(key=lambda a: (a.order, rng.random()))
        else:
            rng.shuffle(non)
        chosen, left = non[:need], non[need:]
        rng.shuffle(chosen)              # which slot each takes doesn't matter
        couples, headed = [], set()
        it = iter(chosen)
        for pl, h in heirs.items():
            sp = next(it, None)
            if sp is None:               # an heir with nobody to marry: no household this generation
                left.append(h)
                continue
            couples.append((h, sp, pl))
            headed.update((h.id, sp.id))
        for pl in vacant:
            a = next(it, None)
            b = next(it, None)
            if a is None or b is None:
                for z in (a, b):
                    if z is not None:
                        left.append(z)
                continue
            couples.append((a, b, pl))
            headed.update((a.id, b.id))
        return couples, headed, left

    def joint_alloc(self, adults):
        rng = self.rng
        by_home = defaultdict(list)
        for a in adults:
            by_home[a.home].append(a)
        kept, leavers = {}, []
        for pl in range(self.P):
            kids = by_home.get(pl, [])
            if len(kids) > self.cap:
                rng.shuffle(kids)
                if self.regime == "joint3":
                    kids.sort(key=lambda a: a.order > 2)      # a mother's third and later go first
                kept[pl] = kids[:self.cap]
                leavers.extend(kids[self.cap:])
            else:
                kept[pl] = kids
        rng.shuffle(leavers)
        women = [a for a in leavers if a.sex == 0]
        others = [a for a in leavers if a.sex == 1]
        taken = set()
        # a place with no women takes one in, then places short of people fill up
        for pl in range(self.P):
            if not any(a.sex == 0 for a in kept[pl]) and women:
                w = women.pop()
                kept[pl].append(w)
                taken.add(w.id)
        pool = women + others
        rng.shuffle(pool)
        for pl in range(self.P):
            while len(kept[pl]) < self.cap and pool:
                z = pool.pop()
                kept[pl].append(z)
                taken.add(z.id)
        left = pool
        for pl, ms in kept.items():
            for a in ms:
                a.home = pl
        for a in left:
            a.home = None
        # couples: each woman in a place with a man from another place
        men = [a for ms in kept.values() for a in ms if a.sex == 1]
        couples, headed = [], set()
        for pl, ms in kept.items():
            for a in ms:
                headed.add(a.id)
                if a.sex != 0 or not men:
                    continue
                for _ in range(5):
                    f = rng.choice(men)
                    if f.home != pl:
                        break
                couples.append((a, f, pl))
        return couples, headed, left

    def partible_alloc(self, adults):
        rng = self.rng
        pool = list(adults)
        if self.regime == "partible-a":
            pool.sort(key=lambda a: a.x * rng.lognormvariate(0, 0.2))
        else:
            rng.shuffle(pool)
        couples, headed, left = [], set(), []
        each = self.regime == "partible-i"
        for a, b in zip(pool[0::2], pool[1::2]):
            if (min(a.x, b.x) >= self.hmin / 2) if each else (a.x + b.x >= self.hmin):
                couples.append((a, b, None))
                headed.update((a.id, b.id))
            else:
                left.extend((a, b))
        if len(pool) % 2:
            left.append(pool[-1])
        return couples, headed, left

    # ---------- one generation ----------
    def step(self, g):
        adults = self.adults
        mu = statistics.fmean(a.d for a in adults)
        r = self.regime
        if r.startswith("joint"):
            couples, headed, left = self.joint_alloc(adults)
        elif r.startswith("partible"):
            couples, headed, left = self.partible_alloc(adults)
        else:
            couples, headed, left = self.stem_alloc(adults)
        # realized advantage of the previous generation's families
        heads_by_fam = defaultdict(int)
        kids_by_fam = defaultdict(int)
        for a in adults:
            kids_by_fam[a.fam] += 1
            if a.id in headed:
                heads_by_fam[a.fam] += 1
        w = {2: [], 3: []}
        for f, n in kids_by_fam.items():
            if n in w and self.fam_n.get(f) == n:
                w[n].append(heads_by_fam[f])
        gain = (statistics.fmean(w[3]) - statistics.fmean(w[2])) if w[2] and w[3] else float("nan")
        # the advantage that selection sees: couples who wanted a third against those who didn't
        ww = {True: [], False: []}
        for f, n in kids_by_fam.items():
            if f in self.fam_want and self.fam_n.get(f, 0) > 0:
                ww[self.fam_want[f]].append(heads_by_fam[f])
        gain_w = (statistics.fmean(ww[True]) - statistics.fmean(ww[False])) if ww[True] and ww[False] else float("nan")
        rights = {"draw": "lot", "bid": "top"}.get(r)
        kids, nb, n3, want = self.bear(couples, mu, rights=rights)
        if r.startswith("partible"):
            # estates of those who leave no children go to nieces and nephews
            kids_of = defaultdict(list)
            for c in kids:
                for pid in c.parents:
                    kids_of[pid].append(c)
            sibs = defaultdict(list)
            for a in adults:
                sibs[a.fam].append(a)
            bearing_ids = set()
            for c in kids:
                bearing_ids.update(c.parents)
            spare = 0.0
            for a in adults:
                if a.id in bearing_ids or a.x <= 0:
                    continue
                nieces = [c for s in sibs[a.fam] if s.id != a.id for c in kids_of[s.id]]
                if nieces:
                    share = a.x / len(nieces)
                    for c in nieces:
                        c.x += share
                else:
                    spare += a.x
            if kids and spare:
                share = spare / len(kids)
                for c in kids:
                    c.x += share
        p = n3 / nb if nb else float("nan")
        # the advantage just measured belongs to the families of the previous
        # generation, so it goes on that generation's row, beside the share of
        # its couples who wanted a third
        if self.log:
            self.log[-1]["gain"], self.log[-1]["gain_w"] = gain, gain_w
        self.log.append(dict(g=g, n=len(adults) / (2 * self.P), p=p, want=want / nb if nb else float("nan"),
                             left=len(left) / max(1, len(adults)), mu=mu, gain=float("nan"), gain_w=float("nan"),
                             x_med=statistics.median(a.x for a in adults) if r.startswith("partible") else None))
        self.adults = kids
        return bool(kids)

    def run(self, gens):
        for g in range(gens):
            if not self.step(g):
                break
        return self.log


def report(regime, gens=150, seed=1, B=0.5, hmin=0.7, cap=4, every=None):
    s = Sim(regime, B=B, seed=seed, hmin=hmin, cap=cap)
    log = s.run(gens)
    every = every or [0, 5, 10, 20, 40, 60, 80, 100, 120, 149]
    label = regime + (f" (hmin {hmin})" if regime.startswith("partible") else "") + (f" (cap {cap})" if regime.startswith("joint") else "")
    print(f"== {label}, b = {B}, seed {seed}")
    print(f"  {'gen':>4s} {'p':>6s} {'want':>6s} {'size/par':>9s} {'no hh':>7s} {'mu':>6s} {'w3-w2':>7s} {'want-not':>9s}")
    prev = 0
    for g in every:
        if g >= len(log):
            break
        def avg(k):
            win = [r[k] for r in log[prev:g + 1] if not math.isnan(r[k])]
            return statistics.fmean(win) if win else float("nan")
        r = log[g]
        print(f"  {g:4d} {r['p']:6.3f} {r['want']:6.3f} {r['n']:9.3f} {r['left']:7.3f} {r['mu']:6.2f}"
              f" {avg('gain'):7.2f} {avg('gain_w'):9.2f}")
        prev = g + 1
    return log


def table(gens=150, B=0.5, seeds=(1, 2, 3, 4)):
    """A third's advantage that selection sees (couples who wanted a third over
    those who didn't), binned by the share of their generation's couples who
    wanted one, for every regime, against the floor 0.105 / p. Each cell is the
    mean over generations in the bin, +- its standard error; mu is the mean
    wish (sd of an individual's wish) at the last generation."""
    bins = [(0.25, 0.35), (0.45, 0.55), (0.75, 0.85), (0.9, 1.0)]
    runs = [("stem", {}), ("rank", {}), ("softrank", {}), ("order", {}), ("draw", {}), ("bid", {}),
            ("joint", {"cap": 4}), ("joint3", {"cap": 4}), ("joint3", {"cap": 12}),
            ("partible", {}), ("partible-a", {}), ("partible-i", {})]
    print(f"A third's advantage (wanted a third minus didn't, in children who head households), b = {B},")
    print(f"{gens} generations, seeds {seeds}; mean +- standard error over generations whose share wanting a")
    print("third is in the bin; split estates with a minimum of 0.7 of a place a couple; mu = the mean wish at the end")
    head = "".join(f"{f'{lo:.2f}-{hi:.2f}':>14s}" for lo, hi in bins)
    print(f"{'regime':22s}{head}{'size/par':>12s}{'mu':>6s}")
    floor = "".join(f"{P_PAR / ((lo + hi) / 2):14.2f}" for lo, hi in bins)
    print(f"{'floor (0.105 / p)':22s}{floor}")
    for r, kw in runs:
        vals = {b: [] for b in bins}
        sizes, mus = [], []
        for sd in seeds:
            s = Sim(r, B=B, seed=sd, cap=kw.get("cap", 4), hmin=kw.get("hmin", 0.7))
            log = s.run(gens)
            base = log[0]["n"]
            mus.append(log[-1]["mu"])
            for row in log[10:]:
                sizes.append(row["n"] / base)
                for lo, hi in bins:
                    if lo <= row["want"] < hi and not math.isnan(row["gain_w"]):
                        vals[(lo, hi)].append(row["gain_w"])
        label = r + "".join(f" {k}={v}" for k, v in kw.items())
        cells = ""
        for v in vals.values():
            if len(v) >= 3:
                se = statistics.stdev(v) / math.sqrt(len(v))
                cells += f"{statistics.fmean(v):9.2f}+-{se:.2f}"
            else:
                cells += f"{'-':>14s}"
        print(f"{label:22s}{cells}{min(sizes):6.2f}-{max(sizes):.2f}{statistics.fmean(mus):6.2f}")


if __name__ == "__main__":
    args = sys.argv[1:]
    gens, seed, B, hmin, CAP = 150, 1, 0.5, 0.7, 4
    regs = []
    i = 0
    while i < len(args):
        a = args[i]
        if a == "--gens":
            gens = int(args[i + 1]); i += 2; continue
        if a == "--seed":
            seed = int(args[i + 1]); i += 2; continue
        if a == "--b":
            B = float(args[i + 1]); i += 2; continue
        if a == "--hmin":
            hmin = float(args[i + 1]); i += 2; continue
        if a == "--cap":
            CAP = int(args[i + 1]); i += 2; continue
        regs.append(a)
        i += 1
    if regs == ["table"]:
        table(gens=gens, B=B)
        sys.exit()
    if not regs or regs == ["all"]:
        regs = ["stem", "rank", "softrank", "order", "draw", "bid", "joint", "joint3", "partible", "partible-a", "partible-i"]
    for r in regs:
        report(r, gens=gens, seed=seed, B=B, hmin=hmin, cap=CAP)
