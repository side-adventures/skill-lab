# Skill Lab — notes for Claude

Static skill-test website (reaction, memory, focus…). Product spec: `docs/SPEC.md` — keep it in sync when scoring or rules change.

## Hard rules
- **Frontend only.** No backend, no network/API calls. Deployed to GitHub Pages from `dist/`.
- Every test must work with **mouse and touch**; keyboard is a bonus, never required.
- Must work at phone width (375px) and in light + dark mode.
- Scores are local only (`src/lib/storage.ts`, localStorage, always wrapped in try/catch).

## Stack
Vite + React 19 + TypeScript + Tailwind v4 (`@tailwindcss/vite`), react-router `HashRouter`
(GitHub Pages has no SPA fallback), `base: './'` in vite config. Vitest for unit tests, oxlint for lint.

## Commands
- `npm run dev` — dev server (also `.claude/launch.json` in the parent folder: config `skill-lab`, port 5173)
- `npm test` · `npm run lint` · `npm run build` — all three must pass before committing.

## Adding a test
1. Create `src/tests/<id>/` with:
   - `<Name>Test.tsx` — default export, props `TestComponentProps` (`onFinish({ score, details })`).
     Only the play phase: intro, result, best score, sharing are handled by `components/TestRunner.tsx`.
     A run that can't produce a score calls `onFinish({ score: 0, failed: 'why' })` — shown, never saved.
   - `scoring.ts` — pure logic (scoring, generation of rounds) + `scoring.test.ts`.
2. Add an entry in `src/tests/registry.ts` with `Component: lazy(() => import('./<id>/<Name>Test'))`
   and a `category` (home page groups by `CATEGORIES` in `types.ts`). Entries without `Component` show as "Soon".
3. Use `className="play-area"` on interactive surfaces (no tap-zoom / text selection); use `onPointerDown`
   for timing-sensitive input; clear timers / rAF in effect cleanups.
4. Verify by actually playing it in the browser preview (desktop + mobile viewport), not just by building.

## Conventions
- Never change a test's scoring in a way that makes old saved scores incomparable without bumping the
  storage key version.
- Keep components small; shared UI goes in `src/components/` (GetReady, TimerBar, DrainBar, NumberPad, Button)
  and shared hooks/helpers in `src/lib/` (`useCountdown`, `useActionKey`, `spreadInts`, `shuffle` …).
