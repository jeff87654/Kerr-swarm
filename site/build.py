"""Build the Kerr swarm world bible: a static website generated from docs/.

    pip install -r site/requirements.txt
    python3 site/build.py            # writes _site/
    python3 site/build.py --out DIR

The markdown in docs/ and the README's doc list are the only content. This
script adds navigation, a table of contents per page, links wherever one doc
names another (habitat-design.md) or one of its own sections ("see The moat"),
glossary links on each term's first mention, backlinks, search, and the
diagrams in docs/diagrams/ inlined so they follow the site's theme.
"""
import argparse
import datetime as dt
import html
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

from markdown_it import MarkdownIt

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
ASSETS = Path(__file__).resolve().parent / "assets"
REPO = os.environ.get("GITHUB_REPOSITORY", "jeff87654/Kerr-swarm")
BRANCH = os.environ.get("SITE_BRANCH", "main")
SITE_NAME = "Kerr swarm"
FONTS = ("https://fonts.googleapis.com/css2?family=Public+Sans:ital,wght@0,400;0,600;0,700;1,400"
         "&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap")


# ---------------------------------------------------------------- helpers
def esc(s):
    return html.escape(s, quote=True)


def slugify(s):
    s = s.lower().replace("*", "")
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_]+", "-", s).strip("-") or "section"


def strip_md(s):
    """Markdown to plain text, roughly, for search and tooltips."""
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)
    s = re.sub(r"[*_`]+", "", s)
    s = s.replace("\\", "")
    s = re.sub(r"^\s*[-|#>]+\s*", "", s, flags=re.M)
    s = re.sub(r"\|", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def git_sha():
    sha = os.environ.get("GITHUB_SHA")
    if sha:
        return sha[:7]
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True).strip()
    except Exception:
        return "local"


# ---------------------------------------------------------------- game
GAME = ROOT / "games" / "three-nights"


def build_game(out):
    """Build Three Nights Anywhere into out/three-nights/. Returns True if built."""
    script = GAME / "tools" / "build.py"
    if not script.is_file():
        return False
    subprocess.run([sys.executable, str(script), "--standalone", str(out / "three-nights")],
                   check=True, stdout=subprocess.DEVNULL)
    return True


# ---------------------------------------------------------------- atlas
ATLAS = ROOT / "atlas" / "sorrel"


def build_atlas(out):
    """Build the Sorrel Atlas into out/sorrel-atlas/. Returns True if built."""
    script = ATLAS / "tools" / "build.py"
    if not script.is_file():
        return False
    subprocess.run([sys.executable, str(script), "--standalone", str(out / "sorrel-atlas")],
                   check=True, stdout=subprocess.DEVNULL)
    return True


# ---------------------------------------------------------------- README
def parse_readme():
    """Intro, canon decisions, and the doc groups from the README."""
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    parts = re.split(r"^## ", text, flags=re.M)
    head = parts[0]
    sections = {p.split("\n", 1)[0].strip(): p.split("\n", 1)[1] for p in parts[1:]}
    intro = re.sub(r"^# .*\n", "", head).strip()
    canon = sections.get("Canon decisions", "").strip()
    groups, current = [], None
    for line in sections.get("Docs", "").splitlines():
        m = re.match(r"^\*\*(.+?)\*\*\s*$", line.strip())
        if m:
            current = {"name": m.group(1), "docs": []}
            groups.append(current)
            continue
        m = re.match(r"^\s*-\s*\[([^\]]+)\]\(docs/([\w-]+)\.md\)\s*:?\s*(.*)$", line)
        if m and current is not None:
            current["docs"].append({"slug": m.group(2), "blurb": m.group(3).strip()})
    return intro, canon, groups


