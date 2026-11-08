import { describe, expect, it } from 'vitest'
import { END_RADIUS, START_RADIUS, pathAt, radiusAt, randomPhases, scoreInside } from './scoring'

describe('steady hand', () => {
  it('keeps the path inside [-1, 1]', () => {
    const p = randomPhases()
    for (let t = 0; t < 100; t += 0.05) {
      const { x, y } = pathAt(t, p)
      expect(Math.abs(x)).toBeLessThanOrEqual(1)
      expect(Math.abs(y)).toBeLessThanOrEqual(1)
    }
  })
  it('shrinks the circle over time', () => {
    expect(radiusAt(0)).toBe(START_RADIUS)
    expect(radiusAt(1)).toBeCloseTo(END_RADIUS)
  })
  it('scores percentage inside', () => {
    expect(scoreInside(15_000)).toBe(50)
    expect(scoreInside(40_000)).toBe(100)
  })
})
