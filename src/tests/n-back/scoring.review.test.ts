import { describe, expect, it } from 'vitest'
import { LIVES, START_N, afterBlock, blockAccuracy, blockCounts, isMatch, makeBlock, runResult, type BlockResult } from './scoring'

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

// ---- Review 2026-11-13, updated for the life pool (≤ 2 mistakes pass, 4 lives, score = 100 × end level + accuracy) ----

const Phi = (x: number) => 0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)))
const pctl = (xs: number[], p: number) => [...xs].sort((a, b) => a - b)[Math.floor(p * (xs.length - 1))]
type Tapper = (seq: number[], n: number, r: () => number) => boolean[]

/** Plays blocks like NBackTest: pass → next level, otherwise lose lives and replay, until out of lives. */
function playRun(tapper: Tapper, r: () => number) {
  const blocks: BlockResult[] = []
  let n = START_N, lives = LIVES
  for (let k = 0; k < 60; k++) {
    const seq = makeBlock(n, r)
    const t = tapper(seq, n, r)
    const counts = blockCounts(seq, t, n)
    const mistakes = counts.missed + counts.wrong
    const step = afterBlock(mistakes, lives)
    blocks.push({ n, acc: blockAccuracy(seq, t, n), clicked: t.some(Boolean), mistakes, lost: step.lost, ...counts })
    if (step.over) break
    lives = step.livesLeft
    if (step.passed) n++
  }
  return { ...runResult(blocks), blocks: blocks.length }
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

describe('n-back run score with lives (review 2026-11-13)', () => {
  it('degenerate strategies end at 2-back, below honest players (passes)', () => {
    // click every item: 11 wrong clicks → 9 lives → game over in the first block, 50 % → 250
    expect(new Set(scores((seq) => seq.map(() => true), 1, 200))).toEqual(new Set([250]))
    const random = scores((seq, _n, r) => seq.map(() => r() < 0.3), 2)
    const mean = random.reduce((a, b) => a + b, 0) / random.length
    console.info('random clicking mean', mean.toFixed(0))
    expect(mean).toBeLessThan(270)
    const weak = scores(player(1.5), 3)
    const weakMean = weak.reduce((a, b) => a + b, 0) / weak.length
    console.info('weak honest (d′ 1.5) mean', weakMean.toFixed(0))
    expect(weakMean).toBeGreaterThan(mean)
  })

  it('never clicking gives No score (passes)', () => {
    const res = playRun((seq) => seq.map(() => false), seeded(4))
    expect(res.failed).toBeTruthy()
  })

  it('luck: one fixed player (d′ 3) spread is now smaller than the weak-to-strong gap (passes)', () => {
    const s = scores(player(3), 5)
    const lo = pctl(s, 0.1), hi = pctl(s, 0.9)
    const m = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
    const gap = m(scores(player(3.5), 6)) - m(scores(player(2.5), 7))
    console.info('d′ 3 p10–p90', lo, hi, 'gap', gap.toFixed(0), 'ratio', ((hi - lo) / gap).toFixed(2))
    // before the life pool: ratio ≈ 1.6 (p10 270, p90 470); with 4 lives ≈ 1.0
    expect((hi - lo) / gap).toBeLessThan(1.25)
  })
})