# ---------------------------------------------------------------- docs
class Doc:
    def __init__(self, path):
        self.path = path
        self.slug = path.stem
        self.src = path.read_text(encoding="utf-8")
        m = re.search(r"^# (.+)$", self.src, flags=re.M)
        self.title = m.group(1).strip() if m else self.slug
        body = self.src[m.end():] if m else self.src
        # leading italic paragraphs (provenance, scope) before the first section
        notes = []
        rest = body.lstrip("\n")
        while True:
            m2 = re.match(r"(\*[^\n]+\*)\s*(\n\n|\n?$)", rest)
            if not m2 or rest.startswith("**"):
                break
            notes.append(m2.group(1))
            rest = rest[m2.end():].lstrip("\n")
        self.notes = notes
        self.body = rest
        self.headings = [h.strip() for h in re.findall(r"^#{2,3} (.+)$", self.body, flags=re.M)]
        self.words = len(re.findall(r"\w+", strip_md(self.src)))
        self.blurb = ""
        self.group = None

    @property
    def href(self):
        return f"{self.slug}.html"


def load_docs():
    docs = {}
    for p in sorted(DOCS.glob("*.md")):
        docs[p.stem] = Doc(p)
    return docs


# ---------------------------------------------------------------- glossary
def parse_glossary(doc):
    """Terms from docs/glossary.md: categories (##), terms (###), Matches: lines."""
    if doc is None:
        return [], []
    intro, cats, cur_cat, cur = [], [], None, None
    blocks = []
    for block in re.split(r"\n\s*\n", doc.body.strip()):
        # a heading may run straight into its first paragraph
        first, _, rest = block.strip().partition("\n")
        if first.startswith("#") and rest.strip():
            blocks.extend([first, rest.strip()])
        else:
            blocks.append(block.strip())
    for block in blocks:
        if block.startswith("## "):
            cur_cat = {"name": block[3:].strip(), "terms": []}
            cats.append(cur_cat)
            cur = None
        elif block.startswith("### "):
            name = block[4:].strip()
            cur = {"name": name, "id": slugify(name), "paras": [], "matches": []}
            if cur_cat is None:
                cur_cat = {"name": "Terms", "terms": []}
                cats.append(cur_cat)
            cur_cat["terms"].append(cur)
        elif block.startswith("Matches:") and cur is not None:
            cur["matches"] = [x.strip() for x in block[len("Matches:"):].split(",") if x.strip()]
        elif cur is not None:
            cur["paras"].append(block)
        elif cur_cat is None:
            intro.append(block)
    terms = [t for c in cats for t in c["terms"]]
    for t in terms:
        if not t["matches"]:
            t["matches"] = [re.sub(r"^The ", "", t["name"])]
        elif [m.lower() for m in t["matches"]] == ["none"]:
            t["matches"] = []
        plain = strip_md(" ".join(t["paras"]))
        plain = re.sub(r"\s*See [\w.,\s-]+\.md\.?\s*$", "", plain)
        t["plain"] = plain
        t["tip"] = plain if len(plain) <= 240 else plain[:237].rsplit(" ", 1)[0] + "…"
    return intro, cats


def term_regex(terms):
    """One regex for all glossary terms. Capitalised matches are case-sensitive;
    lower-case ones match any case. Longest first, so 'Mill table' beats 'Mill'."""
    alts = []
    for t in terms:
        for m in t["matches"]:
            alts.append((m, t))
    alts.sort(key=lambda x: -len(x[0]))
    lookup = {}
    parts = []
    for i, (m, t) in enumerate(alts):
        pat = re.escape(m)
        if not any(c.isupper() for c in m):
            pat = f"(?i:{pat})"
        parts.append(f"(?P<t{i}>{pat})")
        lookup[f"t{i}"] = t
    if not parts:
        return None, {}
    rx = re.compile(r"(?<![\w-])(?:" + "|".join(parts) + r")(?![\w-])")
    return rx, lookup


