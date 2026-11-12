import type { ResultDetails } from '../types'
import { round1 } from '../../lib/random'

export const DURATION_MS = 10_000
export const tapsPerSecond = (taps: number) => round1(taps / (DURATION_MS / 1000))

export const FRAME_MS = 2000

/**
 * Clicks per 2-second frame (5 frames), from click times in ms since the first click. The timer ends a
 * few ms after first click + 10 s, so a click in that gap still counts: it goes into the last frame.
 */
export function clicksPerFrame(times: number[]) {
  const frames = Array<number>(DURATION_MS / FRAME_MS).fill(0)
  times.forEach((t) => frames[Math.min(frames.length - 1, Math.floor(t / FRAME_MS))]++)
  return frames
}

/** Result screen stats: total, fastest and last frame (do you slow down?), clicks per frame. */
export function resultDetails(times: number[]): ResultDetails {
  const frames = clicksPerFrame(times)
  const perS = (n: number) => `${round1(n / (FRAME_MS / 1000))} / s`
  return {
    stats: [
      { label: 'Total clicks', value: String(times.length) },
      { label: 'Fastest frame', value: perS(Math.max(...frames)) },
      { label: 'Last frame', value: perS(frames[frames.length - 1]) },
    ],
    chips: {
      title: 'Clicks per 2 s',
      items: frames.map((n, i) => ({ label: `${(i * FRAME_MS) / 1000}–${((i + 1) * FRAME_MS) / 1000} s`, value: String(n) })),
    },
  }
}
