import { describe, expect, it } from 'vitest'
import { nextWord } from './scoring'
import { WORDS } from './words'

describe('word memory', () => {
  it('has a big, unique word list', () => {
    expect(WORDS.length).toBeGreaterThan(400)
    expect(new Set(WORDS).size).toBe(WORDS.length)
  })
  it('labels seen/new correctly and never repeats the previous word', () => {
    const seen: string[] = []
    let last: string | undefined
    let repeats = 0
    for (let i = 0; i < 300; i++) {
      const { word, isSeen } = nextWord(WORDS, seen, last)
      expect(isSeen).toBe(seen.includes(word))
      expect(word).not.toBe(last)
      if (isSeen) repeats++
      else seen.push(word)
      last = word
    }
    expect(repeats).toBeGreaterThan(60)
  })
})