# ---------------------------------------------------------------- markdown
class Renderer:
    def __init__(self, docs, terms):
        self.docs = docs
        self.terms = terms
        self.term_rx, self.term_lookup = term_regex(terms)
        self.md = MarkdownIt("commonmark", {"html": False, "typographer": False}).enable("table").enable("strikethrough")
        self.md.renderer.rules["text"] = self.r_text
        self.md.renderer.rules["image"] = self.r_image
        self.md.renderer.rules["table_open"] = lambda *a: '<div class="table-wrap"><table>\n'
        self.md.renderer.rules["table_close"] = lambda *a: "</table></div>\n"
        self.md.renderer.rules["link_open"] = self.r_link_open
        self.md.renderer.rules["code_inline"] = self.r_code
        self.doc_rx = re.compile(r"(?<![\w/-])(?:claude/)?([a-z0-9][a-z0-9-]*)\.md\b")
        self.figures = []

    # -- per page state
    def render(self, src, page_slug, headings=None, link_terms=True):
        self.page = page_slug
        self.linked_terms = set()
        self.link_terms = link_terms
        self.slugs = {}
        self.toc = []
        self.section_rx = None
        self.heading_ids = {}
        if headings:
            hs = sorted({h for h in headings if len(h) >= 4}, key=len, reverse=True)
            if hs:
                alt = "|".join(re.escape(h) for h in hs)
                self.section_rx = re.compile(r"(?:\b(see) (" + alt + r")(?!\w)|\((" + alt + r")\))")
        tokens = self.md.parse(src)
        self.prepare(tokens)
        return self.md.renderer.render(tokens, self.md.options, {})

    def prepare(self, tokens):
        in_heading = False
        for i, tok in enumerate(tokens):
            if tok.type == "heading_open":
                in_heading = True
                inline = tokens[i + 1]
                text = strip_md(inline.content)
                base = slugify(text)
                n = self.slugs.get(base, 0)
                self.slugs[base] = n + 1
                hid = base if n == 0 else f"{base}-{n}"
                tok.attrSet("id", hid)
                if tok.tag in ("h2", "h3"):
                    self.toc.append((int(tok.tag[1]), text, hid))
                self.heading_ids.setdefault(text, hid)
            elif tok.type == "heading_close":
                in_heading = False
            elif tok.type == "paragraph_open":
                inline = tokens[i + 1]
                kids = [k for k in (inline.children or []) if not (k.type == "text" and not k.content.strip())]
                if len(kids) == 1 and kids[0].type == "image":
                    tok.hidden = True
                    tokens[i + 2].hidden = True
                    kids[0].meta["figure"] = True
            if tok.type == "inline" and tok.children:
                depth = 0
                for ch in tok.children:
                    if ch.type == "link_open":
                        depth += 1
                    elif ch.type == "link_close":
                        depth -= 1
                    elif ch.type == "text":
                        ch.meta["auto"] = depth == 0 and not in_heading

    def heading_href(self, text):
        hid = self.heading_ids.get(text) or slugify(text)
        return f"#{hid}"

    def r_text(self, tokens, idx, options, env):
        tok = tokens[idx]
        content = tok.content
        if not tok.meta.get("auto"):
            return esc(content)
        out, pos = [], 0
        spans = []
        for m in self.doc_rx.finditer(content):
            if m.group(1) in self.docs:
                spans.append((m.start(), m.end(), "doc", m))
        if self.section_rx:
            for m in self.section_rx.finditer(content):
                spans.append((m.start(), m.end(), "sec", m))
        if self.term_rx and self.link_terms:
            for m in self.term_rx.finditer(content):
                spans.append((m.start(), m.end(), "term", m))
        spans.sort(key=lambda x: (x[0], -(x[1] - x[0])))
        for start, end, kind, m in spans:
            if start < pos:
                continue
            piece = None
            if kind == "doc":
                slug = m.group(1)
                d = self.docs[slug]
                cls = "xref self" if slug == self.page else "xref"
                piece = f'<a class="{cls}" href="{d.href}" title="{esc(d.title)}">{esc(m.group(0))}</a>'
            elif kind == "sec":
                if m.group(1):
                    piece = f'{m.group(1)} <a class="secref" href="{self.heading_href(m.group(2))}">{esc(m.group(2))}</a>'
                else:
                    piece = f'(<a class="secref" href="{self.heading_href(m.group(3))}">{esc(m.group(3))}</a>)'
            elif kind == "term":
                t = self.term_lookup[m.lastgroup]
                if t["id"] in self.linked_terms:
                    continue
                self.linked_terms.add(t["id"])
                piece = (f'<a class="term" href="glossary.html#{t["id"]}" data-tip="{esc(t["tip"])}" '
                         f'data-term="{esc(t["name"])}">{esc(m.group(0))}</a>')
            if piece is None:
                continue
            out.append(esc(content[pos:start]))
            out.append(piece)
            pos = end
        out.append(esc(content[pos:]))
        return "".join(out)

    def r_code(self, tokens, idx, options, env):
        """`full-swarm.md` or `element-cycles` in code links to that doc."""
        c = tokens[idx].content
        slug = re.sub(r"\.md$", "", c.strip())
        code = f"<code>{esc(c)}</code>"
        if slug in self.docs and slug != self.page:
            return f'<a class="codelink" href="{self.docs[slug].href}">{code}</a>'
        return code

    def r_link_open(self, tokens, idx, options, env):
        tok = tokens[idx]
        href = tok.attrGet("href") or ""
        m = re.match(r"^(?:\.\./)?(?:docs/)?([\w-]+)\.md(#.*)?$", href)
        if m and m.group(1) in self.docs:
            tok.attrSet("href", f"{m.group(1)}.html{m.group(2) or ''}")
        elif href.startswith("http"):
            tok.attrSet("rel", "noopener")
        elif href and not href.startswith(("#", "mailto:")):
            # other repo files (site/README.md, docs/diagrams/) open on GitHub
            path = href if self.page == "index" else f"docs/{href}"
            tok.attrSet("href", f"https://github.com/{REPO}/tree/{BRANCH}/{path.lstrip('./')}")
        return self.md.renderer.renderToken(tokens, idx, options, env)

    def r_image(self, tokens, idx, options, env):
        tok = tokens[idx]
        src = tok.attrGet("src") or ""
        alt = "".join(c.content for c in (tok.children or []))
        title = tok.attrGet("title") or ""
        path = (DOCS / src).resolve()
        inner = None
        if src.endswith(".svg") and path.is_file() and DOCS in path.parents:
            svg = path.read_text(encoding="utf-8")
            svg = re.sub(r"^<\?xml[^>]*>\s*", "", svg)
            inner = svg
            self.figures.append({"src": src, "alt": alt, "title": title, "page": self.page})
        else:
            inner = f'<img src="{esc(src)}" alt="{esc(alt)}" loading="lazy">'
        if not tok.meta.get("figure"):
            return inner
        cap = f"<figcaption>{esc(title or alt)} <a href=\"{esc(src)}\">Open full size</a></figcaption>"
        return f'<figure class="diagram">{inner}{cap}</figure>\n'


