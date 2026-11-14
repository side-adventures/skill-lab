# Backlog

Ideas and TODOs for later. Not planned yet; move an item into the work when it's picked up.

## TODO
- **Quick Maths: more varied problems.** More variety in the equations; at higher levels maybe answers over 100,
  negative numbers, or a third number in the problem (e.g. 7 × 4 − 9).
- **Line Tracing: consider a rework.** More levels; lives and failing instead of just allowing another try; keep the
  tracks about equally long (path length now varies about ±9 % between runs, which is layout luck).
- **Eye for Geometry: fairer scoring across the challenges.** The tasks are scored on different scales; consider a method
  that weighs them more equally. (Its split task was removed on 2026-11-14: it's now the Split in Half test.)

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

## New test ideas
From the test-auditor sweep (2026-11-13), each a well-known paradigm no test covers yet:
- **Choice reaction** (Hick's law): react to one of 2–4 signals; reaction time grows with the number of choices. Speed.
- **Flanker** (Eriksen): say which way the middle arrow points while the arrows around it point the same or the other
  way. Focus.
- **Task switching** (Trail Making B style): alternate between two rules, e.g. 1-A-2-B-3-C. Focus.
- **Visual search**: find the odd one out among many similar shapes. Focus.
- **Backward span**: repeat digits or tiles in reverse order. Memory.
- **Change detection**: a set of colored squares, a short blank, then: did one change? Visual working-memory capacity.
  Memory.
- **Digit–symbol substitution**: match symbols to digits with a key, as many as you can. Processing speed. Speed.
