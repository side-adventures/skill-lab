# Lessons from building tests

Problems we ran into and how we solved them **for that test**. These are examples to borrow from, not rules: the
general defaults they led to are in `CLAUDE.md` ("Design defaults"), and a new test may solve the same problem
differently. Newest first. Details and numbers are in the review reports (`docs/reviews/`) and the SPEC rows.

## Batch 4 (2026-11-20 – 2026-11-23): Spot the Difference

### Content made by a generator
- **Hand-drawn scenes don't scale; generated ones need their own checks.** 13 scenes are a fixed backbone with random
  slots and details, and each item lists the changes it can make. *Solved:* a lab next to the app
  (`scripts/spot-difference/`): a scene check (always the full count, no overlapping change boxes), share tables per
  item, and a headless-Chrome **pixel check** that renders every change and counts changed pixels. The pixel check found
  ~15 changes that were invisible or faint (white stripes on a white shirt, hair colour under a hat, a symmetric object
  "flipped", near-identical trouser greys, an extinguisher hose the colour of the wall).
- **Colour-blind players.** A deuteranopia / protanopia simulation in the pixel check showed red ↔ brown, purple ↔ blue
  and pink ↔ light-blue changes nearly vanish. *Solved:* colour **changes** must stay distinct under the simulation
  (starting colours are not limited); fixed two-colour pairs that failed were replaced.
- **"The left picture is correct".** Anything that looks broken when missing (a teapot lid, rabbit ears, a deer's
  antlers) always starts whole; the change only removes it on the right.

### Picking what changes
- **A category-first picker favoured lone items.** Picking an area first, then a change in it, gave the hens 25 % and
  each knight 13 %. *Solved:* pick a unit first (an item, or a group of copies such as the windows), weighted by
  (changes per item)^0.5 × (group size)^0.05, then one of its changes; only changes that fit the rules right now take
  part (a big group got extra retries otherwise).
- **Finding one change in a group ruled out the rest.** *Solved:* the last of the 5 changes is free (any item, group or
  area again; no click-area overlap; another kind of change on the same item / group).

### Scoring
- **A time penalty didn't stop guessing.** The k-th wrong click costing k s still let random clicking reach ~44 points:
  a lost second can't take back an early lucky find. A flat −2 still let "educated" guesses pay. *Solved:* points that
  grow over the whole run (1, 3, 5, 7, then 10 each); the cap at 10 keeps honest but sloppy players above a random
  clicker's 0 (uncapped, 20 wrong clicks cost 776).
- **Small changes were hard to click, not just to see.** *Solved:* a click area of at least 6 × 6 units plus slack,
  separate from the drawn answer box; in an overlap the nearest real box wins.

## Batch 3 (2026-11-15 – 2026-11-17): Advent Calendar, Odd One Out, Backward Span, Change Detection, Symbol Code

### Feedback and getting stuck
- **Advent Calendar, silent clicks.** Clicking a door you had already opened was ignored (meant for double clicks). In
  round 2, players who lost count kept clicking opened doors, nothing happened, and the game felt frozen.
  *Solved:* only the door just opened is ignored; any other opened door counts as a wrong door (+1 s), and after a
  wrong door the info row shows the next one ("Next door: ★7") until it's opened.
- **Advent Calendar, clock after the last door.** The live clock kept counting through the last door's 0.4 s flash, so
  it showed a bit more than the result. *Solved:* the clock stops and shows the exact round time on the last door.

