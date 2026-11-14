# Review: Split in Half (`split-half`), 2026-11-14

Step 5 of the new-test process (`.claude/skills/new-test/SKILL.md`), before promoting the prototype to a full test.
Two reviewers, run on develop at the prototype state (2 familiar + 3 pointy rounds, 0 points at 30 / 70, solid violet
shapes, round-number chips). Neither used the browser. Text below is the reviewers' reports, lightly formatted.

## Summary

| | Result |
|---|---|
| Overall (test-auditor) | 3 / 5: fun, clear, honestly named; no direct research paradigm (closest: area perception, centre of mass) |
| Loopholes (scoring-reviewer) | none: every shortcut scores well below a weak honest player |
| Luck | medium: one player's runs spread over about the whole weak-to-strong gap (5 rounds is few) |
| Text | the howTo line about shape kinds is wrong; arrow keys and "exact cut shown" not mentioned; two stale code comments |

## Part 1: Test audit (test-auditor)

**Verdict, overall 3 / 5:** A fun, clean task with no obvious shortcut. The name works and Estimation is the right category. The rules need four fixes. One says "a different kind of shape each time", but there are only 2 kinds. They don't say that the exact cut is shown after each round, don't mention the arrow keys, and don't say how points fall with error. There is no direct research paradigm for "halving an area with a line". The closest ones are area perception and centre-of-mass judgment. The score is a real "area by eye" measure but noisy, because 5 trials is few.

Judged from code and SVG only (no browser).

### What it does now
- **Rounds:** 5, in random order.
  - 2 familiar shapes, always 2 different ones, picked from triangle, L, T, U, arrow, boot, key and fish. Each is stretched 0.7–1.4× each way and mirrored. Letters and the arrow can also be turned by quarter turns; the key can only be flipped upside down.
  - 3 "pointy" shapes: random star-like polygons with 5–14 corners.
  - Each shape is 55–80 units across on a 100-unit board, solid violet with no outline.
- **Start position:** the vertical line starts in the middle of the board. The answer is placed 6–20 units left or right of it, and never within 2.5 units of the middle of the shape's width, so "cut the middle of the box" doesn't work.
- **Input:** click or drag sets the line. ← / → nudge it by 0.5 units, or 2 with Shift. Done (or Space / Enter) is enabled only after the first move. There is no time limit.
- **After Done:** your two parts are drawn in two shades, the exact cut appears as a dashed green line, and you see the round's points and your split ("53.2 / 46.8 split").
- **Points:** `points = round(100 × (1 − |share − 0.5| / 0.2))`, i.e. 100 at 50/50, −5 points per percentage point off, 0 at 30/70. The score is the mean of the 5 rounds, shown as "x.x pts".
- **Result screen:** shows Closest cut, Furthest off, and one chip per round.

### 1. Name
- **Current:** "Split in Half". It's plain, says exactly what you do, and an "equal area" reading is natural.
- **Alternatives:**
  - "Fair Share": catchy, with a cake-cutting feel, but says less about the task.
  - "Halve It": short and active.
  - "Cut in Half": near-identical to the current name, and matches the ✂️ emoji.
- **Recommendation:** keep **Split in Half**.
- **Name clash:** Eye for Geometry has a task titled "Split it in half". That is one more reason to drop it there (see Other feedback).

### 2. Scientific relevance

