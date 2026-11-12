# Skill Lab — Product Spec

A static website with short skill tests (memory, reaction, perception, …).
Each test takes a few minutes, needs no learning, and produces **one number** a
player can share and compare with friends.

## Constraints

- **Frontend only.** No backend, no API calls. Must deploy as static files to GitHub Pages.
- **For now: desktop and dark theme only.** Mouse is the main input (keyboard optional, never required).
  Phone / touch support and a light theme are postponed, not dropped.
- Scores are stored **locally** (`localStorage`), one record per test (`skill-lab:v2:test:<id>`): the personal
  best (kept forever), the total number of attempts, and the last 100 results (score, date, and the result
  screen's details). The old format (`skill-lab:v1:results:<id>`, last 50 scores) is converted on first read.
- Comparison with others is **manual**: the result screen offers a share text/link.
  (Future, not now: reference percentiles, real leaderboards via a hosted DB.)

## Test flow (shared by every test)

1. **Intro** — name, one-sentence instruction, how it is scored, Start button.
2. **Play** — the test itself.
3. **Result** — score, personal best, "new best!" badge, Share, Try again, Back home.

## Tests

Home page (`src/pages/Home.tsx`):
- Header (on every page): logo, "Share scores" (all best scores; "Play a test first" if none), a Stats
  button (opens the stats page) and a Settings button that only shows a "coming soon" note for now.
- Title, subtitle and "x of 20 played" with a progress bar.
- Filters: category chips (All + 6 categories; the selected chip takes its category color) and an
  All / Not played switch. Stored in the URL (`?category=Memory&show=unplayed`), so they survive going
  into a test and back. An empty result shows "You've played every … test."
- One grid of cards in alphabetical order (a custom order may come later), all the same height:
  icon (category color), best score (number + unit) or a "Not played" label, title, 2-line description,
  and category · duration pinned to the bottom. A large faded icon in the corner is the card texture.
- Page background: violet glows in the accent color over a fine dot grid.
- Category colors: `CATEGORY_COLORS` in `src/tests/types.ts`.
A run can also end **without a score** (e.g. Line Tracing when you leave the path): the result
screen then shows why, and nothing is saved.

### Batch 1

| id | Name | How it works | Score | Better |
|---|---|---|---|---|
| `reaction` | Reaction Time | Screen turns green after a random 1.5–5 s delay; tap as fast as possible. Tapping too early restarts the round. 5 rounds. | Average ms | Lower |
| `visual-memory` | Visual Memory | A grid flashes some tiles (level + 2) for 1 s; tap them back. Grid grows 3×3 → 7×7 with level. 3 wrong taps fail a level (retry with a new pattern); 3 failed levels end the game. | Levels cleared | Higher |
| `stroop` | Stroop Test | A color word (red/blue/green/yellow) is shown in an ink color (75 % mismatched); tap the button matching the **ink**. 45 s after a 3-2-1 countdown. | Correct − wrong (result also shows avg response time for same vs different word/ink color, correct answers only) | Higher |
| `time-estimation` | Time Estimation | Given a target (3–10 s; each game has at least one short 3–4 s, medium 5–7 s and long 8–10 s target, the other two random, all distinct, shuffled), press Start and Stop when you think the time has passed. Timer is hidden. 5 rounds. | Average error in % | Lower |
| `quick-count` | Quick Count | Before each flash a soft violet ring of light grows from the board's center and fades (1 s, "look here"); then a number of dots flashes for 0.6 s; enter how many you saw. 10 rounds: first round 20–40 (calibration), then one count from each ninth of 5–60, shuffled. | Average accuracy % | Higher |
| `mental-math` | Mental Math Sprint | Simple arithmetic (+ − × ÷), non-negative integer answers, numbers grow slightly every 5 correct. On-screen keypad or keyboard. 60 s. | Correct answers | Higher |
| `steady-hand` | Steady Hand | Starts when the pointer enters the centred circle. The circle drifts on a smooth random path, speeds up (×1.8) and shrinks (radius 14 % → 5.5 % of the area). 30 s. | % of time inside | Higher |

### Batch 2

| id | Name | Category | How it works | Score | Better |
|---|---|---|---|---|---|
| `number-memory` | Number Memory | Memory | A number is shown for 1 s + 0.5 s per digit, then typed back. Starts at 3 digits, +1 per round. One mistake ends it. | Longest number typed correctly (0 if none) | Higher |
| `sequence-memory` | Sequence Memory | Memory | 3×3 grid; tiles flash one after another (450 ms on, 200 ms gap), repeat the order. Sequence grows by 1 each round (never the same tile twice in a row). One mistake ends it. | Longest sequence repeated | Higher |
| `number-order` | Number Order | Memory | Numbers 1–N on a 6×5 grid, visible 15 s (tapping "1" hides them early), then tap the hidden tiles in order. Starts at 5 tiles, +1 per round. No lives. | Most tiles completed (no score if the first round fails, like Flash Order) | Higher |
| `flash-order` | Flash Order | Memory | Same as Number Order but always 5 tiles; the visible time starts at 1 s and shrinks 10 % per cleared round. No lives. | Shortest flash cleared (no score if round 1 fails) | Lower |
| `word-memory` | Word Memory | Memory | Words one at a time (548-word built-in list); answer SEEN / NEW. Once 3 words are known, 40 % of items are repeats (never the word just shown). 3 lives. | Correct answers | Higher |
| `n-back` | N-Back | Focus | Positions on a 3×3 grid, one every 2.5 s (lit 0.5 s). Tap MATCH if same spot as N steps back. Starts at 2-back; blocks of 20 + N items with exactly 30 % matches among scored items. Balanced accuracy (avg of matches caught and non-matches ignored, so never tapping = 50 %) ≥ 80 % moves up a level, otherwise the test ends. | Highest N passed (0 if none) | Higher |
| `go-no-go` | Go / No-Go | Focus | 30 circles: 4 groups of 7 (5 green + 2 red, shuffled within the group) plus 1 extra green and 1 extra red inserted at random spots = 21 green, 9 red. First two always green, never two reds in a row (redrawn otherwise). 0.7–1.5 s apart, each visible 0.8 s. Tap on green only. | Total of green reaction times + 800 ms per missed green + 100 ms per mistake (miss, tap on red, tap before a circle) | Lower |
| `aim-trainer` | Aim Trainer | Speed | One target (56 px red/white: white ring with red border + red bullseye of 42 % of the diameter) at a time at random spots (always a real jump away). 30 s. Bullseye hit = 2 pts, ring = 1 pt. Misses are shown but not penalised. | Points | Higher |
| `tap-speed` | Tap Speed | Speed | Tap one big button for 10 s (timer starts at first tap). | Taps per second | Higher |
| `stop-the-bar` | Stop the Bar | Speed | 5 rounds, each at a different speed (0.35–1 track widths/s, shuffled); green line at 45–90 % of the track, but always at least 0.8 s of travel away (so fast rounds get a far line). Tap to start, tap to stop. | Average absolute timing error (ms) | Lower |
| `mental-rotation` | Mental Rotation | Thinking | Two 2D 7-square shapes (chiral, so mirrors are never identical); the right one is rotated 45°–315° and mirrored half the time. Answer SAME / MIRRORED. 60 s. | Correct − wrong | Higher |
| `line-tracing` | Line Tracing | Motor | Random smooth path (7 alternating turns) on a 1000×667 (3:2) board, corridor 60 units wide. Moving onto GO arms the run; the timer starts when you leave GO along the path (leaving it off the path just resets to waiting). Finish on the flag. Leaving the corridor (or lifting the finger) ends the run with no score. | Time | Lower |
| `geometry` | Eye for Geometry | Estimation | 10 rounds, one of each task in random order: middle of a line, center of a circle, make an angle, name the marked angle (typed), halve the marked angle (the arm can't leave the angle), make a line parallel to another (rotate around a fixed end; either direction counts), complete a square, copy a length, point equally far from 3 dots, slide a fixed-angle cut to halve an irregular shape. Each round gives 0–100 points, falling linearly with error (tolerances: 8 % of length, 25 % of radius, 25°, 25°, 15°, 10°, 25 % of side, 25 % of length, 30 % of radius, 10 % of area). Result lists every round. | Average points (%) | Higher |

## Share format

`I scored 243 ms on Reaction Time at Skill Lab — can you beat it? <url>#/test/reaction`
Uses the Web Share API when available, otherwise copies to clipboard. The header's "Share scores" button shares
all best scores in one message.

## Test screens (`components/TestRunner.tsx`)
- **Top bar** (fixed height): test icon in its category color + name. Right side: "All tests" on the rules
  and result screens; while playing: your best (if any) and a "?" button.
- **Info row** (fixed height, so nothing below moves): category · duration on the rules screen.
- **Rules screen:** a 3:2 stage at the full content width (768 × 512, same width as the top bar; the game screen will use the same stage) with the rules (`components/RulesContent.tsx`): the test's
  tagline as summary, "Tests <skill>", a "How to play" list and a "Score" list (any number of lines, from
  `skill`, `howTo` and `scoring` in the registry). Footer: a wide Start button on the left; on the right
  "Your best · N attempts", the value and "Stats ›" (opens `#/stats?open=<id>`, that row unfolded). Empty
  right side if the test was never played.
- **"?" while playing:** a centered overlay (`components/RulesOverlay.tsx`) with the same rules, Restart (new
  run) and Back to start (rules screen). The game keeps running underneath; closes with ✕, a click outside or
  Escape.
- **Playing** (`components/game/`): `GameFrame` draws the info row and the fixed 3:2 stage (768 × 512, invisible
  itself) at the same place as the rules screen, so nothing moves when you press Start.
  - **Start:** per test `start` in the registry: `countdown` (3-2-1, 0.6 s steps: Stroop, Mental Rotation, Word
    Memory, Mental Math, Aim Trainer, Go / No-Go, N-Back, Quick Count), `quick` (a short "Ready"), or `none`
    (your first action starts it: Tap Speed, Line Tracing, Steady Hand, Time Estimation). The countdown is drawn on an empty
    version of the test's layout (registry `layout`), so the play area is already there. The test's code is
    preloaded on the rules screen, so no loading state shows.
  - **Info row** (`<GameInfo>`): left = where you are (time left, round, level, lives), middle = what to do now
    (phase, short feedback like "Not a match"), right = how you're doing (score, average, accuracy). A thin
    timer line below it for timed tests and memorize times. With a single board it is as wide as the board.
  - **Layouts** (`layouts.tsx`):
    - *Full* (area = the whole stage, no padding): Reaction, Go / No-Go, Tap Speed, Time Estimation, Stop the Bar,
      Steady Hand, Aim Trainer, Line Tracing.
    - *Prompt + answers* (box; large display on top, answer strip at the bottom: `AnswerButtons` with keys, or the
      keypad row): Stroop, Word Memory, Mental Rotation, Mental Math, Number Memory. Two-choice tests use ← / → as keys
      and equal-looking buttons.
    - *Single square* (no box, board at full height; the info row matches its width): Visual Memory, Sequence
      Memory, Number Order and Flash Order (6:5 grid). Tiles via `TileGrid`.
    - *Square + panel* (box; board left, panel right with its own keypad): N-Back, Quick Count, Eye for Geometry.
  - **Correct / wrong feedback:** always the same green / red ring (`FEEDBACK_RING` in `lib/game.ts`:
    emerald-400 at 60 %, rose-400 at 65 %), never a filled area. Answer tests flash it on the display for ~0.2 s
    (`useAnswerFlash`); tile boards show it around the board on success / fail (`TileGrid` `frame`).
  - **Colors:** large areas never use bright green / red (dark theme): Reaction's full area uses rose-900 /
    emerald-700 / amber-800; a wrong tile is rose-700.
  - **Round result** (`RoundResult`): one big value, one line of context, chips with the rounds so far (5-round
    tests: Reaction, Time Estimation, Stop the Bar), "Click anywhere to continue" (any click, Enter or Space).
    In panel layouts it sits in the panel and the board keeps showing the answer. Eye for Geometry shows a Next
    button instead (its rounds end with a Done button too).
  - **End moment:** when a run ends by a mistake, the game freezes for 1.5 s (`END_MOMENT_MS`) showing what went
    wrong, then the result screen appears automatically.
- **Result screen** (`components/ResultScreen.tsx`): a 3:2 stage like the rules screen.
  - Info row: "Attempt N" (runs without a score: "Not counted").
  - Top of the stage: "‹ Rules" (back to the rules screen) on the left, "Stats ›" (`/stats?open=<id>`) on the right.
  - Middle: score label and the score (or "No score" and the reason), then "New personal best" / "First score" as a
    quiet violet badge, or "Your best: …" in gray. Below it the test's own stats (`TestResult.details`,
    `ResultDetails` in `types.ts`): a wrapping row of label / value stats, an optional special block (pair with
    difference, small table, digit comparison), and optional two-line chips (at most 10, the last ones).
  - Footer: Share (left, quiet; missing without a score) · Try again (middle, primary) · Next test (right, with icon
    in its category color). Next test = an unplayed test first, then one not played today, then any other; within
    each group A–Z starting after the current test (`lib/nextTest.ts`).
    The rules screen offers the same suggestion as a quiet "Skip to … ›" link at the right of its info row.
  - Keys: Enter / Space = Try again, N = next test. Input is ignored for the first 0.8 s.
  - Details are saved structured with each attempt (older attempts keep their plain label → value text).
  - Runs without a score show their stats too, but have no Share and aren't saved.

## Stats page (`#/stats`, `src/pages/Stats.tsx`)
- Same category chips as the home page (stored in the URL). `?open=<id>` unfolds that test's row and scrolls to it.
- Table: Test · Best (bold, with date) · Today (best of today, plain) · Last played (Today, Yesterday,
  N days ago, or a date), with Share best and Play buttons. Played tests first, then unplayed; both alphabetical.
- Unplayed tests: title and Play stay bright, stats show "—", no Share, can't be expanded.
- Clicking a played row unfolds it (several can be open): a graph of the attempts in the history
  (x = attempt number, better is always up), and Average / Median for all attempts (or "Last 100") and the
  last 5, plus Best and Attempts.
- Graph (`components/AttemptGraph.tsx`): faded score line in the category color; dots while there are
  ≤ 50 attempts, shrinking as they grow; the average of the last 5 as the main line once there are 5
  attempts, drawn from attempt 1 (averaging the attempts so far at the start);
  the all-time best as a white dot (if still in the history); hover shows score, attempt number and date.

## Shared behaviour
- Every test has an SVG icon (`src/icons/<id>.svg`, one color + transparency) on the home page and in the test header. Shared text keeps the emoji.
- Theme: dark only for now (`class="dark"` on `<html>` in `index.html`). Dark styles use Tailwind's `dark:` variant bound to that class, so a light theme can be added back later.
- Grid games (Visual Memory, Sequence Memory, Number/Flash Order) share one board feedback: the frame turns green on success, red on a mistake (`components/boardFeedback.ts`).
- Sharing (`components/ShareButton.tsx`): touch devices open the share sheet; desktop always copies to the clipboard. Without the async Clipboard API (plain http on a LAN address) it falls back to a hidden-textarea copy. The outcome is shown inside the button for 2.5 s (no layout jump).
- The result screen ignores taps/clicks for 0.8 s so a last tap in the test can't hit "Try again" by accident.
- When a test's scoring changes, its `scoreVersion` is bumped in the registry: results are then stored under a new key and old bests are no longer compared (Aim Trainer v3, Go / No-Go v3, Eye for Geometry v2).
