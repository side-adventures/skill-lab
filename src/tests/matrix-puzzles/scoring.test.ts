import { describe, expect, it } from 'vitest'
import { ATTRS, RANGE, changingOf, levelOf, makePuzzle, puzzleMs, sameCell, type Attr, type Cell } from './scoring'

const col = (cells: Cell[], a: Attr) => cells.map((c) => c[a])
const row = (xs: number[], r: number) => xs.slice(r * 3, r * 3 + 3)

/** Does the feature follow its rule in all three rows (the third row with the answer)? */
function follows(xs: number[], kind: string | undefined) {
  if (!kind) return xs.every((x) => x === xs[0])
  const rows = [0, 1, 2].map((r) => row(xs, r))
  if (kind === 'row') return rows.every((r) => r[0] === r[1] && r[1] === r[2])
  if (kind === 'three') {
    const set = [...new Set(rows[0])].sort().join()
    return new Set(rows[0]).size === 3 && rows.every((r) => [...new Set(r)].sort().join() === set)
  }
  const step = rows[0][1] - rows[0][0]
  return Math.abs(step) === 1 && rows.every((r) => r[1] - r[0] === step && r[2] - r[1] === step)
}

describe('matrix puzzles: generation', () => {
  for (let level = 1; level <= 6; level++) {
    it(`level ${level}: every feature follows its rule, 8 distinct options, one answer`, () => {
      for (let n = 0; n < 400; n++) {
        const p = makePuzzle(level)
        expect(p.rules).toHaveLength(changingOf(level))
        expect(p.rules.some((r) => r.kind !== 'row')).toBe(true)
        expect(p.rules.some((r) => r.attr === 'count') && p.rules.some((r) => r.attr === 'size')).toBe(false)
        for (const a of ATTRS) {
          const rule = p.rules.find((r) => r.attr === a)
          expect(follows(col(p.cells, a), rule?.kind)).toBe(true)
          for (const c of [...p.cells, ...p.options]) {
            expect(c[a]).toBeGreaterThanOrEqual(RANGE[a][0])
            expect(c[a]).toBeLessThanOrEqual(RANGE[a][1])
          }
        }
        expect(new Set(p.options.map((o) => JSON.stringify(o))).size).toBe(8)
        expect(sameCell(p.options[p.answer], p.cells[8])).toBe(true)
        // No wrong option also completes the grid by the same rules.
        for (const [i, o] of p.options.entries()) {
          if (i === p.answer) continue
          const cells = [...p.cells.slice(0, 8), o]
          const fits = ATTRS.every((a) => follows(col(cells, a), p.rules.find((r) => r.attr === a)?.kind))
          expect(fits).toBe(false)
        }
      }
    })
  }

  it('options are balanced: every value is in exactly half or all of the options', () => {
    for (let n = 0; n < 2000; n++) {
      const p = makePuzzle(1 + (n % 5))
      for (const a of ATTRS) {
        const counts = new Map<number, number>()
        p.options.forEach((o) => counts.set(o[a], (counts.get(o[a]) ?? 0) + 1))
        expect([...counts.values()].sort().join()).toMatch(/^(8|4,4)$/)
      }
    }
  })

  it('levels and time per puzzle', () => {
    expect([0, 1, 2, 5, 6, 20].map((s) => changingOf(levelOf(s)))).toEqual([1, 1, 2, 3, 3, 3])
    expect(puzzleMs(0)).toBe(45_000)
    expect(puzzleMs(5)).toBe(45_000)
    expect(puzzleMs(8)).toBe(36_000)
    expect(puzzleMs(40)).toBe(20_000)
  })
})
