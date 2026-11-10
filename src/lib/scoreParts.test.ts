import { describe, expect, it } from 'vitest'
import { TESTS } from '../tests/registry'
import { scoreParts } from './scoreParts'

describe('scoreParts', () => {
  it('splits number and unit', () => {
    expect(scoreParts('245 ms')).toEqual({ value: '245', unit: 'ms' })
    expect(scoreParts('4.1 % off')).toEqual({ value: '4.1', unit: '% off' })
    expect(scoreParts('7.3 /s')).toEqual({ value: '7.3', unit: '/s' })
    expect(scoreParts('Level 9')).toEqual({ value: '9', unit: 'level' })
  })
  it('keeps scores without a separate unit whole', () => {
    expect(scoreParts('3-back')).toEqual({ value: '3-back', unit: '' })
    expect(scoreParts('Not passed')).toEqual({ value: 'Not passed', unit: '' })
  })
  it('gives every test a short value', () => {
    for (const t of TESTS) expect(scoreParts(t.formatScore(12)).value.length, t.id).toBeLessThanOrEqual(8)
  })
})
