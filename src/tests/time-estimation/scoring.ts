import { tendency } from '../../lib/resultFormat'
import type { ResultDetails } from '../types'
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
export const signedErrorLabel = (targetS: number, actualS: number) => {
  const e = errorPct(targetS, actualS).toFixed(1)
  return e === '0.0' ? '±0.0 %' : `${actualS < targetS ? '−' : '+'}${e} %`
}

/** Result screen stats: closest / furthest round, which way you tend to be off, and each round. */
export function resultDetails(rounds: { target: number; actual: number }[]): ResultDetails {
  const errors = rounds.map((r) => errorPct(r.target, r.actual))
  const signed = rounds.map((r) => ((r.actual - r.target) / r.target) * 100)
  return {
    stats: [
      { label: 'Closest', value: `${Math.min(...errors).toFixed(1)} % off` },
      { label: 'Furthest off', value: `${Math.max(...errors).toFixed(1)} %` },
      { label: 'Tendency', value: tendency(mean(signed), ' %', 'too early', 'too late') },
    ],
    chips: {
      title: 'Target · your time',
      items: rounds.map((r) => ({ label: `${r.target} s`, value: `${r.actual.toFixed(2)} s · ${signedErrorLabel(r.target, r.actual)}` })),
    },
  }
}
