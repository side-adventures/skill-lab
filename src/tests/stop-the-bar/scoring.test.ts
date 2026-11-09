import { describe, expect, it } from 'vitest'
import { MIN_TRAVEL_S, ROUNDS, TARGET_MAX, SPEEDS, errorLabel, errorMs, makeRounds, scoreRounds } from './scoring'

describe('stop the bar', () => {
  it('uses every speed once', () => {
    const r = makeRounds()
    expect(r).toHaveLength(ROUNDS)
    expect(r.map((x) => x.speed).sort()).toEqual([...SPEEDS].sort())
  })
  it('never puts the line too close for the speed', () => {
    for (let i = 0; i < 200; i++)
      for (const r of makeRounds()) {
        expect(r.target / r.speed).toBeGreaterThanOrEqual(MIN_TRAVEL_S)
        expect(r.target).toBeLessThanOrEqual(TARGET_MAX)
      }
  })
  it('converts position error to time error', () => {
    expect(errorMs(0.6, { speed: 0.5, target: 0.5 })).toBeCloseTo(200)
    expect(errorMs(0.4, { speed: 1, target: 0.5 })).toBeCloseTo(-100)
    expect(scoreRounds([200, -100])).toBe(150)
    expect(errorLabel(-42.4)).toBe('−42 ms')
  })
})
