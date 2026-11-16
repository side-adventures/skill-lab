import { describe, expect, it } from 'vitest'
import { KEYS, PART_MS, SYMBOLS, SYMBOL_COUNT, makeKey, makeSymbolSource, partPoints } from './scoring'

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
  it('splits the points into first, middle and last 20 s, adding up to the score', () => {
    const answers = [
      { at: 1000, correct: true },
      { at: 5000, correct: false },
      { at: PART_MS + 10, correct: true },
      { at: 2 * PART_MS + 500, correct: true },
      { at: 3 * PART_MS + 50, correct: true }, // an answer in the very last frame counts for the last part
    ]
    expect(partPoints(answers)).toEqual([0, 1, 2])
    expect(partPoints([])).toEqual([0, 0, 0])
  })
})
