import { describe, expect, it } from 'vitest'
import { DEFAULT_OPTIONS, KINDS, LEVELS, LEVEL_PLAN, PARTS, key, levelOfRound, makeLabPuzzle, type LabOptions, type Part } from './lab'

describe('matrix lab: puzzles', () => {
  for (const kind of KINDS) {
    it(`${kind}: 9 cells, 8 distinct valid options, the answer among them`, () => {
      const mixed: LabOptions = { ...DEFAULT_OPTIONS, kinds: [kind], mode: 'mixed' }
      const two: LabOptions = { ...DEFAULT_OPTIONS, kinds: [kind], mode: 'twoHard' }
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
          expect((c.nest as number[]).every((x) => [0, 1, 2, 4, 5].includes(x))).toBe(true)
        }
        p.rules.forEach((r) => ids.add(r.id))
      }
      expect(ids.size).toBeGreaterThan(1)
    })
  }

  it('number rules: doubling across rows and columns stays within 8 copies', () => {
    for (let n = 0; n < 300; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['copies'], numbers: ['grid'] })
      for (const c of p.cells) expect(c.count).toBeLessThanOrEqual(8)
      expect(p.rules.some((r) => r.id === 'count:grid')).toBe(true)
    }
  })

  it('shape in shape chain: each inner shape is the next outer one', () => {
    let seen = 0
    for (let n = 0; n < 400 && seen < 30; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['nest'], cols: false })
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
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['order'], cols: false })
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
    for (let n = 0; n < 600; n++) makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['nest'] }).rules.forEach((r) => ids.add(r.id))
    for (const id of ['nest:chain', 'nest:chain-back', 'nest:combine', 'nest:combine-back']) expect(ids).toContain(id)
    expect(ids).not.toContain('nest:swap')
  })

  it('2 hard: exactly a hard figure rule and a hard dot rule, options split 4 × 2 between them', () => {
    for (let n = 0; n < 500; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'twoHard' })
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
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['copies'], numbers: ['step', 'plus', 'double', 'grid'] })
      for (const c of p.cells) { expect(c.count).toBeLessThanOrEqual(9); if (c.count === 9) nine++ }
      for (const r of [0, 3, 6]) expect([p.cells[r].count, p.cells[r + 1].count, p.cells[r + 2].count].join()).not.toMatch(/^(1,3,9|9,3,1)$/)
    }
    expect(nine).toBeGreaterThan(0)
  })

  it('shape sets keep reading order: the 1st cell\'s shapes first', () => {
    let seen = 0
    for (let n = 0; n < 400; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['set'] })
      const r = p.rules.find((x) => x.part === 'set')!
      if (!r) continue
      seen++
      const g = p.cells.map((c) => c.set as number[])
      const lines = r.dir === 'col' ? [[0, 3, 6], [1, 4, 7], [2, 5, 8]] : [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
      for (const [i, j, k] of lines) {
        const [a, b] = [g[i], g[j]]
        const want = r.id === 'set:or'
          ? [...a, ...b.filter((x) => !a.includes(x))]
          : [...a.filter((x) => !b.includes(x)), ...b.filter((x) => !a.includes(x))]
        expect(g[k]).toEqual(want)
      }
    }
    expect(seen).toBeGreaterThan(50)
  })

  it('every rule has a level; A + B never reads as a step; no end swap; nest fills each once', () => {
    for (let n = 0; n < 1500; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: n % 3 === 0 ? 'twoHard' : 'mixed', numbers: ['plus', 'double', 'grid', 'step'] })
      for (const r of p.rules) {
        expect(LEVELS[r.id], r.id).toBeDefined()
        expect(r.level).toBe(LEVELS[r.id])
        expect(r.id).not.toBe('order:ends')
        if (r.id === 'count:plus') {
          const lines = r.dir === 'col' ? [[0, 3, 6], [1, 4, 7], [2, 5, 8]] : [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
          for (const [i, j] of lines) expect(p.cells[j].count).not.toBe(2 * (p.cells[i].count as number))
        }
        if (r.part === 'ofill' || r.part === 'ifill') expect(r.id).toMatch(/three$/)
      }
    }
  })

  it('shape in shape, own rules: no line is the same figure three times', () => {
    let seen = 0
    for (let n = 0; n < 800; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', kinds: ['nest'] })
      const r = p.rules.find((x) => x.id === 'nest:parts')
      if (!r) continue
      seen++
      const g = p.cells.map((c) => key(c.nest))
      const lines = r.dir === 'col' ? [[0, 3, 6], [1, 4, 7], [2, 5, 8]] : [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
      expect(lines.some(([a, b, c]) => g[a] === g[b] && g[b] === g[c])).toBe(false)
    }
    expect(seen).toBeGreaterThan(25)
  })

  it('no moon or bolt anywhere', () => {
    for (let n = 0; n < 1500; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: n % 2 === 0 ? 'twoHard' : 'mixed' })
      for (const c of [...p.cells, ...p.options]) {
        const ids = [c.shape, ...((c.order as number[]) ?? []), ...((c.set as number[]) ?? []), ...((c.nest as number[]) ?? [])].filter((x) => x !== undefined)
        expect(ids.some((x) => x === 6 || x === 8)).toBe(false)
      }
    }
  })

  it('levels mode: each puzzle has one of its level\'s combinations, at least one on the figure', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 30].map(levelOfRound)).toEqual([1, 2, 3, 3, 4, 4, 5, 5])
    const sig = (xs: string[]) => [...xs].sort().join('+')
    for (let n = 0; n < 1200; n++) {
      const round = 1 + (n % 8)
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'levels' }, Math.random, round)
      expect(p.level).toBe(levelOfRound(round))
      const allowed = LEVEL_PLAN[p.level! - 1].map(sig)
      expect(allowed).toContain(sig(p.rules.map((r) => r.level)))
      expect(p.rules.some((r) => !['dots', 'stripe'].includes(r.part))).toBe(true)
    }
  })

  it('a fixed level always gives that level', () => {
    const sig = (xs: string[]) => [...xs].sort().join('+')
    for (let n = 0; n < 300; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'levels', fixedLevel: 5 }, Math.random, 1)
      expect(p.level).toBe(5)
      expect(LEVEL_PLAN[4].map(sig)).toContain(sig(p.rules.map((r) => r.level)))
    }
  })

  it('2 random rules: two parts, at least one on the figure, and every level comes up', () => {
    const levels = new Set<string>()
    for (let n = 0; n < 600; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'random2' })
      expect(p.rules).toHaveLength(2)
      expect(new Set(p.rules.map((r) => r.part)).size).toBe(2)
      expect(p.rules.some((r) => !['dots', 'stripe'].includes(r.part))).toBe(true)
      p.rules.forEach((r) => levels.add(r.level))
    }
    expect([...levels].sort()).toEqual(['easy', 'hard', 'medium'])
  })

  it('what does not change stays plain: no stripes, white shapes', () => {
    for (let n = 0; n < 600; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'levels' }, Math.random, 1 + (n % 8))
      const changing = new Set(p.rules.map((r) => r.part))
      for (const c of p.cells) {
        if (!changing.has('stripe')) expect(c.stripe).toBe(-1)
        for (const f of ['fill', 'ofill', 'ifill'] as Part[]) if (f in c && !changing.has(f)) expect(c[f]).toBe(2)
      }
    }
  })

  it('no stripes, no dots and rows only when turned off', () => {
    for (let n = 0; n < 200; n++) {
      const p = makeLabPuzzle({ ...DEFAULT_OPTIONS, mode: 'mixed', stripes: false, dots: 'off', cols: false })
      expect(p.cells.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.options.every((c) => c.stripe === -1 && c.dots === 0)).toBe(true)
      expect(p.rules.some((r) => r.part === 'dots' || r.dir === 'col')).toBe(false)
    }
  })
})
