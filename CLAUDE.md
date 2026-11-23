# Skill Lab — notes for Claude

Static skill-test website (reaction, memory, focus…). Product spec: `docs/SPEC.md` — keep it in sync when scoring or rules change.
Ideas and TODOs for later: `docs/BACKLOG.md`.

## Hard rules
- **Frontend only.** No backend, no network/API calls. Deployed to GitHub Pages from `dist/`.
- **Current focus: desktop + dark theme only.** The site is always dark (`class="dark"` on `<html>` in
  `index.html`, no toggle). Desktop is the target. **Inputs are mouse and / or keyboard, and the mouse is always
  supported:** every test is fully playable with the mouse alone. Where the keyboard is an advantage (typing, fast
  key answers) the rules may say so or recommend it. Exception: a test may be keyboard-only when typing is the task
  itself (Password Memory); its rules say so.
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

## Parallel sessions
Several sessions may run at once (each on its own test / branch), plus the user playing and subagents checking.
- **The main folder (`skill-lab`) stays on `develop`.** It's where the user plays (5173) and where merges happen.
  No session runs `git checkout` there while other sessions are open or the user is playing.
- **One worktree per session**, on its own `feat/<topic>` branch off `develop`: a worktree session from the app, or
  `git worktree add ../skill-lab-<topic>`. Edit only files in your own worktree. Dependencies:
  `cp -al ../skill-lab/node_modules node_modules && rm -rf node_modules/.vite` (two Vite servers sharing a `.vite`
  cache break each other). Remove the worktree when its branch is merged.
- **One port per worktree:** 5173 = main folder (`dev`), 5175 = spot-lab, worktrees take the first free slot of
  `wt-1` … `wt-4` (5181–5184, `--strictPort`) and say in chat which one they use. Never stop a server you didn't
  start. Scores are stored per port (localStorage), so runs on 518x don't touch the user's bests on 5173.
- **Browser: one tab each.** The user's tabs are theirs: never navigate, reload or click in them. Each session
  works in its own background tab (`tabs_create`) on its own port, and closes it and stops its server when done.
  Background tabs throttle timers and frames, so check logic and flow there; for timing-sensitive checks (ms
  values, flashes) ask the user before bringing your tab to the front.
- **Subagents** work in their session's worktree and port; the session creates their browser tab and passes the
  tabId and URL in the prompt. At most about 2 browser-driving agents across all sessions at once.
- **Merging:** first merge `develop` into your branch in your worktree, resolve conflicts there, and run
  `npm test && npm run lint && npm run build`. Then merge from the main folder without a checkout
  (`git -C ../skill-lab merge --no-ff feat/<topic>`), one merge at a time and only when the main folder is clean
  (`git status`). If another session is merging, wait.
- **Shared files** (`src/tests/registry.ts`, `docs/SPEC.md`, `docs/BACKLOG.md`, `CLAUDE.md`, icons README):
  keep edits small and additive; don't reorder or reformat what's there.
- Only the session that merges into `develop` updates the "skill-lab status" memory. Publishing (`develop` → `main`)
  stays a single step, from one session, when the user says so.

## Commands
- `npm run dev` — dev server (browser preview: `.claude/launch.json` config `dev`, port 5173; worktrees use `wt-1` … `wt-4`, see "Parallel sessions"; always test on localhost)
- `npm test` · `npm run lint` · `npm run build` — all three must pass before committing.

## Adding a test
New tests follow the process in the `new-test` skill (`.claude/skills/new-test/SKILL.md`): idea → design sketch →
prototype → play and tune (gameplay only) → polish → agent review → user review → promote, with the user's OK between steps. The technical rules:
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
   (`countdown` | `quick` | `none`, see "Starting a run" below), the `layout` it uses (`StageLayout`, drawn empty
   during the countdown; `boardAspect` for a non-square board), and the rules: `tagline`, `skill`, `howTo` and
   `scoring`, written by "Rules texts" below.
4. Use `className="play-area"` on interactive surfaces (no tap-zoom / text selection); use `onPointerDown`
   for timing-sensitive input; clear timers / rAF in effect cleanups.
5. Verify by actually playing it in the browser preview (desktop viewport), not just by building.

Starting a run (`start`):
- `countdown` (3-2-1) when **time matters from the first moment**: a clock runs, or stimuli come on their own
  (Stroop, Go / No-Go, Aim Trainer).
- `quick` ("Ready") when the player first **has to look at something but can then answer without time pressure**
  (a pattern flashes, then you click it back). Also fine between rounds.
- `none` (the test shows directly) when nothing is timed, or the player's own first action starts it.
- A test may deviate when a 3-2-1 or "Ready" would confuse (Backward Span: the countdown digits look like the
  sequence, so it shows "Memorize the digits" instead); note why in its SPEC row.

Design rules for every test:
- **Keys:** the obvious main action (Start, Submit, Next, Continue, Done) also works with Enter / Space; its button
  doesn't show that. Every other action button shows its key on the button (a `hint` in `AnswerButtons`); default to
  the arrow keys where they fit (two choices: ← / →, or ↑ / ↓ when stacked), otherwise keys that match the layout.
  Exception: the result screen has no main action, so going on is a choice: R = Try again, N = Next test, both shown.
- **Length:** 1–2 minutes is ideal. Up to 5 minutes is fine when the test needs it to give a usable score, is worth
  the time, and a shorter version wouldn't work; say why in its SPEC row.
- **Never use color as the only cue**: add a shape, text or position (Go / No-Go: green circle vs red square). Stroop
  is the exception, because color is the task itself.
