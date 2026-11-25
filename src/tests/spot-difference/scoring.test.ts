import { describe, expect, it } from 'vitest'
import { GENS, rnd, renderItems } from './scenes.gen.js'
import { DIFFS, HIT_MIN, HIT_PAD, PER_FIND, PICTURES, wrongCost, wrongCosts, clickArea, hitDiff, makePictures, pictureScore, runScore, type PictureResult } from './scoring'

const res = (found: number, leftMs: number | null, wrong = 0, penalty = wrong): PictureResult => ({ scene: 'x', found, leftMs, wrong, penalty, skipped: false })

describe('makePictures', () => {
  it('gives 5 pictures from 5 different scenes, each with exactly 5 differences on the picture', () => {
    for (let s = 1; s <= 40; s++) {
      const pics = makePictures(rnd(s))
      expect(pics).toHaveLength(PICTURES)
      expect(new Set(pics.map((p) => p.scene)).size).toBe(PICTURES)
      for (const p of pics) {
        expect(p.diffs).toHaveLength(DIFFS)
        // the first 4 are on different items; the free 5th may share an item, but its click area overlaps no other
        expect(new Set(p.diffs.slice(0, DIFFS - 1).map((d) => d.i)).size).toBe(DIFFS - 1)
        const [ax, ay, aw, ah] = clickArea(p.diffs[DIFFS - 1].b)
        for (const o of p.diffs.slice(0, DIFFS - 1)) {
          const [bx, by, bw, bh] = clickArea(o.b)
          expect(ax < bx + bw && bx < ax + aw && ay < by + bh && by < ay + ah).toBe(false)
        }
        expect(p.diffs.filter((d) => d.easy).length).toBeLessThanOrEqual(1)
        expect(p.diffs.filter((d) => d.b[2] * d.b[3] < 16).length).toBeLessThanOrEqual(1) // at most 1 tiny change
        for (const { b } of p.diffs) {
          expect(b[0] + b[2] / 2).toBeGreaterThan(0)
          expect(b[0] + b[2] / 2).toBeLessThan(120)
          expect(b[1] + b[3] / 2).toBeGreaterThan(0)
          expect(b[1] + b[3] / 2).toBeLessThan(90)
        }
        // the two pictures really differ, and both render without broken values
        const a = renderItems(p.items), c = renderItems(p.items, p.diffs)
        expect(a).not.toBe(c)
        expect(a + c).not.toMatch(/NaN|undefined/)
      }
    }
  })

  it('every scene can come up', () => {
    const seen = new Set<string>()
    for (let s = 1; s <= 60; s++) makePictures(rnd(s)).forEach((p) => seen.add(p.scene))
    expect(seen.size).toBe(GENS.length)
  })
})

describe('hitDiff', () => {
  const diffs = makePictures(rnd(7))[0].diffs
  const d = (b: [number, number, number, number]) => ({ i: 0, t: 'remove', b, p2: {}, easy: false, cat: 'x' })
  it('hits a change anywhere in its box and just outside it, not far away', () => {
    diffs.forEach(({ b: [x, y, w, h] }, i) => {
      expect(hitDiff(diffs, x + w / 2, y + h / 2)).toBe(i)
      expect(hitDiff(diffs, x - HIT_PAD + 0.1, y + h / 2)).toBe(i)
    })
    expect(hitDiff(diffs, -20, -20)).toBe(-1)
  })
  it('a small change gets a click area of at least HIT_MIN + slack, around its centre', () => {
    const [x, y, w, h] = clickArea([50, 40, 1, 2])
    expect(w).toBeCloseTo(HIT_MIN + 2 * HIT_PAD)
    expect(h).toBeCloseTo(HIT_MIN + 2 * HIT_PAD)
    expect(x + w / 2).toBeCloseTo(50.5)
    expect(y + h / 2).toBeCloseTo(41)
    expect(clickArea([10, 10, 20, 8])).toEqual([10 - HIT_PAD, 10 - HIT_PAD, 20 + 2 * HIT_PAD, 8 + 2 * HIT_PAD]) // big enough: unchanged
  })
  it('in an overlap the nearest real box wins, inside a real box always that one; found ones are skipped', () => {
    const two = [d([10, 10, 20, 20]), d([32, 10, 1, 1])] // the small one's click area reaches into the big box
    expect(hitDiff(two, 30.5, 12)).toBe(0) // inside the big box
    expect(hitDiff(two, 32.4, 10.4)).toBe(1) // inside the small box
    expect(hitDiff(two, 31.6, 10.6)).toBe(1) // between, nearer the small one
    expect(hitDiff(two, 32.4, 10.4, [false, true])).toBe(-1) // small one found: a click on it doesn't fall through to the big one
    expect(hitDiff(two, 31.6, 12, [false, true])).toBe(0) // next to the found one, inside the big one's click area: the big one
  })
})

describe('scoring', () => {
  it('20 points per difference found in time, plus whole seconds left when all 5 are found', () => {
    expect(pictureScore(res(5, 20_900))).toBe(120)
    expect(pictureScore(res(4, null))).toBe(80)
    expect(pictureScore(res(0, null))).toBe(0)
    expect(pictureScore(res(5, null))).toBe(100) // all found, the last one after time ran out: no bonus
  })

  it('wrong clicks cost 1, 3, 5, 7, then 10 each, counted over the whole run', () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(wrongCost)).toEqual([1, 3, 5, 7, 10, 10, 10, 10, 10])
    expect(wrongCosts(0, 3)).toBe(9)
    expect(wrongCosts(3, 2)).toBe(17) // the 4th and 5th of the run, even in a new picture
    expect(pictureScore(res(5, 20_900, 2, wrongCosts(0, 2)))).toBe(120 - 4)
  })

  it('the run never goes below 0; random clicking ends at 0', () => {
    expect(runScore([res(0, null, 6, wrongCosts(0, 6)), res(1, null, 0)])).toBe(0)
    expect(runScore([res(1, null, 150, wrongCosts(0, 150)), res(1, null, 150, wrongCosts(150, 150))])).toBe(0)
  })

  it('from the 5th miss a guess costs half of what a find is worth', () => {
    expect(wrongCost(5)).toBe(PER_FIND / 2)
  })

  it('a complete slow picture beats 4 quick finds; the run is the sum', () => {
    expect(pictureScore(res(5, 1000))).toBeGreaterThan(pictureScore(res(4, null)))
    expect(runScore([res(5, 10_000), res(4, null), res(1, null)])).toBe(110 + 80 + 20)
  })
})
