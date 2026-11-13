import { describe, expect, it } from 'vitest'
import { resultDetails } from './scoring'

const stat = (d: ReturnType<typeof resultDetails>, label: string) => d.stats?.find((s) => s.label === label)?.value

describe('quick-count result stats (review)', () => {
  it('guessing more dots than shown is "too high", fewer is "too low" (passes)', () => {
    const high = Array.from({ length: 10 }, (_, i) => ({ actual: 10 + i, guess: 12 + i }))
    const low = Array.from({ length: 10 }, (_, i) => ({ actual: 10 + i, guess: 7 + i }))
    expect(stat(resultDetails(high), 'Tendency')).toBe('+2.0 too high')
    expect(stat(resultDetails(low), 'Tendency')).toBe('−3.0 too low')
    expect(stat(resultDetails(low), 'Biggest miss')).toBe('3 dots')
    expect(stat(resultDetails(low), 'Exact')).toBe('0 / 10')
  })
  it('uses the singular for a miss of 1 dot', () => {
    const one = [{ actual: 20, guess: 21 }, { actual: 30, guess: 30 }]
    expect(stat(resultDetails(one), 'Biggest miss')).toBe('1 dot')
  })
})
