import { describe, expect, it } from 'vitest'
import { resultDetails, scoreRounds } from './scoring'

const stat = (d: ReturnType<typeof resultDetails>, label: string) => d.stats?.find((s) => s.label === label)?.value

describe('time-estimation result stats (review)', () => {
  it('stopping late reads "too late", early reads "too early" (passes)', () => {
    const late = [3, 5, 8, 4, 10].map((t) => ({ target: t, actual: t * 1.1 }))
    const early = [3, 5, 8, 4, 10].map((t) => ({ target: t, actual: t * 0.8 }))
    expect(stat(resultDetails(late), 'Tendency')).toBe('+10 % too late')
    expect(stat(resultDetails(early), 'Tendency')).toBe('−20 % too early')
    expect(scoreRounds(early)).toBe(20)
    expect(stat(resultDetails(early), 'Closest')).toBe('20.0 % off')
  })
})
