# Test icons

One SVG per test, named after the test id in `src/tests/registry.ts`.

Style: one color (`currentColor`), with light parts drawn at reduced opacity (about 0.2–0.3) and no
other colors. 48 × 48 viewBox. Digits are drawn as paths, not text, so they look the same everywhere.
They must stay readable at 18 px.

Mask ids must be unique across files (`<test-id>-…`), because the icons may be inlined on one page.

Not wired into the UI yet. All 20 tests have a first version; tap-speed is a placeholder, the 15 newest (everything except aim-trainer, tap-speed, visual-memory, number-order, flash-order) still need review.
