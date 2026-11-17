import { describe, expect, it } from 'vitest'
import { GRID, PENALTY_MS, makeRounds, searchScore, type Round, type RoundResult } from './scoring'

// ---- Review 2026-11-17 (scoring-reviewer): shortcuts, luck vs skill, round generation ----

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => { const m = mean(xs); return Math.sqrt(mean(xs.map((x) => (x - m) ** 2))) }
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r())

/**
 * A searcher: scans the shapes in reading order (row by row) at `slope` ms per shape until the T, plus a base time
 * (seeing + clicking) with human noise; clicks a wrong shape on `miss` of the rounds.
 */
function searcher(base: number, slope: number, miss: number, r: () => number) {
  return (round: Round): RoundResult => {
    const order = [...round.items].sort((a, b) => Math.round(a.y * GRID) - Math.round(b.y * GRID) || a.x - b.x)
    const pos = order.findIndex((i) => i.target) + 1
    const ms = Math.max(250, base * Math.exp(0.15 * gauss(r)) + slope * pos * Math.exp(0.2 * gauss(r)))
    return { size: round.size, ms, wrong: r() < miss ? 1 : 0 }
  }
}
/** Clicks shapes at random (no repeats), 250 ms per click, until it hits the T. */
const clicker = (r: () => number) => (round: Round): RoundResult => {
  const n = round.items.length
  const pos = 1 + Math.floor(r() * n) // the T's place in a random clicking order
  return { size: round.size, ms: 250 * pos, wrong: pos - 1 }
}

const play = (f: (r: Round) => RoundResult, r: () => number) => searchScore(makeRounds(r).map(f))

describe('odd one out (review)', () => {
  it('same player run to run: weak vs strong searcher (passes; numbers in the log)', () => {
    const r = seeded(1)
    const strong = Array.from({ length: 1000 }, () => play(searcher(650, 25, 0.03, r), r))
    const weak = Array.from({ length: 1000 }, () => play(searcher(900, 55, 0.1, r), r))
    const gap = mean(weak) - mean(strong)
    const line = (n: string, xs: number[]) =>
      `${n}: mean ${(mean(xs) / 1000).toFixed(1)} s, p10–p90 ${(pctl(xs, 0.1) / 1000).toFixed(1)}–${(pctl(xs, 0.9) / 1000).toFixed(1)} s, sd ${(sd(xs) / gap).toFixed(2)} of gap`
    console.log(`[odd-one-out] gap ${(gap / 1000).toFixed(1)} s\n${line('strong', strong)}\n${line('weak', weak)}`)
    expect(sd(weak) / gap).toBeLessThan(0.2)
  })

  it('clicking shapes at random is far slower than searching (passes)', () => {
    const r = seeded(2)
    const spam = mean(Array.from({ length: 500 }, () => play(clicker(r), r)))
    const weak = mean(Array.from({ length: 500 }, () => play(searcher(900, 55, 0.1, r), r)))
    console.log(`[odd-one-out] random clicking ${(spam / 1000).toFixed(1)} s (1 s per wrong click = ${PENALTY_MS} ms), weak searcher ${(weak / 1000).toFixed(1)} s`)
    expect(spam).toBeGreaterThan(2 * weak)
  })

  it('the T is never in the middle row or column, and its quadrants are spread 4/4/4/3 (passes)', () => {
    const r = seeded(3)
    for (let k = 0; k < 300; k++) {
      const q = [0, 0, 0, 0]
      for (const round of makeRounds(r)) {
        const t = round.items.find((i) => i.target)!
        const col = Math.floor(t.x * GRID)
        const row = Math.floor(t.y * GRID)
        expect(col).not.toBe(3)
        expect(row).not.toBe(3)
        q[(row < 3 ? 0 : 2) + (col < 3 ? 0 : 1)]++
      }
      expect([...q].sort()).toEqual([3, 4, 4, 4])
    }
  })
})
