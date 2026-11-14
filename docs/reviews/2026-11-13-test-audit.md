# Test audit: all 20 tests (2026-11-13)

Two test-auditor agents (`.claude/agents/test-auditor.md`) reviewed the live version of every test (develop = main on
2026-11-13), 10 tests each, with the same template and rating scale. For each test:

1. **Name**: alternatives and a recommendation.
2. **Scientific relevance**: comparable studies, differences from the research setup, how accurate the score is, and
   what it can tell you about yourself.
3. **Ratings (1–5)**: Relevance (is the skill worth testing), Method (does the execution follow scientific
   practice), Score (is it meaningful and useful), Overall.
4. **Other feedback.**

Rating scale: 5 = matches established research practice / highly meaningful · 4 = close, minor gaps · 3 = recognisable
but notable gaps · 2 = loosely related, score of limited meaning · 1 = not meaningful.

The agents' text is kept as written. Typical values and bands marked approximate or unverified are their estimates,
not published norms. Nothing in this report has been applied yet.

**Checked by the main session against the code (2026-11-13):**
- Reaction Time: the green fades in over 75 ms (`transition-colors duration-75`, `ReactionTest.tsx`) while the timer
  already runs, so every reaction includes part of that fade. Confirmed.
- Go / No-Go: 0.8 s per wrong click and missed green (current code). Confirmed.
- Visual Memory: 3 wrong clicks allowed per level, feedback on every click. Confirmed.

## Overview

| Test | Current name | Recommended name | Relevance | Method | Score | Overall | Top improvement |
|---|---|---|---|---|---|---|---|
| reaction | Reaction Time | Reaction Time | 5 | 4 | 4 | 4 | Remove the 75 ms fade-in on green and timestamp after paint |
| visual-memory | Visual Memory | Pattern Memory | 4 | 3 | 3 | 3 | Stop instant per-click feedback / free misses from enabling probing; show "Most tiles" |
| stroop | Stroop Test | Stroop Test | 5 | 4 | 3 | 4 | Median-based same/different times plus a colour-blind note |
| number-memory | Number Memory | Number Memory | 5 | 3 | 3 | 3 | One second chance per run (WAIS uses 2 trials per length) |
| sequence-memory | Sequence Memory | Sequence Memory | 4 | 2 | 3 | 3 | Honest skill line and rules: it's a growing, repeated sequence (learning, not span) |
| number-order | Number Order | Chimp Test (or keep) | 3 | 3 | 3 | 3 | Second chance per run; optionally cap study time per tile |
| flash-order | Flash Order | Flash Order | 3 | 3 | 2 | 3 | Lives (a miss repeats the same flash) to cut one-shot luck |
| word-memory | Word Memory | Word Memory | 4 | 3 | 3 | 3 | Cap repeats per word; show hit and false-alarm rates |
| n-back | N-Back | N-Back | 5 | 4 | 4 | 4 | Category → Memory (or a skill line that fits Focus) |
| go-no-go | Go / No-Go | Go / No-Go | 5 | 3 | 3 | 3 | Shape cue for red; show "Clicked on red x / 9" |
| `time-estimation` | Time Estimation | Time Estimation | 4 | 3 | 3 | 3 | Say "counting is allowed" (and fix the skill line); add a Consistency (spread) stat |
| `quick-count` | Quick Count | Quick Count | 4 | 4 | 4 | 4 | Split Tendency into ≤ 20 vs > 20 dots (underestimation grows with number) |
| `mental-math` | Mental Math Sprint | Mental Math Sprint | 4 | 3 | 3 | 3 | Address the keyboard vs mouse-keypad speed gap (rules hint); per-operation stats |
| `steady-hand` | Circle Chase | Circle Chase | 4 | 4 | 3 | 4 | Add "Avg distance from centre" (continuous, no ceiling) |
| `aim-trainer` | Aim Trainer | Aim Trainer | 4 | 3 | 4 | 4 | Check that free misses don't reward spamming; add Centre rate; consider Motor |
| `tap-speed` | Tap Speed | Tap Speed | 4 | 3 | 3 | 3 | State the technique ("use one finger" or "any technique counts") |
| `stop-the-bar` | Stop the Bar | Stop the Bar | 4 | 3 | 3 | 3 | Add a Consistency (VE) stat; consider 6–8 rounds; say "bar" not "marker" |
| `mental-rotation` | Mental Rotation | Mental Rotation | 5 | 4 | 4 | 4 | Show time for small vs big turns (the classic angle effect) |
| `line-tracing` | Line Tracing | Line Tracing | 4 | 3 | 3 | 3 | Normalise the path length (about ±9 % layout luck now) |
| `geometry` | Eye for Geometry | Eye for Geometry | 3 | 3 | 3 | 3 | Bisection/angle Tendency stat; tune tolerances from data |

## Part 1: Speed, memory and focus tests

Everything was read on `develop`: `/home/main/Projects/skill-lab/src/tests/registry.ts`, each `scoring.ts` and component, and `/home/main/Projects/skill-lab/docs/SPEC.md`. Per your instructions there was no browser or icon check. Where I quote reference values that I read off a figure or found only in a secondary source, I mark them **approximate** or **unverified**. Bands I propose myself are rough guesses for this browser/mouse setup. They are not norms, and you should calibrate them against your own history data.

---

### Reaction Time (`reaction`): overall 4 / 5
**What it does now:** The board turns red, then green after a uniform random wait of 1.5–5 s. The player clicks as fast as possible. Clicking while red, or less than 100 ms after green, counts as early and restarts the round; more than 5 early clicks end the run with No score. After 5 valid rounds the score is the median RT, and the result also shows average, fastest, slowest and the early-click count.

**1. Name**
- Current name: "Reaction Time" is the standard term, instantly understood, and matches Human Benchmark, which many players know. It fits well.
- Alternatives:
  - "Simple Reaction": the exact research term, but a bit dry.
  - "Green Light": catchy and says what you wait for, but hides the "speed" idea.
  - "Reflex Test": popular wording, but "reflex" is technically wrong (this is a voluntary response).
- **Recommendation:** keep **Reaction Time**.

