import { describe, expect, it } from 'vitest'
import {
  CHANGES, EXTRA_CHARS, LIVES, LOAD_TOLERANCE, POOLS, START_LOAD, SYMBOL_KEYS, afterMiss, afterRight, buildPassword,
  changeOptions, hasDigitRun, levelOf, loadOf, loadOfLevel, makeExtras, matches, partsLoad, passwordForLoad, pickWords,
  showMsFor, startClimb,
} from './scoring'

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

const two = (changes = 0, extras = 0) => buildPassword({ ...pickWords(POOLS.combo, 2), changes, extras })

describe('password memory: building', () => {
  it('builds valid passwords at every load', () => {
    for (let load = START_LOAD; load <= 24; load += 0.5) {
      for (let i = 0; i < 60; i++) {
        const p = passwordForLoad(load, showMsFor(load))
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

  it('makes "no separator" rare, and only between two words', () => {
    const seps = Array.from({ length: 4000 }, () => two().sep)
    const none = seps.filter((s) => s === '').length / seps.length
    expect(none).toBeGreaterThan(0.08)
    expect(none).toBeLessThan(0.18)
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
  const ch = (to: string) => ({ word: 0, index: 0, from: 'x', to })

  it('weighs the parts as measured in the lab', () => {
    expect(partsLoad({ words: ['cake'], sep: '', changes: [], extras: '' })).toBeCloseTo(2.56)
    expect(partsLoad({ words: ['cake'], sep: '', changes: [ch('C')], extras: '7' })).toBeCloseTo(2.56 + 1.09 + 1)
    // A digit or symbol change weighs about twice a capital; an extra symbol more than an extra digit.
    expect(partsLoad({ words: ['cake'], sep: '', changes: [ch('4')], extras: '' })).toBeCloseTo(2.56 + 2.23)
    expect(partsLoad({ words: ['cake'], sep: '', changes: [], extras: '#' })).toBeCloseTo(2.56 + 1.56)
    // Two words run together cost more than with a separator.
    const apart = partsLoad({ words: ['cake', 'oak'], sep: '-', changes: [], extras: '' })
    expect(partsLoad({ words: ['cake', 'oak'], sep: '', changes: [], extras: '' }) - apart).toBeCloseTo(1.79)
  })

  it('counts the show time: more time is lighter', () => {
    const p = { words: ['cake'], sep: '', changes: [], extras: '' }
    expect(loadOf(p, 4000)).toBeCloseTo(partsLoad(p))
    expect(loadOf(p, 5000)).toBeCloseTo(partsLoad(p) - 0.4)
    expect(loadOf(p, 3000)).toBeCloseTo(partsLoad(p) + 0.4)
  })

  it('makes passwords close to the asked load, quickly', () => {
    const start = Date.now()
    for (let load = START_LOAD; load <= 26; load += 0.5) {
      for (let i = 0; i < 40; i++) {
        const ms = showMsFor(load)
        expect(Math.abs(loadOf(passwordForLoad(load, ms), ms) - load)).toBeLessThanOrEqual(LOAD_TOLERANCE + 1e-9)
      }
    }
    expect(Date.now() - start).toBeLessThan(5000)
  })

  it('mixes the parts: one word or several, changes and extras', () => {
    const ps = Array.from({ length: 400 }, () => passwordForLoad(12, 5000))
    const words = new Set(ps.map((p) => p.words.length))
    expect([...words].sort()).toEqual([1, 2, 3])
    expect(ps.some((p) => p.changes.length >= 3)).toBe(true)
    expect(ps.some((p) => p.extras.length >= 4)).toBe(true)
    expect(ps.some((p) => p.changes.length === 0)).toBe(true)
  })
})

describe('password memory: the climb', () => {
  const rights = (n: number) => {
    let c = startClimb()
    const loads = [c.load]
    for (let i = 0; i < n; i++) loads.push((c = afterRight(c)).load)
    return { c, loads }
  }

  it('climbs by 2 until load 8, then by 1', () => {
    expect(rights(6).loads).toEqual([4, 6, 8, 9, 10, 11, 12])
  })

  it('halves the step after a miss and goes on from the last confirmed load', () => {
    // Miss at 12 after 11: on at 11.5, then 0.5 steps.
    let c = afterMiss(rights(6).c)
    expect(c.load).toBe(11.5)
    expect(afterRight(c).load).toBe(12)
    // At the 0.5 step a miss repeats the same load.
    c = afterMiss(afterRight(c))
    expect(c.load).toBe(12)
    // An early miss (at 6 after 4) only halves to 1: 5, 6, 7, 8, 9 …
    let e = afterMiss(rights(1).c)
    expect(e.load).toBe(5)
    const loads = [e.load]
    for (let i = 0; i < 4; i++) loads.push((e = afterRight(e)).load)
    expect(loads).toEqual([5, 6, 7, 8, 9])
    // A miss before anything was confirmed repeats the start.
    expect(afterMiss(startClimb()).load).toBe(START_LOAD)
  })

  it('numbers levels in half-load steps', () => {
    expect(levelOf(4)).toBe(1)
    expect(levelOf(4.5)).toBe(2)
    expect(levelOf(11.5)).toBe(16)
    expect(loadOfLevel(16)).toBe(11.5)
  })

  it('shows longer as the load grows: 3 s, +0.5 s per load, 5 s from load 8', () => {
    expect([4, 5, 6, 7, 8, 12].map(showMsFor)).toEqual([3000, 3500, 4000, 4500, 5000, 5000])
  })

  // A simulated player: the chance of a right answer falls with the load around their 50 % point, as steeply as in
  // the lab data (0.63 per load).
  const run = (theta: number, rand: () => number) => {
    let c = startClimb()
    let lives = LIVES
    let best = 0
    let rounds = 0
    while (lives > 0 && rounds < 300) {
      rounds++
      if (rand() < 1 / (1 + Math.exp(0.63 * (c.load - theta)))) {
        best = Math.max(best, c.load)
        c = afterRight(c)
      } else {
        lives--
        c = afterMiss(c)
      }
    }
    return { best, rounds }
  }
  const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)

  it('scores a player near their 50 % point, steadily, in a reasonable number of rounds', () => {
    const rand = seeded(7)
    for (const theta of [7, 11.5, 16]) {
      const runs = Array.from({ length: 3000 }, () => run(theta, rand))
      const mean = runs.reduce((a, r) => a + r.best, 0) / runs.length
      const sd = Math.sqrt(runs.reduce((a, r) => a + (r.best - mean) ** 2, 0) / runs.length)
      const rounds = runs.reduce((a, r) => a + r.rounds, 0) / runs.length
      expect(Math.abs(mean - theta)).toBeLessThan(1)
      expect(sd).toBeLessThan(1.6)
      expect(rounds).toBeLessThan(theta + 4)
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
