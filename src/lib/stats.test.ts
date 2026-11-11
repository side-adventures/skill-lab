import { describe, expect, it } from 'vitest'
import { bestToday, mean, median, relativeDay, rollingMean } from './stats'

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime()

describe('stats helpers', () => {
  it('averages and medians', () => {
    expect(mean([1, 2, 3, 10])).toBe(4)
    expect(median([1, 2, 3, 10])).toBe(2.5)
    expect(median([5, 1, 3])).toBe(3)
    expect(Number.isNaN(mean([]))).toBe(true)
  })
  it('rolling mean starts at the 5th attempt', () => {
    const r = rollingMean([1, 2, 3, 4, 5, 6])
    expect(r.slice(0, 4)).toEqual([undefined, undefined, undefined, undefined])
    expect(r[4]).toBe(3)
    expect(r[5]).toBe(4)
  })
  it('finds the best score of today', () => {
    const now = at(2026, 11, 12, 18)
    const h = [{ score: 200, at: at(2026, 11, 11) }, { score: 260, at: at(2026, 11, 12, 9) }, { score: 240, at: at(2026, 11, 12, 10) }]
    expect(bestToday(h, false, now)).toBe(240)
    expect(bestToday(h, true, now)).toBe(260)
    expect(bestToday(h.slice(0, 1), false, now)).toBeUndefined()
  })
  it('labels days relative to now', () => {
    const now = at(2026, 11, 12, 1)
    expect(relativeDay(at(2026, 11, 12, 0), now)).toBe('Today')
    expect(relativeDay(at(2026, 11, 11, 23), now)).toBe('Yesterday')
    expect(relativeDay(at(2026, 11, 8), now)).toBe('4 days ago')
    expect(relativeDay(at(2026, 10, 2), now)).toBe('Oct 2')
    expect(relativeDay(at(2025, 10, 2), now)).toBe('Oct 2, 2025')
  })
})
