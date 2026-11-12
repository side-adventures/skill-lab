import { describe, expect, it } from 'vitest'
import { ROUNDS, errorPct, makeTargets, scoreRounds, signedErrorLabel } from './scoring'

describe('time estimation', () => {
  it('makes distinct, spread-out targets in range', () => {
    for (let i = 0; i < 500; i++) {
      const t = makeTargets()
      expect(t).toHaveLength(ROUNDS)
      expect(new Set(t).size).toBe(ROUNDS)
      t.forEach((s) => expect(s >= 3 && s <= 10).toBe(true))
      expect(t.some((s) => s <= 4)).toBe(true) // short
      expect(t.some((s) => s >= 5 && s <= 7)).toBe(true) // medium
      expect(t.some((s) => s >= 8)).toBe(true) // long
    }
  })
  it('labels signed error', () => {
    expect(signedErrorLabel(10, 9)).toBe('−10.0 %')
    expect(signedErrorLabel(5, 5.5)).toBe('+10.0 %')
  })
  it('computes symmetric relative error', () => {
    expect(errorPct(10, 9)).toBeCloseTo(10)
    expect(errorPct(10, 11)).toBeCloseTo(10)
  })
  it('averages to one decimal', () => {
    expect(scoreRounds([{ target: 5, actual: 5.5 }, { target: 4, actual: 4 }])).toBe(5)
  })
})

describe('result stats', () => {
  it('finds closest / furthest round and the tendency', async () => {
    const { resultDetails } = await import('./scoring')
    const d = resultDetails([{ target: 4, actual: 4.4 }, { target: 10, actual: 9.5 }, { target: 5, actual: 5.75 }])
    expect(d.stats).toEqual([
      { label: 'Closest', value: '5.0 % off' },
      { label: 'Furthest off', value: '15.0 %' },
      { label: 'Tendency', value: '+7 % too late' },
    ])
  })
})
