import { describe, expect, it } from 'vitest'
import {
  angleDiff, angleTo, areaFraction, bisectAngle, centerOfCircle, completeSquare, copyLength, dirOf, equalDistance,
  halvingOffset, levelIt, makeTasks, middleOfLine, pointsFor, polygonArea, setAngle, splitShape, totalScore,
} from './scoring'

describe('geometry helpers', () => {
  it('handles angles on screen (y down)', () => {
    expect(angleTo({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(90)
    expect(angleDiff(350, 10)).toBe(20)
    expect(angleDiff(179, 1, 180)).toBe(2)
    expect(dirOf(90).y).toBeCloseTo(-1)
  })
  it('scores linearly down to zero', () => {
    expect(pointsFor(0, 10)).toBe(100)
    expect(pointsFor(5, 10)).toBe(50)
    expect(pointsFor(20, 10)).toBe(0)
    expect(totalScore([100, 50])).toBe(75)
  })
  it('finds the halving cut of a polygon', () => {
    const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
    expect(polygonArea(square)).toBe(100)
    const n = { x: 1, y: 0 }
    expect(areaFraction(square, { x: 0, y: 0 }, n, 7)).toBeCloseTo(0.3)
    expect(halvingOffset(square, { x: 0, y: 0 }, n)).toBeCloseTo(5)
  })
})

describe('geometry tasks', () => {
  const r = Math.random
  it('give 100 points for the exact answer', () => {
    // perfect answers are read back from each task's own solution
    const t1 = middleOfLine(r); const s1 = t1.evaluate({ point: { x: 0, y: 0 } }).solution[0]
    if (s1.t === 'dot') expect(t1.evaluate({ point: s1.p }).points).toBe(100)
    const t2 = centerOfCircle(r); const s2 = t2.evaluate({ point: { x: 0, y: 0 } }).solution[0]
    if (s2.t === 'dot') expect(t2.evaluate({ point: s2.p }).points).toBe(100)
    const t3 = setAngle(r); const s3 = t3.evaluate({ angle: 0 }).solution[0]
    if (s3.t === 'ray') expect(t3.evaluate({ angle: s3.angle }).points).toBe(100)
    const t4 = bisectAngle(r); const s4 = t4.evaluate({ angle: 0 }).solution[0]
    if (s4.t === 'ray') expect(t4.evaluate({ angle: s4.angle }).points).toBe(100)
    const t5 = levelIt(r); const s5 = t5.evaluate({ angle: 0 }).solution[0]
    if (s5.t === 'line') expect(t5.evaluate({ angle: s5.angle + 180 }).points).toBe(100)
    const t6 = completeSquare(r); const s6 = t6.evaluate({ point: { x: 0, y: 0 } }).solution.at(-1)!
    if (s6.t === 'dot') expect(t6.evaluate({ point: s6.p }).points).toBe(100)
    const t7 = copyLength(r); const s7 = t7.evaluate({ length: 0 }).solution[0]
    if (s7.t === 'seg') expect(t7.evaluate({ length: Math.hypot(s7.b.x - s7.a.x, s7.b.y - s7.a.y) }).points).toBe(100)
    const t8 = equalDistance(r); const s8 = t8.evaluate({ point: { x: 0, y: 0 } }).solution[0]
    if (s8.t === 'dot') expect(t8.evaluate({ point: s8.p }).points).toBe(100)
  })
  it('splits shapes fairly and reports the split', () => {
    for (let i = 0; i < 50; i++) {
      const t = splitShape(r)
      expect(t.evaluate({ offset: t.initial!.offset! }).points).toBeLessThan(100)
    }
  })
  it('makes one round of each of the 10 tasks', () => {
    const tasks = makeTasks()
    expect(tasks).toHaveLength(10)
    expect(new Set(tasks.map((t) => t.kind)).size).toBe(10)
  })
})
