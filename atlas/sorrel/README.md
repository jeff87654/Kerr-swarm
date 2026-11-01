# The Sorrel Atlas

An interactive cutaway of **Sorrel**, the nation drum of 200 million on Herb Row where the Daces live (`docs/ashgrove.md`). It exists to show how much one drum holds: every point on the drawing opens a place. Explore it on the world-bible site at **https://jeff87654.github.io/Kerr-swarm/sorrel-atlas/**; it is also published as a claude.ai artifact, https://claude.ai/artifact/Ngtk4xzrxyRhpozuWFUHAB (rebuild and republish `dist/sorrel-atlas.html` there to update it).

- **The drawing** is a half-section along the drum's axis at one **Hour**: the rim at the bottom (out is down), the Keel, the Low, Middle and High decks and fifteen line decks, the Hollow with its sunline, terraced end walls and flying halls, the axle halls, and outside: the jacket, the moat, the quay bands, the rectennas in front, the radiators and the Windows behind. Zoom in and the lift cores, every deck and the names of individual neighbourhoods appear. The lamp clock changes the Hollow's light and opens the Spindle at night.
- **Landmarks** (`content/places-*.json`) are hand-written to fit the world bible, from the quay to the axle, and listed under the drawing as **the Climb**, outside in.
- **Every other door** is generated from its address, so it always opens on the same place: Sorrel has 69,426 neighbourhoods (blocks of ~3,000 people, ~210 m on a side, five or six decks deep), plus the working blocks of the Keel and the line decks, the Hollow's floor and its terraces. Generated places are sketches, not canon.
- **Getting there:** every card gives a cab route from home (Ashgrove unless you choose another), using `docs/drum-transport.md`'s Lattice: gimballed cabs at 20 m/s in the cores, loops with direction-dependent limits, cross-lines at 30 m/s. Random trips come out at ~6.4 minutes on average, against the doc's ~6.2.
- **Walks** (`content/tours.json`) are hand-picked routes through the landmarks.

## Sorrel's geography (proposals)

Introduced here and written up in `docs/sorrel.md`:

- An address is **deck, Ring, Hour**: "seventy-seven, Three, Bee".
- Nine **Rings** along the axis, each named for the station ring beneath it. Ring 1 is the front (power) end, Ring 9 the back (heat) end. Rings 1, 3, 7 and 9 glide along Herb Row to Lovage and Tansy; 2, 4, 6 and 8 across the rows to Chervil and Rue; Ring 5 is the tube level for cyclers.
- Twelve **Hours** around the drum, counted spinward and named for animals nobody in Sorrel has seen: Hare, Heron, Owl, Bee, Fox, Otter, Stag, Swift, Badger, Moth, Wolf, Lark. Each Hour faces its opposite across the Hollow. Ashgrove is in Bee.
- **The Round**, the Hours' yearly race on the Round Arcade, right round deck 201, run spinward (the Heavy Round) and antispinward (the Light Round).

## Layout

- `src/page.html`: markup and CSS. `src/*.js`, concatenated in name order: `00-util`, `10-geo` (decks, Rings, Hours, strata and blocks), `20-gen` (landmarks and the generator), `30-route` (the Lattice), `40-map` (the drawing), `50-ui` (cards, search, the Climb, walks), `60-main`.
- `content/brief.md` and `content/gen-format.md`: the briefs the content was written from.
- `content/places-*.json`: landmarks. `hours.json`, `rings.json`: the twelve Hours and nine Rings. `names.json`: name pools. `gen-places-a.json`, `gen-places-b.json`, `gen-life.json`: the neighbourhood pools. `gen-keel.json`, `gen-line.json`, `gen-hollow.json`: pools for the Keel, line decks, the Hollow floor and terraces. `tours.json`: walks.

## Building

```
python tools/build.py                    # dist/sorrel-atlas.html (artifact page) and dist/index.html (standalone)
python tools/build.py --standalone DIR   # also DIR/index.html, for the world-bible site
python tools/build.py --check            # validate content only: ids, decks, rings, word counts, dashes, banned phrases
```

The world-bible site build (`site/build.py`) runs the standalone build into `_site/sorrel-atlas/`.

## Testing

- `dist/index.html?test=21:30` sets the lamp clock; `?test=zoom` zooms to Ashgrove; `?dark=1` forces the dark theme.
- `tools/phone.html` shows the page in two 390 px frames, light and dark.
- Headless Chrome works for screenshots (`--headless=new --use-angle=swiftshader --enable-unsafe-swiftshader` and a fresh `--user-data-dir`).
