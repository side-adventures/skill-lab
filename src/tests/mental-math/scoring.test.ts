import { describe, expect, it } from 'vitest'
import { MAX_LEVEL, levelFor, makeProblem } from './scoring'

const evaluate = ({ a, b, op }: ReturnType<typeof makeProblem>) =>
  op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b

describe('mental math', () => {
  it('generates correct, non-negative integer answers of at most 3 digits', () => {
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (let i = 0; i < 500; i++) {
        const p = makeProblem(level)
        expect(evaluate(p)).toBe(p.answer)
        expect(Number.isInteger(p.answer) && p.answer >= 0 && p.answer < 1000).toBe(true)
      }
  })
  it('raises level every 5 correct, capped', () => {
    expect([0, 4, 5, 12, 99].map(levelFor)).toEqual([0, 0, 1, 2, MAX_LEVEL])
  })
})
