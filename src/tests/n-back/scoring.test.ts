import { describe, expect, it } from 'vitest'
import { blockAccuracy, blockLength, isMatch, makeBlock, matchCount, type BlockResult } from './scoring'

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

describe('run score', () => {
  const block = (n: number, acc: number, clicked = true): BlockResult => ({ n, acc, clicked, matches: 6, hits: 4, wrong: 2, missed: 2 })

  it('is 100 × the last level passed + the failed block accuracy', async () => {
    const { runResult, runScore } = await import('./scoring')
    expect(runScore(4, 0.65)).toBe(365)
    expect(runScore(2, 0.65)).toBe(165) // failed the first block
    expect(runScore(3, 0.7999)).toBe(279) // rounded down, never the pass mark
    expect(runScore(2, 0.29)).toBe(129) // no float noise (0.29 × 100 = 28.999…)
    const r = runResult([block(2, 0.9), block(3, 0.85), block(4, 0.65)])
    expect(r.score).toBe(365)
    expect(r.failed).toBeUndefined()
    expect(r.details?.stats).toEqual([
      { label: 'Highest level passed', value: '3-back' },
      { label: 'Ended at', value: '4-back · 65 %' },
    ])
  })

  it('first block: a score with clicks, No score without any click', async () => {
    const { runResult } = await import('./scoring')
    const r = runResult([block(2, 0.62)])
    expect(r.score).toBe(162)
    expect(r.details?.stats?.[0].value).toBe('None')
    expect(runResult([block(2, 0.5, false)]).failed).toBeTruthy()
  })

  it('never reaches the next hundred: the best failed block scores below the next level', async () => {
    const { runScore, PASS_ACCURACY } = await import('./scoring')
    expect(runScore(3, PASS_ACCURACY - 1e-6)).toBeLessThan(300)
  })
})
