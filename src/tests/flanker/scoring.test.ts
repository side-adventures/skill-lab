import { describe, expect, it } from 'vitest'
import { ARROWS, arrowsOf, averageTimes, makeTrialSource } from './scoring'

describe('flanker trials', () => {
  it('stays within one of 50 / 50 and never repeats the same row', () => {
    const next = makeTrialSource()
    let same = 0
    let prev = next()
    same += prev.congruent ? 1 : 0
    for (let i = 1; i < 500; i++) {
      const t = next()
      same += t.congruent ? 1 : 0
      expect(Math.abs(same - (i + 1) / 2)).toBeLessThanOrEqual(1)
      expect(t.target === prev.target && t.congruent === prev.congruent).toBe(false)
      prev = t
    }
  })
  it('draws the middle arrow as the target and the others as flankers', () => {
    expect(arrowsOf({ target: 'left', congruent: true })).toEqual(Array(ARROWS).fill('left'))
    expect(arrowsOf({ target: 'left', congruent: false })).toEqual(['right', 'right', 'left', 'right', 'right'])
  })
  it('averages only correct answers per kind', () => {
    const t = averageTimes([
      { ms: 400, congruent: true, correct: true },
      { ms: 900, congruent: true, correct: false },
      { ms: 500, congruent: false, correct: true },
    ])
    expect(t).toEqual({ sameMs: 400, mixedMs: 500 })
  })
})
