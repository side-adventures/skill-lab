import { describe, expect, it } from 'vitest'
import { answerStats, fmtMs } from './resultFormat'
import { pickNextTest } from './nextTest'

describe('resultFormat edge cases (review)', () => {
  it('999.6 ms shows as "1.0 s", not "1000 ms"', () => {
    expect(fmtMs(999.6)).toBe('1.0 s')
  })
  it('only wrong answers: no Fastest answer, no NaN (passes)', () => {
    const s = answerStats([{ ms: 400, correct: false }])
    expect(s.map((x) => x.label)).toEqual(['Correct', 'Wrong', 'Accuracy', 'Avg per answer'])
    expect(s.some((x) => /NaN|Infinity/.test(x.value))).toBe(false)
  })
})

describe('pickNextTest edge cases (review)', () => {
  const tests = ['Zed', 'alpha', 'Beta'].map((name) => ({ id: name.toLowerCase(), name }))
  const empty = { attempts: 0, history: [] }
  it('unknown current id starts from the top, A–Z case-insensitive (passes)', () => {
    expect(pickNextTest('nope', tests, () => empty)?.id).toBe('alpha')
    expect(pickNextTest('beta', tests, () => empty)?.id).toBe('zed')
  })
})
