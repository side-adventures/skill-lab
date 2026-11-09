import { randInt, type Rand } from '../../lib/random'

export const GREENS = 24
export const REDS = 6
/** Trials come in blocks with exactly one red each, so greens never run on for long. */
export const BLOCK = (GREENS + REDS) / REDS
export const WINDOW_MS = 800 // how long a stimulus stays up
export const PENALTY_MS = 100
export const MIN_WAIT_MS = 700
export const MAX_WAIT_MS = 1500

/**
 * true = green (tap), false = red (don't). One red per block of 5 at a random spot,
 * never in the first two trials and never two reds in a row.
 * Longest possible green streak: 2 × (BLOCK − 1) = 8.
 */
export function makeTrials(rand: Rand = Math.random): boolean[] {
  const out: boolean[] = []
  for (let b = 0; b < REDS; b++) {
    const prevRedLast = out.length > 0 && !out[out.length - 1]
    const red = randInt(b === 0 ? 2 : prevRedLast ? 1 : 0, BLOCK - 1, rand)
    for (let k = 0; k < BLOCK; k++) out.push(k !== red)
  }
  return out
}

/** Longest run of consecutive greens. */
export const longestGreenRun = (t: boolean[]) =>
  t.reduce<[number, number]>(([best, cur], g) => (g ? [Math.max(best, cur + 1), cur + 1] : [best, 0]), [0, 0])[0]

export interface Stats { rts: number[]; misses: number; falseTaps: number }

/** Total of green reaction times; a miss counts the full window; each mistake adds a penalty. */
export const totalMs = ({ rts, misses, falseTaps }: Stats) =>
  Math.round(rts.reduce((a, b) => a + b, 0) + misses * WINDOW_MS + (misses + falseTaps) * PENALTY_MS)
