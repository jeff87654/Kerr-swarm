"""Born to a place: the leak, the door and the line outside.

A small model behind people.md's and families.md's figures for a drum whose
births are held by the allowance (two by right, a third by leave) once the wish
for children is saturated. Three parts, all in units of a drum's replacement
births (the births that would exactly refill its households):

1. The ledger. A share c of couples is childless and a few die before 35, so
   two children a household leave ROOM for about one more child in every
   eighteen births. Room is spent on leave for third children or on placing
   people born outside any allowance (the placeless-born). Given the LEAK (the
   placeless-born as a share of replacement births) and the DOOR (the share of
   them who are placed in time), the ledger gives the thirds left to give, how
   far the drum sits over par, and how many of its people are placeless-born.

2. Whether defiance pays. A household that has a child outside its allowance
   leaves two householders, plus one more if that child is placed; a household
   that waits leaves two plus its chance of a third by leave. Defiance is a
   threshold trait passed on with regression b, so its spread follows the
   breeder's equation: it grows when the door is wider than the draw's odds and
   shrinks to its accidents when it is narrower.

3. The line outside. The placeless-born have no place to lose. Most keep the
   rule of the houses and lent flats (no children); a few have children anyway,
   and those children are placeless-born too. Only the couples who have children
   are the next generation's parents, so the habit is selected hard. While the
   placeless-born pair at random among themselves, each generation's fresh
   leak dilutes it; where a line keeps to itself, nothing does. The model
   follows the line's share of births generation by generation, by how far it
   keeps apart, and with the fitting kept for the placeless-born.

Pure Python; a second or two. python3 placing.py > out/placing.txt
"""
import math

GEN = 33            # years a generation
C_CHILDLESS = 0.05  # couples with no children (canon: one in twenty)
S35 = 0.993         # survival to 35 (people.md)


def phi(z):
    return math.exp(-0.5 * z * z) / math.sqrt(2 * math.pi)


def Phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def inv_Phi(p):
    lo, hi = -8.0, 8.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if Phi(mid) < p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


BIRTHS = 2 / S35    # births a couple at replacement, so that two reach 35


def room(c=C_CHILDLESS):
    """Household slots that two children a fertile couple leave unfilled, per replacement birth."""
    return 1 - (1 - c) * S35


def per_family(per_birth, c=C_CHILDLESS):
    """Turn a rate per replacement birth into a rate per fertile family."""
    return per_birth * BIRTHS / (1 - c)


# ---------------------------------------------------------------- 1. the ledger
def ledger(leak, door, c=C_CHILDLESS):
    """leak: placeless-born per replacement birth; door: share of them placed in time."""
    v = room(c)
    placings = min(door * leak, v)
    thirds = v - placings                       # children born by leave, per replacement birth
    families = per_family(thirds, c)            # share of fertile families given a third
    unplaced = leak - placings                  # extra lifetimes the drum carries
    return {
        "placings": placings,
        "thirds": thirds,
        "families_with_third": families,
        "over_par": unplaced,
        "estate": unplaced / (1 + unplaced),
    }


def print_ledger():
    print("1. THE LEDGER: thirds left to give, and the placeless-born a drum carries, by leak and door")
    print("   room = %.1f%% of replacement births (one family in %.1f given a third if none is spent on placing)"
          % (100 * room(), 1 / per_family(room())))
    print("   leak  door   placed   thirds: one family in   over par   placeless-born (of people)")
    for leak in (0.01, 0.02, 0.03, 0.05, 0.08):
        for door in (0.0, 0.1, 0.5, 1.0):
            r = ledger(leak, door)
            fam = r["families_with_third"]
            print("   %3.0f%%  %4.0f%%   %5.2f%%   %s   %6.1f%%   %6.1f%%" % (
                100 * leak, 100 * door, 100 * r["placings"],
                ("%8.1f" % (1 / fam)) if fam > 1e-9 else "    none",
                100 * r["over_par"], 100 * r["estate"]))
    print("   Room by how many couples are childless (leak 3%, one in ten placed):")
    print("   childless   room    thirds: one family in   a household's odds of leave")
    for c in (0.08, 0.05, 0.03, 0.02, 0.01):
        r = ledger(0.03, 0.1, c)
        print("   1 in %-4.0f   %4.1f%%   %8.1f                 %4.1f%%" % (
            1 / c, 100 * room(c), 1 / r["families_with_third"], 100 * r["families_with_third"]))
    print()


