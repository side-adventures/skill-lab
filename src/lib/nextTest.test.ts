import { describe, expect, it } from 'vitest'
import { pickNextTest } from './nextTest'
import type { TestRecord } from './storage'

const NOW = new Date('2026-11-12T15:00:00').getTime()
const YESTERDAY = NOW - 24 * 3600 * 1000
const tests = ['Aim', 'Ber', 'Cat', 'Dot', 'Eel'].map((name) => ({ id: name.toLowerCase(), name }))
const played = (at: number): TestRecord => ({ attempts: 1, history: [{ score: 1, at }] })

const pick = (current: string, records: Record<string, TestRecord>) =>
  pickNextTest(current, tests, (t) => records[t.id] ?? { attempts: 0, history: [] }, NOW)?.id

describe('pickNextTest', () => {
  it('takes the next unplayed test after the current one, A–Z, wrapping around', () => {
    expect(pick('cat', {})).toBe('dot')
    expect(pick('eel', {})).toBe('aim')
    expect(pick('cat', { dot: played(NOW), eel: played(NOW) })).toBe('aim')
  })
  it('then a test not played today, then any other', () => {
    const all = Object.fromEntries(tests.map((t) => [t.id, played(NOW)]))
    expect(pick('cat', { ...all, aim: played(YESTERDAY) })).toBe('aim')
    expect(pick('cat', all)).toBe('dot')
  })
  it('never suggests the current test', () => {
    expect(pickNextTest('aim', [tests[0]], () => ({ attempts: 0, history: [] }))).toBeUndefined()
  })
})
