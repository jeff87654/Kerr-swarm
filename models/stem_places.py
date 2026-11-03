#!/usr/bin/env python3
"""Family-tree model of a nation drum under stem places (Kerr swarm, people.md).

A place is one household's home and passes whole to one heir. A couple has a
household when either partner holds a place, so one place serves one couple.
Children belong to a place: couples have children only once they have a
household, 3 and 6 years later, a third with probability T3, none with
probability C0, and none after the younger partner is 60. People marry at
~M_AGE whatever their places, at random by age; the placeless can marry but
have no children.

Inheritance rules, applied at the death of a place's last holder:
  L (line, canon): the eldest descendant of the holder without a household
    aged 18-45, then the same in the holder's siblings' lines; failing that,
    the eldest such descendant under 18; failing that, an adopted heir: the
    drum's eldest adult without a household aged 18-55. Placeless elders never
    inherit down the line, only by adoption into a heirless place.
  S (seniority): the eldest living descendant of the holder without a
    household, at any age; then the siblings' lines, then the cousins'; then
    the drum's eldest adult without one.
  P (per-person places, the earlier canon): every adult needs a place of their
    own, children come 3 and 6 years after marriage whatever the places, and a
    place goes to the eldest placeless descendant of the dead.

Shares: one per person at par, freed by a death, passed to the longest-waiting
shareless member of the dead's family (descendants, then the dead's parents'
descendants), else held for the next child born there, else to the drum's
longest-waiting shareless person.

Phase 1 (300 years) builds a genealogy with no places. Phase 2 switches places
on with one place per PPP people, burns in for 400 years, resets shares to one
a person, runs 200 more, then records for MEASURE years. "e<extra>" runs then
switch couples to 2 + extra children each and follow the drum.

Usage:
  python3 stem_places.py base L [seed] [ppp]     stationary drum, line rule
  python3 stem_places.py open L [seed] [ppp]     marriage at ~25 (open drums)
  python3 stem_places.py e0.368 L [seed] [ppp]   2.25 children a couple
  python3 stem_places.py e1.158 S [seed] [ppp]   3.0 children a couple, seniority
  python3 stem_places.py base P 1 1.34           per-person places, for comparison
Each run takes a few minutes in CPython.
"""
import math
import random
import statistics
import sys
from collections import defaultdict

LAMBDA = 2.0e-4      # background mortality (survival to 35 ~0.993)
GOMP_B = 0.10
GOMP_MODE = 127.0    # with the background term, mean life ~120
GOMP_A = GOMP_B * math.exp(-GOMP_B * GOMP_MODE)


def lifespan(rng):
    g = math.log(1.0 - (GOMP_B / GOMP_A) * math.log(rng.random())) / GOMP_B
    m = -math.log(rng.random()) / LAMBDA
    return min(g, m)


class Person:
    __slots__ = ("id", "born", "dies", "parents", "children", "spouse", "mage",
                 "married", "place", "est", "childless", "want", "kids",
                 "share", "shareless_since", "alive", "mar_year", "gps")

    def __init__(self, pid, born, dies, parents, mage):
        self.id, self.born, self.dies, self.parents = pid, born, dies, parents
        self.children = []
        self.spouse = None
        self.mage = mage
        self.married = False
        self.place = None
        self.est = None
        self.childless = False
        self.want = 2
        self.kids = 0
        self.share = False
        self.shareless_since = None
        self.alive = True
        self.mar_year = None
        self.gps = frozenset()


