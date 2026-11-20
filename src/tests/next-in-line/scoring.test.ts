import { describe, expect, it } from 'vitest'
import { ATTRS, SHOWN, levelOf, levelSpec, makeSeries, sameFig, type Fig } from './scoring'

const RANGE = { shape: [0, 2], fill: [0, 2], hand: [0, 7], dots: [1, 7], marker: [0, 3] } as const

describe('next in line: series generation', () => {
  for (let level = 1; level <= 9; level++) {
    it(`level ${level}: valid series and options`, () => {
      for (let n = 0; n < 400; n++) {
        const s = makeSeries(level)
        expect(s.figs).toHaveLength(SHOWN + 1)
        expect(s.rules).toHaveLength(levelSpec(level).rules)
        expect(s.rules.filter((r) => r.hard)).toHaveLength(levelSpec(level).hard)
        for (const f of [...s.figs, ...s.options]) {
          for (const a of ATTRS) {
            expect(f[a]).toBeGreaterThanOrEqual(RANGE[a][0])
            expect(f[a]).toBeLessThanOrEqual(RANGE[a][1])
          }
        }
        // Every rule attribute really changes from figure to figure; every other one stays fixed.
        for (const a of ATTRS) {
          const changes = s.figs.slice(1).every((f, i) => f[a] !== s.figs[i][a])
          const fixed = s.figs.every((f) => f[a] === s.figs[0][a])
          expect(s.rules.some((r) => r.attr === a) ? changes : fixed).toBe(true)
        }
        // 4 different options, exactly one is the answer.
        expect(s.options).toHaveLength(4)
        expect(new Set(s.options.map((o) => JSON.stringify(o))).size).toBe(4)
        expect(sameFig(s.options[s.answer], s.figs[SHOWN])).toBe(true)
        expect(s.options.filter((o) => sameFig(o, s.figs[SHOWN]))).toHaveLength(1)
      }
    })
  }

  it('options are balanced: no value appears in most options, so the answer cannot be found by majority', () => {
    for (let n = 0; n < 2000; n++) {
      const s = makeSeries(1 + (n % 7))
      for (const a of ATTRS) {
        const counts = new Map<number, number>()
        s.options.forEach((o: Fig) => counts.set(o[a], (counts.get(o[a]) ?? 0) + 1))
        // Either all four share the value (attribute not used for options) or it splits 2 / 2.
        expect([...counts.values()].sort().join()).toMatch(/^(4|2,2)$/)
      }
    }
  })

  it('the answer sits in each place about equally often', () => {
    const at = [0, 0, 0, 0]
    for (let n = 0; n < 8000; n++) at[makeSeries(3).answer]++
    for (const c of at) expect(c / 8000).toBeGreaterThan(0.22)
  })

  it('levels go up every 4 correct answers', () => {
    expect([0, 3, 4, 7, 8, 30].map(levelOf)).toEqual([1, 1, 2, 2, 3, 8])
    expect(levelSpec(40)).toEqual(levelSpec(7))
  })
})
