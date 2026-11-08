import { expect, it } from 'vitest'
import { tapsPerSecond } from './scoring'

it('converts taps to taps per second', () => expect(tapsPerSecond(73)).toBe(7.3))