class Model:
    def __init__(self, seed=1, n0=15000, ppp=2.6, rule="L", m_age=28.0, m_sd=3.0,
                 t3=0.12, c0=0.05, phase1=300, birth_cap=60):
        self.rng = random.Random(seed)
        self.people = {}
        self.alive_ids = set()
        self.alive_list = []
        self.next_id = 0
        self.year = 0
        self.rule = rule
        self.m_age, self.m_sd = m_age, m_sd
        self.t3, self.c0 = t3, c0
        self.birth_cap = birth_cap
        self.phase1 = phase1
        self.ppp = ppp
        self.n_places = 0
        self.places_on = False
        self.deaths_by_year = defaultdict(list)
        self.births_by_year = defaultdict(list)
        self.pending = defaultdict(int)
        self.pending_from = defaultdict(list)
        self.pool_shares = 0
        self.free_places = []
        self.wed_unest = {}
        self.stats = defaultdict(list)
        self.recording = False
        self.draw_want = None
        self._seed_population(n0)

    # ---------- people ----------
    def new_person(self, born, parents, life=None):
        rng = self.rng
        pid = self.next_id
        self.next_id += 1
        if life is None:
            life = lifespan(rng)
        p = Person(pid, born, born + life, parents, max(18.0, rng.gauss(self.m_age, self.m_sd)))
        gps = set()
        for par in parents:
            gps.add(par)
            gps.update(self.people[par].parents)
        p.gps = frozenset(gps)
        self.people[pid] = p
        self.alive_ids.add(pid)
        self.deaths_by_year[max(self.year, int(math.floor(p.dies)))].append(pid)
        return p

    def _seed_population(self, n0):
        rng = self.rng
        count = 0
        while count < n0:
            age = rng.uniform(0, 140)
            life = lifespan(rng)
            if life <= age:
                continue
            self.new_person(-age, (), life=life)
            count += 1
        adults = [self.people[i] for i in self.alive_ids]
        adults = [p for p in adults if -p.born >= p.mage]
        rng.shuffle(adults)
        adults.sort(key=lambda p: p.born)
        for a, b in zip(adults[0::2], adults[1::2]):
            self.marry(a, b, start=True)

    def age(self, p):
        return self.year - p.born

    def established(self, p):
        if p.place is not None:
            return True
        if self.rule == "P":
            return False
        if p.spouse is not None:
            s = self.people[p.spouse]
            return s.alive and s.place is not None
        return False

    # ---------- marriage and births ----------
    def marry(self, a, b, start=False):
        rng = self.rng
        a.childless = b.childless = rng.random() < self.c0
        a.want = b.want = self.draw_want(rng) if self.draw_want else (3 if rng.random() < self.t3 else 2)
        a.married = b.married = True
        a.spouse, b.spouse = b.id, a.id
        a.mar_year = b.mar_year = self.year
        if self.places_on and self.rule != "P" and a.place is not None and b.place is not None:
            y = a if a.born > b.born else b           # two holders: the younger hands down
            pl = y.place
            y.place = None
            self.pass_place(pl, y)
        if not self.places_on or self.rule == "P" or self.established(a):
            self.on_household(a, b, start=start)
        elif self.recording:
            self.wed_unest[a.id] = self.year

    def on_household(self, a, b, start=False):
        for p in (a, b) if self.rule != "P" else ():
            if p.est is None:
                p.est = self.year
                if self.recording:
                    self.stats["est_age"].append(self.year - p.born)
                    if p.place is None:
                        self.stats["spouse_join_age"].append(self.year - p.born)
            if p.id in self.wed_unest:
                self.stats["wed_wait"].append(self.year - self.wed_unest.pop(p.id))
        if a.childless:
            return
        if start and (-a.born - a.mage) > 9:
            return
        todo = a.want - a.kids
        first = max(self.year, a.mar_year if a.mar_year is not None else self.year) + 3
        for k in range(max(0, todo)):
            self.births_by_year[int(first + 3 * k)].append((a.id, b.id))

    def birth(self, aid, bid):
        a, b = self.people[aid], self.people[bid]
        if not (a.alive and b.alive) or a.kids >= a.want:
            return
        if self.places_on and self.rule != "P" and not self.established(a):
            return
        if min(self.age(a), self.age(b)) > self.birth_cap:
            return
        c = self.new_person(self.year + self.rng.random(), (aid, bid))
        a.children.append(c.id)
        b.children.append(c.id)
        a.kids += 1
        b.kids += 1
        if self.places_on:
            self.give_newborn_share(c)
        if self.recording:
            self.stats["birth_age"].append(min(self.age(a), self.age(b)))
            if a.kids == 1:
                self.stats["first_birth_age"].append(min(self.age(a), self.age(b)))
            self.stats["births"].append(1)

    # ---------- places ----------
    def descendants(self, roots, depth=6):
        out, frontier, seen = [], list(roots), set(roots)
        for _ in range(depth):
            nxt = []
            for pid in frontier:
                for cid in self.people[pid].children:
                    if cid not in seen:
                        seen.add(cid)
                        nxt.append(cid)
                        out.append(cid)
            frontier = nxt
            if not frontier:
                break
        return out

    def gen_distance(self, anc_id, desc_id, depth=6):
        frontier = {anc_id}
        for d in range(1, depth + 1):
            nxt = set()
            for pid in frontier:
                nxt.update(self.people[pid].children)
            if desc_id in nxt:
                return d
            frontier = nxt
        return None

    def unestablished(self, ids, lo=None, hi=None, exclude=None):
        out = []
        for i in ids:
            p = self.people[i]
            if not p.alive or i == exclude or self.established(p):
                continue
            a = self.age(p)
            if lo is not None and a < lo:
                continue
            if hi is not None and a > hi:
                continue
            out.append(p)
        return out

    def kin_roots(self, p):
        roots = [([p.id], "line")]
        if p.parents:
            roots.append((list(p.parents), "siblings"))
            gps = set()
            for par in p.parents:
                gps.update(self.people[par].parents)
            if gps and self.rule in ("S", "P"):
                roots.append((list(gps), "cousins"))
        return roots

    def pass_place(self, place_id, from_p):
        heir, source = None, None
        if self.rule in ("S", "P"):
            for roots, label in self.kin_roots(from_p):
                c = self.unestablished(self.descendants(roots), exclude=from_p.id)
                if c:
                    heir, source = min(c, key=lambda p: p.born), label
                    break
            lo_ad, hi_ad = 18, None
        else:
            for lo, hi, tag in ((18, 45, ""), (0, 17.999, "-child")):
                for roots, label in self.kin_roots(from_p):
                    c = self.unestablished(self.descendants(roots), lo, hi, exclude=from_p.id)
                    if c:
                        heir, source = min(c, key=lambda p: p.born), label + tag
                        break
                if heir:
                    break
            lo_ad, hi_ad = 18, 55
        if heir is None:
            pool = self.unestablished([p.id for p in self.alive_list], lo_ad, hi_ad)
            if not pool:
                self.free_places.append(place_id)
                return
            heir, source = min(pool, key=lambda p: p.born), "adopted"
        heir.place = place_id
        if self.recording:
            self.stats["heir_age"].append(self.age(heir))
            self.stats["heir_source"].append(source)
            if source.startswith("line"):
                self.stats["heir_gen"].append(self.gen_distance(from_p.id, heir.id))
        sp = self.people[heir.spouse] if heir.spouse is not None else None
        if self.rule != "P" and sp is not None and sp.alive:
            self.on_household(heir, sp)
        elif heir.est is None:
            heir.est = self.year
            if self.recording:
                self.stats["est_age"].append(self.year - heir.born)

    # ---------- shares ----------
    def pass_share(self, p):
        for roots in ([p.id], list(p.parents)):
            if not roots:
                continue
            c = [self.people[i] for i in self.descendants(roots)]
            c = [q for q in c if q.alive and not q.share]
            if c:
                self.take_share(min(c, key=lambda q: q.shareless_since), p)
                return
        if any(self.people[i].alive for i in self.descendants([p.id])):
            key = p.id
        elif p.parents:
            key = p.parents[0]
        else:
            key = None
        if key is None:
            c = [q for q in self.alive_list if q.alive and not q.share]
            if c:
                self.take_share(min(c, key=lambda q: q.shareless_since), None)
            else:
                self.pool_shares += 1
        else:
            self.pending[key] += 1
            self.pending_from[key].append(p.id)

    def take_share(self, q, dead):
        q.share = True
        if self.recording:
            self.stats["share_wait"].append(self.year - q.shareless_since)
            if dead is not None:
                self.stats["share_gen"].append(self.gen_distance(dead.id, q.id) or 0)
        q.shareless_since = None

    def give_newborn_share(self, c):
        frontier, seen = list(c.parents), set(c.parents)
        for _ in range(6):
            for aid in frontier:
                if self.pending.get(aid, 0) > 0:
                    self.pending[aid] -= 1
                    dead_id = self.pending_from[aid].pop(0)
                    c.share = True
                    if self.recording:
                        self.stats["born_with_share"].append(1)
                        self.stats["share_gen"].append(self.gen_distance(dead_id, c.id) or 0)
                    return
            nxt = []
            for aid in frontier:
                for g in self.people[aid].parents:
                    if g not in seen:
                        seen.add(g)
                        nxt.append(g)
            frontier = nxt
            if not frontier:
                break
        if self.pool_shares > 0:
            self.pool_shares -= 1
            c.share = True
            if self.recording:
                self.stats["born_with_share"].append(1)
            return
        c.share = False
        c.shareless_since = self.year
        if self.recording:
            self.stats["born_with_share"].append(0)

    # ---------- the switch ----------
    def switch_on(self):
        self.places_on = True
        alive = [self.people[i] for i in self.alive_ids]
        self.n_places = int(round(len(alive) / self.ppp))
        for p in alive:
            p.share, p.shareless_since = True, None
        if self.rule == "P":
            for k, p in enumerate(sorted(alive, key=lambda p: p.born)[:self.n_places]):
                p.place = k
            for p in alive:
                p.est = self.year if p.place is not None else None
            return
        couples, seen = [], set()
        for p in alive:
            if p.married and p.spouse is not None and p.id not in seen:
                s = self.people[p.spouse]
                if s.alive:
                    seen.update((p.id, s.id))
                    couples.append((max(p.born, s.born), p, s))
        couples.sort(key=lambda t: t[0])                 # oldest younger-partner first
        n = 0
        for _, a, b in couples:
            if n >= self.n_places:
                break
            a.place = n
            n += 1
        for p in sorted([p for p in alive if not self.established(p) and self.age(p) >= 30],
                        key=lambda p: p.born):
            if n >= self.n_places:
                break
            p.place = n
            n += 1
        for p in alive:
            if not self.established(p):
                p.est = None
            else:
                p.est = p.est if p.est is not None else self.year
        # couples with a household who still owe children get them now
        for p in alive:
            if p.place is not None and p.spouse is not None:
                s = self.people[p.spouse]
                if s.alive and p.kids < p.want and not p.childless:
                    for k in range(p.want - p.kids):
                        self.births_by_year[self.year + 1 + 3 * k].append((p.id, s.id))

    def reset_shares(self):
        """Par again: one share per living person, nothing pending."""
        for i in self.alive_ids:
            p = self.people[i]
            p.share, p.shareless_since = True, None
        self.pending.clear()
        self.pending_from.clear()
        self.pool_shares = 0

    # ---------- the year ----------
    def step(self):
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
                sp = self.people[h.spouse] if h.spouse is not None else None
                if sp is not None and sp.alive:
                    self.on_household(h, sp)
                elif h.est is None:
                    h.est = y
        self.year += 1

    def snapshot(self):
        alive = [self.people[i] for i in self.alive_ids]
        n = len(alive)
        out = {"year": self.year, "n": n}
        if self.places_on:
            out["ppp"] = n / self.n_places
            a45 = [p for p in alive if self.age(p) >= 45]
            out["placeless45"] = sum(1 for p in a45 if not self.established(p)) / max(1, len(a45))
            a60 = [p for p in alive if self.age(p) >= 60]
            out["placeless60"] = sum(1 for p in a60 if not self.established(p)) / max(1, len(a60))
            out["adults_placeless"] = sum(1 for p in alive if self.age(p) >= 45 and not self.established(p)) / n
            out["no_household"] = sum(1 for p in alive if not self.established(p)) / n
            out["shareless"] = sum(1 for p in alive if not p.share) / n
            out["shareless_adults"] = sum(1 for p in alive if not p.share and self.age(p) >= 18) / n
            out["held"] = sum(1 for p in alive if p.place is not None) / self.n_places
        return out


