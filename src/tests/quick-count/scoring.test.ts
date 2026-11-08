import { describe, expect, it } from 'vitest'
import { DOT_RADIUS, MAX_DOTS, accuracy, placeDots, scoreRounds } from './scoring'

describe('quick count', () => {
  it('places the requested number of non-overlapping dots', () => {
    for (let i = 0; i < 50; i++) {
      const dots = placeDots(MAX_DOTS)
      expect(dots).toHaveLength(MAX_DOTS)
      for (let a = 0; a < dots.length; a++)
        for (let b = a + 1; b < dots.length; b++)
          expect(Math.hypot(dots[a].x - dots[b].x, dots[a].y - dots[b].y)).toBeGreaterThan(DOT_RADIUS * 2)
    }
  })
  it('scores accuracy', () => {
    expect(accuracy(20, 20)).toBe(100)
    expect(accuracy(20, 18)).toBe(90)
    expect(accuracy(10, 40)).toBe(0)
    expect(scoreRounds([{ actual: 20, guess: 18 }, { actual: 10, guess: 10 }])).toBe(95)
  })
})
