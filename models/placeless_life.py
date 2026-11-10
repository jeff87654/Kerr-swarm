"""A placeless-born life: the sums behind third-chair.md and families.md § What the placeless-born live on.

Not a simulation. It takes the canon figures for a steady drawn-holdings drum
(people.md, economy.md, families.md, models/placing.py) and works out what they
mean over one life lived outside the allowance:

1. The keep a household pays, and what it does to its wallets.
2. Income by standing, from 18.
3. Old age without a share: what it takes to fund it alone, and what a house's
   box pays.
4. Waiting shares: the shares that sit unheld between a death and the birth
   they wait for, what their dividends come to, and what lending them to the
   old placeless would cost.
5. Houses: how many places house the placeless-born, where the drum then sits
   against par, and what dissolving the houses would free.
6. The doors, a year: how a drum's placings might divide between adoption,
   service and marriage, and what Draw Day then looks like.
7. Marriage across the line: what it costs the partner born to a place, and
   the odds of a placing through the draw.

Pure Python; instant. python3 placeless_life.py > out/placeless_life.txt
"""
import math

# ---- canon inputs -----------------------------------------------------------
SHARES = 200e6          # a nation drum (raft-habitat.md)
LIFE = 120.0            # years (people.md)
BEAM = 2.0              # kWe a share (daily-life.md)
COMMONS = 1.1           # kW a head
WALLET = 0.9            # kW a share: 21.6 kWh a day
PLACES = 90e6           # places, at 2.22 people each (people.md)
PPP = SHARES / PLACES   # people a place
HOME_M2 = 35.0          # m2 of home a person (economy.md)
PLACE_M2 = HOME_M2 * PPP
RENT = 0.1              # kWh per m2 a day at par (economy.md)
HOUR = 3.1              # kWh an hour (economy.md, planning case)
FULL_TIME = 2000        # hours a year
LEAK = 0.03             # births outside the allowance, per replacement birth (families.md)
DOOR = 0.10             # share of the placeless-born placed
C_CHILDLESS = 0.05
S35 = 0.993
ROOM = 1 - (1 - C_CHILDLESS) * S35          # 5.7% of births (placing.py)
SHARELESS_AT_PAR = 0.03  # people.md: ~3% of people shareless at par, nearly all children
KEEP_LOW, KEEP_HIGH = 0.23, 1.1             # kW: the Mill-table credit, the whole commons
KEEP_TANSY = 0.55       # kW: half a child's commons (third-chair.md, proposal)

# mortality as in stem_places.py
LAMBDA, GOMP_B, GOMP_MODE = 2.0e-4, 0.10, 127.0
GOMP_A = GOMP_B * math.exp(-GOMP_B * GOMP_MODE)


def surv(a):
    return math.exp(-LAMBDA * a - (GOMP_A / GOMP_B) * (math.exp(GOMP_B * a) - 1))


AGES = [a + 0.5 for a in range(0, 160)]
TOTAL = sum(surv(a) for a in AGES)


def share_over(age):
    """Share of a stationary population older than age."""
    return sum(surv(a) for a in AGES if a >= age) / TOTAL


def kwh_day(kw):
    return kw * 24


def wallet_years(kwh):
    return kwh / (WALLET * 8766)


print("A placeless-born life: the sums.\n")
mean_life = TOTAL
births = SHARES / mean_life
print(f"The drum: {SHARES/1e6:.0f} M shares, {PLACES/1e6:.0f} M places of {PLACE_M2:.0f} m2, mean life {mean_life:.0f} yr,")
print(f"  ~{births/1e6:.2f} M births a year at par; shares of a steady population over 18 / 28 / 85 / 100:"
      f" {share_over(18):.0%} / {share_over(28):.0%} / {share_over(85):.0%} / {share_over(100):.0%}")
born_outside = LEAK * births
placed = DOOR * born_outside
unplaced_share = (1 - DOOR) * LEAK
pb = unplaced_share * SHARES            # placeless-born carried, as extra lifetimes
print(f"  born outside the allowance: {born_outside:,.0f} a year (one birth in {1/LEAK:.0f}); placed: {placed:,.0f} a year;")
print(f"  placeless-born carried: {pb/1e6:.1f} M, {unplaced_share/(1+unplaced_share):.1%} of people (one in {(1+unplaced_share)/unplaced_share:.0f})")
second_gen = 0.0019 / LEAK
print(f"  of the placeless-born, children of the placeless-born (placing.py: 0.19% of births): {second_gen:.0%}, one in {1/second_gen:.0f}")

# ---------------------------------------------------------------- 1. the keep
print("\n1. THE KEEP: a household of five on four wallets, charged for the third's keep to 18")
print("   keep (kW)   kWh a day   over 18 years (kWh)   wallet-years   wallets, kWh a head a day")
for k in (0.0, KEEP_LOW, KEEP_TANSY, KEEP_HIGH):
    total = k * 8766 * 18
    head = kwh_day((4 * WALLET - k) / 5)
    print(f"   {k:5.2f}       {kwh_day(k):5.1f}       {total:9,.0f}          {wallet_years(total):5.1f}          {head:5.1f}   (a family of four: {kwh_day(WALLET):.1f})")
