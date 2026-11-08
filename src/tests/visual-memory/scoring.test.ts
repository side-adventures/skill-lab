import { describe, expect, it } from 'vitest'
import { gridSize, pickTiles, tileCount } from './scoring'

describe('visual memory', () => {
  it('grows grid and tile count with level', () => {
    expect([1, 3, 6, 10, 15].map(gridSize)).toEqual([3, 4, 5, 6, 7])
    expect(tileCount(1)).toBe(3)
    expect(tileCount(10)).toBe(12)
  })
  it('picks distinct in-range tiles', () => {
    for (let level = 1; level <= 30; level++) {
      const tiles = pickTiles(level)
      expect(new Set(tiles).size).toBe(tileCount(level))
      expect(Math.max(...tiles)).toBeLessThan(gridSize(level) ** 2)
    }
  })
})
