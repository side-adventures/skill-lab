import { mean, round1, shuffle, type Rand } from '../../lib/random'

export const ROUNDS = 5
export const MIN_TARGET_S = 3
export const MAX_TARGET_S = 10

/** Distinct whole-second targets. */
export function makeTargets(rand?: Rand): number[] {
  const all = Array.from({ length: MAX_TARGET_S - MIN_TARGET_S + 1 }, (_, i) => MIN_TARGET_S + i)
  return shuffle(all, rand).slice(0, ROUNDS)
}

export const errorPct = (targetS: number, actualS: number) => (Math.abs(actualS - targetS) / targetS) * 100

export const scoreRounds = (rounds: { target: number; actual: number }[]) =>
  round1(mean(rounds.map((r) => errorPct(r.target, r.actual))))
