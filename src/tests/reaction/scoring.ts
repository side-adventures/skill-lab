export const ROUNDS = 5
export const MIN_DELAY_MS = 1500
export const MAX_DELAY_MS = 5000

export const randomDelay = (rand = Math.random) =>
  MIN_DELAY_MS + rand() * (MAX_DELAY_MS - MIN_DELAY_MS)

export function summarize(times: number[]) {
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  return {
    score: Math.round(avg),
    best: Math.round(Math.min(...times)),
    worst: Math.round(Math.max(...times)),
  }
}
