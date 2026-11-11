"""How many people a drum carries outside its places, under each way of holding them.

The model behind families.md § The fitting and § Drums that chose otherwise, people.md
§ Counted drums and third-chair.md. placing.py took the leak (births outside the
allowance) and the door (the share of them placed) as given. This asks what they
settle at, and what the placeless-born's own children do, in a Shade old enough for
selection to have finished.

1. Free entry. A drum that places a fixed NUMBER a year (adoptions by the heirless,
   crew berths) has a door whose odds are placings / births outside. Households keep
   having children outside until those odds fall to what a household forfeits, so the
   leak is placings / forfeited odds, and a wider door makes more placeless, not fewer.
2. The line outside with gene flow. The placeless-born's unwillingness to have
   children without a place is selected against among them, and everyone placed
   carries what was selected back into the main population.
3. The wall. With no rule and a commons per head, an unrestricted class grows to the
   drum's physical limit, which is hull heat, not beam.
4. Budget-bound. If the shareless must pay for the commons they use, their numbers
   are what the placed pass to them divided by what one costs.
5. The fitting. Everyone fitted at fourteen, two children by right with a place, a
   third by leave, and the door set as odds below what a household forfeits.
6. A shareless life where a keep is charged: what it costs a household, and old age.
7. Twins. With one embryo a pregnancy only identical twins are left, which no family
   inherits. Where children are conceived the old way, fraternal twinning is heritable
   through mothers, and a twin at a second birth is a third nobody licensed.

Pure Python; about a minute. python3 placeless_share.py > out/placeless_share.txt
"""
import math

GEN = 33
C = 0.05                      # couples childless (people.md)
S35 = 0.993                   # survival to 35
BIRTHS = 2 / S35              # births a couple at replacement
ROOM = 1 - (1 - C) * S35      # slots two children a fertile couple leave unfilled, per replacement birth
KAPPA = BIRTHS / (1 - C)      # replacement births per fertile household
LEAVE = ROOM * KAPPA          # a household's lifetime chance of a third by leave, no placings: ~12%

SHARES = 200e6                # a nation drum
LIFE = 120.0
DRUM_BIRTHS = SHARES / LIFE   # ~1.67 M a year
DIV = 0.9                     # kW a share: the wallet
COMMONS = 1.1                 # kW a head
BEAM_GW = 2.0 * SHARES / 1e6          # 400
HEAT_GW = 0.80 * SHARES / 1e6         # 160: the hull's radiators, full at par (raft-habitat.md)
DIV_GW = DIV * SHARES / 1e6           # 180
POT_GW = BEAM_GW - DIV_GW             # 220: the commons with the dividend held
C_HULL = 0.57    # the commons' in-hull load a head (daily-life.md: food .23, services .12, light .10, repair .04, fans .04, cryo .02, lifts .02)
W_HULL = 0.23    # a wallet's in-hull load a share (food beyond the credit .10, appliances .05, devices .04, home light .02, mending .02)
S_HULL = 0.40    # a survival hull load a head (estimate: Mill table .23, light .05, services .05, repair .03, fans .03, lifts .01)
S_ALL = 0.50     # the survival floor, kWe (people.md)
HOUR = 3.1       # kWh an hour (economy.md, planning case)
PPP = 2.22       # people a place
HOME_M2, PLACE_M2 = 35.0, 78.0
MZ = 1 / 250.0   # identical twins, of pregnancies (3-4 per 1,000 births; Hall and Lopez-Rangel 1996)
TWINS = 0.5 * MZ # twins at a second birth, per replacement birth: a third the drum charges to its room

# mortality as in stem_places.py, for age shares
LAMBDA, GOMP_B, GOMP_MODE = 2.0e-4, 0.10, 127.0
GOMP_A = GOMP_B * math.exp(-GOMP_B * GOMP_MODE)
AGES = [a + 0.5 for a in range(160)]


def surv(a):
    return math.exp(-LAMBDA * a - (GOMP_A / GOMP_B) * (math.exp(GOMP_B * a) - 1))


TOTAL = sum(surv(a) for a in AGES)


def share_over(age):
    return sum(surv(a) for a in AGES if a >= age) / TOTAL


