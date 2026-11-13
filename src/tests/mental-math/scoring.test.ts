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

describe('operation table', () => {
  it('has one row per operation played, in + − × ÷ order', async () => {
    const { operationTable } = await import('./scoring')
    const t = operationTable([
      { op: '×', correct: true, ms: 1000 },
      { op: '+', correct: true, ms: 400 },
      { op: '×', correct: false, ms: 3000 },
    ])
    expect(t).toEqual({
      kind: 'table',
      columns: ['Operation', 'Correct', 'Wrong', 'Avg time'],
      rows: [{ cells: ['+', '1', '0', '400 ms'] }, { cells: ['×', '1', '1', '2.0 s'] }],
    })
  })
})
