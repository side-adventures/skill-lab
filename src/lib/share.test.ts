import { describe, expect, it } from 'vitest'
import { buildAllScoresText, buildShareText, testUrl } from './share'

describe('share', () => {
  it('builds a single-test message and link', () => {
    expect(buildShareText('Reaction Time', '240 ms')).toBe('I scored 240 ms on Reaction Time at Skill Lab — can you beat it?')
    expect(testUrl('reaction', 'https://x.github.io/skill-lab/')).toBe('https://x.github.io/skill-lab/#/test/reaction')
  })
  it('lists all played tests', () => {
    expect(
      buildAllScoresText([
        { icon: '⚡', name: 'Reaction Time', score: '240 ms' },
        { icon: '🎨', name: 'Stroop Test', score: '30 pts' },
      ]),
    ).toBe('My Skill Lab best scores:\n⚡ Reaction Time: 240 ms\n🎨 Stroop Test: 30 pts\nCan you beat them?')
  })
})
