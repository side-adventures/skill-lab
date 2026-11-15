import { fmtMs } from '../../lib/resultFormat'
import { randInt, shuffle, type Rand } from '../../lib/random'
import type { ResultExtra } from '../types'

export const DURATION_MS = 60_000
export const MAX_LEVEL = 4
export const CORRECT_PER_LEVEL = 4

export type Op = '+' | '−' | '×' | '÷'
export const OPS: Op[] = ['+', '−', '×', '÷']
export interface Problem { a: number; b: number; op: Op; answer: number }

export const levelFor = (correct: number) => Math.min(MAX_LEVEL, Math.floor(correct / CORRECT_PER_LEVEL))

const ones = (x: number) => x % 10
const tens = (x: number) => Math.floor(x / 10) % 10

/** A number of the given digits that isn't a multiple of 10 (30 + 5 is too easy). */
const notRound = (min: number, max: number, rand: Rand) => {
  for (;;) {
    const x = randInt(min, max, rand)
    if (ones(x) !== 0) return x
  }
}
const twoDigit = (rand: Rand) => notRound(11, 99, rand)

/**
 * An addition x + y for a level (0-based); y is the smaller part:
 * 0: anything from 2 up + a 1-digit number, sum at most 99 (carry or not) · 1: 2-digit + 2-digit, no carry ·
 * 2: 2-digit + 2-digit, carry, under 100 · 3: 2-digit + 2-digit, carry, over 100 ·
 * 4: 3-digit + 2-digit, at least one carry, under 1000. Never a multiple of 10 above 9 (30 + 5 is too easy).
 */
export function addition(level: number, rand: Rand = Math.random): [number, number] {
  for (;;) {
    if (level === 0) {
      const y = randInt(2, 9, rand), x = randInt(2, 99 - y, rand)
      if (x < 10 || ones(x) !== 0) return [x, y]
      continue
    }
    if (level === 4) {
      const x = notRound(101, 989, rand), y = twoDigit(rand)
      const carry = ones(x) + ones(y) >= 10 || tens(x) + tens(y) >= 10
      if (carry && x + y < 1000) return [x, y]
      continue
    }
    const x = twoDigit(rand), y = twoDigit(rand)
    const carry = ones(x) + ones(y) >= 10
    if (level === 1 && !carry && tens(x) + tens(y) <= 9) return [x, y]
    if (level === 2 && carry && x + y < 100) return [x, y]
    if (level === 3 && carry && x + y > 100) return [x, y]
  }
}

/**
 * A multiplication x × y for a level (0-based). y is the 1-digit factor where there is one;
 * `either` says both factors are alike, so ÷ may divide by either.
 */
export function multiplication(level: number, rand: Rand = Math.random): { x: number; y: number; either: boolean } {
  switch (level) {
    case 0: return { x: randInt(2, 6, rand), y: randInt(2, 6, rand), either: true }
    case 1: return { x: randInt(3, 9, rand), y: randInt(6, 9, rand), either: true }
    case 2: return { x: randInt(11, 15, rand), y: randInt(3, 9, rand), either: false }
    case 3: return { x: randInt(12, 19, rand), y: randInt(3, 9, rand), either: false }
    default:
      return rand() < 0.5
        ? { x: randInt(21, 29, rand), y: randInt(3, 9, rand), either: false }
        : { x: randInt(11, 15, rand), y: randInt(11, 15, rand), either: true }
  }
}

/**
 * One problem of the given operation at a level (0-based). Answers are always whole numbers ≥ 2.
 * − is an addition of the same level backwards (sum − one part), ÷ a multiplication of the same level
 * backwards (product ÷ the 1-digit factor, or either factor when they are alike).
 * Never a problem from `seen` (the run so far; 3 + 4 and 4 + 3 count as the same). Should a level ever run
 * out of new problems, it still never repeats the one just shown.
 */
export function makeProblem(level: number, op: Op, seen: ReadonlySet<string> = new Set(), prev?: Problem, rand: Rand = Math.random): Problem {
  for (let tries = 0; ; tries++) {
    const p = build(level, op, rand)
    if (!seen.has(problemKey(p))) return p
    if (tries > 500 && (!prev || problemKey(p) !== problemKey(prev))) return p
  }
}

/** Identifies a problem for the no-repeat rule; + and × ignore the order of the numbers. */
export const problemKey = ({ a, b, op }: Problem) =>
  op === '+' || op === '×' ? `${Math.min(a, b)}${op}${Math.max(a, b)}` : `${a}${op}${b}`

function build(level: number, op: Op, rand: Rand): Problem {
  const swap = rand() < 0.5
  if (op === '+' || op === '−') {
    const [x, y] = addition(level, rand)
    if (op === '+') return swap ? { a: y, b: x, op, answer: x + y } : { a: x, b: y, op, answer: x + y }
    // Take away the smaller part (level 1 would otherwise give 39 − 34, level 5 a 3-digit − 3-digit);
    // either part at levels 2–4, where both are 2-digit.
    const [keep, take] = level >= 1 && level <= 3 && swap ? [y, x] : [x, y]
    return { a: x + y, b: take, op, answer: keep }
  }
  const { x, y, either } = multiplication(level, rand)
  if (op === '×') return swap ? { a: y, b: x, op, answer: x * y } : { a: x, b: y, op, answer: x * y }
  const [q, d] = either && swap ? [y, x] : [x, y]
  return { a: x * y, b: d, op, answer: q }
}

/**
 * Each level is one shuffled block of the four operations. A wrong answer puts its operation back at the
 * end of the block (or straight again if it was the last one), so a block is done after exactly one correct
 * answer per operation: 4 correct = one level.
 */
export function makeOpQueue(rand: Rand = Math.random) {
  let block: Op[] = []
  return {
    next(): Op {
      if (!block.length) block = shuffle(OPS, rand)
      return block.pop()!
    },
    retry(op: Op) {
      block.unshift(op) // pop takes from the end, so the front is the back of the order
    },
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
