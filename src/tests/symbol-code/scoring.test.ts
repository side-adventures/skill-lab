import { describe, expect, it } from 'vitest'
import { KEYS, SYMBOLS, SYMBOL_COUNT, learningGain, makeKey, makeSymbolSource } from './scoring'

describe('symbol code', () => {
  it('has one home-row key per symbol, two groups of three', () => {
    expect(KEYS).toEqual(['s', 'd', 'f', 'j', 'k', 'l'])
    expect(KEYS).toHaveLength(SYMBOL_COUNT)
  })
  it('the key pairs every answer key with a different symbol from the pool', () => {
    const key = makeKey()
    expect(key).toHaveLength(SYMBOL_COUNT)
    expect(new Set(key).size).toBe(SYMBOL_COUNT)
    for (const s of key) expect(s).toBeLessThan(SYMBOLS.length)
  })
  it('shows each symbol equally often and never twice in a row', () => {
    const next = makeSymbolSource()
    const counts = Array(SYMBOL_COUNT).fill(0)
    let prev = -1
    for (let i = 0; i < SYMBOL_COUNT * 50; i++) {
      const s = next()
      expect(s).not.toBe(prev)
      counts[s]++
      prev = s
    }
    expect(counts.every((c) => c === 50)).toBe(true)
  })
  it('compares correct answers in the last vs the first 20 s', () => {
    const answers = [
      ...Array.from({ length: 10 }, (_, i) => ({ at: i * 1000, correct: true })),
      { at: 5000, correct: false },
      ...Array.from({ length: 15 }, (_, i) => ({ at: 41_000 + i * 1000, correct: true })),
    ]
    expect(learningGain(answers)).toBeCloseTo(0.5)
    expect(learningGain([])).toBeUndefined()
  })
})
