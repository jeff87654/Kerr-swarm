"""Flying the Spindle: grip, the easy way to fly, nets, crowds and turnover.

The figures behind raft-habitat.md § Flying, for the 3 km nation drum.

A flyer is a 72 kg person in wing-sleeves (fabric fins from wrist to hip,
~1.2 m² of lifting surface with the body, 1.8 m span) in the drum's heliox
(0.398 kg/m³). Near the axis the air turns with the drum, so the model works
in the drum's turning frame: centrifugal pull ω²r outward, Coriolis −2ω × v,
and drag against still air.

1. Grip: how hard sleeves can push in heliox (lift and drag at q = ½ρv²).
2. Which way is easy: lengthwise flight needs lift m ω² r to hold its distance
   from the axis; flying antispinward at the air's own speed ωr leaves the
   flyer still while the drum turns, and needs none; spinward needs more.
3. Nets and falls: a flyer who stops flying drifts out, integrated in the
   turning frame with drag (RK4).
4. Collisions: the energy two flyers share, by closing speed.
5. How many at once: the Spindle's volume at a few packing densities, and
   would-be collisions in free flight.
6. Who gets to fly: flyer-hours a day, the Long Flight's turns, and the lift
   channels its turnover needs.
7. The dusk: how bright the dimming sunline is near the spar.
8. A full Spindle drags its own air.

Pure Python; under a second.

    python3 flight.py > out/flight.txt
"""
from math import pi, sqrt, hypot, log

# Drum (habitat-design.md, drum-transport.md)
W = 0.0572          # spin, rad/s (one turn in 110 s)
L = 3750.0          # length, m
RHO = 0.398         # heliox, kg/m³
G0 = 9.81
R_NET = 75.0        # flying country's edge, m
R_WIDE = 150.0      # open-questions.md P6's net, m (0.05 g)
POP = 200e6

# Flyer in wing-sleeves
M = 72.0            # kg, with sleeves and lamp
S = 1.2             # lifting area, m²
B = 1.8             # span, m
E = 0.7             # span efficiency (low aspect ratio)
CL_MAX = 1.2
F_LEN = 0.25        # drag area flying lengthwise, m²
F_SPREAD = 1.2      # drag area spread broadside to brake, m²
F_TUMBLE = (0.5, 0.7)   # drag area of a limp, tumbling body, m²
ETA = 0.6           # flapping: aerodynamic power ÷ muscle power
DRIFT = 2.5         # drift along the axis while circling anti, m/s


def q(v):
    return 0.5 * RHO * v * v


def lengthwise(r):
    """Best speed and aerodynamic power holding radius r flying along the axis."""
    lift = M * W * W * r
    vmin = sqrt(lift / (q(1.0) * S * CL_MAX))
    best = None
    v = vmin
    while v < 25.0:
        drag = q(v) * F_LEN + lift ** 2 / (q(v) * pi * B * B * E)
        p = drag * v
        if best is None or p < best[1]:
            best = (v, p)
        v += 0.01
    return vmin, best[0], best[1]


def anti(r):
    """Airspeed and power circling anti at ωr with a drift along the axis."""
    v = hypot(W * r, DRIFT)
    return v, q(v) * F_LEN * v


def drift(r0, v_anti, r_end, cda, dt=0.02, tmax=3000.0):
    """A flyer stops at r0 (moving anti at v_anti through the air) and drifts.
    Returns (seconds, speed against the air) on reaching r_end."""
    k = 0.5 * RHO * cda / M

    def f(s):
        x, y, vx, vy = s
        sp = hypot(vx, vy)
        return (vx, vy,
                W * W * x + 2 * W * vy - k * sp * vx,
                W * W * y - 2 * W * vx - k * sp * vy)

    s = (r0, 0.0, 0.0, -v_anti)
    t = 0.0
    while t < tmax:
        k1 = f(s)
        k2 = f(tuple(a + 0.5 * dt * b for a, b in zip(s, k1)))
        k3 = f(tuple(a + 0.5 * dt * b for a, b in zip(s, k2)))
        k4 = f(tuple(a + dt * b for a, b in zip(s, k3)))
        s = tuple(a + dt / 6 * (b + 2 * c + 2 * d + e)
                  for a, b, c, d, e in zip(s, k1, k2, k3, k4))
        t += dt
        if hypot(s[0], s[1]) >= r_end:
            return t, hypot(s[2], s[3])
    return None


