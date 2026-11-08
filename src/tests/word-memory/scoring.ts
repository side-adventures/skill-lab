import type { Rand } from '../../lib/random'

export const LIVES = 3
export const SEEN_CHANCE = 0.4
export const MIN_SEEN_BEFORE_REPEATS = 3

/**
 * Picks the next word. Repeats an already-shown word (not the one just shown)
 * with SEEN_CHANCE once a few words are in the pool; otherwise a fresh word.
 */
export function nextWord(pool: string[], seen: string[], last: string | undefined, rand: Rand = Math.random) {
  const repeatable = seen.filter((w) => w !== last)
  if (repeatable.length >= MIN_SEEN_BEFORE_REPEATS - 1 && seen.length >= MIN_SEEN_BEFORE_REPEATS && rand() < SEEN_CHANCE) {
    return { word: repeatable[Math.floor(rand() * repeatable.length)], isSeen: true }
  }
  const fresh = pool.filter((w) => !seen.includes(w))
  if (!fresh.length) return { word: repeatable[Math.floor(rand() * repeatable.length)], isSeen: true }
  return { word: fresh[Math.floor(rand() * fresh.length)], isSeen: false }
}
