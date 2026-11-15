import { describe, expect, it } from 'vitest'
import { COUNT, LABELS_B, MARGIN, MIN_GAP, PATH_MAX, PATH_MIN, makeLayout, partTime, pathLength } from './scoring'

describe('trail switch layout', () => {
  it('spreads the circles out, on the board, with a path in the band', () => {
    for (let k = 0; k < 200; k++) {
      const pts = makeLayout()
      expect(pts).toHaveLength(COUNT)
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(MARGIN)
        expect(p.x).toBeLessThanOrEqual(1 - MARGIN)
        expect(p.y).toBeGreaterThanOrEqual(MARGIN)
        expect(p.y).toBeLessThanOrEqual(1 - MARGIN)
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) expect(Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y)).toBeGreaterThanOrEqual(MIN_GAP)
      const len = pathLength(pts)
      expect(len).toBeGreaterThanOrEqual(PATH_MIN)
      expect(len).toBeLessThanOrEqual(PATH_MAX)
    }
  })
  it('generates quickly', () => {
    const t = performance.now()
    for (let k = 0; k < 50; k++) makeLayout()
    expect((performance.now() - t) / 50).toBeLessThan(20)
  })
  it('alternates numbers and letters in part B', () => {
    expect(LABELS_B.slice(0, 5)).toEqual(['1', 'A', '2', 'B', '3'])
    expect(LABELS_B[COUNT - 1]).toBe('H')
  })
  it('adds a second per wrong click', () => expect(partTime({ ms: 20_000, wrong: 2 })).toBe(22_000))
})
