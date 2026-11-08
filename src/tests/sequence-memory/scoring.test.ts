import { describe, expect, it } from 'vitest'
import { GRID, extend } from './scoring'

describe('sequence memory', () => {
  it('grows by one with no immediate repeats', () => {
    let seq: number[] = []
    for (let i = 0; i < 200; i++) {
      const next = extend(seq)
      expect(next.slice(0, -1)).toEqual(seq)
      expect(next.at(-1)).not.toBe(seq.at(-1))
      expect(next.at(-1)!).toBeLessThan(GRID * GRID)
      seq = next
    }
  })
})