# ------------------------------------------------------ 2. whether defiance pays
def defiance(door, b, heritable0=0.02, accidents=0.01, shut_out=True, gens=400, c=C_CHILDLESS,
             odds=None):
    """Households defy (a child outside the allowance) when a latent trait passes a threshold.

    heritable0: share of households over the threshold at the start; accidents: a share
    that isn't passed on. A defiant household is shut out of the draw (shut_out) and leaves
    2 + (chance its child is placed) householders; a household that waits leaves
    2 + (its chance of a third by leave). odds: a fixed chance of leave for this kind of
    household, in place of an even draw (0 for a household that can't pay where leave is
    sold). Returns the heritable share by generation.
    """
    z0 = inv_Phi(1 - heritable0)     # threshold in sd, mean starts at 0
    mu = 0.0
    out = []
    for g in range(gens + 1):
        q = 1 - Phi(z0 - mu)                         # households defying by habit
        leak = (q + accidents) * (1 - c) / BIRTHS    # one child each, per replacement birth
        v = room(c)
        placings = min(door * leak, v)
        p_placed = placings / leak if leak > 0 else 0.0
        thirds = v - placings
        waiting = max(1e-9, 1 - q - accidents) if shut_out else 1.0
        p_third = min(1.0, per_family(thirds, c) / waiting)   # a waiting household's chance of leave
        if odds is not None:
            p_third = odds
        w_defy = 2 + p_placed + (0 if shut_out else p_third)
        w_wait = 2 + p_third
        wbar = q * w_defy + (1 - q) * w_wait
        out.append((g, q, leak, p_placed, p_third, w_defy - w_wait))
        S = phi(z0 - mu) * (w_defy - w_wait) / wbar  # selection differential on the trait, in sd
        mu += b * S
    return out


def first_gen(rows, test):
    for g, q, leak, pp, pt, adv in rows:
        if test(q, leak, pp, pt):
            return g
    return None


def print_defiance():
    print("2. WHETHER DEFIANCE PAYS: a household's gain in householders left, by the door")
    print("   (2% of households defy by habit and 1% by accident at the start; defiant households are out of the draw)")
    print("   door    gain at start   b     habit after 30 / 100 / 300 generations   leak doubles / halves in")
    for door in (0.0, 0.1, 0.25, 0.5, 1.0):
        for b in (0.2, 0.35, 0.5):
            rows = defiance(door, b)
            adv0 = rows[0][5]
            q30, q100, q300 = rows[30][1], rows[100][1], rows[300][1]
            leak0 = rows[0][2]
            up = first_gen(rows, lambda q, leak, pp, pt: leak >= 2 * leak0)
            dn = first_gen(rows, lambda q, leak, pp, pt: q <= 0.01)
            when = ("doubles in %d gen (~%d yr)" % (up, up * GEN)) if up else (
                ("habit halves in %d gen (~%d yr)" % (dn, dn * GEN)) if dn else "neither in 400 gen")
            print("   %4.0f%%   %+6.2f         %.2f   %5.2f%% / %5.2f%% / %5.2f%%                  %s" % (
                100 * door, adv0, b, 100 * q30, 100 * q100, 100 * q300, when))
    print("   The door at which defiance neither pays nor costs is the draw's own odds: %.0f%% a household."
          % (100 * defiance(0.0, 0.35, gens=0)[0][4]))
    print("   What the forfeit does (b = 0.35): gain at start, and the habit after 100 / 300 generations")
    for name, kw in (("out of the draw, no door", dict(door=0.0)),
                     ("keeps its draw, no door", dict(door=0.0, shut_out=False)),
                     ("keeps its draw, one in ten placed", dict(door=0.1, shut_out=False)),
                     ("leave is sold and the household can't pay, one in ten placed", dict(door=0.1, odds=0.0)),
                     ("leave is sold and the household can't pay, one in four placed", dict(door=0.25, odds=0.0))):
        rows = defiance(b=0.35, **kw)
        print("   %-62s %+5.2f   %5.2f%% / %5.2f%%" % (name, rows[0][5], 100 * rows[100][1], 100 * rows[300][1]))
    print("   Where the habit is common, the few who wait have the room to themselves:")
    for q0 in (0.8, 0.5, 0.2, 0.05):
        r = defiance(0.0, 0.35, heritable0=q0, gens=0)[0]
        print("   %2.0f%% of households with a child outside: a waiting household's chance of leave is %2.0f%%, and waiting gains %+.2f"
              % (100 * q0, 100 * r[4], -r[5]))
    print("   Years for the habit to fall from four households in five to one in five / one in twenty / one in thirty:")
    print("   door    b = 0.20                    b = 0.35                    b = 0.50")
    for door in (0.0, 0.05, 0.10):
        cells = []
        for b in (0.2, 0.35, 0.5):
            rows = defiance(door, b, heritable0=0.8, gens=6000)
            ts = [first_gen(rows, lambda q, leak, pp, pt, lvl=lvl: q <= lvl) for lvl in (0.2, 0.05, 1 / 30)]
            cells.append(" / ".join(("%6d" % (t * GEN)) if t is not None else "     -" for t in ts))
        print("   %4.0f%%   %s      %s      %s" % (100 * door, cells[0], cells[1], cells[2]))
    rows = defiance(1.0, 0.35, gens=400)
    g0 = first_gen(rows, lambda q, leak, pp, pt: pt <= 1e-9)
    if g0:
        print("   With every placeless-born child placed (b = 0.35), placings take all the room, and no third is given by leave, after %d generations (~%d yr)."
              % (g0, g0 * GEN))
    print()


