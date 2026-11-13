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

describe('run score and lives', () => {
  const block = (n: number, acc: number, mistakes: number, clicked = true): BlockResult =>
    ({ n, acc, clicked, mistakes, lost: Math.max(0, mistakes - 2), matches: 5, hits: 3, wrong: 1, missed: 2 })

  it('up to 2 mistakes pass; every mistake beyond 2 costs a life; 6 mistakes with 4 lives is game over', async () => {
    const { afterBlock, LIVES } = await import('./scoring')
    expect(LIVES).toBe(4)
    expect(afterBlock(0, 4)).toEqual({ passed: true, lost: 0, livesLeft: 4, over: false })
    expect(afterBlock(2, 4)).toEqual({ passed: true, lost: 0, livesLeft: 4, over: false })
    expect(afterBlock(3, 4)).toEqual({ passed: false, lost: 1, livesLeft: 3, over: false })
    expect(afterBlock(5, 4)).toEqual({ passed: false, lost: 3, livesLeft: 1, over: false })
    expect(afterBlock(6, 4)).toEqual({ passed: false, lost: 4, livesLeft: 0, over: true })
    expect(afterBlock(3, 1)).toEqual({ passed: false, lost: 1, livesLeft: 0, over: true })
    expect(afterBlock(9, 2)).toEqual({ passed: false, lost: 7, livesLeft: 0, over: true })
  })

  it('score = 100 × the level the run ended at + accuracy there', async () => {
    const { runResult, runScore } = await import('./scoring')
    expect(runScore(4, 0.65)).toBe(465)
    expect(runScore(2, 0.65)).toBe(265) // ended at the first level
    expect(runScore(3, 0.7999)).toBe(379) // rounded down
    expect(runScore(2, 0.29)).toBe(229) // no float noise (0.29 × 100 = 28.999…)
    expect(runScore(3, 1)).toBe(399) // never reaches the next hundred
    const r = runResult([block(2, 0.9, 1), block(3, 0.7, 3), block(3, 0.85, 2), block(4, 0.65, 5)])
    expect(r.score).toBe(465)
    expect(r.failed).toBeUndefined()
    expect(r.details?.stats).toEqual([
      { label: 'Highest level passed', value: '3-back' },
      { label: 'Ended at', value: '4-back · 65 %' },
    ])
  })

  it('a run without a single click gives No score; any click gives a score', async () => {
    const { runResult } = await import('./scoring')
    expect(runResult([block(2, 0.5, 5, false), block(2, 0.5, 5, false)]).failed).toBeTruthy()
    const r = runResult([block(2, 0.62, 4), block(2, 0.55, 5)])
    expect(r.score).toBe(255)
    expect(r.details?.stats?.[0].value).toBe('None')
  })
})
