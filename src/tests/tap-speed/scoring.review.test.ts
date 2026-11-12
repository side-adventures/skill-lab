import { describe, expect, it } from 'vitest'
import { clicksPerFrame, resultDetails } from './scoring'

describe('tap-speed frames (review)', () => {
  it('every counted click lands in a frame', () => {
    // The countdown starts in an effect after the first click renders, so it ends a few ms after
    // firstClick + 10 000 ms. A click in that gap counts in the score but falls outside all frames.
    const times = [0, 500, 9990, 10_008]
    const frames = clicksPerFrame(times)
    expect(frames.reduce((a, b) => a + b, 0)).toBe(times.length)
  })
  it('total clicks stat equals the click count (passes)', () => {
    const d = resultDetails([0, 1999, 2000, 9999])
    expect(d.stats?.[0]).toEqual({ label: 'Total clicks', value: '4' })
    expect(d.chips?.items.map((c) => c.value)).toEqual(['2', '1', '0', '0', '1'])
  })
})