# ------------------------------------------------------- 3. the line outside
def line_outside(inflow=0.03, have0=0.04, kids=3, b=0.35, door=0.1, apart=0.0,
                 fitted=False, gens=120):
    """Births to the placeless-born, as a share of replacement births, by generation.

    inflow: placeless-born children of households each generation (the leak).
    have0: share of placeless-born couples who have children anyway at the start; the
        rest keep the rule of the houses and lent flats. A threshold trait, passed on
        with regression b.
    kids: children such a couple has (nothing holds them to two).
    door: share of each cohort placed, whose children are then born to a place.
    apart: share of those born to placeless-born parents who pair among themselves
        (a quarter, a creed, a people apart); the rest pair at random in the estate.
    fitted: the drum fits its placeless-born until they are placed (no births outside).

    Each generation's estate is this generation's leak (trait mean 0, the population's)
    plus the children of last generation's estate. Only couples who had children are
    the next generation's parents, so the habit is selected hard; in the mixed pool the
    fresh leak dilutes it every generation, and among those who keep apart nothing does.
    """
    z0 = inv_Phi(1 - have0)
    line, mu_line = 0.0, 0.0       # children of the placeless-born, per replacement birth
    out = []
    for g in range(gens + 1):
        first = inflow * (1 - door)
        deep = line * (1 - door)
        own = apart * deep                         # pair within the line
        mixed = first + (1 - apart) * deep         # pair at random in the estate
        mu_mixed = (1 - apart) * deep * mu_line / mixed if mixed > 0 else 0.0
        if fitted:
            q_own = q_mixed = 0.0
        else:
            q_own = 1 - Phi(z0 - mu_line)
            q_mixed = 1 - Phi(z0 - mu_mixed)
        births_own = own * q_own * kids / 2
        births_mixed = mixed * q_mixed * kids / 2
        births = births_own + births_mixed
        estate = first + deep
        q_all = (own * q_own + mixed * q_mixed) / estate if estate > 0 else 0.0
        out.append((g, births, estate, q_all, deep / estate if estate else 0.0, q_own))
        if births > 0:
            # breeder's equation in each pool: children's mean = pool mean + b x selection differential
            m_own = mu_line + b * phi(z0 - mu_line) / q_own if births_own > 0 else 0.0
            m_mixed = mu_mixed + b * phi(z0 - mu_mixed) / q_mixed
            mu_line = (births_own * m_own + births_mixed * m_mixed) / births
        line = births
        if line > 5:                                # far past anything a drum would carry
            break
    return out


def line_by_depth(inflow=0.03, have0=0.04, kids=3, b=0.35, door=0.1, gens=120, cap=400):
    """The strictest case of keeping apart: old lines marry old lines.

    Children of the placeless-born pair only with others whose line has been outside as
    many generations as theirs, so nothing dilutes the habit. Depth 0 is the leak itself
    (trait mean 0); each depth's children form the next depth, with the mean moved by
    the breeder's equation. An upper bound on how fast a line outside can take off.
    Returns births to the placeless-born, per replacement birth, by generation.
    """
    z0 = inv_Phi(1 - have0)
    pools = {}                     # depth -> (size at birth, trait mean)
    out = []
    for g in range(gens + 1):
        new = {}
        births = 0.0
        cohort = dict(pools)
        cohort[0] = (inflow, 0.0)
        for d, (size, mu) in cohort.items():
            adults = size * (1 - door)
            q = 1 - Phi(z0 - mu)
            kidsborn = adults * q * kids / 2
            if kidsborn <= 0:
                continue
            m = mu + b * phi(z0 - mu) / q
            dd = min(d + 1, cap)
            if dd in new:
                s0, m0 = new[dd]
                new[dd] = (s0 + kidsborn, (s0 * m0 + kidsborn * m) / (s0 + kidsborn))
            else:
                new[dd] = (kidsborn, m)
            births += kidsborn
        out.append((g, births))
        pools = new
        if births > 5:
            break
    return out


