import { shuffle, type Rand } from '../../lib/random'

export const COLS = 6
export const ROWS = 5
export const START_TILES = 5

/** Number Order: 15 s to memorize, one more tile per cleared round, 2 lives (one retry per run). */
export const NUMBER_ORDER_MS = 15_000
export const NUMBER_ORDER_LIVES = 2
export const numberOrderTiles = (round: number) => START_TILES + round

/** Flash Order: always 5 tiles, memorize time starts at 1 s and shrinks 10 % per cleared round, 5 lives. */
export const FLASH_START_MS = 1000
export const FLASH_ORDER_LIVES = 5
export const flashOrderMs = (round: number) => Math.round(FLASH_START_MS * 0.9 ** round)

/** Random distinct grid cells; index i holds number i + 1. */
export const placeTiles = (count: number, rand?: Rand) =>
  shuffle([...Array(COLS * ROWS).keys()], rand).slice(0, count)

/** Chip labels for a list of rounds where a round can come twice (after a lost life): "Round 3", "Round 3 again". */
export const roundLabels = (rounds: number[]) =>
  rounds.map((r, i) => `Round ${r + 1}${rounds.slice(0, i).includes(r) ? ' again' : ''}`)