def pct(xs, q):
    xs = sorted(xs)
    if not xs:
        return float("nan")
    k = (len(xs) - 1) * q
    f = math.floor(k)
    c = min(len(xs) - 1, f + 1)
    return xs[f] + (xs[c] - xs[f]) * (k - f)


def run(seed=1, rule="L", ppp=2.6, m_age=28.0, m_sd=3.0, t3=0.12, c0=0.05,
        burn=400, measure=300, change_t3=None, after=300, change_extra=None):
    m = Model(seed=seed, rule=rule, ppp=ppp, m_age=m_age, m_sd=m_sd, t3=t3, c0=c0)
    for _ in range(m.phase1):
        m.step()
    m.switch_on()
    for _ in range(burn):
        m.step()
    m.reset_shares()
    for _ in range(200):
        m.step()
    snaps = []
    m.recording = True
    for i in range(measure):
        m.step()
        if i % 10 == 0:
            snaps.append(m.snapshot())
    m.recording = False
    res = {"snaps": snaps, "stats": m.stats, "model": m}
    if change_extra is not None:
        e = change_extra
        def draw_want(rng):
            return 2 + int(e) + (1 if rng.random() < e - int(e) else 0)
        m.draw_want = draw_want
        change_t3 = e   # reuse the code below with the new draw
    if change_t3 is not None:
        m.t3 = change_t3
        done = set()
        for pid in list(m.alive_ids):
            p = m.people[pid]
            if p.married and p.kids == 0 and not p.childless and pid not in done:
                w = m.draw_want(m.rng) if m.draw_want else (3 if m.rng.random() < change_t3 else 2)
                p.want = w
                done.add(pid)
                if p.spouse is not None:
                    m.people[p.spouse].want = w
                    done.add(p.spouse)
        base = statistics.mean(s["n"] for s in snaps[-5:])
        traj = []
        for i in range(after):
            m.step()
            if i % 20 == 19:
                s = m.snapshot()
                traj.append((i + 1, s["n"] / base, s["placeless45"], s["placeless60"]))
        res["traj"] = traj
    return res


