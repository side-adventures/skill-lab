import { describe, expect, it } from 'vitest'
import {
  NEW_TASK_MAKERS, SIZE_SHAPES, TASK_MAKERS, angleDiff, angleTo, balancePoint, bisectAngle, centerOfCircle, clipHalf,
  completeSquare, copyLength, dirOf, equalDistance, clampToRange, makeParallel, makeTasks, matchSize, middleOfLine,
  mirrorPoint, pathMiddle, closestOnPath, pointsFor, polygonArea, setAngle, shapeArea, totalScore, whereTheyMeet, type Shape,
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
  it('makes one round of each of the 12 tasks; the test link has only the 6 new / changed ones', () => {
    const tasks = makeTasks()
    expect(tasks).toHaveLength(12)
    expect(new Set(tasks.map((t) => t.kind)).size).toBe(12)
    expect(TASK_MAKERS).toHaveLength(12)
    expect(makeTasks(Math.random, NEW_TASK_MAKERS).map((t) => t.kind).sort()).toEqual(['balance', 'center', 'meet', 'middle', 'mirror', 'size'])
  })})

describe('new and changed tasks (2026-11-14)', () => {
  const r = Math.random
  const pointTasks = { middleOfLine, centerOfCircle, balancePoint, whereTheyMeet, mirrorPoint }
  const onBoard = (p: { x: number; y: number }) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100

  it('give 100 points for the exact answer, less for a miss', () => {
    for (const [name, make] of Object.entries(pointTasks)) {
      for (let i = 0; i < 200; i++) {
        const t = make(r)
        const dot = t.evaluate({ point: { x: 0, y: 0 } }).solution.find((s): s is Extract<Shape, { t: 'dot' }> => s.t === 'dot')!
        expect(t.evaluate({ point: dot.p }).points, name).toBe(100)
        // (Middle of the line snaps onto the line, so a click beside the middle can still be perfect: test its ends instead)
        if (name === 'middleOfLine') {
          const line = t.shapes[0]
          if (line.t === 'polyline') expect(t.evaluate({ point: line.pts[0] }).points, name).toBe(0)
        } else expect(t.evaluate({ point: { x: dot.p.x + 4, y: dot.p.y } }).points, name).toBeLessThan(100)
        expect(onBoard(dot.p), name).toBe(true)
      }
    }
  })

  it('finds the middle along a zigzag, not of its outline', () => {
    const { mid, total } = pathMiddle([{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 10 }])
    expect(total).toBe(40)
    expect(mid).toEqual({ x: 20, y: 0 })
    for (let i = 0; i < 200; i++) {
      const t = middleOfLine(r)
      const line = t.shapes[0]
      if (line.t !== 'polyline') throw new Error('expected a zigzag')
      expect(line.pts.length).toBeGreaterThanOrEqual(4) // 2–4 bends
      expect(line.pts.length).toBeLessThanOrEqual(6)
      expect(line.pts.every(onBoard)).toBe(true)
      const lens = line.pts.slice(1).map((p, j) => Math.hypot(p.x - line.pts[j].x, p.y - line.pts[j].y))
      expect(Math.max(...lens)).toBeGreaterThanOrEqual(2.5 * Math.min(...lens)) // very different section lengths
      const xs = line.pts.map((p) => p.x), ys = line.pts.map((p) => p.y)
      expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(50) // centered
      expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(50)
      // the point snaps onto the line
      const snapped = t.snap!({ x: 0, y: 0 })
      expect(closestOnPath(line.pts, snapped).d).toBeLessThan(1e-9)
    }
  })

  it('shows only an arc of 90–180° for the circle', () => {
    for (let i = 0; i < 200; i++) {
      const s = centerOfCircle(r).shapes[0]
      if (s.t !== 'arcline') throw new Error('expected an arc')
      expect(s.span).toBeGreaterThanOrEqual(90)
      expect(s.span).toBeLessThanOrEqual(180)
      // the full circle fits on the board
      expect(s.c.x - s.r).toBeGreaterThanOrEqual(5)
      expect(s.c.x + s.r).toBeLessThanOrEqual(95)
      expect(s.c.y - s.r).toBeGreaterThanOrEqual(5)
      expect(s.c.y + s.r).toBeLessThanOrEqual(95)
    }
  })

  it('Match the size: equal area gives 100, the four shapes, two different ones per task', () => {
    expect(SIZE_SHAPES).toEqual(['square', 'circle', 'triangle', 'star'])
    expect(shapeArea('square', 1)).toBeCloseTo(2)
    expect(shapeArea('circle', 10)).toBeCloseTo(Math.PI * 100, -1)
    for (let i = 0; i < 200; i++) {
      const t = matchSize(r)
      const sol = t.evaluate({ length: 1 }).solution[0]
      if (sol.t !== 'poly') throw new Error('expected a shape')
      const goal = Math.hypot(sol.pts[0].x - 70, sol.pts[0].y - 50) // circumradius of the right-size shape
      expect(t.evaluate({ length: goal }).points).toBe(100)
      expect(goal).toBeLessThanOrEqual(25) // reachable with the handle
      expect(t.evaluate({ length: t.initial!.length! }).points).toBeLessThan(100) // starts off
      expect(t.drawAnswer!({ length: 10 })).toHaveLength(1)
    }
  })
  it('every task shows its 0 % zone, and the zone is where the points run out', () => {
    for (const make of TASK_MAKERS) {
      for (let i = 0; i < 50; i++) {
        const t = make(r)
        const blank = t.input === 'point' ? { point: { x: 50, y: 50 } } : t.input === 'ray' ? { angle: 0 } : { length: 10 }
        const ev = t.evaluate(blank)
        expect(ev.zone?.length, t.kind).toBeGreaterThan(0)
        const z = ev.zone![0]
        if (t.input === 'point' && z.t === 'circle') {
          expect(t.evaluate({ point: { x: z.c.x + z.r * 1.01, y: z.c.y } }).points, t.kind).toBe(0)
          expect(t.evaluate({ point: { x: z.c.x + z.r * 0.9, y: z.c.y } }).points, t.kind).toBeGreaterThan(0)
        }
        if (t.input === 'ray' && z.t === 'ray') {
          expect(t.evaluate({ angle: z.angle }).points, t.kind).toBe(0)
        }
      }
    }
  })
})
