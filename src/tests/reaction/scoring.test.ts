import { describe, expect, it } from 'vitest'
import { MAX_DELAY_MS, MIN_DELAY_MS, randomDelay, summarize } from './scoring'

describe('reaction scoring', () => {
  it('averages and rounds', () => {
    expect(summarize([200, 250, 301])).toEqual({ score: 250, best: 200, worst: 301 })
  })
  it('keeps delays within bounds', () => {
    expect(randomDelay(() => 0)).toBe(MIN_DELAY_MS)
    expect(randomDelay(() => 0.999999)).toBeLessThan(MAX_DELAY_MS)
  })
})
