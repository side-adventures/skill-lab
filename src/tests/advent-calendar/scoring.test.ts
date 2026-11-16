import { describe, expect, it } from 'vitest'
import { COUNT, PATH_MAX, PATH_MIN, ROUNDS, calendarScore, makeLayout, pathLength, switchCostPerDoor } from './scoring'

describe('advent calendar', () => {
  it('round 2 alternates stars up and trees down', () => {
    const r = ROUNDS[1].map((d) => `${d.kind === 'star' ? 'S' : 'T'}${d.n}`)
    expect(r.slice(0, 4)).toEqual(['S1', 'T12', 'S2', 'T11'])
    expect(r.slice(-2)).toEqual(['S12', 'T1'])
    expect(ROUNDS[1].filter((d) => d.kind === 'star')).toHaveLength(COUNT / 2)
  })
  it('places every door once, in the path band, with the order pointing at the right doors', () => {
    for (const round of [0, 1])
      for (let k = 0; k < 100; k++) {
        const { cells, order } = makeLayout(round)
        expect(new Set(order).size).toBe(COUNT)
        order.forEach((cell, i) => expect(cells[cell]).toBe(ROUNDS[round][i]))
        const len = pathLength(order)
        expect(len).toBeGreaterThanOrEqual(PATH_MIN)
        expect(len).toBeLessThanOrEqual(PATH_MAX)
      }
  })
  it('generates quickly', () => {
    const t = performance.now()
    for (let k = 0; k < 200; k++) makeLayout(0)
    expect((performance.now() - t) / 200).toBeLessThan(5)
  })
  it('adds penalties to the total and the switching cost', () => {
    const a = { ms: 20_000, wrong: 1 }
    const b = { ms: 30_000, wrong: 0 }
    expect(calendarScore([a, b])).toBe(51_000)
    expect(switchCostPerDoor(a, b)).toBeCloseTo(9000 / COUNT)
  })
})
