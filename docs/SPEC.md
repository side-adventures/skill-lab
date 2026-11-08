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
| `visual-memory` | Visual Memory | A grid flashes some tiles for ~1 s; tap them back. Each level adds a tile and the grid grows. 3 mistakes per level allowed, 3 failed levels end the game. | Highest level reached | Higher |
| `stroop` | Stroop Test | A color word is shown in a different ink color; tap the button matching the **ink**. 45 s. | Correct − wrong | Higher |
| `time-estimation` | Time Estimation | Given a target (3–10 s), press Start and Stop when you think the time has passed. Timer is hidden. 5 rounds. | Average error in % | Lower |
| `quick-count` | Quick Count | A random number of dots (5–40) flashes for 0.6 s; enter how many you saw. 10 rounds. | Average accuracy % | Higher |
| `mental-math` | Mental Math Sprint | Simple arithmetic (+ − × ÷, small integers), answer via on-screen keypad. 60 s. | Correct answers | Higher |
| `steady-hand` | Steady Hand | Keep your pointer/finger inside a circle that drifts around and slowly shrinks. 30 s. | % of time inside | Higher |

## Share format

`I scored 243 ms on Reaction Time at Skill Lab — can you beat it? <url>#/test/reaction`
Uses the Web Share API when available, otherwise copies to clipboard.
