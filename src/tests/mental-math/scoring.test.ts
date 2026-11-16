import { describe, expect, it } from 'vitest'
import { MAX_LEVEL, OPS, addition, levelFor, makeOpQueue, makeProblem, multiplication, problemKey, type Op, type Problem } from './scoring'

const evaluate = ({ a, b, op }: Problem) =>
  op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b
const ones = (x: number) => x % 10
const digits = (x: number) => String(x).length
const times = <T,>(n: number, f: () => T) => Array.from({ length: n }, f)
const many = (level: number, op: Op, n = 2000) => times(n, () => makeProblem(level, op))

describe('mental math', () => {
  it('generates correct whole-number answers ≥ 2 of at most 3 digits', () => {
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (const op of OPS)
        for (let i = 0; i < 500; i++) {
          const p = makeProblem(level, op)
          expect(p.op).toBe(op)
          expect(evaluate(p)).toBe(p.answer)
          expect(Number.isInteger(p.answer) && p.answer >= 2 && p.answer < 1000).toBe(true)
        }
  })

  it('additions follow the level table (digits and carry)', () => {
    const check = (level: number, ok: (big: number, small: number) => boolean) => {
      for (const [x, y] of times(2000, () => addition(level))) expect(ok(Math.max(x, y), Math.min(x, y))).toBe(true)
    }
    const carry = (x: number, y: number) => ones(x) + ones(y) >= 10
    const tensCarry = (x: number, y: number) => (Math.floor(x / 10) % 10) + (Math.floor(y / 10) % 10) >= 10
    check(0, (x, y) => digits(y) === 1 && x + y <= 99)
    check(1, (x, y) => digits(y) === 2 && x + y < 100)
    check(2, (x, y) => digits(y) === 2 && carry(x, y) && x + y < 100)
    check(3, (x, y) => digits(y) === 2 && carry(x, y) && x + y > 100)
    check(4, (x, y) => digits(x) === 3 && digits(y) === 2 && (carry(x, y) || tensCarry(x, y)) && x + y < 1000)
  })

  it('level 1 + and − pair a 1-digit number with anything up to a result of 99, carry or not', () => {
    const ps = many(0, '+', 3000)
    for (const { a, b, answer } of ps) {
      expect(Math.min(a, b)).toBeLessThan(10)
      expect(answer).toBeLessThanOrEqual(99)
    }
    const carries = new Set(ps.map(({ a, b }) => ones(a) + ones(b) >= 10))
    expect(carries).toEqual(new Set([true, false]))
    for (const { b } of many(0, '−')) expect(b).toBeLessThan(10)
  })

  it('level 5 + and − pair a 3-digit with a 2-digit number', () => {
    for (const { a, b, op, answer } of [...many(4, '+'), ...many(4, '−')]) {
      expect([digits(a), digits(b)].sort()).toEqual([2, 3])
      if (op === '−') expect(digits(answer)).toBe(3)
      expect(answer).toBeLessThan(1000)
    }
  })

  it('subtractions borrow exactly where the matching addition carries', () => {
    const borrow = (a: number, b: number) => ones(a) < ones(b)
    for (const [level, wanted] of [[2, true], [3, true]] as const)
      for (const { a, b } of many(level, '−')) expect(borrow(a, b)).toBe(wanted)
  })

  it('multiplications use the ranges of each level', () => {
    const inRange = (v: number, lo: number, hi: number) => v >= lo && v <= hi
    const fits = (level: number, ok: (x: number, y: number) => boolean) => {
      for (const { x, y } of times(2000, () => multiplication(level))) expect(ok(x, y)).toBe(true)
    }
    fits(0, (x, y) => inRange(x, 2, 6) && inRange(y, 2, 6))
    fits(1, (x, y) => inRange(x, 3, 9) && inRange(y, 6, 9))
    fits(2, (x, y) => inRange(x, 11, 15) && inRange(y, 3, 9))
    fits(3, (x, y) => inRange(x, 16, 19) && inRange(y, 3, 9))
    fits(4, (x, y) => (inRange(x, 21, 29) && inRange(y, 3, 9)) || (inRange(x, 12, 16) && inRange(y, 12, 16)))
    const big = times(5000, () => multiplication(4).x > 20).filter(Boolean).length / 5000
    expect(big).toBeGreaterThan(0.56)
    expect(big).toBeLessThan(0.64)
  })

  it('divides by a factor of the level: 1-digit, or 12–16 in the 12–16 × 12–16 problems', () => {
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (const { a, b } of many(level, '÷')) {
        expect((b >= 2 && b <= 9) || (level === 4 && b >= 12 && b <= 16)).toBe(true)
        if (b >= 12) expect(a / b >= 12 && a / b <= 16).toBe(true)
      }
  })

  it('never gives a problem seen before in the run (3 + 4 and 4 + 3 count as the same)', () => {
    expect(problemKey({ a: 3, b: 4, op: '+', answer: 7 })).toBe(problemKey({ a: 4, b: 3, op: '+', answer: 7 }))
    expect(problemKey({ a: 12, b: 4, op: '÷', answer: 3 })).not.toBe(problemKey({ a: 12, b: 3, op: '÷', answer: 4 }))
    for (let level = 0; level <= MAX_LEVEL; level++)
      for (const op of OPS) {
        const seen = new Set<string>()
        for (let i = 0; i < 12; i++) {
          const p = makeProblem(level, op, seen)
          expect(seen.has(problemKey(p))).toBe(false)
          seen.add(problemKey(p))
        }
      }
  })

  it('still answers when a level has no new problems left, without repeating the last one', () => {
    const seen = new Set<string>()
    let prev: Problem | undefined
    for (let i = 0; i < 60; i++) {
      const p = makeProblem(0, '×', seen, prev)
      if (prev) expect(problemKey(p)).not.toBe(problemKey(prev))
      seen.add(problemKey(p))
      prev = p
    }
  })

  it('gives each operation once per block of four', () => {
    const q = makeOpQueue()
    for (let block = 0; block < 50; block++)
      expect(new Set(Array.from({ length: 4 }, q.next)).size).toBe(4)
  })

  it('brings a wrong operation back at the end of the block, or straight away if it was the last', () => {
    for (let run = 0; run < 50; run++) {
      const q = makeOpQueue()
      const first = q.next()
      q.retry(first)
      const rest = [q.next(), q.next(), q.next(), q.next()]
      expect(rest[3]).toBe(first)
      expect(new Set(rest).size).toBe(4)
      const again = [q.next(), q.next(), q.next(), q.next()]
      q.retry(again[3])
      expect(q.next()).toBe(again[3])
    }
  })

  it('a level is one correct answer per operation, however many wrong ones', () => {
    // Simulate answering: wrong on the first try of every problem, right on the second.
    const q = makeOpQueue()
    let correct = 0
    const tried = new Set<string>()
    const levels: Record<number, Op[]> = {}
    for (let i = 0; correct < 16; i++) {
      const level = levelFor(correct)
      const op = q.next()
      const key = `${correct}-${op}`
      if (!tried.has(key)) { tried.add(key); q.retry(op); continue }
      ;(levels[level] ??= []).push(op)
      correct++
    }
    for (const l of [0, 1, 2, 3]) expect(new Set(levels[l])).toEqual(new Set(OPS))
  })

  it('raises level every 4 correct, capped', () => {
    expect([0, 3, 4, 8, 12, 16, 99].map(levelFor)).toEqual([0, 0, 1, 2, 3, 4, MAX_LEVEL])
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
