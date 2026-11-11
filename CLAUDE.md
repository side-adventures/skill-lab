# Skill Lab — notes for Claude

Static skill-test website (reaction, memory, focus…). Product spec: `docs/SPEC.md` — keep it in sync when scoring or rules change.

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
1. Create `src/tests/<id>/` with:
   - `<Name>Test.tsx` — default export, props `TestComponentProps` (`onFinish({ score, details })`).
     Only the play phase: intro, countdown, result, best score, sharing are handled by `TestRunner` / `GameFrame`.
     A run that can't produce a score calls `onFinish({ score: 0, failed: 'why' })` — shown, never saved.
     Build it from the shared pieces in `components/game/`: pick one layout (`FullLayout`, `PromptLayout`,
     `SquareLayout`, `SquarePanelLayout`), render exactly one `<GameInfo left middle right timer>` for the info
     row, and use `AnswerButtons`, `TileGrid`, `RoundResult`, `Lives`, `useAnswerFlash`, `useLater`,
     `END_MOMENT_MS` instead of hand-made versions. Never size anything by the viewport.
   - `scoring.ts` — pure logic (scoring, generation of rounds) + `scoring.test.ts`.
2. Add an icon `src/icons/<id>.svg` (style rules in `src/icons/README.md`; `icons.test.ts` fails without one).
3. Add an entry in `src/tests/registry.ts` with `Component: lazy(() => import('./<id>/<Name>Test'))`,
   a `category` (one of `CATEGORIES`; its color comes from `CATEGORY_COLORS` in `types.ts`), a `start` mode
   (`countdown` | `quick` | `none`, see `StartMode` in `types.ts`), and the rules:
   `tagline` (one sentence, also on the home card), `skill` ("Tests …"), `howTo` and `scoring` (short lines,
   as many as needed; say "click", keep it accurate to the code). Check the rules fit the 3:2 stage (768 × 512).
4. Use `className="play-area"` on interactive surfaces (no tap-zoom / text selection); use `onPointerDown`
   for timing-sensitive input; clear timers / rAF in effect cleanups.
5. Verify by actually playing it in the browser preview (desktop viewport), not just by building.

## Subagents (`.claude/agents/`)
- `scoring-reviewer` — after adding a test or changing scoring / rules / round generation: hunts loopholes,
  unfair random setups and missing `scoreVersion` bumps; proves findings with unit tests, never edits app code.
- `play-tester` — after building or changing a test and before merging into `main`: plays it on localhost
  (desktop, dark theme) and reports bugs; never edits files.
- Both report back; the main session decides and applies fixes. They can run in parallel.

## Conventions
- **While in development: don't bump `scoreVersion`** when reworking a test; old scores don't matter yet.
  Later (once there are real users), a change that makes old scores incomparable bumps that test's
  `scoreVersion` in the registry (stores results under a new key, see `storageId` in `types.ts`).
- Keep components small; shared UI goes in `src/components/` (game frame + layouts + AnswerButtons / TileGrid / RoundResult / GameInfo in `components/game/`, NumberPad, Button, ShareButton, TestIcon, CategoryChips, AttemptGraph, ComingSoonButton)
  and shared hooks/helpers in `src/lib/` (`useCountdown`, `useActionKey`, `useLater`, `useAnswerFlash`, `correctMinusWrong`, `spreadInts`, `shuffle` …).
