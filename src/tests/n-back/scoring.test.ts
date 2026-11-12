import { describe, expect, it } from 'vitest'
import { blockAccuracy, blockLength, isMatch, makeBlock, matchCount } from './scoring'

describe('n-back', () => {
  it('builds blocks with exactly the planned number of matches', () => {
    for (const n of [2, 3, 4]) {
      for (let k = 0; k < 100; k++) {
        const seq = makeBlock(n)
        expect(seq).toHaveLength(blockLength(n))
        const matches = seq.filter((_, i) => isMatch(seq, i, n)).length
        expect(matches).toBe(matchCount(n))
      }
    }
  })
  it('uses balanced accuracy, so doing nothing or tapping everything scores 50 %', () => {
    const seq = [1, 2, 1, 2, 5] // 2-back: matches at 2 and 3, non-match at 4
    expect(blockAccuracy(seq, [false, false, true, true, false], 2)).toBe(1)
    expect(blockAccuracy(seq, [], 2)).toBe(0.5)
    expect(blockAccuracy(seq, [true, true, true, true, true], 2)).toBe(0.5)
    const sparse: boolean[] = []
    sparse[2] = true // one of two matches caught, non-match left alone
    expect(blockAccuracy(seq, sparse, 2)).toBe(0.75)
  })
})

describe('blockCounts', () => {
  it('splits clicks into hits, wrong clicks and missed matches', async () => {
    const { blockCounts } = await import('./scoring')
    // 2-back: matches at 2 and 4
    const seq = [1, 5, 1, 7, 1, 3]
    const tapped = [false, false, true, true, false, false]
    expect(blockCounts(seq, tapped, 2)).toEqual({ matches: 2, hits: 1, wrong: 1, missed: 1 })
  })
})
