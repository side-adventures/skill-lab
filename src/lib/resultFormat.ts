import type { ResultStat } from '../tests/types'

/** Small formatters for result-screen stats, so units look the same everywhere. */

/** "612 ms" below one second, "1.4 s" from one second on. */
export const fmtMs = (ms: number) => (Math.round(Math.abs(ms)) < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`)

/** "92 %" (whole percent). */
export const fmtPct = (fraction: number) => `${Math.round(fraction * 100)} %`

/** "−" for negative numbers, "+" otherwise (typographic minus). */
export const sign = (n: number) => (n < 0 ? '−' : '+')

/**
 * Which way you tend to be off, from the mean signed error: e.g. tendency(6.2, '%', 'too early', 'too late')
 * → "+6 % too late". Close to zero (below `even`) → "Even".
 */
export function tendency(meanSigned: number, unit: string, below: string, above: string, even = 1, digits = 0) {
  if (Math.abs(meanSigned) < even) return 'Even'
  return `${sign(meanSigned)}${Math.abs(meanSigned).toFixed(digits)}${unit} ${meanSigned < 0 ? below : above}`
}

/** One answer in a timed answer test (Stroop, Quick Maths, Mental Rotation, Word Memory). */
export interface TimedAnswer { ms: number; correct: boolean }

/** Correct · Wrong · Accuracy · Avg per answer · Fastest answer — the usual stats of an answer test. */
export function answerStats(answers: TimedAnswer[]): ResultStat[] {
  const correct = answers.filter((a) => a.correct)
  const stats: ResultStat[] = [
    { label: 'Correct', value: String(correct.length) },
    { label: 'Wrong', value: String(answers.length - correct.length) },
  ]
  if (!answers.length) return stats
  stats.push(
    { label: 'Accuracy', value: fmtPct(correct.length / answers.length) },
    { label: 'Avg per answer', value: fmtMs(answers.reduce((s, a) => s + a.ms, 0) / answers.length) },
  )
  if (correct.length) stats.push({ label: 'Fastest answer', value: fmtMs(Math.min(...correct.map((a) => a.ms))) })
  return stats
}

/** How much slower the harder condition was (Stroop, Mental Rotation): "92 ms slower", "5 ms faster", "No difference". */
export const slowdown = (ms: number) => {
  const r = Math.round(ms)
  return r === 0 ? 'No difference' : `${Math.abs(r)} ms ${r > 0 ? 'slower' : 'faster'}`
}
