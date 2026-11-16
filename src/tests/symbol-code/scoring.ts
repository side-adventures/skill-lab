import { correctMinusWrong } from '../../lib/scoring'
import { shuffle, type Rand } from '../../lib/random'

export const DURATION_MS = 60_000
/** Symbols in a run: few enough to start learning the key within the minute. */
export const SYMBOL_COUNT = 6
/**
 * The answer keys, left to right: S D F · J K L, where the fingers rest on the home row (number keys 1–6 work too, in
 * the same order). The key strip and the pad show these letters.
 */
export const KEYS = ['s', 'd', 'f', 'j', 'k', 'l']
/** Symbols shown in the code row: the current one and the next ones. */
export const ROW_LENGTH = 5
/** The result splits the run into parts of this length (first, middle, last 20 s). */
export const PART_MS = 20_000

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

/** key[i] = the symbol (index into SYMBOLS) for answer key KEYS[i]: SYMBOL_COUNT symbols from the pool, shuffled. */
export const makeKey = (rand: Rand = Math.random) => shuffle(SYMBOLS.map((_, i) => i), rand).slice(0, SYMBOL_COUNT)

/**
 * The next answer (index into KEYS) whose symbol is shown: from a shuffled bag of all SYMBOL_COUNT (so each shows equally
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

/** Points (correct − wrong) in each PART_MS of the run: first, middle and last 20 s. They add up to the score. */
export function partPoints(answers: Answer[], durationMs = DURATION_MS) {
  return Array.from({ length: Math.ceil(durationMs / PART_MS) }, (_, i) =>
    answers
      .filter((a) => a.at >= i * PART_MS && (a.at < (i + 1) * PART_MS || i === Math.ceil(durationMs / PART_MS) - 1))
      .reduce((s, a) => s + (a.correct ? 1 : -1), 0),
  )
}
