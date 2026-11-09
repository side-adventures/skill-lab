import type { Rand } from '../../lib/random'

export const DURATION_MS = 30_000
export const TARGET_PX = 56
/** Inner bullseye diameter as a fraction of the target: a hit inside it is worth 2 points. */
export const CENTER_FRACTION = 0.5
/** New target is at least this far (in area fractions) from the previous one. */
export const MIN_JUMP = 0.3

export interface Spot { x: number; y: number } // 0..1 within the usable area

export function nextSpot(prev: Spot | undefined, rand: Rand = Math.random): Spot {
  for (;;) {
    const s = { x: rand(), y: rand() }
    if (!prev || Math.hypot(s.x - prev.x, s.y - prev.y) >= MIN_JUMP) return s
  }
}

/** 2 points inside the bullseye, 1 on the outer ring (dx, dy: offset from the target center in px). */
export const hitPoints = (dx: number, dy: number, diameter = TARGET_PX) =>
  Math.hypot(dx, dy) <= (diameter * CENTER_FRACTION) / 2 ? 2 : 1