def summarize(res, label=""):
    st, snaps, m = res["stats"], res["snaps"], res["model"]
    n = statistics.mean(s["n"] for s in snaps)
    print(f"== {label}")
    print(f"  people {n:.0f} (start {snaps[0]['n']}, end {snaps[-1]['n']}); places {m.n_places};"
          f" people per place {n / m.n_places:.2f}; places held {statistics.mean(s['held'] for s in snaps):.1%}")
    print(f"  mean life {statistics.mean(st['death_age']):.1f}; births a year {len(st['births']) / len(snaps) / 10:.1f}"
          f" vs deaths {len(st['death_age']) / len(snaps) / 10:.1f}")
    ea = st["est_age"]
    print(f"  household at {statistics.mean(ea):.1f} (10-90%: {pct(ea, .1):.0f}-{pct(ea, .9):.0f});"
          f" by 25 {sum(1 for x in ea if x < 25) / len(ea):.0%}, after 35 {sum(1 for x in ea if x > 35) / len(ea):.0%}")
    ha = st["heir_age"]
    print(f"  heirs inherit at {statistics.mean(ha):.1f} (10-90%: {pct(ha, .1):.0f}-{pct(ha, .9):.0f})")
    src = st["heir_source"]
    for k in sorted(set(src)):
        print(f"    heir from {k}: {src.count(k) / len(src):.1%}")
    hg = [g for g in st["heir_gen"] if g]
    print("    line heirs by generations down: " +
          ", ".join(f"{g}: {hg.count(g) / len(hg):.0%}" for g in (1, 2, 3, 4, 5)))
    print(f"  births: younger parent at {statistics.mean(st['birth_age']):.1f}; first child at {statistics.mean(st['first_birth_age']):.1f};"
          f" spouses join at {statistics.mean(st['spouse_join_age']) if st['spouse_join_age'] else float('nan'):.1f}")
    adult_heirs = [x for x in ha if x >= 18]
    print(f"  adult heirs inherit at {statistics.mean(adult_heirs):.1f} (10-90%: {pct(adult_heirs, .1):.0f}-{pct(adult_heirs, .9):.0f}); child heirs {1 - len(adult_heirs) / len(ha):.0%}")
    print(f"  no household at 45+: {statistics.mean(s['placeless45'] for s in snaps):.2%}; at 60+:"
          f" {statistics.mean(s['placeless60'] for s in snaps):.2%}; all ages {statistics.mean(s['no_household'] for s in snaps):.1%}")
    bws = st["born_with_share"]
    sw = st["share_wait"]
    print(f"  born shareless {1 - sum(bws) / len(bws):.0%}; wait {statistics.mean(sw):.1f} yr (90%: {pct(sw, .9):.0f});"
          f" shareless {statistics.mean(s['shareless'] for s in snaps):.1%} (adults {statistics.mean(s['shareless_adults'] for s in snaps):.2%})")
    sg = st["share_gen"]
    print("    shares by generations up: " + ", ".join(f"{g}: {sg.count(g) / len(sg):.0%}" for g in (2, 3, 4, 5))
          + f", other lines {sg.count(0) / len(sg):.0%}")
    ew = st["est_at_wedding"] or [0]
    print(f"  weddings at {statistics.mean(st['wedding_age']):.1f}; with a household already {sum(ew) / len(ew):.0%}")
    if st["wed_wait"]:
        w = list(st["wed_wait"])
        open_ = [m.year - y0 for y0 in m.wed_unest.values()]
        allw = w + [x for x in open_ if x >= 5]
        print(f"    waited: mean {statistics.mean(w):.1f}, median {pct(w, .5):.1f}; at 5 yr still"
              f" {sum(1 for x in allw if x >= 5) / len(allw):.0%}, at 10 {sum(1 for x in allw if x >= 10) / len(allw):.0%};"
              f" capped at 5 {statistics.mean(min(x, 5) for x in allw):.2f} yr; unresolved {len(open_)}")
    if "traj" in res:
        print("  after the change: years, people vs before, no household at 45+, at 60+")
        for t, r, p45, p60 in res["traj"]:
            print(f"    {t:4d} {r:.3f} {p45:.1%} {p60:.1%}")


if __name__ == "__main__":
    which = sys.argv[1]
    rule = sys.argv[2]
    seed = int(sys.argv[3]) if len(sys.argv) > 3 else 1
    ppp = float(sys.argv[4]) if len(sys.argv) > 4 else 2.6
    if which == "base":
        summarize(run(seed=seed, rule=rule, ppp=ppp), f"rule {rule}, base, ppp {ppp}")
    elif which == "open":
        summarize(run(seed=seed, rule=rule, ppp=ppp, m_age=25.0, m_sd=2.0), f"rule {rule}, marriage ~25, ppp {ppp}")
    elif which.startswith("e"):
        e = float(which[1:])
        summarize(run(seed=seed, rule=rule, ppp=ppp, change_extra=e, measure=100, after=400),
                  f"rule {rule}, {0.95 * (2 + e):.2f} children a couple")
    elif which.startswith("t"):
        t = float(which[1:]) / 100
        summarize(run(seed=seed, rule=rule, ppp=ppp, change_t3=t, measure=100), f"rule {rule}, thirds to {t:.0%}")
