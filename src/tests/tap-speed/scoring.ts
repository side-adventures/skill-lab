import { round1 } from '../../lib/random'

export const DURATION_MS = 10_000
export const tapsPerSecond = (taps: number) => round1(taps / (DURATION_MS / 1000))
