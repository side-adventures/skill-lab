import { shuffle, type Rand } from '../../lib/random'
import { median } from '../reaction/scoring'

/** Items are placed in a GRID × GRID grid of cells, one per cell, jittered inside it. */
export const GRID = 6
/** Item size as a fraction of a cell. */
export const ITEM = 0.62
/** How many shapes each round shows; every size comes ROUNDS_PER_SIZE times, mixed. */
export const SET_SIZES = [8, 16, 32] as const
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

/** Quadrant (0–3) of a cell. */
const quadrantOf = (cell: number) => (Math.floor(cell / GRID) < GRID / 2 ? 0 : 2) + ((cell % GRID) < GRID / 2 ? 0 : 1)

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

/** Score: median round time (with penalties), whole ms. */
export const searchScore = (rounds: RoundResult[]) => Math.round(median(rounds.map(roundTime)))

/** Median time per set size, and the extra ms per added shape (slope between the smallest and largest size). */
export function bySize(rounds: RoundResult[]) {
  const rows = SET_SIZES.map((size) => {
    const rs = rounds.filter((r) => r.size === size)
    return { size, median: rs.length ? median(rs.map(roundTime)) : undefined, wrong: rs.reduce((s, r) => s + r.wrong, 0) }
  })
  const lo = rows[0].median
  const hi = rows[rows.length - 1].median
  const perItem = lo !== undefined && hi !== undefined ? (hi - lo) / (SET_SIZES[SET_SIZES.length - 1] - SET_SIZES[0]) : undefined
  return { rows, perItem }
}
