import { beforeEach, describe, expect, it } from 'vitest'
import { MAX_HISTORY, addResult, fromLegacy, getRecord, pickBest, saveResult, type TestRecord } from './storage'

const e = (score: number, at = 0) => ({ score, at })

describe('pickBest', () => {
  it('handles empty history', () => expect(pickBest([], true)).toBeUndefined())
  it('picks highest when higher is better', () => expect(pickBest([e(3), e(9), e(5)], true)?.score).toBe(9))
  it('picks lowest when lower is better', () => expect(pickBest([e(300), e(210), e(250)], false)?.score).toBe(210))
})

describe('addResult', () => {
  it('keeps the best and counts attempts even after the history is full', () => {
    let rec: TestRecord = { attempts: 0, history: [] }
    rec = addResult(rec, e(100, 1), false).next // the best, first of all
    for (let i = 0; i < MAX_HISTORY + 20; i++) rec = addResult(rec, e(200 + i, i + 2), false).next
    expect(rec.attempts).toBe(MAX_HISTORY + 21)
    expect(rec.history).toHaveLength(MAX_HISTORY)
    expect(rec.history.some((h) => h.score === 100)).toBe(false) // dropped from the history…
    expect(rec.best?.score).toBe(100) // …but still the best
  })
  it('reports a new best', () => {
    const first = addResult({ attempts: 0, history: [] }, e(5), true)
    expect(first.isBest).toBe(true)
    const worse = addResult(first.next, e(3), true)
    expect(worse.isBest).toBe(false)
    expect(worse.previousBest?.score).toBe(5)
  })
})

describe('storage', () => {
  // A tiny in-memory localStorage for the tests.
  beforeEach(() => {
    const data = new Map<string, string>()
    globalThis.localStorage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
      key: (i: number) => [...data.keys()][i] ?? null,
      get length() { return data.size },
    } as Storage
  })

  it('converts old saved results on first read', () => {
    localStorage.setItem('skill-lab:v1:results:reaction', JSON.stringify([e(300, 1), e(250, 2), e(280, 3)]))
    const rec = getRecord('reaction', false)
    expect(rec.best?.score).toBe(250)
    expect(rec.attempts).toBe(3)
    expect(rec.history.map((h) => h.score)).toEqual([300, 250, 280])
    expect(localStorage.getItem('skill-lab:v2:test:reaction')).not.toBeNull()
    expect(fromLegacy([], true).best).toBeUndefined()
  })

  it('saves details with the result', () => {
    saveResult('aim', 40, true, { Misses: '3' })
    const rec = getRecord('aim', true)
    expect(rec.attempts).toBe(1)
    expect(rec.history[0].details).toEqual({ Misses: '3' })
  })

  it('survives broken data', () => {
    localStorage.setItem('skill-lab:v2:test:x', '{not json')
    expect(getRecord('x', true)).toEqual({ attempts: 0, history: [] })
  })
})
