import { describe, expect, it } from 'vitest'
import { SYMBOLS, makeKey, makeSymbolSource } from './scoring'

describe('symbol code', () => {
  it('the key pairs every digit with a different symbol', () => {
    const key = makeKey()
    expect([...key].sort()).toEqual(SYMBOLS.map((_, i) => i))
  })
  it('shows each symbol equally often and never twice in a row', () => {
    const next = makeSymbolSource()
    const counts = Array(SYMBOLS.length).fill(0)
    let prev = -1
    for (let i = 0; i < SYMBOLS.length * 50; i++) {
      const s = next()
      expect(s).not.toBe(prev)
      counts[s]++
      prev = s
    }
    expect(counts.every((c) => c === 50)).toBe(true)
  })
})
