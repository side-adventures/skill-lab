import { describe, expect, it } from 'vitest'
import { errorMs, resultDetails } from './scoring'

describe('stop-the-bar result stats (review)', () => {
  it('stopping past the line is "too late" (passes)', () => {
    const rounds = [0.35, 0.5, 0.65, 0.8, 1].map((speed) => ({ speed, target: 0.6 }))
    const late = rounds.map((r) => errorMs(0.65, r))
    const early = rounds.map((r) => errorMs(0.55, r))
    expect(resultDetails(rounds, late).stats?.[1].value).toMatch(/^\+\d+ ms too late$/)
    expect(resultDetails(rounds, early).stats?.[1].value).toMatch(/^−\d+ ms too early$/)
    expect(resultDetails(rounds, late).stats?.[0].value).toBe('50 ms off')
  })
})
