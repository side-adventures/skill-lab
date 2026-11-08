import { describe, expect, it } from 'vitest'
import { COLS, ROWS, flashOrderMs, numberOrderTiles, placeTiles } from './scoring'

describe('number order / flash order', () => {
  it('places distinct tiles in the grid', () => {
    const cells = placeTiles(20)
    expect(new Set(cells).size).toBe(20)
    cells.forEach((c) => expect(c).toBeLessThan(COLS * ROWS))
  })
  it('grows tiles / shrinks time per round', () => {
    expect([0, 1, 5].map(numberOrderTiles)).toEqual([5, 6, 10])
    expect([0, 1, 2].map(flashOrderMs)).toEqual([1000, 900, 810])
  })
})
