import { mean, randInt, round1, shuffle, type Rand } from '../../lib/random'

export const ROUNDS = 5
export const MIN_TARGET_S = 3
export const MAX_TARGET_S = 10

/** Each game always has at least one short, one medium and one long target. */
export const BANDS: [number, number][] = [[3, 4], [5, 7], [8, 10]]

/** Distinct whole-second targets: one per band, the rest anywhere in range; shuffled. */
export function makeTargets(rand?: Rand): number[] {
  const picked = new Set(BANDS.map(([lo, hi]) => randInt(lo, hi, rand)))
  while (picked.size < ROUNDS) picked.add(randInt(MIN_TARGET_S, MAX_TARGET_S, rand))
  return shuffle([...picked], rand)
}

export const errorPct = (targetS: number, actualS: number) => (Math.abs(actualS - targetS) / targetS) * 100

export const scoreRounds = (rounds: { target: number; actual: number }[]) =>
  round1(mean(rounds.map((r) => errorPct(r.target, r.actual))))

/** "-10.0 %" (too early) / "+4.2 %" (too late). */
export const signedErrorLabel = (targetS: number, actualS: number) =>
  `${actualS < targetS ? '−' : '+'}${errorPct(targetS, actualS).toFixed(1)} %`