def main():
    print(__doc__.splitlines()[0])
    print()
    print(f"Spin {W} rad/s (a turn in {2 * pi / W:.0f} s); weight at the {R_NET:.0f} m net "
          f"{W * W * R_NET / G0 * 100:.1f}% of a g; the air there turns at {W * R_NET:.1f} m/s.")

    print("\n1. GRIP: what sleeves can do in heliox")
    for v in (2, 3, 5, 8):
        print(f"   at {v} m/s: sideways up to {q(v) * S * CL_MAX / M:.3f} m/s², "
              f"braking up to {q(v) * F_SPREAD / M:.3f} m/s²")
    print(f"   tightest banked turn, any speed: radius {2 * M / (RHO * S * CL_MAX):.0f} m")
    lb = 2 * M / (RHO * F_SPREAD)
    print(f"   braking from 5 to 1 m/s takes {lb * log(5):.0f} m")
    for d in (1.0, 1.5):
        print(f"   a {d} m sidestep at 0.1 m/s² takes {sqrt(2 * d / 0.1):.1f} s, plus ~1 s to react")

    print("\n2. WHICH WAY IS EASY (muscle = aerodynamic power ÷ %.1f)" % ETA)
    print("   r m   weight   lengthwise: min speed  power  muscle    anti (+%.1f m/s along): airspeed  power  muscle" % DRIFT)
    for r in (10, 30, 50, 75, 110, 150):
        vmin, vb, pl = lengthwise(r)
        va, pa = anti(r)
        print(f"   {r:4d}  {W * W * r / G0 * 100:4.1f}%g   {vmin:5.1f} m/s  {pl:6.1f} W  {pl / ETA:5.0f} W"
              f"          {va:5.1f} m/s  {pa:5.1f} W  {pa / ETA:4.0f} W")
    print("   spinward at the net: lift needed m(ωr + u)²/r against the most sleeves give")
    for u in (1, 2, 4, 8):
        print(f"     u = {u} m/s: need {M * (W * R_NET + u) ** 2 / R_NET:5.1f} N, sleeves give {q(u) * S * CL_MAX:5.1f} N")

    print("\n3. NETS AND FALLS (a flyer who stops flying; tumbling drag area %.1f–%.1f m²)" % F_TUMBLE)
    for cda in F_TUMBLE:
        print(f"   drag area {cda} m²:")
        for r0, va, rn in ((40, 0, R_NET), (70, W * 70, R_NET), (75, 0, R_WIDE), (100, 0, R_WIDE),
                           (140, W * 140, R_WIDE)):
            t, v = drift(r0, va, rn, cda)
            how = "circling anti" if va else "at rest in the air"
            print(f"     from {r0:3d} m, {how}: reaches a {rn:.0f} m net in {t:5.1f} s at {v:4.1f} m/s")
        t, v = drift(R_NET, 0, 1500.0, cda)
        print(f"     no net, from {R_NET:.0f} m: reaches the Hollow floor in {t:.0f} s at {v:.1f} m/s"
              f" (a {v * v / (2 * G0):.0f} m fall on Earth)")
    for rn in (R_NET, R_WIDE):
        a = 2 * pi * rn * L
        print(f"   a net at {rn:.0f} m the whole length: {a / 1e6:.2f} km², {a * 0.03 / 1e3:.0f}–{a * 0.05 / 1e3:.0f} t at 30–50 g/m²")

    print("\n4. COLLISIONS: energy shared, ½ (m/2) v²")
    for vc in (0.5, 1, 2, 4, 8, 16):
        print(f"   closing at {vc:4.1f} m/s: {0.25 * M * vc * vc:6.0f} J")

    print("\n5. HOW MANY AT ONCE")
    v_sp = pi * R_NET ** 2 * L
    v_wide = pi * R_WIDE ** 2 * L
    v_easy = pi * 110.0 ** 2 * L
    v_halls = 2 * pi * R_NET ** 2 * 300.0
    v_band = v_sp * (1 - (50 / R_NET) ** 2)
    print(f"   Spindle to {R_NET:.0f} m: {v_sp:.3g} m³; to 110 m: {v_easy:.3g}; to {R_WIDE:.0f} m: {v_wide:.3g}")
    print(f"   both flying halls: {v_halls:.3g} m³; the band 50–75 m: {v_band:.3g} m³ ({1 - (50 / R_NET) ** 2:.0%})")
    for per in (50, 100, 200):
        print(f"   {per:3d} m³ each ({per ** (1 / 3):.1f} m between centres): Spindle {v_sp / per:>10,.0f}   "
              f"halls {v_halls / per:>8,.0f}   band {v_band / per:>8,.0f}   to 110 m {v_easy / per:>10,.0f}   "
              f"to 150 m {v_wide / per:>10,.0f}")
    sigma = pi * 1.5 ** 2
    vrel = 4 / 3 * 3.5
    print(f"   free flight at 3.5 m/s, any direction (closing ~{vrel:.1f} m/s, ~{6.5 * vrel:.0f} m of warning to dodge):")
    for per in (2000, 10000, 20000):
        print(f"     {per:6,d} m³ each: {sigma * vrel / per * 3600:5.1f} would-be collisions an hour a flyer;"
              f" halls hold {v_halls / per:,.0f}")
    print(f"   neighbours circling anti 4 m apart in radius differ by {W * 4:.2f} m/s")

    print("\n6. WHO GETS TO FLY")
    night = 13 * v_sp / 100
    day = 11 * 70000
    print(f"   lamp-night 13 h × {v_sp / 100:,.0f} + day 11 h × 70,000 = {(night + day) / 1e6:.1f} M flyer-hours a day")
    print(f"   per resident: {(night + day) / POP * 60 * 7:.0f} min a week, {(night + day) / POP * 365:.0f} h a year")
    prime = 5 * v_sp / 100 / POP * 60 * 7
    print(f"   18:00–23:00 only: {prime:.1f} min a week, an hour every {60 / prime:.0f} weeks")
    turn = L / DRIFT / 60
    print(f"   the Long Flight: one Length at {DRIFT} m/s takes {turn:.0f} min; 22:00 to lamp-dawn is 8 h")
    for per in (100, 50):
        n = v_sp / per * 8 * 60 / turn
        print(f"     {per:3d} m³ each: {n / 1e6:.1f} M fly, one resident in {POP / n:.0f}")
    platoon = 40 * 4.5
    chan = 40 * 6 / ((platoon + 48.0) / 12.0)
    for per in (100, 50):
        rate = v_sp / per / (turn * 60)
        print(f"     {per:3d} m³ each: {rate:.0f} riders a second in at the front wall and out at the back;"
              f" at {chan:.1f} a channel, {rate / chan:.0f} channels a wall")

    print("\n7. THE DUSK: the line dims linearly over 3 h; 7.3 kW/m² at 75 m at full sun, ∝ 1/distance")
    for frac, name in ((1 / 7, "a seventh"), (0.02, "2%")):
        row = ", ".join(f"{r} m {7.3 * 75 / r * frac:.2f}" for r in (10, 50, 75))
        print(f"   at {name}: kW/m² at {row}")
    f_core = 10 / (7.3 * 75)
    print(f"   ≤1 kW/m² at 10 m from the spar below {f_core:.1%}: {f_core * 180:.0f} min before the line is out"
          f" (a seventh: {180 / 7:.0f} min)")

    print("\n8. A FULL SPINDLE DRAGS ITS AIR (everyone circling anti at ωr)")
    n = 1 / 100
    torque = n * 0.5 * RHO * F_LEN * W * W * L * 2 * pi * R_NET ** 5 / 5
    inertia = 0.5 * RHO * v_sp * R_NET ** 2
    print(f"   crowd torque {torque:.3g} N m; alone it would stop the column turning in {W * inertia / torque:.0f} s")
    area = 2 * pi * R_NET * L
    for cf in (0.003, 0.01):
        lo, hi = 0.0, 1.0
        for _ in range(60):
            x = 0.5 * (lo + hi)
            if torque * (1 - x) ** 2 > RHO * cf * (x * W * R_NET) ** 2 * area * R_NET:
                lo = x
            else:
                hi = x
        print(f"   mixing at the net, C_f = {cf}: the column turns {x:.0%} slower than the drum;"
              f" {x * W * R_NET:.1f} m/s of anti wind at the net")


if __name__ == "__main__":
    main()