def pdf(z):
    return math.exp(-0.5 * z * z) / math.sqrt(2 * math.pi)


def Phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))


def inv(p):
    lo, hi = -9.0, 9.0
    for _ in range(90):
        mid = (lo + hi) / 2
        if Phi(mid) < p:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def run(alpha, forfeit=1.0, acc=0.003, b=0.35, q0=0.06, fitted=False, phi0=0.04, k=3.0,
        gens=40000, flow=True, stop_over=0.10, door_odds=None):
    """A drum by generations, per replacement birth.

    alpha: share of room spent on placings, a fixed number a generation (or door_odds: the
    share of those born outside who are placed, fixed as odds). forfeit: share of
    a household's chance of leave lost by a child outside (1 = all leave, 0.5 = the drawn
    half only). acc: accidental births outside. Households have a child outside when a
    latent habit passes a threshold (q0 of them at the start), and the habit follows the
    breeder's equation on the gain in householders: the door's odds less the leave
    forfeited. The placeless-born have children when a second latent trait passes a
    threshold (phi0 of couples at the start, k children each); only those couples are the
    next generation's parents among them; fresh entrants come at the main population's
    mean; flow: the placed carry the pool's mean into the main population.
    Returns rows (gen, households outside, births outside, door, leave, gain, over par,
    placeless couples with children, the line's share of births outside).
    """
    A = alpha * ROOM
    zq, muq = inv(1 - q0), 0.0
    zb, muB, muP = inv(1 - phi0), 0.0, 0.0
    P = 0.0
    rows = []
    for g in range(gens + 1):
        q = 1 - Phi(zq - muq)
        hh = q / KAPPA
        phiP = 0.0 if fitted else 1 - Phi(zb - muP)
        line = phiP * k / 2 * P
        T = hh + acc + line
        if door_odds is not None:
            d = min(door_odds, ROOM / T) if T > 0 else 0.0
        else:
            d = min(1.0, A / T) if T > 0 else 0.0
        placings = d * T
        waiting = max(1e-9, 1 - q - acc * KAPPA)
        leave = min(1.0, max(0.0, ROOM - placings) * KAPPA / waiting)
        gain = d - forfeit * leave
        over = (1 - d) * T
        rows.append((g, q, T, d, leave, gain, over, phiP, line / T if T > 0 else 0.0))
        if stop_over is not None and over >= stop_over:
            break
        muq = max(-6.0, min(6.0, muq + b * pdf(zq - muq) * gain / (2 + leave)))
        if not fitted:
            sel = pdf(zb - muP) / max(1e-12, phiP)        # the breeders' mean above the pool's
            fresh = hh + acc
            mu_pool = (fresh * muB + line * (muP + b * sel)) / (fresh + line) if fresh + line > 0 else muB
            if flow:
                muB += placings * (mu_pool - muB)
            muP = mu_pool
        P = (1 - d) * T
    return rows


def first(rows, test):
    for r in rows:
        if test(r):
            return r[0] * GEN
    return None


def yrs(t):
    return ("%7d" % t) if t is not None else "  never"


def big(t):
    if t is None:
        return "never"
    return "%.1f Myr" % (t / 1e6) if t >= 1e6 else "%d" % t


# ------------------------------------------------------------------ 1. free entry
def print_free_entry():
    print("1. FREE ENTRY: a fixed number placed a year, and no children born to the placeless-born")
    print("   A household's chance of leave with no placings: %.1f%%. Closed form: the door settles at the leave forfeited," % (100 * LEAVE))
    print("   and births outside at placings / door; with all leave forfeit that is (share of room placed) / %.2f." % KAPPA)
    print("   placed a year   forfeit      births outside   door    unplaced per placing   placeless, of the drum   years to settle")
    for forfeit, name in ((1.0, "all leave"), (0.5, "the draw only")):
        for n in (0, 1000, 2500, 5000, 10000):
            alpha = n / (ROOM * DRUM_BIRTHS)
            rows = run(alpha, forfeit=forfeit, fitted=True, gens=60000, stop_over=None)
            g, q, T, d, leave, gain, over, *_ = rows[-1]
            t = first(rows, lambda r: abs(r[2] - T) < 0.1 * T)
            per = ("%4.1f" % ((1 - d) / d)) if d > 0 else "   -"
            print("   %6d          %-13s  %5.2f%%          %4.1f%%   %s                   %5.2f%% (%4.1f M)          %s"
                  % (n, name, 100 * T, 100 * d, per, 100 * over / (1 + over), over * SHARES / 1e6, yrs(t)))
    print("   (accidents 0.3% of births; the habit starts at 6% of households; b = 0.35)")
    print()


