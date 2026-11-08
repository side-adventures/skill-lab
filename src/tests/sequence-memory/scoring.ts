import { randInt, type Rand } from '../../lib/random'

export const GRID = 3
export const STEP_ON_MS = 450
export const STEP_GAP_MS = 200

/** Adds one random tile, never the same as the previous step (so every flash is visible). */
export function extend(seq: number[], rand?: Rand): number[] {
  let next: number
  do next = randInt(0, GRID * GRID - 1, rand)
  while (next === seq[seq.length - 1])
  return [...seq, next]
}
