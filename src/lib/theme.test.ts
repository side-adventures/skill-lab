import { describe, expect, it } from 'vitest'
import { THEMES, nextTheme } from './theme'

describe('theme', () => {
  it('cycles auto → light → dark → auto', () => {
    expect(THEMES.map(nextTheme)).toEqual(['light', 'dark', 'system'])
  })
})
