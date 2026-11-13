import { describe, expect, it } from 'vitest'
import { makeCounts, resultDetails, scoreRounds } from './scoring'

const stat = (d: ReturnType<typeof resultDetails>, label: string) => d.stats?.find((s) => s.label === label)?.value

describe('quick-count result stats (review)', () => {
  it('guessing more dots than shown is "too high", fewer is "too low" (passes)', () => {
    const high = Array.from({ length: 10 }, (_, i) => ({ actual: 10 + i, guess: 12 + i }))
    const low = Array.from({ length: 10 }, (_, i) => ({ actual: 10 + i, guess: 7 + i }))
    expect(stat(resultDetails(high), 'Tendency')).toBe('+2.0 too high')
    expect(stat(resultDetails(low), 'Tendency')).toBe('−3.0 too low')
    expect(stat(resultDetails(low), 'Biggest miss')).toBe('3 dots')
    expect(stat(resultDetails(low), 'Exact')).toBe('0 / 10')
  })
  it('uses the singular for a miss of 1 dot', () => {
    const one = [{ actual: 20, guess: 21 }, { actual: 30, guess: 30 }]
    expect(stat(resultDetails(one), 'Biggest miss')).toBe('1 dot')
  })
})

// ---- Review 2026-11-13: overlapping DOT_GROUPS + log-ratio accuracy ----

const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const sd = (xs: number[]) => Math.sqrt(avg(xs.map((x) => (x - avg(xs)) ** 2)))
/** Weber-noise estimator: guess = actual × e^(noise · N(0,1)), rounded; 5–6 dots almost exact. */
const play = (counts: number[], noise: number, r: () => number) =>
  scoreRounds(counts.map((a) => ({ actual: a, guess: Math.max(1, Math.round(a * Math.exp((a <= 6 ? 0.03 : noise) * gauss(r)))) })))

describe('quick-count groups and accuracy (review 2026-11-13)', () => {
  it('the best constant guess (≈ 25 every round) scores ~55 %, far below a weak honest player (passes)', () => {
    const r = seeded(1)
    const best = Math.max(...[15, 20, 22, 25, 28, 30].map((c) => avg(Array.from({ length: 1000 }, () => scoreRounds(makeCounts(r).map((a) => ({ actual: a, guess: c })))))))
    const weak = avg(Array.from({ length: 1000 }, () => play(makeCounts(r), 0.4, r)))
    expect(best).toBeLessThan(57)
    expect(weak).toBeGreaterThan(best + 10) // weak (noise 0.4) ≈ 69 %
  })

  it('luck: the random counts add almost nothing; the spread is the player\'s own noise (passes)', () => {
    const r = seeded(3)
    const setupMeans: number[] = [], all: number[] = []
    for (let k = 0; k < 200; k++) {
      const counts = makeCounts(r)
      const s = Array.from({ length: 50 }, () => play(counts, 0.2, r))
      setupMeans.push(avg(s))
      all.push(...s)
    }
    // measured: total sd ≈ 3.9 points, of which the setup ≈ 0.8 (≈ 4 % of the variance)
    expect(sd(setupMeans) ** 2 / sd(all) ** 2).toBeLessThan(0.1)
    // one player (noise 0.15): p10–p90 ≈ 84–92 %; noise 0.3: ≈ 69–84 %, means 88 vs 77
    const strong = Array.from({ length: 1000 }, () => play(makeCounts(r), 0.15, r))
    expect(pctl(strong, 0.9) - pctl(strong, 0.1)).toBeLessThan(10)
  })
})
