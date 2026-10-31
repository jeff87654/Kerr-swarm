"""Assemble Three Nights Anywhere into one HTML file: dist/three-nights.html

    python tools/build.py                       # dist/three-nights.html (artifact page) + dist/test.html
    python tools/build.py --standalone DIR      # also DIR/index.html, a full page for any web server

Content comes from content/*.json. While writers are still working, part files
(content/_*.json) are merged as a fallback, and tiny stand-ins fill any gap.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = os.path.join(ROOT, "content")
S = os.path.join(ROOT, "src")


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def parts(pattern):
    return sorted(glob.glob(os.path.join(C, pattern)))


def themes():
    p = os.path.join(C, "themes.json")
    if os.path.exists(p):
        return load(p)
    th = []
    nb = {"neighbourhoods": [], "streets": []}
    for f in parts("_themes_T*.json"):
        d = load(f)
        th += d.get("themes", [])
        nb["neighbourhoods"] += d.get("neighbourhoods", [])
        nb["streets"] += d.get("streets", [])
    for f in parts("_themes_part*.json"):
        th += load(f)
    for f in parts("_nb_streets*.json"):
        d = load(f)
        nb["neighbourhoods"] += d.get("neighbourhoods", [])
        nb["streets"] += d.get("streets", [])
    if not th:
        print("  themes: stand-in")
        canon = {
            "herb": ("Herb Row", "Sorrel Tansy Lovage Chervil Rue Yarrow Borage Dill Fennel Sage Thyme Basil Mint Marjoram Savory Hyssop Angelica Bergamot Chamomile Comfrey Feverfew Woodruff Costmary Shiso Coriander Chive Parsley Rosemary Lavender Oregano Tarragon Caraway Anise Burnet Purslane Mugwort Calamint Catmint Vervain Valerian Betony Germander Orache Sweet-Cicely Lemonbalm Southernwood Wormwood Horehound Selfheal Elecampane"),
            "hedge": ("Hedge Row", "Sloe Blackthorn Hawthorn Bramble Dogrose Elder Hazel Holly Bullace Damson Guelder Privet Dogwood Crab Wayfarer Maple Briar Rowan Spurge Teasel Campion Vetch Cleaver Nettle Burdock Bryony Hips Haw Medlar Cobnut Filbert Mayblossom Whitebeam Wildpear Cherry Plum Gorse Broom Ivy Honeysuckle Clematis Hop Woodbine Sallow Osier Alder Aspen Linden Yew Box Laurel"),
        }
        for k in ["gull", "weather", "bell", "kelp", "pigment", "thimble", "grain", "cooper", "kite", "quill", "moth", "knot", "tide", "loom"]:
            names = {"gull": "Kittiwake", "weather": "Gloaming Squall", "bell": "Carillon", "kelp": "Dulse", "pigment": "Madder Ochre", "grain": "Spelt"}.get(k, "")
            canon[k] = (k.capitalize() + " Row", (names + " " + " ".join(k.capitalize() + str(i) for i in range(60))).strip())
        th = [{"id": k, "row": v[0], "about": "A stand-in row.", "names": v[1].split()} for k, v in canon.items()]
    if not nb["neighbourhoods"]:
        nb["neighbourhoods"] = ["Ashgrove", "Larchmere", "Netherby", "Saltings", "Wickham", "Fernside", "Brightwater", "Kilnhouse", "Tallow Yard", "Ropewalk"]
        nb["streets"] = ["the Long Arcade", "Pear Street", "Lamp Walk", "Tallow Lane", "Spinward Parade"]
    return {"themes": th, "neighbourhoods": nb["neighbourhoods"], "streets": nb["streets"]}


def notices():
    p = os.path.join(C, "notices.json")
    if os.path.exists(p):
        return load(p)
    out = []
    for f in parts("_notices_part*.json"):
        out += load(f)
    if not out:
        print("  notices: stand-in")
        out = [{"t": "FOUND on the {time} to {nb}: one crock of starter. Collect at the Ring {ring} Gate.", "cat": "found", "k": ["any"]},
               {"t": "SWAP: two-room flat on deck {deck} for anything nearer the Court.", "cat": "swap", "k": ["any"]},
               {"t": "WANTED: tenor for the {block} choir.", "cat": "music", "k": ["any"]},
               {"t": "Back crew hiring at Ring {ring}. Sign for the dose at the clinic first.", "cat": "work", "k": ["any"]}]
    return out


def people():
    p = os.path.join(C, "people.json")
    if os.path.exists(p):
        return load(p)
    out = {"given": [], "surnames": [], "roles": [], "greetings": [], "farewells": []}
    for f in parts("_people_names*.json"):
        d = load(f)
        out["given"] += d.get("given", [])
        out["surnames"] += d.get("surnames", [])
    for f in parts("_people_roles*.json"):
        out["roles"] += load(f)
    for f in parts("_people_misc*.json"):
        d = load(f)
        out["greetings"] += d.get("greetings", [])
        out["farewells"] += d.get("farewells", [])
    return out


def flavour():
    p = os.path.join(C, "flavour.json")
    if os.path.exists(p):
        return load(p)
    out = {"famous": {}, "customs": [], "broths": [], "rules": {}, "history": [], "reputations": [], "hollow": [], "dawns": [], "mottos": []}
    for f in parts("_flavour_*.json"):
        d = load(f)
        for k, v in d.items():
            if k == "famous":
                for kk, vv in v.items():
                    out["famous"].setdefault(kk, []).extend(vv)
            elif k == "rules":
                for kk, vv in v.items():
                    out["rules"].setdefault(kk, []).extend(vv)
            elif isinstance(v, list):
                out.setdefault(k, []).extend(v)
    return out


def events():
    p = os.path.join(C, "events.json")
    if os.path.exists(p):
        return load(p)
    out = {}
    for f in parts("_events_*.json"):
        key = re.sub(r"^_events_|\.json$|\d+$", "", os.path.basename(f))
        d = load(f)
        if isinstance(d, dict) and key not in ("festivals",):
            for k, v in d.items():
                if isinstance(v, list):
                    out.setdefault(k, []).extend(v)
                else:
                    out[k] = v
        elif key == "festivals":
            out["festivals"] = d
        else:
            out.setdefault(key, []).extend(d)
    return out


def food():
    p = os.path.join(C, "food.json")
    if os.path.exists(p):
        return load(p)
    out = {"places": [], "dishes": [], "counter": [], "hallnights": []}
    for f in parts("_food_places*.json"):
        out["places"] += load(f)
    for f in parts("_food_*.json"):
        if "places" in f:
            continue
        d = load(f)
        if isinstance(d, dict):
            for k, v in d.items():
                out.setdefault(k, []).extend(v)
    return out


SKELETON = ('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
            '<style>:root{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')


def main():
    args = sys.argv[1:]
    standalone = None
    if "--standalone" in args:
        i = args.index("--standalone")
        standalone = args[i + 1]
        del args[i:i + 2]
    out_name = args[0] if args else "three-nights.html"
    content = {"themes": themes(), "notices": notices(), "people": people(), "flavour": flavour(), "events": events(), "food": food()}
    for k, v in content.items():
        if isinstance(v, dict):
            print("  %-8s %s" % (k, {kk: (len(vv) if hasattr(vv, "__len__") else vv) for kk, vv in v.items()}))
        else:
            print("  %-8s %d" % (k, len(v)))
    page = open(os.path.join(S, "page.html"), encoding="utf-8").read()
    js = []
    for f in sorted(glob.glob(os.path.join(S, "*.js"))):
        js.append("/* ==== %s ==== */\n" % os.path.basename(f) + open(f, encoding="utf-8").read())
    blob = json.dumps(content, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    blob = blob.replace("chilli", "chili").replace("Chilli", "Chili")
    html = page + "\n<script>\nconst CONTENT = " + blob + ";\n" + "\n".join(js) + "\n</script>\n"
    os.makedirs(os.path.join(ROOT, "dist"), exist_ok=True)
    with open(os.path.join(ROOT, "dist", "content.json"), "w", encoding="utf-8") as f:
        f.write(blob.replace("<\/", "</"))
    dest = os.path.join(ROOT, "dist", out_name)
    with open(dest, "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", dest, "%.0f KB" % (len(html.encode("utf-8")) / 1024))
    # a local test copy with a real document wrapper and an optional scripted run
    test_js = ""
    tp = os.path.join(ROOT, "tools", "test-script.js")
    if os.path.exists(tp):
        test_js = "<script>\n" + open(tp, encoding="utf-8").read() + "\n</script>"
    with open(os.path.join(ROOT, "dist", "test.html"), "w", encoding="utf-8") as f:
        f.write(SKELETON + html + test_js + "</body></html>")
    # a plain web page (the world-bible site serves this); the Claude features stay hidden there
    if standalone:
        os.makedirs(standalone, exist_ok=True)
        dest = os.path.join(standalone, "index.html")
        with open(dest, "w", encoding="utf-8") as f:
            f.write(SKELETON + html + "</body></html>")
        print("wrote", dest)


if __name__ == "__main__":
    main()
