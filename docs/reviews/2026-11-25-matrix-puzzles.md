# Matrix Puzzles — agent review (2026-11-25)

New-test step 6 for the Matrix Puzzles prototype. Three reviewers ran: scoring-reviewer, test-auditor and
consistency-reviewer. State reviewed:
- 5-minute run, score = puzzles solved;
- levels start at 0 / 2 / 4 / 7 / 10 solved;
- a wrong answer costs max(5 s, 15 s − time spent) and gives a new puzzle at the same level;
- options are built I-RAVEN style, 2 × 2 × 2;
- a uniqueness check runs over all rule kinds and both directions.

The scoring-reviewer's proof tests (5 of them fail on purpose) are kept on branch `chore/matrix-review` in
`src/tests/matrix-puzzles/scoring.review.test.ts`, not on develop.

## Scoring (scoring-reviewer)

Player model: difficulty is a weighted sum of the rule kinds and sets solve time and slip rate, with lognormal timing
noise.

| Player | Mean score |
|---|---|
| weak | 4.1 |
| average | 5.6 |
| strong | 7.8 |
| user-like | 9.8 |

User-like best of 10 runs ≈ 11.7, which matches the user's runs (10, 10, best 12).

1. **High: the answer can be found by counting, without seeing a rule.**
   - For each feature that differs between the options, pick the value that appears the "right" number of times in
     the 8 cells:
     - a figure value that appears exactly twice;
     - a dot pattern that is not in the grid yet;
     - a value that appears in all 8 cells.
   - This picks the answer 57 % of the time at level 5 (random: 12.5 %).
   - For dots, "the pattern not yet in the grid" is right 76 % of the time: for A + B = C, xor and row + column the
     answer is always a new pattern, while wrong patterns are often copied from the last row or column.
   - At 15 s per puzzle, this scores 9.9, against 7.8 for a strong honest player.
   - **Fix:** in `wrongValue`, prefer wrong values that appear in the 8 cells exactly as often as the answer does. For
     dots, no masks copied from the grid when the answer is new. On a copy this cut the dot shortcut from 76 % to
     about 50 % and the overall level-5 shortcut from 51 % to 43 %. The rest comes from "same" and "three", where
     counting is the rule itself.
2. **Medium: levels 1–2 can be guessed after a glance.**
   - Only 1–2 features change, so the options also vary a feature that is constant in the grid. Dropping the options
     that break it leaves 2 options on level 1 and 4 on level 2.
   - Guessing at 3 s that way scores 5.5, against 4.1 for a weak honest player.
   - A bigger penalty alone doesn't fix it (20 s: 4.9, 25 s: 4.4).
   - **Fix:** on levels 1–2, use 4 values of a changing feature × 2 (4 × 2 options). The guesser then drops to 3.95.
3. **Medium (depends on the model): an instant guess to reroll hard level-5 puzzles pays.**
   - A strong player who guesses within 3 s on the hardest puzzles goes from 7.8 to 8.3, and their best of 10 runs
     from 9.5 to 10.7.
   - Giving up after 20 / 40 / 60 s never pays.
   - **Fix:** after a mistake, keep the same rules with new values. The reroll strategy drops to 7.1; honest play is
     unchanged.
4. **Low: mistakes on later levels cost more.**
   - Two mistakes on levels 4–5 cost 0.84 (strong) or 1.73 (user-like) puzzles, against 0.49 or 0.66 on level 1: the
     thinking time is lost. That is normal for a timed test.
   - A bold player has a wider spread (best of 10: 11.7 → 12.7), and a cautious player scores slightly lower. This
     depends on the model.

Passed:
- Random clicking scores about 2.9.
- The penalty always makes time spent + penalty ≥ 15 s.
- Spread: the average player's SD is 0.9, which is 0.25 of the weak–strong gap. Difficulty differences within a level
  barely add to it.
- Ties: an average player's two runs score the same 29 % of the time (acceptable for a count score).
- Second answers from other readings (dots as a count, shapes as a number sequence) occur in under 0.5 % of puzzles.
  Fixed features can't look like a pattern.
- Component edge cases: clock end during play and during the mistake screen, the input lock, the keys, `failed` when
  nothing was answered.

## Presentation and research (test-auditor)

- Name, icon, category (Thinking), tagline and skill line fit. The rules text matches the code. There is no IQ or
  clinical wording; keep "Raven", "IQ" and "fluid intelligence" out of the player-facing text.
- **The rules miss one thing that changes play:** a wrong answer gives a new puzzle (after 10 s, a guess works as a
  5 s skip). Add "A wrong answer gives you a new puzzle."
- **The registry emoji 🧩 duplicates Pattern Memory** (`visual-memory`). Suggested: 🔳.
- Split howTo line 1 into two sentences, and shorten the penalty line.
- Result stats:
  - consider accuracy (solved / answered);
  - "Avg time per solved puzzle" mixes levels;
  - "Level reached: 4 of 5".
- **Research:**
  - The rule kinds map onto Carpenter, Just & Shell (1990): constant, progression, distribution of three, figure
    addition / distribution of two.
  - RAVEN / I-RAVEN use rows only, with arithmetic. This test adds columns, dot logic and row + column; it lacks
    arithmetic and position rules.
  - Generated items are an accepted approach (Sandia matrices, Matzen et al. 2010).
  - Timed APM versions are an accepted format: a 20-minute limit correlates r ≈ .75 with untimed scores (Hamel &
    Schmittmann 2006).
  - There are no norms for "solved in 5 minutes"; bands must come from our own data.
- **Score meaning:** everyone gets the same level sequence, so scores compare. Up to 10 solved the score reflects
  reasoning plus speed; above that, level 5 only, so it becomes a speed score. 10–20 items is in the range of research
  short forms (12-item APM, 11-item ICAR).

## Consistency (consistency-reviewer)

Drift:
1. **Penalty wording:**
   - Broken Pattern says "Each wrong click takes 5 s off the clock." under How to play.
   - Matrix says "costs time" under Score.
   - Suggested Matrix wording: "Each wrong answer takes 15 s off the clock, minus the time you already spent on that
     puzzle, but at least 5 s."
   - Open: should penalties that take time off the clock go under How to play (as Broken Pattern and Line Tracing do)
     or under Score (the CLAUDE.md order)?
2. **Result stats order:** others show Highest level last. Suggested: Wrong answers, Avg per puzzle, Highest level.
   Matrix's "0" (no "(−0 s)") is better than Broken Pattern's "0 (−0 s)", which should adopt it.
3. **"Continue" hint style:** Matrix uses `text-sm text-zinc-500`; RoundResult and Backward Span use
   `text-xs text-zinc-600`.
4. **Key hint style:** Matrix uses top-left at 24 % on a dark pill, AnswerButtons uses the top-right corner, and Next
   in Line uses a `<kbd>` under the figure. Use one of the existing two (a `<kbd>` below the cell avoids the corner
   dots).

Intended differences (keep):
- the m:ss clock;
- the mistake screen with `useContinue` and the clock paused;
- the replaced middle text "Not this one · −N s";
- the 0.4 s input lock (could become shared; Next in Line has the same double-click risk);
- hand-made option buttons.

Ties: about 15–16 % of players land on the most common score, similar to Broken Pattern.
