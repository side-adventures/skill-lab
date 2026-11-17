import { randInt, type Rand } from '../../lib/random'

export const START_DIGITS = 2
export const LIVES = 2
/** Each digit is on screen this long, then a short gap before the next one. */
export const DIGIT_MS = 800
export const GAP_MS = 250
/** "Memorize the digits" before the first sequence of a run (not before later ones). */
export const INTRO_MS = 2000

/**
 * A sequence of digits 1–9 (as in the WAIS Digit Span) where neighbours are never equal and never one apart, and a digit
 * never repeats the one two places back: no repeats, no easy runs like 3-4-5, no easy-to-chunk patterns like 3-7-3-7.
 */
export function makeSequence(length: number, rand: Rand = Math.random): string {
  const out: number[] = []
  while (out.length < length) {
    const d = randInt(1, 9, rand)
    const prev = out[out.length - 1]
    if (prev !== undefined && Math.abs(d - prev) <= 1) continue
    if (d === out[out.length - 2]) continue
    out.push(d)
  }
  return out.join('')
}

/** What you have to type: the sequence back to front. */
export const reversed = (seq: string) => [...seq].reverse().join('')

/** Score: the longest sequence reversed correctly (0 if none). */
export const spanScore = (digits: number) => (digits - 1 >= START_DIGITS ? digits - 1 : 0)