# ---------------------------------------------------------------- page shell
def nav_html(groups, current):
    out = ['<nav class="sidenav" id="sidenav" aria-label="Docs">']
    out.append(f'<a class="nav-home{" is-current" if current == "index" else ""}" href="index.html">Overview</a>')
    for g in groups:
        out.append(f'<div class="nav-group"><p class="nav-label">{esc(g["name"])}</p><ul>')
        for d in g["docs"]:
            cur = ' aria-current="page" class="is-current"' if d.slug == current else ""
            out.append(f'<li><a href="{d.href}"{cur}>{esc(d.title)}</a></li>')
        if g["name"] == "Reference":
            cur = ' aria-current="page" class="is-current"' if current == "diagrams" else ""
            out.append(f'<li><a href="diagrams.html"{cur}>Diagrams</a></li>')
        out.append("</ul></div>")
    if (ATLAS / "tools" / "build.py").is_file():
        out.append('<div class="nav-group"><p class="nav-label">Explore</p><ul><li><a href="sorrel-atlas/">The Sorrel Atlas</a></li></ul></div>')
    if (GAME / "tools" / "build.py").is_file():
        out.append('<div class="nav-group"><p class="nav-label">Play</p><ul><li><a href="three-nights/">Three Nights Anywhere</a></li></ul></div>')
    out.append("</nav>")
    return "".join(out)


