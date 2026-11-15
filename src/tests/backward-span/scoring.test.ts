import { describe, expect, it } from 'vitest'
import { START_DIGITS, makeSequence, reversed, spanScore } from './scoring'

describe('backward span', () => {
  it('makes sequences of 1–9 without repeats or neighbours one apart', () => {
    for (let len = 2; len <= 12; len++) {
      for (let k = 0; k < 50; k++) {
        const s = makeSequence(len)
        expect(s).toMatch(new RegExp(`^[1-9]{${len}}$`))
        for (let i = 1; i < s.length; i++) expect(Math.abs(+s[i] - +s[i - 1])).toBeGreaterThan(1)
      }
    }
  })
  it('reverses the sequence', () => expect(reversed('8352')).toBe('2538'))
  it('scores the last length done, 0 before the first', () => {
    expect(spanScore(START_DIGITS)).toBe(0)
    expect(spanScore(START_DIGITS + 1)).toBe(START_DIGITS)
    expect(spanScore(7)).toBe(6)
  })
})