**Comparable studies / paradigms**
- **Area perception.** Area judgments are systematically biased by shape.
  - Krider, Raghubir & Krishna (2001) show that people compare areas mainly by one linear dimension and adjust too little for the other ("Pizzas: π or Square?", Marketing Science 20(4)). [INFORMS](https://pubsonline.informs.org/doi/10.1287/mksc.20.4.405.9756)
    - This is the bias this test exposes: the two halves often have different shapes (a tall half vs a long thin one), and players tend to compare width instead of area.
  - Pisu, Mehraeen, Graf, Ernst & Adams (2025, JEP:HPP) measured shape biases in perceived area across 22 shape/orientation combinations, in online 2-choice experiments, e.g. triangles look larger than squares or disks of the same area. [Southampton eprints](https://eprints.soton.ac.uk/499185); [PDF](https://eprints.soton.ac.uk/499185/1/Pisu_et_al_2025_Biases_perceived_area_shapes_JEP_HPP.pdf). Only the abstract could be read, so no effect sizes.
- **Centre of mass ("visual mass").**
  - Baud-Bovy & Soechting (2001) found that people locate the centre of mass of compact asymmetric 2D shapes fairly accurately, with small shape-dependent errors pulled toward the centre of the largest inscribed circle. JEP:HPP 27(3), doi:10.1037/0096-1523.27.3.692. Only an abstract record was found ([record](https://data.zhenzhi.com/details/1/891374356)), so no error numbers.
  - Firestone & Keil (2016) found large, consistent, shape-specific centre-of-mass errors, which they explain by the mind "inflating" 2D shapes into 3D. "Seeing the Tipping Point", JEP: General 145(7), 872–881. [PDF](https://cogdevlab.yale.edu/sites/default/files/files/2016FirestoneKeil.pdf)
- **Line bisection.** This is the 1D version of the task. Healthy adults place the midpoint slightly left of true centre ("pseudoneglect"; Jewell & McCourt 2000 meta-analysis, cited in `docs/reviews/2026-11-13-test-audit.md`).
  - Bisection judgments of figures are also biased by shape. Example: the triangle bisection illusion, where a mark halfway up a triangle looks too high (Anstis et al., [UWE record](https://uwe-repository.worktribe.com/output/1000535)).
- **Equal-area halving of irregular shapes:** no study found that has people place a line to split an irregular shape's area in half. Nothing cited measures this task directly.

**A key point for what the score means (the auditor's own simulation, not from a paper)**
- A vertical line that halves the area passes through the *median* of the area along x, not the centre of mass (the *mean*). For lopsided shapes these differ, and the balance point lies toward the long thin parts.
- 2,000 runs through `makeRounds` / `evaluate`:
  - Placing the line exactly at the centre of mass scores about **61 pts on familiar shapes** and **82 pts on pointy ones**, about **74 for a whole run**. That cut is off by a median of 7.3 percentage points on familiar shapes and 3.3 on pointy ones.
  - Cutting at the middle of the shape's width scores about **26 pts**.
- So the test really asks for an equal-area judgment, not "find the balance point". A player whose intuition is the balance point is consistently pulled toward thin spikes and long arms. This measures the construct the name promises, but scores will likely be lower than players expect, especially on L, boot, key and arrow.

**Differences from the research setup**
- **Task type:** research mostly uses 2-choice comparisons ("which is larger?") over hundreds of trials, or centre-of-mass marking. This test uses the method of adjustment (drag until equal), a sound psychophysical method; no change recommended. 5 trials is far below the 20+ per condition research uses.
- **Shape families:** familiar shapes let you partly *calculate* (an L is two rectangles; a triangle's cut follows a square-root rule), so they add geometric reasoning. Pointy shapes are pure perception. The mix is fine for fun; the rules shouldn't hint at either strategy.
- **Fixed vertical cut:** avoids the oblique effect and run-to-run orientation luck. Good for reliability.
- **Instant feedback:** the exact cut is shown after every round, so players learn within a run. Research usually gives no feedback. Expect practice effects; fine for a game.
- **Look:** a solid fill with no outline is good. You judge one area, as in the area-perception studies.

**How accurate is the score?**
- With 5 rounds and a mean of capped linear points, one bad familiar shape (e.g. an L landing at 0) moves the score by up to 20 points.
- Shape luck is likely: shapes differ a lot in how misleading they are (L or boot vs fish or triangle). The scoring-reviewer should simulate run-to-run spread and per-shape difficulty.
- **Ceiling:** 100 needs five near-exact cuts, unlikely; the 0.5-unit keyboard step allows sub-1 % precision. **Floor:** unlikely, but 0-point rounds will happen on familiar shapes.

**What it can tell you about you:** how well you judge area by eye when the two parts have different shapes (cutting cake fairly, comparing portions, laying out designs). Not a maths or IQ measure; the current text doesn't claim one.

**Reference values:** no norms found. Only simulation anchors: perfect balance-point cutting ~74; cutting at the middle of the shape's width ~26. Untested guess: typical 60–80 pts, very good 85+. Collect real results before showing bands.

**What's missing that research would add (no score change)**
1. **Average miss** as a stat: the mean of |left share − 50| in %, e.g. "3.4 % off".
2. **Tendency:** in how many rounds the left part was bigger, e.g. "Left side bigger in 4 of 5" (links to pseudoneglect).
3. Optional: stats split into familiar vs pointy (reasoning vs pure perception); noisy with 2 vs 3 rounds.

### 3. Ratings
| | Rating | Why |
|---|---|---|
| Relevance | 3 | Rooted in area perception and visual-mass research; there is no standard "area bisection" paradigm. |
| Method | 3 | Method of adjustment, fixed orientation, no box-middle shortcut, no outline: good. But only 5 trials, mixed familiar and pointy shapes, and feedback after each round. |
| Score | 3 | Measures the right construct (equal area, not balance point), but noisy, with a likely per-shape difficulty spread; "pts" is less readable than "% off". |
| **Overall** | 3 | Fun and clear, honestly named; more grounded than the old Geometry split task, still a rough index. |

### 4. Other feedback

**Problems in the current text**
- `howTo`: "5 rounds, a different kind of shape each time." Inaccurate: there are 2 kinds (2 familiar, 3 pointy rounds). Only the *shape* differs each time.
- The rules don't say that the exact cut is shown after each round.
- The ← / → nudge (and Shift) isn't mentioned.
- `scoring`: correct, but doesn't say how points fall between 50/50 and 30/70. "5 points per 1 % off" is exact for this formula.
- `skill: 'judging area'` is fine; 'judging area by eye' is closer and matches Geometry's wording.
- Stale code comment above `RUN_KINDS` in `scoring.ts`: "the triangle is one of them". The triangle is *not* guaranteed. The SPEC row is correct.

**Proposed final rules text**
- tagline: `Slide a line to cut a shape into two equal halves.`
- skill: `judging area by eye`
- howTo:
  - `Drag the line left or right, or click where it should go. The ← / → keys also move it.`
  - `Place it so both sides of the shape have the same area, then click Done.`
  - `5 rounds, a new shape each time. After each round you see the exact cut.`
- scoring:
  - `Each round: 100 points for a perfect 50 / 50 cut, 5 points less for every 1 % off (0 at 30 / 70 or worse).`
  - `Your score is the average of the 5 rounds.`
- scoreLabel: `Average points` instead of `Score`; keep `x.x pts`.
- Alternative score unit: "Average miss, x.x %" (lower is better). Reads best on its own, but changes the score (no capping) and lets one wild cut dominate. If points stay, add Average miss as a stat.

**Category and duration:** Estimation is right. `durationHint` '~1 min' is plausible; maybe ~1.5 min for careful players.

**Icon:** the ✂️ emoji fits the share text. The SVG should show the task: an irregular solid shape (not symmetric), a vertical cut line, the two parts in two tones (one solid, one ~0.25 opacity). Avoid a plain triangle (looks like Geometry) and scissors-only (says "cut", not "equal area").

**Overlap with Eye for Geometry:** Geometry's `splitShape` is the same skill (smoothed blob, rotated line, 0 at 40/60). Once Split in Half is a full test, drop "Split it in half" from Eye for Geometry: it duplicates a whole test, the names clash, and the two would score the same skill on different scales. A grounded replacement: **"Balance point"** (mark the centre of mass of a triangle or simple shape; Baud-Bovy & Soechting), which complements this test. This changes Geometry scores; Geometry is already live, so a `scoreVersion` bump is the user's call.

### Checklist points that passed
- Name: clear, honest, no clash with any test name (only with a Geometry task title).
- Emoji ✂️ fits the share text.
- Tagline matches the task.
- Category: Estimation.
- The answer never lands at the shape's box middle, and the line starts 6–20 units from it: no trivial shortcut.
- Solid fill without outline; the correct cut is dashed vs your solid line, so color is not the only cue.
- No diagnostic or IQ claims; no color-sensitivity issue.

### Sources
- [Krider, Raghubir & Krishna 2001, Pizzas: π or Square?](https://pubsonline.informs.org/doi/10.1287/mksc.20.4.405.9756)
- [Pisu et al. 2025, Biases in the perceived area of different shapes](https://eprints.soton.ac.uk/499185) ([PDF](https://eprints.soton.ac.uk/499185/1/Pisu_et_al_2025_Biases_perceived_area_shapes_JEP_HPP.pdf))
- [Firestone & Keil 2016, Seeing the Tipping Point](https://cogdevlab.yale.edu/sites/default/files/files/2016FirestoneKeil.pdf)
- [Baud-Bovy & Soechting 2001, abstract record](https://data.zhenzhi.com/details/1/891374356)
- [Anstis et al., triangle bisection illusion](https://uwe-repository.worktribe.com/output/1000535)
- Jewell & McCourt 2000 (pseudoneglect), as cited in docs/reviews/2026-11-13-test-audit.md

## Part 2: Scoring review (scoring-reviewer)

**Bottom line:** no loophole or broken math. No shortcut gets near an honest player, setup generation always ends and gives valid shapes, and the rounding is right. The main weakness is luck: with only 5 rounds and a steep 0-at-30/70 scale, the same player's score moves a lot between runs. Two smaller items and a few stale text lines.

Evidence: `src/tests/split-half/scoring.review.test.ts` (12 seeded simulations, all pass, none fail on purpose; run with `npx vitest run src/tests/split-half --silent=false` to see the numbers). Browser not used.

**Player model** (all numbers depend on it): the guess is pulled a share β from the true cut toward the middle of the shape's box, plus normal noise σ × shape width.
- Weak: β 0.5, σ 0.07 → mean 47.5
- Medium: β 0.3, σ 0.045 → mean 63.8
- Strong: β 0.15, σ 0.025 → mean 79.3

Gap between weak and strong: about 31 points.

### 1. Medium: luck vs. skill, mostly from too few rounds
- The medium player's runs mostly land between 49 and 78.6 (p10–p90): 0.95 of the weak–strong gap; SD 0.36 of the gap.
  - Most of it is the player's own round-to-round noise: one fixed setup with only the noise redrawn gives SD 11.4; noise removed and only setups changing gives SD 6.9.
  - A single round has an SD of about 25 points; 5 of them still leave a lot of noise.
- Shape difficulty, medium player, mean points per round:

  | Shapes | Mean points |
  |---|---|
  | U | 78.6 |
  | Arrow | 72.2 |
  | Key | 71.9 |
  | Fish | 69.1 |
  | Triangle | 62.3 |
  | Pointy | 60.7 |
  | Boot | 58.9 |
  | L | 57.1 |
  | T | 54.7 |

  Always pairing one easy familiar (U, Arrow, Key, Fish) with one hard one (Triangle, L, T, Boot) barely helps: SD/gap 0.37 → 0.36.
- Suggested fix if it should be steadier: more rounds.
  - 3 familiar + 4 pointy (7 rounds): SD/gap 0.32, p10–p90 0.80 of the gap.
  - 3 familiar + 5 pointy (8 rounds): SD/gap 0.28, p10–p90 0.73 of the gap.

  At about 10 s a round this stays short. Otherwise 5 rounds is acceptable: its SD/gap is better than N-Back's 0.47. Score-changing; no `scoreVersion` bump in development.

### 2. Low: the "never near the box middle" rule leaks a little information
- The answer is never within 44–56 of the board. A player who cuts at the box middle but pushes that cut out to 44 or 56 when it falls inside the band scores 38.1 on average (p10–p90 20–57); the plain box middle scores 27.0.
  - On the same setups, this pushed-out cut beats the weak player in 28 % of runs (plain box middle: 8.6 %) and the medium player in 6 %.
  - Still below the weak mean, so not a loophole.
- Suggested fix: none needed now. To close it, lower the minimum distance from the start line (6 units) a little.

### 3. Low: stale or inaccurate text (no effect on the score)
- `registry.ts` `howTo` "5 rounds, a different kind of shape each time" is wrong: 3 rounds are pointy.
- `scoring.ts`: the `RUN_KINDS` comment says "the triangle is one of them" (it's in only about 1 in 4 runs); the comment on `Round.name` gives "Bite" as an example (removed kind).
- The scoring lines in the registry and SPEC match the code; they could add "linearly" and "whole points per round, average to one decimal".

### Degenerate strategies (mean score over the same 1000 seeded runs)
| Strategy | Mean | p10–p90 |
|---|---|---|
| Never moving the line | not possible | Done stays disabled until the line is touched |
| Stay at 50 (click the line, then Done) | 10.3 | 1.2–20.4 |
| Middle of the shape's box | 27.0 | 12.8–41.4 |
| Box middle pushed out of the 44–56 band (finding 2) | 38.1 | 20–57 |
| Average x of the corners | 41.5 | 24.6–59.4 |
| Click the far edge | 0 | |
| Area centroid (balance point) | 73.8 | 65.8–81.6 |

All except the centroid are clearly below the weak player (47.5). The centroid is close to a strong player, but it's not a shortcut: you can't compute it on screen, and judging the visual "mass" is the skill being tested.

### Checklist points that passed
- Random setups: 20,000 rounds all ended (about 0.8 s total); the answer always 6.0–20.0 units from 50 and never within 2.5 of the box middle (the 60-try fallback never triggered); smallest area 600 units²; every shape on the board; pointy shapes can't cross themselves; the only uncapped retry redraws the shape, so it can't get stuck.
- Edge cases: a run can't finish without input (no `failed` path needed); a cut at x = 0 or 100 scores 0; no division by zero; mean of 5 whole numbers to one decimal matches `formatScore`.
- Consistency: `higherIsBetter: true` correct; chips average to the score; Closest / Furthest show the bigger side first.
- Comparability: new test, not on `main`.
- Timing: no timers or rAF; `onPointerDown` with pointer capture; input ignored after Done; Space / Enter submit only after the line was touched.
