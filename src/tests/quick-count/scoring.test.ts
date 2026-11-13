import { describe, expect, it } from 'vitest'
import { DOT_GROUPS, DOT_RADIUS, MAX_DOTS, MIN_DOTS, ROUNDS, accuracy, makeCounts, placeDots, scoreRounds } from './scoring'

describe('quick count', () => {
  it('places the requested number of non-overlapping dots', () => {
    for (let i = 0; i < 50; i++) {
      const dots = placeDots(MAX_DOTS)
      expect(dots).toHaveLength(MAX_DOTS)
      for (let a = 0; a < dots.length; a++)
        for (let b = a + 1; b < dots.length; b++)
          expect(Math.hypot(dots[a].x - dots[b].x, dots[a].y - dots[b].y)).toBeGreaterThan(DOT_RADIUS * 2)
    }
  })
  it('picks one distinct count per group, in range', () => {
    expect(ROUNDS).toBe(10)
    for (let i = 0; i < 1000; i++) {
      const counts = makeCounts()
      expect(counts).toHaveLength(ROUNDS)
      expect(new Set(counts).size).toBe(ROUNDS)
      counts.forEach((n) => expect(n >= MIN_DOTS && n <= MAX_DOTS).toBe(true))
      // every group except the free last one can be matched to its own count
      const left = [...counts]
      const groups = [...DOT_GROUPS.slice(0, -1)].sort((a, b) => a[1] - b[1])
      for (const [lo, hi] of groups) {
        const k = left.filter((n) => n >= lo && n <= hi).sort((a, b) => a - b)[0]
        expect(k).toBeDefined()
        left.splice(left.indexOf(k), 1)
      }
    }
  })
  it('leans towards 14–22 dots and still reaches both ends', () => {
    const runs = 4000
    const all = Array.from({ length: runs }, () => makeCounts()).flat()
    const share = (lo: number, hi: number) => all.filter((n) => n >= lo && n <= hi).length / runs
    // per run: ~3 rounds in 14–21 (9 % of the values), ~1.5 in 46–60 (27 % of the values)
    expect(share(14, 21)).toBeGreaterThan(2.7)
    expect(share(46, 60)).toBeGreaterThan(1.2)
    expect(share(46, 60)).toBeLessThan(1.8)
    expect(share(5, 8)).toBeGreaterThan(0.3)
  })
  it('order is random: the first round can be any size', () => {
    const firsts = Array.from({ length: 2000 }, () => makeCounts()[0])
    expect(Math.min(...firsts)).toBeLessThanOrEqual(8)
    expect(Math.max(...firsts)).toBeGreaterThanOrEqual(55)
  })
  it('scores accuracy', () => {
    expect(accuracy(20, 20)).toBe(100)
    expect(accuracy(20, 18)).toBeCloseTo(89.46, 2)
    expect(accuracy(20, 22)).toBeCloseTo(90.47, 2)
    // half and double are equally wrong
    expect(accuracy(20, 10)).toBeCloseTo(30.69, 2)
    expect(accuracy(20, 40)).toBeCloseTo(accuracy(20, 10), 10)
    expect(accuracy(10, 40)).toBe(0)
    expect(accuracy(20, 0)).toBe(0)
    expect(scoreRounds([{ actual: 20, guess: 18 }, { actual: 10, guess: 10 }])).toBe(94.7)
  })
})
