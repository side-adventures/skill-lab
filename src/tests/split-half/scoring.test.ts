import { describe, expect, it } from 'vitest'
import { polygonArea } from '../geometry/scoring'
import { KINDS, ROUNDS, evaluate, halvingX, makeRound, makeRounds, rawShape, rightShare, totalScore } from './scoring'

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** True if two segments cross (not just touch at a shared corner). */
const crosses = (a: { x: number; y: number }, b: typeof a, c: typeof a, d: typeof a) => {
  const o = (p: typeof a, q: typeof a, r: typeof a) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
  return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0
}
const isSimple = (pts: { x: number; y: number }[]) =>
  pts.every((a, i) => pts.every((c, j) => {
    if (Math.abs(i - j) <= 1 || (i === 0 && j === pts.length - 1) || (j === 0 && i === pts.length - 1)) return true
    return !crosses(a, pts[(i + 1) % pts.length], c, pts[(j + 1) % pts.length])
  }))

describe('split in half', () => {
  it('a run has one round of every shape kind', () => {
    const rounds = makeRounds(seeded(1))
    expect(rounds).toHaveLength(ROUNDS)
    expect(new Set(rounds.map((r) => r.kind))).toEqual(new Set(KINDS))
  })

  it('shapes never cross themselves, fit on the board and are big enough', () => {
    const rand = seeded(2)
    for (let i = 0; i < 400; i++) {
      for (const kind of KINDS) {
        expect(isSimple(rawShape(kind, rand)), kind).toBe(true)
        const r = makeRound(kind, rand)
        for (const p of r.pts) {
          expect(p.x).toBeGreaterThanOrEqual(7.99)
          expect(p.x).toBeLessThanOrEqual(92.01)
          expect(p.y).toBeGreaterThanOrEqual(7.99)
          expect(p.y).toBeLessThanOrEqual(92.01)
        }
        expect(polygonArea(r.pts)).toBeGreaterThan(400)
        expect(r.start).toBeGreaterThanOrEqual(0)
        expect(r.start).toBeLessThanOrEqual(100)
        expect(Math.abs(r.start - r.half)).toBeGreaterThanOrEqual(10)
      }
    }
  })

  it('finds the halving line and scores a cut', () => {
    const square = [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 30, y: 30 }, { x: 10, y: 30 }]
    expect(halvingX(square)).toBeCloseTo(20, 5)
    expect(rightShare(square, 15)).toBeCloseTo(0.75, 5)
    // L shape: 10 × 40 bar + 10 × 10 foot = 500; half (250) is 6.25 into the 40-high bar
    const l = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 30 }, { x: 20, y: 30 }, { x: 20, y: 40 }, { x: 0, y: 40 }]
    expect(halvingX(l)).toBeCloseTo(6.25, 5)
    const round = { kind: 'triangle' as const, pts: square, half: 20, start: 5 }
    expect(evaluate(round, 20).points).toBe(100)
    expect(evaluate(round, 18).points).toBe(0) // 40 / 60
    expect(evaluate(round, 19).points).toBe(50) // 45 / 55
    expect(totalScore([100, 50, 75])).toBe(75)
  })

  it('the answer is not just the middle of the shape box', () => {
    const rand = seeded(3)
    let far = 0, n = 0
    for (let i = 0; i < 300; i++) for (const kind of KINDS) {
      const r = makeRound(kind, rand)
      const xs = r.pts.map((p) => p.x)
      if (Math.abs(r.half - (Math.min(...xs) + Math.max(...xs)) / 2) >= 2.5) far++
      n++
    }
    expect(far / n).toBeGreaterThan(0.95)
  })
})
