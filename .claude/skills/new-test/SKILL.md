---
name: new-test
description: The step-by-step process for creating a new Skill Lab test, from idea through design sketch, prototype, tuning and review to a real test. Use when the user proposes a new test idea, asks to build a new test or game, or works on a prototype (e.g. "/new-test", "I have an idea for a test", "let's make X its own game").
---

# Creating a new test

A new test goes through eight steps. Each step ends with something the user can look at, and **the user's OK moves it to
the next step**. Never run ahead: if the user asks an open question or for your view, answer it and wait. Build only
the parts that don't depend on the answer, and say which those are.

Technical rules for building a test (files, shared pieces, layouts, registry fields, design rules and defaults) are in
`CLAUDE.md` under "Adding a test". The product spec is `docs/SPEC.md`. `docs/LESSONS.md` has examples of problems earlier
tests ran into and how they were solved: borrow from it, but it's not a rulebook.

**Show, then build.** For anything visual (layout, stimuli, icons, a theme) show samples first: a small mockup, or the
stimuli on a full board rather than one shape. For any scoring choice show a simulation table (see step 4). Build once
the user has picked.

## 1. Idea (user)
The user describes what you do, what it should test and roughly how long. If something essential is unclear (the
core action, what is scored), ask, briefly, before step 2.

## 2. Design sketch (you, then the user confirms)
Propose the test as one short table, nothing built yet:

| | |
|---|---|
| Name · category | e.g. "Split in Half · Estimation" (category: one of `CATEGORIES` in `src/tests/types.ts`) |
| What you do | one or two sentences, in the player's words |
| Rounds / levels | how many, how difficulty changes, how a run ends (time, rounds, lives), rough length (1–2 min ideal, up to 5 if needed) |
| Input | mouse and / or keyboard (click, drag, keys); the mouse is always supported (say if the keyboard is recommended) |
| Layout | `full`, `prompt`, `square` or `panel` (see "Test screens" in the spec) |
| Score | what it counts, the unit, higher or lower is better; rough is fine |
| Randomness | what is random and how runs stay comparable (fixed mix per run, semi-random values) |
| Research | the closest known task, in one line (deeper checks come in step 6) |
| Adds | what it measures that no existing test does (if nothing, say so: it may not be worth building) |
| Open questions | anything the user should decide |

Wait for the user's OK or changes. Show changed versions as the full table again.

## 3. Prototype (you)
- Build it as a prototype: an entry in `PROTOTYPES` in `src/tests/registry.ts` (shown in the home page's "Prototypes"
  section, left out of the test count, Next test, stats and sharing). Rules text can be rough.
- Follow "Adding a test" in `CLAUDE.md`: `src/tests/<id>/` with `<Name>Test.tsx` + `scoring.ts` + `scoring.test.ts`,
  shared pieces from `components/game/`, a simple icon in `src/icons/<id>.svg`.
- Unit-test the round generation (always valid, fits the board, the intended mix) and the scoring.
- Add a row to the "Prototypes" table in `docs/SPEC.md`.
- Play it in the browser preview (localhost, desktop) yourself: a full run, the result screen, mouse and keys.
- Work on a `feat/<id>-prototype` branch; `npm test`, `npm run lint`, `npm run build` pass; merge into `develop`.
  Let the checks gate the merge (`npm test && npm run lint && npm run build && git merge …`), never just run them.
- **Build in a separate copy** when the user may be playing or other sessions are open: your own worktree, port slot
  (`wt-1` … `wt-4`) and browser tab, as in "Parallel sessions" in `CLAUDE.md`. Remove the server, your tab and the
  worktree when done.
- Bots in the browser pane: it draws few frames per second, so wait for a drawn frame before pressing; odd timings are
  usually the pane, not the game.
- Report: what you built, what you checked, anything you chose yourself that the user may want to change.

## 4. Play and tune (user and you)
**Gameplay only:** is it worth keeping, how it feels, difficulty, length, a rough score. Rules text, icon and small
quality-of-life details can stay rough here; they're done in step 5. The user plays and gives feedback. For each point:
clear decisions → change them; open points → propose (table, numbers) and wait. When luck, loopholes or the score scale
matter, show a quick simulation instead of guessing: the same simulated player many times (spread), random / one-button /
alternating bots, two early vs two late mistakes, cautious vs bold answering, best of 10 runs. Compare the options side
by side.

It's fine to cut a prototype. Keep it only if it measures something no other test does, feels good to play, and gives
a usable score in 1–2 minutes, or up to 5 when the test needs it, is worth the time and a shorter version wouldn't work
(Choice Reaction, Flanker and Pattern Groove were cut for this, see `docs/LESSONS.md`).

The step ends when the user says the gameplay is right.

## 5. Polish (you)
Make the prototype a finished test, still in `PROTOTYPES`, so the reviewers and the user see the real thing:
- final `tagline`, `skill`, `howTo`, `scoring` (by "Rules texts" in `CLAUDE.md`: accurate to the code, fits the 768 × 512 rules stage), `scoreLabel`,
  `durationHint`, `start`, `layout` (rules for these in `CLAUDE.md`);
- info-row texts, feedback on every input, result stats, keys, edge cases (stuck states, double clicks, the end of a run);
- a real icon (style rules in `src/icons/README.md`; propose a few and let the user pick, the only stop in this step);
- check it against the design rules and defaults in `CLAUDE.md`, and play full runs yourself (mouse and keys).
Report what you changed and anything you chose yourself.

## 6. Agent review (agents, then the user picks)
- run `scoring-reviewer` (fairness, luck, loopholes) and `test-auditor` (name, rules, research grounding); add
  `consistency-reviewer` when the test brings something new to the site (a new input, layout or result block);
- save the combined report to `docs/reviews/<date>-<id>.md`;
- summarise it for the user; they pick what to change. Apply only those.

## 7. User review (user)
The user plays the finished test: rules screen, full runs, result screen, icon. They OK it or send fixes; apply them
(clear ones directly, open ones as a proposal first) until they say it's ready.

## 8. Promote (you)
- move the entry from `PROTOTYPES` into `TESTS`;
- move its spec row from "Prototypes" to the test tables in `docs/SPEC.md`;
- have the `play-tester` play full runs, and fix what it finds (create a browser tab for it first and give it the
  tabId: agents can't open tabs, and the user's tab stays theirs); anything beyond a plain bug fix goes to the user first;
- merge into `develop`. It goes live only when the user says to publish;
- add what was learned to `docs/LESSONS.md` (problem → how it was solved here), and to the defaults in `CLAUDE.md` only
  if it's general.
