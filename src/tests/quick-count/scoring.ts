import { tendency } from '../../lib/resultFormat'
import type { ResultDetails } from '../types'
import { mean, randInt, round1, shuffle, type Rand } from '../../lib/random'

export const MIN_DOTS = 5
export const MAX_DOTS = 60
/**
 * One round per group. The groups overlap, so you can't tell which ones are left, and they are densest
 * around 14–22 dots, where a few dots more or less is still noticeable (high counts feel all alike).
 * From 28 to 52 every count is in exactly two groups. The last group can be anything.
 */
export const DOT_GROUPS: readonly (readonly [number, number])[] = [
  [5, 15], [9, 19], [12, 22], [14, 24], [16, 27], [20, 33], [25, 43], [34, 52], [44, 60],
  [MIN_DOTS, MAX_DOTS],
]
export const ROUNDS = DOT_GROUPS.length
export const FLASH_MS = 600
export const DOT_RADIUS = 2.4 // in a 100×100 viewBox

export interface Dot { x: number; y: number }

/** Dot counts for all rounds: one from each group, never the same count twice, in random order. */
export function makeCounts(rand: Rand = Math.random): number[] {
  const counts: number[] = []
  for (const [lo, hi] of DOT_GROUPS) {
    let n = randInt(lo, hi, rand)
    for (let tries = 0; counts.includes(n) && tries < 50; tries++) n = randInt(lo, hi, rand)
    counts.push(n)
  }
  return shuffle(counts, rand)
}

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

/** "1 dot", "3 dots". */
const dots = (n: number) => `${n} ${n === 1 ? 'dot' : 'dots'}`

/** Result screen stats: exact guesses, how far off, which way you tend to be off, and each round. */
export function resultDetails(rounds: { actual: number; guess: number }[]): ResultDetails {
  const off = rounds.map((r) => r.guess - r.actual)
  return {
    stats: [
      { label: 'Exact', value: `${off.filter((o) => o === 0).length} / ${rounds.length}` },
      { label: 'Avg off by', value: `${mean(off.map(Math.abs)).toFixed(1)} dots` },
      { label: 'Tendency', value: tendency(mean(off), '', 'too low', 'too high', 0.5, 1) },
      { label: 'Biggest miss', value: dots(Math.max(...off.map(Math.abs))) },
    ],
    chips: { title: 'Dots · your guess', items: rounds.map((r) => ({ label: `${r.actual} dots`, value: String(r.guess) })) },
  }
}