def page(title, body, groups, current, desc="", toc=None, fragment=False, extra_head=""):
    toc_html = ""
    if toc:
        items = "".join(
            f'<li class="lvl{lvl}"><a href="#{hid}">{esc(txt)}</a></li>' for lvl, txt, hid in toc
        )
        toc_html = f'<aside class="toc" aria-label="On this page"><p class="nav-label">On this page</p><ul>{items}</ul></aside>'
    full_title = f"{SITE_NAME} world bible" if title == SITE_NAME else f"{title} · {SITE_NAME}"
    head = (
        f'<title>{esc(full_title)}</title>'
        '<meta name="claude:viewport-fit-sides" content="cover">'
        f'<meta name="description" content="{esc(desc)}">'
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        f'<link rel="stylesheet" href="{FONTS}">'
        '<link rel="stylesheet" href="assets/style.css">'
        + extra_head
    )
    shell = f"""<div class="site">
<header class="topbar">
  <div class="topbar-inner">
    <button class="menu-btn" id="menu-btn" aria-controls="sidenav" aria-expanded="false" type="button">Contents</button>
    <a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true"></span>{SITE_NAME}<span class="brand-sub">world bible</span></a>
    <button class="search-btn" id="search-btn" type="button" aria-haspopup="dialog"><span>Search the docs</span><kbd>/</kbd></button>
  </div>
</header>
<div class="layout{' has-toc' if toc else ''}">
{nav_html(groups, current)}
<main class="content" id="content">
{body}
</main>
{toc_html}
</div>
<div class="search" id="search" hidden>
  <div class="search-panel" role="dialog" aria-modal="true" aria-label="Search">
    <input id="search-input" type="search" placeholder="Search terms, numbers, places…" autocomplete="off" aria-label="Search the docs">
    <ol id="search-results" class="search-results"></ol>
    <p class="search-hint">Enter opens the first result · Esc closes</p>
  </div>
</div>
<div class="tip" id="tip" role="tooltip" hidden></div>
</div>
<script src="assets/app.js"></script>"""
    if fragment:
        return head + "\n" + shell + "\n"
    return (
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        + head + "\n</head>\n<body>\n" + shell + "\n</body>\n</html>\n"
    )


def doc_footer(doc, backlinks, prev_doc, next_doc, sha):
    parts = []
    if backlinks:
        links = ", ".join(f'<a href="{b.href}">{esc(b.title)}</a>' for b in backlinks)
        parts.append(f'<section class="backlinks"><h2 class="mini">Docs that cite this one</h2><p>{links}</p></section>')
    pn = []
    if prev_doc:
        pn.append(f'<a class="pn prev" href="{prev_doc.href}"><span>Previous</span>{esc(prev_doc.title)}</a>')
    else:
        pn.append("<span></span>")
    if next_doc:
        pn.append(f'<a class="pn next" href="{next_doc.href}"><span>Next</span>{esc(next_doc.title)}</a>')
    parts.append(f'<nav class="prevnext" aria-label="Previous and next">{"".join(pn)}</nav>')
    parts.append(
        f'<p class="source">Source: <a href="https://github.com/{REPO}/blob/{BRANCH}/docs/{doc.slug}.md">docs/{doc.slug}.md</a>'
        f' · {doc.words:,} words · built from <code>{sha}</code></p>'
    )
    return "\n".join(parts)


