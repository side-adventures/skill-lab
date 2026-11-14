---
name: new-test
description: The step-by-step process for creating a new Skill Lab test, from idea through design sketch, prototype, tuning and review to a real test. Use when the user proposes a new test idea, asks to build a new test or game, or works on a prototype (e.g. "/new-test", "I have an idea for a test", "let's make X its own game").
---

# Creating a new test

A new test goes through six steps. Each step ends with something the user can look at, and **the user's OK moves it to
the next step**. Never run ahead: if the user asks an open question or for your view, answer it and wait. Build only
the parts that don't depend on the answer, and say which those are.

Technical rules for building a test (files, shared pieces, layouts, registry fields, design rules) are in `CLAUDE.md`
under "Adding a test". The product spec is `docs/SPEC.md`.

## 1. Idea (user)
The user describes what you do, what it should test and roughly how long. If something essential is unclear (the
core action, what is scored), ask, briefly, before step 2.

## 2. Design sketch (you, then the user confirms)
Propose the test as one short table, nothing built yet:

| | |
|---|---|
| Name · category | e.g. "Split in Half · Estimation" (category: one of `CATEGORIES` in `src/tests/types.ts`) |
| What you do | one or two sentences, in the player's words |
| Rounds / levels | how many, how difficulty changes, how a run ends (time, rounds, lives) |
| Input | click / drag / keys; mouse first, keyboard a bonus |
| Layout | `full`, `prompt`, `square` or `panel` (see "Test screens" in the spec) |
| Score | what it counts, the unit, higher or lower is better; rough is fine |
| Randomness | what is random and how runs stay comparable (fixed mix per run, semi-random values) |
| Research | the closest known task, in one line (deeper checks come in step 5) |
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
- Report: what you built, what you checked, anything you chose yourself that the user may want to change.

## 4. Play and tune (user and you)
The user plays and gives feedback. For each point: clear decisions → change them; open points → propose (table,
numbers) and wait. When luck, loopholes or the score scale matter, show a quick simulation instead of guessing.

## 5. Review (agents, then the user picks)
Once the gameplay feels right and the user says so:
- run `scoring-reviewer` (fairness, luck, loopholes) and `test-auditor` (name, rules, research grounding); add
  `consistency-reviewer` when the test brings something new to the site (a new input, layout or result block);
- save the combined report to `docs/reviews/<date>-<id>.md`;
- summarise it for the user; they pick what to change. Apply only those.

## 6. Promote (you)
When the user says the test is ready:
- move the entry from `PROTOTYPES` into `TESTS`; final `tagline`, `skill`, `howTo`, `scoring` (accurate to the code,
  fits the 768 × 512 rules stage), `scoreLabel`, `durationHint`, `start`, `layout`;
- a real icon (style rules in `src/icons/README.md`; propose a few and let the user pick);
- move its spec row from "Prototypes" to the test tables in `docs/SPEC.md`;
- have the `play-tester` play full runs, and fix what it finds;
- merge into `develop`. It goes live only when the user says to publish.
