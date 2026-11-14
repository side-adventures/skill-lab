import type { Rand } from '../../lib/random'

export const LIVES = 3
export const SEEN_CHANCE = 0.4
export const MIN_SEEN_BEFORE_REPEATS = 3
/**
 * How likely a recently shown word is to come back as the next repeat, compared to an older one:
 * the word just shown never, 2 words ago 20 %, then 40 %, 60 %, 80 %, and normal from 6 words ago.
 * A word seen a moment ago is still fresh in your head, so this pushes repeats toward longer gaps.
 */
export const RECENT_WEIGHTS = [0, 0.2, 0.4, 0.6, 0.8]

/** Chance weight of a seen word, from where it is in the recently shown words (most recent first). */
export const repeatWeight = (word: string, recent: string[]) => {
  const i = recent.indexOf(word)
  return i === -1 || i >= RECENT_WEIGHTS.length ? 1 : RECENT_WEIGHTS[i]
}

/**
 * Picks the next word. Repeats an already-shown word with SEEN_CHANCE once a few words are in the
 * pool (recently shown words less likely, see RECENT_WEIGHTS); otherwise a fresh word.
 * `recent`: the words shown so far, most recent first (only the first few matter).
 */
export function nextWord(pool: string[], seen: string[], recent: string[], rand: Rand = Math.random) {
  const weighted = seen.map((w) => ({ w, weight: repeatWeight(w, recent) })).filter((x) => x.weight > 0)
  const total = weighted.reduce((s, x) => s + x.weight, 0)
  const pickRepeat = () => {
    let r = rand() * total
    for (const x of weighted) if ((r -= x.weight) < 0) return x.w
    return weighted[weighted.length - 1].w
  }
  if (weighted.length >= MIN_SEEN_BEFORE_REPEATS - 1 && seen.length >= MIN_SEEN_BEFORE_REPEATS && rand() < SEEN_CHANCE) {
    return { word: pickRepeat(), isSeen: true }
  }
  const fresh = pool.filter((w) => !seen.includes(w))
  if (!fresh.length) return { word: pickRepeat(), isSeen: true }
  return { word: fresh[Math.floor(rand() * fresh.length)], isSeen: false }
}
