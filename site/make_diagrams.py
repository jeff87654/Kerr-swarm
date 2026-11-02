"""Draw the world bible's diagrams as SVG files in docs/diagrams/.

Run from the repo root:  python3 site/make_diagrams.py

The SVGs are committed, so the docs show them on GitHub too. Each one carries
its own light and dark colours; on the website they are inlined and take the
site's colour tokens instead (every colour is var(--token, fallback)).
Figures come from the docs named in each function's docstring; change the
numbers there first, then here.
"""
import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "docs" / "diagrams"

# Light fallback, dark fallback, for each token the diagrams use.
TOKENS = {
    "dg-bg": ("#f7f8fb", "#10131c"),
    "ink": ("#171b27", "#e7e9f0"),
    "muted": ("#596076", "#9ca3b8"),
    "line": ("#c9cdd8", "#30364a"),
    "dg-faint": ("#e6e8ef", "#1b2030"),
    "accent": ("#9a6200", "#e7b75f"),
    "dg-hot": ("#f59f00", "#ffd43b"),
    "dg-warm": ("#e8590c", "#ff922b"),
    "dg-cool": ("#b02a1a", "#e03131"),
    "dg-cold": ("#5c2b2b", "#7d3434"),
    "dg-water": ("#1c7ed6", "#4dabf7"),
    "dg-hydrogen": ("#99e9f2", "#0b7285"),
    "dg-xray": ("#7048e8", "#9775fa"),
    "dg-sky": ("#fff4d6", "#3a3013"),
    "dg-deck": ("#dfe3ec", "#232a3c"),
    "dg-deck2": ("#cfd5e2", "#2b3349"),
    "dg-raft": ("#3b4256", "#aab2c8"),
}

CLASSES = """
.k-bg{fill:var(--dg-bg,%(dg-bg)s)}
.k-t{fill:var(--ink,%(ink)s);font-family:var(--font-body,"Atkinson Hyperlegible",system-ui,sans-serif);font-size:13px}
.k-tm{fill:var(--muted,%(muted)s);font-family:var(--font-body,"Atkinson Hyperlegible",system-ui,sans-serif);font-size:12px}
.k-th{fill:var(--ink,%(ink)s);font-family:var(--font-body,"Atkinson Hyperlegible",system-ui,sans-serif);font-size:14px;font-weight:700}
.k-ttl{fill:var(--ink,%(ink)s);font-family:var(--font-display,Georgia,serif);font-size:24px}
.k-lead{stroke:var(--muted,%(muted)s);stroke-width:1;fill:none}
.k-line{stroke:var(--line,%(line)s);fill:none}
.k-faint{fill:var(--dg-faint,%(dg-faint)s)}
.k-ink{fill:var(--ink,%(ink)s)}
.k-sink{stroke:var(--ink,%(ink)s);fill:none}
.k-acc{fill:var(--accent,%(accent)s)}
.k-sacc{stroke:var(--accent,%(accent)s);fill:none}
.k-hot{stroke:var(--dg-hot,%(dg-hot)s)}
.k-warm{stroke:var(--dg-warm,%(dg-warm)s)}
.k-cool{stroke:var(--dg-cool,%(dg-cool)s)}
.k-cold{stroke:var(--dg-cold,%(dg-cold)s)}
.k-fhot{fill:var(--dg-hot,%(dg-hot)s)}
.k-water{fill:var(--dg-water,%(dg-water)s)}
.k-swater{stroke:var(--dg-water,%(dg-water)s);fill:none}
.k-h2{fill:var(--dg-hydrogen,%(dg-hydrogen)s)}
.k-xray{stroke:var(--dg-xray,%(dg-xray)s);fill:none}
.k-fxray{fill:var(--dg-xray,%(dg-xray)s)}
.k-sky{fill:var(--dg-sky,%(dg-sky)s)}
.k-deck{fill:var(--dg-deck,%(dg-deck)s)}
.k-deck2{fill:var(--dg-deck2,%(dg-deck2)s)}
.k-raft{stroke:var(--dg-raft,%(dg-raft)s)}
.k-fraft{fill:var(--dg-raft,%(dg-raft)s)}
"""


def style_block():
    light = {k: v[0] for k, v in TOKENS.items()}
    dark = {k: v[1] for k, v in TOKENS.items()}
    return (
        "<style>"
        + CLASSES % light
        + "@media (prefers-color-scheme: dark){"
        + CLASSES % dark
        + "}</style>"
    )


