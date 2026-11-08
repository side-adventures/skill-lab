import { describe, expect, it } from 'vitest'
import { GREENS, REDS, makeTrials, totalMs } from './scoring'

describe('go / no-go', () => {
  it('has a fixed number of greens and reds, starting green', () => {
    const t = makeTrials()
    expect(t.filter(Boolean)).toHaveLength(GREENS)
    expect(t.filter((x) => !x)).toHaveLength(REDS)
    expect(t[0] && t[1]).toBe(true)
  })
  it('adds penalties', () => {
    expect(totalMs({ rts: [300, 400], misses: 0, falseTaps: 0 })).toBe(700)
    expect(totalMs({ rts: [300], misses: 1, falseTaps: 2 })).toBe(300 + 800 + 300)
  })
})