**2. Scientific relevance**
- **Comparable studies / paradigms:** Simple visual reaction time (SRT), the oldest paradigm in the field. Woods et al. (2015) tested 1469 adults with 120 test trials after 20 practice trials, SOAs of 1000–1800 ms and a gaming mouse. The mean SRT was 231 ms raw, about 213 ms after subtracting about 18 ms of measured display and mouse delay. The 18–24 group averaged about 218 ms raw. Intra-subject SD was about 40 ms (CV about 17%). The authors note that standard mouse drivers can add 20 ms or more, and some setups up to about 100 ms ([Woods et al. 2015, PMC4374455](https://pmc.ncbi.nlm.nih.gov/articles/PMC4374455)). Human Benchmark reports a site median of about 273 ms over many millions of clicks. That figure includes consumer input lag and is only secondhand ([Blur Busters](https://www.blurbusters.com/human-reflex-part1-input-lag-and-the-limits-of-human-reaction-time), [Insider Gaming](https://insider-gaming.com/what-is-reaction-time-and-does-it-make-you-better-at-cs2-or-valorant/)). The 100 ms anticipation cut-off is the usual convention.
- **Differences from the research setup:**
  - *5 trials instead of 100+:* This matters most. With a 40–50 ms SD per trial, the median of 5 still moves by roughly ±20–25 ms between runs. The median is the right choice for so few trials (it resists one distracted round), but the score stays noisy. I'd ask the scoring-reviewer to measure the run-to-run spread.
  - *The green fades in.* The board has `transition-colors duration-75`, so the red → green change ramps over 75 ms while the clock starts at the beginning of the ramp. That adds roughly 20–40 ms of perceptual delay that research avoids (Go / No-Go deliberately has "No fade"). This is a cheap fix with a real effect.
  - *Timestamp before paint.* `goAt = performance.now()` is taken in the timer callback, before React renders and the browser paints the green. That adds about 0–17 ms (one frame), plus display latency. The bias is constant per machine, so it is fine for personal progress but inflates scores against lab values.
  - *Foreperiod:* the 1.5–5 s uniform wait is fine. Research uses variable foreperiods for the same reason (to prevent anticipation), and Woods shows short SOAs slow RT, so 1.5 s minimum is sensible.
  - *Text cue:* the screen also changes its text ("Wait for green…" → "Click!"). That is good for colour-blind players. The colour change is red to green, but the luminance also changes (rose-900 → emerald-700).
- **How accurate is the score?** It is decent for a game. The median of 5 is robust to a single lapse, the early-click rule removes anticipations, and blind clicking can't pay (cap of 5). Remaining noise: few trials, per-device latency (mouse polling, monitor, browser), and the fade. There is no ceiling or floor problem.
- **Can it tell you something about you?** Yes. It is basic processing plus motor speed, and research links it reliably to age (SRT slows about 0.5 ms/year in Woods 2015), alertness, fatigue and sleep. A low (fast) score means quick detection and response; a slow score is often the device or tiredness. It says nothing about intelligence or health. Approximate bands for this browser/mouse setup: under 220 ms exceptional, 220–260 very good, 260–310 typical, over 340 slow (often fatigue or device).
- **What's missing that research would add:**
  - Remove the 75 ms fade on the green change.
  - Stamp `goAt` in a `requestAnimationFrame` after the green is committed.
  - Optionally show trial-to-trial variability: the spread between fastest and slowest is already shown, and research finds intra-individual variability informative.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | The classic, best-understood speed measure. |
| Method | 4 | Correct paradigm, anticipation rule and median; only 5 trials, plus the fade and pre-paint timestamp. |
| Score | 4 | Meaningful and easy to compare with yourself; ±20 ms noise and device bias limit comparisons with others. |
| **Overall** | **4** | Fits well; two small timing fixes would make it closer to lab values. |

**4. Other feedback:**
- The rules are accurate to the code ("more than 5" matches `> MAX_TOO_SOON`) and complete. The tagline, skill line and Speed category are all right.
- Removing the fade lowers scores by a few tens of ms. No `scoreVersion` bump is needed while in development.

---

### Visual Memory (`visual-memory`): overall 3 / 5
**What it does now:** Each level lights `level + 2` tiles together for 1 s on a grid that grows 3×3 (levels 1–2) → 4×4 (3–5) → 5×5 (6–9) → 6×6 (10–14) → 7×7 (15+). The player clicks them back in any order; each correct click is marked right away. A third wrong click fails the level, which is retried with a new pattern; 3 failed levels in the whole run end it. The score is the number of the last level cleared.

**1. Name**
- Current name: it is clear and matches Human Benchmark. It is broad, though: Sequence Memory, Number Order and Flash Order are also visual memory. What this test specifically uses is a *pattern* shown all at once.
- Alternatives:
  - "Pattern Memory": says what you remember, and matches the research term "pattern span" (Visual Patterns Test).
  - "Light Grid": catchy, but less clear about the skill.
  - "Tile Pattern": plain and descriptive.
- **Recommendation:** **Pattern Memory**. It is more specific than "Visual Memory", is the research name, and doesn't clash with the other memory tests.

**2. Scientific relevance**
- **Comparable studies / paradigms:** Visual matrix patterns (Phillips) and the **Visual Patterns Test** (Della Sala et al. 1997/1999). In the VPT, black/white matrix patterns of growing size are shown for 3 s and then reproduced; there are 3 patterns per size, and span is the size at which recall breaks down. Della Sala et al. designed it to measure visual short-term memory *without* the sequential component that Corsi measures ([Della Sala et al. 1999, Stirling record](https://www.stir.ac.uk/research/hub/publication/765722)). Brown, Forbes & McConnell (2006) tested young adults (mean age about 29) with 3 s exposure, 10 s delay and perfect recall required. Their mean span was **8.7 cells (SD 1.55)** for hard-to-name patterns and **10.1 (SD 2.1)** for easy-to-name ones ([Brown et al. 2006 PDF](https://strathprints.strath.ac.uk/47779/1/Brown_et_al._2006_QJEP.pdf)).
- **Differences from the research setup:**
  - *1 s exposure instead of 3 s:* harder, which lowers spans. It makes the test faster and more fun, so it is fine.
  - *No delay before recall:* easier.
  - *Up to 2 wrong clicks still pass a level, and each click gives instant right/wrong feedback.* This is the main gap. VPT needs a perfect reproduction. Here a player who remembers all tiles but one can "probe" an uncertain spot and use the feedback. That inflates scores and adds luck at the edge of span.
  - *One pattern per level (with retries from a 3-life pool) instead of 3 per level:* acceptable, because the lives act like extra trials.
  - *The grid size jumps at levels 3, 6, 10 and 15.* Tile density stays near 31–35% after 3×3 (44% at level 2), so the jumps are mild. The jump does make the level after a jump a bit harder.
  - *The score is in "levels", not "tiles":* level L = L + 2 tiles, so the number doesn't map directly onto research span (cells).
- **How accurate is the score?** Moderately. The lives pool smooths out a single unlucky pattern. The 2 free misses with feedback make the final level partly about guessing luck. There is no practical ceiling (the 60% fill cap is never reached) and no floor problem (level 1 is 3 tiles on 3×3).
- **Can it tell you something about you?** Yes, roughly: how much of a static visual layout you hold after a 1 s glance (visual short-term memory capacity). The VPT finding that verbal coding helps (8.7 vs 10.1) means players who "name shapes" do better, which is legitimate strategy. Approximate translation: a typical VPT span of about 9 cells is about level 7 here. Because of the shorter exposure, no delay and the leniency, treat these bands as unverified: level 5–8 typical, 9–11 very good, 12+ exceptional. This is not an IQ or clinical measure.
- **What's missing that research would add:**
  - Smallest change: count only the *first* wrong click as a fail-risk. Alternatively, keep the 3 misses but give no per-click right/wrong feedback until the level ends, so a level passes only on a clean or near-clean recall. Either change lowers scores.
  - Add a result stat "Most tiles: N" (= level + 2) so the number reads like a research span.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Pattern span is an established visual short-term memory construct. |
| Method | 3 | Recognisable VPT variant, but lenient (2 free misses with feedback) and 1 s exposure. |
| Score | 3 | Reflects visual memory, but in levels rather than tiles and partly inflated by probing. |
| **Overall** | **3** | Good game; leniency and units blur what the number means. |

**4. Other feedback:**
- The rules are accurate. Small gap: they don't say it starts with 3 tiles. Suggested first line: "3 tiles light up for a second, then go dark. Each level adds one more."
- Tagline and skill are fine. The Memory category is right.
- Nice research fit: Visual Memory (simultaneous) and Sequence Memory (sequential) mirror the VPT/Corsi split that Della Sala et al. found to be separable abilities. Worth keeping both.

---

### Stroop Test (`stroop`): overall 4 / 5
**What it does now:** A colour word (RED / BLUE / GREEN / YELLOW) is shown in an ink colour; 75% of trials mismatch. The player clicks the button labelled with the ink colour's name (buttons are neutral, with word labels, keys 1–4) for 45 s, self-paced. The score is correct − wrong. The result shows the mean correct RT for same vs different word/ink and their difference.

**1. Name**
- Current name: "Stroop Test" is the established name and many players know it. It fits well.
- Alternatives:
  - "Stroop": shorter, same recognition.
  - "Color Clash": catchy and says what happens, but loses the well-known name.
  - "Ink, Not Word": describes the rule, but reads awkwardly as a title.
- **Recommendation:** keep **Stroop Test**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The Stroop colour-word task, reviewed across 700+ studies by MacLeod (1991) ([PubMed](https://pubmed.ncbi.nlm.nih.gov/2034749/), [full text](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/files/strooprev_0.pdf)).
  - Closest clinical version: the **Golden Stroop Color and Word Test**, which counts items named correctly in **45 s** per page (Word, Color, Color-Word). Interference is the predicted CW score (W×C/(W+C)) minus the actual CW score ([PAR](https://www.parinc.com/products/STROOP-ADULT-NU); formula described in [this article](https://pmc.ncbi.nlm.nih.gov/articles/PMC5036998)). Your 45 s count is essentially a Golden Color-Word page, done with clicks.
  - Computerised keypress versions instead compare incongruent vs congruent RT. Teaching sources give typical differences of about 80–200 ms. This is only illustrative; I found no verified online keypress norm ([Nottingham course chapter](https://psychology.nottingham.ac.uk/staff/lpzjd/psgy1001-22/interference-tasks.html)).
- **Differences from the research setup:**
  - *No baseline page:* There is no word-only or colour-only condition, so correct − wrong is mostly **processing speed under conflict**, not interference. Golden's own CW score correlates strongly with processing speed ([PMC5036998](https://pmc.ncbi.nlm.nih.gov/articles/PMC5036998)). It is acceptable, but the score mainly says "fast and accurate with conflict present".
  - *75% incongruent:* With mostly incongruent trials the Stroop effect **shrinks**. Players learn to down-weight the word (proportion-congruent effect, Logan & Zbrodoff 1979; review in [Bugg & Crump 2012](https://www.frontiersin.org/articles/10.3389/fpsyg.2012.00367/pdf)). The "Difference" shown on the result screen is therefore smaller than in a 50/50 design. That is fine for difficulty, but worth knowing.
  - *Mouse clicks on word-labelled buttons instead of voice:* The buttons are labelled with words, so the player maps ink → word → button, which adds reading and search time. Manual Stroop effects are generally smaller than vocal ones, and key/button position affects RT ([Nottingham chapter](https://psychology.nottingham.ac.uk/staff/lpzjd/psgy1001-22/interference-tasks.html)). The fixed layout keeps this consistent between runs.
  - *Few congruent trials:* At about 1 answer/s, 45 s gives about 40 answers, of which only about 10 are congruent. The congruent mean is noisy. Difference scores are known to be unreliable even with hundreds of trials ([Hedge, Powell & Sumner 2018](https://orca.cardiff.ac.uk/id/eprint/102138/)).
  - *Colour vision:* red and green ink (#ef4444 / #22c55e) are the classic confusion pair. About 8% of men of Northern-European ancestry have a red–green deficiency ([worldwide prevalence review](https://pubmed.ncbi.nlm.nih.gov/22472762/)). The test can't avoid colour, but it should be flagged.
  - *Feedback during the run* (a ring after each answer): fine.
- **How accurate is the score?** The main score is reasonably stable: about 40 trials, a throughput measure, and correct − wrong blocks mashing. The interference "Difference" line is noisy: it can easily flip by ±50 ms between runs, or even show "faster".
- **Can it tell you something about you?** The score shows how fast you work while ignoring a strong distractor (selective attention / interference control plus speed). The Difference line shows how much the word slows you, and it can only be trusted roughly. Rough guess bands (unverified, calibrate from data): about 30–40 pts typical, 45+ very good. This is not a diagnosis, and colour-vision differences lower the score.
- **What's missing that research would add:**
  - Use the **median** instead of the mean for the same/different times, which reduces outlier noise. This changes no score.
  - Add a rules or result note for colour-blind players.
  - Optional: raise congruent trials to about 33–50% for a bigger, more visible interference effect. This changes difficulty, so it is the user's call.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | The flagship attention-interference task. |
| Method | 4 | Very close to Golden's 45 s Color-Word page; no baseline, 75% incongruent. |
| Score | 3 | Mostly speed-under-conflict; the interference stat is shown but noisy. |
| **Overall** | **4** | Well grounded and fun; the score label is honest about what it counts. |

**4. Other feedback:**
- The rules are accurate to the code and complete. The tagline is excellent.
- The skill line "selective attention" is acceptable. "ignoring a distracting word (selective attention)" would be plainer.
- The Focus category is right.
- Suggested extra scoring line: "Red and green are hard to tell apart for color-blind players."

---

### Number Memory (`number-memory`): overall 3 / 5
**What it does now:** A random number (no leading zero) is shown all at once for 1 s + 0.5 s per digit (3 digits = 2.5 s, 10 digits = 6 s), then typed back on a keypad or keyboard. It starts at 3 digits and adds one per correct answer; one mistake ends the run. The score is the longest correct length (0 if the first number fails). The end screen shows the target and the typed digits side by side.

**1. Name**
- Current name: "Number Memory" is clear and is Human Benchmark's name for this test. It fits well.
- Alternatives:
  - "Digit Span": the research and IQ-test name. It is recognisable to some, but more clinical-sounding.
  - "Long Number": catchy but vague.
  - "Number Recall": plain, but no better than the current name.
- **Recommendation:** keep **Number Memory**.

**2. Scientific relevance**
- **Comparable studies / paradigms:** **Forward digit span** (WAIS-IV Digit Span Forward). Digits are read aloud at 1 per second, with two trials per length; the test stops after both fail ([Pearson WAIS-IV](https://www.pearsonassessments.com/en-us/Store/Professional-Assessments/Cognition-%26-Neuro/Wechsler-Adult-Intelligence-Scale-Fourth-Edition/p/100000392)). Typical adult forward span is about 6–7 digits, and about 89% of adults fall in 5–8 (Kaplan et al. 1991, cited in a [neuropsych review](https://www.scribd.com/document/379281386/Spans-LNS-TMT-SDMT-4-pdf); secondary source, unverified). Miller's "7 ± 2" is the popular framing.
- **Differences from the research setup:**
  - *Simultaneous visual display instead of one digit per second spoken:* This matters most. The player sees the whole number for several seconds, can group it into chunks ("847 / 29 / 316") and rehearse while it is still visible. Scores therefore run higher than auditory span and reward chunking strategy.
  - *Exposure grows with length* (6 s for 10 digits): this further helps rehearsal. It is fine for fun.
  - *One trial per length, sudden death:* A single typo or a lapse at 6 digits ends a run that could have reached 9. WAIS uses 2 trials per length for this reason. This is the biggest reliability issue.
  - *Typing errors count as memory errors:* this is small with a keypad.
  - *No delay or distraction before recall:* the same as digit span, so fine.
- **How accurate is the score?** Noisy. The stopping point is a single coin-flip at your limit, so run-to-run spread is likely ±1–2 digits. I'd ask the scoring-reviewer to simulate this. There is no ceiling. The floor is 0 (fail at 3), which is rare.
- **Can it tell you something about you?** It shows verbal/numeric short-term memory plus chunking skill. A high score means you hold and group digits well; practice with chunking strategies raises it a lot. It is not an IQ score, even though digit span is one WAIS subtest. Approximate bands for this visual, chunkable setup (unverified): 7–8 typical, 9–10 very good, 12+ exceptional.
- **What's missing that research would add:**
  - Smallest change: **one second chance per run** (a failed length is repeated once with a new number). This halves the luck at the stopping point and mirrors WAIS's two trials per length, while keeping whole-digit scores. It changes scores. No `scoreVersion` bump is needed in development.
  - Optional, and less fun: reveal digits one at a time, which would be true span.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | Digit span is a core, well-normed construct. |
| Method | 3 | Simultaneous visual display with long exposure, and sudden death on one trial. |
| Score | 3 | Meaningful, but one slip decides it and chunking inflates it compared with norms. |
| **Overall** | **3** | Good game; a second chance would make the number much more trustworthy. |

**4. Other feedback:**
- Rules: "A number appears for a moment" undersells the 2.5–6 s exposure. Suggested: "A number appears for a few seconds (longer numbers stay longer), then disappears."
- Tagline, skill and the Memory category are right.
- The result's digit comparison is a good detail.

---

### Sequence Memory (`sequence-memory`): overall 3 / 5
**What it does now:** On a 3×3 grid, tiles flash one after another (450 ms on / 200 ms gap; from length 8 on, 350 / 150 ms). The player clicks them in the same order. Each round the *same* sequence returns with one new step added; tiles can repeat, but never twice in a row. One wrong click ends the run. The score is the longest sequence repeated.

**1. Name**
- Current name: "Sequence Memory" is clear and honest, and is Human Benchmark's name for this test.
- Alternatives:
  - "Follow the Lights": catchy and descriptive.
  - "Corsi Blocks": the research name, but it is wrong here because this is not a Corsi task (see below).
  - "Echo": short and playful, but needs the tagline.
  - Avoid "Simon", which is a commercial game name.
- **Recommendation:** keep **Sequence Memory**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - **Corsi block-tapping**: the experimenter taps a *new* sequence on 9 irregular blocks at about 1 block/s, with two trials per length. Span is the longest correct length. Healthy adults average about 6.2 (SD 1.3) per Kessels et al. 2000 ([PsyToolkit](https://www.psytoolkit.org/library/corsi.html), [Inquisit manual](https://www.millisecond.com/download/library/v6/corsiblocktappingtask/corsiblocktappingtask_forward/corsiblocktappingtask_forward/corsiblocktappingtask.manual); secondary sources).
  - Corsi was itself modelled on Hebb's repeated-sequence digit task ([Cognitive Atlas](https://cognitiveatlas.org/task/id/tsk_4a57abb9498df/)). Your **cumulative** design is closer to **supra-span / Hebb repetition learning**: a sequence repeated across trials is learned beyond span, including for spatial locations ([Ueda/Sukegawa/Saito, Kyoto repository](https://repository.kulib.kyoto-u.ac.jp/dspace/bitstream/2433/241755/1/s13421-019-00921-9.pdf)).
- **Differences from the research setup:**
  - *Cumulative instead of a fresh sequence each round:* This matters most. At length 10 the player has already seen and reproduced the first 9 steps nine times, and only 1 step is new. The score therefore measures **how long a sequence you can learn and keep repeating**, not the span of one viewing. Scores will be well above Corsi's about 6. I found no published norm for this cumulative version (unverified).
  - *3×3 regular grid instead of 9 scattered blocks:* easier to verbalise or chunk ("top-left, centre…"). Minor.
  - *Repeats allowed (non-consecutive):* Corsi never repeats a block. This adds a little difficulty and isn't mentioned in the rules.
  - *Playback speeds up from length 8:* there is a difficulty step in the middle of the scale. Fine for pacing, but it is a small discontinuity in what each level means.
  - *One mistake ends it, with one trial per length:* the stopping point has luck in it. This is less severe than in Number Memory, because the rehearsed prefix is very stable.
- **How accurate is the score?** It is fairly consistent per player, because the learned prefix makes runs repeatable. A single slip on a long sequence still costs a lot. There is no ceiling; long runs get slow. The floor is 0.
- **Can it tell you something about you?** It shows spatial-sequential memory plus learning by repetition and sustained concentration. A high score means you build and hold long movement sequences. It is not comparable to a Corsi span, and certainly not a clinical measure. Bands: no verified norm; collect your own data. As a rough guess, 9–12 is typical and 15+ very good, but this is unverified.
- **What's missing that research would add:**
  - Keep the game. Make the skill line honest (see below).
  - Optional result stat: "Longest new sequence" is not possible here. Instead, consider a backlog idea: a separate fresh-sequence "Corsi" mode if you ever want a true span.
  - Removing the speed-up step would make levels uniform. It is a score change; low priority.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Spatial sequence memory is established (Corsi, Hebb learning). |
| Method | 2 | Cumulative presentation turns a span task into a repetition-learning task. |
| Score | 3 | Consistent and meaningful as "sequence learning", not as span. |
| **Overall** | **3** | Fun and honest by name; the skill line overstates the span link. |

**4. Other feedback:**
- Skill "memory for order" → suggested: "remembering a growing sequence of positions".
- Rules are accurate. Missing: a tile can light up more than once. Suggested addition: "A tile can light up more than once, never twice in a row."
- Also worth saying the sequence is kept and extended: "Every round the same sequence plays again, one step longer." This is the key fact of the game and isn't explicit now.
- The Memory category is right.

---

### Number Order (`number-order`): overall 3 / 5
**What it does now:** Numbers 1..N appear on random cells of a 6×5 grid for up to 15 s; clicking "1" hides them early. Then the player clicks the hidden tiles in order; the tile *positions* stay visible, only the numbers are hidden. It starts at 5 tiles and adds 1 per cleared round; one wrong tile ends the run. The score is the most tiles cleared in one round (0 if round 1 fails). The result shows memorize time used per round and average time per tile.

**1. Name**
- Current name: "Number Order" is plain and accurate, but bland. It doesn't hint at the memory part.
- Alternatives:
  - **"Chimp Test"**: the popular name for exactly this task. It comes from the Kyoto chimpanzee Ayumu study and Human Benchmark's version, and many players know it. It has a fun backstory. Downside: it borrows Human Benchmark's label, and it is not a research term.
  - "Hidden Numbers": says what happens.
  - "Number Map": short, and hints at "where".
- **Recommendation:** **Chimp Test** if you're happy borrowing the popular name (it is the best-known name for this exact task, and the backstory is fun on the rules screen). Otherwise keep **Number Order**. "Hidden Numbers" is not clearly better.

**2. Scientific relevance**
- **Comparable studies / paradigms:** The **masking task** of Inoue & Matsuzawa (2007, *Current Biology*). Numerals appear at random screen positions; touching the first one replaces all others with white squares, and the subject touches the squares in ascending order. Chance is 1/120 for 5 numerals. Earlier work by Kawai & Matsuzawa (2000) measured a numerical "memory span" this way ([paper PDF](https://www.gwern.net/docs/www/www.cell.com/566764ff1ec0be394841f7c1ef51d8604468abe4.pdf)). Your "click 1 to hide" rule is exactly this procedure.
- **Differences from the research setup:**
  - *Viewing time:* In Inoue's study, viewing was limited by the subject's own speed (touching 1 starts the response immediately). Here the player gets up to 15 s and is encouraged to study, so the task becomes **deliberate memorisation of a route** (chunking the path), not a glance. That makes it a supra-span study task rather than a span task. This is fine for fun, but it measures strategy plus effort as much as capacity.
  - *Consecutive numbers 1..N instead of non-adjacent subsets (e.g. 2-3-5-8-9):* slightly easier. Minor.
  - *Up to 30 positions and no cap on N (Inoue used up to 9):* fine.
  - *One trial per size, sudden death:* luck at the stopping point.
  - *Positions stay visible:* the same as the masking squares, so the task is binding order to location (which number was where), not remembering locations.
- **How accurate is the score?** It is moderately consistent, because 15 s of study is forgiving. A single misclick ends it. There is no ceiling; the floor is 0.
- **Can it tell you something about you?** It shows how well you memorise where items are and in what order when given time: visuospatial memory plus strategy. A high score shows good chunking of a route. I found no verified human norm for this exact version (Human Benchmark's averages are unverified), so collect your own. Not an IQ or clinical measure.
- **What's missing that research would add:**
  - A second chance per run, as in Number Memory.
  - Optional: a shorter study cap (e.g. 10 s) or a per-tile budget (e.g. 1 s per tile) would keep it closer to a capacity measure. Score-changing; low priority.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 3 | A published but niche paradigm; the human construct (location–order binding) is real but less standard. |
| Method | 3 | Faithful masking procedure; the 15 s study time and sudden death shift what it measures. |
| Score | 3 | Meaningful as "how many you can memorise with time", but no norms. |
| **Overall** | **3** | Solid and fun; mostly a naming and grounding opportunity. |

**4. Other feedback:**
- The rules are accurate and complete ("Clicking 1 hides the numbers right away" matches the code).
- Skill "spatial memory" → suggested: "remembering where things were, and in what order".
- If renamed to Chimp Test, a one-line nod in the howTo or tagline would add fun, e.g. tagline "A chimp named Ayumu aces this. Can you?" This must stay accurate: Ayumu is famous for the *flash* version.
- The Memory category is right.

---

### Flash Order (`flash-order`): overall 3 / 5
**What it does now:** This is Number Order with always 5 numbers. The numbers stay visible for 1000 ms in round 1, then 10% less each cleared round (1000, 900, 810, 729, 656, 590, 531, 478, 430, 387, 349, 314, 282, 254, 229, 206 …), after which they become hidden tiles. One wrong tile ends the run. The score is the shortest flash still cleared, lower is better. Failing round 1 gives No score.

**1. Name**
- Current name: "Flash Order" is short and catchy, and pairs well with Number Order. "Flash" says it's brief; "Order" hints you click in order.
- Alternatives:
  - "Glimpse": catchy, but loses "order".
  - "Flash Numbers": slightly clearer about the content.
  - "Chimp Flash": works if Number Order becomes Chimp Test.
- **Recommendation:** keep **Flash Order**.

**2. Scientific relevance**
- **Comparable studies / paradigms:** This is exactly the **limited-hold memory task** of Inoue & Matsuzawa (2007): 5 numerals shown for 650, 430 or 210 ms, then replaced by white squares, and touched in order. Each human received one session of 50 trials; 9 university students took part. Reading their Figure 2 (**approximate**), humans got about 78% correct at 650 ms, about 65% at 430 ms and about 37% at 210 ms. The chimp Ayumu stayed near 80% at all durations ([paper PDF](https://www.gwern.net/docs/www/www.cell.com/566764ff1ec0be394841f7c1ef51d8604468abe4.pdf)). With extensive practice, humans can match Ayumu (Silberberg & Kearns 2009; Cook & Wilson 2010) ([Cook & Wilson PDF](https://www.Gwern.net/doc/algernon/2010-cook.pdf), [ScienceNews summary](https://www.sciencenews.org/article/chimp-champ-ape-aces-memory-test-outscores-people)). The authors chose 210 ms because it is about one saccade: there is no time to move the eyes across the screen.
- **Differences from the research setup:**
  - *Sudden death, one trial per duration:* This matters most. Even at 650 ms, untrained humans fail about 1 in 5 trials. A run is a chain of independent tries with falling success chances, so where it stops is largely **luck**: the same person could end at 729 ms one run and 349 ms the next. Research estimates accuracy over 50 trials per duration. I'd ask the scoring-reviewer to simulate the spread; I expect it to be large.
  - *A descending staircase with no "down" step:* Psychophysics uses up/down staircases that converge on a threshold. Yours only goes down until the first failure.
  - *Display timing:* The countdown is rAF-based and ends on the first frame after the deadline, so the real exposure is about 0–17 ms longer, plus render time. At 200 ms that is up to about 10% (more on 30 Hz screens). It is only relevant for very good players.
  - *Strong practice effects* (as in Cook & Wilson): scores will improve a lot with repetition. That is fine, but worth knowing.
  - The hidden tiles act like Inoue's white squares (same locations), which is good.
- **How accurate is the score?** Low reliability per run, because of one-shot luck. The format "best flash cleared" is meaningful, but a single run's value is closer to "how far your luck held". There is no hard ceiling: rounds below about 50 ms are effectively a few frames. The floor is No score.
- **Can it tell you something about you?** In principle it shows how much you take in at a single glance (rapid visual encoding into short-term memory). Using the Inoue figure as approximate anchors: clearing about 650–430 ms is typical for an untrained adult, under about 300 ms very good, around or under 210 ms exceptional. These are approximate and from a small sample (n = 9). Not an IQ measure; the "chimps beat humans" story is about one practised chimp.
- **What's missing that research would add:**
  - Smallest change: **lives**, e.g. 3 misses in total, where a miss repeats the same duration. This turns it into a forgiving staircase and cuts the luck substantially. Score-changing; no bump needed in development.
  - Bigger change (optional): a 1-up/1-down staircase, with the score being the average of the last few reversals.
  - Result stat: show "Failed at" (already shown) and the number of misses once lives exist.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 3 | A real published paradigm (limited-hold); the construct (glance capacity) is legit but niche. |
| Method | 3 | Faithful stimulus and procedure; one-shot descending staircase. |
| Score | 2 | Right concept, but a single run is dominated by where the luck ran out. |
| **Overall** | **3** | Great hook, best research fit of the order games, but needs lives to make the number trustworthy. |

**4. Other feedback:**
- The tagline "5 numbers, less time every round." doesn't say what you do. Suggested: "Glimpse 5 numbers, then click them in order."
- Skill "memory under time pressure" → suggested: "how much you take in at a glance". "Time pressure" suggests response speed, which isn't scored.
- The rules are accurate. The rules screen could mention the chimp story briefly, which would be fun and grounded.
- The Memory category is right; a case for Speed exists (encoding speed), but memory dominates.

---

### Word Memory (`word-memory`): overall 3 / 5
**What it does now:** Words from a 548-word list appear one at a time, self-paced with no time limit. The player answers SEEN or NEW. Once 3 words have been shown, each item has a 40% chance of being a repeat of any earlier word (never the one just shown); a word can come back many times. There are 3 lives; the score is the number of correct answers. The result shows different words seen, average time per answer, and mistakes on seen vs new words.

**1. Name**
- Current name: clear. Human Benchmark calls it "Verbal Memory". It fits well.
- Alternatives:
  - "Seen or New": catchy, says exactly what you do.
  - "Verbal Memory": the research-ish and Human Benchmark term.
  - "Déjà Vu": fun, but less clear.
- **Recommendation:** keep **Word Memory**. "Seen or New" is a good alternative if you prefer action names.

**2. Scientific relevance**
- **Comparable studies / paradigms:** The **continuous recognition** paradigm (Shepard & Teghtsoonian 1961). This is a single long stream with no separate study phase, and every item is judged old or new. Accuracy falls and RT rises with the lag since the item was last seen ([Freund, Loftus & Atkinson 1969](https://faculty.washington.edu/gloftus/MiscMissingArticles/Freund.Loftus.Atkinson.1969.pdf); lag findings summarised in [Singh et al.](https://people.bu.edu/marc777/docs/SinghEtal-revised.pdf)). Research reports hit rate, false-alarm rate and d′, often per lag.
- **Differences from the research setup:**
  - *Unlimited repeats of the same word:* In research each item is typically shown once as new and once as old. Here a word can return 3–5 times, and every return makes it easier. Many "SEEN" answers late in a run are therefore near-free points, and the score partly rewards **survival length** rather than memory.
  - *Uniform lag sampling over the whole pool:* lags grow as the pool grows, which is a sensible natural difficulty curve.
  - *Errors come from both sides:* As the pool grows, a common new word can feel familiar (false alarm), and an old word seen once long ago can be missed. That is real recognition memory, which is good.
  - *Self-paced, no deadline:* fine. Speed doesn't count, and players may take long pauses to think.
  - *Score = correct answers until 3 errors:* this mixes accuracy with endurance. Two players with the same error rate get very different scores depending on when their errors happened.
  - *English words:* non-native speakers are mildly disadvantaged. Fine, but worth knowing.
- **How accurate is the score?** It is fairly noisy: the score depends on when the 3rd error happens, which with error rates of a few percent is very random. There is no ceiling (very good players can go for many minutes). The floor is 0 (rare).
- **Can it tell you something about you?** Yes, broadly: how well you recognise what you've seen among growing familiar material (recognition memory, including resisting false familiarity). I found no norm for this setup; collect your own. It is not a clinical memory test.
- **What's missing that research would add:**
  - Smallest change: **limit repeats**, e.g. each word returns at most twice (or once). This keeps "seen" answers about real memory and makes long runs harder. Score-changing.
  - Result stat: replace or add **hit rate and false-alarm rate** (or "% of seen words recognised / % of new words correctly called new"). You already count the mistakes per kind, so this is a small step and the research-standard view.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Recognition memory is a core construct; continuous recognition is a classic design. |
| Method | 3 | Unlimited repeats and a survival score drift from the paradigm. |
| Score | 3 | Reflects memory, but inflated by easy multi-repeats and decided by when the 3rd error happens. |
| **Overall** | **3** | Good, simple game; capping repeats would make the score mean more. |

**4. Other feedback:**
- The rules are accurate. Missing: words can return more than once, and there is no clock. Suggested addition: "Words can come back several times. Take your time: there is no clock."
- The durationHint "~2 min" may be short for good players; there is no cap.
- Tagline, skill ("recognition memory") and the Memory category are right.

---

### N-Back (`n-back`): overall 4 / 5
**What it does now:** A square lights for 0.5 s on a 3×3 grid every 2.5 s. The player clicks MATCH when it is in the same spot as N steps before; it starts at 2-back. Each block has 16 + N items with exactly 5 matches among the 16 scored items. Feedback is given per item (hit / not a match / missed). A block with ≤ 2 mistakes moves up a level; every mistake beyond 2 costs one of 4 lives and the level is replayed. The score is 100 × the level the run ended at plus the balanced accuracy of the last block. The result shows a per-block table.

**1. Name**
- Current name: "N-Back" is the established research name and widely known (dual n-back training). It fits well.
- Alternatives:
  - "Spot N-Back": clarifies that it's positions.
  - "Steps Back": plain English, but loses recognition.
  - "Where Was It?": catchy, but vague.
- **Recommendation:** keep **N-Back**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The n-back working-memory task, used in a large neuroimaging literature ([Owen et al. 2005 meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6871745)).
  - Your design is very close to the **adaptive training n-back of Jaeggi et al. (2008, PNAS)**. That design uses blocks of **20 + n** trials with squares at 8 positions, each shown 500 ms with a 2500 ms interval (3 s per item), and **6 targets** per modality per block. n goes up after **fewer than 3 mistakes**, down after more than 5, and otherwise stays ([PMC2383929](https://pmc.ncbi.nlm.nih.gov/articles/PMC2383929/)).
  - Validity and reliability: Jaeggi et al. (2010) found n-back is a weak individual-differences measure, mainly because of low reliability, especially at 2-back (ceiling). Reliability is better at 3-back and in RTs ([Jaeggi et al. 2010, Memory](https://www.Gwern.net/doc/dual-n-back/2010-jaeggi-2.pdf)).
- **Differences from the research setup:**
  - *16 + N items, 2.5 s pace, 5 targets (31%) vs 20 + n, 3 s, 6 targets (30%):* Very close. The slightly faster pace makes it a bit harder. Fine.
  - *Single spatial modality instead of dual:* matches the single n-back versions. Fine.
  - *Lives instead of stepping down a level:* A game mechanic that serves the same purpose (finding the level where you break). Fine.
  - *Per-item feedback:* Training versions commonly give feedback. It helps fun and learning, though it makes this a training task more than a pure assessment.
  - *Lures not controlled:* Non-matches never repeat the previous position, but n−1 / n+1 lures are random. Minor.
  - *Practice effects:* n-back performance rises strongly with practice (that is what training studies show). Scores will climb over sessions, partly from task-specific strategy.
  - *Score uses the ending level plus the accuracy of the final (failed) block:* The accuracy part is from a block with ≥ 3 mistakes, so it says "how close you came at your breaking level". That is sensible. A run that ends with a 6-mistake crash scores lower than one ending with 3 mistakes on the same level, which is fair.
- **How accurate is the score?** Good for a web game. The adaptive level avoids the 2-back ceiling that hurts fixed-level reliability, the 16 scored items per block and lives smooth single lapses, and the threshold rule matches Jaeggi's. Remaining noise: one block decides each step, and with 5 matches, two misses is already 40% of targets. There is no ceiling. The floor is 2xx, which still distinguishes players who never pass 2-back.
- **Can it tell you something about you?** Yes: working-memory updating and sustained attention. Most adults can pass 2-back; reaching 4–5-back takes strong focus or practice. I couldn't verify single n-back level norms. As a rough, unverified guess: ending at 3xx is typical, 4xx good, 5xx+ very good. "Brain training improves IQ" claims are disputed in the follow-up literature, so avoid any such wording (the current text doesn't make it).
- **What's missing that research would add:**
  - Optional result stat: overall **hit rate vs false-alarm rate** (or d′) across all blocks. The per-block table already has the parts.
  - Nothing structural is needed.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | A central working-memory paradigm. |
| Method | 4 | Near-copy of Jaeggi's adaptive block rule; single modality, lives, per-item feedback. |
| Score | 4 | Adaptive level is meaningful; modest reliability per research and strong practice effects. |
| **Overall** | **4** | The best-grounded test of the ten. |

**4. Other feedback:**
- **Category vs skill mismatch:** the category is Focus, but the skill line says "working memory". Research classifies n-back as working memory, so **Memory** is the more honest category. If you keep Focus (defensible because of continuous monitoring), change the skill to "keeping track of a changing sequence (working memory)" so the Focus label reads naturally.
- Tagline "Keep track of what happened N steps ago" → suggested: "Was the square here N steps ago?" or "Spot when the square returns to where it was N steps ago." "What happened" is vague.
- The rules are accurate to the code. The block length (16 + N items) isn't mentioned; optional addition: "Each level is a block of about 20 squares."

---

### Go / No-Go (`go-no-go`): overall 3 / 5
**What it does now:** 30 circles (21 green, 9 red) appear one at a time in the same place, each for 0.8 s, with a 0.7–1.5 s blank between. The first two are always green and there are never two reds in a row. The player clicks on green and holds back on red. The score is the sum of green RTs + 0.8 s per missed green + 0.8 s per wrong click (on red, or during the blank). The result shows average, fastest and slowest RT, wrong clicks and missed greens.

**1. Name**
- Current name: "Go / No-Go" is the established research name and the tagline explains it immediately. It fits well.
- Alternatives:
  - "Red Light, Green Light": catchy and known from the children's game; long.
  - "Hold Your Fire": fun, says the inhibition part.
  - "Go / Stop": simpler, but could be confused with the stop-signal task.
- **Recommendation:** keep **Go / No-Go**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The go/no-go task (back to Donders, 1868). It measures **response inhibition**: commission errors on no-go trials are the key outcome, and omissions and go RT are secondary. Typical setups use about **4:1 go:no-go** (80/20) with about 1 s stimuli ([Testable guide](https://www.testable.org/experiment-guides/executive-function/go-no-go-task)).
  - Wessel (2018) showed that only **fast-paced designs with rare no-go trials** reliably produce a prepotent "go" tendency that must be inhibited; slow or equiprobable designs largely don't ([PubMed 28390090](https://pubmed.ncbi.nlm.nih.gov/28390090)).
  - When most people make few commission errors, the error count is insensitive (floor effects), which hurts reliability ([go/no-go ISI study, PMC8048576](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8048576/)).
- **Differences from the research setup:**
  - *70/30 instead of 80/20:* The no-go trials are less rare, so the urge to click is weaker. Moderate effect. Keep it if the fun balance works; 75/25 would be closer.
  - *Only 9 no-go trials:* Each commission is about 11% of the commission rate, so the inhibition part rests on very few trials. Research typically uses dozens to hundreds. This is the main reliability limit.
  - *Pace (about 1.5–2.3 s per trial):* moderately fast, which is fine.
  - *A red is always followed by a green* (never two reds): after a red, the next trial is predictable, which slightly lowers the inhibition demand. Minor.
  - *Composite score:* 21 go RTs of about 350 ms ≈ 7.3 s, while one commission = 0.8 s, which equals about 38 ms of slowness on every green. The score is therefore **mostly go speed**, with inhibition as a penalty. Research reports these separately (or uses combined scores like inverse efficiency). That is acceptable, but "impulse control" overstates what dominates the number.
  - *Colour is the only cue (green vs red):* This is the classic red–green confusion pair for about 8% of men ([prevalence review](https://pubmed.ncbi.nlm.nih.gov/22472762/)). Emerald-600 and rose-700 do differ in brightness, but some players will struggle. Research go/no-go tasks often use letters or shapes.
  - *Early clicks in the blank count as wrong clicks:* sensible (anticipations), but they are not inhibition failures on a no-go stimulus. They are lumped together in the stats.
- **How accurate is the score?** The speed part is reasonably stable (21 RTs). The inhibition part is coarse (0–9 events). Overall it is moderately reliable as a "fast and careful" composite. No ceiling issue; the floor is protected by the penalties and the idle-run No score.
- **Can it tell you something about you?** It shows how fast you respond while staying ready to hold back: a speed–control balance. A low total with zero wrong clicks means fast and controlled. Rough guess bands (derived from typical choice-RT values, not norms): under 7 s excellent, 7–8.5 s very good, 8.5–10 s typical, over 10 s slow or error-prone. **"Impulse control" can read as clinical** (ADHD vocabulary); see the wording suggestion below. Not a diagnosis.
- **What's missing that research would add:**
  - Smallest, no-score-change fix: **add a shape cue** (e.g. green circle vs red square, or a ✕ on red) so colour vision isn't required.
  - Result stat: split "Wrong clicks" into **"Clicked on red: x / 9"** (commission rate, the key research number) and "Too early: y".
  - Optional (changes scores): 24/6 or 25/5 for rarer no-gos (closer to 80/20). This is a trade-off with the already-small no-go count; I'd keep 21/9 unless the run gets longer.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | Response inhibition is a core executive-function construct. |
| Method | 3 | Right structure; only 9 no-gos, 70/30 ratio, colour-only cue. |
| Score | 3 | Mostly go speed; inhibition counts but rests on few trials. |
| **Overall** | **3** | Fun and recognisable; a shape cue and a commission-rate stat would add the most. |

**4. Other feedback:**
- The rules are accurate (0.8 s penalties, early clicks count). Optional addition: "About 1 in 3 circles is red."
- Skill "impulse control" → suggested: "holding back a quick click (response inhibition)".
- The Focus category is right.
- Colour-blind note if no shape cue is added: "Red and green are hard to tell apart for color-blind players."

---

### Summary table

| Test | Current name | Recommended name | Relevance | Method | Score | Overall | Top improvement |
|---|---|---|---|---|---|---|---|
| reaction | Reaction Time | Reaction Time | 5 | 4 | 4 | 4 | Remove the 75 ms fade-in on green and timestamp after paint |
| visual-memory | Visual Memory | Pattern Memory | 4 | 3 | 3 | 3 | Stop instant per-click feedback / free misses from enabling probing; show "Most tiles" |
| stroop | Stroop Test | Stroop Test | 5 | 4 | 3 | 4 | Median-based same/different times plus a colour-blind note |
| number-memory | Number Memory | Number Memory | 5 | 3 | 3 | 3 | One second chance per run (WAIS uses 2 trials per length) |
| sequence-memory | Sequence Memory | Sequence Memory | 4 | 2 | 3 | 3 | Honest skill line and rules: it's a growing, repeated sequence (learning, not span) |
| number-order | Number Order | Chimp Test (or keep) | 3 | 3 | 3 | 3 | Second chance per run; optionally cap study time per tile |
| flash-order | Flash Order | Flash Order | 3 | 3 | 2 | 3 | Lives (a miss repeats the same flash) to cut one-shot luck |
| word-memory | Word Memory | Word Memory | 4 | 3 | 3 | 3 | Cap repeats per word; show hit and false-alarm rates |
| n-back | N-Back | N-Back | 5 | 4 | 4 | 4 | Category → Memory (or a skill line that fits Focus) |
| go-no-go | Go / No-Go | Go / No-Go | 5 | 3 | 3 | 3 | Shape cue for red; show "Clicked on red x / 9" |

### The 3 changes with the most scientific value for the least fun lost
1. **Give the one-shot memory tests a second chance, Flash Order first.** Research never decides a span or threshold from a single trial (WAIS: 2 per length; Inoue & Matsuzawa: 50 per duration). For Flash Order a single run is mostly where the luck ran out. A small lives rule (a miss repeats the same flash or length; 2–3 misses end the run) keeps whole-level scores and the sudden-death tension, and makes the number far more repeatable. Apply the same idea to Number Memory and Number Order. These are score-changing (no bump needed in development); please have the scoring-reviewer simulate run-to-run spread before and after.
2. **Fix Reaction Time's onset timing.** Drop `transition-colors duration-75` on the red → green change and stamp `goAt` in a `requestAnimationFrame` after the green is committed. It is invisible to the player, removes roughly 20–50 ms of artificial delay, and brings scores closer to the lab range (about 200–230 ms) and to what players expect from other sites.
3. **Make the red/green tests readable without colour vision and show the key research number.** In Go / No-Go, add a shape cue to red and split wrong clicks into "Clicked on red: x / 9" (commission rate) and "Too early". For Stroop, add a one-line colour-blind note and use medians for the same/different times. These cost no fun, change no scores, and make the result screen show what research actually reads.

(Close runners-up: cap word repeats in Word Memory, and rewrite the Sequence Memory skill line and rules to say the sequence is repeated and grows.)

### Checklist points that passed
- Names: all ten are understandable and none clash with each other or the other 10 tests. Stroop Test, N-Back and Go / No-Go correctly use established names.
- The rules match the code on every count, duration, life and ending condition I checked. The gaps are omissions, not errors: Visual Memory's start size, Sequence Memory's repeating and growing sequence, Word Memory's repeats and no clock, Number Memory's exposure length.
- `scoreLabel` / `formatScore` units match the score in all ten (ms, levels, pts, digits, steps, tiles, words, s).
- Categories are fine for nine tests. The only debatable one is N-Back (Focus vs Memory).
- No test claims IQ or a diagnosis. The only sensitive points are colour vision (Stroop, Go / No-Go, mildly Reaction) and the "impulse control" wording.
- Idle and failed handling is honest (No score for idle runs, an honest 0 for played-and-failed runs, the Flash Order exception documented in the spec).
- Not checked by design: icons (no browser this time).

### Sources
- [Woods et al. 2015, simple reaction time (PMC4374455)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4374455)
- [Blur Busters: input lag and human reflex](https://www.blurbusters.com/human-reflex-part1-input-lag-and-the-limits-of-human-reaction-time) · [Insider Gaming: Human Benchmark median](https://insider-gaming.com/what-is-reaction-time-and-does-it-make-you-better-at-cs2-or-valorant/)
- [Della Sala et al. 1999, Pattern span (Stirling)](https://www.stir.ac.uk/research/hub/publication/765722) · [Brown, Forbes & McConnell 2006 (PDF)](https://strathprints.strath.ac.uk/47779/1/Brown_et_al._2006_QJEP.pdf)
- [MacLeod 1991 Stroop review (PubMed)](https://pubmed.ncbi.nlm.nih.gov/2034749/) · [full text](https://uwaterloo.ca/memory-attention-cognition-lab/sites/default/files/uploads/files/strooprev_0.pdf) · [PAR Stroop Color and Word Test](https://www.parinc.com/products/STROOP-ADULT-NU) · [Golden scoring / processing speed (PMC5036998)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5036998) · [Nottingham interference-tasks chapter](https://psychology.nottingham.ac.uk/staff/lpzjd/psgy1001-22/interference-tasks.html) · [Bugg & Crump 2012, proportion congruent](https://www.frontiersin.org/articles/10.3389/fpsyg.2012.00367/pdf) · [Hedge, Powell & Sumner 2018, reliability paradox](https://orca.cardiff.ac.uk/id/eprint/102138/)
- [Worldwide prevalence of red-green colour deficiency (PubMed)](https://pubmed.ncbi.nlm.nih.gov/22472762/)
- [Pearson WAIS-IV](https://www.pearsonassessments.com/en-us/Store/Professional-Assessments/Cognition-%26-Neuro/Wechsler-Adult-Intelligence-Scale-Fourth-Edition/p/100000392) · [Spans neuropsych review (Scribd, secondary)](https://www.scribd.com/document/379281386/Spans-LNS-TMT-SDMT-4-pdf)
- [PsyToolkit Corsi](https://www.psytoolkit.org/library/corsi.html) · [Inquisit Corsi manual](https://www.millisecond.com/download/library/v6/corsiblocktappingtask/corsiblocktappingtask_forward/corsiblocktappingtask_forward/corsiblocktappingtask.manual) · [Cognitive Atlas: block tapping](https://cognitiveatlas.org/task/id/tsk_4a57abb9498df/) · [Spatial Hebb repetition (Kyoto)](https://repository.kulib.kyoto-u.ac.jp/dspace/bitstream/2433/241755/1/s13421-019-00921-9.pdf)
- [Inoue & Matsuzawa 2007 (PDF)](https://www.gwern.net/docs/www/www.cell.com/566764ff1ec0be394841f7c1ef51d8604468abe4.pdf) · [Cook & Wilson 2010 (PDF)](https://www.Gwern.net/doc/algernon/2010-cook.pdf) · [ScienceNews: Chimp Champ](https://www.sciencenews.org/article/chimp-champ-ape-aces-memory-test-outscores-people)
- [Freund, Loftus & Atkinson 1969](https://faculty.washington.edu/gloftus/MiscMissingArticles/Freund.Loftus.Atkinson.1969.pdf) · [Singh et al., continuous recognition](https://people.bu.edu/marc777/docs/SinghEtal-revised.pdf)
- [Jaeggi et al. 2008 PNAS (PMC2383929)](https://pmc.ncbi.nlm.nih.gov/articles/PMC2383929/) · [Jaeggi et al. 2010, concurrent validity of n-back (PDF)](https://www.Gwern.net/doc/dual-n-back/2010-jaeggi-2.pdf) · [Owen et al. 2005 n-back meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6871745)
- [Testable go/no-go guide](https://www.testable.org/experiment-guides/executive-function/go-no-go-task) · [Wessel 2018 (PubMed)](https://pubmed.ncbi.nlm.nih.gov/28390090) · [Go/no-go ISI study (PMC8048576)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8048576/)

Files read (no edits): `/home/main/Projects/skill-lab/src/tests/registry.ts`, `/home/main/Projects/skill-lab/docs/SPEC.md`, `/home/main/Projects/skill-lab/src/tests/types.ts`, `/home/main/Projects/skill-lab/src/lib/hooks.ts`, and `scoring.ts` plus the component in each of `/home/main/Projects/skill-lab/src/tests/{reaction,visual-memory,stroop,number-memory,sequence-memory,number-order,flash-order,word-memory,n-back,go-no-go}/`.

---

## Part 2: Estimation, thinking and motor tests

I read each test's registry entry, `scoring.ts`, component and SPEC row on `develop`, plus `CATEGORIES` in `types.ts`. I did not use the browser and did not edit any files. Where my own numbers come from a quick simulation (two throwaway scripts in the scratchpad, not in the repo), I label them as estimates. Any norm I could not find a source for is labelled "unverified" or "approximate".

Files: `/home/main/Projects/skill-lab/src/tests/registry.ts`, `/home/main/Projects/skill-lab/docs/SPEC.md`, `/home/main/Projects/skill-lab/src/tests/<id>/scoring.ts` and `<Name>Test.tsx` for each id.

---

### Time Estimation (`time-estimation`): overall 3 / 5
**What it does now:** 5 rounds with whole-second targets from 3 to 10 s, all different, with at least one short (3–4), one medium (5–7) and one long (8–10) target, in shuffled order. You click to start a hidden timer and click again when you think the time is up. The screen turns violet and says "Counting to N s…". After each round you see your time and the % error. The score is the mean absolute error in % of the target. The result screen shows Closest, Furthest off, Tendency (mean signed %), and a chip per round.

**1. Name**
- Current name: recognisable and plain. In research this exact task is called *time production* ("estimation" usually means saying how long something lasted), but players won't care.
- Alternatives:
  - "Inner Clock": catchy, and says what is tested.
  - "Feel the Seconds": echoes the tagline and is playful.
  - "Time Production": the correct research term, but dry and unfamiliar.
- **Recommendation:** keep **Time Estimation**. Players know the phrase, and it doesn't clash with any other test.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - *Time production* in interval-timing research: the participant is given a duration and marks it off with key presses. The main measures are accuracy (mean produced / target, or constant error) and precision (coefficient of variation, CV).
  - Counting changes the task. Thönes & Hecht found that counting did not improve absolute accuracy at 10–90 s, but it did improve precision ([Springer, Atten Percept Psychophys 2017](https://link.springer.com/article/10.3758/s13414-017-1407-5)). Wearden (1991) found that counted units have a CV of about 0.10–0.14 ([Keele PDF](https://www.keele.ac.uk/media/keeleuniversity/facnatsci/schpsych/weardenpublications/wearden1991.pdf)).
  - Feedback after each trial (knowledge of results) is known to reduce production error at 5, 10 and 15 s (Robinson 1963; Montare 1988, as summarised in [Frontiers 2017](https://www.frontiersin.org/articles/10.3389/fpsyg.2017.02325/full)).
- **Differences from the research setup:**
  - **Counting is allowed and not mentioned.** This is the biggest issue. At 3–10 s most people count "one-Mississippi", so the score mostly measures how steady your counting rhythm is, not an intuitive "sense of time". The UI text "Counting to N s…" even invites it. The skill line ("your sense of time") and tagline ("without a clock") suggest the opposite. Studies either forbid counting or block it with a secondary task.
  - **Feedback after every round.** You recalibrate during the run, so later rounds are better than the first. That's fine for fun, but it means the score is partly "how fast you adapt".
  - **Only 5 trials.** Production studies use many trials per duration. Five gives a rough average and no usable precision estimate.
  - **Click latency** (about 10–50 ms) mostly cancels out between the start and stop clicks. At most it is about 1–2 % of a 3 s target, so it's negligible.
  - **Scoring in % of the target** fits the scalar property of timing (error grows with duration), so short and long targets weigh about equally. This is good.
- **How accurate is the score?** It is an absolute-% error averaged over 5 trials. If a player's CV is about 0.12 with little bias, the expected mean error is about 9–10 %, and the run-to-run SD of the 5-round average is roughly ±3 points (my analytic estimate). Top and average players are distinguishable, but neighbouring players are not. There is no ceiling in practice (0 % is never reached) and no floor problem.
- **Can it tell you something about you?** A low error means you produce intervals of a few seconds accurately, mostly through a steady counting rhythm, and that you calibrate quickly from feedback. Rough bands (approximate, model-based, not published norms): **≤ 5 % excellent, 5–10 % good, 10–20 % typical, > 20 % weak**. It does not measure attention, ADHD or "time blindness", and the text should not suggest that.
- **What's missing that research would add:**
  1. Say in the rules whether counting is allowed. Smallest option: add "Counting in your head is allowed." Then change the skill line to "keeping time in your head".
  2. Add a **Consistency** stat: the SD of the signed % errors. This is the research precision measure (CV) and is different from the Tendency bias already shown. No score change.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Interval timing / time production is a well-established construct. |
| Method | 3 | Same task shape as time production, but counting is uncontrolled, there are only 5 trials, and feedback shapes later rounds. |
| Score | 3 | Meaningful absolute accuracy, but noisy at 5 trials, and it mostly reflects counting. |
| **Overall** | 3 | Fun and fair; the wording overstates the "without counting" sense of time. |

**4. Other feedback**
- Tagline "Feel the seconds without a clock." could become "Feel the seconds without a clock (counting is allowed)." Alternatively, change the skill line to "keeping time in your head".
- The Tendency stat (constant error) is exactly the research measure. Good.
- Estimation is the right category.

---

### Quick Count (`quick-count`): overall 4 / 5
**What it does now:** 10 rounds. Before each round a soft ring of light marks the board for 1 s. Then 5–60 dots (fixed size, non-overlapping) flash for 600 ms. There is no mask; the dots simply disappear. You enter a count of up to 2 digits with the keypad. Counts are drawn one from each of 10 overlapping groups, densest around 14–22, never repeated. Each round scores 100 − 100 × |ln(guess/actual)| (minimum 0), and the score is the average. During feedback the dots reappear, dimmed, with the true count.

**1. Name**
- Current name: catchy, but it slightly contradicts the rules ("There is no time to count").
- Alternatives:
  - "How Many Dots?": very clear, though less snappy.
  - "Dot Estimate": names the real task, estimation.
  - "Number Sense": the research umbrella term (Dehaene), but players may read it as arithmetic.
- **Recommendation:** keep **Quick Count**. "Quick" signals "at a glance", and the 600 ms flash makes the rule obvious after one round. Switch to "Dot Estimate" only if the counting mismatch bothers players.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - *Numerosity estimation* with dot arrays, a measure of the approximate number system (ANS).
  - Krueger (1982), "Single judgments of numerosity": estimates follow a power function with exponent about 0.83–0.85, so people **underestimate**, more so above about 20 dots ([doi 10.3758/BF03206218](https://www.doi.org/10.3758/BF03206218)).
  - Izard & Dehaene (2008), "Calibrating the mental number line" (*Cognition* 106): feedback on the true number recalibrates later estimates ([record](https://scilit.com/publications/be3738d681e8758dd1306ea102ddc05b); details from secondary sources such as [NSF PAR](https://par.nsf.gov/servlets/purl/10141386)).
  - Exposure time matters: precision improves from 100 ms to 3 s. One masked study (16–2400 ms) reports adult Weber fractions with a mean of 0.27 (range 0.18–0.39) ([PMC4831213 and related](https://pmc.ncbi.nlm.nih.gov/articles/PMC4831213)). Weber fractions also differ between estimation and discrimination tasks.
- **Differences from the research setup:**
  - **No backward mask.** After 600 ms the dots vanish but there's no mask, so iconic memory adds a little effective viewing time. Minor at 600 ms.
  - **Fixed dot size and fixed area.** Density and total ink grow with the count, so players can use density/area cues. Research controls these; here it's fine, and the skill line "estimating amounts" is honest about it.
  - **Feedback re-shows the dots with the count.** This is strong calibration feedback (as in Izard & Dehaene), so the score partly reflects how well you recalibrate during the run. That's fine and fun.
  - **5–8 dots can be partly grouped or counted** in 600 ms. Low counts also weigh heavily on a log scale (off by 1 at 5 dots costs 18 points). That is consistent with Weber's law, so it's acceptable.
  - **Log-ratio scoring** is the right choice: it is scale-free like the ANS, and under- and over-estimates are symmetric.
- **How accurate is the score?** My quick simulation is a model player with Gaussian log-noise of Weber fraction *w*, run 20k times each. It is an estimate, not proof:
  - *w* = 0.15 scores about 88 ± 3 (SD);
  - *w* = 0.20 scores about 84 ± 4;
  - *w* = 0.25 scores about 80 ± 5;
  - *w* = 0.3 with Krueger-style underestimation scores about 75 ± 6.

  So 10 rounds separate good from poor estimators, but one run has a ±4-point spread. Research uses dozens of trials. There is no practical ceiling and no floor issue. I recommend the scoring-reviewer confirm the spread.
- **Can it tell you something about you?** Yes: how precise and how unbiased your at-a-glance quantity estimates are. Rough bands (approximate, model-based): **< 70 weak, 75–85 typical, 86–90 very good, > 90 excellent**. ANS acuity correlates only weakly with maths ability. It is not a maths or IQ test, and the text doesn't claim that.
- **What's missing that research would add:** split the Tendency by size, e.g. "Tendency up to 20 dots" and "Tendency above 20". The classic finding is that underestimation grows with number, and players would see it in their own data. No score change.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Numerosity estimation / ANS is a well-established construct. |
| Method | 4 | Brief unmasked flash, sensible range, scale-free scoring; only 10 trials and uncontrolled density cues. |
| Score | 4 | Meaningful and well designed; moderate run-to-run noise. |
| **Overall** | 4 | One of the best-grounded tests in this set. |

**4. Other feedback**
- howTo: "type how many you think you saw" could be "enter (type or click) how many you saw", since mouse users click the keypad.
- The scoring lines are accurate (half or double gives 30.7 %, shown as "about 31 %").
- Estimation is the right category.

---

### Mental Math Sprint (`mental-math`): overall 3 / 5
**What it does now:** 60 s of + − × ÷ problems, with the operation picked at random each time. All answers are non-negative whole numbers. For + and −, operands go up to 20 + 10 × level. For × and ÷, factors go up to 9 + level (by 2–9). The level rises every 5 correct answers, up to level 5 (25 correct). Answers are typed on the keyboard or clicked on a keypad row, then confirmed with Enter or OK. A wrong answer just moves on. The score is the number of correct answers. The result shows wrong answers, accuracy, average time per answer, and the fastest and longest answers with their problems.

**1. Name**
- Current name: clear and fun; "Sprint" signals the time limit.
- Alternatives:
  - "Arithmetic Sprint": more precise, less friendly.
  - "Math Fluency": the research and education term, but dry.
  - "Quick Maths": catchy, but a meme.
- **Recommendation:** keep **Mental Math Sprint**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - *Arithmetic fluency* tests: speeded basic-fact tests such as Woodcock-Johnson Math Fluency and the number-facility tests in the ETS Kit of Factor-Referenced Cognitive Tests. I could not verify their exact timings or reliabilities online.
  - Curriculum-based 1-minute fact probes: 1 minute supports low-stakes comparisons, while about 4 minutes is needed for higher stakes ([UMN study](https://experts.umn.edu/en/publications/an-examination-of-alternate-assessment-durations-when-assessing-m/)). Correct-per-minute fluency scores are more reliable than accuracy scores in CBM research (same search results).
  - A 10-minute timed arithmetic test (RMAT) reaches α = .79 and test–retest .83 ([Helsinki PDF](https://tuhat.helsinki.fi/ws/portalfiles/portal/529344064/Author_final_version_Psychometrics_FUNA-DB.pdf)).
- **Differences from the research setup:**
  - **Input method (big).** Clicking 2–3 keypad digits plus OK with the mouse is much slower than typing, plausibly 0.5–1 s more per answer. For two equally good calculators, the keyboard user could score clearly higher. The rules present the two inputs as equal.
  - **Adaptive numbers.** Problems get harder after every 5 correct, so strong players get harder items. The score is therefore not linear in skill (the top end is compressed), and it differs from fixed-item fluency tests. Mild; it's part of the fun.
  - **Random operation mix.** One run may get several easy additions, another several 9× facts. This is luck at 60 s; the scoring-reviewer could check the spread.
  - **Wrong answers cost only time,** so the player picks their own speed–accuracy balance. Accuracy is shown, which is good.
  - **Practice effects** are large, both from the interface and from fact retrieval.
- **How accurate is the score?** With about 15–40 items in 60 s, a fluency count is reasonably reliable for a casual comparison (CBM evidence above). The input confound and the operation mix are the main noise sources. There's no ceiling worry (difficulty caps at level 5, but nobody will run out of problems). Floor: a few correct answers for anyone who tries.
- **Can it tell you something about you?** It shows how quickly you retrieve and compute basic facts, which is a real and trainable skill. Rough bands (approximate, unverified, keyboard input): **< 12 slow, 15–25 typical, 30+ very good, 40+ excellent**. Calibrate these from your own data. It is not a measure of mathematical ability or IQ.
- **What's missing that research would add:**
  1. Per-operation breakdown (accuracy and average time for + − × ÷). This is a classic fluency profile and fun to see.
  2. "Level reached".
  3. A rules hint about input.

  None of these changes the score.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Arithmetic fluency is an established construct. |
| Method | 3 | Timed fluency format fits, but the input confound and adaptive random mix differ from standard tests. |
| Score | 3 | Meaningful count, but partly measures typing vs clicking. |
| **Overall** | 3 | Fun sprint; smallest fix is to address the input speed. |

**4. Other feedback**
- Tagline "Solve as many sums as you can." includes × and ÷, and "sums" strictly means addition. Suggest: "Solve as many quick problems as you can."
- Add a rules line: "Typing on the keyboard is faster than clicking the keypad."
- Thinking is the right category.

---

### Circle Chase (`steady-hand`): overall 4 / 5
**What it does now:** The run starts when your pointer enters the centred circle. For 30 s the circle drifts along a smooth random sum-of-sines path. It speeds up to ×1.8 and its radius shrinks from 14 % to 5.5 % of the board's shorter side (about 72 px to about 28 px). The score is the % of time the pointer is inside. The result shows time inside and outside, times you left, and the longest stretch inside.

**1. Name**
- Current name: catchy and accurate. The rename from "Steady Hand" was right: this is pursuit tracking, not tremor or steadiness.
- Alternatives:
  - "Pursuit Tracker": closer to the research term.
  - "Rotor Chase": nods to the classic pursuit rotor.
  - "Stay in the Circle": very literal.
- **Recommendation:** keep **Circle Chase**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The *pursuit rotor* / rotary pursuit task (Koerth 1922 onward): keep a stylus or cursor on a moving disc. The classic measure is **time on target (TOT)**. It is used in motor-learning and clinical research. The Millisecond computer version runs **4 trials of 10 s** and records off-target time, recovery time and mean distance from the target centre ([Millisecond Pursuit Rotor](https://www.millisecond.com/library/pursuitrotor)). A PEBL version is validated as a psychomotor measure in children and adolescents (search summary).
  - Unpredictable sum-of-sines targets are also common in manual tracking research (general knowledge, not verified here).
- **Differences from the research setup:**
  - **Random path instead of a fixed circle.** The pursuit rotor is predictable and is largely used to study learning of that path. A random path measures online visuomotor tracking more than path learning. Fine, and arguably better for a one-off score.
  - **Speed and size ramp in a single 30 s trial.** Research uses several trials of fixed difficulty. Here the score blends easy and hard phases, so it doesn't show where you break down.
  - **Binary in/out (TOT) only.** It is coarse: it ignores how far off you are, and it has a ceiling-ish top when the circle is large.
  - **Path luck.** Each run's phases differ, so some paths have sharper turns.
  - **Mouse setup** (sensitivity, acceleration, trackpad) matters. It applies to every motor test.
- **How accurate is the score?** One trial; research averages several. TOT over 30 s is fairly stable for one person, but the path randomness and the binary measure add noise. I suspect good players cluster in the high 80s–90s (possible ceiling); the scoring-reviewer should check the spread and luck.
- **Can it tell you something about you?** Yes: how well you track an unpredictable moving target with the mouse (hand–eye coordination plus prediction). Published norms don't transfer, because they depend on target speed and size. Collect your own data before showing bands. It does not measure tremor and is not a clinical motor test.
- **What's missing that research would add:**
  1. **Average distance from the centre** (as % of the current radius). This is the continuous measure used alongside TOT, with no ceiling and less noise.
  2. Optionally "Inside, last 10 s" to show how you cope at the hardest point.

  Neither changes the score.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Pursuit tracking / time on target is an established motor paradigm. |
| Method | 4 | Close to a computerised pursuit rotor; one trial and a difficulty ramp instead of repeated fixed trials. |
| Score | 3 | Classic measure, but binary, single-trial, and possibly ceiling-prone. |
| **Overall** | 4 | Well grounded; one extra stat would sharpen it. |

**4. Other feedback**
- Rules are accurate and complete (start rule, drift, speed-up and shrink, 30 s).
- Skill "hand–eye tracking" is right; "visuomotor tracking" would be the research term.
- Motor is the right category.

---

### Aim Trainer (`aim-trainer`): overall 4 / 5
**What it does now:** 30 s. One 56 px target appears at a random spot, always at least 0.3 of the board away (in normalised coordinates) from the last one. A hit on the red bullseye (42 % of the diameter, about 23.5 px) gives 2 points; a hit on the white ring gives 1. Only the left button counts, and misses are counted but cost nothing. The score is points. The result shows centre and edge hits, misses, accuracy %, average time per target, and the fastest hit.

**1. Name**
- Current name: a well-known gaming term (Human Benchmark, aim-training apps). Players know exactly what to expect.
- Alternatives:
  - "Target Practice": plain and friendly.
  - "Bullseye": hints at the 2-point centre.
  - "Point & Click": names the research construct (pointing).
- **Recommendation:** keep **Aim Trainer**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - *Fitts' law pointing* / ISO 9241-9 multidirectional tapping. Movement time grows with the index of difficulty ID = log₂(D/W + 1), and performance is summarised as **throughput** (bits/s).
  - Soukoreff & MacKenzie (2004) set the standard method ([yorku.ca](https://www.yorku.ca/mack/ijhcs2004.html)). ISO-style mouse throughput is typically about 3.7–4.9 bits/s and rarely above 5 (secondary summaries in the same search: MacKenzie & Soukoreff 2003; Sasangohar et al. 2009).
- **Differences from the research setup:**
  - **Random distance and direction.** In this layout, D ranges from about 140 to about 840 px, so ID is about 1.8–4 bits per target. Research fixes D and W per block. Over about 30–40 targets this mostly averages out; it's moderate luck.
  - **Unpredictable target location.** It adds visual detection and reaction time (about 0.2–0.3 s per target, approximate), so the score mixes reaction and pointing. That fits "aim and speed".
  - **Free misses.** Speed–accuracy is tilted toward speed, since clicking early while still moving costs nothing. Research counts errors in the effective width (W_e). The scoring-reviewer should check whether click-spamming pays.
  - **Bullseye bonus.** A coarse, game-like version of the effective-width idea: it rewards precision. Nice.
  - **Mouse vs trackpad and sensitivity** strongly affect the score.
- **How accurate is the score?** About 30–45 targets per run is a decent sample, similar to one ISO block. Reliability should be reasonable. No ceiling or floor issues.
- **Can it tell you something about you?** Yes: how quickly and precisely you acquire targets with your pointing device. Rough expectation from Fitts (approximate, model-based): about 0.25 s detection plus about 0.6 s movement gives about 0.85 s per target, about 35 hits and about 45–55 points. Suggested bands (approximate, calibrate from data): **< 35 slow, 40–55 typical, 60+ very good, 75+ excellent**. It measures device skill as much as the person.
- **What's missing that research would add:** a **"Centre rate"** stat (centre hits / all hits) to separate precision from speed. "Avg per target" covers the speed side already. Throughput in bits/s is possible but too nerdy; skip it.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Pointing (Fitts' law) is one of the best-established motor paradigms. |
| Method | 3 | Uncontrolled D, free misses and unpredictable locations differ from ISO tapping. |
| Score | 4 | Enough targets for a stable, meaningful speed-plus-precision score. |
| **Overall** | 4 | Solid, fun, meaningful; watch the free-miss trade-off. |

**4. Other feedback**
- **Category:** judged on its own merits, pointing is a motor-control task (speed–accuracy). Motor fits slightly better than Speed, the same way Line Tracing, its steering-law sibling, is Motor. Speed is defensible because the score is a rate. A low-priority suggestion.
- Rules are accurate (30 s, 2 or 1 points, misses free). The rules could add "Only the left button counts" if right-clicking ever confuses players; not essential.
- Skill "aim and speed" is fine; "pointing speed and precision" would be closer to the construct.

---

### Tap Speed (`tap-speed`): overall 3 / 5
**What it does now:** One big button covering the whole stage. The 10 s timer starts with your first left click. The score is clicks ÷ 10 (per second). The result shows total clicks, the fastest 2 s window, the last 2 s, and chips with clicks per 2 s window.

**1. Name**
- Current name: fine and device-neutral; it matches the research name (finger *tapping*). On desktop the action is a click, and the skill line already says "clicking speed".
- Alternatives:
  - "Click Speed": exactly what desktop players do, and the well-known "CPS test".
  - "Finger Tapping": the research name, but sounds clinical.
  - "Rapid Fire": playful.
- **Recommendation:** keep **Tap Speed**. It works for both mouse and a future touch version.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The **Finger Tapping Test** (Halstead-Reitan battery): tap a key with the index finger for **10 s trials, usually 5 per hand**, averaged, with trials kept within a range of 5 taps. It measures **motor speed** ([PAR sample report](https://www.parinc.com/Portals/0/Webuploads/samplerpts/Sample_HRB.pdf); method summaries in the search).
  - Ruff & Parker (1993) published norms by sex, age and education (doi 10.2466/pms.1993.76.3c.1219). Women tap slower on average, and older norms are biased against women and left-handers (Suhr et al. 1997).
  - Computerised versions also use mouse buttons (e.g. a gaming-mouse 30 s protocol in TBI research).
- **Differences from the research setup:**
  - **One trial instead of 5 per hand.** Moderate effect: tapping is quite stable, but warm-up and attempt-to-attempt variation matter.
  - **Technique is free.** "Jitter" and "butterfly" clicking (two fingers alternating on one button) are claimed to reach 10–20 clicks/s on CPS sites (unverified, technique claims). Left-button-only stops two-button alternation but not two fingers on one button. Top scores therefore mostly reflect technique, not finger speed.
  - **Mouse switch.** Click force, travel and debounce differ between mice.
  - **Hand not specified.** Research tests the dominant and non-dominant hand separately.
  - **Fatigue.** Classic studies look at decrement within a trial, and the per-2 s chips show it. Good.
- **How accurate is the score?** Fairly reliable for the same person, same mouse and same technique. Across people it is dominated by technique and hardware. There is no ceiling with the jitter technique.
- **Can it tell you something about you?** Your maximum repetitive finger speed with a mouse. Classic key-tapping rates are around 5 taps/s for healthy young adults' dominant index finger (approximate; exact norms unverified, see the Ruff & Parker / Mitrushina handbook tables). Normal one-finger mouse clicking probably gives about **5–7 /s typical, 8+ fast**; above about 10 /s almost always means a special technique (approximate, unverified). It says little about cognition and nothing clinical.
- **What's missing that research would add:**
  1. State the technique in the rules, either "Use one finger" (comparable to research) or "Any technique counts" (honest about the free-for-all).
  2. Optionally a **rhythm steadiness** stat (SD of the time between clicks); tapping variability is a standard research measure.

  No score change.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Finger-tapping motor speed is a classic, well-normed construct. |
| Method | 3 | Same 10 s format, but one trial, free technique and mouse hardware differ. |
| Score | 3 | Meaningful for one-finger clicking; technique dominates the top end. |
| **Overall** | 3 | Fine quick test; one rules line would make the score more honest. |

**4. Other feedback**
- Skill line: "clicking speed" could become "finger tapping speed".
- Speed is a fine category; research calls it "motor speed", so Motor would also be defensible. Speed dominates.
- The icon is still a placeholder (README TODO); I did not review icons this time.

---

### Stop the Bar (`stop-the-bar`): overall 3 / 5
**What it does now:** 5 rounds, each at a different speed (0.35–1.0 track widths per second, shuffled). The green line sits at 45–90 % of the track but always at least 0.8 s of travel away. Your click starts a 0.5 s lead-in, then the marker moves; a second click stops it. If the marker runs off the end, that counts as late. The score is the mean absolute timing error in ms. The result shows Closest, Tendency (mean signed ms, early or late) and a chip per round (speed and signed ms).

**1. Name**
- Current name: catchy and clear. The rules call the moving thing a "marker" while the name and tagline say "bar"; minor.
- Alternatives:
  - "Hit the Line": says the goal.
  - "Coincidence Timer": the research flavour (coincidence-anticipation timing), but dry.
  - "Right on Time": playful, stresses timing.
- **Recommendation:** keep **Stop the Bar**, and call it "the bar" in the rules too.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - *Coincidence-anticipation timing (CAT)*, classically measured with the **Bassin Anticipation Timer**: a runway of LEDs lights up in sequence at a set speed, and the participant presses a button when the light reaches the target ([Lafayette](https://lafayetteevaluation.com/products/bassin-anticipation-timer), [Cortland lab](https://facultyweb.cortland.edu/hendrick/Labat.htm)).
  - Standard measures are **absolute error (AE)**, **constant error (CE**, signed bias, early or late) and **variable error (VE**, consistency).
  - Stimulus speed changes the errors: in a Bassin-based study, faster stimuli produced larger errors in children and adults, with **30 trials per speed** ([Figueiredo & Barreiros 2013](https://scitepress.org/Papers/2013/46655/pdf/index.html)). Other studies find speed effects can reverse with experience (search summary).
- **Differences from the research setup:**
  - **5 trials, all at different speeds.** Research uses many trials per speed. Here the speed effect and personal skill are mixed, and 5 absolute errors give a noisy mean (moderate to large).
  - **Display and input latency** (frame time about 16 ms plus monitor lag plus input delay) push responses **late** by a few tens of ms on many setups. This is a hardware bias that players partly learn away with feedback. The Tendency stat exposes it, which is good.
  - **Feedback after every round** (knowledge of results), so later rounds improve. That's normal in CAT practice blocks and fine.
  - **Measuring error in ms** (not px) is right for a timing construct.
- **How accurate is the score?** Low trial count is the main issue. If a player's VE is about 30 ms, the 5-trial mean AE varies by roughly ±10 ms between runs (my estimate), comparable to the gap between "good" and "typical". The scoring-reviewer should simulate this. No ceiling or floor issue.
- **Can it tell you something about you?** How well you predict when a moving object reaches a point and time your press to it, a skill used in ball sports and rhythm games. Clean button-press AE norms for adults weren't found, so these bands are approximate and unverified, to be calibrated from data: **< 20 ms excellent, 20–40 good, 40–70 typical, > 80 weak**. It is not reaction time, and it is not a clinical test.
- **What's missing that research would add:**
  1. A **Consistency** stat (VE: SD of the signed errors), next to the existing Tendency (CE) and the score (AE). That gives the full classic triplet, with no score change.
  2. Optionally go to 6–8 rounds (2 per speed band) to halve the noise at little fun cost. This changes scores.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Coincidence-anticipation timing is an established perceptual-motor paradigm. |
| Method | 3 | Close in task shape, but 5 trials at 5 speeds is far below standard. |
| Score | 3 | AE is the right measure; noisy at 5 trials and affected by hardware latency. |
| **Overall** | 3 | Good grounding; more trials or a VE stat would make it solid. |

**4. Other feedback**
- howTo "a marker slides along a track" could become "the bar slides along a track" to match the name and tagline.
- Skill "timing" could become "timing a moving target".
- Motor is the right category (perceptual-motor timing).

---

### Mental Rotation (`mental-rotation`): overall 4 / 5
**What it does now:** 60 s. Each trial shows two 2D shapes made of 7 squares (a new random chiral shape each time, at most 4×4). The left shape is at a random angle in 15° steps. The right one is turned a further 45°–315° and is the mirror image half the time. You answer SAME or MIRRORED (← / →). The score is correct − wrong. The result shows correct, wrong, accuracy, average and fastest answer time, and accuracy for "same" vs "mirrored" pairs.

**1. Name**
- Current name: the established research name; players may know it.
- Alternatives:
  - "Rotate or Mirror": says the decision.
  - "Spin Check": playful.
- **Recommendation:** keep **Mental Rotation**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - **Shepard & Metzler (1971):** same/mirror pairs of 3D cube figures; response time rises linearly with the angle between them ([Wikipedia overview](https://en.wikipedia.org/wiki/Mental_rotation), [SEP supplement](https://plato.stanford.edu/archives/spr2012/entries/mental-imagery/mental-rotation.html)).
  - **Cooper (1975):** random 2D shapes, standard vs reflected at various picture-plane orientations; same linear time-by-angle pattern ([Cognitive Psychology 7(1)](https://www.bohrium.com/paper-details/mental-rotation-of-random-two-dimensional-shapes/812339295305072640-11891)).
  - **Vandenberg & Kuse Mental Rotations Test** (paper, 24 items, timed): KR-20 = .88, test–retest .83. Sex differences are about 0.7–1 SD and shrink without time limits ([search summary; Cognitive Atlas](https://cognitiveatlas.org/task/id/trm_4af89b3a925ca/)).
- **Differences from the research setup:**
  - **2D picture-plane rotation** (like Cooper), not 3D. It is easier and relates less strongly to 3D spatial visualisation tests. Fine for fun.
  - **Time-limited correct − wrong score** blends speed and accuracy. Research usually reports the RT-by-angle slope (rotation speed) and accuracy separately. Correct − wrong is a sensible guessing correction for a 2-choice task.
  - **New shape each trial** prevents memorising. Good, and like research.
  - **Feature strategies.** Players can check a distinctive notch instead of rotating the whole shape; research knows both holistic and analytic strategies. Fine.
  - **Feedback ring after each answer.** Fine.
- **How accurate is the score?** About 25–45 trials in 60 s is a decent sample; the guessing correction keeps luck small. Practice effects for mental rotation are large (well known; not separately verified here). No ceiling or floor issue.
- **Can it tell you something about you?** How quickly and accurately you compare rotated shapes, a core part of spatial ability. Rough bands (approximate, model-based: about 1.5 s per item at about 90 % accuracy): **< 12 low, 15–25 typical, 30+ very good, 40+ excellent**. Don't mention sex differences, and it isn't an IQ or "spatial intelligence" verdict. The text currently makes no such claim.
- **What's missing that research would add:** the **angle effect**, the defining result of the paradigm. Store each trial's angle difference (folded to 0–180°) and show a pair "Avg time · small turn (≤ 90°)" vs "Avg time · big turn (> 90°)", or "Extra time per 90°". Players would see their own "rotation speed". No score change. This could replace or join the current "same vs mirrored" accuracy pair.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 5 | One of the most famous paradigms in cognitive psychology. |
| Method | 4 | Faithful 2D same/mirror task; composite timed score instead of RT slope. |
| Score | 4 | Enough trials, guessing-corrected, meaningful. |
| **Overall** | 4 | Well grounded; the angle stat would make it textbook. |

**4. Other feedback**
- howTo "You see two shapes. The right one is turned." Both shapes are turned. Suggest: "You see two shapes, turned differently. Decide if they are the same shape, just rotated, or mirror images."
- Skill "spatial reasoning" could become "mental rotation (spatial visualisation)". "Spatial reasoning" is broad but acceptable.
- Thinking is the right category.

---

### Line Tracing (`line-tracing`): overall 3 / 5
**What it does now:** A random smooth path (Catmull-Rom spline through 7 alternating up/down points) on a 1000 × 667 board, with a corridor 60 units wide (about 46 px at 768 px). Moving onto GO arms the run, and the timer starts when you leave GO along the path. Leaving the corridor or the board ends the run with No score, and nothing is saved. The score is the time from GO to the flag. The result shows average and furthest distance from the centre line.

**1. Name**
- Current name: plain and clear. It hints at careful drawing more than at racing through a corridor, but the tagline fixes that.
- Alternatives:
  - "Path Race": says it's a race.
  - "Buzz Wire": the well-known fairground game; fun and instantly understood.
  - "Tunnel Run": matches the research "tunnel steering" idea.
- **Recommendation:** keep **Line Tracing**. "Buzz Wire" is a fun alternative if you want more flavour.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The **steering law** (Accot & Zhai 1997): time to steer through a tunnel is T = a + b·(A/W), where A is length and W is width. For curved paths it becomes ∫ds/W(s). Original experiments used A = 256–1024 px and W = 8–32 px ([CHI 97](https://www.chi1997.chistatic.hosting.acm.org/proceedings/paper/ja.html), [NN/g summary](https://www.nngroup.com/articles/steering-law/)).
  - Curvature adds time beyond A/W ([arXiv 2503.11914](https://arxiv.org/pdf/2503.11914)).
  - Models built only on error-free trials are known to be deficient ([MacKenzie et al., CHI 05](https://www.yorku.ca/mack/chi05.html)).
- **Differences from the research setup:**
  - **Path length varies per run.** My simulation reimplements `makeControlPoints` and `samplePath` over 20k paths. The median length is 1698 units, the 5–95 % range is 1545–1864 (about ±9 %), and the CV is 5.7 %. By the steering law, time scales with length, so the layout alone moves the score by up to about ±9 %, plus curvature differences (sharper bends are slower). This is noticeable luck in a "lower is better" best score.
  - **One fail ends the run with no score.** Research records time and errors together. Here only error-free runs count, so a reckless player can keep retrying until a fast run survives. The personal best rewards risk rather than consistent control (best-of selection). The attempt count partly reveals this.
  - **Single trial;** research averages many.
  - **Device dependence** (mouse vs trackpad) is strong.
- **How accurate is the score?** The steering index is about A/W ≈ 28 per run, which is a decent single trial. But layout length, curvature and survivorship add noise. The scoring-reviewer should quantify the luck from path length and curvature.
- **Can it tell you something about you?** How fast you can move along a path while staying within bounds, i.e. your mouse speed–accuracy control. No transferable norms (they depend on A, W and curvature); collect your own data before bands. Not a clinical motor test.
- **What's missing that research would add:**
  1. **Normalise the path length** (e.g. rescale the segment heights so every path has the same arc length, about 1700 units). This changes scores slightly but removes most layout luck; no `scoreVersion` bump needed in development.
  2. Optionally show **speed** ("path widths per second" = (A/W) / T, the steering-law throughput) as a stat, which stays comparable even if paths vary.
  3. Optionally show the **finish rate** of recent attempts somewhere (stats page), so risky play is visible.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 4 | Steering through a path is an established HCI/motor paradigm. |
| Method | 3 | Close in task shape; variable path length, single trial and fail = no score differ from practice. |
| Score | 3 | Meaningful time, but layout luck and best-of-survivors weaken it. |
| **Overall** | 3 | Fun and grounded; fixing path length is the key improvement. |

**4. Other feedback**
- Rules are accurate (GO arms the run, timer starts on leaving GO along the path, leaving the path gives no score).
- Skill "fast, precise movement" could be "steering: fast, precise movement along a path"; optional.
- Motor is the right category.

---

### Eye for Geometry (`geometry`): overall 3 / 5
**What it does now:** 10 tasks, one of each kind in random order:
- middle of a line;
- centre of a circle;
- make an angle;
- name a marked angle (typed);
- halve an angle;
- make a line parallel;
- complete a square;
- copy a length;
- point equally far from 3 dots;
- slide a cut to halve an irregular shape.

You adjust by dragging or clicking, with no time limit, then press Done. Each task scores 0–100 %, falling linearly to 0 at a per-task tolerance (8 % of length, 25 % of radius, 25°, 25°, 15°, 10°, 25 % of side, 25 % of length, 30 % of radius, 10 % of area). The exact solution is shown after each task. The score is the mean %. The result shows the best and weakest task and every task's %.

**1. Name**
- Current name: friendly and descriptive.
- Alternatives:
  - "Eyeballing": the name of the well-known Eyeballing Game, which uses very similar tasks.
  - "Geometry by Eye": very literal.
  - "Sharp Eye": catchy, less specific.
- **Recommendation:** keep **Eye for Geometry**.

**2. Scientific relevance**
- **Comparable studies / paradigms:**
  - The overall format closely resembles **Matthias Wandel's Eyeballing Game** (woodgears.ca: midpoint, bisect angle, triangle centre, circle centre, right angle, convergence, parallelogram; score = average error in px). Forum-reported averages are about 3–4 px, but these are unverified self-reports ([kottke](https://also.kottke.org/08/10/the-eyeballing-game), [GeoGebra adaptation](https://mat.geogebra.org/material/show/id/Ha6sxrcJ)).
  - The research building blocks:
    - **Line bisection:** healthy adults err slightly left ("pseudoneglect", d ≈ −0.4 overall; Jewell & McCourt 2000, 73 studies) ([meta-analysis record](https://acnpsearch.tweb-dev.unibo.it/singlejournalindex/67754475)).
    - **Angle perception:** acute angles are overestimated and obtuse ones underestimated (Wundt onward; Nundy et al. 2000, [PNAS](https://pmc.ncbi.nlm.nih.gov/articles/PMC25873)).
    - **Orientation and parallelism:** judgments are worse for oblique than for horizontal or vertical lines, the **oblique effect** (Appelle 1972, [Wikipedia](https://en.wikipedia.org/wiki/Oblique_effect)).
    - **Length matching by the method of adjustment:** reported Weber fractions vary hugely by procedure, from about 1 % to 28 % ([Hamburger & Hansen 2010](https://www.allpsych.uni-giessen.de/hansen/publications/HamburgerHansen2010AttenPerceptPsychophys.pdf)).
  - The untimed drag-to-adjust input is itself the classic **method of adjustment**. Good.
- **Differences from the research setup:**
  - **One trial per task kind.** Research uses about 20 adjustments per condition. Per-task chips are single trials, so "Weakest task" is mostly noise.
  - **Tolerances are design choices, not perceptual thresholds.** Some tasks may be much easier than others (e.g. "Name the angle" with ±25° likely scores high, "Parallel" with ±10° and random orientation is harsher). This is unverified; the scoring-reviewer could check with data or simulations.
  - **"Name the angle" is a different skill.** It is symbolic estimation (knowing what 70° looks like in numbers), not a visual match.
  - **Random orientations** make some trials harder (oblique effect), which is per-run luck.
  - **"Equal distance", "Complete the square" and "Split" involve geometric reasoning** as well as perception. Fine.
- **How accurate is the score?** The average over 10 heterogeneous items is moderately stable; individual tasks are not. There is no ceiling in practice: 100 % needs a near-perfect answer on all 10. A floor is unlikely.
- **Can it tell you something about you?** How precisely you judge midpoints, angles, lengths and areas by eye, useful for drawing, DIY and design. No norms exist for this composite; collect your own data. A fun fact you can show: most people place the "middle" slightly left. It's not a maths or IQ test.
- **What's missing that research would add:**
  1. A **Tendency** on the middle task (left or right of centre) or on the angle tasks (too wide or too narrow), linking to pseudoneglect and angle-misperception findings. No score change.
  2. Tune the per-task tolerances from collected results so each task averages a similar %. This changes scores and is done once.

**3. Ratings**
| | Rating | Why |
|---|---|---|
| Relevance | 3 | Each task touches established perception findings, but the composite isn't a standard construct. |
| Method | 3 | Method of adjustment is right; one trial per task and arbitrary tolerances. |
| Score | 3 | Meaningful as a rough "eyeballing" index; per-task results are noisy. |
| **Overall** | 3 | Fun and grounded in many small findings; better as a whole than per task. |

**4. Other feedback**
- Rules are accurate and fit (10 tasks, Done and OK, solution shown, average %).
- Estimation is the right category (perceptual judgment dominates over reasoning).
- Minor: `set-angle` has no short chip name in `SHORT` (`geometry/scoring.ts`), so its chip shows the full title "Make 73°". It may be intended; if not, it's for the consistency-reviewer.

---

### Summary table

| Test | Current name | Recommended name | Relevance | Method | Score | Overall | Top improvement |
|---|---|---|---|---|---|---|---|
| `time-estimation` | Time Estimation | Time Estimation | 4 | 3 | 3 | 3 | Say "counting is allowed" (and fix the skill line); add a Consistency (spread) stat |
| `quick-count` | Quick Count | Quick Count | 4 | 4 | 4 | 4 | Split Tendency into ≤ 20 vs > 20 dots (underestimation grows with number) |
| `mental-math` | Mental Math Sprint | Mental Math Sprint | 4 | 3 | 3 | 3 | Address the keyboard vs mouse-keypad speed gap (rules hint); per-operation stats |
| `steady-hand` | Circle Chase | Circle Chase | 4 | 4 | 3 | 4 | Add "Avg distance from centre" (continuous, no ceiling) |
| `aim-trainer` | Aim Trainer | Aim Trainer | 4 | 3 | 4 | 4 | Check that free misses don't reward spamming; add Centre rate; consider Motor |
| `tap-speed` | Tap Speed | Tap Speed | 4 | 3 | 3 | 3 | State the technique ("use one finger" or "any technique counts") |
| `stop-the-bar` | Stop the Bar | Stop the Bar | 4 | 3 | 3 | 3 | Add a Consistency (VE) stat; consider 6–8 rounds; say "bar" not "marker" |
| `mental-rotation` | Mental Rotation | Mental Rotation | 5 | 4 | 4 | 4 | Show time for small vs big turns (the classic angle effect) |
| `line-tracing` | Line Tracing | Line Tracing | 4 | 3 | 3 | 3 | Normalise the path length (about ±9 % layout luck now) |
| `geometry` | Eye for Geometry | Eye for Geometry | 3 | 3 | 3 | 3 | Bisection/angle Tendency stat; tune tolerances from data |

### The 3 changes with the most scientific value for the least fun lost
1. **Add the research-standard breakdown stats to the result screens.** None of these changes scores or gameplay:
   - Consistency (SD of signed errors) for Time Estimation and Stop the Bar, completing the classic AE/CE/VE triplet;
   - small-turn vs big-turn time for Mental Rotation, the defining angle effect;
   - average distance from the centre for Circle Chase;
   - ≤ 20 vs > 20 Tendency for Quick Count.
2. **Make the strategy explicit where it decides the construct.** These are text-only changes:
   - Time Estimation: "Counting in your head is allowed", with the skill line changed to "keeping time in your head";
   - Tap Speed: "Use one finger" or "Any technique counts";
   - Mental Math: "Typing is faster than clicking the keypad".

   This keeps the fun and makes each score honest about what it measures.
3. **Line Tracing: give every path the same arc length** (and roughly the same curviness), so time differences reflect the player, not the layout. This is a small generator change and changes scores slightly; no `scoreVersion` bump needed in development.

**For the scoring-reviewer:** please simulate run-to-run spread for Stop the Bar (5 trials), Time Estimation (5 trials), Circle Chase (path luck, possible ceiling), Line Tracing (path length and curvature), and Aim Trainer (does click-spamming pay with free misses?).

### Checklist points that passed (all 10 tests)
- Names: all clear, no clashes with the other 19 names, and the established name is used where one exists (Mental Rotation).
- Taglines: one sentence each that a newcomer understands. Two wording tweaks are suggested above (Mental Math "sums", Time Estimation "without a clock" vs counting).
- Rules accuracy vs code: rounds, durations, start rules, end rules and scoring lines all match the code. Only small wording points remain (Stop the Bar "marker", Mental Rotation "the right one is turned").
- Score labels and units match their meaning everywhere (%, ms, s, pts, /s, correct).
- Categories: all fit their main load. One optional suggestion: Aim Trainer → Motor.
- Honest claims: no test suggests a diagnosis, IQ or clinical measure. No sensitive stimuli (no red/green colour coding needed to play these 10).
- Icons: not reviewed this run (browser not used, as instructed).