def svg(name, w, h, title, desc, body):
    """Wrap drawing code in a standalone SVG document."""
    head = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
        f'role="img" aria-labelledby="{name}-title {name}-desc" class="kdiagram">'
        f'<title id="{name}-title">{title}</title><desc id="{name}-desc">{desc}</desc>'
        + style_block()
        + f'<rect class="k-bg" x="0" y="0" width="{w}" height="{h}" rx="10"/>'
    )
    (OUT / f"{name}.svg").write_text(head + "".join(body) + "</svg>\n", encoding="utf-8")


def text(x, y, s, cls="k-t", anchor="start", extra=""):
    return f'<text class="{cls}" x="{x:.1f}" y="{y:.1f}" text-anchor="{anchor}"{extra}>{s}</text>'


def lines(x, y, rows, cls="k-t", anchor="start", dy=16):
    out = []
    for i, r in enumerate(rows):
        c = cls if not isinstance(r, tuple) else r[1]
        s = r if not isinstance(r, tuple) else r[0]
        out.append(text(x, y + i * dy, s, c, anchor))
    return "".join(out)


def arc(cx, cy, r, a0, a1):
    """SVG arc path from angle a0 to a1 (degrees, 0 = +x, counter-clockwise, y up)."""
    p0 = (cx + r * math.cos(math.radians(a0)), cy - r * math.sin(math.radians(a0)))
    p1 = (cx + r * math.cos(math.radians(a1)), cy - r * math.sin(math.radians(a1)))
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    return f"M{p0[0]:.1f},{p0[1]:.1f} A{r},{r} 0 {large} {sweep} {p1[0]:.1f},{p1[1]:.1f}"


def pol(cx, cy, r, a):
    return cx + r * math.cos(math.radians(a)), cy - r * math.sin(math.radians(a))


