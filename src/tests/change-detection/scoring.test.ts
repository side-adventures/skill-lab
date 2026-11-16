import { describe, expect, it } from 'vitest'
import {
  GRID, ITEM, KINDS, MAX_SIZE, MIN_SIZE, START_STAIR, TRIALS, capacityScore, makeChangePlan, makeTrial, nextStair, type Answer,
} from './scoring'

/** Small seeded generator, so the simulations below are the same on every run. */
function seeded(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A simulated run: a player who holds K shapes, guesses "changed" with g, slips on 3 % of trials. */
function simulate(K: number, rand: () => number, opts: { g?: number; earlyErrors?: number; random?: boolean } = {}) {
  const g = opts.g ?? 0.15
  const plan = makeChangePlan(rand)
  let stair = START_STAIR
  const answers: Answer[] = []
  for (let i = 0; i < TRIALS; i++) {
    const change = plan[i]
    let said: boolean
    if (opts.random || rand() < 0.03) said = rand() < 0.5
    else said = change ? rand() < Math.min(1, K / stair.size) || rand() < g : rand() < g
    if (i < (opts.earlyErrors ?? 0)) said = !change
    answers.push({ size: stair.size, change, saidChange: said })
    stair = nextStair(stair, said === change)
  }
  return answers
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length

describe('change detection trials', () => {
  it('shows distinct kinds, on the board, and changes into a kind not shown', () => {
    for (let size = MIN_SIZE; size <= MAX_SIZE; size++)
      for (let k = 0; k < 30; k++) {
        const t = makeTrial(size, true)
        const kinds = t.items.map((i) => i.kind)
        expect(new Set(kinds).size).toBe(size)
        expect(kinds).not.toContain(t.newKind)
        expect(t.newKind).toBeLessThan(KINDS.length)
        expect(t.changed).not.toBeNull()
        const half = ITEM / GRID / 2
        for (const it of t.items) {
          expect(it.x - half).toBeGreaterThanOrEqual(0)
          expect(it.y + half).toBeLessThanOrEqual(1)
        }
      }
    expect(makeTrial(4, false).changed).toBeNull()
  })
  it('has exactly half change trials', () => {
    expect(makeChangePlan().filter(Boolean)).toHaveLength(TRIALS / 2)
  })
})

describe('staircase', () => {
  it('goes up after 2 right in a row, down after 1 wrong, within limits', () => {
    let s = START_STAIR
    s = nextStair(s, true)
    expect(s.size).toBe(START_STAIR.size)
    s = nextStair(s, true)
    expect(s.size).toBe(START_STAIR.size + 1)
    s = nextStair(s, false)
    expect(s.size).toBe(START_STAIR.size)
    expect(nextStair({ size: MIN_SIZE, streak: 0 }, false).size).toBe(MIN_SIZE)
    expect(nextStair({ size: MAX_SIZE, streak: 1 }, true).size).toBe(MAX_SIZE)
  })
})

describe('capacity score', () => {
  it('finds roughly the simulated capacity', () => {
    const rand = seeded(1)
    for (const K of [3, 5]) {
      const scores = Array.from({ length: 40 }, () => capacityScore(simulate(K, rand)))
      expect(mean(scores)).toBeGreaterThan(K - 0.8)
      expect(mean(scores)).toBeLessThan(K + 1.2)
    }
  })
  it('gives random clicking almost nothing', () => {
    const rand = seeded(2)
    const scores = Array.from({ length: 60 }, () => capacityScore(simulate(0, rand, { random: true })))
    expect(mean(scores)).toBeLessThan(1)
    expect(scores.filter((s) => s >= 2).length).toBeLessThanOrEqual(3)
  })
  it('two early mistakes cost a good player well under one shape', () => {
    const clean = seeded(3)
    const early = seeded(3)
    const a = mean(Array.from({ length: 40 }, () => capacityScore(simulate(5, clean))))
    const b = mean(Array.from({ length: 40 }, () => capacityScore(simulate(5, early, { earlyErrors: 2 }))))
    expect(a - b).toBeLessThan(0.8)
  })
  it('answering "changed" every time scores 0', () => {
    const answers = Array.from({ length: TRIALS }, (_, i) => ({ size: 4, change: i % 2 === 0, saidChange: true }))
    expect(capacityScore(answers)).toBeLessThan(0.5)
  })
})
