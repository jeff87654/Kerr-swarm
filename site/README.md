# World bible site

A static website built from `docs/`. The markdown is the only content: the site adds navigation, search and links, and is rebuilt on every push to `main` by `.github/workflows/pages.yml`, then published with GitHub Pages at https://jeff87654.github.io/Kerr-swarm/.

## What the build adds

- **Navigation** from the README's doc list (its groups and one-line descriptions), so add a new doc there and it appears in the sidebar and on the home page. A doc the README doesn't list lands under "Reference".
- **Cross-links.** Any mention of another doc (`habitat-design.md`, with or without backticks) links to it, and "see The moat" or "(Growth at 30%)" links to that section of the same doc. Each page lists the docs that cite it.
- **Glossary links.** Each term in `docs/glossary.md` is linked on its first mention on every page, with its definition on hover. The glossary page counts how often each doc uses each term.
- **Search** over every section, in the browser, from `search.json`.
- **Diagrams.** Images in `docs/diagrams/` referenced from a doc (`![alt](diagrams/x.svg "caption")`) are inlined so they follow the site's light or dark theme, and gathered on a Diagrams page.
- **Doc notes.** A doc's opening italic paragraph (sources and revisions) folds into an "About this doc" box.

## Editing

- **Docs:** edit `docs/*.md` as usual. Nothing else needs to change.
- **Glossary:** each entry in `docs/glossary.md` is a `###` heading, a definition and an optional `Matches:` line naming the words to link. Entries with no capital letters match any case; `Matches: none` turns linking off for that entry.
- **Diagrams:** they are drawn by `site/make_diagrams.py`, which writes `docs/diagrams/*.svg`. Change the numbers there and rerun it: `python3 site/make_diagrams.py`.

## Building locally

```
pip install -r site/requirements.txt
python3 site/build.py              # writes _site/
python3 -m http.server -d _site    # search needs a web server, not file://
```

## Publishing

GitHub Pages has to be switched on once: repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. The `github-pages` environment only accepts deployments from the default branch, so `main` should be the default branch.
