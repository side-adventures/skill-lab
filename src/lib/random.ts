export type Rand = () => number

export const randInt = (min: number, max: number, rand: Rand = Math.random) =>
  min + Math.floor(rand() * (max - min + 1))

export function shuffle<T>(items: T[], rand: Rand = Math.random): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
export const round1 = (x: number) => Math.round(x * 10) / 10

/**
 * "Semi-random" values: splits [min, max] into `count` equal bands and draws one
 * whole number from each band, then shuffles. Guarantees a spread of low, middle
 * and high values while staying unpredictable.
 */
export function spreadInts(min: number, max: number, count: number, rand: Rand = Math.random): number[] {
  const width = (max - min + 1) / count
  const values = Array.from({ length: count }, (_, i) => {
    const lo = Math.ceil(min + i * width)
    const hi = Math.max(lo, Math.ceil(min + (i + 1) * width) - 1)
    return randInt(lo, Math.min(hi, max), rand)
  })
  return shuffle(values, rand)
}
