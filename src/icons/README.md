# Test icons

One SVG per test, named after the test id in `src/tests/registry.ts`.

Style: one color (`currentColor`), with light parts drawn at reduced opacity (about 0.2–0.3) and no
other colors. 48 × 48 viewBox. Digits are drawn as paths, not text, so they look the same everywhere.
They must stay readable at 18 px.

Mask ids must be unique across files (`<test-id>-…`), because the icons may be inlined on one page.

Shown via `components/TestIcon.tsx` (home page cards, test header); it falls back to the registry emoji if a file is missing. The emoji in the registry is still used in shared text messages. `src/tests/icons.test.ts` checks that every test has an icon, that only `currentColor` is used (black/white only inside masks), and that mask ids are unique.

Tap Speed's icon is a placeholder for now (TODO in `docs/BACKLOG.md`).
