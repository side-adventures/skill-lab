import { describe, expect, it } from 'vitest'
import {
  CHANGES, EXTRA_CHARS, LEVELS, POOLS, buildPassword, changeOptions, crackTime, hasDigitRun, makeExtras, makePassword,
  passwordFor, pickWords, recipesFor, scoreBits, showMs, strengthLabel, wordCount, type Recipe,
} from './scoring'

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const bitsOf = (level: number, n = 2000) => Array.from({ length: n }, () => passwordFor(level).bits)

describe('password memory: words', () => {
  it('has different lowercase words per group, in the right lengths and sizes', () => {
    const groups = { short: [4, 5, 256], medium: [6, 6, 256], long: [7, 9, 256], xlong: [10, 12, 64], combo: [3, 5, 384] } as const
    for (const [group, words] of Object.entries(POOLS) as [keyof typeof groups, string[]][]) {
      const [min, max, size] = groups[group]
      expect(words.length).toBe(size)
      expect(new Set(words).size).toBe(size)
      for (const w of words) {
        expect(w).toMatch(/^[a-z]+$/)
        expect(w.length).toBeGreaterThanOrEqual(min)
        expect(w.length).toBeLessThanOrEqual(max)
      }
    }
  })
})

describe('password memory: building', () => {
  it('builds every recipe of every level validly', () => {
    for (let level = 1; level <= LEVELS.length + 2; level++) {
      for (const recipe of recipesFor(level)) {
        for (let i = 0; i < 200; i++) {
          const p = makePassword(recipe)
          expect(p.words).toHaveLength(wordCount(recipe.shape))
          expect(p.changes).toHaveLength(recipe.changes)
          expect(p.extras).toHaveLength(recipe.extras)
          // Extras: allowed characters, none twice, no 123 / 987 runs, at the end.
          expect([...p.extras].every((c) => EXTRA_CHARS.includes(c))).toBe(true)
          expect(new Set(p.extras).size).toBe(p.extras.length)
          expect(hasDigitRun(p.extras)).toBe(false)
          expect(p.text.endsWith(p.extras)).toBe(true)
          // Three words always have a visible separator; one word none.
          if (p.words.length === 3) expect(p.sep).not.toBe('')
          if (p.words.length === 1) expect(p.sep).toBe('')
          // Each change is one of the letter's options; never an uppercase I or O.
          for (const c of p.changes) {
            expect(p.words[c.word][c.index]).toBe(c.from)
            expect(changeOptions(c.from)).toContain(c.to)
          }
          expect(p.text).not.toMatch(/[IO]/)
        }
      }
    }
  })

  it('puts the changes into the text where they belong', () => {
    const p = buildPassword({ words: ['salt', 'oak'], wordBits: 0, changes: 7, extras: 0, separators: [{ sep: '-', weight: 1 }] })
    expect(p.text).toMatch(/^[S5$][A4@][L1][T7]-0[A4@]K$/)
  })

  it('uses the leet replacements from the design', () => {
    expect(CHANGES.a).toEqual(['A', '4', '@'])
    expect(CHANGES.s).toEqual(['S', '5', '$'])
    expect(changeOptions('b')).toContain('8')
    expect(changeOptions('g')).toContain('9')
    expect(changeOptions('l')).toContain('1')
    expect(changeOptions('z')).toContain('2')
    expect(changeOptions('k')).toEqual(['K'])
  })

  it('makes "no separator" rare, and only between two words', () => {
    const seps = Array.from({ length: 4000 }, () => makePassword({ shape: 'two', changes: 0, extras: 0 }).sep)
    const none = seps.filter((s) => s === '').length / seps.length
    expect(none).toBeGreaterThan(0.08)
    expect(none).toBeLessThan(0.18)
  })

  it('counts every change the same, whatever its options', () => {
    const one = (word: string) => buildPassword({ words: [word], wordBits: 0, changes: 1, extras: 0 }).bits
    // "a" has 3 options, "k" only one: same bits for the same word length.
    expect(one('aaaa')).toBeCloseTo(one('kkkk'))
  })

  it('counts bits from the choices made', () => {
    const r: Recipe = { shape: 'short', changes: 0, extras: 1 }
    expect(makePassword(r).bits).toBeCloseTo(8 + Math.log2(EXTRA_CHARS.length))
    expect(pickWords(POOLS.combo, 2).wordBits).toBeCloseTo(2 * Math.log2(384))
  })

  it('rejects digit runs only', () => {
    expect(hasDigitRun('123')).toBe(true)
    expect(hasDigitRun('#987')).toBe(true)
    expect(hasDigitRun('1#23')).toBe(false)
    expect(hasDigitRun('135')).toBe(false)
    for (let i = 0; i < 500; i++) expect(hasDigitRun(makeExtras(5))).toBe(false)
  })
})

