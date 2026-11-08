import { describe, expect, it } from 'vitest'
import { pickBest } from './storage'

const e = (score: number) => ({ score, at: 0 })

describe('pickBest', () => {
  it('handles empty history', () => expect(pickBest([], true)).toBeUndefined())
  it('picks highest when higher is better', () => expect(pickBest([e(3), e(9), e(5)], true)?.score).toBe(9))
  it('picks lowest when lower is better', () => expect(pickBest([e(300), e(210), e(250)], false)?.score).toBe(210))
})
