# Backlog

Ideas and TODOs for later. Not planned yet; move an item into the work when it's picked up.

## TODO
- **Quick Maths: more varied problems.** More variety in the equations; at higher levels maybe answers over 100,
  negative numbers, or a third number in the problem (e.g. 7 × 4 − 9).
- **Line Tracing: consider a rework.** More levels; lives and failing instead of just allowing another try; keep the
  tracks about equally long (path length now varies about ±9 % between runs, which is layout luck).
- **Eye for Geometry: tune the limits for fairer, more consistent runs.** Each task's 0 % limit is its own design choice
  (8–50 % of the figure, 10–25°), so some tasks score much higher than others. First data (one player, 10 runs on
  2026-11-14): Make X° ~95 % (too easy), Size ~51 % and Zigzag ~65 % (too hard, scores swing a lot). Plan: collect 5–10
  runs of the current version (results were reset on 2026-11-14; per-task % are saved under the fixed short names), then
  either use one kind of limit per group (e.g. one angle limit for all angle tasks) or tune each task to a similar
  average (~75 %), or a mix. Then a scoring-reviewer run on the 2-per-group mix.

## Later
- **A finer score for every test.** Span tests (Number Memory, Number Order, Sequence Memory, Pattern Memory) score whole
  levels, so many players tie (7 digits: ~25 % of simulated players). N-Back adds a lives bonus in steps of 20
  (480 = ended at 4-back with exactly 0 lives). Decided 2026-11-13 to keep whole levels for now, because the score matches the
  goal you had; revisit with one approach for all tests.
- **"Typical / very good" ranges on the result screen**, from research values (approximate, for a browser with a mouse):

  | Test | Typical | Very good | Source |
  |---|---|---|---|
  | Reaction Time | 230–300 ms | under 220 ms | Woods et al. 2015 (lab mean 231 ms), plus ~20–60 ms browser/mouse delay |
  | Tap Speed | ~5–6 / s | 7+ / s | Finger Tapping Test norms (~4–6 taps/s with a finger key) |
  | Quick Count | 75–85 % | 88 %+ | estimate from typical Weber fractions (~0.15–0.25), not norms |
  | Time Estimation | 5–10 % off | under 4 % | with counting allowed |
  | Sequence Memory | span ~6 | | Corsi span ≈ 6 (Kessels et al. 2000) |
  | Number Memory | 6–7 digits | | forward digit span 7 ± 2, likely higher here (visual, chunking) |
  | Flash Order | | ~200 ms (~15 rounds) | Inoue & Matsuzawa 2007, practiced humans |

- **Number Memory → Backward Span.** Decided 2026-11-16: Backward Span (prototype) will replace Number Memory as the
  digit-span test (it measures working memory, closer to the WAIS). Keep Number Memory until then.
- **Password Memory** (idea, 2026-11-16, could take Number Memory's place as a lighter memory game): a "password" is
  shown, then you "confirm" it by typing it. Each round the password gets more complex (longer; then mixed case, digits,
  symbols; maybe word-like parts that can be chunked vs random strings). Open: a fun but fair difficulty curve (how
  much length vs character mix per round), how long it's shown, scoring in readable units (e.g. longest password /
  characters), and keyboard vs on-screen input (the mouse must always work, so an on-screen keyboard, with the physical
  keyboard recommended).

- **Spot the Difference** (idea, 2026-11-16): two pictures side by side, one (or a few) things differ; click the
  change as fast as you can. Research: comparative visual search (Pomplun et al.) and, as a variant, the flicker
  paradigm of change blindness (Rensink et al. 1997: one picture alternates with its changed version, a blank between).
  Tests search and comparison speed, not memory (both pictures stay visible), so Focus. Open: generated scenes (shapes
  on a grid) vs drawn ones, keeping difficulty even between runs (time depends a lot on the scene, so luck), how many
  rounds, and the overlap with Odd One Out (also visual search).

## New test ideas
From the test-auditor sweep (2026-11-13), each a well-known paradigm no test covers yet
(prototyped 2026-11-15; Choice reaction and Flanker dropped after play-testing, Task switching became the Advent
Calendar idea):
- **Choice reaction** (Hick's law): react to one of 2–4 signals; reaction time grows with the number of choices. Speed.
- **Flanker** (Eriksen): say which way the middle arrow points while the arrows around it point the same or the other
  way. Focus.
- **Task switching** (Trail Making B style): alternate between two rules, e.g. 1-A-2-B-3-C. Focus.
- **Visual search**: find the odd one out among many similar shapes. Focus.
- **Backward span**: repeat digits or tiles in reverse order. Memory.
- **Change detection**: a set of colored squares, a short blank, then: did one change? Visual working-memory capacity.
  Memory.
- **Digit–symbol substitution**: match symbols to digits with a key, as many as you can. Processing speed. Speed.
