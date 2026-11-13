export const ROUNDS = 5
export const MIN_DELAY_MS = 1500
export const MAX_DELAY_MS = 5000
/** Faster than this after green can't be a real reaction (the usual research cut-off): it counts as too soon. */
export const MIN_REACTION_MS = 100
/** More early clicks than this end the run without a score, so blind clicking and retrying doesn't pay. */
export const MAX_TOO_SOON = 5

export const isTooFast = (ms: number) => ms < MIN_REACTION_MS

export const randomDelay = (rand = Math.random) =>
  MIN_DELAY_MS + rand() * (MAX_DELAY_MS - MIN_DELAY_MS)

/** Middle value (average of the two middle ones for an even count). */
export function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Score = median, so one distracted slow round (or a lucky fast one) doesn't decide it. */
export function summarize(times: number[]) {
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  return {
    score: Math.round(median(times)),
    average: Math.round(avg),
    best: Math.round(Math.min(...times)),
    worst: Math.round(Math.max(...times)),
  }
}
