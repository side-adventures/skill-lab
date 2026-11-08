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
