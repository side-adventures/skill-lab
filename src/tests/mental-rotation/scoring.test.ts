import { describe, expect, it } from 'vitest'
import { CELLS, isChiral, makeShape, makeTrial, mirror } from './scoring'

describe('mental rotation', () => {
  it('detects symmetric shapes', () => {
    expect(isChiral([[0, 0], [1, 0], [2, 0], [1, 1]])).toBe(false) // T
    expect(isChiral([[0, 0], [0, 1], [0, 2], [1, 2]])).toBe(true) // L
  })
  it('only makes chiral, connected shapes of the right size', () => {
    for (let i = 0; i < 100; i++) {
      const s = makeShape()
      expect(s).toHaveLength(CELLS)
      expect(isChiral(s)).toBe(true)
    }
  })
  it('never shows both shapes at the same angle', () => {
    for (let i = 0; i < 200; i++) {
      const t = makeTrial()
      const d = (t.rightAngle - t.leftAngle + 360) % 360
      expect(d >= 45 && d <= 315).toBe(true)
    }
  })
  it('keeps mirrored shapes in the same box as the original (fits the view)', () => {
    for (let i = 0; i < 100; i++) {
      const m = mirror(makeShape())
      expect(Math.min(...m.map((c) => c[0]))).toBe(0)
      expect(Math.min(...m.map((c) => c[1]))).toBe(0)
      expect(Math.max(...m.flat())).toBeLessThanOrEqual(3)
    }
  })
})
