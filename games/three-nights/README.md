# Three Nights Anywhere

A browser game set on the raft Merrow. You are on your wander year: pick a home drum on Herb Row, then cross the raft on guest-right, three nights a drum, and send cards home.

Play it on the world-bible site at **https://jeff87654.github.io/Kerr-swarm/three-nights/**. There is also a claude.ai artifact version, where Claude can answer for the locals you meet and draft your cards. On the site those two features are hidden and everything else works.

## What's in it

- **Every drum is generated from its grid address** (about 547,700 drums a side), so the same drum is always the same nation. Each has its own Ledger or Count, rules, customs, history, reputation, notices, people, tonight's events, places to eat, Hollow and dawn.
- **Sixteen canon drums are written by hand** from the docs in [`src/15-canon.js`](src/15-canon.js): Sorrel, Lovage, Tansy, Chervil, Rue, Yarrow and Borage on Herb Row, and the drums of [`wander-year.md`](../../docs/wander-year.md) (Sloe, Kittiwake, Gloaming, Squall, Carillon, Dulse, Madder, Ochre, Spelt).
- **The twelve canon rows are placed** by `tools/solve_rows.py`, so the wander-year legs and light delays come out right. For example, Dulse is 36.9 s from Chervil.
- **Travel follows the docs:** a 140 s free glide between neighbours, and cyclers priced by speed squared (`raft-transport.md`). Your wallet comes from the 21.6 kWh a day.
- **Views are drawn live:** the Hollow is a WebGL ray-traced cylinder with terraced end walls; the Glide and the Window are drawn too. The ambient sound is synthesised.

**Canon status:** the generated rows, drums, customs and people are *not* canon. They were written to fit the docs (see [`content/brief.md`](content/brief.md)), but the docs win when they disagree. Ideas worth keeping should be written into `docs/` on purpose.

## Layout

- `src/page.html`: markup and CSS.
- `src/*.js`: the code, concatenated in name order:
  - `10-world`: the grid, rows and names;
  - `15-canon`: the hand-written drums;
  - `20-drum`: drum dossiers;
  - `3x-render-*`: the views;
  - `40-game`: state, time and travel;
  - `50-ui`: the interface;
  - `55-audio`: sound;
  - `60-ai`: the Claude features;
  - `70-main`: start-up and actions.
- `content/*.json`: the writing pools, filled into slot templates like `{drum}` and `{nb}`. `content/_themes_T*.json` holds the 128 row themes, their drum names, neighbourhoods and streets.
- `content/brief.md`: the canon brief the content writers worked from.
- `tools/`: the build, the row solver and test helpers.

## Building

```
python tools/build.py                      # dist/three-nights.html (artifact page), dist/test.html, dist/content.json
python tools/build.py --standalone DIR     # also DIR/index.html, a full web page
```

The world-bible site build (`site/build.py`) runs the standalone build into `_site/three-nights/` and links it from the home page and sidebar.

## Testing

- `dist/test.html?run=begin,glide-r,skip,hollow` plays a scripted run (steps listed in `tools/test-script.js`) and shows any errors at the bottom of the page. It is handy with headless Chrome (`--use-angle=swiftshader --enable-unsafe-swiftshader`, and a fresh `--user-data-dir`).
- `tools/phone.html` loads the test page in a 390 px frame.
- `node tools/sample_drums.js [x,y ...]` prints drum dossiers as text; `node tools/rule_dist.js` prints rule and kind distributions. Both need a build first, for `dist/content.json`.
- `python tools/solve_rows.py` re-solves the canon row placement into `tools/rows_solved.json`. Copy the result into `CANON_ROW_ANCHORS` in `src/10-world.js`.
