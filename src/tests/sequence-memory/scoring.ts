import { randInt, type Rand } from '../../lib/random'

export const GRID = 3
export const STEP_ON_MS = 450
export const STEP_GAP_MS = 200
/** From this length on, the sequence plays faster so long runs don't drag (0.5 s instead of 0.65 s per step). */
export const FAST_FROM_LENGTH = 8
export const FAST_STEP_ON_MS = 350
export const FAST_STEP_GAP_MS = 150

/** How long each step is lit, and the pause after it, for a sequence of this length. */
export const stepTiming = (length: number) =>
  length >= FAST_FROM_LENGTH ? { on: FAST_STEP_ON_MS, gap: FAST_STEP_GAP_MS } : { on: STEP_ON_MS, gap: STEP_GAP_MS }

/** Adds one random tile, never the same as the previous step (so every flash is visible). */
export function extend(seq: number[], rand?: Rand): number[] {
  let next: number
  do next = randInt(0, GRID * GRID - 1, rand)
  while (next === seq[seq.length - 1])
  return [...seq, next]
}
