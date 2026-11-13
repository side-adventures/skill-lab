import { fmtMs } from '../../lib/resultFormat'
import { randInt, type Rand } from '../../lib/random'
import type { ResultExtra } from '../types'

export const DURATION_MS = 60_000
export const MAX_LEVEL = 5
export const CORRECT_PER_LEVEL = 5

export type Op = '+' | '−' | '×' | '÷'
export const OPS: Op[] = ['+', '−', '×', '÷']
export interface Problem { a: number; b: number; op: Op; answer: number }

export const levelFor = (correct: number) => Math.min(MAX_LEVEL, Math.floor(correct / CORRECT_PER_LEVEL))

/** Answers are always non-negative integers; numbers grow with level. */
export function makeProblem(level: number, rand: Rand = Math.random): Problem {
  const op = OPS[Math.floor(rand() * OPS.length)]
  const big = 20 + 10 * level
  switch (op) {
    case '+': {
      const a = randInt(2, big, rand), b = randInt(2, big, rand)
      return { a, b, op, answer: a + b }
    }
    case '−': {
      const a = randInt(5, big, rand), b = randInt(2, a, rand)
      return { a, b, op, answer: a - b }
    }
    case '×': {
      const a = randInt(2, 9 + level, rand), b = randInt(2, 9, rand)
      return { a, b, op, answer: a * b }
    }
    case '÷': {
      const b = randInt(2, 9, rand), q = randInt(2, 9 + level, rand)
      return { a: b * q, b, op, answer: q }
    }
  }
}


/** Result table, one row per operation you got: correct, wrong and average time per answer. */
export function operationTable(answers: { op: Op; correct: boolean; ms: number }[]): ResultExtra {
  return {
    kind: 'table',
    columns: ['Operation', 'Correct', 'Wrong', 'Avg time'],
    rows: OPS.flatMap((op) => {
      const xs = answers.filter((a) => a.op === op)
      if (!xs.length) return []
      const ok = xs.filter((a) => a.correct).length
      return [{ cells: [op, String(ok), String(xs.length - ok), fmtMs(xs.reduce((t, a) => t + a.ms, 0) / xs.length)] }]
    }),
  }
}
