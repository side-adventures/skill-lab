# Skill Lab — notes for Claude

Static skill-test website (reaction, memory, focus…). Product spec: `docs/SPEC.md` — keep it in sync when scoring or rules change.

## Hard rules
- **Frontend only.** No backend, no network/API calls. Deployed to GitHub Pages from `dist/`.
- **Current focus: desktop + dark theme only.** The site is always dark (`class="dark"` on `<html>` in
  `index.html`, no toggle). Desktop with mouse is the target; keyboard is a bonus, never required.
  Mobile / touch and a light theme may come back later, so don't break them needlessly: keep using
  `dark:` variants for dark colors, `onPointerDown` for input, and avoid fixed desktop-only widths, but
  don't spend effort testing or polishing them.
- Scores are local only (`src/lib/storage.ts`, localStorage, always wrapped in try/catch).

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
     Only the play phase: intro, result, best score, sharing are handled by `components/TestRunner.tsx`.
     A run that can't produce a score calls `onFinish({ score: 0, failed: 'why' })` — shown, never saved.
   - `scoring.ts` — pure logic (scoring, generation of rounds) + `scoring.test.ts`.
2. Add an icon `src/icons/<id>.svg` (style rules in `src/icons/README.md`; `icons.test.ts` fails without one).
3. Add an entry in `src/tests/registry.ts` with `Component: lazy(() => import('./<id>/<Name>Test'))`
   and a `category` (home page groups by `CATEGORIES` in `types.ts`). Entries without `Component` show as "Soon".
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
- Never change a test's scoring in a way that makes old saved scores incomparable without bumping that
  test's `scoreVersion` in the registry (stores results under a new key, see `storageId` in `types.ts`).
- Keep components small; shared UI goes in `src/components/` (GetReady, TimerBar, DrainBar, NumberPad, Button, ShareButton, `boardBg` for grid boards)
  and shared hooks/helpers in `src/lib/` (`useCountdown`, `useActionKey`, `spreadInts`, `shuffle` …).
