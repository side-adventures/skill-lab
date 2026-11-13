import { describe, expect, it } from 'vitest'
import { MAX_DELAY_MS, MIN_DELAY_MS, randomDelay, summarize } from './scoring'

describe('reaction scoring', () => {
  it('scores the median and also reports the average', () => {
    expect(summarize([200, 250, 301])).toEqual({ score: 250, average: 250, best: 200, worst: 301 })
    // one slow round moves the average a lot, the median not at all
    expect(summarize([240, 250, 260, 270, 900])).toEqual({ score: 260, average: 384, best: 240, worst: 900 })
    expect(summarize([240.4, 260.2])).toMatchObject({ score: 250 })
  })
  it('keeps delays within bounds', () => {
    expect(randomDelay(() => 0)).toBe(MIN_DELAY_MS)
    expect(randomDelay(() => 0.999999)).toBeLessThan(MAX_DELAY_MS)
  })
})
