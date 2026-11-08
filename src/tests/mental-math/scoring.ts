import { randInt, type Rand } from '../../lib/random'

export const DURATION_MS = 60_000
export const MAX_LEVEL = 5
export const CORRECT_PER_LEVEL = 5

export type Op = '+' | '−' | '×' | '÷'
export interface Problem { a: number; b: number; op: Op; answer: number }

export const levelFor = (correct: number) => Math.min(MAX_LEVEL, Math.floor(correct / CORRECT_PER_LEVEL))

/** Answers are always non-negative integers; numbers grow with level. */
export function makeProblem(level: number, rand: Rand = Math.random): Problem {
  const ops: Op[] = ['+', '−', '×', '÷']
  const op = ops[Math.floor(rand() * ops.length)]
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