print("   A placeless-born couple, both working full time, with one child outside:")
pay = HOUR * FULL_TIME / 365
for k in (KEEP_LOW, KEEP_TANSY, KEEP_HIGH):
    print(f"     keep {k:.2f} kW = {kwh_day(k):4.1f} kWh a day, {kwh_day(k)/(2*pay):.0%} of their {2*pay:.0f} kWh a day")

# ---------------------------------------------------------------- 2. income
print("\n2. INCOME BY STANDING, kWh a day")
div = kwh_day(WALLET)
print(f"   a share, not working                 {div:5.1f}")
print(f"   a share, working full time           {div + pay:5.1f}")
print(f"   no share, working full time          {pay:5.1f}   ({pay/div:.0%} of a wallet; {pay/(div+pay):.0%} of a working sibling's)")
print(f"   no share, not working                  0.0   (the commons only)")
print(f"   a 20 m2 room at par: {20*RENT:.1f} kWh a day, {20*RENT/pay:.0%} of full-time pay; a whole place: {PLACE_M2*RENT:.1f}")

# ---------------------------------------------------------------- 3. old age
print("\n3. OLD AGE WITHOUT A SHARE")
print("   Banking a constant share of full-time pay from 18, re-lent each booking year at no interest (a usury drum):")
print("   stop work at   years worked   years after (to 120)   to live on 10 kWh a day after, bank   live on meanwhile")
for stop in (75, 85, 95):
    worked, after = stop - 18, LIFE - stop
    need = 10.0 * after / worked
    print(f"   {stop:3d}            {worked:3d}            {after:3.0f}                    {need:4.1f} kWh a day ({need/pay:.0%} of pay)        {pay-need:4.1f}")
print("   The same at 3% a year (a rentier drum), stopping at 85:")
r = 0.03
worked, after = 85 - 18, LIFE - 85
fv = lambda c: c * ((1 + r) ** worked - 1) / r           # value at 85 of c a year banked
pv = 10.0 * (1 - (1 + r) ** -after) / r                   # cost at 85 of 10 a day for 35 years
c = pv / (((1 + r) ** worked - 1) / r)
print(f"     bank {c:.2f} kWh a day ({c/pay:.1%} of pay): interest does the rest, and lenders live on it")
print("   A house's box: members pay in a share of pay from election (~31) to 85, and draw from 85:")
for x in (0.10, 0.15, 0.20):
    out = x * pay * (85 - 31) / (LIFE - 85)
    print(f"     {x:.0%} of pay in ({x*pay:.1f} kWh a day) -> {out:.1f} kWh a day out")

# ---------------------------------------------------------------- 4. waiting shares
print("\n4. WAITING SHARES: shares unheld between a death and the birth they wait for")
unheld = SHARELESS_AT_PAR * SHARES
print(f"   At par shares equal people, so the ~{SHARELESS_AT_PAR:.0%} of people who are shareless (children waiting ~6 years)")
print(f"   are matched by as many shares waiting in other families: ~{unheld/1e6:.0f} M (stem_places.py: 'held for the next child born there').")
print(f"   Check: 60% of {births/1e6:.2f} M births wait ~6 years = {0.6*births*6/1e6:.1f} M.")
gw_unheld = unheld * WALLET / 1e6
gw_pb = pb * COMMONS / 1e6
print(f"   Their dividends: {gw_unheld:.1f} GW. The placeless-born's whole commons: {pb/1e6:.1f} M x {COMMONS} kW = {gw_pb:.1f} GW.")
beam = SHARES * BEAM / 1e6
paid = (SHARES - unheld) * WALLET / 1e6
people = SHARES + pb
print(f"   If unheld dividends fall to the commons: ({beam:.0f} - {paid:.1f}) GW / {people/1e6:.1f} M = {(beam-paid)*1e6/people:.3f} kW a head,")
print(f"     against {(beam-paid)*1e6/SHARES:.3f} kW with no placeless-born to carry, and the {COMMONS} kW of a drum with every share held.")
for age in (85, 100):
    old = share_over(age) * pb
    cost = old * WALLET / 1e6
    print(f"   A waiting wallet for every placeless-born person over {age}: {old/1e6:.2f} M wallets, {old/unheld:.0%} of the waiting shares,")
    print(f"     {cost:.2f} GW: the commons at {(beam-paid-cost)*1e6/people:.3f} kW a head ({cost/(beam-paid):.1%} thinner)")

