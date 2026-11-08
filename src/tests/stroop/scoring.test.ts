import { describe, expect, it } from 'vitest'
import { COLORS, nextTrial, stroopScore, type Trial } from './scoring'

describe('stroop', () => {
  it('produces valid trials that never repeat back to back', () => {
    let prev: Trial | undefined
    let congruent = 0
    for (let i = 0; i < 2000; i++) {
      const t = nextTrial(prev)
      expect(t.ink).toBeLessThan(COLORS.length)
      expect(t.word).toBeLessThan(COLORS.length)
      if (prev) expect(t).not.toEqual(prev)
      if (t.word === t.ink) congruent++
      prev = t
    }
    expect(congruent / 2000).toBeLessThan(0.35)
  })
  it('scores correct minus wrong', () => expect(stroopScore(30, 4)).toBe(26))
})
