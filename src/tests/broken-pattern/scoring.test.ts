import { describe, expect, it } from 'vitest'
import { fitsExcept, isAmbiguous, levelOf, levelSpec, makePattern, quadrantBag, quadrantCells, tilesChanged } from './scoring'

describe('broken pattern: generation', () => {
  for (let level = 1; level <= 7; level++) {
    it(`level ${level}: exactly one tile breaks the rule, inside the board, in the asked quadrant`, () => {
      for (let n = 0; n < 300; n++) {
        const q = n % 4
        const p = makePattern(level, q)
        const { size } = levelSpec(level)
        expect(p.tiles).toHaveLength(size * size)
        expect(quadrantCells(size, q)).toContain(p.broken)
        // The board follows its rules everywhere but at the broken tile, and breaks them there.
        for (const rule of p.rules) {
          const xs = p.tiles.map((t) => t[rule.attr])
          expect(fitsExcept(xs, size, p.broken)).toBe(true)
        }
        expect(p.rules.some((rule) => !fitsExcept(p.tiles.map((t) => t[rule.attr]), size, -1))).toBe(true)
        // The broken tile is an ordinary tile: its kind and turn appear elsewhere on the board too.
        const b = p.tiles[p.broken]
        expect(p.tiles.some((t, i) => i !== p.broken && t.kind === b.kind && t.rot === b.rot)).toBe(true)
        expect(isAmbiguous(p)).toBe(false)
      }
    })
  }

  it('a new board never looks like the previous one (at least half the tiles differ)', () => {
    for (let level = 1; level <= 6; level++) {
      let prev = makePattern(level, 0)
      for (let n = 0; n < 200; n++) {
        const p = makePattern(level, n % 4, prev)
        expect(tilesChanged(p, prev) * 2).toBeGreaterThanOrEqual(p.tiles.length)
        prev = p
      }
    }
  })

  it('quadrant cells: interior only, 4 quadrants of equal size', () => {
    for (const size of [4, 5, 6]) {
      const all = [0, 1, 2, 3].map((q) => quadrantCells(size, q))
      expect(new Set(all.map((x) => x.length)).size).toBe(1)
      for (const i of all.flat()) {
        const r = Math.floor(i / size), c = i % size
        expect(r > 0 && c > 0 && r < size - 1 && c < size - 1).toBe(true)
      }
    }
  })

  it('the quadrant bag gives each quadrant once per 4 patterns', () => {
    const next = quadrantBag()
    for (let k = 0; k < 5; k++) expect([next(), next(), next(), next()].sort().join()).toBe('0,1,2,3')
  })

  it('levels go up every 3 correct answers', () => {
    expect([0, 2, 3, 6, 50].map(levelOf)).toEqual([1, 1, 2, 3, 17])
  })
})
