import { describe, expect, it } from 'vitest'
import { GRID, extend } from './scoring'

describe('sequence memory', () => {
  it('grows by one, keeps the earlier steps, and stays on the grid', () => {
    let seq: number[] = []
    let doubles = 0
    for (let i = 0; i < 900; i++) {
      const next = extend(seq)
      expect(next.slice(0, -1)).toEqual(seq)
      expect(next.at(-1)!).toBeLessThan(GRID * GRID)
      if (next.at(-1) === seq.at(-1)) doubles++
      seq = next
    }
    // the same tile twice in a row is allowed (1 in 9)
    expect(doubles).toBeGreaterThan(50)
  })
})