# ---------------------------------------------------------------------------
def lantern_shade():
    """The Lantern and the Shade, cut through the spin axis (full-swarm.md: Layout,
    The disk shines toward its poles, Power by beam). Radii to scale."""
    W, H = 980, 640
    cx, cy = 318, 335
    s = 205  # px per parsec
    rl, rs0, rs1 = 0.82 * s, 0.91 * s, 1.23 * s
    b = []
    b.append(text(28, 42, "The Lantern and the Shade", "k-ttl"))
    b.append(text(28, 64, "Cut through the hole's spin axis. Radii to scale; the hole, disk and rafts are not.", "k-tm"))
    # Shade annulus
    b.append(
        f'<path class="k-faint" fill-rule="evenodd" d="M{cx-rs1},{cy} a{rs1},{rs1} 0 1 0 {2*rs1},0 a{rs1},{rs1} 0 1 0 {-2*rs1},0 Z '
        f'M{cx-rs0},{cy} a{rs0},{rs0} 0 1 0 {2*rs0},0 a{rs0},{rs0} 0 1 0 {-2*rs0},0 Z"/>'
    )
    # spin axis
    b.append(f'<line class="k-line" x1="{cx}" y1="{cy-rs1-8}" x2="{cx}" y2="{cy+rs1+16}" stroke-dasharray="4 5" stroke-width="1"/>')
    b.append(text(cx + 6, cy + rs1 + 12, "spin axis", "k-tm"))
    # Lantern shell, coloured by latitude band (flux 0-0.33x, 0.33-0.86x, 0.86-2x, 2-2.6x of average)
    def band(lat):
        if lat >= 60: return "k-hot", 9
        if lat >= 30: return "k-warm", 7.5
        if lat >= 15: return "k-cool", 6
        return "k-cold", 5
    for a in range(0, 360, 3):
        lat = math.degrees(math.asin(abs(math.sin(math.radians(a + 1.5)))))
        cls, sw = band(lat)
        b.append(f'<path class="{cls}" d="{arc(cx, cy, rl, a, a + 3.15)}" stroke-width="{sw}" fill="none"/>')
    # disk light toward the poles: faint rays
    for a in range(0, 360, 8):
        lat = abs(math.degrees(math.asin(abs(math.sin(math.radians(a))))))
        mu = math.sin(math.radians(lat))
        f = mu * (1 + 2.06 * mu) / 3.06
        if f < 0.04:
            continue
        x1, y1 = pol(cx, cy, 16, a)
        x2, y2 = pol(cx, cy, rl - 8, a)
        b.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="k-sacc" stroke-width="{0.4+1.2*f:.2f}" opacity="{0.1+0.35*f:.2f}"/>')
    # hole and disk
    b.append(f'<ellipse cx="{cx}" cy="{cy}" rx="34" ry="3.2" class="k-fhot" opacity="0.85"/>')
    b.append(f'<circle cx="{cx}" cy="{cy}" r="5.5" class="k-ink"/>')
    # rafts: short plates, tangent to the circle (they face the Lantern)
    rnd = random.Random(7)
    rafts = []
    for i in range(110):
        a = rnd.uniform(0, 360)
        r = rnd.uniform(rs0 + 6, rs1 - 6)
        rafts.append((a, r))
    for a, r in rafts:
        x, y = pol(cx, cy, r, a)
        t = math.radians(a + 90)
        dx, dy = 3.5 * math.cos(t), -3.5 * math.sin(t)
        b.append(f'<line class="k-raft" x1="{x-dx:.1f}" y1="{y-dy:.1f}" x2="{x+dx:.1f}" y2="{y+dy:.1f}" stroke-width="2.2" stroke-linecap="round"/>')
    # beams from Lantern patches to a few rafts
    for a, r in rafts[:110:12]:
        x2, y2 = pol(cx, cy, r - 4, a)
        x1, y1 = pol(cx, cy, rl + 5, a + 4)
        b.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" class="k-sacc" stroke-width="1.6" stroke-dasharray="2 3"/>')
    # scale bar
    b.append(f'<line class="k-sink" x1="40" y1="{H-34}" x2="{40+0.5*s}" y2="{H-34}" stroke-width="2"/>')
    b.append(f'<line class="k-sink" x1="40" y1="{H-39}" x2="40" y2="{H-29}" stroke-width="2"/><line class="k-sink" x1="{40+0.5*s}" y1="{H-39}" x2="{40+0.5*s}" y2="{H-29}" stroke-width="2"/>')
    b.append(text(40 + 0.25 * s, H - 44, "0.5 pc ≈ 1.6 light-years", "k-tm", "middle"))

    # callouts (right column)
    X = 618
    def callout(y, px, py, head, rows):
        out = [f'<path class="k-lead" d="M{px:.1f},{py:.1f} L{X-14},{y-4}"/>', f'<circle cx="{px:.1f}" cy="{py:.1f}" r="2.5" class="k-ink"/>']
        out.append(text(X, y, head, "k-th"))
        out.append(lines(X, y + 18, rows, "k-t"))
        return "".join(out)

    b.append(callout(110, *pol(cx, cy, rl, 78), "The Lantern, ~0.82 pc out", [
        "A closed shell of hovering collectors, ~50,000 M☉.",
        "Catches ~98% of the disk's light; held up mostly",
        "by infrared trapped inside it. Nobody lives there."]))
    b.append(callout(200, cx + 30, cy - 2, "Sgr A* and its disk", [
        "4.3 × 10⁶ M☉, fed at 30% of Eddington. The disk",
        "(4–40 AU) is drawn thousands of times too big."]))
    b.append(callout(272, *pol(cx, cy, (rs0 + rs1) / 2, 28), "The Shade, 0.9–1.25 pc", [
        "~1.95 × 10³³ people in rafts on crossing orbits",
        "of ~39,000 years, passing at 100–300 km/s."]))
    bx, by = pol(cx, cy, (rl + rs0) / 2 + 4, 18)
    b.append(callout(346, bx, by, "Microwave beams cross the gap", [
        "~75% from transmitter to rectenna. Power is",
        "booked a year ahead: 3 months to 1.4 years by light."]))
    # latitude legend
    ly = 430
    b.append(text(X, ly, "The disk shines toward its poles", "k-th"))
    rows = [("60–90°", "2.0–2.6×", "k-hot", 9), ("30–60°", "0.86–2.0×", "k-warm", 7.5), ("15–30°", "0.33–0.86×", "k-cool", 6), ("0–15°", "0–0.33×", "k-cold", 5)]
    b.append(text(X, ly + 20, "Latitude, and the Lantern's flux against its average", "k-tm"))
    for i, (lat, fx, cls, sw) in enumerate(rows):
        yy = ly + 44 + i * 22
        b.append(f'<line class="{cls}" x1="{X}" y1="{yy-4}" x2="{X+34}" y2="{yy-4}" stroke-width="{sw}"/>')
        b.append(text(X + 46, yy, lat, "k-t"))
        b.append(text(X + 116, yy, fx, "k-t"))
    b.append(text(X, ly + 144, "Polar skins run ~530 K, the belt's much cooler.", "k-tm"))
    b.append(text(X, ly + 162, "The frontier's mines are 100–200 pc out, far off the page.", "k-tm"))
    svg("lantern-shade", W, H, "The Lantern and the Shade",
        "Cross-section through the spin axis: the hole and disk at the centre, the Lantern shell at 0.82 pc, "
        "hotter over the poles, and the Shade's rafts from 0.9 to 1.25 pc, fed by microwave beams.", b)


