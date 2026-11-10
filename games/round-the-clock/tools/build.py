"""Assemble Round the Clock into one HTML file.

    python tools/build.py                    # dist/round-the-clock.html (artifact page) + dist/index.html (standalone)
    python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
    python tools/build.py --check            # validate only: clashing names between source files, and the writing rules
    python tools/build.py --only lark,otter --dist out/mine   # just those games, into another folder (for working on one)

Code comes from src/*.js (concatenated in name order) and src/page.html. The twelve Hours come from the
Sorrel Atlas (atlas/sorrel/content/hours.json: character, word, dish, club, saying, rivalry), joined with
this game's own content/hours.json (colours as hex, the host of each game and what they say).
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ROOT))
C = os.path.join(ROOT, "content")
S = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")
ATLAS_HOURS = os.path.join(REPO, "atlas", "sorrel", "content", "hours.json")

BANNED = ["testament to", "tapestry", "bustling", "nestled", "whispers of", "symphony of", "vibrant",
          "hum of life", "in a world where", "delve", "realm", "beacon", "labyrinthine", "a dance of"]

SKELETON = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
            'body{margin:0}[hidden]{display:none!important}</style>\n</head>\n<body>\n')


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def hours():
    """The atlas's twelve Hours, with this game's fields laid over them."""
    atlas = {h["n"]: h for h in load(ATLAS_HOURS)}
    out = []
    for mine in load(os.path.join(C, "hours.json")):
        h = dict(atlas[mine["n"]])
        h.pop("hex", None)
        h["club_long"] = h.pop("club", "")
        h.update(mine)
        out.append(h)
    out.sort(key=lambda h: h["n"])
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


def check_text(label, s, warn):
    if "—" in s or ("–" in s and not re.search(r"\d–\d", s)):
        warn(f"{label}: dash in {s[:80]!r}")
    if "!" in s:
        warn(f"{label}: exclamation mark in {s[:80]!r}")
    low = s.lower()
    for b in BANNED:
        if b in low:
            warn(f"{label}: banned phrase {b!r} in {s[:80]!r}")


TOP = re.compile(r"^(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", re.M)
STR = re.compile(r'"((?:[^"\\\n]|\\.){12,})"|\'((?:[^\'\\\n]|\\.){12,})\'|`((?:[^`\\]|\\.){12,})`')


def check_sources(files, warn):
    """Every file shares one script, so a name declared at the top level of two files breaks the page."""
    seen = {}
    for path in files:
        name = os.path.basename(path)
        with open(path, encoding="utf-8") as f:
            text = f.read()
        for m in TOP.finditer(text):
            ident = m.group(1)
            if ident in seen and seen[ident] != name:
                warn(f"{name}: top-level name {ident} is already declared in {seen[ident]}")
            seen.setdefault(ident, name)
        # the words a player reads: longer string literals with a space in them
        for m in STR.finditer(text):
            s = m.group(1) or m.group(2) or m.group(3)
            if " " in s and not s.strip().startswith(("#", "rgba", "http")) and "px " not in s and not re.search(r"[=;{}()<>$]|\|\||&&", s):
                if re.search(r"[A-Za-z]{3,} [A-Za-z]{2,}", s):
                    check_text(name, s.replace("\\'", "'"), warn)


def main():
    args = sys.argv[1:]
    warnings = []
    warn = warnings.append

    data = {"hours": hours()}
    for h in data["hours"]:
        for s in strings({k: h[k] for k in ("host", "lines", "keeps", "nick") if k in h}):
            check_text(f"hours.json {h['name']}", s, warn)
        if len(h.get("lines", [])) != 4:
            warn(f"hours.json {h['name']}: needs four lines (none, one, two, three knots)")

    files = sorted(glob.glob(os.path.join(S, "*.js")))
    if "--only" in args:
        # build with just some of the games, for working on one without the others: --only lark,otter
        keep = set(args[args.index("--only") + 1].split(","))
        is_game = re.compile(r"^[56]\d-([a-z]+)\.js$")
        files = [f for f in files if not is_game.match(os.path.basename(f)) or is_game.match(os.path.basename(f)).group(1) in keep]
    check_sources(files, warn)
    print(f"  {len(files)} source files, {len(data['hours'])} Hours; {len(warnings)} warnings")
    for w in warnings[:80]:
        print("   ! " + w)
    if "--check" in args:
        return 1 if warnings else 0

    with open(os.path.join(S, "page.html"), encoding="utf-8") as f:
        page = f.read()
    code = []
    for path in files:
        with open(path, encoding="utf-8") as f:
            code.append("/* ==== %s ==== */\n%s" % (os.path.basename(path), f.read()))
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    script = "const CONTENT = " + blob + ";\n" + "\n".join(code).replace("</script", "<\\/script")
    html = page + "\n<script>\n" + script + "\n</script>\n"

    dist = os.path.abspath(args[args.index("--dist") + 1]) if "--dist" in args else DIST
    os.makedirs(dist, exist_ok=True)
    with open(os.path.join(dist, "round-the-clock.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(html)
    full = SKELETON + html + "</body>\n</html>\n"
    with open(os.path.join(dist, "index.html"), "w", encoding="utf-8", newline="\n") as f:
        f.write(full)
    print(f"  wrote {os.path.relpath(dist, ROOT)}/round-the-clock.html ({len(html.encode('utf-8')) // 1024} KB) and index.html")
    if "--standalone" in args:
        out = args[args.index("--standalone") + 1]
        os.makedirs(out, exist_ok=True)
        with open(os.path.join(out, "index.html"), "w", encoding="utf-8", newline="\n") as f:
            f.write(full)
        print(f"  wrote {out}/index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main())
