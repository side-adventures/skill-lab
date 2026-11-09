import { randInt, shuffle, type Rand } from '../../lib/random'

/** 4 groups of 7 (5 green + 2 red each), plus 1 green and 1 red inserted anywhere: 21 green, 9 red (30). */
export const GROUPS = 4
export const GROUP_GREENS = 5
export const GROUP_REDS = 2
export const GREENS = GROUPS * GROUP_GREENS + 1
export const REDS = GROUPS * GROUP_REDS + 1
export const WINDOW_MS = 800 // how long a stimulus stays up
export const PENALTY_MS = 100
export const MIN_WAIT_MS = 700
export const MAX_WAIT_MS = 1500

/**
 * true = green (tap), false = red (don't). Each group of 7 is shuffled on its own, then one extra
 * green and one extra red go in at random spots. Redrawn until the first two are green and no two
 * reds are next to each other.
 */
export function makeTrials(rand: Rand = Math.random): boolean[] {
  for (;;) {
    const out: boolean[] = []
    for (let g = 0; g < GROUPS; g++)
      out.push(...shuffle([...Array(GROUP_GREENS).fill(true), ...Array(GROUP_REDS).fill(false)], rand))
    out.splice(randInt(0, out.length, rand), 0, true)
    out.splice(randInt(0, out.length, rand), 0, false)
    const ok = out[0] && out[1] && !out.some((g, i) => !g && out[i + 1] === false)
    if (ok) return out
  }
}

/** Longest run of consecutive greens. */
export const longestGreenRun = (t: boolean[]) =>
  t.reduce<[number, number]>(([best, cur], g) => (g ? [Math.max(best, cur + 1), cur + 1] : [best, 0]), [0, 0])[0]

export interface Stats { rts: number[]; misses: number; falseTaps: number }

/** Total of green reaction times; a miss counts the full window; each mistake adds a penalty. */
export const totalMs = ({ rts, misses, falseTaps }: Stats) =>
  Math.round(rts.reduce((a, b) => a + b, 0) + misses * WINDOW_MS + (misses + falseTaps) * PENALTY_MS)