### Reading mistakes and the end of a run
- **Backward Span, misses moved on by themselves** (1.5 s), too fast to read three lines (shown / reversed / you).
  *Solved:* every miss, the last one too, waits for click / Enter / Space (`useContinue`, ignored for 300 ms so the
  Enter that submitted doesn't skip it).
- **Change Detection, Odd One Out, Advent Calendar, the last answer.** The result screen appeared at once, so the last
  green / red flash was never seen. *Solved:* 0.4 s for the flash, then the result.

### Starting a run
- **Backward Span.** The first digit ("3") after "Ready" looked like a countdown. *Solved:* no "Ready" (start mode
  `none`); a 2 s "Memorize the digits" before the first sequence only.
- **Symbol Code.** The 60 s started before players had their fingers on the keys. *Solved:* the test shows its own
  layout (key strip without symbols, the pad) during the 3-2-1 (`StartTransition` inside the test), key presses
  ignored until it starts.

### Texts
- **Backward Span.** The same instruction appeared above and inside the play area. *Solved:* info row "Type it, then
  Enter" (state), play area "Type the digits backwards, last digit first" (hint).
- **Advent Calendar.** "A door opens for a moment, then closes again" was cut from the rules: you see it while playing.
- **Taglines.** "Crack the code" promised a puzzle that isn't there; "Decode the symbols as fast as you can" says what
  you do and still sounds like a game.

### Stimuli
- **Odd One Out, the T stood out.** With true Ls (a clean corner) the T's symmetric middle join popped out; an L with
  the bar 20 % in from the end looked like a lopsided T. *Solved:* 10 % offset, the usual setup in T-among-L studies.
  Judged on a full board of shapes, not on single shapes.
- **Change Detection, a change you could spot without memory.** With only 8 kinds of shape on an 8-shape board, a
  change had to copy a kind already shown (a duplicate). *Solved:* more kinds (14) than the largest board, and a change
  always brings in a kind not on the board. Each color comes with its own shape (never color alone).
- **Advent Calendar, round 2 too loud.** Bright fills and strong borders for the two door kinds. *Solved:* a small icon
  in the corner and a faint tint; the two sets stay easy to tell apart (as in Gorbov's red / black table).

### Fair random setups
- **Advent Calendar.** Some door layouts were much quicker to click through. *Solved:* only layouts whose door-to-door
  path is within ±5 % of the median.
- **Backward Span.** ~7–9 % of sequences had easy runs like 3-7-3-7. *Solved:* a digit never repeats the one two
  places back (and neighbours are never equal or one apart).
- **Odd One Out.** The T is spread evenly over the four quadrants and never in the middle row or column.

### Scores and result stats
- **Change Detection, early mistakes.** With a model fit over all answers, two slips while settling in cost ~0.5–0.8
  shapes, a bad start ~1.7. Simulated options: practice rounds (repeat players found them annoying), skipping rounds
  (a hidden rule), plain averages (noisier, cautious answering scored ~2 shapes more, button-mashing got ~2.5).
  *Solved:* rounds 1–10 weighted 0.4 → 1, all later rounds fully.
- **Change Detection, random clicking.** The model fit alone gave constant "Changed" answers a few shapes. *Solved:*
  the score is scaled down when hit rate − false-alarm rate is below 0.25.
- **Odd One Out, slope.** "Each extra shape" from two medians was noisy, and a 1 s penalty on a small board pulled the
  fitted slope down (5 ms instead of ~20). *Solved:* least-squares over all rounds, on search time without penalties.
- **Result stats.** "Shapes at the end" / "Most shapes" (single noisy points) became "Average shapes, last 20 rounds";
  Backward Span's chip per try became one "Missed at: 4, 5 digits".
- **Choosing the score.** Each scoring choice above was decided from a simulation table (same player many times,
  bots, early vs late mistakes), not by feel.

### Which prototypes to keep
Cut after play-testing, because they didn't add enough over existing tests or weren't satisfying:
- **Choice Reaction** (Hick's law): clicking the lit square is so direct that more choices barely slowed players down;
  an arbitrary mapping would turn it into Symbol Code.
- **Flanker:** the effect is small, errors came from jumping the gun, and it overlapped Stroop and Go / No-Go.
- **Pattern Groove** (sequence learning): not satisfying to play.
- **Trail Switch** became the Advent Calendar (same switching idea, a theme that's fun).
Kept tests measure something no other test does, feel good to play, and give a usable score in 1–2 minutes.

### Process
- **Separate copy for building** (git worktree `../skill-lab-protos`, own dependency cache, own server on 5174, own
  browser tab): two Vite servers on one folder broke each other's cache (blank page), and starting a server once took
  over the user's tab.
- **Checks gate the merge** (`npm test && npm run lint && npm run build`): a reviewer's simulation once timed out and
  broke the build; a merge that ran the checks without stopping on failure let it through.
- **Bots in the browser pane:** the pane draws few frames per second, so a bot must wait for a drawn frame before
  pressing; odd timings are usually the pane, not the game.

## Password Memory (2026-11-19 – 2026-11-22)

- **Tune difficulty from data, not guesses.** A separate lab tool (Password Lab) collected right / wrong answers on
  random passwords; a logistic model of the parts gave the load weights. Surprises only the data showed: a word is
  hardest with about half its letters changed and easier fully changed (it reads as one pattern), and capitals and
  look-alikes cost the same per letter.
- **Keep the lab frozen while it collects data** (its own copy of the word lists and options), so its answers stay
  comparable while the game changes.
- **A generator aimed at a load needs guard rails**, or it finds cheap ways to fill a level: minimums and maximums that
  grow with the level (changed letters, extras), a word count picked first (multi-word tries fail more often and would
  otherwise be rarer than their share), and a length cap so the text never has to shrink.
- **Units that sound concrete can mislead**: "as hard as 13 random digits" was the load's unit (one more digit after
  a word), not loose digits; the score stays "Level N" until the unit means something to a player.
- **An endless climb still needs an end**: a top level far beyond honest play (and a shorter show time on the way)
  keeps runs finite and flags copying.