# ------------------------------------------------------------------ 2. the line outside
def print_line():
    print("2. THE LINE OUTSIDE, with 5,000 placed a year and all leave forfeit")
    print("   One placeless-born couple in 25 has children at the start, three each (placing.py's start).")
    print("   b      the placed carry the trait back   years until 1 couple in 4 / half / the drum 10% over par")
    alpha = 5000 / (ROOM * DRUM_BIRTHS)
    for b in (0.2, 0.35, 0.5):
        for flow in (True, False):
            rows = run(alpha, b=b, flow=flow, gens=30000 if not flow else 12000)
            print("   %.2f   %-31s   %s / %s / %s" % (
                b, "yes" if flow else "no (placing.py)",
                yrs(first(rows, lambda r: r[7] >= 0.25)), yrs(first(rows, lambda r: r[7] >= 0.5)),
                yrs(first(rows, lambda r: r[6] >= 0.10))))
    print("   Once most placeless-born couples are willing, years to 10% over par, by children a couple and the number placed:")
    print("   willing at the start   children   door shut   1,000 placed   5,000 placed")
    for phi0 in (0.95, 0.5):
        for k in (1.0, 2.0, 3.0):
            cells = []
            for n in (0, 1000, 5000):
                rows = run(n / (ROOM * DRUM_BIRTHS), phi0=phi0, k=k, gens=30000)
                t = first(rows, lambda r: r[6] >= 0.10)
                cells.append(yrs(t) if t is not None else "holds at %.2f%%" % (100 * rows[-1][6]))
            print("   %3.0f%%                   %.0f          %s   %s   %s" % (100 * phi0, k, cells[0], cells[1], cells[2]))
    print("   At one child a couple the line can't replace itself, and its children crowd households' out of a pool the door pins.")
    print()


# ------------------------------------------------------------------ 3. the wall
def print_wall():
    print("3. THE WALL: no rule, and a commons per head")
    print("   A drum of 200 M shares: beam %d GW, hull radiators %d GW (full at par), commons %d GW with the dividend held at 0.9 kW." % (BEAM_GW, HEAT_GW, POT_GW))
    print("   Hull heat fits %.0f M at the 2 kW life's 0.80 kW, %.0f M at the lean life's 0.60 and %.0f M at a survival load of %.2f;"
          % (HEAT_GW / 0.8, HEAT_GW / 0.6, HEAT_GW / S_HULL, S_HULL))
    print("   the beam fits %.0f M on the lean 0.96 kWe and %.0f M on 0.5 kWe. Heat is the first wall." % (BEAM_GW / 0.96, BEAM_GW / 0.5))
    print("   placeless   of the drum   x par   commons, kW a head   the placed's private hull heat   the commons' hull load, kW a head")
    for P in (5, 20, 40, 81, 120, 200, 250):
        tot = 200 + P
        priv = (HEAT_GW - C_HULL * tot) / 200
        ch = C_HULL
        if priv < 0:
            priv, ch = 0.0, HEAT_GW / tot
        note = "" if ch >= S_HULL - 1e-9 else "   below the survival load"
        print("   %5.0f M      %4.1f%%        %.2f    %.2f                 %3.0f%% of par's 0.23 kW              %.2f%s"
              % (P, 100 * P / tot, tot / 200, POT_GW / tot, 100 * priv / W_HULL, ch, note))
    print("   Years from 4.4 M, once placeless-born couples have children as readily as anyone:")
    print("   children a couple   growth a year   10% over par   private hull heat gone (81 M)   the wall (200 M)")
    for k, G in ((3, 33), (4, 33), (6, 28)):
        r = math.log(k / 2) / G
        print("   %d                   %.2f%%           %4.0f           %4.0f                            %4.0f"
              % (k, 100 * r, math.log(20 / 4.4) / r, math.log(81 / 4.4) / r, math.log(200 / 4.4) / r))
    print("   At the wall the 55-day air reserve is %.0f days and the 90-day larder %.0f." % (55 * 200 / 400, 90 * 200 / 400))
    print()


