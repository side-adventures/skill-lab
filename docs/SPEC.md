# Skill Lab — Product Spec

A static website with short skill tests (memory, reaction, perception, …).
Each test takes a few minutes, needs no learning, and produces **one number** a
player can share and compare with friends.

## Constraints

- **Frontend only.** No backend, no API calls. Must deploy as static files to GitHub Pages.
- Works with **mouse and touch** (keyboard is optional, never required).
- Works on phone and desktop widths.
- Scores are stored **locally** (`localStorage`) — personal best + history per test.
- Comparison with others is **manual**: the result screen offers a share text/link.
  (Future, not now: reference percentiles, real leaderboards via a hosted DB.)

## Test flow (shared by every test)

1. **Intro** — name, one-sentence instruction, how it is scored, Start button.
2. **Play** — the test itself.
3. **Result** — score, personal best, "new best!" badge, Share, Try again, Back home.

## Tests (v1)

| id | Name | How it works | Score | Better |
|---|---|---|---|---|
| `reaction` | Reaction Time | Screen turns green after a random 1.5–5 s delay; tap as fast as possible. Tapping too early restarts the round. 5 rounds. | Average ms | Lower |
| `visual-memory` | Visual Memory | A grid flashes some tiles (level + 2) for 1 s; tap them back. Grid grows 3×3 → 7×7 with level. 3 wrong taps fail a level (retry with a new pattern); 3 failed levels end the game. | Levels cleared | Higher |
| `stroop` | Stroop Test | A color word (red/blue/green/yellow) is shown in an ink color (75 % mismatched); tap the button matching the **ink**. 45 s after a 3-2-1 countdown. | Correct − wrong | Higher |
| `time-estimation` | Time Estimation | Given a target (3–10 s), press Start and Stop when you think the time has passed. Timer is hidden. 5 rounds. | Average error in % | Lower |
| `quick-count` | Quick Count | A random number of dots (5–40) flashes for 0.6 s; enter how many you saw. 10 rounds. | Average accuracy % | Higher |
| `mental-math` | Mental Math Sprint | Simple arithmetic (+ − × ÷), non-negative integer answers, numbers grow slightly every 5 correct. On-screen keypad or keyboard. 60 s. | Correct answers | Higher |
| `steady-hand` | Steady Hand | Starts when the pointer enters the centred circle. The circle drifts on a smooth random path, speeds up (×1.8) and shrinks (radius 14 % → 5.5 % of the area). 30 s. | % of time inside | Higher |

## Share format

`I scored 243 ms on Reaction Time at Skill Lab — can you beat it? <url>#/test/reaction`
Uses the Web Share API when available, otherwise copies to clipboard.
