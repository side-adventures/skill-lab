import { describe, expect, it } from 'vitest'
import { PASS_ACCURACY, START_N, blockAccuracy, blockCounts, isMatch, makeBlock, runResult, type BlockResult } from './scoring'

// mulberry32, seeded
const seeded = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

describe('n-back result table vs blockAccuracy (review)', () => {
  it('counts agree with the accuracy for random tapping on scored items (passes)', () => {
    const rand = seeded(7)
    for (let run = 0; run < 500; run++) {
      const n = 2 + (run % 4)
      const seq = makeBlock(n, rand)
      const tapped: boolean[] = []
      for (let i = n; i < seq.length; i++) if (rand() < 0.4) tapped[i] = true
      const c = blockCounts(seq, tapped, n)
      const nonMatches = seq.length - n - c.matches
      const acc = blockAccuracy(seq, tapped, n)
      expect(acc).toBeCloseTo((c.hits / c.matches + (nonMatches - c.wrong) / nonMatches) / 2, 10)
      expect(c.hits + c.missed).toBe(c.matches)
    }
  })

  it('a click on one of the first n items is not a wrong click (matches the accuracy)', () => {
    const n = 2
    const seq = makeBlock(n, seeded(1))
    const perfect: boolean[] = []
    seq.forEach((_, i) => { if (isMatch(seq, i, n)) perfect[i] = true })
    const withEarly = [...perfect]
    withEarly[0] = true // clicked "match" on the very first item (the UI flashes "Not a match")
    expect(blockAccuracy(seq, withEarly, n)).toBe(1) // score ignores it
    expect(blockCounts(seq, withEarly, n).wrong).toBe(0) // table says 1 → table and accuracy disagree
  })
})

// ---- Review 2026-11-13: new run score (100 × (failed N − 1) + failed block accuracy) ----

const Phi = (x: number) => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)))
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
type Tapper = (seq: number[], n: number, r: () => number) => boolean[]

/** Plays blocks until one fails, exactly like NBackTest, and returns the run result. */
function playRun(tapper: Tapper, r: () => number) {
  const blocks: BlockResult[] = []
  for (let n = START_N; n < 12; n++) {
    const seq = makeBlock(n, r)
    const t = tapper(seq, n, r)
    const acc = blockAccuracy(seq, t, n)
    blocks.push({ n, acc, clicked: t.some(Boolean), ...blockCounts(seq, t, n) })
    if (acc < PASS_ACCURACY) break
  }
  return runResult(blocks)
}
/** Signal-detection player: d′ = d0 at 2-back, 0.8 lower per extra step back, neutral criterion. */
const player = (d0: number): Tapper => (seq, n, r) => {
  const d = Math.max(0, d0 - 0.8 * (n - 2))
  return seq.map((_, i) => i >= n && r() < (isMatch(seq, i, n) ? Phi(d / 2) : Phi(-d / 2)))
}
const scores = (tp: Tapper, seed: number, runs = 1000) => {
  const r = seeded(seed)
  return Array.from({ length: runs }, () => playRun(tp, r)).filter((x) => !x.failed).map((x) => x.score)
}

describe('n-back run score (review 2026-11-13)', () => {
  it('degenerate strategies stay at ~150, below any honest player (passes)', () => {
    expect(new Set(scores((seq) => seq.map(() => true), 1, 200))).toEqual(new Set([150])) // click every item
    const random = scores((seq, _n, r) => seq.map(() => r() < 0.3), 2)
    const mean = random.reduce((a, b) => a + b, 0) / random.length
    expect(mean).toBeGreaterThan(140)
    expect(mean).toBeLessThan(160)
    expect(random.filter((s) => s >= 200).length / random.length).toBeLessThan(0.03) // ~1 % pass 2-back by luck
    const weak = scores(player(1.5), 3)
    expect(weak.reduce((a, b) => a + b, 0) / weak.length).toBeGreaterThan(200)
  })

  it('one click on the first (unscored) item turns "No score" into a saved 150 (passes, low severity)', () => {
    const r = seeded(4)
    const res = playRun((seq) => seq.map((_, i) => i === 0), r)
    expect(res.failed).toBeUndefined()
    expect(res.score).toBe(150)
  })

  it('luck: one fixed player (d′ 3) spreads over about two levels (passes, demonstrates the spread)', () => {
    const s = scores(player(3), 5)
    const lo = pctl(s, 0.1), hi = pctl(s, 0.9)
    const gap = (() => {
      const m = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
      return m(scores(player(3.5), 6)) - m(scores(player(2.5), 7))
    })()
    // measured: p10 ≈ 270, p90 ≈ 470 (≈ 200 points), gap d′ 2.5 → 3.5 ≈ 120 points
    expect(hi - lo).toBeGreaterThan(150)
    expect((hi - lo) / gap).toBeGreaterThan(1.3)
  })
})
