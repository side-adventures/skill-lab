import { shuffle, type Rand } from '../../lib/random'

/** Lives for the whole run: a wrong click fails the level and costs one. */
export const LIVES = 3
export const SHOW_MS = 1000

export function gridSize(level: number) {
  if (level <= 2) return 3
  if (level <= 5) return 4
  if (level <= 9) return 5
  if (level <= 14) return 6
  return 7
}

export function tileCount(level: number) {
  const cells = gridSize(level) ** 2
  return Math.min(level + 2, Math.floor(cells * 0.6))
}

/** Random distinct cell indices for a level. */
export function pickTiles(level: number, rand?: Rand): number[] {
  const cells = gridSize(level) ** 2
  return shuffle([...Array(cells).keys()], rand).slice(0, tileCount(level))
}