# ------------------------------------------------------------------ 4. budget-bound
def kw(wage, hours):
    return wage * hours / 8766


def print_bound():
    print("4. BUDGET-BOUND: the shareless pay for the commons they use, from 18 to 120, and for a child's to 18")
    print("   tier                 own life, kW-yr   plus 1.13 children's   wage to pay for one's own life / for replacement, kWh an hour at 2,000 h and at 3,000 h")
    for name, k in (("the full commons", 1.10), ("the lean life", 0.96), ("the survival floor", 0.50)):
        own, kids = 102 * k, 1.13 * 18 * k
        w = [x * 8766 / (67 * h) for h in (2000, 3000) for x in (own, own + kids)]
        print("   %-18s   %6.1f            %6.1f                 %.1f / %.1f   and   %.1f / %.1f" % (name, own, own + kids, w[0], w[1], w[2], w[3]))
    print("   The hour is %.1f kWh in the planning case and 6.2 in Chervil (economy.md, open-drums.md)." % HOUR)
    print("   Children a couple can pay for at the survival floor: at %.1f kWh and 2,000 h, %.1f; at 3,000 h, %.1f."
          % (HOUR, (2 * 67 * kw(HOUR, 2000) - 204 * S_ALL) / (18 * S_ALL), (2 * 67 * kw(HOUR, 3000) - 204 * S_ALL) / (18 * S_ALL)))
    n = (2 * 67 * kw(HOUR, 3000) - 204 * S_ALL) / (18 * S_ALL)
    print("   So the class grows %.1f%% a year until its own hours bring the hour down to the replacement wage, ~2.7 kWh." % (100 * math.log(n / 2) / GEN))
    print("   Where it settles: what the placed pass to them / %.1f kW each (%.2f kW of it hull heat)" % (S_ALL, S_HULL))
    for tau in (0.10, 0.25, 0.40):
        for sigma in (0.5, 1.0):
            P = sigma * tau * DIV_GW / S_ALL
            print("     %2.0f%% of wallets spent on time, %3.0f%% of it to the shareless: %5.1f M (%4.1f%% of the drum), %3.0f%% of the placed's private hull heat"
                  % (100 * tau, 100 * sigma, P, 100 * P / (200 + P), 100 * P * S_HULL / (W_HULL * 200)))
    cap = W_HULL * 200 / S_HULL
    print("   Hull heat caps it at %.0f M (%.1f%% of the drum, %.2fx par), when the placed have given up all their private hull heat;" % (cap, 100 * cap / (200 + cap), (200 + cap) / 200))
    print("   one wallet keeps %.1f people at the survival floor." % (DIV / S_ALL))
    print("   placeless   of the drum   hours of service a placed adult buys a year (workers at 3,000 h)   private hull heat the placed keep")
    for P in (45, 90, 115):
        print("   %5.0f M      %4.1f%%        %5.0f                                                               %3.0f%%"
              % (P, 100 * P / (200 + P), P * (share_over(18) - share_over(85)) * 3000 / (200 * share_over(18)), 100 * (1 - P * S_HULL / (W_HULL * 200))))
    print()


# ------------------------------------------------------------------ 5. the fitting
def fitted(leak, door):
    carried = (1 - door) * leak
    placings = door * leak
    thirds = ROOM - placings - TWINS       # thirds by leave: named or drawn
    return {
        "born": leak * DRUM_BIRTHS, "placed": placings * DRUM_BIRTHS, "carried": carried * SHARES,
        "share": carried / (1 + carried), "over": carried, "thirds": (thirds + TWINS) * KAPPA,
        "leave": thirds * KAPPA, "gain": door - thirds * KAPPA,
    }


