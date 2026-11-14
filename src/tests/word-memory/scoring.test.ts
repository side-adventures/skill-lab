import { describe, expect, it } from 'vitest'
import { nextWord, repeatWeight } from './scoring'
import { WORDS } from './words'

describe('word memory', () => {
  it('has a big, unique word list', () => {
    expect(WORDS.length).toBeGreaterThan(400)
    expect(new Set(WORDS).size).toBe(WORDS.length)
  })
  it('labels seen/new correctly and never repeats the previous word', () => {
    const seen: string[] = []
    const recent: string[] = []
    let repeats = 0
    for (let i = 0; i < 300; i++) {
      const { word, isSeen } = nextWord(WORDS, seen, recent)
      expect(isSeen).toBe(seen.includes(word))
      expect(word).not.toBe(recent[0])
      if (isSeen) repeats++
      else seen.push(word)
      recent.unshift(word)
    }
    expect(repeats).toBeGreaterThan(60)
  })
  it('makes recently shown words less likely: 0, 20, 40, 60, 80 %, then normal', () => {
    const recent = ['a', 'b', 'c', 'd', 'e', 'f']
    expect(recent.map((w) => repeatWeight(w, recent))).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1])
    expect(repeatWeight('z', recent)).toBe(1)
  })
  it('picks repeats in proportion to those weights', () => {
    const seen = ['a', 'b', 'c', 'd', 'e', 'f']
    const recent = [...seen]
    const counts: Record<string, number> = {}
    let n = 0
    for (let i = 0; i < 40000; i++) {
      const r = nextWord(seen, seen, recent) // pool = seen: always a repeat
      counts[r.word] = (counts[r.word] ?? 0) + 1
      n++
    }
    // weights 0.2 + 0.4 + 0.6 + 0.8 + 1 = 3
    expect(counts.a).toBeUndefined()
    expect(counts.b / n).toBeCloseTo(0.2 / 3, 1)
    expect(counts.f / n).toBeCloseTo(1 / 3, 1)
    expect(counts.f / counts.b).toBeGreaterThan(4)
    expect(counts.f / counts.b).toBeLessThan(6)
  })
})
