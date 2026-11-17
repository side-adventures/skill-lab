import { shuffle, type Rand } from '../../lib/random'
import { median } from '../reaction/scoring'

/** Items are placed in a GRID × GRID grid of cells, one per cell, jittered inside it. */
export const GRID = 7
/** Item size as a fraction of a cell. */
export const ITEM = 0.62
/** How many shapes each round shows; every size comes ROUNDS_PER_SIZE times, mixed. */
export const SET_SIZES = [16, 24, 36] as const
export const ROUNDS_PER_SIZE = 5
/** Added to the round's time for each wrong click. */
export const PENALTY_MS = 1000
/** The blank with a "+" before each round. */
export const PAUSE_MS = 600

export interface Item {
  x: number // center, board fraction
  y: number
  rot: 0 | 90 | 180 | 270
  target: boolean
}
export interface Round { size: number; items: Item[] }

const ROTS = [0, 90, 180, 270] as const

/** Quadrant (0–3) of a cell; -1 for the middle row and column (they belong to no quadrant, never the target). */
function quadrantOf(cell: number) {
  const mid = (GRID - 1) / 2
  const row = Math.floor(cell / GRID)
  const col = cell % GRID
  if (row === mid || col === mid) return -1
  return (row < mid ? 0 : 2) + (col < mid ? 0 : 1)
}

/**
 * The whole run: every set size ROUNDS_PER_SIZE times in random order, and the target spread over the four
 * quadrants of the board as evenly as the round count allows.
 */
export function makeRounds(rand: Rand = Math.random): Round[] {
  const sizes = shuffle(SET_SIZES.flatMap((s) => Array<number>(ROUNDS_PER_SIZE).fill(s)), rand)
  const quads = shuffle(Array.from({ length: sizes.length }, (_, i) => i % 4), rand)
  return sizes.map((size, r) => {
    const cells = shuffle(Array.from({ length: GRID * GRID }, (_, i) => i), rand)
    const t = cells.findIndex((c) => quadrantOf(c) === quads[r])
    const targetCell = cells[t]
    const others = cells.filter((_, i) => i !== t).slice(0, size - 1)
    const jitter = (1 - ITEM) / 2
    const place = (cell: number, target: boolean): Item => ({
      x: ((cell % GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
      y: (Math.floor(cell / GRID) + 0.5 + (rand() * 2 - 1) * jitter) / GRID,
      rot: ROTS[Math.floor(rand() * 4)],
      target,
    })
    return { size, items: shuffle([place(targetCell, true), ...others.map((c) => place(c, false))], rand) }
  })
}

export interface RoundResult { size: number; ms: number; wrong: number }

export const roundTime = (r: RoundResult) => r.ms + r.wrong * PENALTY_MS

/** Score: total time of all rounds, penalties included, whole ms. */
export const searchScore = (rounds: RoundResult[]) => Math.round(rounds.reduce((s, r) => s + roundTime(r), 0))

/**
 * Median time per set size (penalties included, as in the score), and the extra ms per added shape: the least-squares
 * slope of search time (without penalties) against the number of shapes, over all rounds (steadier than two medians).
 */
export function bySize(rounds: RoundResult[]) {
  const rows = SET_SIZES.map((size) => {
    const rs = rounds.filter((r) => r.size === size)
    return { size, median: rs.length ? median(rs.map(roundTime)) : undefined, wrong: rs.reduce((s, r) => s + r.wrong, 0) }
  })
  const xs = rounds.map((r) => r.size)
  const ys = rounds.map((r) => r.ms) // search time only: a 1 s penalty would distort the slope
  const mx = xs.reduce((a, b) => a + b, 0) / (xs.length || 1)
  const my = ys.reduce((a, b) => a + b, 0) / (ys.length || 1)
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0)
  const perItem = sxx > 0 ? xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0) / sxx : undefined
  return { rows, perItem }
}