def print_fitting():
    door = LEAVE / 2
    print("5. THE FITTING: everyone fitted at fourteen; two by right with a place, a third by leave; no child born to anyone without a licence")
    print("   A household's chance of leave: %.1f%% (one in %.1f). A household with a child outside forfeits all of it." % (100 * LEAVE, 1 / LEAVE))
    print("   The door, set as odds at half that: %.1f%% (one in %.0f) of those born outside are ever placed, by the same lot." % (100 * door, 1 / door))
    for years in (30, 42):
        p = 1 - (1 - door) ** (1 / years)
        print("     entered for %d years (from 18): one chance in %.0f a year" % (years, 1 / p))
    p42 = 1 - (1 - door) ** (1 / 42)
    print("     a couple across the line with 31 years of entries left: %.1f%%" % (100 * (1 - (1 - p42) ** 31)))
    print("   A child outside then gains its household %+.3f of a householder, whatever the leak, so the habit falls to its accidents." % (door - LEAVE))
    print("   Started at 6%% of households by habit (b = 0.35), the habit takes ~%s years to halve; the Shade is older." % (
        first(run_fixed_door(door), lambda r: r[1] <= 0.03)))
    print("   births outside   a year    placed a year   carried     of the drum     over par   a third for one family in")
    for leak in (0.001, 0.0025, 0.005, 0.01):
        f = fitted(leak, door)
        print("   one in %-5.0f     %6.0f    %5.0f           %5.2f M     one in %-5.0f   %.2f%%      %.1f"
              % (1 / leak, f["born"], f["placed"], f["carried"] / 1e6, 1 / f["share"], 100 * f["over"], 1 / f["thirds"]))
    f = fitted(0.0025, door)
    unheld = 0.03 * SHARES
    adults = share_over(18) * f["carried"]
    print("   At one birth in 400: waiting wallets for the %.2f M of them over 18 take %.2f GW of the %.1f GW of unheld dividends (%.0f%%)."
          % (adults / 1e6, adults * DIV / 1e6, unheld * DIV / 1e6, 100 * adults / unheld))
    past28 = share_over(28) * f["carried"]
    places = past28 * HOME_M2 / PLACE_M2
    print("   Housing those past 28 (%.2f M) takes %.2f M places, one in %.0f; %d placings a year is %d at each of nine station rings."
          % (past28 / 1e6, places / 1e6, 90e6 / places, round(f["placed"]), round(f["placed"] / 9)))
    print("   By how many couples are childless (the door at half a household's chance of leave, births outside one in 400):")
    print("   childless   room, of births   a third for one family in   a household's chance of leave   the door")
    for c in (0.08, 0.05, 0.03, 0.02, 0.01):
        room = 1 - (1 - c) * S35
        kap = BIRTHS / (1 - c)
        lv = room * kap
        print("   %2.0f%%         %.1f%%              %4.1f                         %4.1f%%                           one in %.0f"
              % (100 * c, 100 * room, 1 / ((room - 0.0025 * lv / 2) * kap), 100 * lv, 2 / lv))
    print("   A free drum placing 6,000 a year, all leave forfeit: births outside %.1f%%, one in %.1f placed, %.2f%% over par, one person in %.0f."
          % (100 * 6000 / LEAVE / DRUM_BIRTHS, 1 / LEAVE, 100 * (1 - LEAVE) * 6000 / LEAVE / DRUM_BIRTHS,
             1 / (((1 - LEAVE) * 6000 / LEAVE / DRUM_BIRTHS) / (1 + (1 - LEAVE) * 6000 / LEAVE / DRUM_BIRTHS))))
    print("   Twins at a second birth (one pregnancy in 250, identical twins only, since the clinic sets one embryo): %.0f a year, %.1f%% of the room."
          % (TWINS * DRUM_BIRTHS, 100 * TWINS / ROOM))
    print("   So thirds by leave are %.0f a year and a household's chance of leave is %.1f%% (one in %.1f); of a third by any road, %.1f%%."
          % ((ROOM - TWINS) * DRUM_BIRTHS - f["placed"], 100 * f["leave"], 1 / f["leave"], 100 * f["thirds"]))
    print("   The line outside in a fitted drum is a line of cutters: a placeless-born couple has a child only by taking out both implants,")
    print("   and is refitted at the birth. Births outside one in 400, door 6%, the willing mixed in with the rest:")
    print("   couples willing at the start   children   b      the line, of births outside   years until 1 couple in 4 is willing / the drum is 1% over par")
    for phi0, k in ((0.01, 2.0), (0.04, 2.0), (0.04, 3.0)):
        for b in (0.35, 0.5):
            rows = run(0.0, acc=0.0025, q0=1e-4, b=b, phi0=phi0, k=k, door_odds=door, gens=400000, stop_over=0.01)
            print("   one in %-3.0f                     %.0f          %.2f   %.1f%%                          %s / %s"
                  % (1 / phi0, k, b, 100 * rows[0][8] if rows[0][8] else 100 * rows[1][8],
                     big(first(rows, lambda r: r[7] >= 0.25)), big(first(rows, lambda r: r[6] >= 0.01))))
    print("   (run to 13 million years)")
    drawn = (ROOM / 2 - TWINS) * DRUM_BIRTHS - f["placed"]
    by_draw = drawn / DRUM_BIRTHS * KAPPA
    print("   Draw Day: ~%.0f permits drawn (half the room less the twins and the placings), ~%.0f a station ring, %.1f hours at five seconds a name;"
          % (drawn, drawn / 9, (drawn + f["placed"]) / 9 * 5 / 3600))
    print("   a household's chance by the draw alone is %.1f%% (one in %.0f) over ~25 years, ~%.2f%% a year (one in %.0f)."
          % (100 * by_draw, 1 / by_draw, 100 * by_draw / 25, 25 / by_draw))
    print()


