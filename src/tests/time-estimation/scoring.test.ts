import { describe, expect, it } from 'vitest'
import { ROUNDS, errorPct, makeTargets, scoreRounds } from './scoring'

describe('time estimation', () => {
  it('makes distinct targets in range', () => {
    const t = makeTargets()
    expect(t).toHaveLength(ROUNDS)
    expect(new Set(t).size).toBe(ROUNDS)
    t.forEach((s) => expect(s >= 3 && s <= 10).toBe(true))
  })
  it('computes symmetric relative error', () => {
    expect(errorPct(10, 9)).toBeCloseTo(10)
    expect(errorPct(10, 11)).toBeCloseTo(10)
  })
  it('averages to one decimal', () => {
    expect(scoreRounds([{ target: 5, actual: 5.5 }, { target: 4, actual: 4 }])).toBe(5)
  })
})
