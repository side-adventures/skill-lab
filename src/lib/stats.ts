import type { ResultEntry } from './storage'

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)

export function median(xs: number[]) {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length / 2
  return s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2
}

/** Average of the last `size` scores at each attempt; at the start, of the attempts so far. */
export const rollingMean = (xs: number[], size = 5) => xs.map((_, i) => mean(xs.slice(Math.max(0, i + 1 - size), i + 1)))

const startOfDay = (t: number) => {
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Best score among today's attempts (local time), or undefined if none. */
export function bestToday(history: ResultEntry[], higherIsBetter: boolean, now = Date.now()) {
  const today = history.filter((e) => startOfDay(e.at) === startOfDay(now)).map((e) => e.score)
  if (!today.length) return undefined
  return higherIsBetter ? Math.max(...today) : Math.min(...today)
}

const DAY = 86_400_000

/** "Today", "Yesterday", "3 days ago", or a date like "Nov 2" (with year if not this year). */
export function relativeDay(t: number, now = Date.now()) {
  const days = Math.round((startOfDay(now) - startOfDay(t)) / DAY)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return shortDate(t, now)
}

export function shortDate(t: number, now = Date.now()) {
  const d = new Date(t)
  const sameYear = d.getFullYear() === new Date(now).getFullYear()
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(!sameYear && { year: 'numeric' }) })
}
