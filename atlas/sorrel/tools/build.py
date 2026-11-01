"""Assemble the Sorrel Atlas into one HTML file.

    python tools/build.py                    # dist/sorrel-atlas.html (artifact page) + dist/index.html (standalone)
    python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
    python tools/build.py --check            # validate the content only

Content comes from content/*.json; code from src/*.js (concatenated in name order) and src/page.html.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, "content")
S = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")

ZONES = {"outside", "keel", "line", "deck", "hollow", "wall", "spindle", "axle", "beyond"}
KINDS = {"home", "civic", "eat", "water", "green", "work", "make", "culture", "play", "rites"}
LINE_FIRST = [13, 38, 63, 88, 113, 138, 163, 188, 213, 238, 263, 288, 313, 338, 363]
LINE_DECKS = {d for f in LINE_FIRST for d in (f, f + 1)}
BANNED = ["testament to", "tapestry", "bustling", "nestled", "whispers of", "symphony of", "vibrant",
          "hum of life", "in a world where", "delve", "realm", "beacon", "labyrinthine", "a dance of"]


def load(name, default):
    """Load content/<name>, merged with any part files content/<stem>-*.json (lists join, dicts merge)."""
    stem = name[:-5]
    paths = [os.path.join(C, name)] if os.path.exists(os.path.join(C, name)) else []
    paths += sorted(glob.glob(os.path.join(C, stem + "-[0-9]*.json")))
    if not paths:
        print(f"  missing {name}: using a stand-in")
        return default
    out = None
    for p in paths:
        with open(p, encoding="utf-8") as f:
            part = json.load(f)
        if out is None:
            out = part
        elif isinstance(out, list) and isinstance(part, list):
            out += part
        elif isinstance(out, dict) and isinstance(part, dict):
            for k, v in part.items():
                if isinstance(v, list) and isinstance(out.get(k), list):
                    out[k] += v
                else:
                    out[k] = v
    return out


def strings(x):
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for v in x.values():
            yield from strings(v)
    elif isinstance(x, list):
        for v in x:
            yield from strings(v)


def check_text(label, obj, warn):
    for s in strings(obj):
        if "—" in s or "–" in s and not re.search(r"\d–\d", s):
            warn(f"{label}: dash in {s[:70]!r}")
        low = s.lower()
        for b in BANNED:
            if b in low:
                warn(f"{label}: banned phrase {b!r} in {s[:70]!r}")


def check_places(places, warn):
    ids = set()
    for p in places:
        pid = p.get("id", "?")
        if pid in ids:
            warn(f"duplicate id {pid}")
        ids.add(pid)
        for k in ("id", "name", "kind", "zone", "text"):
            if not p.get(k):
                warn(f"{pid}: missing {k}")
        if p.get("zone") not in ZONES:
            warn(f"{pid}: bad zone {p.get('zone')}")
        if p.get("kind") not in KINDS:
            warn(f"{pid}: bad kind {p.get('kind')}")
        z = p.get("zone")
        d = p.get("deck")
        if z in ("keel", "line", "deck"):
            if not isinstance(d, int):
                warn(f"{pid}: zone {z} needs a deck")
            elif z == "keel" and not (1 <= d <= 15):
                warn(f"{pid}: keel deck {d}")
            elif z == "line" and d not in LINE_FIRST:
                warn(f"{pid}: line deck {d} is not the first of a pair")
            elif z == "deck" and (not (16 <= d <= 375) or d in LINE_DECKS):
                warn(f"{pid}: residential deck {d}")
        if z not in ("beyond", "axle") and not p.get("ring"):
            warn(f"{pid}: no ring")
        n = len((p.get("text") or "").split())
        if n < 40 or n > 170:
            warn(f"{pid}: text is {n} words")
        check_text(pid, p, warn)


def main():
    args = sys.argv[1:]
    warnings = []
    warn = warnings.append

    places = []
    for f in sorted(glob.glob(os.path.join(C, "places-*.json"))):
        with open(f, encoding="utf-8") as fh:
            part = json.load(fh)
        print(f"  {os.path.basename(f)}: {len(part)} places")
        places += part
    data = {
        "places": places,
        "hours": load("hours.json", []),
        "rings": load("rings.json", []),
        "names": load("names.json", {}),
        "genA": load("gen-places-a.json", {}),
        "genB": load("gen-places-b.json", {}),
        "life": load("gen-life.json", {}),
        "keel": load("gen-keel.json", []),
        "line": load("gen-line.json", []),
        "hollow": load("gen-hollow.json", {}),
        "tours": load("tours.json", []),
    }
    ids = {p.get("id") for p in places}
    for t in data["tours"]:
        for s in t.get("stops", []):
            sid = s.get("id") if isinstance(s, dict) else s
            if sid not in ids:
                warn(f"tour {t.get('id')}: unknown stop {sid}")
    check_places(places, warn)
    for k in ("hours", "rings", "genA", "genB", "life", "keel", "line", "hollow"):
        check_text(k, data[k], warn)
    for k, v in (data["genA"] | data["genB"] | data["life"]).items() if isinstance(data["genA"], dict) else []:
        print(f"  pool {k}: {len(v)}")
    print(f"  {len(places)} landmarks in all; {len(warnings)} warnings")
    for w in warnings[:80]:
        print("   ! " + w)
    if "--check" in args:
        return

    with open(os.path.join(S, "page.html"), encoding="utf-8") as f:
        page = f.read()
    code = []
    for f in sorted(glob.glob(os.path.join(S, "*.js"))):
        with open(f, encoding="utf-8") as fh:
            code.append(fh.read())
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    page = page.replace("/*__DATA__*/", "const ATLAS_DATA = " + blob + ";")
    page = page.replace("/*__CODE__*/", "\n".join(code).replace("</script", "<\\/script"))

    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, "sorrel-atlas.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style>\n'
            '</head>\n<body>\n' + page + '\n</body>\n</html>\n')
    with open(os.path.join(DIST, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(full)
    print(f"  wrote dist/sorrel-atlas.html ({len(page) // 1024} KB) and dist/index.html")
    if "--standalone" in args:
        out = args[args.index("--standalone") + 1]
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, "index.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(full)
        print(f"  wrote {out}/index.html")


if __name__ == "__main__":
    main()
