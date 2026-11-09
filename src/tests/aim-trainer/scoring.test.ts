import { describe, expect, it } from 'vitest'
import { MIN_JUMP, TARGET_PX, hitPoints, nextSpot } from './scoring'

describe('aim trainer', () => {
  it('moves targets far enough each time', () => {
    let prev = nextSpot(undefined)
    for (let i = 0; i < 500; i++) {
      const s = nextSpot(prev)
      expect(Math.hypot(s.x - prev.x, s.y - prev.y)).toBeGreaterThanOrEqual(MIN_JUMP)
      expect(s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1).toBe(true)
      prev = s
    }
  })
})

describe('aim trainer points', () => {
  it('gives 2 for the center and 1 for the ring', () => {
    expect(hitPoints(0, 0)).toBe(2)
    expect(hitPoints(TARGET_PX / 4 - 0.5, 0)).toBe(2)
    expect(hitPoints(TARGET_PX / 4 + 0.5, 0)).toBe(1)
    expect(hitPoints(0, TARGET_PX / 2)).toBe(1)
  })
})