def run_fixed_door(door, b=0.35, q0=0.06, gens=3000):
    """The household habit under a door fixed as odds (the fitted drum's lot)."""
    zq, muq = inv(1 - q0), 0.0
    rows = []
    for g in range(gens + 1):
        q = 1 - Phi(zq - muq)
        leave = min(1.0, (ROOM - door * q / KAPPA) * KAPPA / max(1e-9, 1 - q))
        rows.append((g, q))
        muq += b * pdf(zq - muq) * (door - leave) / (2 + leave)
    return rows


# ------------------------------------------------------------------ 6. where a keep is charged
def print_keep():
    pay = HOUR * 2000 / 365
    print("6. WHERE A KEEP IS CHARGED AND THE PLACELESS-BORN HOLD NO WALLET (drums that chose otherwise)")
    print("   keep, kW   kWh a day   over 18 years, kWh   wallet-years   a household of five on four wallets, kWh a head a day")
    for k in (0.23, 0.55, 1.10):
        tot = k * 8766 * 18
        print("   %.2f       %5.1f       %8.0f             %4.1f           %4.1f   (a family of four: 21.6)"
              % (k, k * 24, tot, tot / (DIV * 8766), 24 * (4 * DIV - k) / 5))
    print("   Full-time pay with no share: %.1f kWh a day, %.0f%% of a wallet; a working sibling with a share has %.1f." % (pay, 100 * pay / 21.6, 21.6 + pay))
    print("   Old age alone, at no interest, to live on 10 kWh a day after work stops:")
    for stop in (75, 85, 95):
        bank = 10 * (120 - stop) / (stop - 18)
        print("     stopping at %d: bank %.1f kWh a day from 18 (%.0f%% of pay)" % (stop, bank, 100 * bank / pay))
    ann = (1 - 1.03 ** -35) / 0.03
    fv = (1.03 ** 67 - 1) / 0.03
    print("     at 3%% interest, stopping at 85: bank %.1f kWh a day (%.0f%% of pay)" % (10 * ann / fv, 100 * 10 * ann / fv / pay))
    print("   A house's box: 15 parts in a hundred of pay from 31 to 85 pays %.1f kWh a day from 85 to 120." % (0.15 * pay * 54 / 35))
    over = (1 - LEAVE) * 0.03          # canon's free drum: 3% of births outside, the door at the forfeit
    P = over * SHARES
    old = share_over(85) * P
    unheld = 0.03 * SHARES
    print("   Canon's free drum (3%% of births outside, one in %.1f placed, %.0f placings a year), %.1f M carried, %.1f%% over par: the commons is"
          % (1 / LEAVE, 0.03 * LEAVE * DRUM_BIRTHS, P / 1e6, 100 * over), end=" ")
    print("%.2f kW a head with them and %.2f without, the unheld dividends (%.1f GW) in it;"
          % ((BEAM_GW - (SHARES - unheld) * DIV / 1e6) * 1e6 / (SHARES + P), (BEAM_GW - (SHARES - unheld) * DIV / 1e6) * 1e6 / SHARES, unheld * DIV / 1e6))
    print("   a waiting wallet for each of the %.2f M over 85 takes %.0f%% of the waiting shares and %.1f%% of the commons."
          % (old / 1e6, 100 * old / unheld, 100 * old * DIV / 1e6 / (BEAM_GW - (SHARES - unheld) * DIV / 1e6)))
    places = share_over(28) * P * HOME_M2 / PLACE_M2
    thirds = (ROOM - 0.03 * LEAVE) * DRUM_BIRTHS
    print("   Housing those past 28 (%.1f M) takes %.2f M places, one in %.0f; dissolving those houses"
          % (share_over(28) * P / 1e6, places / 1e6, 90e6 / places))
    print("   would free %.1f M householder slots, %.0f years of leave at once." % (2 * places / 1e6, 2 * places / thirds))
    print("   Houses holding 0 / 1%% / %.1f%% / 3%% of places: the drum sits %s against par."
          % (100 * places / 90e6, " / ".join("%+.1f%%" % (100 * ((1 - h) * (1 + over) - 1)) for h in (0, 0.01, places / 90e6, 0.03))))
    hh = (ROOM / 2 - TWINS) * KAPPA / 25
    print("   A marriage across the line entered in the draw at a household's odds (one in %.0f a year): %.0f%% in ten years, %.0f%% in thirty."
          % (1 / hh, 100 * (1 - (1 - hh) ** 10), 100 * (1 - (1 - hh) ** 30)))
    print()


