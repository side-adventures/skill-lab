import { correctMinusWrong } from '../../lib/scoring'
import { shuffle, type Rand } from '../../lib/random'

export const DURATION_MS = 60_000

/**
 * The 9 symbols (24 × 24 paths, drawn as strokes). Simple, clearly different shapes, none of them a digit or
 * letter. Which digit each one gets is shuffled every run.
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

/** symbolOf[d - 1] = the symbol index for digit d. */
export const makeKey = (rand: Rand = Math.random) => shuffle(SYMBOLS.map((_, i) => i), rand)

/**
 * The next symbol to show: drawn from a shuffled bag of all 9 (so each shows equally often), never the same one
 * twice in a row (also across bags).
 */
export function makeSymbolSource(rand: Rand = Math.random) {
  let bag: number[] = []
  let prev = -1
  return () => {
    if (!bag.length) {
      bag = shuffle(SYMBOLS.map((_, i) => i), rand)
      if (bag[0] === prev) bag.push(bag.shift()!)
    }
    prev = bag.shift()!
    return prev
  }
}

export const symbolScore = correctMinusWrong