def print_line():
    print("3. THE LINE OUTSIDE: births to the placeless-born, as a share of a drum's replacement births")
    print("   (leak 3% a generation; one in ten placed; one placeless-born couple in 25 has children at first, three each; b = 0.35; unless shown)")
    print("   %-58s after 3 / 6 / 10 / 15 / 20 generations         reaches 1%% / 3%% / 10%% of births in" % "case")
    cases = [
        ("pairing at random among the placeless-born", dict()),
        ("  the same, one couple in 10 at first", dict(have0=0.10)),
        ("  the same, b = 0.8", dict(b=0.8)),
        ("half of the line pairs within it", dict(apart=0.5)),
        ("  the same, b = 0.5", dict(apart=0.5, b=0.5)),
        ("  the same, b = 0.8", dict(apart=0.5, b=0.8)),
        ("the line keeps to itself", dict(apart=1.0)),
        ("  the same, b = 0.2", dict(apart=1.0, b=0.2)),
        ("  the same, b = 0.5", dict(apart=1.0, b=0.5)),
        ("  the same, b = 0.8", dict(apart=1.0, b=0.8)),
        ("  the same, couples outside have two", dict(apart=1.0, kids=2)),
        ("  the same, couples outside have four", dict(apart=1.0, kids=4)),
        ("  the same, half placed", dict(apart=1.0, door=0.5)),
        ("  the same, leak 1%", dict(apart=1.0, inflow=0.01)),
        ("fitted until placed", dict(fitted=True)),
    ]
    def yr(g):
        return "never" if g is None else "%d gen (~%d yr)" % (g, g * GEN)
    def at(rows, g):
        return rows[g][1] if g < len(rows) else float("inf")
    for name, kw in cases:
        rows = line_outside(**kw)
        vals = [at(rows, g) for g in (3, 6, 10, 15, 20)]
        ts = [next((g for g, bth, est, q, sh, qo in rows if bth >= x), None) for x in (0.01, 0.03, 0.10)]
        print("   %-58s %s    %s" % (
            name, " / ".join(("%6.2f%%" % (100 * v)) if v < 5 else "  >500%" for v in vals),
            " / ".join(yr(t) for t in ts)))
    for bb in (0.2, 0.35, 0.5, 0.8):
        rows = line_by_depth(b=bb)
        vals = [at(rows, g) for g in (3, 6, 10, 15, 20)]
        ts = [next((g for g, bth in rows if bth >= x), None) for x in (0.01, 0.03, 0.10)]
        print("   %-58s %s    %s" % (
            "old lines marry old lines, b = %.2f" % bb,
            " / ".join(("%6.2f%%" % (100 * v)) if v < 5 else "  >500%" for v in vals),
            " / ".join(yr(t) for t in ts)))
    for kw, name in ((dict(kids=2), "old lines marry old lines, two children"),
                     (dict(door=0.5), "old lines marry old lines, half placed"),
                     (dict(have0=0.10), "old lines marry old lines, one couple in 10 at first")):
        rows = line_by_depth(**kw)
        vals = [at(rows, g) for g in (3, 6, 10, 15, 20)]
        ts = [next((g for g, bth in rows if bth >= x), None) for x in (0.01, 0.03, 0.10)]
        print("   %-58s %s    %s" % (
            name, " / ".join(("%6.2f%%" % (100 * v)) if v < 5 else "  >500%" for v in vals),
            " / ".join(yr(t) for t in ts)))
    rows = line_outside(apart=1.0)
    print("   A line that keeps to itself (b = 0.35), share of its couples having children: "
          + ", ".join("gen %d: %.0f%%" % (g, 100 * rows[g][5]) for g in (1, 2, 3, 4, 5, 6, 8, 10) if g < len(rows)))
    print("   The line outgrows the leak once (share having children) x (children / 2) x (1 - door) passes 1:")
    print("   at three children and one in ten placed, once three couples in four have them.")
    print()


if __name__ == "__main__":
    print(__doc__.split("\n")[0])
    print()
    print_ledger()
    print_defiance()
    print_line()
