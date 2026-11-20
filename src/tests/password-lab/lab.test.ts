import { describe, expect, it } from 'vitest'
import { EXTRA_CHARS } from '../password-memory/scoring'
import { LAB_KEY, MIN_PARTS, START_PARTS, emptyLab, hitRate, labPassword, loadLab, nextParts, saveLab, toRecord } from './lab'

/** A tiny in-memory stand-in for localStorage. */
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('password lab: passwords', () => {
  it('has exactly the asked number of parts (words + changes + extras)', () => {
    for (let parts = MIN_PARTS; parts <= 12; parts++) {
      for (let i = 0; i < 300; i++) {
        const { password: p } = labPassword(parts)
        expect(p.words.length + p.changes.length + p.extras.length).toBe(parts)
        expect([...p.extras].every((c) => EXTRA_CHARS.includes(c))).toBe(true)
      }
    }
  })

  it('varies the parts on their own: words, groups, separators, change kinds, extras', () => {
    const labs = Array.from({ length: 3000 }, () => labPassword(6))
    const counts = new Set(labs.map((l) => l.password.words.length))
    expect([...counts].sort()).toEqual([1, 2, 3])
    const groups = new Set(labs.map((l) => l.group))
    for (const g of ['short', 'medium', 'long', 'xlong', 'combo']) expect(groups.has(g as never)).toBe(true)
    const seps = new Set(labs.filter((l) => l.password.words.length === 2).map((l) => l.password.sep))
    expect(seps).toEqual(new Set(['-', '_', '.', ' ', '']))
    const kinds = new Set(labs.flatMap((l) => toRecord(l, '', 0).changes.map((c) => c.kind)))
    expect(kinds).toEqual(new Set(['upper', 'digit', 'symbol']))
  })
})

describe('password lab: records and progress', () => {
  it('records everything about an answer', () => {
    const lab = labPassword(5)
    const r = toRecord(lab, lab.password.text, 1234.6, 42)
    expect(r).toMatchObject({ at: 42, parts: 5, ok: true, typeMs: 1235, text: lab.password.text })
    expect(r.words.length + r.changes.length + r.extras.length).toBe(5)
    expect(toRecord(lab, 'nope', 0).ok).toBe(false)
  })

  it('goes one part up after a right answer and one down after a wrong one, not below the minimum', () => {
    expect(nextParts(4, true)).toBe(5)
    expect(nextParts(4, false)).toBe(3)
    expect(nextParts(MIN_PARTS, false)).toBe(MIN_PARTS)
  })

  it('keeps progress between visits', () => {
    const storage = memory()
    expect(loadLab(storage)).toEqual(emptyLab())
    const lab = labPassword(START_PARTS)
    const data = { version: 1 as const, parts: 6, records: [toRecord(lab, 'x', 10)] }
    expect(saveLab(data, storage)).toBe(true)
    expect(loadLab(storage)).toEqual(data)
  })

  it('starts fresh on broken or missing storage, without throwing', () => {
    const storage = memory()
    storage.setItem(LAB_KEY, '{not json')
    expect(loadLab(storage)).toEqual(emptyLab())
    const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') } }
    expect(loadLab(throwing)).toEqual(emptyLab())
    expect(saveLab(emptyLab(), throwing)).toBe(false)
  })

  it('reports the share of right answers', () => {
    const lab = labPassword(4)
    expect(hitRate([])).toBe(0)
    expect(hitRate([toRecord(lab, lab.password.text, 0), toRecord(lab, 'x', 0)])).toBe(50)
  })
})
