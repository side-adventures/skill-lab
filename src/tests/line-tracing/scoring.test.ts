import { describe, expect, it } from 'vitest'
import { HEIGHT, cumulative, makeControlPoints, nearest, samplePath } from './scoring'

describe('line tracing', () => {
  it('keeps the path inside the board and of similar length', () => {
    const lengths: number[] = []
    for (let i = 0; i < 200; i++) {
      const path = samplePath(makeControlPoints())
      path.forEach((p) => expect(p.y > 20 && p.y < HEIGHT - 20).toBe(true))
      lengths.push(cumulative(path).at(-1)!)
    }
    expect(Math.max(...lengths) / Math.min(...lengths)).toBeLessThan(1.6)
  })
  it('measures distance to the path', () => {
    const path = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    const acc = cumulative(path)
    expect(nearest({ x: 40, y: 10 }, path, acc)).toEqual({ dist: 10, along: 40 })
  })
})
