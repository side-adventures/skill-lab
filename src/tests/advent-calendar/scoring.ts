import { shuffle, type Rand } from '../../lib/random'

/** 24 doors on a 6 × 4 grid (fits the 3:2 stage). */
export const COLS = 6
export const ROWS = 4
export const COUNT = COLS * ROWS
/** Added to the round's time for each wrong door. */
export const PENALTY_MS = 1000
/** A door stays open this long, then closes again and looks like the others (as in a Schulte table). */
export const OPEN_MS = 400
/**
 * Total distance from door to door in clicking order (in grid cells), so no layout is much quicker to click through
 * than another: random layouts range ~53–70 cells (5–95 %, median ~62); only layouts within ±5 % of the median are used.
 */
export const PATH_MIN = 59
export const PATH_MAX = 65

export type DoorKind = 'plain' | 'star' | 'tree'
export interface Door { kind: DoorKind; n: number }

/**
 * Round 1: doors 1–24, open them in order (Schulte table).
 * Round 2: 12 star doors and 12 tree doors, numbered 1–12 each. Alternate: stars counting up, trees counting down,
 * ★1 → 🌲12 → ★2 → 🌲11 … ★12 → 🌲1 (Gorbov's two-set table, the switching version).
 */
export const ROUNDS: Door[][] = [
  Array.from({ length: COUNT }, (_, i) => ({ kind: 'plain', n: i + 1 })),
  Array.from({ length: COUNT }, (_, i) =>
    i % 2 === 0 ? { kind: 'star', n: i / 2 + 1 } : { kind: 'tree', n: COUNT / 2 - (i - 1) / 2 },
  ),
]

export interface Layout {
  /** Door shown in each cell (row by row). */
  cells: Door[]
  /** Cell index of each door, in clicking order. */
  order: number[]
}

const dist = (a: number, b: number) => Math.hypot((a % COLS) - (b % COLS), Math.floor(a / COLS) - Math.floor(b / COLS))
export const pathLength = (order: number[]) => order.slice(1).reduce((s, c, i) => s + dist(order[i], c), 0)

/** A shuffled layout for a round (doors in clicking order = ROUNDS[round]) with its path in the PATH band. */
export function makeLayout(round: number, rand: Rand = Math.random): Layout {
  const doors = ROUNDS[round]
  for (;;) {
    const order = shuffle(Array.from({ length: COUNT }, (_, i) => i), rand) // order[k] = cell of the k-th door
    const len = pathLength(order)
    if (len < PATH_MIN || len > PATH_MAX) continue
    const cells: Door[] = Array(COUNT)
    order.forEach((cell, k) => (cells[cell] = doors[k]))
    return { cells, order }
  }
}

export interface RoundResult { ms: number; wrong: number }

export const roundTime = (r: RoundResult) => r.ms + r.wrong * PENALTY_MS

/** Score: total time of both rounds, penalties included, whole ms. */
export const calendarScore = (rounds: RoundResult[]) => Math.round(rounds.reduce((s, r) => s + roundTime(r), 0))

/** Extra time per door when switching (round 2 vs round 1). */
export const switchCostPerDoor = (plain: RoundResult, mixed: RoundResult) => (roundTime(mixed) - roundTime(plain)) / COUNT
