import { describe, expect, it } from 'vitest'
import { answerStats, fmtMs, fmtPct, tendency } from './resultFormat'

describe('result formatters', () => {
  it('formats times and percentages', () => {
    expect(fmtMs(612.4)).toBe('612 ms')
    expect(fmtMs(1440)).toBe('1.4 s')
    expect(fmtPct(0.916)).toBe('92 %')
  })
  it('describes a tendency', () => {
    expect(tendency(6.2, ' %', 'too early', 'too late')).toBe('+6 % too late')
    expect(tendency(-12, ' ms', 'too early', 'too late')).toBe('−12 ms too early')
    expect(tendency(0.4, ' %', 'too early', 'too late')).toBe('Even')
  })
})

describe('answerStats', () => {
  it('counts, averages and finds the fastest correct answer', () => {
    const s = answerStats([{ ms: 500, correct: true }, { ms: 300, correct: false }, { ms: 700, correct: true }, { ms: 900, correct: true }])
    expect(s).toEqual([
      { label: 'Correct', value: '3' },
      { label: 'Wrong', value: '1' },
      { label: 'Accuracy', value: '75 %' },
      { label: 'Avg per answer', value: '600 ms' },
      { label: 'Fastest answer', value: '500 ms' },
    ])
  })
  it('stops after Correct / Wrong without answers', () => {
    expect(answerStats([])).toHaveLength(2)
  })
})