- **Colour differences that matter for play stay distinct for red-green colour blindness** (~8 % of men): avoid
  red ↔ green, red ↔ brown, purple ↔ blue, pink ↔ light blue as the only difference; check with a deuteranopia /
  protanopia simulation (Spot the Difference's lab has one, `scripts/spot-difference/`).
- **Lives work the same everywhere**: a lost life replays the same level / round with a new layout, `<Lives>` in the
  info row, "Out of lives" ends the run, and the score is still the best level reached. **How many** lives is up to
  the test: more lives smooth out luck and a single slip, fewer keep a run short and tense. Pick what fits; there's
  no site-wide number.
- **The main score is in units a player can read on their own** ("9 tiles", "312 ms"), not internal counters
  ("level 7"). Use the number that makes the most sense for that test: scoring styles may differ between tests
  (correct − wrong, a median, an average error, time with penalties, the longest level). Later the plan is to show
  where a score stands among other players (a percentile), so it should be a number that can be compared that way.

Design defaults (learned while building tests; **defaults, not hard rules**: a test may deviate when that serves it —
note why in its SPEC row). Concrete examples of how each was solved are in `docs/LESSONS.md`.
- **Every input gets visible feedback, and nobody gets stuck**: no click or key that silently does nothing; after a
  mistake, if a player could lose track, show what comes next.
- **Give time to read mistakes**: a mistake that costs a life or ends the run always stays on screen first. When
  it's obvious at a glance (a wrong tile, a missed block, too many early clicks), the game freezes on it for 1.5 s
  (`END_MOMENT_MS`) and goes on by itself; when there's something to read (several lines, numbers to compare, as in
  Backward Span), it waits for click / Enter / Space (`useContinue`). The last answer's flash shows before the result.
- **Texts**: the info row says the current state in a few words; instructions and hints go in the play area. Rules
  texts: see below.
- **Stimuli**: stay close to the research setup unless there's a reason not to, and check a full board that the target
  doesn't stand out by accident.
- **Fair random setups**: balance positions, keep effort comparable between layouts, avoid easy patterns.
- **Results**: only stats a player can read and that are steady from run to run; leave out single noisy numbers.
- **The score holds up** (check with simulations, see the scoring-reviewer): random or button-mashing play scores
  poorly, a mistake costs about the same wherever it happens, answering style (cautious vs bold) doesn't swing it, and
  there's no ceiling within realistic play.

## Rules texts
The rules screen shows the `tagline` as headline, "Tests <`skill`>", a **How to play** list (`howTo`) and a **Score**
list (`scoring`); the "?" overlay while playing shows the same. All of it fits the 3:2 stage (768 × 512) without
scrolling.
- **Tagline**: one sentence, also on the home card (2 lines max). It says what the test does and hooks the player to
  try it; the form may vary (an instruction, a question, a challenge), but it never promises something the test
  doesn't do.
- **Skill** ("Tests …"): what is really measured, lowercase start ("reaction speed", "working memory").
- **How to play**, in this order: what you see → what you do → how a run goes (rounds, time limit, what gets harder)
  → lives, fail conditions and what ends it.
- **Score**: what the score is, in its unit, and why that measure when it helps (why the median, why correct − wrong);
  then penalties; then a result stat only when it needs explaining.

Content:
- Accurate to the code, and complete: nothing that changes how you'd play goes unmentioned.
- **Only what affects how you play.** Leave out details that wouldn't change what a player does, and what play makes
  obvious (e.g. "you replay with a new pattern" after a lost life, "a door opens for a moment").
- **Options, not tips**: say what is possible, not how to play well. Exception: where the keyboard is a clear
  advantage, the rules may say so ("keyboard recommended"). That you can also click the on-screen keys or keypad is
  obvious and needn't be said (fine when it fits the sentence).
- No wording that suggests a diagnosis, an IQ or a clinical measure.
- **Trivia** is an allowed exception: always the last line, clearly not a rule ("Fun fact: …"), and short (Flash
  Order).

Wording:
- "click" for mouse input; keys named as keys (Enter, ← / →).
- Same word for the same thing: *round* (not trial), *test* for the whole run ("ends the test"), answer-button labels
  in capitals as on the buttons (SAME / CHANGED, MATCH).
- Prefer one idea per line, about one sentence (a guideline, not a hard rule).
- Score lines start with "Your …".
- Numbers as digits ("3 lives"); run lengths in words ("45 seconds"), short values with units ("0.8 s", "1 s").
- No contractions; real minus `−`.

Lines that come back in many tests use the same phrasing:
- Time limit: "You have 60 seconds: answer as many as you can."
- Rounds: "5 rounds, …"
- Lives: "You have 3 lives: a mistake costs one." (or "a wrong tile costs one")
- End: "Out of lives ends the test." · "One mistake ends the test." · "… ends the test without a score."
- Correct − wrong: "Your correct answers minus wrong answers, so guessing does not pay off."
- Penalty: "Each wrong click adds 1 s."
- Result stat: "The result also shows …"

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
  and shared hooks/helpers in `src/lib/` (`useCountdown`, `useActionKey`, `useLater`, `useAnswerFlash`, `useContinue` (click / Enter / Space to
  go on, ignored for 300 ms), `correctMinusWrong`, `spreadInts`, `shuffle`, `slowdown` for "X ms slower" pairs …). AnswerButtons options take a
  `hint` (a small second key in the corner, e.g. Symbol Code's 1–6); `StartTransition` (the 3-2-1) can run inside a test on its own layout. TileGrid's `instant` turns off the tile fade (a tile flashing twice in a row);
  `OrderGame` takes `lives`.
- **Past reviews** (test audits and other agent reports) are kept in `docs/reviews/<date>-<topic>.md`. Check them
  before reworking a test, so earlier findings and decisions aren't redone.