# ---------------------------------------------------------------- build
def build(out, fragment_index=False):
    intro, canon, groups = parse_readme()
    docs = load_docs()
    gdoc = docs.get("glossary")
    g_intro, g_cats = parse_glossary(gdoc)
    if gdoc is not None and gdoc.notes:
        g_intro = gdoc.notes[:1] + g_intro
    terms = [t for c in g_cats for t in c["terms"]]
    rnd = Renderer(docs, terms)
    sha = git_sha()

    # groups from the README, then any doc it doesn't list
    listed = set()
    for g in groups:
        g["docs"] = [dict(d, doc=docs[d["slug"]]) for d in g["docs"] if d["slug"] in docs]
        for d in g["docs"]:
            d["doc"].blurb = d["blurb"]
            d["doc"].group = g["name"]
            listed.add(d["slug"])
        g["docs"] = [d["doc"] for d in g["docs"]]
    extra = [d for s, d in docs.items() if s not in listed and s != "glossary"]
    if gdoc is not None and "glossary" not in listed:
        extra.append(gdoc)
        gdoc.blurb = "short definitions of the setting's named things"
    if extra:
        for d in extra:
            d.group = "Reference"
        ref = next((g for g in groups if g["name"] == "Reference"), None)
        if ref:
            ref["docs"].extend(extra)
        else:
            groups.append({"name": "Reference", "docs": extra})
    order = [d for g in groups for d in g["docs"]]

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    shutil.copytree(ASSETS, out / "assets")
    if (DOCS / "diagrams").is_dir():
        shutil.copytree(DOCS / "diagrams", out / "diagrams")
    game = build_game(out)
    atlas = build_atlas(out)

    # backlinks
    cites = {s: set() for s in docs}
    for s, d in docs.items():
        for m in rnd.doc_rx.finditer(d.src):
            t = m.group(1)
            if t in docs and t != s:
                cites[t].add(s)

    search = []

    # doc pages
    for i, d in enumerate(order):
        if d.slug == "glossary":
            continue
        body_html = rnd.render(d.body, d.slug, d.headings)
        toc = rnd.toc
        notes_html = ""
        if d.notes:
            first = rnd.render(d.notes[0].strip("*"), d.slug, link_terms=False)
            notes_html = (f'<details class="notes"><summary>About this doc: sources and revisions</summary>{first}</details>')
            for n in d.notes[1:]:
                notes_html += f'<div class="scope">{rnd.render(n.strip("*"), d.slug, link_terms=False)}</div>'
        backs = [docs[s] for s in sorted(cites[d.slug], key=lambda s: order.index(docs[s]) if docs[s] in order else 99)]
        prev_doc = next((x for x in reversed(order[:i]) if x.slug != "glossary"), None)
        next_doc = next((x for x in order[i + 1:] if x.slug != "glossary"), None)
        mins = max(1, round(d.words / 230))
        header = (
            f'<header class="doc-head"><p class="eyebrow">{esc(d.group or "")}</p>'
            f'<h1>{esc(d.title)}</h1>'
            + (f'<p class="dek">{esc(d.blurb[:1].upper() + d.blurb[1:])}.</p>' if d.blurb else "")
            + f'<p class="meta">{mins} min read · {len([t for t in toc if t[0] == 2])} sections</p>'
            + notes_html + "</header>"
        )
        html_out = page(d.title, f'<article class="doc">{header}<div class="prose">{body_html}</div>'
                        f'{doc_footer(d, backs, prev_doc, next_doc, sha)}</article>',
                        groups, d.slug, desc=d.blurb, toc=toc)
        (out / d.href).write_text(html_out, encoding="utf-8")
        # search records, one per h2 section
        for sec in re.split(r"(?=^## )", d.body, flags=re.M):
            hm = re.match(r"## (.+)", sec)
            htxt = hm.group(1).strip() if hm else ""
            anchor = slugify(strip_md(htxt)) if htxt else ""
            txt = strip_md(sec[hm.end():] if hm else sec)
            if txt:
                search.append({"u": d.href + (f"#{anchor}" if anchor else ""), "t": d.title, "h": htxt, "x": txt})

    # glossary
    if gdoc is not None:
        uses = {}
        for t in terms:
            counts = []
            for d in order:
                if d.slug == "glossary":
                    continue
                n = 0
                for mt in t["matches"]:
                    flags = 0 if any(c.isupper() for c in mt) else re.I
                    n += len(re.findall(r"(?<![\w-])" + re.escape(mt) + r"(?![\w-])", d.src, flags))
                if n:
                    counts.append((n, d))
            counts.sort(key=lambda x: -x[0])
            uses[t["id"]] = counts
        blocks = []
        for c in g_cats:
            items = []
            for t in c["terms"]:
                defs = "".join(rnd.render(p, "glossary", link_terms=False) for p in t["paras"])
                us = uses[t["id"]]
                use_html = ""
                if us:
                    links = " ".join(f'<a href="{d.href}">{esc(d.title.split(":")[0])}<span class="n">{n}</span></a>' for n, d in us)
                    use_html = f'<div class="uses"><span class="nav-label">Used in</span>{links}</div>'
                items.append(f'<div class="entry" id="{t["id"]}" data-name="{esc(t["name"].lower())}"><h3>{esc(t["name"])}</h3>{defs}{use_html}</div>')
                search.append({"u": f"glossary.html#{t['id']}", "t": "Glossary", "h": t["name"], "x": t["plain"]})
            blocks.append(f'<section class="gcat"><h2 id="{slugify(c["name"])}">{esc(c["name"])}</h2>{"".join(items)}</section>')
        jump = "".join(f'<a href="#{slugify(c["name"])}">{esc(c["name"])}</a>' for c in g_cats)
        intro_html = rnd.render(g_intro[0].strip("*"), "glossary", link_terms=False) if g_intro else ""
        body = (
            f'<article class="doc glossary"><header class="doc-head"><p class="eyebrow">Reference</p><h1>Glossary</h1>'
            f'<div class="dek">{intro_html}</div>'
            f'<label class="gfilter"><span class="visually-hidden">Filter terms</span><input id="gfilter" type="search" placeholder="Filter {len(terms)} terms…"></label>'
            f'<nav class="jump" aria-label="Categories">{jump}</nav></header>'
            f'<div class="prose">{"".join(blocks)}</div>'
            f'<p class="source">Source: <a href="https://github.com/{REPO}/blob/{BRANCH}/docs/glossary.md">docs/glossary.md</a>. '
            f'Edit the definitions there; the "Used in" counts are worked out from the docs at build time.</p></article>'
        )
        (out / "glossary.html").write_text(
            page("Glossary", body, groups, "glossary", desc="Definitions of the setting's named things"), encoding="utf-8")

    # diagrams gallery
    figs, seen = [], set()
    for f in rnd.figures:
        if f["src"] in seen:
            continue
        seen.add(f["src"])
        figs.append(f)
    if figs:
        cards = []
        for f in figs:
            svg = (DOCS / f["src"]).read_text(encoding="utf-8")
            used = sorted({g["page"] for g in rnd.figures if g["src"] == f["src"] and g["page"] in docs},
                          key=lambda s: order.index(docs[s]) if docs[s] in order else 99)
            links = ", ".join(f'<a href="{docs[s].href}">{esc(docs[s].title)}</a>' for s in used)
            cards.append(f'<figure class="diagram">{svg}<figcaption>{esc(f["title"] or f["alt"])} '
                         f'<span class="used">In {links}.</span></figcaption></figure>')
        body = ('<article class="doc"><header class="doc-head"><p class="eyebrow">Reference</p><h1>Diagrams</h1>'
                '<p class="dek">Every diagram in the docs, in one place. They live in docs/diagrams/ and are drawn by site/make_diagrams.py.</p></header>'
                f'<div class="prose">{"".join(cards)}</div></article>')
        (out / "diagrams.html").write_text(page("Diagrams", body, groups, "diagrams", desc="Diagrams of the Lantern, the Shade, rafts and drums"), encoding="utf-8")

    # home
    intro_html = rnd.render(intro.split("\n\n")[0], "index", link_terms=False)
    canon_html = rnd.render(canon, "index", link_terms=False)
    hero_fig = ""
    if (DOCS / "diagrams" / "lantern-shade.svg").is_file():
        hero_fig = ('<figure class="diagram hero-fig">' + (DOCS / "diagrams" / "lantern-shade.svg").read_text(encoding="utf-8")
                    + '<figcaption>The Lantern and the Shade, to scale. <a href="full-swarm.html#layout">Read the layout</a></figcaption></figure>')
    group_html = []
    for g in groups:
        cards = []
        for d in g["docs"]:
            mins = max(1, round(d.words / 230))
            blurb = esc(d.blurb[:1].upper() + d.blurb[1:]) if d.blurb else ""
            cards.append(f'<li><a class="card" href="{d.href}"><span class="card-title">{esc(d.title)}</span>'
                         f'<span class="card-blurb">{blurb}</span><span class="card-meta">{mins} min</span></a></li>')
        group_html.append(f'<section class="topic"><h2 id="{slugify(g["name"])}">{esc(g["name"])}</h2><ul class="cards">{"".join(cards)}</ul></section>')
    extra_links = []
    if figs:
        extra_links.append('<li><a class="card" href="diagrams.html"><span class="card-title">Diagrams</span>'
                           f'<span class="card-blurb">All {len(figs)} diagrams in one place</span><span class="card-meta">gallery</span></a></li>')
    if atlas:
        extra_links.append('<li><a class="card" href="sorrel-atlas/"><span class="card-title">The Sorrel Atlas</span>'
                           '<span class="card-blurb">A cutaway of one drum of 200 million, where every point opens a place: landmarks from the quay to the axle, and all 69,426 neighbourhoods</span>'
                           '<span class="card-meta">explore</span></a></li>')
    if game:
        extra_links.append('<li><a class="card" href="three-nights/"><span class="card-title">Three Nights Anywhere</span>'
                           '<span class="card-blurb">A game: wander Merrow for a year on guest-right, three nights a drum, and send cards home</span>'
                           '<span class="card-meta">play</span></a></li>')
    if extra_links:
        group_html.append(f'<section class="topic"><h2 id="more">More</h2><ul class="cards">{"".join(extra_links)}</ul></section>')
    total = sum(d.words for d in order)
    body = (
        '<article class="home">'
        '<header class="home-head"><p class="eyebrow">World bible</p><h1>The Kerr swarm</h1>'
        f'<div class="lede">{intro_html}</div>'
        f'<p class="meta">{len(order)} docs · {total:,} words · built from <code>{sha}</code> on {dt.date.today().isoformat()}</p></header>'
        f'{hero_fig}'
        f'<section class="canon"><h2 id="canon-decisions">Canon decisions</h2>{canon_html}</section>'
        + "".join(group_html) + "</article>"
    )
    (out / "index.html").write_text(
        page(SITE_NAME, body, groups, "index", desc="A far-future human civilization around a fed Kerr black hole",
             fragment=fragment_index), encoding="utf-8")

    (out / "search.json").write_text(json.dumps(search, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out / ".nojekyll").write_text("", encoding="utf-8")
    print(f"built {len(order)} docs, {len(terms)} glossary terms, {len(figs)} diagrams into {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(ROOT / "_site"))
    ap.add_argument("--fragment-index", action="store_true",
                    help="write index.html without <html>/<head> (for previews that add their own)")
    a = ap.parse_args()
    build(Path(a.out), a.fragment_index)
