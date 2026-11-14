import { describe, expect, it } from 'vitest'
import { blockLength, isMatch, makeBlock, matchCount, type BlockResult } from './scoring'

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
  const block = (n: number, mistakes: number, clicked = true): BlockResult =>
    ({ n, clicked, mistakes, lost: Math.max(0, mistakes - 2), matches: 5, hits: 3, wrong: 1, missed: 2 })

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

  it('score = 100 × the level the run ended at + 80 / 60 / 40 / 20 / 0 for 0 / −1 / −2 / −3 / −4 lives at the end', async () => {
    const { runResult, runScore } = await import('./scoring')
    expect([0, -1, -2, -3, -4, -7].map((l) => runScore(4, l))).toEqual([480, 460, 440, 420, 400, 400])
    expect(runScore(2, 0)).toBe(280) // ended at the first level
    // 4 lives: −1 at 3-back, then 5 mistakes at 4-back cost 3 → exactly 0 lives left
    const r = runResult([block(2, 1), block(3, 3), block(3, 2), block(4, 5)])
    expect(r.score).toBe(480)
    expect(r.failed).toBeUndefined()
    expect(r.details?.stats).toEqual([
      { label: 'Highest level passed', value: '3-back' },
      { label: 'Ended at', value: '4-back' },
      { label: 'Lives at the end', value: '0' },
    ])
    // a 6-mistake crash with 1 life left: −3 → 420
    const crash = runResult([block(2, 0), block(3, 4), block(3, 3), block(4, 6)])
    expect(crash.score).toBe(420)
    expect(crash.details?.stats?.[2].value).toBe('−3')
  })

  it('a run without a single click gives No score; any click gives a score', async () => {
    const { runResult } = await import('./scoring')
    expect(runResult([block(2, 5, false), block(2, 5, false)]).failed).toBeTruthy()
    const r = runResult([block(2, 4), block(2, 5)]) // −2, then −3: 4 − 5 = −1 lives
    expect(r.score).toBe(260)
    expect(r.details?.stats?.[0].value).toBe('None')
  })
})
