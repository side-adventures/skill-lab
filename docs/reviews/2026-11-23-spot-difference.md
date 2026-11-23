# Spot the Difference review (2026-11-23)

Branch `feat/spot-difference-prototype` (prototype: 5 pictures from 13 generated scenes, 5 differences each, 60 s
points time per picture, 10 per find in time + whole seconds left when all 5 are found, wrong clicks cost 1, 3, 5, 7,
10, +5 … over the whole run, click area ≥ 6 × 6 + 2.5, End round / Next / Ready). Reviewers: scoring-reviewer,
test-auditor, consistency-reviewer, play-tester. Proof tests: `src/tests/spot-difference/scoring.review.test.ts`.

## Scoring reviewer
- Random clicking, grid sweeps and spam score ~0; double counting impossible; End round gives nothing; random setups
  clean (real boxes never overlap, centres ≥ 14 units, every change clickable, click areas touch ~0.1× per picture).
- **High: uncapped wrong-click cost floors weak honest players to 0.** 10 / 15 / 20 wrong clicks cost 151 / 401 / 776
  (strong run ≈ 430). A player finding 16 of 25 with 3 wrong clicks per picture saves 0, like a random clicker; with 2
  per picture the average is 134 and 1 run in 10 is 0. Suggested cap: 1, 3, 5, 7, 10, then 10 each (guessing still
  never pays: random clicking best of 10 = 6.4 / 0 / 0; weak sloppy players 218 and 174 instead of 134 and 37).
- **Low: "in time" follows the timer's next frame, not the clock** (a find a few ms after 60 s still scores; longer
  when frames stall). Fix: `!timeUp && since(start) < POINTS_MS` for finds and wrong clicks.
- **Low–medium (luck): all-5 bonus cliff and uneven tiny changes.** Missing the 5th costs 10 + the whole bonus
  (30–45). Share of pictures with a tiny change: 0.25 (night city, pond park) to 0.84 (winter village); a tiny change
  costs an average player ~6 pts per picture. Scene averages 69.7 (winter) to 77.9 (kitchen). Smallest fix: exactly 1
  tiny change per picture where the scene allows. Spreading the bonus over finds lowers SD ratio 0.28 → 0.20 but
  squeezes the top.
- Spread (model): average player p10–p90 308–420, SD 45; weak 269 – strong 427; picture draw ~11 % of variance;
  cautious vs bold neutral; no ceiling in realistic play (max 545).
- Note: practice effect (fixed backbones; bookshelf / lab / space have ~40 possible changes).

## Test auditor
- Name and Focus category right; closest paradigm is comparative visual search (Pomplun et al. 2001: ~11 s per
  difference, colour 9.9 s vs form 12.0 s), plus comparison blindness (Scott-Brown et al. 2000); change blindness
  (Rensink et al. 1997) related. Reliability anchor: flicker task 30 trials r = 0.45 (Andermane et al. 2019).
- **Colour-blind fairness:** red ↔ green and green ↔ brown colour changes (duck heads, balloons, ice creams, displays,
  awnings, benches, maybe cars) are near-invisible with red-green colour blindness (~8 % of men). Exclude those pairs
  in `other()` or require a lightness difference; optional deuteranopia pass in the pixel check.
- **Rules texts:** "picture" vs "round"; "points time" jargon; "1 minute" → "60 seconds"; drop "each from a different
  scene" and "press Next…"; one idea per line; add "so guessing does not pay off". Proposed full text in the agent
  report (tagline "Two pictures, five differences: can you spot them all in a minute?"; consider renaming End round to
  "Show answers").
- Tagline promises "how fast" but the score is mostly the count; share emoji 🔎 ≈ Odd One Out's 🔍 (suggest 🖼️ or 👀).
- Result: "Complete in time" and "Time bonus" overlap; suggest "Average time per difference" (standard measure).
- SPEC row: cite comparative visual search; give the reason for ~4 min (≤5 finds per picture and scene difficulty
  differ, so fewer pictures leave the score to scene luck).
- Icon ideas: (a) two frames with the same mountain, a sun only in the right one; (b) a missing dot ringed;
  (c) magnifier (too close to Odd One Out).
- Stale: `scripts/spot-difference/README.md` (3 differences, never 2 easy).

## Consistency reviewer
- **Bug (confirmed): a double click on End round skips the answers screen** (the same button becomes Next). Fix:
  `useContinue` (ignores input for 300 ms) like `RoundResult`'s button mode, and different keys for the two buttons.
- No "s left" value in the info row (every timed test has one; here the seconds left are the bonus).
- No shared answer-flash ring (`useAnswerFlash` + `feedbackRing`) as in Broken Pattern / Odd One Out.
- Off-palette colours `#4ade80` / `#f87171` → emerald-400 / rose-400.
- "Picture" vs "round" (site convention "Round N / 5"; chips can keep scene names).
- Rules phrasing: "click Next" not "press"; "You have 60 seconds …"; growing cost like Go / No-Go ("Each wrong click
  costs more than the last: …"); one idea per line.
- Round result only shown when all 5 found; show "3 of 5 found · +28 pts" too.
- Singular "pt" only in the info row (result stat and chips say "−1 pts").
- Info-row middle "Time is up … Keep looking or end the round" is an instruction; keep the state short, hint in the
  play area.
- Length ~4–5 min without a reason in the SPEC; overtime has no cap (could end a round on its own 30–60 s after).
- Intended and fine: two pictures, answers on the pictures until Next, End round without a key (user's decision; note
  it in the SPEC), Ready inside the test, 700 ms ✕, growing cost, scene-name chips.
- Unsure: a click on a found box gives no feedback; the hand-made 5-dot indicator; "Differences found" counts only in
  time.
- Score spread: ~400–440 distinct scores, p10/50/90 ≈ 180/300/410; only tie is the 0 floor (3–13 % of players with
  many wrong clicks).

## Play-tester
- No hard bugs, no console errors. Full run, 0-click run (not saved), restart, "?" overlay, R on the result, Enter /
  Space / button on Next, double Enter (one step), End round with 0 / 2 / 4 found, clicks on found ones, free clicks
  after the minute, cost order 1 … 15 then 20, 25, 30, 35 across pictures — all as designed.
- Notes: the live score stays 0 while costs pile up (−41 −75 +72 … shown as 0); "Time bonus" stat also nets out the
  wrong-click cost (57 shown) unlike the rules' meaning; one Ready screenshot looked blank (text present; likely fade).
- Not checked: the red ✕ visually, timer while "?" is open, Back to start.
