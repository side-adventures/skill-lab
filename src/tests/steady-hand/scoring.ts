import { round1, type Rand } from '../../lib/random'

export const DURATION_MS = 30_000
export const RAMP_IN_MS = 2_000
/** The run in three parts for the result chips (the circle is fastest and smallest in the last one). */
export const PARTS = ['First 10 s', 'Middle 10 s', 'Last 10 s']
export const PART_MS = DURATION_MS / PARTS.length
export const START_RADIUS = 0.14 // fraction of the smaller side of the play area
export const END_RADIUS = 0.055

export type Phases = [number, number, number, number]
export const randomPhases = (rand: Rand = Math.random): Phases =>
  [0, 0, 0, 0].map(() => rand() * Math.PI * 2) as Phases

/** Smooth wandering path in [-1, 1]²; `t` is accumulated (speed-scaled) seconds. */
export function pathAt(t: number, p: Phases) {
  return {
    x: 0.6 * Math.sin(t * 0.9 + p[0]) + 0.4 * Math.sin(t * 1.7 + p[1]),
    y: 0.6 * Math.sin(t * 0.8 + p[2]) + 0.4 * Math.sin(t * 1.45 + p[3]),
  }
}

/** progress 0..1 → radius fraction and speed multiplier. */
export const radiusAt = (progress: number) => START_RADIUS + (END_RADIUS - START_RADIUS) * progress
export const speedAt = (progress: number) => 1 + 0.8 * progress

export const scoreInside = (insideMs: number, totalMs = DURATION_MS) => round1(Math.min(100, (insideMs / totalMs) * 100))
