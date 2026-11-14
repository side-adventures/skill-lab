# Skill Lab — notes for Claude

Static skill-test website (reaction, memory, focus…). Product spec: `docs/SPEC.md` — keep it in sync when scoring or rules change.
Ideas and TODOs for later: `docs/BACKLOG.md`.

## Hard rules
- **Frontend only.** No backend, no network/API calls. Deployed to GitHub Pages from `dist/`.
- **Current focus: desktop + dark theme only.** The site is always dark (`class="dark"` on `<html>` in
  `index.html`, no toggle). Desktop with mouse is the target; keyboard is a bonus, never required.
  Mobile / touch and a light theme may come back later, so don't break them needlessly: keep using
  `dark:` variants for dark colors, `onPointerDown` for input, and avoid fixed desktop-only widths, but
  don't spend effort testing or polishing them.
- Scores are local only (`src/lib/storage.ts`, localStorage, always wrapped in try/catch). One record per test:
  `best` (kept forever), `attempts` (total count), `history` (last 100 results with score, date, optional
  details). Old v1 lists are migrated on first read; never drop or reset the best when changing storage.

## Stack
Vite + React 19 + TypeScript + Tailwind v4 (`@tailwindcss/vite`), react-router `HashRouter`
(GitHub Pages has no SPA fallback), `base: './'` in vite config. Vitest for unit tests, oxlint for lint.

## Git workflow
- `develop` is the working branch. Branch every feature or fix off `develop` (`feat/<topic>`,
  `fix/<topic>`, `chore/<topic>`), commit and push there, then merge back into `develop` (`--no-ff`)
  when it's done and checked.
- `main` is the live site: every push to `main` deploys to GitHub Pages
  (https://side-adventures.github.io/skill-lab/). Only `develop` is merged into `main`, and only when
  the user says to publish. Never commit directly on `main`.
- After a branch is merged, delete it locally and on GitHub.

## Commands
- `npm run dev` — dev server (browser preview: `.claude/launch.json` config `dev`, port 5173; always test on localhost)
- `npm test` · `npm run lint` · `npm run build` — all three must pass before committing.

## Adding a test
New tests follow the process in the `new-test` skill (`.claude/skills/new-test/SKILL.md`): idea → design sketch →
prototype → play and tune → review → promote, with the user's OK between steps. The technical rules:
1. Create `src/tests/<id>/` with:
   - `<Name>Test.tsx` — default export, props `TestComponentProps` (`onFinish({ score, details })`;
     `details` is a `ResultDetails`: stats row, optional special block, optional chips — pick what's interesting for this test).
     Only the play phase: intro, countdown, result, best score, sharing are handled by `TestRunner` / `GameFrame`.
     A run without real play (no answers / clicks at all) calls `onFinish({ score: 0, failed: 'why' })` — shown, never saved;
     a run that was played but failed early saves its honest result (e.g. 0). See "When a run gets no score" in the spec.
     Build it from the shared pieces in `components/game/`: pick one layout (`FullLayout`, `PromptLayout`,
     `SquareLayout`, `SquarePanelLayout`), render exactly one `<GameInfo left middle right timer>` for the info
     row, and use `AnswerButtons`, `TileGrid`, `RoundResult`, `Lives`, `useAnswerFlash`, `useLater`,
     `END_MOMENT_MS` instead of hand-made versions. Never size anything by the viewport.
   - `scoring.ts` — pure logic (scoring, generation of rounds) + `scoring.test.ts`.
2. Add an icon `src/icons/<id>.svg` (style rules in `src/icons/README.md`; `icons.test.ts` fails without one).
3. Add an entry in `src/tests/registry.ts` with `Component: lazyTest(() => import('./<id>/<Name>Test'))`,
   a `category` (one of `CATEGORIES`; its color comes from `CATEGORY_COLORS` in `types.ts`), a `start` mode
   (`countdown` | `quick` | `none`, see `StartMode` in `types.ts`), the `layout` it uses (`StageLayout`, drawn empty
   during the countdown; `boardAspect` for a non-square board), and the rules:
   `tagline` (one sentence, also on the home card), `skill` ("Tests …"), `howTo` and `scoring` (short lines,
   as many as needed; say "click", keep it accurate to the code). Check the rules fit the 3:2 stage (768 × 512).
4. Use `className="play-area"` on interactive surfaces (no tap-zoom / text selection); use `onPointerDown`
   for timing-sensitive input; clear timers / rAF in effect cleanups.
5. Verify by actually playing it in the browser preview (desktop viewport), not just by building.

Design rules for every test:
- **Never use color as the only cue**: add a shape, text or position (Go / No-Go: green circle vs red square). Stroop
  is the exception, because color is the task itself.
- **Lives work the same everywhere**: a lost life replays the same level / round with a new layout, `<Lives>` in the
  info row, "Out of lives" ends the run, and the score is still the best level reached.
- **Rules mention options, not tips**: say what is possible ("type it on your keyboard, or click the keypad"), never
  which way is faster or how to play well.
- **The main score is in units a player can read on their own** ("9 tiles", "312 ms"), not internal counters
  ("level 7").

## Subagents (`.claude/agents/`)
Four reviewers, each answering one question with its own kind of evidence. They report back and never edit app code;
the main session decides and applies fixes. They can run in parallel.
- `play-tester` — *Does it work when played?* Plays full runs on localhost (desktop, dark theme) and reports bugs with
  repro steps. After building or changing a test, and before merging into `main`.
- `scoring-reviewer` — *Is the score fair and robust?* Loopholes, unfair random setups, luck vs. skill (same player,
  similar score every run), edge cases, score-changing edits (no `scoreVersion` bumps while in development); proves
  findings with unit tests. After adding a test or changing scoring / round generation.
- `test-auditor` — *Does each test say what it does, and does its score mean something?* Name, icon, tagline, rules,
  category, and the closest research paradigm (sources, reference values). After adding or reworking a test, or a sweep.
- `consistency-reviewer` — *Do the tests and pages match each other?* Rules wording, scoring style, run flow, results,
  Space / Enter, components, colors, test length, score ties; intended, test-defining differences are fine. After
  adding or changing a test or shared screen, or a site sweep.

## Conventions
- **While in development: don't bump `scoreVersion`** when reworking a test; old scores don't matter yet.
  Later (once there are real users), a change that makes old scores incomparable bumps that test's
  `scoreVersion` in the registry (stores results under a new key, see `storageId` in `types.ts`).
- Keep components small; shared UI goes in `src/components/` (game frame + layouts + AnswerButtons / TileGrid / RoundResult / GameInfo in `components/game/`, NumberPad, Button, ShareButton, TestIcon, CategoryChips, AttemptGraph, ComingSoonButton)
  and shared hooks/helpers in `src/lib/` (`useCountdown`, `useActionKey`, `useLater`, `useAnswerFlash`, `correctMinusWrong`, `spreadInts`, `shuffle`,
  `slowdown` for "X ms slower" pairs …). TileGrid's `instant` turns off the tile fade (a tile flashing twice in a row);
  `OrderGame` takes `lives`.
- **Past reviews** (test audits and other agent reports) are kept in `docs/reviews/<date>-<topic>.md`. Check them
  before reworking a test, so earlier findings and decisions aren't redone.
