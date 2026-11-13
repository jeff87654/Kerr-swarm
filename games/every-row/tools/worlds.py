"""List the worlds in the journey's order, from src/worlds/index.js and each world file's card.

  python tools/worlds.py            # print the list
  python tools/worlds.py --write    # put it in README.md between the two "worlds" marker comments
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORLDS = ROOT / "src" / "worlds"


def field(text, name):
    """The value of a string field of the card: name: '...' or "..." (the first one after the export)."""
    m = re.search(name + r""":\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)")""", text)
    if not m:
        return ""
    s = m.group(1) if m.group(1) is not None else m.group(2)
    return s.replace("\\'", "'").replace('\\"', '"')


def journey():
    index = (WORLDS / "index.js").read_text(encoding="utf-8")
    files = dict(re.findall(r"import \{ (\w+) \} from '\./(\w+)\.js';", index))
    order = re.search(r"export const WORLDS = \[(.*?)\];", index, re.S).group(1)
    out = []
    for name in re.findall(r"\b(\w+)\b", order):
        if name not in files:
            continue
        text = (WORLDS / (files[name] + ".js")).read_text(encoding="utf-8")
        card = text[text.index("export const " + name):]
        out.append({k: field(card, k) for k in ("id", "title", "drum", "row", "kind", "line")})
    return out


def markdown(worlds):
    lines = []
    for i, w in enumerate(worlds, 1):
        where = w["drum"] if not w["row"] or w["row"] in w["drum"] else f'{w["drum"]}, {w["row"]}'
        lines.append(f'{i}. **{w["title"]}** ({where}; `{w["id"]}`). "{w["line"]}"')
    return "\n".join(lines)


if __name__ == "__main__":
    md = markdown(journey())
    if "--write" in sys.argv:
        p = ROOT / "README.md"
        text = p.read_text(encoding="utf-8")
        a, b = "<!-- worlds -->", "<!-- /worlds -->"
        if a not in text or b not in text:
            sys.exit("README.md has no worlds markers")
        text = text[: text.index(a) + len(a)] + "\n" + md + "\n" + text[text.index(b):]
        p.write_text(text, encoding="utf-8", newline="\n")
        print(f"wrote {len(md.splitlines())} worlds to README.md")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(md)
