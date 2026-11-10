import { describe, expect, it } from 'vitest'
import { TESTS } from './registry'

const ICONS = import.meta.glob<string>('../icons/*.svg', { query: '?raw', import: 'default', eager: true })

describe('test icons', () => {
  it('every test has an SVG icon', () => {
    const missing = TESTS.filter((t) => !ICONS[`../icons/${t.id}.svg`]).map((t) => t.id)
    expect(missing).toEqual([])
  })
  it('icons are one color (currentColor) and use unique mask ids', () => {
    const maskIds: string[] = []
    for (const [path, svg] of Object.entries(ICONS)) {
      // Only black/white are allowed, and only inside masks.
      const colors = svg.replace(/<mask[\s\S]*?<\/mask>/g, '').match(/#[0-9a-f]{3,6}\b/gi) ?? []
      expect(colors, path).toEqual([])
      expect(svg, path).toContain('viewBox="0 0 48 48"')
      maskIds.push(...[...svg.matchAll(/<mask id="([^"]+)"/g)].map((m) => m[1]))
    }
    expect(new Set(maskIds).size).toBe(maskIds.length)
  })
})