# ---------------------------------------------------------------- 5. houses
print("\n5. HOUSES: places held by bodies that don't die")
adults28 = share_over(28) * pb
need_places = adults28 * HOME_M2 / PLACE_M2
print(f"   Placeless-born past 28: {adults28/1e6:.2f} M. At {HOME_M2:.0f} m2 each they fill {need_places/1e6:.2f} M places,"
      f" {need_places/PLACES:.1%} of the drum's: one place in {PLACES/need_places:.0f}.")
print("   houses hold   households   born to a place   placeless-born   people     against par")
for h in (0.0, 0.01, need_places / PLACES, 0.03):
    hh = PLACES * (1 - h)
    b2p = hh * PPP
    p = b2p * unplaced_share
    print(f"   {h:5.1%}         {hh/1e6:5.1f} M      {b2p/1e6:6.1f} M         {p/1e6:4.1f} M           {(b2p+p)/1e6:6.1f} M   {(b2p+p)/SHARES-1:+.1%}")
thirds_by_leave = (ROOM - DOOR * LEAK) * births
freed = need_places * 2
print(f"   Dissolving them: {need_places/1e6:.2f} M places x 2 householders = {freed/1e6:.1f} M slots,"
      f" against {thirds_by_leave:,.0f} thirds by leave a year: {freed/thirds_by_leave:.0f} years' leave at once.")
heirless = ROOM * births / 2
print(f"   Founding them: ~{heirless:,.0f} places a year end without an heir. A tenth of those to the houses builds the stock in"
      f" {need_places/(0.1*heirless):.0f} years; half, in {need_places/(0.5*heirless):.0f}.")

# ---------------------------------------------------------------- 6. the doors
ADOPT, SERVE, MARRY = 3300, 1500, 200       # an illustrative split of a year's placings (proposal)
heirless_slots = ROOM * births / 2          # the households' half of the room, and the drum's half
named = heirless_slots - ADOPT              # thirds named by the heirless
drawn = heirless_slots - SERVE              # permits drawn: thirds, and placings by marriage
print("\n6. THE DOORS, A YEAR (an illustrative split of the placings; proposal)")
print(f"   Room: {ROOM*births:,.0f} slots a year, half the households' to name and half the drum's to give.")
print(f"   The households' half ({heirless_slots:,.0f}): {named:,.0f} heirs named unborn, {ADOPT:,d} placeless-born adults adopted"
      f" ({ADOPT/heirless_slots:.0%} of heirless places).")
print(f"   The drum's half ({heirless_slots:,.0f}): {SERVE:,d} placings for service, {drawn:,.0f} permits drawn,"
      f" of which {MARRY} fall to couples across the line.")
print(f"   Thirds by leave: {named + drawn - MARRY:,.0f}. Placings: {ADOPT + SERVE + MARRY:,d} of {born_outside:,.0f} born outside: one in {born_outside/(ADOPT+SERVE+MARRY):.0f}.")
for name, n in (("adoption", ADOPT), ("service", SERVE), ("marriage", MARRY)):
    print(f"     by {name:9s} one of a year's births outside in {born_outside/n:,.0f}")
print(f"   A crew that places {SERVE:,d} a year after 25 years holds ~{SERVE*25:,d} hands on the placing track at once,")
print(f"     and elects {SERVE:,d} a year from ~{(1-DOOR)*born_outside:,.0f} who will never be placed another way: one in {(1-DOOR)*born_outside/SERVE:.0f}.")
print(f"   Draw Day: {drawn:,.0f} permits at nine station rings, ~{drawn/9:,.0f} each; read out at five seconds a name: {drawn/9*5/3600:.1f} hours.")

# ---------------------------------------------------------------- 7. marriage across the line
print("\n7. MARRIAGE ACROSS THE LINE")
shut = ROOM * (2 / S35) / (1 - C_CHILDLESS)             # a household's chance of leave with no placings
leave_odds = (ROOM - DOOR * LEAK) * (2 / S35) / (1 - C_CHILDLESS)
per_year = (leave_odds / 2) / 25
print(f"   A household's lifetime chance of a third by leave: {leave_odds:.0%} (one in {1/leave_odds:.1f}); by the draw alone, where the heirless")
print(f"   name half the room: {leave_odds/2:.1%} (one in {2/leave_odds:.0f}) over ~25 years of entering, ~{per_year:.2%} a year (one in {1/per_year:.0f}).")
print(f"   What is given up, in householders: by a child outside with the door shut, {shut:.2f}; by marrying across the line unplaced, 2.")
for years in (4, 10, 32):
    p = 1 - (1 - per_year) ** years
    print(f"   A couple across the line entering the same draw for {years:2d} years: {p:.1%} chance of a placing")
couples = MARRY / per_year
print(f"   {MARRY} placings a year at those odds means ~{couples:,.0f} such couples entered at once: ~{couples/32:,.0f} a cohort if they enter")
print(f"     for 32 years, {couples/32/((1-DOOR)*born_outside):.0%} of a cohort's unplaced placeless-born.")
