import { mean, randInt, round1, spreadInts, type Rand } from '../../lib/random'

export const ROUNDS = 10
export const MIN_DOTS = 5
export const MAX_DOTS = 60
/** First round is always mid-sized, to calibrate what ~30 dots look like. */
export const FIRST_MIN = 20
export const FIRST_MAX = 40
export const FLASH_MS = 600
export const DOT_RADIUS = 2.4 // in a 100×100 viewBox

export interface Dot { x: number; y: number }

/** Dot counts for all rounds: a mid-sized first round, then one from each band of 5–60, shuffled. */
export const makeCounts = (rand?: Rand): number[] => [
  randInt(FIRST_MIN, FIRST_MAX, rand),
  ...spreadInts(MIN_DOTS, MAX_DOTS, ROUNDS - 1, rand),
]

/** Non-overlapping random dots inside a 100×100 box (rejection sampling). */
export function placeDots(n: number, rand: Rand = Math.random): Dot[] {
  const margin = 5
  let minDist = 8
  const dots: Dot[] = []
  let attempts = 0
  while (dots.length < n) {
    const d = { x: margin + rand() * (100 - 2 * margin), y: margin + rand() * (100 - 2 * margin) }
    if (dots.every((o) => (o.x - d.x) ** 2 + (o.y - d.y) ** 2 >= minDist ** 2)) dots.push(d)
    if (++attempts % 2000 === 0) minDist *= 0.9 // relax if crowded
  }
  return dots
}

/** 100 % for exact, decreasing with relative error, never below 0. */
export const accuracy = (actual: number, guess: number) =>
  Math.max(0, 100 - (Math.abs(guess - actual) / actual) * 100)

export const scoreRounds = (rounds: { actual: number; guess: number }[]) =>
  round1(mean(rounds.map((r) => accuracy(r.actual, r.guess))))
