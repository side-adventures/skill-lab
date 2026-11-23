# Spot the Difference — scene lab

Generator for the Spot the Difference scenes, plus tools to check them. Not part of the app build; the test itself
will get a TypeScript version of the scenes in `src/tests/spot-difference/`.

## Files
- `scenes/part-a.js` … `part-f.js` — the 13 scenes, shared helpers, the hat/hair/colour rules and `AUTOG` (copies that
  form a group). Each scene is `gadd(name, sub, gen)`; each item kind is `K[kind] = {draw(p), muts(p, r)}`.
- `base.html` — page head: drawing helpers, people, and the change picker (`pickDiffs`, patched in `build.py`).
- `build.py` — builds everything into `out/` (ignored by git).

## Use
```
python3 scripts/spot-difference/build.py      # build out/
```
Then serve `out/` with the `spot-lab` launch config (port 5175):
- `scenes.html` — all scenes, New picture / New differences, Show toggle
- `size.html` — two pictures at true test size (768 × 512 stage), the 3 smallest changes
- `gallery.html?g=N`, `over.html`, `zoom.html?g=N&s=S&vb=…` — browsing and close-ups

## Checks
- `node scripts/spot-difference/check.cjs` — 300 pictures per scene with the lab default of 3 differences (the test uses 5:
  `pickDiffs(items, r, 5)`): always the full count, never 2 easy, no hitbox overlaps
- `node scripts/spot-difference/breakdown.cjs N [n] [free]` — share of pictures per item / group for scene N, with n
  differences (default 3); `free` = the last change may land anywhere again (`pickDiffs(items, r, n, { lastFree: true })`,
  as the test uses)
- `node scripts/spot-difference/xmlcheck.cjs` — writes `out/xml.json` (parse it to check every picture is valid SVG)
- `scripts/spot-difference/pixelcheck.sh "0 1 2" 10` — needs the `spot-lab` server: renders every change in headless
  Chrome and counts changed pixels (finds invisible / faint changes)
- Colour-blind check: `out/px.html?cvd=G&n=12` (headless, like `pixelcheck.sh`) lists changes that lose most of their
  contrast under a deuteranopia / protanopia simulation
- `scripts/spot-difference/shot.sh G S file.png [viewBox] [width]` — screenshot of one picture

Scene indices: 0 night city, 1 pond park, 2 space, 3 kitchen, 4 bookshelf, 5 living room, 6 garden, 7 forest hut,
8 aquarium, 9 winter village, 10 medieval town, 11 fantasy forest, 12 lab.
