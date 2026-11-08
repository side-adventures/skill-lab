import type { Rand } from '../../lib/random'

export const DURATION_MS = 60_000
export const TARGET_PX = 52
/** New target is at least this far (in area fractions) from the previous one. */
export const MIN_JUMP = 0.3

export interface Spot { x: number; y: number } // 0..1 within the usable area

export function nextSpot(prev: Spot | undefined, rand: Rand = Math.random): Spot {
  for (;;) {
    const s = { x: rand(), y: rand() }
    if (!prev || Math.hypot(s.x - prev.x, s.y - prev.y) >= MIN_JUMP) return s
  }
}
