import { mean, shuffle, type Rand } from '../../lib/random'

export const ROUNDS = 5
/** Track widths per second, one per round (shuffled): slow to fast. */
export const SPEEDS = [0.35, 0.5, 0.65, 0.8, 1.0]
export const TARGET_MIN = 0.45
export const TARGET_MAX = 0.85

export interface RoundSetup { speed: number; target: number }

export function makeRounds(rand: Rand = Math.random): RoundSetup[] {
  return shuffle(SPEEDS, rand).map((speed) => ({ speed, target: TARGET_MIN + rand() * (TARGET_MAX - TARGET_MIN) }))
}

/** Signed timing error in ms: negative = stopped early, positive = late. */
export const errorMs = (stopPos: number, r: RoundSetup) => ((stopPos - r.target) / r.speed) * 1000

export const scoreRounds = (errors: number[]) => Math.round(mean(errors.map(Math.abs)))

export const errorLabel = (ms: number) => `${ms < 0 ? '−' : '+'}${Math.abs(Math.round(ms))} ms`
