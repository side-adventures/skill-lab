import { describe, expect, it } from 'vitest'
import { KINDS, SET_SIZES, TRIALS_PER_SIZE, capacity, capacityScore, makeTrials, type Answer } from './scoring'

describe('change detection trials', () => {
  it('has each size equally often, half of them with a change', () => {
    const trials = makeTrials()
    for (const s of SET_SIZES) {
      const ts = trials.filter((t) => t.size === s)
      expect(ts).toHaveLength(TRIALS_PER_SIZE)
      expect(ts.filter((t) => t.changed !== null)).toHaveLength(TRIALS_PER_SIZE / 2)
    }
  })
  it('shows distinct kinds and changes into a kind not on the board', () => {
    for (let k = 0; k < 100; k++)
      for (const t of makeTrials()) {
        const kinds = t.items.map((i) => i.kind)
        expect(new Set(kinds).size).toBe(kinds.length)
        expect(kinds).not.toContain(t.newKind)
        expect(t.newKind).toBeGreaterThanOrEqual(0)
        expect(t.newKind).toBeLessThan(KINDS.length)
      }
  })
})

describe('capacity', () => {
  const answers = (size: number, hits: number, fas: number, n = 5): Answer[] => [
    ...Array.from({ length: n }, (_, i) => ({ size, change: true, saidChange: i < hits })),
    ...Array.from({ length: n }, (_, i) => ({ size, change: false, saidChange: i < fas })),
  ]
  it('is N × (hits − false alarms)', () => {
    expect(capacity(answers(6, 4, 1), 6)!.k).toBeCloseTo(6 * (0.8 - 0.2))
  })
  it('averages sizes 6 and 8 and never goes below 0', () => {
    expect(capacityScore([...answers(4, 5, 0), ...answers(6, 5, 0), ...answers(8, 5, 0)])).toBe(7)
    expect(capacityScore([...answers(6, 0, 5), ...answers(8, 0, 5)])).toBe(0)
  })
  it('guessing "changed" every time scores 0', () => {
    expect(capacityScore([...answers(6, 5, 5), ...answers(8, 5, 5)])).toBe(0)
  })
})
