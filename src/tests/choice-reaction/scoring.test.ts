import { describe, expect, it } from 'vitest'
import { BLOCKS, TRIALS_PER_BLOCK, blockTargets, choiceScore, msPerDoubling, retryLater } from './scoring'

describe('choice reaction', () => {
  it('lights every square equally often in a block', () => {
    for (const n of BLOCKS) {
      const t = blockTargets(n)
      expect(t).toHaveLength(TRIALS_PER_BLOCK)
      for (let i = 0; i < n; i++) expect(t.filter((x) => x === i)).toHaveLength(TRIALS_PER_BLOCK / n)
    }
  })
  it('puts a missed trial back among the remaining ones', () => {
    const r = retryLater([0, 1, 2], 3, () => 0.5)
    expect([...r].sort()).toEqual([0, 1, 2, 3])
    expect(retryLater([], 2)).toEqual([2])
  })
  it('scores the median of the 2- and 4-square blocks only', () => {
    const blocks = [
      { choices: 1, times: [100, 100], wrong: 0 },
      { choices: 2, times: [300, 310], wrong: 0 },
      { choices: 4, times: [400, 420], wrong: 1 },
    ]
    expect(choiceScore(blocks)).toBe(355)
  })
  it('fits the time per doubling of choices', () => {
    const blocks = [
      { choices: 1, times: [250], wrong: 0 },
      { choices: 2, times: [320], wrong: 0 },
      { choices: 4, times: [390], wrong: 0 },
    ]
    expect(msPerDoubling(blocks)).toBeCloseTo(70)
  })
})
