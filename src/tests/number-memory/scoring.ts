import { randInt, type Rand } from '../../lib/random'

export const START_DIGITS = 3
/** Lives for the whole run: a wrong answer costs one, and you get a new number of the same length. */
export const LIVES = 2

/** How long the number stays visible. */
export const showMs = (digits: number) => 1000 + 500 * digits

/** Random number with exactly `digits` digits (no leading zero). */
export function makeNumber(digits: number, rand?: Rand) {
  let s = String(randInt(1, 9, rand))
  while (s.length < digits) s += String(randInt(0, 9, rand))
  return s
}
