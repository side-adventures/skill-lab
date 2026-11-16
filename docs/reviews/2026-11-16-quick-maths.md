# Review: Quick Maths (`mental-math`), 2026-11-16

Three reviewers on the reworked difficulty (branch `feat/quick-maths-difficulty`, commit 5169c46): 5 levels, each a
shuffled block of + − × ÷, a wrong answer brings its operation back at the end of the level, level up every 4 correct,
no repeats in a run, level shown in the info row and result. The scoring-reviewer worked from code with a simulated
player (`src/tests/mental-math/scoring.review.test.ts`); the consistency-reviewer from code only; the play-tester
played full runs on localhost (its runs are saved in the preview browser's local scores).
Kept on purpose and not reported as findings: shortcut problems like 25 × 4, × 11, + 99; the 60 s length.

## Summary

| | Result |
|---|---|
| Loopholes (scoring-reviewer) | none: answering wrong on purpose to swap hard problems gains < 0.3 correct per run |
| Luck | small: same simulated player SD 1.25–1.42 correct (0.13–0.15 of the strong–weak gap); the draw alone 0.08 |
| Difficulty ramp | three flat or backwards steps: + / − level 1 → 2, + / − level 4 → 5, × / ÷ levels 2–5 |
| Bugs (play-tester) | none; level ranges, blocks, retries, no repeats and result values all matched in 2 full runs |
| Consistency | three small drifts: brackets instead of " · ", a one-off `ml-4` gap in the info row, "doesn't" in the rules |

## Part 1: Scoring (scoring-reviewer)

The simulated player is a heuristic, not data (read + type 0.7 s + 0.2 s per digit, compute time from 1-digit facts
with a problem-size effect, carry / borrow costs, ÷ = 1.3 × the matching ×, slips 2 % + 3 % per second of compute;
skill 0.6 / 1.0 / 1.6). Even average players reach level 5 in 99 % of runs, so it is probably faster than real
players: read the numbers as one level against another.

**1. Level 2 + / − are easier than level 1 (minor to medium).** 60 % of level-1 additions need a carry (68 + 7);
level 2 (2d + 2d, no carry) never does. Model: + level 1 1.02 s (1.31 s with carry, 0.58 s without) vs 0.87 s at
level 2; − 1.38 s vs 1.04 s. 100 % of level-2 problems are easier than the level-1 median.
Suggested: level 1 without carries, or let level 2 mix in 2d + 1d with a carry.

**2. Level 5 + / − are no harder than level 4 (minor).** Level 4 (2d + 2d over 100) always has 2 carries; level 5
(3d + 2d, at least one carry) has only 1 in 60 % of problems. Model: + 1.97 s vs 2.00 s, − 2.70 s vs 2.88 s.
Suggested: level 5 needs a carry in both ones and tens (467 + 58).

**3. × / ÷ climb unevenly (minor).** Level 2 → 3 is flat (× 1.47 s vs 1.48 s; 41 % of level-3 × easier than the
level-2 median, because of 11 × 3, 12 × 3 …). Level 4 (12–19) repeats level 3's 12–15 rows: 50 % of level-4 ×
can also come up at level 3. Level 5's 11–15 × 11–15 half (1.85 s) is easier than level 4 (2.08 s); the
21–29 × 1d half is 2.52 s. Suggested: level 4 = 16–19 × 3–9; level 5 use 12–15 × 12–15 or drop that half.

**Passed:** no score without answers (`failed`, not saved); spamming 0 scores 0; the best fixed guess hits 7.4 %
at level 1; generator always ends, the no-repeat fallback never repeats the last problem; answers 2–999 fit the
keypad; levels and blocks stay aligned at a 40 % wrong rate; timing via `performance.now()` and `onPointerDown`;
the registry rules and SPEC row match the code.

## Part 2: Play test (play-tester)

**No bugs.** A perfect run (keypad and keyboard mixed) reached level 5 at 16 correct; a script checked all 125
problems against the level ranges, one of each operation per block and no repeats. A run with 7 deliberate mistakes
brought each wrong operation back at the end of its block and only levelled up once all four were solved; the result
(Wrong 7 split + 4 / × 1 / ÷ 2, accuracy 96 %, fastest / slowest, table, Level reached 5 / 5) matched what was
played. Empty Enter / OK keeps the problem. A run with no answers shows "No answers — try again!" and is not saved.
Rules text matches the behaviour; no console errors.

**Not checked:** typing at 0 s (the pane went hidden and the timer stalled), the "?" rules overlay, Next test,
keypad visuals and layout.

**Note:** with perfect play level 5 lasts the rest of the run (109 of 125 problems in the scripted run); per spec.

## Part 3: Consistency (consistency-reviewer)

**1. Brackets break the site's separator.** Every other "thing + number" value uses " · " (Geometry "Make X° · 85 %",
Time Estimation chips, info-row texts). Either go back to " · " or keep the brackets as a deliberate exception.

**2. One-off gap in the info row.** The level sits in a hand-made `<span className="ml-4">`. Time + level on the left
fits the GameInfo rule ("Level N / 5" matches "Round N / 10"), but the gap should be shared (like `Lives`' `ml-2`)
or folded into one `InfoValue`.

**3. Contraction.** "A wrong answer doesn't count" is the only contraction in all rules text; elsewhere "does not".

**Optional:** the rules never say there are 5 levels ("… harder with every level, up to level 5").

**Unsure (older than this rework):** "Fastest answer" counts correct answers only, "Slowest answer" all answers, so
the slowest can be a problem the player got wrong, shown with the right answer.

**Fine as is:** "Slowest answer" pairs with "Fastest answer"; "Level reached N / 5" ("reached", not "cleared", in a
timed run); rule lengths and wording, no tips; scoring by correct answers (not correct − wrong) is test-defining.
Expected spread roughly 12–30 correct over 15+ values; no tie-break needed.

## Decisions (2026-11-16)

- **+ / − level 2:** 2d + 2d, carry or not, under 100. In the model, level 2 + is now 1.17 s vs 1.02 s at level 1
  (50 % of level-2 problems easier than the level-1 median, was 100 %).
- **+ / − level 5:** kept as is (at least one carry, ones or tens); level 5 ≈ level 4 is accepted.
- **× / ÷ level 4:** 16–19 × 3–9 (no overlap with level 3 any more). **Level 5:** half 21–29 × 3–9, half
  12–15 × 12–15 (no × 11). Model after the change: × level 4 2.46 s, level 5 2.34 s (21–29 × 1d 2.52 s,
  12–15 × 12–15 2.15 s), so level 5 × is now slightly easier than level 4; level 2 → 3 is still flat (1.47 vs 1.48 s).
- **Brackets** for times kept as a deliberate exception ("39 ÷ 3 = 13 (201 ms)").
- **Rules** shortened: no levels in the rules ("The problems get harder as you go.", "A wrong answer does not count.").
  The level still shows in the info row and the result.
- **Info row:** the left slot spaces its values itself (`gap-3`); `Lives` lost its own `ml-2` (hearts now 12 px
  from the value in every test).
- **Slowest answer** keeps counting all answers (fastest counts correct ones only).
- **× / ÷ level 5, revised:** 60 % 21–29 × 3–9, 40 % 12–16 × 12–16. Model compute per range (average player):
  12–15 × 3–9 1.72 s · 16–19 × 3–9 2.49 s · 21–29 × 3–9 2.52 s · 12–15 × 12–15 2.14 s · 12–16 × 12–16 2.44 s ·
  16–19 × 12–19 3.72 s. Level 5 × ≈ 2.49 s, about the same as level 4; accepted for now, to be judged by real runs.
