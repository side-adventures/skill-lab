import { describe, expect, it } from 'vitest'
import {
  EXTRA_CHARS, LEET, LEVELS, POOLS, SEPARATORS, crackTime, hasDigitRun, makeExtras, makePassword, passwordFor,
  recipesFor, scoreBits, showMs, strengthLabel, type Recipe,
} from './scoring'

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const bitsOf = (level: number, n = 2000) => Array.from({ length: n }, () => passwordFor(level).bits)

/** Undo the changes, so the word(s) can be checked against the pools. */
const unchange = (s: string) => s.toLowerCase().replace(/[0-9]/g, (d) => Object.keys(LEET).find((k) => LEET[k] === d) ?? d)

describe('password memory: generation', () => {
  it('builds every recipe of every level validly', () => {
    for (let level = 1; level <= LEVELS.length + 2; level++) {
      for (const recipe of recipesFor(level)) {
        for (let i = 0; i < 200; i++) {
          const p = makePassword(recipe)
          const extras = p.text.slice(-recipe.extras)
          const body = p.text.slice(0, -recipe.extras)
          // Extras: allowed characters, none twice, no 123 / 987 runs.
          expect([...extras].every((c) => EXTRA_CHARS.includes(c))).toBe(true)
          expect(new Set(extras).size).toBe(extras.length)
          expect(hasDigitRun(extras)).toBe(false)
          // Body: the word(s), with exactly `changes` letters changed, never an uppercase I or O.
          expect(body).not.toMatch(/[IO]/)
          const changed = [...body].filter((c) => /[A-Z0-9]/.test(c)).length
          expect(changed).toBe(recipe.changes)
          if (recipe.shape === 'two') {
            const sep = SEPARATORS.slice(1).find((s) => body.includes(s)) ?? ''
            const words = sep ? unchange(body).split(sep) : null
            if (words) words.forEach((w) => expect(POOLS.short).toContain(w))
          } else {
            expect(POOLS[recipe.shape]).toContain(unchange(body))
          }
        }
      }
    }
  })

  it('has 256 different lowercase words per group, in the right lengths', () => {
    const lengths = { short: [4, 5], medium: [6, 6], long: [7, 9] } as const
    for (const [group, words] of Object.entries(POOLS) as [keyof typeof lengths, string[]][]) {
      expect(words.length).toBe(256)
      expect(new Set(words).size).toBe(256)
      for (const w of words) {
        expect(w).toMatch(/^[a-z]+$/)
        expect(w.length).toBeGreaterThanOrEqual(lengths[group][0])
        expect(w.length).toBeLessThanOrEqual(lengths[group][1])
      }
    }
  })

  it('starts like "ball1": a short word and one extra', () => {
    const p = passwordFor(1)
    expect(p.text).toMatch(/^[a-z]{4,5}[0-9!?@#$%&*]$/)
  })

  it('gets about 3–4 bits stronger every level, without much overlap', () => {
    let prev = 0
    for (let level = 1; level <= LEVELS.length + 2; level++) {
      const m = median(bitsOf(level))
      if (level > 1) {
        expect(m - prev).toBeGreaterThan(2)
        expect(m - prev).toBeLessThan(6)
      }
      prev = m
    }
  })

  it('keeps a level within a few bits (luck stays small)', () => {
    for (let level = 1; level <= LEVELS.length; level++) {
      const bs = bitsOf(level)
      expect(Math.max(...bs) - Math.min(...bs)).toBeLessThan(5.5)
    }
  })

  it('counts bits from the choices made', () => {
    // One short word and one extra: log2(words) + log2(extra characters).
    const r: Recipe = { shape: 'short', changes: 0, extras: 1 }
    expect(makePassword(r).bits).toBeCloseTo(Math.log2(POOLS.short.length) + Math.log2(EXTRA_CHARS.length))
    // Each change and each extra adds strength.
    const avg = (rec: Recipe) => median(Array.from({ length: 500 }, () => makePassword(rec).bits))
    expect(avg({ shape: 'short', changes: 1, extras: 1 })).toBeGreaterThan(avg(r))
    expect(avg({ shape: 'short', changes: 0, extras: 2 })).toBeGreaterThan(avg(r))
  })

  it('past the ladder adds one extra per level', () => {
    const last = LEVELS.length
    expect(recipesFor(last + 2)[0].extras).toBe(LEVELS[last - 1][0].extras + 2)
  })

  it('rejects digit runs only', () => {
    expect(hasDigitRun('123')).toBe(true)
    expect(hasDigitRun('#987')).toBe(true)
    expect(hasDigitRun('1#23')).toBe(false)
    expect(hasDigitRun('135')).toBe(false)
    for (let i = 0; i < 500; i++) expect(hasDigitRun(makeExtras(5))).toBe(false)
  })
})

describe('password memory: score and result', () => {
  it('shows longer passwords for longer', () => {
    expect(showMs('ball1')).toBe(3500)
    expect(showMs('r0bin-c4ke!7')).toBe(7000)
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
