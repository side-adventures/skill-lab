import { describe, expect, it } from 'vitest'
import { correctMinusWrong } from './scoring'

describe('shared scoring', () => {
  it('subtracts wrong answers from correct ones', () => {
    expect(correctMinusWrong(30, 4)).toBe(26)
    expect(correctMinusWrong(3, 5)).toBe(-2)
  })
})
