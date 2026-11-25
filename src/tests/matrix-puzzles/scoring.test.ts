import { describe, expect, it } from 'vitest'
import {
  ATTRS, MIN_PENALTY_MS, PENALTY_MS, RANGE, bits, isUnique, levelOf, levelSpec, makePuzzle, penaltyMs,
  predictions, rot, sameCell, type Cell,
} from './scoring'

const col = (cells: Cell[], a: keyof Cell) => cells.map((c) => c[a])

describe('matrix puzzles: generation', () => {
  for (let level = 1; level <= 6; level++) {
    it(`level ${level}: valid cells, one answer under every rule, 8 distinct options`, () => {
      const spec = levelSpec(level)
      for (let n = 0; n < 300; n++) {
        const p = makePuzzle(level)
        expect(p.rules).toHaveLength(spec.changing)
        expect(p.rules.some((r) => r.kind !== 'same')).toBe(true)
        expect(p.rules.every((r) => spec.attrs.includes(r.attr))).toBe(true)
        expect(p.rules.every((r) => ['same', 'step', 'three', ...spec.twists].includes(r.kind))).toBe(true)
        if (!spec.cols) expect(p.rules.every((r) => r.dir === 'row')).toBe(true)
        // Number and size never change together; size only varies with a single copy.
        expect(p.rules.some((r) => r.attr === 'count') && p.rules.some((r) => r.attr === 'size')).toBe(false)
        for (const c of [...p.cells, ...p.options]) {
          for (const a of ATTRS) {
            expect(c[a]).toBeGreaterThanOrEqual(RANGE[a][0])
            expect(c[a]).toBeLessThanOrEqual(RANGE[a][1])
          }
          if (c.count > 1) expect(c.size).toBe(1)
        }
        // Fixed features are the same everywhere; every feature has exactly one answer, under any rule.
        for (const a of ATTRS) if (!p.rules.some((r) => r.attr === a)) expect(new Set(col(p.cells, a)).size).toBe(1)
        expect(isUnique(p.cells)).toBe(true)
        expect(new Set(p.options.map((o) => JSON.stringify(o))).size).toBe(8)
        expect(sameCell(p.options[p.answer], p.cells[8])).toBe(true)
        // No wrong option completes the grid under any rule.
        for (const [i, o] of p.options.entries()) if (i !== p.answer) expect(isUnique([...p.cells.slice(0, 8), o])).toBe(false)
      }
    })
  }

  it('options are balanced: every value is in exactly half or all of the options', () => {
    for (let n = 0; n < 1500; n++) {
      const p = makePuzzle(1 + (n % 5))
      for (const a of ATTRS) {
        const counts = new Map<number, number>()
        p.options.forEach((o) => counts.set(o[a], (counts.get(o[a]) ?? 0) + 1))
        expect([...counts.values()].sort().join()).toMatch(/^(8|4,4)$/)
      }
    }
  })

  it('the new rules show up from their level on', () => {
    const seen = (level: number) => {
      const kinds = new Set<string>()
      for (let n = 0; n < 400; n++) for (const r of makePuzzle(level).rules) kinds.add(`${r.attr}:${r.kind}:${r.dir}`)
      return [...kinds]
    }
    expect(seen(1).every((k) => !k.startsWith('dots') && !k.startsWith('stripe'))).toBe(true)
    expect(seen(3)).toContain('dots:or:row')
    const l4 = seen(4)
    expect(l4.some((k) => k.endsWith(':col'))).toBe(true)
    expect(l4.some((k) => k.startsWith('dots:xor'))).toBe(true)
    expect(seen(5)).toContain('dots:rowcol:row')
  })

  it('dots stay readable: rules use few dots per cell', () => {
    for (let n = 0; n < 500; n++) {
      const p = makePuzzle(3 + (n % 3))
      for (const c of p.cells) expect(bits(c.dots)).toBeLessThanOrEqual(6)
    }
  })

  it('the check catches a row that two dot rules read differently', () => {
    // Rows 1–2 share no dots, so "all dots" and "shared dots disappear" both fit; row 3 shares one, so they differ.
    const dots = [0b1, 0b10, 0b11, 0b100, 0b1000, 0b1100, 0b10001, 0b10000, 0]
    expect(predictions('dots', dots)).toEqual(new Set([0b10001, 0b1]))
    expect(rot(0b10000001, 1)).toBe(0b11)
  })

  it('levels: 2, 2, 3, 3 solved puzzles, then level 5', () => {
    expect([0, 1, 2, 3, 4, 6, 7, 9, 10, 30].map(levelOf)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
  })

  it('level 1 has no stripes: no option differs in them', () => {
    for (let n = 0; n < 300; n++) {
      const p = makePuzzle(1)
      expect(p.stripes).toBe(false)
      expect(new Set(p.options.map((o) => o.stripe)).size).toBe(1)
    }
    expect(makePuzzle(2).stripes).toBe(true)
  })

  it('a retry keeps the rules (kind, feature, direction) with new values', () => {
    for (let n = 0; n < 300; n++) {
      const first = makePuzzle(1 + (n % 5))
      const again = makePuzzle(first.level, Math.random, first.rules)
      expect(again.rules).toEqual(first.rules)
      expect(isUnique(again.cells)).toBe(true)
    }
  })

  it('a wrong answer costs at least 15 s on the puzzle, and always at least 5 s', () => {
    expect(penaltyMs(0)).toBe(PENALTY_MS)
    expect(penaltyMs(6_000)).toBe(9_000)
    expect(penaltyMs(12_000)).toBe(MIN_PENALTY_MS)
    expect(penaltyMs(60_000)).toBe(MIN_PENALTY_MS)
  })

})
