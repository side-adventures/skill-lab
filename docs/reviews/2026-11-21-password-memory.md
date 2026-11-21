# Password Memory review (2026-11-21)

Branch `feat/password-load-v2` (load v2: changes per word, level 1 = 6-letter word + one extra, +1 load to level 4
then +0.5, skip a level until the first miss, 3 lives, score = highest level confirmed). Reviewers: scoring-reviewer,
test-auditor.

## Scoring reviewer
- No exploit beats honest play (empty Enter does nothing, Caps Lock / extra characters fail, paste and drop blocked,
  O/0 and I/1 leniency can't be used to hedge, waiting doesn't help).
- **Two early slips cost a lot (medium).** A lab-level player (50 % point 11.8, mean score 12.4) loses 4.1 levels to two
  misses from level 1, 2.9 from level 9, 2.0 from level 11: about half the gap between a weak (9.5) and a strong (13.5)
  player. Cause: 3 lives, not the skip (the skip only shortens runs). Alternatives simulated: 4 lives (−2.6 to −2.0,
  13 rounds), or a free first miss that only ends the skipping (−2.3 to −2.1, almost flat, 13 rounds).
- **Some mixes are easier / harder than their load (medium, one player's data).** Refit on the lab data: leet 1.11
  (game 0.5), no separator 1.72 (game 1.0), three words −0.67 (game has none). At level 12, one word with leet (36 % of
  passwords) is ~+0.86 harder than its load, three words with capitals only (9 %) ~−1.24 easier; high levels fill up with
  leet-heavy single words. Effect on the score's spread is small (binomial noise dominates); mean ~0.6 levels lower.
  Suggested: leet ~0.9 and −0.5 for three words, or cap changes per single word (e.g. 3).
- **Fallback edge case (low):** `passwordForLoad` returns null when no mix can reach the target (e.g. load 2); not
  reachable in the game. Above level ~72 passwords miss the 0.15 window. Keep a closest candidate or throw.
- Spread: SD 1.9 levels (0.24 of the weak–strong gap), p10–p90 10–15 for the lab player, ~11 rounds (p90 13), best of
  10 runs 15.3. No ceiling within realistic play.

## Test auditor
- A good replacement for Number Memory; rules accurate to the code. Name, category, icon (field + dots + caret, same
  family as Number Memory's) and skill line fit.
- **The level scale is an order, not yet a measure:** fit on one practiced player (expert bias: newcomers may find leet
  and symbols harder, non-native speakers words), ~110 misses for ~9 weights, levels above ~13–14 extrapolate, the
  time weight is measured at 3–4 s and used at 5 s. Get lab data from 2–3 more players (a newcomer, a non-native
  speaker) before promoting. Keeping "Level N" is the honest choice; never "equals X digits".
- Reliability: a maximum from ~11 rounds; if too noisy, a 4th life is the smallest fix (Woods et al. 2011: mean span
  more reliable than max span).
- Score line: "Your highest level typed back correctly. …" (highest level can read as reached).
- "Keyboard only." is slightly wrong (Save and the symbol buttons click): "Type it back exactly on the keyboard, then
  press Enter."
- Tagline flat: "One look at a tricky password, then type it back exactly." or "Could you retype Sunsh1ne-cat#7 after
  one look?"
- Optional howTo line 3: "Each password you get right leads to a harder one."
- SPEC row should say why it runs ~3 min ("the climb needs about 11 passwords to settle").
- Research: closest is immediate serial recall of a visually shown string with chunking (Cowan 2001: ~4 chunks; a
  word is one chunk, each change / loose extra roughly its own item); password studies measure recall over days, so no
  claims about real passwords. The score can't claim a span in items, digit-span norms or password skill.

## Decisions
(filled in after the user picks)
