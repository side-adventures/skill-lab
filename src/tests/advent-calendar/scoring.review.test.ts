import { describe, expect, it } from 'vitest'
import { shuffle } from '../../lib/random'
import { COLS, COUNT, calendarScore, makeLayout, pathLength, type Layout, type RoundResult } from './scoring'

// ---- Review 2026-11-17 (scoring-reviewer): shortcuts, luck vs skill, layout band ----

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
const dist = (a: number, b: number) => Math.hypot((a % COLS) - (b % COLS), Math.floor(a / COLS) - Math.floor(b / COLS))

/**
 * A player: for each door, searches outward from the last opened door (cells sorted by distance; the next door's rank
 * in that list × `scan` ms), moves the mouse (Fitts-like, 120 ms × log2(1 + distance)), plus a base time, with noise;
 * a wrong door on `miss` of the doors. Round 2 is `switchCost` slower per door.
 */
function player(base: number, scan: number, miss: number, switchCost: number, r: () => number) {
  return (layout: Layout, round: number): RoundResult => {
    let ms = 0
    let wrong = 0
    let at = layout.order[0]
    for (let k = 0; k < COUNT; k++) {
      const cell = layout.order[k]
      const byDist = Array.from({ length: COUNT }, (_, i) => i).sort((a, b) => dist(at, a) - dist(at, b))
      const rank = byDist.indexOf(cell)
      ms += (base + (round ? switchCost : 0)) * Math.exp(0.25 * gauss(r)) + scan * rank + 120 * Math.log2(1 + dist(at, cell))
      if (r() < miss) wrong++
      at = cell
    }
    return { ms, wrong }
  }
}
const run = (p: ReturnType<typeof player>, r: () => number, make = makeLayout) =>
  calendarScore([p(make(0, r), 0), p(make(1, r), 1)])
/** Any shuffled layout, no path band (for comparison). */
const unbanded = (_round: number, r: () => number): Layout => {
  const order = shuffle(Array.from({ length: COUNT }, (_, i) => i), r)
  return { order, cells: [] }
}

describe('advent calendar (review)', () => {
  it('same player run to run: weak vs strong (passes; numbers in the log)', () => {
    const r = seeded(1)
    const strong = Array.from({ length: 1000 }, () => run(player(450, 25, 0.02, 250, r), r))
    const weak = Array.from({ length: 1000 }, () => run(player(700, 45, 0.06, 500, r), r))
    const strongFree = Array.from({ length: 1000 }, () => run(player(450, 25, 0.02, 250, r), r, unbanded))
    const gap = mean(weak) - mean(strong)
    const line = (n: string, xs: number[]) =>
      `${n}: mean ${(mean(xs) / 1000).toFixed(1)} s, p10–p90 ${(pctl(xs, 0.1) / 1000).toFixed(1)}–${(pctl(xs, 0.9) / 1000).toFixed(1)} s, sd ${(sd(xs) / gap).toFixed(3)} of gap`
    console.log(`[advent-calendar] gap ${(gap / 1000).toFixed(1)} s\n${line('strong', strong)}\n${line('weak', weak)}\n${line('strong, no path band', strongFree)}`)
    expect(sd(weak) / gap).toBeLessThan(0.2)
  })

  it('clicking doors blindly is far slower than searching (passes)', () => {
    // A blind clicker tries closed doors at random (opened ones look the same but cost nothing): 1 s per wrong door.
    const r = seeded(2)
    const blind = (): number => {
      let total = 0
      for (let round = 0; round < 2; round++)
        for (let k = 0; k < COUNT; k++) total += 1000 * Math.floor(r() * (COUNT - k)) + 200
      return total
    }
    const spam = mean(Array.from({ length: 300 }, blind))
    const weak = mean(Array.from({ length: 300 }, () => run(player(700, 45, 0.06, 500, r), r)))
    console.log(`[advent-calendar] blind clicking ${(spam / 1000).toFixed(0)} s, weak player ${(weak / 1000).toFixed(1)} s`)
    expect(spam).toBeGreaterThan(3 * weak)
  })

  it('the path band only takes ±5 % of the median (passes)', () => {
    const r = seeded(3)
    const lens = Array.from({ length: 2000 }, () => pathLength(shuffle(Array.from({ length: COUNT }, (_, i) => i), r)))
    console.log(`[advent-calendar] random paths p5 ${pctl(lens, 0.05).toFixed(1)}, median ${pctl(lens, 0.5).toFixed(1)}, p95 ${pctl(lens, 0.95).toFixed(1)}; in band ${(lens.filter((l) => l >= 59 && l <= 65).length / 20).toFixed(1)} %`)
    expect(pctl(lens, 0.5)).toBeGreaterThan(59)
    expect(pctl(lens, 0.5)).toBeLessThan(65)
  })
})
