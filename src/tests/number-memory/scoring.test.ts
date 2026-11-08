import { describe, expect, it } from 'vitest'
import { makeNumber, showMs } from './scoring'

describe('number memory', () => {
  it('makes numbers of exact length without leading zero', () => {
    for (let d = 1; d < 25; d++) {
      const n = makeNumber(d)
      expect(n).toMatch(new RegExp(`^[1-9][0-9]{${d - 1}}$`))
    }
  })
  it('shows longer numbers for longer', () => expect(showMs(4)).toBeGreaterThan(showMs(3)))
})
