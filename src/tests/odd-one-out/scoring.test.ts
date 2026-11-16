import { describe, expect, it } from 'vitest'
import { GRID, ITEM, ROUNDS_PER_SIZE, SET_SIZES, bySize, makeRounds, searchScore } from './scoring'

describe('odd one out rounds', () => {
  it('has every size equally often, one target, all on the board without overlap', () => {
    for (let k = 0; k < 50; k++) {
      const rounds = makeRounds()
      for (const s of SET_SIZES) expect(rounds.filter((r) => r.size === s)).toHaveLength(ROUNDS_PER_SIZE)
      for (const r of rounds) {
        expect(r.items).toHaveLength(r.size)
        expect(r.items.filter((i) => i.target)).toHaveLength(1)
        const half = ITEM / GRID / 2
        for (const it of r.items) {
          expect(it.x - half).toBeGreaterThanOrEqual(0)
          expect(it.x + half).toBeLessThanOrEqual(1)
        }
        // Items stay inside their own cells, so they never overlap.
        for (let i = 0; i < r.items.length; i++)
          for (let j = i + 1; j < r.items.length; j++) {
            const a = r.items[i], b = r.items[j]
            expect(Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))).toBeGreaterThanOrEqual(ITEM / GRID - 1e-9)
          }
      }
    }
  })
  it('spreads the target over the four quadrants', () => {
    const rounds = makeRounds()
    const q = [0, 0, 0, 0]
    for (const r of rounds) {
      const t = r.items.find((i) => i.target)!
      q[(t.y < 0.5 ? 0 : 2) + (t.x < 0.5 ? 0 : 1)]++
    }
    expect(Math.max(...q) - Math.min(...q)).toBeLessThanOrEqual(1)
  })
  it('scores the total time with penalties and the slope per shape', () => {
    const rounds = [
      { size: 16, ms: 600, wrong: 0 },
      { size: 24, ms: 800, wrong: 0 },
      { size: 36, ms: 1000, wrong: 1 },
    ]
    expect(searchScore(rounds)).toBe(600 + 800 + 2000)
    expect(bySize(rounds).perItem).toBeCloseTo((2000 - 600) / 20)
  })
})