# ---------------------------------------------------------------------------
def leader(px, py, tx, ty, rows, anchor="start"):
    """A leader line from a point on the drawing to a block of label text."""
    out = f'<path class="k-lead" d="M{px:.1f},{py:.1f} L{tx:.1f},{ty:.1f}"/><circle cx="{px:.1f}" cy="{py:.1f}" r="2.2" class="k-ink"/>'
    dx = 4 if anchor == "start" else -4
    return out + lines(tx + dx, ty + 4, rows, anchor=anchor)


def drum_section():
    """A nation drum cut along its axis, top half (habitat-design.md, raft-habitat.md:
    Districts, The sunline and the Spindle, How a drum sits in its cell). Radial and
    axial distances to scale except the jacket and moat."""
    W, H = 1000, 760
    s = 140  # px per km
    L, R = 3.75, 3.0
    x0, ax = 215, 610  # front cap x, axis y
    xr = x0 + L * s
    top = ax - R * s

    def y(r_km):
        return ax - r_km * s

    b = ['<defs><marker id="ds-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" '
         'orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="k-ink"/></marker></defs>']
    b.append(text(28, 42, "A nation drum, cut along its axis", "k-ttl"))
    b.append(text(28, 64, "Top half; the bottom half mirrors it. 3 km radius, 3.75 km long, ~200 M people. To scale except the jacket and moat.", "k-tm"))
    bands = [
        (2.944, 3.0, "k-deck2", "The Keel", "decks 1–15 · ~1 g · no homes", "food plant, water, reserves"),
        (2.552, 2.944, "k-deck", "Low decks", "16–113 · 0.98–0.85 g · ~67 M", "families, schools, visitors"),
        (1.796, 2.552, "k-deck2", "Middle decks", "114–301 · 0.85–0.6 g · ~102 M", "most homes and work"),
        (1.5, 1.796, "k-deck", "High decks", "302–375 · 0.6–0.5 g · ~30 M", "elders, prestige flats"),
    ]
    for lo, hi, cls, *_ in bands:
        b.append(f'<rect class="{cls}" x="{x0}" y="{y(hi):.1f}" width="{L*s:.1f}" height="{(hi-lo)*s:.1f}"/>')
    for k in range(15):  # line decks, one in every 25
        r = 3.0 - 0.004 * (25 * k + 12)
        b.append(f'<line class="k-line" x1="{x0}" y1="{y(r):.1f}" x2="{xr}" y2="{y(r):.1f}" stroke-width="1"/>')
    for f in (0.12, 0.31, 0.5, 0.69, 0.88):  # lift cores
        xx = x0 + f * L * s
        b.append(f'<line class="k-sink" x1="{xx:.1f}" y1="{y(2.95):.1f}" x2="{xx:.1f}" y2="{y(1.5):.1f}" stroke-width="2" opacity="0.5"/>')
    # the Hollow, with terraced end walls
    b.append(f'<rect class="k-sky" x="{x0}" y="{y(1.5):.1f}" width="{L*s:.1f}" height="{1.5*s:.1f}"/>')
    b.append(f'<rect x="{x0+0.45*s:.1f}" y="{ax-0.3*s:.1f}" width="{(L-0.9)*s:.1f}" height="{0.3*s:.1f}" class="k-acc" opacity="0.13"/>')
    for side in (0, 1):
        edge = x0 if side == 0 else xr
        sgn = 1 if side == 0 else -1
        path = f"M{edge:.1f},{y(1.5):.1f} "
        steps = 6
        for i in range(steps):
            r1 = 1.5 - i * 0.22
            r2 = 1.5 - (i + 1) * 0.22
            d = (0.04 + i * 0.03) * s
            path += f"L{edge+sgn*d:.1f},{y(r1):.1f} L{edge+sgn*d:.1f},{y(r2):.1f} "
        path += f"L{edge:.1f},{y(1.5-steps*0.22):.1f} Z"
        b.append(f'<path class="k-deck" d="{path}"/>')
    for side in (0, 1):  # flying halls: within 75 m of the axis, ends out to ~300 m
        xx = x0 if side == 0 else xr - 0.3 * s
        b.append(f'<rect x="{xx:.1f}" y="{y(0.075):.1f}" width="{0.3*s:.1f}" height="{0.075*s:.1f}" class="k-fxray" opacity="0.4"/>')
    b.append(f'<line x1="{x0}" y1="{ax-1.5}" x2="{xr}" y2="{ax-1.5}" class="k-sink" stroke-width="1" stroke-dasharray="3 3"/>')
    b.append(f'<line x1="{x0+0.45*s:.1f}" y1="{ax-2}" x2="{xr-0.45*s:.1f}" y2="{ax-2}" class="k-sacc" stroke-width="5" stroke-linecap="round"/>')
    # jacket and moat, drawn thick
    jt, mt = 12, 6
    b.append(f'<rect class="k-h2" x="{x0-jt}" y="{top-jt:.1f}" width="{L*s+2*jt:.1f}" height="{jt}"/>')
    b.append(f'<rect class="k-h2" x="{x0-jt}" y="{top-jt:.1f}" width="{jt}" height="{R*s+jt:.1f}"/>')
    b.append(f'<rect class="k-h2" x="{xr}" y="{top-jt:.1f}" width="{jt}" height="{R*s+jt:.1f}"/>')
    b.append(f'<rect class="k-water" x="{x0-jt-mt}" y="{top-jt-mt:.1f}" width="{L*s+2*jt+mt:.1f}" height="{mt}"/>')
    b.append(f'<rect class="k-water" x="{x0-jt-mt}" y="{top-jt-mt:.1f}" width="{mt}" height="{R*s+jt+mt:.1f}"/>')
    b.append(f'<rect class="k-sink" x="{x0}" y="{top:.1f}" width="{L*s:.1f}" height="{R*s:.1f}" stroke-width="1.5"/>')
    qy = top - jt - mt
    for i in range(9):  # quays and station rings: nine lane levels ~420 m apart
        xx = x0 + (0.195 + i * 0.42) * s
        b.append(f'<rect class="k-ink" x="{xx-3:.1f}" y="{qy-7:.1f}" width="6" height="7"/>')
    b.append(f'<rect class="k-ink" x="{x0-jt-mt-18}" y="{ax-9}" width="18" height="9"/>')
    b.append(f'<rect class="k-ink" x="{xr+jt}" y="{ax-9}" width="18" height="9"/>')

    # top labels
    b.append(leader(x0 - jt - mt + 3, top - 12, x0 - 60, 112, [("Moat", "k-th"), "0.5 m of water over the", "sides and front cap"], anchor="end"))
    b.append(leader(x0 + (0.195 + 3 * 0.42) * s, qy - 8, x0 + 1.0 * s, 112, [("Quays and station rings", "k-th"), "nine glide lanes leave from the rim"]))
    b.append(leader(xr + jt / 2, top - 8, xr + 40, 112, [("Hydrogen jacket", "k-th"), "50 m at 20 K, drawn thick"]))
    # inside labels
    b.append(lines(x0 + 1.25 * s, y(1.05), [("The Hollow", "k-th"), "park and civic heart, 3 km across;", "0.5 g floor, weightless at the axis"], dy=16))
    b.append(leader(x0 + 2.7 * s, ax - 3, x0 + 2.55 * s, y(0.55), [("Sunline", "k-th"), "stops ~450 m short of each end"]))
    b.append(leader(x0 + 0.2 * s, ax - 6, x0 + 0.55 * s, y(0.32), [("Flying halls", "k-th"), "the Spindle's ends, under 3% g"]))
    b.append(leader(x0 + 0.88 * L * s, y(2.3), x0 + 0.80 * L * s, y(2.3), [("Lift core", "k-tm")], anchor="end"))
    # left and right of the drum
    b.append(lines(28, y(2.0), [("Front", "k-th"), "faces the Lantern", "and its X-rays"], dy=16))
    b.append(f'<path class="k-sink" stroke-width="1.5" d="M30,{y(1.55):.1f} L{x0-40},{y(1.55):.1f}" marker-end="url(#ds-arr)"/>')
    b.append(f'<path class="k-sacc" stroke-width="2.5" d="M30,{ax-4} L{x0-jt-mt-24},{ax-4}" marker-end="url(#ds-arr)"/>')
    b.append(lines(28, ax + 24, [("Power in", "k-th"), "at the front axle,", "~160 GW of the cell's", "~340 GW"], dy=16))
    b.append(f'<path class="k-swater" stroke-width="2.5" d="M{xr+jt+22},{ax-4} L{W-40},{ax-4}" marker-end="url(#ds-arr)"/>')
    b.append(lines(xr + 40, ax + 24, [("Heat out", "k-th"), "at the back axle, as", "ammonia to the raft's", "radiator panels"], dy=16))
    # district key on the right
    KX = xr + 46
    ky = [top - 4, top + 52, y(2.17) - 12, y(1.65) - 12]
    for (lo, hi, cls, name, sub, what), yy in zip(bands, ky):
        mid = y((lo + hi) / 2)
        b.append(f'<path class="k-lead" d="M{xr+jt+2},{mid:.1f} L{KX-8},{yy+10:.1f}"/>')
        b.append(lines(KX, yy + 14, [(name, "k-th"), (sub, "k-tm"), (what, "k-tm")], dy=15))
    b.append(lines(KX, y(1.5) + 40, [("Out is down", "k-th"), ("gravity rises toward", "k-tm"), ("the rim; the Hollow is up", "k-tm")], dy=15))
    # scale and note
    b.append(f'<line class="k-sink" x1="{x0}" y1="{H-30}" x2="{x0+s}" y2="{H-30}" stroke-width="2"/>')
    b.append(text(x0 + s / 2, H - 40, "1 km", "k-tm", "middle"))
    b.append(text(x0 + s + 24, H - 26, "Thin lines: the fifteen line decks that carry the Lattice's tubes. Dark verticals: lift cores.", "k-tm"))
    svg("drum-section", W, H, "A nation drum, cut along its axis",
        "The top half of a 3 km nation drum: the Keel at the rim, Low, Middle and High decks, the Hollow with its "
        "sunline and the flying halls at the Spindle's ends, the hydrogen jacket and water moat, power in at the front "
        "axle and heat out at the back.", b)


