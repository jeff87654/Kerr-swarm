# A Card from Every Row

An endless flight through the drums of Merrow. Each drum is a nation of two hundred million turning round its own small sun, and no two keep house the same way: one holds its noon for twelve hours and one lives in a dim wood where nobody speaks; one paints its dusks and one makes waves on its lake; one flies. The camera flies itself. Every world ends in an opening onto the next, drawn live through it, so a crossing has no cut.

Made after Ethan Mollick's [Portals](https://github.com/emollick/ai-portals), for this setting. Everything is generated in the browser as it flies: no pictures, models or recordings are loaded, and the sound is synthesised.

**Watch it** on the site: https://jeff87654.github.io/Kerr-swarm/every-row/

## Controls

Space pauses. The right arrow skips ahead to the way through. S turns the sound on. G lists the drums: pick one to go there. Q changes the picture quality (it adjusts itself otherwise). F is full screen. Moving the mouse shows the same as buttons.

Links: `?w=<id>` starts at a world; `?only=<id>` flies one world over and over.

## The worlds

In the journey's order, each with the line on its card. The cards are the ones Marit Vell sends home from her wander year (`docs/wander-year.md`), with a few more from Herb Row, where she lives.

<!-- worlds -->
<!-- /worlds -->

## What is canon and what is not

The drums, their rows, their customs and the people named are from the world bible's docs, and each world file names its sources. The docs say little about how any Hollow but Sorrel's is laid out, or what most drums look like indoors, so the plans, street names and furnishings of those places are this page's own. Each world file lists its inventions under "Not canon" at its top. Nothing here changes the docs.

Two liberties are taken for the picture's sake and are not claims about the setting: the air is given a very little haze over kilometres (the docs say heliox scatters almost no light), and the camera looks where it likes during a glide (a glide car's windows face aft).

## Running and building

```
python tools/serve.py            # then http://localhost:5210/        (dev.html?file=<name> flies one world file alone)
python tools/build.py            # dist/every-row.html (the artifact page) and dist/index.html (standalone), one file each
python tools/build.py --check    # the module rules, a syntax check and the writing rules, without building
node tools/shot.mjs --w sorrel-lake --t 0,10,20,30 --out out/x/s     # pictures, frame rates and errors, in headless Chrome
python tools/sheet.py out/x/s- out/x/sheet.png                         # a contact sheet
```

The page needs no install. The picture tools need `npm install` here once (puppeteer-core) and Chrome or Edge.

## How it is made

`ARCHITECTURE.md` is the contract: worlds are modelled flat and bent onto the drum when drawn; each is a generator that builds itself a few milliseconds at a time while the world before it is still on screen; the engine maps one world's exit onto the next world's entry and scales between them, so a doorway can open onto a Hollow. `content/brief.md` is the brief the worlds were built to.

- `src/core/` the engine, camera paths, the picture pipeline, sound
- `src/kit/` the drum's geometry, a geometry builder, light rigs and materials, the Hollow, the indoor city, the outside of the raft, trees and people
- `src/worlds/` one file per world, with its card
- three.js r170 (MIT) is vendored in `vendor/`; the fonts in `assets/fonts/` are under the SIL Open Font License
