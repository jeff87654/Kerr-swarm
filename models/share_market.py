#!/usr/bin/env python3
"""What a third child costs its line when shares matter on the marriage market.

Extends stem_places.py (same directory) with a marriage-market rule and a
cohort tag, to measure m: the cost a third child puts on its own line, in
reproducing descendants, against P, the third's own chance of heading a
household. people.md § What births do to the gene pool uses m.

Market rules:
  none     stem_places.py as it stands: pairing at random by age
  heir     a place-holder marries only someone who holds a share
  assort   share-holders marry share-holders, the shareless marry each other
  portion  each child's portion is 1 / the number of its parents' children;
           every year heirs choose first, each taking the unmarried partner
           within five years of age with the largest portion; the rest pair
           at random by age

Method: run the stem model to par, switch every new couple to 2 + e children
(e = 0.3 → 30% of households have a third, 2.19 children a couple on average)
and let the drum settle over par for `settle` years. Then tag every child born
in a `window` of years with its household and birth order, and run on for
`follow` years so the tagged children and their own children have had every
chance to head a household. Then, by household size:
  - children who headed a household, per household (w);
  - the third-born's chance (P); the first two's chance against children of
    two-child households (the siblings' cost);
  - grandchildren who headed a household, per household;
  - the share wait of tagged children, by household size.
m_children = 2 × (f2 − f3_first_two): what the siblings lose, in reproducing
children. m_line adds the grandchildren's shortfall, per tagged child.

Usage: python3 share_market.py <none|heir|assort|portion> [e] [seed]
Each run takes several minutes in CPython.
"""
import statistics
import sys

import stem_places as sp


class MarketModel(sp.Model):
    def __init__(self, *args, market=None, **kw):
        super().__init__(*args, **kw)
        self.market = market
        self.tag = {}
        self.tag_window = None

    def compatible(self, a, b):
        if self.market is None or self.market == "none":
            return True
        if self.market == "heir":
            return not ((self.established(a) and not b.share) or (self.established(b) and not a.share))
        if self.market == "assort":
            return a.share == b.share
        if self.market == "portion":
            return True
        raise ValueError(self.market)

    def portion(self, p):
        """A family's portion splits among its children: 1 / the number of them."""
        if not p.parents:
            return 0.5
        return 1.0 / max(1, len(self.people[p.parents[0]].children))

    def portion_pass(self, cands, used):
        """Heirs choose first, each taking the unmarried partner within five years
        of age with the largest portion (the portion drum)."""
        import bisect
        borns = [p.born for p in cands]
        est = [a for a in cands if self.established(a)]
        self.rng.shuffle(est)
        for a in est:
            if a.id in used:
                continue
            lo = bisect.bisect_left(borns, a.born - 5)
            hi = bisect.bisect_right(borns, a.born + 5)
            best, bp = None, -1.0
            for b in cands[lo:hi]:
                if b.id in used or b.id == a.id:
                    continue
                if a.gps & b.gps or a.id in b.gps or b.id in a.gps:
                    continue
                pb = self.portion(b) + 1e-6 * self.rng.random()
                if pb > bp:
                    best, bp = b, pb
            if best is not None:
                used.update((a.id, best.id))
                if self.recording:
                    self.stats["wedding_age"] += [self.age(a), self.age(best)]
                    self.stats["est_at_wedding"].append(1)
                self.marry(a, best)

    def birth(self, aid, bid):
        before = self.people[aid].kids
        super().birth(aid, bid)
        a = self.people[aid]
        if a.kids > before and self.tag_window and self.tag_window[0] <= self.year < self.tag_window[1]:
            cid = a.children[-1]
            self.tag[cid] = (min(aid, bid), a.kids)

    def step(self):
        """stem_places.Model.step with the market rule in the pairing loop."""
        y = self.year
        self.alive_list = [self.people[i] for i in self.alive_ids]
        for pid in self.deaths_by_year.pop(y, []):
            p = self.people[pid]
            if not p.alive:
                continue
            p.alive = False
            self.alive_ids.discard(pid)
            if self.places_on:
                if p.share:
                    p.share = False
                    self.pass_share(p)
                if p.place is not None:
                    pl, p.place = p.place, None
                    s = self.people[p.spouse] if p.spouse is not None else None
                    if s is not None and s.alive and self.rule != "P":
                        s.place = pl
                    else:
                        self.pass_place(pl, p)
            if self.recording:
                self.stats["death_age"].append(y - p.born)
        for aid, bid in self.births_by_year.pop(y, []):
            self.birth(aid, bid)
        cands = [p for p in self.alive_list if p.alive and not p.married and self.age(p) >= p.mage]
        self.rng.shuffle(cands)
        cands.sort(key=lambda p: p.born)
        used = set()
        if self.places_on and self.market == "portion":
            self.portion_pass(cands, used)
        for i, a in enumerate(cands):
            if a.id in used:
                continue
            for j in range(i + 1, min(i + 8, len(cands))):
                b = cands[j]
                if b.id in used:
                    continue
                if abs(a.born - b.born) > 5:
                    break
                if a.gps & b.gps or a.id in b.gps or b.id in a.gps:
                    continue
                if self.places_on and not self.compatible(a, b):
                    continue
                used.update((a.id, b.id))
                if self.places_on and self.recording:
                    self.stats["wedding_age"] += [self.age(a), self.age(b)]
                    self.stats["est_at_wedding"].append(
                        1 if (self.established(a) or self.established(b)) else 0)
                self.marry(a, b)
                break
        if self.places_on and self.free_places:
            pool = sorted(self.unestablished([p.id for p in self.alive_list], 18, None),
                          key=lambda p: p.born)
            while self.free_places and pool:
                h = pool.pop(0)
                h.place = self.free_places.pop()
                spp = self.people[h.spouse] if h.spouse is not None else None
                if spp is not None and spp.alive:
                    self.on_household(h, spp)
                elif h.est is None:
                    h.est = y
        self.year += 1


