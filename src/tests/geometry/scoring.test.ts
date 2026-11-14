import { describe, expect, it } from 'vitest'
import {
  angleDiff, angleTo, bisectAngle, centerOfCircle, clipHalf, completeSquare, copyLength, dirOf, equalDistance,
  clampToRange, makeParallel, makeTasks, middleOfLine, pointsFor, polygonArea, setAngle, totalScore,
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
  it('measures and clips polygons (used by Split in Half)', () => {
    const square = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]
    expect(polygonArea(square)).toBe(100)
    expect(polygonArea(clipHalf(square, { x: 0, y: 0 }, { x: 1, y: 0 }, 7))).toBeCloseTo(30)
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
    const t5 = makeParallel(r); const s5 = t5.evaluate({ angle: 0 }).solution[0]
    if (s5.t === 'ray') {
      expect(t5.evaluate({ angle: s5.angle }).points).toBe(100)
      expect(t5.evaluate({ angle: s5.angle + 180 }).points).toBe(100) // pointing the other way is parallel too
      expect(t5.evaluate({ angle: s5.angle + 5 }).points).toBe(50)
    }
    const t6 = completeSquare(r); const s6 = t6.evaluate({ point: { x: 0, y: 0 } }).solution.at(-1)!
    if (s6.t === 'dot') expect(t6.evaluate({ point: s6.p }).points).toBe(100)
    const t7 = copyLength(r); const s7 = t7.evaluate({ length: 0 }).solution[0]
    if (s7.t === 'seg') expect(t7.evaluate({ length: Math.hypot(s7.b.x - s7.a.x, s7.b.y - s7.a.y) }).points).toBe(100)
    const t8 = equalDistance(r); const s8 = t8.evaluate({ point: { x: 0, y: 0 } }).solution[0]
    if (s8.t === 'dot') expect(t8.evaluate({ point: s8.p }).points).toBe(100)
  })
  it('keeps the bisect arm inside the angle', () => {
    const range = { from: 350, span: 60 } // 350° … 50°
    expect(clampToRange(20, range)).toBeCloseTo(380)
    expect(clampToRange(150, range)).toBeCloseTo(410) // nearer to the 50° arm
    expect(clampToRange(250, range)).toBeCloseTo(350) // nearer to the 350° arm
    for (let i = 0; i < 50; i++) {
      const t = bisectAngle(r)
      const a = clampToRange(t.initial!.angle!, t.range!)
      expect(a).toBeCloseTo(t.initial!.angle!) // starts inside
      expect(t.evaluate({ angle: a }).points).toBeLessThan(100)
    }
  })
  it('makes one round of each of the 9 tasks', () => {
    const tasks = makeTasks()
    expect(tasks).toHaveLength(9)
    expect(new Set(tasks.map((t) => t.kind)).size).toBe(9)
  })
})
