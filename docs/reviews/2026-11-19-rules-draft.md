# Rules draft (2026-11-19)

New `howTo` / `scoring` per test, following "Rules texts" in CLAUDE.md. Draft only; nothing in the registry has
changed. Under each test: what changed and why. Taglines and skill lines stay as they are, except where noted.

Changes that repeat across tests:
- **Lives:** "You have N lives: a mistake costs one." + "Out of lives ends the test." The "and you replay with …" part is
  gone (it doesn't change how you play).
- **Score lines start with "Your …".** For correct − wrong that means a small change to the shared phrasing:
  "Your correct answers minus wrong answers, so guessing does not pay off." (CLAUDE.md to match.)
- **Keypad / OK / on-screen keys** no longer mentioned. "The result also shows" everywhere.

---

## Speed

### Reaction Time
How to play
- Click to start a round. The box turns red: wait.
- After a random delay it turns green: click as fast as you can.
- Clicking while it is still red, or within 0.1 s of green, is too early and restarts the round.
- 5 rounds. More than 5 early clicks end the test without a score.

Score
- Your median reaction time: the middle one of your 5 times, so one slow round does not spoil it.

*Changed:* "5 rounds" now in How to play; dropped "(faster than anyone can react)".

### Aim Trainer
How to play
- A target appears somewhere on the board: click it.
- As soon as you hit it, the next one appears somewhere else.
- You have 30 seconds: hit as many as you can.

Score
- Your points: 2 for a hit in the red center, 1 for a hit on the white ring.
- Missed clicks cost nothing.

*Changed:* time-limit phrasing; "Your …" opening.

### Tap Speed
Tagline: *How fast can you tap?* → **How fast can you click?** ("click" rule.)

How to play
- Click the button as fast as you can.
- The 10-second timer starts with your first click.

Score
- Your clicks per second.

*Changed:* only the tagline.

### Symbol Code
How to play
- The code at the top pairs 6 symbols with the keys S D F and J K L.
- A row of symbols comes by: press the key for the first one, or click its button below.
- Keyboard recommended: rest your fingers on S D F and J K L.
- You have 60 seconds: answer as many as you can.

Score
- Your correct answers minus wrong answers, so guessing does not pay off.
- The result also shows your points in the first, middle and last 20 seconds.

*Changed:* dropped "it is new every run" and "(1–6 work too)" (shown on the buttons).

## Memory

### Pattern Memory
How to play
- Tiles light up for a second, then go dark.
- Click all the tiles that lit up, in any order.
- It starts with 3 tiles and adds one every level.
- You have 3 lives: a wrong click costs one.
- Out of lives ends the test.

Score
- Your best level: the most tiles you got right in one.

*Changed:* lives template; dropped the grid growing to 7×7 (you see it) and the "level 1 scores 3" example.

### Number Memory
How to play
- A number appears for a moment, then disappears.
- Type it back from memory, then press Enter.
- It starts with 3 digits and gets one digit longer every round.
- You have 2 lives: a mistake costs one.
- Out of lives ends the test.

Score
- Your longest number typed back correctly.

*Changed:* "press Enter" added (like Quick Maths / Backward Span); lives template.

### Sequence Memory
How to play
- Tiles on a 3×3 grid light up one after another. A tile can light up more than once, even twice in a row.
- Click them in the same order.
- Every round the same sequence plays again, one step longer.
- One mistake ends the test.

Score
- Your longest sequence repeated correctly.

*Changed:* only the score opening.

### Number Order
How to play
- Numbers appear on a grid for 15 seconds, then they are hidden.
- Click the hidden tiles in order: 1, 2, 3 …
- Ready early? Clicking 1 hides the numbers right away.
- It starts with 5 numbers and adds one every round.
- You have 2 lives: a wrong tile costs one.
- Out of lives ends the test.

Score
- Your best round: the most numbers you got right in one.

*Changed:* lives template; score phrased like Pattern Memory.

### Flash Order
How to play
- 5 numbers flash on a grid, at first for 1 second.
- Click the hidden tiles in order, from 1 to 5.
- Every round you clear, the flash gets 10 % shorter.
- You have 5 lives: a wrong tile costs one.
- Out of lives ends the test.
- Fun fact: in a 2007 study, a chimp named Ayumu still got most of these right with a 0.2 s flash. The people tested
  did much worse.

Score
- Your shortest flash you still cleared.

*Changed:* lives template (dropped "try the same flash again with new positions"). Fun fact unchanged, still last.

### Word Memory
How to play
- Words appear one at a time.
- Click SEEN if the word already appeared in this test, NEW if it did not.
- You have 3 lives: a wrong answer costs one.
- Out of lives ends the test.

Score
- Your number of correct answers.

*Changed:* dropped "After the first few words, many of them are repeats" (play shows it); lives template + end line.

### N-Back
How to play
- A square lights up on a 3×3 grid, in a new spot every 2.5 seconds.
- Click MATCH when it is in the same spot as 2 steps before; leave it alone when it is not.
- Each level is a block of about 20 squares. With 2 mistakes or fewer (a missed match or a wrong click), you move up
  to 3 steps back, then 4, and so on.
- You have 4 lives: every mistake beyond 2 in a level costs one.
- Out of lives ends the test.

Score
- Your score is the level you ended at × 100, plus a bonus of up to 80 for how close you came to passing it.
- The bonus is 80 if your last mistake used up your last life, 20 less for each mistake after that (ending at 4-back
  gives 400–480).

*Changed:* "leave it alone" joined to the MATCH line; lives template (dropped "play the level again"); the score
line split in two and explained by mistakes instead of "lives below 0".

### Backward Span
How to play
- Digits appear one at a time, about one per second.
- Then type them in reverse order, last digit first, and press Enter.
- It starts with 2 digits; each correct answer adds one.
- You have 2 lives: a mistake costs one.
- Out of lives ends the test.

Score
- Your longest sequence reversed correctly.

*Changed:* first line split; keypad line dropped (Enter moved into the typing line); end line.

### Change Detection
How to play
- Colored shapes flash for half a second, then disappear for about a second.
- When they come back, click CHANGED if one of them turned into a different shape and color, SAME if not.
- 40 rounds, half of them with a change.
- It starts with 4 shapes; 2 right answers in a row add a shape, a wrong one takes one away.

Score
- Your capacity: how many shapes you hold at a glance, estimated from all your answers, with guessing taken into
  account.

*Changed:* long lines split; "(or ↑ / ↓)" dropped (shown on the buttons); "The first rounds count a bit less while
you warm up" dropped.

## Focus

### Stroop Test
How to play
- A color word appears, written in the same or a different ink color, like RED in blue.
- Click the button for the ink color, not for the word.
- You have 45 seconds: answer as many as you can.

Score
- Your correct answers minus wrong answers, so guessing does not pay off.
- The result also shows how much a mismatch between word and ink slows you down.

*Changed:* first line shorter; "The result also shows".

### Go / No-Go
How to play
- 30 shapes appear one after another, 1 in 5 of them red.
- Click a green circle as fast as you can.
- Do not click on a red square, or before a shape appears.

Score
- Your total reaction time for the green circles.
- A missed green counts as 0.8 s.
- Each wrong click (on red, or before a shape appears) adds more than the last: 0.6 s, then 0.9 s, 1.2 s, and so on.

*Changed:* "costs" → "adds" (penalty phrasing).

### Advent Calendar
How to play
- Round 1: click the doors in order, 1 → 2 → 3 … 24.
- Round 2: star doors and tree doors, 1–12 each.
- Alternate: stars counting up, trees counting down (★1 → 🌲12 → ★2 → 🌲11 …).

Score
- Your total time for both rounds.
- Each wrong door adds 1 s, also one you already opened.
- The result also shows how much slower the switching round is.

*Changed:* round 2 split in two lines; the "flashes red and shows the next door" line dropped (play shows it), its
"already opened" part moved to the penalty line; "per door and in total" dropped.

### Odd One Out
How to play
- The board fills with L shapes and one T, all turned every which way. Click the T.
- 15 rounds, with 16, 24 or 36 shapes.

Score
- Your total time for all 15 rounds.
- Each wrong click adds 1 s.
- The result also shows how much each extra shape slows you down.

*Changed:* penalty on its own line.

## Thinking

### Quick Maths
How to play
- Solve simple + − × ÷ problems. Every answer is a whole number.
- Type the answer, then press Enter.
- The problems get harder as you go.
- You have 60 seconds: answer as many as you can.

Score
- Your number of correct answers. A wrong answer costs nothing.

*Changed:* keypad / OK dropped; the 60 seconds moved from Score to How to play.

### Mental Rotation
How to play
- You see two shapes. The right one is turned.
- Click SAME if it is the same shape, just rotated, or MIRRORED if it is its mirror image.
- You have 60 seconds: answer as many as you can.

Score
- Your correct answers minus wrong answers, so guessing does not pay off.

*Changed:* the buttons are named; time-limit phrasing.

## Estimation

### Time Estimation
How to play
- Each round shows a target time between 3 and 10 seconds.
- Click to start a hidden timer, then click again when you think the time is up.
- 5 rounds.

Score
- Your average error, in percent of the target time.

*Changed:* dropped "with a short, a medium and a long target among them" (doesn't change how you play).

### Quick Count
How to play
- Between 5 and 60 dots flash for just over half a second, most often around 15 to 20.
- There is no time to count: type how many you think you saw.
- 10 rounds.

Score
- Your average accuracy: how close your guesses were, in percent.
- Too high and too low count the same: guessing half or double the real number both score about 31 %.

*Changed:* nothing.

### Eye for Geometry
How to play
- 8 rounds, each a short task, such as finding the balance point of a triangle or the middle of a zigzag line.
- Drag or click on the board, then click Done.

Score
- Your average accuracy over the 8 rounds.
- Each round scores up to 100 %, less the further off you are.
- After each round, thin green lines (a ring, two marks or two outlines) show where the points run out: beyond them,
  the round scores 0 %.

*Changed:* the split into 4 task kinds dropped; "tasks" → rounds; "you see the exact solution" dropped (play shows
it); score line order flipped; the green-lines line stays in Score.

### Split in Half
How to play
- Drag the line left or right, or click where it should go. The ← / → keys also move it.
- Place it so both sides of the shape have the same area, then click Done.
- 5 rounds, a new shape each time.

Score
- Your average points over the 5 rounds.
- Each round: 100 points for a perfect 50 / 50 cut, 5 less for every 1 % off (0 at 30 / 70 or worse).

*Changed:* "you see the exact cut" dropped; score lines flipped. The ← / → keys stay: they aren't shown anywhere else.

## Motor

### Circle Chase
How to play
- Move your pointer into the circle to start.
- The circle drifts around, speeds up and shrinks. Keep your pointer inside it.
- The test lasts 30 seconds.

Score
- Your share of the time inside the circle.

*Changed:* score opening. ("You have 30 seconds: …" doesn't fit a tracking test, so it keeps "The test lasts".)

### Hit the Line
How to play
- Click to start: the bar slides along a track.
- Click again to stop the bar exactly on the green line.
- 5 rounds, each at a different speed.

Score
- Your average timing error: how many milliseconds too early or too late you stopped.

*Changed:* nothing.

### Line Tracing
How to play
- Move your pointer onto GO. The timer starts when you leave GO along the path.
- Follow the path to the flag as fast as you can, staying inside it.
- Leaving the path ends the test without a score.

Score
- Your time from GO to the flag.

*Changed:* two lines joined; "run" → "test".
