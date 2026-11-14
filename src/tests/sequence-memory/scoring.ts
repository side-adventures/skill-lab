import { randInt, type Rand } from '../../lib/random'

export const GRID = 3
/** Each step is lit this long, then a short dark gap (also between two flashes of the same tile). */
export const STEP_ON_MS = 350
export const STEP_GAP_MS = 150

/** Adds one random tile. The same tile may come twice in a row (the dark gap shows it as two flashes). */
export function extend(seq: number[], rand?: Rand): number[] {
  return [...seq, randInt(0, GRID * GRID - 1, rand)]
}
