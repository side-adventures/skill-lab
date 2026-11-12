import { describe, expect, it } from 'vitest'
import { blockAccuracy, blockCounts, isMatch, makeBlock } from './scoring'

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
