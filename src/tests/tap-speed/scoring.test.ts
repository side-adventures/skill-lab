import { describe, expect, it } from 'vitest'
import { tapsPerSecond } from './scoring'

it('converts taps to taps per second', () => expect(tapsPerSecond(73)).toBe(7.3))

describe('result stats', () => {
  it('counts clicks per 2-second frame', async () => {
    const { clicksPerFrame, resultDetails } = await import('./scoring')
    const times = [0, 500, 1999, 2000, 4100, 9999, 10_050]
    expect(clicksPerFrame(times)).toEqual([3, 1, 1, 0, 2]) // 10 050 ms: after the timer's 10 s, still counted
    expect(resultDetails(times).stats?.[1]).toEqual({ label: 'Fastest frame', value: '1.5 / s' })
  })
})
