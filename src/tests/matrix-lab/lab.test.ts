import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, KINDS, PARTS, key, makeLabPuzzle, type LabOptions, type Part } from './lab'

describe('matrix lab: puzzles', () => {
  for (const kind of KINDS) {
    it(`${kind}: 9 cells, 8 distinct valid options, the answer among them`, () => {
      const opts: LabOptions = { ...DEFAULT_OPTIONS, kinds: [kind] }
      const ids = new Set<string>()
      for (let n = 0; n < 400; n++) {
        const p = makeLabPuzzle(opts)
        expect(p.kind).toBe(kind)
        expect(p.cells).toHaveLength(9)
        expect(new Set(p.options.map(key)).size).toBe(8)
        expect(key(p.options[p.answer])).toBe(key(p.cells[8]))
        for (const c of [...p.cells, ...p.options])
          for (const [part, v] of Object.entries(c)) {
            if (part === 'stripe' || (part === 'dots' && v === 0)) continue
            expect(PARTS[part as Part].valid(v!), `${part} ${key(v)}`).toBe(true)
          }
        // The options split 4 ways on the focus part (8 when nothing else changes), and only changing parts vary.
        const changing = new Set(p.rules.map((r) => r.part))
        const varied = (Object.keys(p.cells[0]) as Part[]).filter((pt) => new Set(p.options.map((o) => key(o[pt]))).size > 1)
        expect(varied.every((pt) => changing.has(pt))).toBe(true)
        expect(new Set(p.options.map((o) => key(o[p.focus]))).size).toBe(varied.length > 1 ? 4 : 8)
        if (kind === 'nest') for (const c of [...p.cells, ...p.options]) {
          expect(c.ofill).not.toBe(c.ifill)
          expect((c.nest as number[]).every((x) => [0, 1, 2, 4, 5].includes(x))).toBe(true)
        }
        p.rules.forEach((r) => ids.add(r.id))
      }
      expect(ids.size).toBeGreaterThan(1)
    })
  }

  it('number rules: doubling across rows and columns stays within 8 copies', () => {
    for (let n = 0; n < 300; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, kinds: ['copies'], numbers: ['grid'] })
      for (const c of p.cells) expect(c.count).toBeLessThanOrEqual(8)
      expect(p.rules.some((r) => r.id === 'count:grid')).toBe(true)
    }
  })

  it('shape in shape chain: each inner shape is the next outer one', () => {
    let seen = 0
    for (let n = 0; n < 400 && seen < 30; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, kinds: ['nest'], cols: false })
      if (!p.rules.some((r) => r.id === 'nest:chain')) continue
      seen++
      const g = p.cells.map((c) => c.nest as number[])
      for (const r of [0, 3, 6]) {
        expect(g[r][1]).toBe(g[r + 1][0])
        expect(g[r + 1][1]).toBe(g[r + 2][0])
        expect(g[r + 2][1]).toBe(g[r][0])
      }
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('no stripes, no dots and rows only when turned off', () => {
    for (let n = 0; n < 200; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, stripes: false, dots: 'off', cols: false })
      expect(p.cells.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.options.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.rules.some((r) => r.part === 'dots' || r.dir === 'col')).toBe(false)
    }
  })
})
