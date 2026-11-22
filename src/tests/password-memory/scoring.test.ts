import { describe, expect, it } from 'vitest'
import {
  CHANGES, EXTRA_CHARS, LIVES, LOAD_TOLERANCE, POOLS, SYMBOL_KEYS, afterMiss, afterRight,
  buildPassword, changeOptions, countedChanges, hasDigitRun, isBareWord, limitsFor, loadOf, loadOfLevel, makeExtras, matches, partsLoad,
  passwordForLevel, pickWords, showMsOfLevel, startClimb,
} from './scoring'

describe('password memory: words', () => {
  it('has different lowercase words per group, in the right lengths and sizes', () => {
    const groups = { tiny: [3, 3, 128], short: [4, 5, 256], medium: [6, 6, 256], long: [7, 9, 256], xlong: [10, 12, 64], combo: [3, 5, 384] } as const
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

const two = (changes = 0, extras = 0) => buildPassword({ ...pickWords(POOLS.combo, 2), changes, extras })

describe('password memory: building', () => {
  it('builds valid passwords at every load', () => {
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 60; i++) {
        const p = passwordForLevel(level)
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

  it('always puts a visible separator between words', () => {
    const seps = new Set(Array.from({ length: 2000 }, () => two().sep))
    expect([...seps].sort()).toEqual([' ', '-', '.', '_'])
  })

  it('still counts bits from the choices made (the lab saves them)', () => {
    const p = buildPassword({ ...pickWords(POOLS.short, 1), changes: 0, extras: 1 })
    expect(p.bits).toBeCloseTo(8 + Math.log2(EXTRA_CHARS.length))
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

describe('password memory: load', () => {
  const ch = (to: string, word = 0, index = 1) => ({ word, index, from: 'x', to })
  const base = (words: string[], changes: ReturnType<typeof ch>[] = [], extras = '', sep = '-') => ({ words, sep, changes, extras })

  it('weighs the parts as measured in the lab', () => {
    expect(partsLoad(base(['cake']))).toBeCloseTo(1.83)
    expect(partsLoad(base(['cake'], [], '7'))).toBeCloseTo(2.83)
    expect(partsLoad(base(['cake'], [], '#'))).toBeCloseTo(3.36)
  })

  it('counts changes per word, up to half its letters; a look-alike more than a capital', () => {
    const word = partsLoad(base(['letter']))
    const changed = (s: string) => [...s].map((c, i) => (c === 'letter'[i] ? null : ch(c, 0, i))).filter((c) => c !== null)
    expect(partsLoad(base(['letter'], changed('leTter'))) - word).toBeCloseTo(1.7)
    expect(partsLoad(base(['letter'], changed('le7ter'))) - word).toBeCloseTo(2.9)
    // Up to half the word (3 of 6 letters) each change adds 1.4; past half nothing more.
    expect(partsLoad(base(['letter'], changed('LETter'))) - word).toBeCloseTo(1.7 + 2 * 1.4)
    expect(partsLoad(base(['letter'], changed('LETTER')))).toBeCloseTo(partsLoad(base(['letter'], changed('LETter'))))
    // Look-alikes count up to half the word too: L3773R has 4, counted as 3.
    expect(partsLoad(base(['letter'], changed('L3773R'))) - word).toBeCloseTo(1.7 + 2 * 1.4 + 3 * 1.2)
    // One change in each of two words costs more than two in one word.
    const two = base(['cake', 'oak'])
    expect(partsLoad({ ...two, changes: [ch('C', 0), ch('K', 1)] })).toBeGreaterThan(partsLoad({ ...two, changes: [ch('C', 0), ch('K', 0)] }))
  })

  it('counts the show time', () => {
    const p = base(['cake'])
    expect(loadOf(p, 5000)).toBeCloseTo(partsLoad(p) - 0.4)
    expect(loadOf(p, 3500)).toBeCloseTo(partsLoad(p) + 0.2)
  })

  it('never makes a bare word (or one with only a capital first letter)', () => {
    expect(isBareWord(base(['cake']))).toBe(true)
    expect(isBareWord(base(['cake'], [ch('C', 0, 0)]))).toBe(true)
    expect(isBareWord(base(['cake'], [ch('K', 0, 2)]))).toBe(false)
    expect(isBareWord(base(['cake'], [], '7'))).toBe(false)
    for (let level = 1; level <= 30; level++) {
      for (let i = 0; i < 40; i++) expect(isBareWord(passwordForLevel(level))).toBe(false)
    }
  })

  it('starts with a 6-letter word and one extra character', () => {
    for (let i = 0; i < 100; i++) expect(passwordForLevel(1).text).toMatch(/^[a-z]{6}[0-9!?@#$%&*]$/)
  })

  it('makes passwords within 0.15 of their level\'s load, quickly', () => {
    const start = Date.now()
    for (let level = 2; level <= 40; level++) {
      for (let i = 0; i < 30; i++) {
        const p = passwordForLevel(level)
        expect(Math.abs(loadOf(p, showMsOfLevel(level)) - loadOfLevel(level))).toBeLessThanOrEqual(LOAD_TOLERANCE + 1e-9)
      }
    }
    expect(Date.now() - start).toBeLessThan(10000)
  })

  it('keeps the first levels simple, then mixes everything with minimums growing by level', () => {
    for (let level = 2; level <= 40; level++) {
      const limits = limitsFor(loadOfLevel(level))
      for (let i = 0; i < 30; i++) {
        const p = passwordForLevel(level)
        expect(p.words.length).toBeLessThanOrEqual(limits.words.length)
        expect(p.changes.length).toBeLessThanOrEqual(limits.changes)
        expect(countedChanges(p)).toBeGreaterThanOrEqual(limits.minChanges)
        expect(p.extras.length).toBeGreaterThanOrEqual(limits.minExtras)
      }
    }
    // Minimums (changed letters, extras) by level: none up to 7, then 1 / 1, 2 / 2, 3 / 2, 3 / 3.
    const mins = (level: number) => { const l = limitsFor(loadOfLevel(level)); return [l.minChanges, l.minExtras] }
    expect([7, 8, 11, 12, 17, 18, 23, 24].map(mins)).toEqual([[0, 0], [1, 1], [1, 1], [2, 2], [2, 2], [3, 2], [3, 2], [3, 3]])
    const ps = Array.from({ length: 300 }, () => passwordForLevel(14))
    expect([...new Set(ps.map((p) => p.words.length))].sort()).toEqual([1, 2, 3])
    expect(ps.some((p) => p.words.length > 1 && p.words.some((w) => w.length >= 6))).toBe(true)
    // 3-letter words only below level 14.
    expect(Array.from({ length: 300 }, () => passwordForLevel(10)).some((p) => p.words.some((w) => w.length === 3))).toBe(true)
    for (let level = 14; level <= 30; level++) {
      for (let i = 0; i < 20; i++) expect(passwordForLevel(level).words.every((w) => w.length >= 4)).toBe(true)
    }
    expect(ps.some((p) => p.extras.length >= 4)).toBe(true)
  })

  it('counts changed letters only up to half of each word', () => {
    const full = { words: ['bear'], changes: [0, 1, 2, 3].map((index) => ({ word: 0, index, from: 'x', to: 'X' })) }
    expect(countedChanges(full)).toBe(2)
    expect(countedChanges({ words: ['bear', 'cat'], changes: [...full.changes, { word: 1, index: 0, from: 'c', to: 'C' }] })).toBe(3)
  })

  it('keeps the word mix of the level (more words later), and fewer extras than before at high levels', () => {
    const avg = (level: number, f: (p: ReturnType<typeof passwordForLevel>) => number) =>
      Array.from({ length: 400 }, () => f(passwordForLevel(level))).reduce((a, b) => a + b, 0) / 400
    expect(avg(10, (p) => p.words.length)).toBeGreaterThan(1.5)
    expect(avg(22, (p) => p.words.length)).toBeGreaterThan(1.85)
    expect(avg(18, (p) => p.extras.length)).toBeLessThan(4)
    // Longer words at higher levels: letters of all words together.
    expect(avg(22, (p) => p.words.join('').length)).toBeGreaterThan(avg(10, (p) => p.words.join('').length) + 2)
  })
})

describe('password memory: levels and the climb', () => {
  it('goes up 1 load a level to level 4, then 0.5, with the show time growing to 5 s', () => {
    expect([1, 2, 3, 4, 5, 6, 12].map(loadOfLevel)).toEqual([3.5, 4.5, 5.5, 6.5, 7, 7.5, 10.5])
    expect([1, 2, 3, 4, 5, 12].map(showMsOfLevel)).toEqual([3500, 4000, 4500, 5000, 5000, 5000])
  })

  it('skips a level after each right answer until the first miss, then goes one at a time', () => {
    let c = startClimb()
    const levels = [c.level]
    for (let i = 0; i < 4; i++) levels.push((c = afterRight(c)).level)
    expect(levels).toEqual([1, 3, 5, 7, 9])
    // A miss at 9 after 7: on at 8, then 9, 10 …
    c = afterMiss(c)
    expect(c.level).toBe(8)
    expect(afterRight(c).level).toBe(9)
    // A later miss replays the same level.
    c = afterRight(c)
    expect(afterMiss(c).level).toBe(9)
    // A miss before anything was confirmed repeats level 1.
    expect(afterMiss(startClimb()).level).toBe(1)
  })

  // A simulated player: the chance of a right answer falls with the load around their 50 % point, as steeply as in
  // the lab data (0.92 per load on this scale).
  const run = (theta: number, rand: () => number) => {
    let c = startClimb()
    let lives = LIVES
    let best = 0
    let rounds = 0
    while (lives > 0 && rounds < 300) {
      rounds++
      if (rand() < 1 / (1 + Math.exp(0.92 * (loadOfLevel(c.level) - theta)))) {
        best = Math.max(best, c.level)
        c = afterRight(c)
      } else {
        lives--
        c = afterMiss(c)
      }
    }
    return { best: best ? loadOfLevel(best) : 0, rounds }
  }
  const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)

  it('scores a player near their 50 % point, steadily, in a reasonable number of rounds', () => {
    const rand = seeded(7)
    for (const theta of [7, 10.8, 15]) {
      const runs = Array.from({ length: 3000 }, () => run(theta, rand))
      const mean = runs.reduce((a, r) => a + r.best, 0) / runs.length
      const sd = Math.sqrt(runs.reduce((a, r) => a + (r.best - mean) ** 2, 0) / runs.length)
      const rounds = runs.reduce((a, r) => a + r.rounds, 0) / runs.length
      expect(Math.abs(mean - theta)).toBeLessThan(1)
      expect(sd).toBeLessThan(1.4)
      expect(rounds).toBeLessThan(2 * (theta - 4) + 6)
    }
  })

  it('has no ceiling: a better player keeps climbing', () => {
    const rand = seeded(3)
    const mean = (theta: number) => Array.from({ length: 1000 }, () => run(theta, rand).best).reduce((a, b) => a + b) / 1000
    expect(mean(24)).toBeGreaterThan(mean(18) + 4)
  })
})

describe('password memory: checking an answer', () => {
  it('is exact, except a capital O for 0 and a capital I for 1', () => {
    expect(matches('FAlC0N*97', 'FAlC0N*97')).toBe(true)
    expect(matches('FAlCON*97', 'FAlC0N*97')).toBe(true)
    expect(matches('ch4Ir', 'ch41r')).toBe(true)
    // l and 1 stay different, and so do o and 0, case and length.
    expect(matches('ba1l', 'bal1')).toBe(false)
    expect(matches('falc0n', 'falc0N')).toBe(false)
    expect(matches('FAlCoN*97', 'FAlC0N*97')).toBe(false)
    expect(matches('FAlC0N*9', 'FAlC0N*97')).toBe(false)
  })
})

describe('password memory: symbol buttons', () => {
  it('offer every non-letter, non-digit character a password can have, except space', () => {
    expect(SYMBOL_KEYS).toEqual(['!', '?', '@', '#', '$', '%', '&', '*', '-', '_', '.'])
  })
})