describe('password memory: levels', () => {
  it('starts with one short word and one extra', () => {
    expect(passwordFor(1).text).toMatch(/^[a-z]{4,5}[0-9!?@#$%&*]$/)
  })

  it('makes words longer as levels go up', () => {
    const groupsAt = (level: number) => new Set(recipesFor(level).map((r) => r.shape))
    expect([...groupsAt(1)]).toEqual(['short'])
    for (const level of [1, 2, 3]) {
      expect(groupsAt(level).has('long')).toBe(false)
      expect(groupsAt(level).has('xlong')).toBe(false)
      expect(groupsAt(level).has('three')).toBe(false)
    }
  })

  it('gets stronger every level, without much overlap', () => {
    let prev = 0
    for (let level = 1; level <= LEVELS.length + 2; level++) {
      const m = median(bitsOf(level))
      if (level > 1) {
        expect(m - prev).toBeGreaterThan(1.8)
        expect(m - prev).toBeLessThan(6)
      }
      prev = m
    }
  })

  it('keeps a level within a few bits (luck stays small)', () => {
    for (let level = 1; level <= LEVELS.length; level++) {
      const bs = bitsOf(level).sort((a, b) => a - b)
      expect(bs[Math.floor(bs.length * 0.95)] - bs[Math.floor(bs.length * 0.05)]).toBeLessThan(5)
    }
  })

  it('past the ladder adds one extra per level', () => {
    const last = LEVELS.length
    expect(recipesFor(last + 2)[0].extras).toBe(LEVELS[last - 1][0].extras + 2)
  })
})

describe('password memory: time, score and result', () => {
  it('shows a password by its parts, not its characters', () => {
    const p = (words: string[], changes: number, extras: string) =>
      ({ words, changes: Array.from({ length: changes }, () => ({ word: 0, index: 0, from: 'a', to: 'A' })), extras })
    expect(showMs(p(['ball'], 0, '1'))).toBe(3250)
    // A long word with little changed is quicker than a short one with a lot changed.
    expect(showMs(p(['diamond'], 0, '#5'))).toBeLessThan(showMs(p(['spicy'], 3, '6?1')))
    expect(showMs(p(['wild', 'desk'], 2, '?20'))).toBe(1500 + 2000 + 500 + 1500 + 2250)
  })
  it('scores whole bits', () => expect(scoreBits(29.6)).toBe(30))
  it('labels strength', () => {
    expect(strengthLabel(12)).toBe('Weak')
    expect(strengthLabel(25)).toBe('Fair')
    expect(strengthLabel(30)).toBe('Strong')
    expect(strengthLabel(40)).toBe('Very strong')
  })
  it('turns bits into a time to crack', () => {
    expect(crackTime(5)).toBe('instantly')
    expect(crackTime(12)).toBe('~2 seconds')
    expect(crackTime(30)).toBe('~6.2 days')
    expect(crackTime(40)).toBe('~17 years')
    expect(crackTime(60)).toBe('~18 million years')
  })
})
