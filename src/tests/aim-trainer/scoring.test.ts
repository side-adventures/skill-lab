import { describe, expect, it } from 'vitest'
import { MIN_JUMP, nextSpot } from './scoring'

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
