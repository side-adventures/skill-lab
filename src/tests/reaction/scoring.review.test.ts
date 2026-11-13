import { describe, expect, it } from 'vitest'
import { MAX_TOO_SOON, ROUNDS, isTooFast, randomDelay, summarize } from './scoring'

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r())
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]

describe('reaction median (review 2026-11-13)', () => {
  it('before the fix: blind clicks 1.6 s after starting with free retries reached a ~80 ms median (model of the old rules)', () => {
    // Start a round, click 1.6 s later without looking. Delay < 1.6 s (2.9 %) → a "reaction" of 0–100 ms;
    // otherwise "Too soon", which costs nothing, so retry. With the median only 3 such rounds are needed.
    const r = seeded(1)
    const scores: number[] = [], attempts: number[] = []
    for (let k = 0; k < 1000; k++) {
      const times: number[] = []
      let a = 0
      while (times.length < 3) {
        a++
        const d = randomDelay(r)
        if (d < 1600) times.push(1600 - d)
      }
      scores.push(summarize([...times, 260, 270]).score)
      attempts.push(a)
    }
    // measured: median score ≈ 80 ms (p90 96 ms) after ≈ 93 attempts (p90 190), ~3 min of clicking
    expect(pctl(scores, 0.9)).toBeLessThan(100)
    expect(pctl(attempts, 0.5)).toBeLessThan(120)
  })

  it('median is a little steadier than the mean for one fixed player (passes)', () => {
    const r = seeded(2)
    const med: number[] = [], avg: number[] = []
    for (let k = 0; k < 1000; k++) {
      // ex-Gaussian RT around 250 ms + a 5 % chance of a distracted round (+250 ms)
      const t = Array.from({ length: ROUNDS }, () => 250 + 25 * gauss(r) - 40 * Math.log(r() || 1e-12) + (r() < 0.05 ? 250 : 0))
      const s = summarize(t)
      med.push(s.score)
      avg.push(s.average)
    }
    // measured: median p10–p90 ≈ 258–321 ms (63), average ≈ 265–350 ms (85)
    expect(pctl(med, 0.9) - pctl(med, 0.1)).toBeLessThan(pctl(avg, 0.9) - pctl(avg, 0.1))
  })

  it('fix: under 100 ms is too soon and more than 5 early clicks end the run, so blind clicking almost never scores', () => {
    // Blind clicker as above, now clicking 1.7 s after starting (1.6 s only ever gives < 100 ms → too soon).
    const r = seeded(3)
    let scored = 0
    const runs = 20000
    for (let k = 0; k < runs; k++) {
      const times: number[] = []
      let early = 0
      while (times.length < 3 && early <= MAX_TOO_SOON) {
        const ms = 1700 - randomDelay(r)
        if (ms < 0 || isTooFast(ms)) early++
        else times.push(ms)
      }
      if (times.length === 3) scored++
    }
    expect(isTooFast(99)).toBe(true)
    expect(isTooFast(100)).toBe(false)
    // ≈ 0.1 % of runs (each run up to 8 tries): ~1000 runs of blind clicking per lucky score
    expect(scored / runs).toBeLessThan(0.005)
  })
})