# ---------------------------------------------------------------------------
def raft_cell():
    """A raft in side section, distances to scale (raft-habitat.md: How a drum
    sits in its cell; raft-transport.md: Setting)."""
    W, H = 1000, 430
    s = 15.0  # px per km
    top = 186
    depth = 3.75 * s
    bot = top + depth
    left, right = 40, W - 40
    centres = [180, 180 + 24.5 * s, 180 + 49 * s]
    b = []
    b.append(text(28, 42, "A raft in section", "k-ttl"))
    b.append(text(28, 64, "A slice through one row of nation drums. To scale: drums 24.5 km apart, 6 km across, 3.75 km tall.", "k-tm"))
    # Lantern side
    b.append(text(left, 96, "From the Lantern, 85–130° across the sky: microwaves (dotted) and a leak of hard X-rays (violet)", "k-tm"))
    for i in range(12):
        xx = left + 20 + i * 52
        b.append(f'<path class="k-xray" stroke-width="1.2" d="M{xx},{112} l-7,20 l7,4 l-7,20" opacity="0.75"/>')
    for i in range(12):
        xx = left + 46 + i * 52
        b.append(f'<line class="k-sacc" x1="{xx}" y1="112" x2="{xx}" y2="{top-8}" stroke-width="2" stroke-dasharray="2 4"/>')
    # layers
    b.append(f'<rect class="k-fraft" x="{left}" y="{top-4}" width="{right-left}" height="4"/>')
    for i in range(0, int((right - left) / 40)):
        xx = left + i * 40
        b.append(f'<path class="k-line" d="M{xx},{top} L{xx+20},{bot} L{xx+40},{top}" stroke-width="0.8"/>')
    for i in range(9):
        yy = top + (0.195 + i * 0.42) * s
        b.append(f'<line class="k-line" x1="{left}" y1="{yy:.1f}" x2="{right}" y2="{yy:.1f}" stroke-width="0.8" stroke-dasharray="6 4"/>')
    for i in range(int((right - left) / 10)):
        xx = left + i * 10
        b.append(f'<line class="k-raft" x1="{xx}" y1="{bot+1}" x2="{xx+7}" y2="{bot+9}" stroke-width="2"/>')
    for c in centres:
        w = 6.1 * s
        b.append(f'<rect class="k-water" x="{c-w/2-1.5:.1f}" y="{top}" width="{w+3:.1f}" height="{depth:.1f}" rx="2"/>')
        b.append(f'<rect class="k-h2" x="{c-w/2+1:.1f}" y="{top+1.5}" width="{w-2:.1f}" height="{depth-1.5:.1f}" rx="2"/>')
        b.append(f'<rect class="k-deck2" x="{c-3*s:.1f}" y="{top+2.5}" width="{6*s:.1f}" height="{depth-3:.1f}"/>')
        b.append(f'<rect class="k-sky" x="{c-1.5*s:.1f}" y="{top+4}" width="{3*s:.1f}" height="{depth-7:.1f}"/>')
        b.append(f'<line class="k-sacc" x1="{c}" y1="{top+10}" x2="{c}" y2="{bot-10}" stroke-width="2"/>')
    for c in centres[:2]:
        b.append(f'<rect class="k-swater" x="{c+120:.1f}" y="{top+12}" width="30" height="16" stroke-width="3"/>')
        b.append(f'<rect class="k-sink" x="{c+240:.1f}" y="{top+30}" width="30" height="16" stroke-width="1.5"/>')
    # spacing dimension
    dy_ = bot + 30
    b.append(f'<path class="k-sink" stroke-width="1" d="M{centres[0]},{dy_-5} v10 M{centres[0]},{dy_} H{centres[1]} M{centres[1]},{dy_-5} v10"/>')
    b.append(text((centres[0] + centres[1]) / 2, dy_ - 6, "24.5 km: one drum's cell, ~600 km² for ~200 M people", "k-tm", "middle"))
    # label row
    ly = bot + 76
    c0, c1, c2 = centres
    b.append(leader(c0 - 30, bot - 18, left + 10, ly, [("A drum stands in its cell", "k-th"), "axis toward the Lantern, power in", "at the front cap, heat out the back"]))
    b.append(leader(c0 + 135, top + 20, 310, ly, [("Data halls", "k-th"), "in water-walled vaults: the", "X-rays kill bare chips in hours"]))
    b.append(leader(c0 + 255, top + 38, 540, ly, [("The Yards", "k-th"), "industry and recycling,", "~58 GW a cell"]))
    b.append(leader(c2 - 70, bot + 6, 750, ly, [("Back: radiators", "k-th"), "~3 m² a person; this, not the", "rectennas, sets the raft's size"]))
    b.append(leader(c1 - 70, top + (0.195 + 0.42 * 6) * s, 760, 128, [("Glide lanes", "k-th"), "nine levels, dashed"]))
    b.append(text(left, H - 24, "Between the layers lies the mid-raft, 3.75 km deep: truss, power lines, glide lanes, tubes, data halls and Yards, all in the X-ray flood.", "k-tm"))
    svg("raft-cell", W, H, "A raft in section",
        "Side section of a raft: rectennas in front facing the Lantern, radiators behind, and the 3.75 km mid-raft "
        "between them, where nation drums stand 24.5 km apart among glide lanes, data halls and Yards.", b)


