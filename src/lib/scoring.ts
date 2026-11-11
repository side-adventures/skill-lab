/** Scoring rules shared by several tests (pure functions, no UI). */

/** For answer tests where guessing must not pay off: every wrong answer cancels a correct one. */
export const correctMinusWrong = (correct: number, wrong: number) => correct - wrong
