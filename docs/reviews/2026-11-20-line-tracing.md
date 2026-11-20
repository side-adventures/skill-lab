# Line Tracing rework: agent review (2026-11-20)

Branch `feat/line-tracing-levels`, commit 729541c: 5 fixed tracks (Straight, Zigzag, Spiral, Fork, Loop), +3 s and a
restart from GO per exit (failed attempt not counted). Decided by the user beforehand, not re-argued: flat 3 s,
failed time not counted (bail-out accepted), no lives, fixed tracks (learning effect accepted).

## Scoring review (scoring-reviewer)

Evidence: `src/tests/line-tracing/scoring.review.test.ts` (9 tests; contains `tracer()`, a copy of the component's
tracking logic). Player numbers below come from a steering-law model (track time = 200 ms + b·∫ds/W, b = 45 / 60 / 90
ms per unit for strong / average / weak; exit chance rising with speed, ~0.5 exits per run for an average player; 8 %
time noise), so they are illustrative.

| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | Medium (follows from the decisions) | Exits are most of the run-to-run spread: same player SD 2.34 s = 0.22 of the weak–strong gap (11.4 s); one exit = 0.26 of the gap. Playing 10 % faster than comfortable worsens the average (19.6 vs 17.9 s) but improves the best of 10 runs by ~0.9 s (~8 % of the gap). Every exit costs the same 3 s wherever it happens. Possible later lever: 2 s penalty (needs a `scoreVersion` bump once live). | Open (user) |
| 2 | Low | `onPointerLeave` / `onPointerUp` checked React `phase`, not `phaseRef`: a pointerleave right after a move-exit, before the re-render, could count a second exit (+6 s). | Fixed: both use `phaseRef.current` |
| 3 | Info | Zigzag tips can be cut inside the visible overlap of the two legs (up to 108 units per apex, ~430 of 2326 total). A racing line, not a loophole. | Keep |
| 4 | Info | The Loop bridge (68 wide incl. edge) hides 62 units of the first pass, which turns 23° under it; ~73 % of the deck is outside the first-pass corridor, so drifting onto the visible bridge on the first pass is an exit. | For the play-tester; if it trips players, move control point `[420, 385]` |
| 5 | Info | Start / finish times are taken when the handler runs, not from the event's `timeStamp`: up to one frame (8–16 ms) of noise per track. | Negligible |

Checked and fine: no way to skip ahead (loop crossing, spiral rings, fork routes can't be mixed; largest progress
jump 91 units beyond the distance moved); no false exits when tracing at the centre or at ±95 % of the half-width; GO
and flag circles are no shortcut (≥ 43 units from other parts; the 90 % finish check never blocks an honest finish);
Fork shortcut 383 vs 1113 units, ∫ds/W 17.3 vs 23.5 on the branch, 0.895 over the track (SPEC's "a third as long" and
"~10 %" hold), 520° vs 283° of turning, saves ~0.37 s, breaks even at +12 points of exit chance; bail-out pays only
when an attempt is > 3 s behind (practically only a long stall); no ceiling or ties (ms scores, 2 decimals shown);
component state resets per attempt and per track, input between tracks / after the end ignored, timers cleaned up,
result chips + penalty add up to the score. Comparability vs `main`: the score changed meaning (one random path, no
score on leaving → 5 tracks + 3 s per exit); no bump while in development, list it for later.

## Play-test (play-tester)

3 full runs + partial runs (mostly scripted along `makeTracks()`, some real mouse). No blocking bugs, no stuck states,
no double counts; chips + penalty add up to the score; R / N on the result screen work; rules and "?" overlay fit.

| # | Finding | Decision |
|---|---|---|
| 1 | Moving back along your own route by more than ~160 units (the tracking window) counts as an exit, e.g. overshooting and U-turning. Not in the rules. | Open (user) |
| 2 | An exit by leaving the board put the red dot outside the svg (clipped, invisible). | Fixed: dot kept on the board edge |
| 3 | The failed attempt's violet line stays until you re-arm on GO. | Keep (shows where you went wrong) |
| 4 | Leaving GO off the path resets silently. | Fixed: "Start along the path · back to GO" (rose, no penalty) |
| 5 | Loop, first pass: the bridge deck covers a bend of the first pass; only ~35 % of the deck lies inside the first-pass corridor, so steering by the visible deck can exit. | Open (user): move control point `[420, 385]` out from under the bridge, or add a rules line |
| 6 | Violet line: gap only exactly under the bridge on the first pass (correct), continuous on the bridge. | Fine |
| 7 | Reaching the "?" button mid-trace is an exit. | Expected |

## Audit (test-auditor)

Steering-law grounding is good: Straight = linear tunnel (width ~21 px, inside the lab range), Spiral = Accot & Zhai's
spiral (narrowing adds cost), Zigzag = corner cost (Pastel 2006), Fork / Loop = curvature and width changes; the fork
is an honest speed–accuracy choice. ~270 difficulty units (∫ds/W) per run, vs ~28 before. Differences from lab
practice (long tracks, time and errors in one number, fixed tracks, device effects) are known and accepted.

| # | Finding | Decision |
|---|---|---|
| 1 | SPEC said Zigzag has 5 corners; it has 4. | Fixed |
| 2 | Share emoji ✏️ fits drawing, not a race; suggests 🏁. | Open (user) |
| 3 | howTo "from a straight line to race tracks" is vague. | Fixed: names the 5 tracks |
| 4 | Optional rules line for the loop ("stay on your own pass"). | Open, with play-test #5 |
| 5 | Skill could name the construct: "steering speed and precision". | Open (user) |
| 6 | Optional result stat: steering speed (difficulty units ÷ time without penalty, "widths / s"). | Open (user) |
| 7 | The site is live: publishing without a `scoreVersion` bump leaves every player's old single-path best unbeatable. | Open (user), before `develop` → `main` |
| 8 | Name: keep "Line Tracing" (alternatives "Track Race", "Buzz Wire"). | Keep |

Rough bands from the scoring model (to calibrate with real data): very good < ~14 s, typical ~16–20 s, slow > ~25 s.

## Consistency (consistency-reviewer)

| # | Finding | Decision |
|---|---|---|
| 1 | Info row slots swapped vs siblings (left = where you are, right = how you are doing). | Fixed: left "Track n / 5", right "Total … s" |
| 2 | `scoreLabel` 'Time' vs 'Total time' in the other time + penalty tests. | Fixed |
| 3 | Score line "over all 5 tracks" vs "for all 15 rounds". | Fixed: "for all 5 tracks" |
| 4 | Stat "Exits" vs Steady Hand's "Times you left". | Fixed: "Times you left" |
| 5 | Status style: parts joined with " · ", no sentence periods. | Fixed |
| 6 | Stale `types.ts` comment about "left the line in Line Tracing". | Fixed |
| 7 | No green / red feedback ring (other tests ring the board on a mistake). | Open (user) |
| 8 | Finish waits `END_MOMENT_MS` (1.5 s) after a clean last track; siblings wait ~400 ms. | Open (user) |
| 9 | Track result only 1 s in the info row (no RoundResult). | Fine (nothing is timed until GO) |
| 10 | "Penalty +0 s" with no exits. | Fixed: "0 s" |
| 11 | Old best (3.27 s) from the single-path version still shows. | See audit #7 |
