import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, KINDS, PARTS, key, makeLabPuzzle, type LabOptions, type Part } from './lab'

describe('matrix lab: puzzles', () => {
  for (const kind of KINDS) {
    it(`${kind}: 9 cells, 8 distinct valid options, the answer among them`, () => {
      const mixed: LabOptions = { ...DEFAULT_OPTIONS, kinds: [kind], twoHard: false }
      const two: LabOptions = { ...DEFAULT_OPTIONS, kinds: [kind], twoHard: true }
      const ids = new Set<string>()
      for (let n = 0; n < 400; n++) {
        const p = makeLabPuzzle(n % 2 ? mixed : two)
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
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, kinds: ['copies'], numbers: ['grid'] })
      for (const c of p.cells) expect(c.count).toBeLessThanOrEqual(8)
      expect(p.rules.some((r) => r.id === 'count:grid')).toBe(true)
    }
  })

  it('shape in shape chain: each inner shape is the next outer one', () => {
    let seen = 0
    for (let n = 0; n < 400 && seen < 30; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, kinds: ['nest'], cols: false })
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

  it('shape order window: 3 of 4 shapes show, moving one place per cell', () => {
    let seen = 0
    for (let n = 0; n < 600 && seen < 30; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, kinds: ['order'], cols: false })
      if (!p.rules.some((r) => r.id === 'order:window')) continue
      seen++
      const g = p.cells.map((c) => c.order as number[])
      for (const r of [0, 3, 6]) for (const c of [0, 1]) {
        const [a, b] = [g[r + c], g[r + c + 1]]
        // Two shapes carry over, one place moved along.
        expect(a[1] === b[0] && a[2] === b[1] || a[0] === b[1] && a[1] === b[2]).toBe(true)
      }
      expect(new Set(g.slice(6).flat()).size).toBe(4)
    }
    expect(seen).toBeGreaterThan(5)
  })

  it('shape in shape: both chain directions and both combine orders come up', () => {
    const ids = new Set<string>()
    for (let n = 0; n < 600; n++) makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, kinds: ['nest'] }).rules.forEach((r) => ids.add(r.id))
    for (const id of ['nest:chain', 'nest:chain-back', 'nest:combine', 'nest:combine-back', 'nest:swap']) expect(ids).toContain(id)
  })

  it('2 hard: exactly a hard figure rule and a hard dot rule, options split 4 × 2 between them', () => {
    for (let n = 0; n < 500; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: true })
      expect(p.rules).toHaveLength(2)
      expect(p.rules.every((r) => r.hard)).toBe(true)
      expect(p.rules.some((r) => r.part === 'dots')).toBe(true)
      const varied = (Object.keys(p.cells[0]) as Part[]).filter((pt) => new Set(p.options.map((o) => key(o[pt]))).size > 1)
      expect(varied.sort()).toEqual(p.rules.map((r) => r.part).sort())
    }
  })

  it('copies go up to 9, never tripling', () => {
    let nine = 0
    for (let n = 0; n < 1500; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, kinds: ['copies'], numbers: ['step', 'plus', 'double', 'grid'] })
      for (const c of p.cells) { expect(c.count).toBeLessThanOrEqual(9); if (c.count === 9) nine++ }
      for (const r of [0, 3, 6]) expect([p.cells[r].count, p.cells[r + 1].count, p.cells[r + 2].count].join()).not.toMatch(/^(1,3,9|9,3,1)$/)
    }
    expect(nine).toBeGreaterThan(0)
  })

  it('no stripes, no dots and rows only when turned off', () => {
    for (let n = 0; n < 200; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, twoHard: false, stripes: false, dots: 'off', cols: false })
      expect(p.cells.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.options.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.rules.some((r) => r.part === 'dots' || r.dir === 'col')).toBe(false)
    }
  })
})
