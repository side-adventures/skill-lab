import { mean, shuffle, type Rand } from '../../lib/random'

export const ROUNDS = 5
/** Track widths per second, one per round (shuffled): slow to fast. */
export const SPEEDS = [0.35, 0.5, 0.65, 0.8, 1.0]
export const TARGET_MIN = 0.45
export const TARGET_MAX = 0.9
/** The bar needs at least this long to reach the line, so a fast bar never has a close line. */
export const MIN_TRAVEL_S = 0.8

export interface RoundSetup { speed: number; target: number }

export function makeRounds(rand: Rand = Math.random): RoundSetup[] {
  return shuffle(SPEEDS, rand).map((speed) => {
    const lo = Math.max(TARGET_MIN, speed * MIN_TRAVEL_S)
    return { speed, target: lo + rand() * (TARGET_MAX - lo) }
  })
}

/** Signed timing error in ms: negative = stopped early, positive = late. */
export const errorMs = (stopPos: number, r: RoundSetup) => ((stopPos - r.target) / r.speed) * 1000

export const scoreRounds = (errors: number[]) => Math.round(mean(errors.map(Math.abs)))

export const errorLabel = (ms: number) => `${ms < 0 ? '−' : '+'}${Math.abs(Math.round(ms))} ms`
