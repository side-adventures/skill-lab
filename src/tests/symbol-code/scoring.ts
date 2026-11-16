import { correctMinusWrong } from '../../lib/scoring'
import { shuffle, type Rand } from '../../lib/random'

export const DURATION_MS = 60_000
/** Symbols in a run (numbers 1–6): few enough to start learning the key within the minute. */
export const SYMBOL_COUNT = 6
/** Symbols shown in the code row: the current one and the next ones. */
export const ROW_LENGTH = 5
/** The learning stat compares the first and the last this many ms. */
export const LEARN_WINDOW_MS = 20_000

/**
 * The symbol pool (24 × 24 paths, drawn as strokes): simple, clearly different shapes, none a digit or letter.
 * Each run uses SYMBOL_COUNT of them.
 */
export const SYMBOLS: string[] = [
  'M12 4L21 20H3Z', // triangle
  'M5 5h14v14H5Z', // square
  'M12 3a9 9 0 1 0 0.01 0', // circle
  'M5 5l14 14M19 5L5 19', // cross
  'M12 3l9 9-9 9-9-9Z', // diamond
  'M4 16a8 8 0 0 1 16 0Z', // half circle
  'M3 12c3-6 6-6 9 0s6 6 9 0', // wave
  'M12 3v18M3 12h18', // plus
  'M5 4v16h14', // corner
]

/** key[d - 1] = the symbol (index into SYMBOLS) for number d: SYMBOL_COUNT symbols from the pool, shuffled. */
export const makeKey = (rand: Rand = Math.random) => shuffle(SYMBOLS.map((_, i) => i), rand).slice(0, SYMBOL_COUNT)

/**
 * The next number whose symbol is shown (0-based): from a shuffled bag of all SYMBOL_COUNT (so each shows equally
 * often), never the same one twice in a row (also across bags).
 */
export function makeSymbolSource(rand: Rand = Math.random) {
  let bag: number[] = []
  let prev = -1
  return () => {
    if (!bag.length) {
      bag = shuffle(Array.from({ length: SYMBOL_COUNT }, (_, i) => i), rand)
      if (bag[0] === prev) bag.push(bag.shift()!)
    }
    prev = bag.shift()!
    return prev
  }
}

export const symbolScore = correctMinusWrong

/** One answer: when it was given (ms since the start) and whether it was right. */
export interface Answer { at: number; correct: boolean }

/**
 * How much faster you got: correct answers in the last LEARN_WINDOW_MS vs the first, as a fraction (+0.25 = 25 % more).
 * Undefined with no correct answers in the first window.
 */
export function learningGain(answers: Answer[], durationMs = DURATION_MS) {
  const first = answers.filter((a) => a.correct && a.at < LEARN_WINDOW_MS).length
  const last = answers.filter((a) => a.correct && a.at >= durationMs - LEARN_WINDOW_MS).length
  return first ? last / first - 1 : undefined
}