def run(market, e=0.3, seed=1, ppp=2.6, settle=300, window=30, follow=120):
    m = MarketModel(seed=seed, rule="L", ppp=ppp, market=market)
    for _ in range(m.phase1):
        m.step()
    m.switch_on()
    for _ in range(400):
        m.step()
    m.reset_shares()
    for _ in range(200):
        m.step()
    base = m.snapshot()
    # every new couple wants 2 + e children
    def draw_want(rng):
        return 2 + int(e) + (1 if rng.random() < e - int(e) else 0)
    m.draw_want = draw_want
    for pid in list(m.alive_ids):
        p = m.people[pid]
        if p.married and p.kids == 0 and not p.childless:
            w = draw_want(m.rng)
            p.want = w
            if p.spouse is not None:
                m.people[p.spouse].want = w
    for _ in range(settle):
        m.step()
    before = m.snapshot()
    m.tag_window = (m.year, m.year + window)
    for _ in range(window):
        m.step()
    m.tag_window = None
    for _ in range(follow):
        m.step()
    after = m.snapshot()
    return m, base, before, after


def analyse(m, base, before, after, label):
    hh = {}
    for cid, (key, order) in m.tag.items():
        hh.setdefault(key, []).append((order, cid))
    rows = {2: [], 3: []}
    for key, kids in hh.items():
        par = m.people[key]
        K = par.kids
        if K not in rows or len(kids) != K:
            continue           # only households whose whole brood fell in the window
        rec = []
        for order, cid in sorted(kids):
            c = m.people[cid]
            est = c.est is not None
            gc = [m.people[g] for g in c.children]
            gc_est = sum(1 for g in gc if g.est is not None)
            wait = None
            if c.shareless_since is None and c.share:
                wait = 0.0
            rec.append(dict(order=order, est=est, n_gc=len(gc), gc_est=gc_est, share=c.share,
                            shareless_since=c.shareless_since, born=c.born))
        rows[K].append(rec)

    def frac_est(recs, orders):
        xs = [r["est"] for rec in recs for r in rec if r["order"] in orders]
        return (sum(xs) / len(xs)) if xs else float("nan"), len(xs)

    print(f"== market: {label}")
    print(f"  par snapshot: people per place {base['ppp']:.2f}; before the window (settled over par):"
          f" pop {before['n'] / base['n']:.3f} of par, ppp {before['ppp']:.2f}, no household at 45+ {before['placeless45']:.1%},"
          f" shareless adults {before['shareless_adults']:.1%}; after: pop {after['n'] / base['n']:.3f}, no household at 45+ {after['placeless45']:.1%}")
    n2, n3 = len(rows[2]), len(rows[3])
    print(f"  tagged households with their whole brood in the window: {n2} with two children, {n3} with three")
    f2, k2 = frac_est(rows[2], (1, 2))
    f3a, k3a = frac_est(rows[3], (1, 2))
    f3c, k3c = frac_est(rows[3], (3,))
    w2 = 2 * f2
    w3 = 2 * f3a + f3c
    gc2 = statistics.mean(sum(r["gc_est"] for r in rec) for rec in rows[2]) if rows[2] else float("nan")
    gc3 = statistics.mean(sum(r["gc_est"] for r in rec) for rec in rows[3]) if rows[3] else float("nan")
    gc_per_est = statistics.mean(r["gc_est"] for rec in rows[2] for r in rec if r["est"]) if rows[2] else float("nan")
    print(f"  children who headed a household: two-child households {f2:.3f} each (w2 = {w2:.2f});"
          f" three-child households: first two {f3a:.3f} each, the third {f3c:.3f} (P), w3 = {w3:.2f}")
    m_children = 2 * (f2 - f3a)
    print(f"  the third's advantage w3 − w2 = {w3 - w2:+.2f} reproducing children; its own chance P = {f3c:.2f};"
          f" the siblings' cost m_children = {m_children:+.2f}")
    print(f"  grandchildren who headed a household: {gc2:.2f} per two-child household, {gc3:.2f} per three-child household"
          f" (advantage {gc3 - gc2:+.2f}; a reproducing child yields {gc_per_est:.2f} such grandchildren,"
          f" so in reproducing-child units {((gc3 - gc2) / gc_per_est) if gc_per_est else float('nan'):+.2f})")
    m_line = f3c - (gc3 - gc2) / gc_per_est if gc_per_est else float("nan")
    print(f"  m by the line (P minus the grandchildren advantage, in reproducing children): {m_line:+.2f}")
    # share waits
    def waits(recs, orders):
        xs = []
        for rec in recs:
            for r in rec:
                if r["order"] in orders:
                    if r["share"]:
                        xs.append(0)
                    elif r["shareless_since"] is not None:
                        xs.append(m.year - r["shareless_since"])
        return xs
    sw2 = waits(rows[2], (1, 2)); sw3 = waits(rows[3], (1, 2, 3))
    print(f"  tagged children still shareless at the end: two-child households {sum(1 for x in sw2 if x > 0) / max(1, len(sw2)):.1%},"
          f" three-child households {sum(1 for x in sw3 if x > 0) / max(1, len(sw3)):.1%}")
    st = m.stats
    return dict(label=label, w2=w2, w3=w3, P=f3c, m_children=m_children, m_line=m_line,
                over=before["n"] / base["n"], placeless45=before["placeless45"])


if __name__ == "__main__":
    market = sys.argv[1] if len(sys.argv) > 1 else "none"
    e = float(sys.argv[2]) if len(sys.argv) > 2 else 0.3
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    m, base, before, after = run(market, e=e, seed=seed)
    analyse(m, base, before, after, f"{market}, {0.95 * (2 + e):.2f} children a couple, seed {seed}")
