"""Place the 12 canon rows of Merrow so that wander-year.md's leg distances and
light delays home (to Chervil on Herb Row) come out right.

Merrow: ~3e11 nation drums at 24.5 km spacing, ~547,700 drums a side (13.42 M km).
Herb Row is at (1.6, 6.2) M km (wander-year.md, Method).
"""
import json
import math
import numpy as np
from scipy.optimize import least_squares

C_KM_S = 299_792.458
SIDE = 13.42  # M km
HERB = np.array([1.6, 6.2])

rows = ["Hedge", "Gull", "Weather", "Bell", "Kelp", "Pigment", "Thimble",
        "Grain", "Cooper", "Kite", "Quill"]
idx = {r: i for i, r in enumerate(rows)}

# leg distances (M km), in order, starting from Herb
legs = [("Herb", "Hedge", 2.62), ("Hedge", "Gull", 3.04), ("Gull", "Weather", 2.86),
        ("Weather", "Bell", 2.78), ("Bell", "Kelp", 3.28), ("Kelp", "Pigment", 3.05),
        ("Pigment", "Thimble", 2.69), ("Thimble", "Grain", 2.79), ("Grain", "Cooper", 2.15),
        ("Cooper", "Kite", 2.06), ("Kite", "Quill", 1.70), ("Quill", "Herb", 1.65)]

# light delays home from the cards (seconds) -> distance from Herb (M km)
delays = {"Hedge": 8.7, "Gull": 18.9, "Weather": 28.0, "Bell": 32.6, "Kelp": 36.9,
          "Pigment": 33.1, "Grain": 23.7}
home = {r: s * C_KM_S / 1e6 for r, s in delays.items()}

# Day 344: on leg 11 (Kite -> Quill), light home 7.6 s. Leg 11 departs Kite ~day 340.4
# (days aboard 10.3); call it ~35% of the way along.
LEG11_FRAC = 0.35
LEG11_DIST = 7.6 * C_KM_S / 1e6


def pos(x, r):
    if r == "Herb":
        return HERB
    i = idx[r]
    return x[2 * i: 2 * i + 2]


def residuals(x):
    res = []
    for a, b, d in legs:
        res.append((np.linalg.norm(pos(x, a) - pos(x, b)) - d) * 3.0)
    for r, d in home.items():
        res.append((np.linalg.norm(pos(x, r) - HERB) - d) * 3.0)
    p = pos(x, "Kite") + LEG11_FRAC * (pos(x, "Quill") - pos(x, "Kite"))
    res.append(np.linalg.norm(p - HERB) - LEG11_DIST)
    # rows spread out: no two closer than 1.8 M km
    allr = ["Herb"] + rows
    for a_i in range(len(allr)):
        for b_i in range(a_i + 1, len(allr)):
            dd = np.linalg.norm(pos(x, allr[a_i]) - pos(x, allr[b_i]))
            res.append(max(0.0, 1.8 - dd) * 4)
    # keep inside the raft with a margin of 0.4 M km
    for r in rows:
        q = pos(x, r)
        for c in q:
            res.append(max(0.0, 0.4 - c) * 10)
            res.append(max(0.0, c - (SIDE - 0.4)) * 10)
    return np.array(res)


best = None
rng = np.random.default_rng(7)
for trial in range(400):
    x0 = rng.uniform(0.5, SIDE - 0.5, size=2 * len(rows))
    sol = least_squares(residuals, x0)
    cost = sol.cost
    if best is None or cost < best.cost:
        best = sol
print("cost", best.cost)
x = best.x
out = {"Herb": [float(HERB[0]), float(HERB[1])]}
for r in rows:
    out[r] = [round(float(v), 4) for v in pos(x, r)]
for a, b, d in legs:
    got = np.linalg.norm(np.array(out[a]) - np.array(out[b]))
    print(f"{a:8s} -> {b:8s} want {d:5.2f} got {got:5.2f}")
for r, d in home.items():
    got = np.linalg.norm(np.array(out[r]) - HERB)
    print(f"{r:8s} home want {d:5.2f} ({delays[r]} s) got {got:5.2f} ({got*1e6/C_KM_S:.1f} s)")
p = np.array(out["Kite"]) + LEG11_FRAC * (np.array(out["Quill"]) - np.array(out["Kite"]))
print("leg 11 point light home", np.linalg.norm(p - HERB) * 1e6 / C_KM_S, "s")
# grid coordinates (drums), spacing 24.5 km
grid = {r: [int(round(v * 1e6 / 24.5)) for v in xy] for r, xy in out.items()}
print(json.dumps(grid))
json.dump({"mkm": out, "grid": grid}, open(__file__.replace("solve_rows.py", "rows_solved.json"), "w"), indent=1)