# ------------------------------------------------------------------ 7. twins
def print_twins():
    print("7. TWINS")
    print("   One embryo a pregnancy: identical twins only, one pregnancy in 250, not heritable. At a second birth they are %.0f thirds a year," % (TWINS * DRUM_BIRTHS))
    print("   %.1f%% of the room, and a drum can charge them to it for good." % (100 * TWINS / ROOM))
    print("   Conceived the old way, fraternal twinning is a threshold trait expressed in mothers (liability heritability ~0.1-0.3; about 1% of")
    print("   pregnancies at the start). If a twin at a second birth is a third the drum accepts, such mothers leave three children where others")
    print("   leave two, and the liability's mean rises by (h2 / 2) x the selection differential each generation. Years until twins at second births are:")
    print("   h2      2%       5%       12% (all the room)   25%      half")
    for h2 in (0.10, 0.20, 0.30):
        x, mu, g = inv(1 - 0.010), 0.0, 0
        targets, out = [0.02, 0.05, 0.12, 0.25, 0.5], []
        while targets and g < 5000:
            p = 1 - Phi(x - mu)
            while targets and p >= targets[0]:
                targets.pop(0)
                out.append(g * GEN)
            gainers = p * (1 - p)            # a twin at the first birth is the household's two
            S = pdf(x - mu) * (1 - p) * 0.5 / (1 + 0.5 * gainers)
            mu += h2 * S / 2                 # shown by mothers only, carried by both sexes
            g += 1
        print("   %.2f   %6d   %6d   %6d               %6d   %6d" % ((h2,) + tuple(out)))
    print()


if __name__ == "__main__":
    print("How many people a drum carries outside its places.\n")
    print("Age shares of a steady population (stem_places.py's mortality): over 18 / 28 / 85 / 100: %.0f%% / %.0f%% / %.0f%% / %.0f%%\n"
          % (100 * share_over(18), 100 * share_over(28), 100 * share_over(85), 100 * share_over(100)))
    print_free_entry()
    print_line()
    print_wall()
    print_bound()
    print_fitting()
    print_keep()
    print_twins()
