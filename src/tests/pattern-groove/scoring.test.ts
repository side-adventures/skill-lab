import { describe, expect, it } from 'vitest'
import { BLOCKS, PADS, SEQUENCE, TOTAL, curve, makePlan, patternBonus, type Press } from './scoring'

describe('pattern groove plan', () => {
  it('the hidden pattern has every pad 3 times and every pair once', () => {
    for (let p = 0; p < PADS; p++) expect(SEQUENCE.filter((x) => x === p)).toHaveLength(3)
    const pairs = SEQUENCE.map((x, i) => `${x}${SEQUENCE[(i + 1) % SEQUENCE.length]}`)
    expect(new Set(pairs).size).toBe(SEQUENCE.length)
  })
  it('has the blocks in order, the random block balanced, and never a pad twice in a row', () => {
    for (let k = 0; k < 200; k++) {
      const plan = makePlan()
      expect(plan).toHaveLength(TOTAL)
      expect(plan.slice(0, BLOCKS[0].presses).every((s) => s.kind === 'pattern')).toBe(true)
      const random = plan.filter((s) => s.kind === 'random')
      expect(random).toHaveLength(BLOCKS[1].presses)
      for (let p = 0; p < PADS; p++) expect(random.filter((s) => s.pad === p)).toHaveLength(BLOCKS[1].presses / PADS)
      for (let i = 1; i < plan.length; i++) expect(plan[i].pad).not.toBe(plan[i - 1].pad)
    }
  })
  it('the pattern blocks repeat with a period of 12', () => {
    const plan = makePlan()
    const first = plan.slice(0, BLOCKS[0].presses)
    for (let i = 12; i < first.length; i++) expect(first[i].pad).toBe(first[i - 12].pad)
  })
})

describe('pattern bonus', () => {
  const run = (pattern: number, random: number): Press[] => [
    ...Array.from({ length: 60 }, () => ({ kind: 'pattern' as const, ms: pattern, clean: true })),
    ...Array.from({ length: 24 }, () => ({ kind: 'random' as const, ms: random, clean: true })),
    ...Array.from({ length: 24 }, () => ({ kind: 'pattern' as const, ms: pattern + 10, clean: true })),
  ]
  it('is the random block minus the pattern around it', () => {
    expect(patternBonus(run(300, 400))).toEqual({ bonus: 95, random: 400, pattern: 305 })
  })
  it('ignores presses after a wrong key', () => {
    const presses = run(300, 400)
    presses[70] = { kind: 'random', ms: 5000, clean: false }
    expect(patternBonus(presses)!.random).toBe(400)
  })
  it('gives one value per pass of 12', () => {
    expect(curve(run(300, 400))).toHaveLength(9)
  })
})