# ---------------------------------------------------------------------------
def glide():
    """The Glide seen from the Lantern (raft-transport.md: The Glide). Drums and
    spacing to scale."""
    W, H = 1000, 640
    s = 8.0  # px per km
    R = 3.05 * s  # quay radius
    gap = 24.5 * s
    ox, oy = 130, 200
    cols, rows = 3, 2
    b = ['<defs><marker id="gl-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="k-ink"/></marker>'
         '<marker id="gl-arra" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="k-acc"/></marker></defs>']
    b.append(text(28, 42, "The Glide", "k-ttl"))
    b.append(text(28, 64, "Nation drums on a raft, seen from the Lantern. All spin the same way, so neighbours share tangent lines. To scale.", "k-tm"))
    b.append(f'<rect class="k-faint" x="{ox-gap/2:.1f}" y="{oy-gap/2:.1f}" width="{gap:.1f}" height="{gap:.1f}"/>')
    xa, xb = ox - gap / 2 + 8, ox + (cols - 1) * gap + gap / 2 - 8
    ya, yb = oy - gap / 2 + 8, oy + (rows - 1) * gap + gap / 2 - 8
    for r in range(rows):
        for sg in (-1, 1):
            yy = oy + r * gap + sg * R
            b.append(f'<line class="k-line" x1="{xa:.1f}" y1="{yy:.1f}" x2="{xb:.1f}" y2="{yy:.1f}" stroke-width="1" stroke-dasharray="5 4"/>')
    for c in range(cols):
        for sg in (-1, 1):
            xx = ox + c * gap + sg * R
            b.append(f'<line class="k-line" x1="{xx:.1f}" y1="{ya:.1f}" x2="{xx:.1f}" y2="{yb:.1f}" stroke-width="1" stroke-dasharray="5 4"/>')
    for r in range(rows):
        for c in range(cols):
            cx, cy = ox + c * gap, oy + r * gap
            b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{R+1.5:.1f}" class="k-water"/>')
            b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{3.0*s:.1f}" class="k-deck2"/>')
            b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{1.5*s:.1f}" class="k-sky"/>')
            rr = R + 8
            b.append(f'<path class="k-sink" stroke-width="1.3" d="M{cx-rr*0.71:.1f},{cy-rr*0.71:.1f} A{rr},{rr} 0 0 1 {cx+rr*0.71:.1f},{cy-rr*0.71:.1f}" marker-end="url(#gl-arr)"/>')
    # one glide, top of drum A to top of drum B
    ax_, ay_ = ox, oy - R
    bx_ = ox + gap
    b.append(f'<line class="k-sacc" x1="{ax_:.1f}" y1="{ay_:.1f}" x2="{bx_-8:.1f}" y2="{ay_:.1f}" stroke-width="3" marker-end="url(#gl-arra)"/>')
    b.append(f'<circle cx="{ax_:.1f}" cy="{ay_:.1f}" r="4.5" class="k-acc"/><circle cx="{bx_:.1f}" cy="{ay_:.1f}" r="4.5" class="k-acc"/>')
    b.append(text((ax_ + bx_) / 2, ay_ - 26, "let go here, caught there:", "k-t", "middle"))
    b.append(text((ax_ + bx_) / 2, ay_ - 10, "24.5 km in 140 s at 174 m/s", "k-th", "middle"))
    b.append(text(ox + gap, oy + R + 22, "bottom lanes run the other way", "k-tm", "middle"))
    cx3 = ox + 2 * gap + R
    b.append(f'<line class="k-sink" x1="{cx3:.1f}" y1="{oy+R+12:.1f}" x2="{cx3:.1f}" y2="{oy+gap-R-14:.1f}" stroke-width="1.5" marker-end="url(#gl-arr)"/>')
    b.append(lines(cx3 + 8, oy + gap / 2 - 4, [("columns", "k-tm"), ("work the same", "k-tm")], dy=14))
    b.append(lines(ox - gap / 2 + 8, oy + gap / 2 - 22, [("one cell:", "k-tm"), ("~600 km²,", "k-tm"), ("~200 M people", "k-tm")], dy=14))
    # inset at the bottom
    iy = 560
    b.append(text(40, iy - 46, "At the touch point (not to scale)", "k-th"))
    ix = 150
    b.append(f'<path class="k-sink" stroke-width="2" d="{arc(ix, iy+240, 240, 116, 64)}"/>')
    b.append(f'<line class="k-line" x1="{ix-120}" y1="{iy}" x2="{ix+150}" y2="{iy}" stroke-width="1" stroke-dasharray="5 4"/>')
    b.append(f'<rect class="k-acc" x="{ix-9}" y="{iy-8}" width="18" height="10" rx="3"/>')
    b.append(f'<line class="k-sacc" x1="{ix+14}" y1="{iy-3}" x2="{ix+90}" y2="{iy-3}" stroke-width="2" marker-end="url(#gl-arra)"/>')
    b.append(text(ix - 30, iy + 34, "the rim curves away under the car at ~1 g", "k-tm"))
    b.append(lines(ix + 170, iy - 6, [("The car keeps the rim's speed and flies straight on.", "k-tm"), ("Gravity switches off in about a second.", "k-tm")], dy=15))
    # explanation column
    X = 690
    b.append(lines(X, 110, [
        ("How a glide works", "k-th"),
        "A spinning rim moves along its own tangent.",
        "Two drums spinning the same way share their",
        "outer tangents, and where a line touches each",
        "rim, that rim moves along it at the same speed.",
        "So a car let go at one touch point coasts",
        "straight to the next and arrives at exactly the",
        "speed of the rim it meets. The first drum's",
        "spin slows by the car's momentum and the",
        "second's speeds up by as much: nothing is lost.",
        "",
        ("At the quay", "k-th"),
        "A cradle lets the car go at the touch point.",
        "At the far end a cradle takes it on a soft,",
        "regenerative arm and brings gravity back.",
        "A missed catch isn't a crash: the lane grazes",
        "the next drum in the row 140 s later.",
        "",
        ("Reach, door to door", "k-th"),
        "~80 drums, 1.6 × 10¹⁰ people, in 20 minutes;",
        "~1,100 drums, 2.2 × 10¹¹, in an hour.",
    ], dy=17))
    svg("glide", W, H, "The Glide",
        "Top view of six nation drums on a raft, spinning the same way, with the shared tangent lanes along rows and "
        "columns; a car let go at one drum's rim coasts 24.5 km to the next in 140 seconds.", b)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    lantern_shade()
    drum_section()
    raft_cell()
    glide()
    print("wrote", sorted(p.name for p in OUT.glob("*.svg")))
