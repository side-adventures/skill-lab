import { shuffle, type Rand } from '../../lib/random'

export const GREENS = 40
export const REDS = 10
export const WINDOW_MS = 800 // how long a stimulus stays up
export const PENALTY_MS = 100
export const MIN_WAIT_MS = 700
export const MAX_WAIT_MS = 1500

/** true = green (tap), false = red (don't). First two are always green. */
export function makeTrials(rand?: Rand): boolean[] {
  const rest = shuffle([...Array(GREENS - 2).fill(true), ...Array(REDS).fill(false)], rand)
  return [true, true, ...rest]
}

export interface Stats { rts: number[]; misses: number; falseTaps: number }

/** Total of green reaction times; a miss counts the full window; each mistake adds a penalty. */
export const totalMs = ({ rts, misses, falseTaps }: Stats) =>
  Math.round(rts.reduce((a, b) => a + b, 0) + misses * WINDOW_MS + (misses + falseTaps) * PENALTY_MS)
