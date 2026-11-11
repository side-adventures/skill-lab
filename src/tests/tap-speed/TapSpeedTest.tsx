import { useState } from 'react'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, tapsPerSecond } from './scoring'

export default function TapSpeedTest({ onFinish }: TestComponentProps) {
  const [taps, setTaps] = useState(0)
  const started = taps > 0

  const remaining = useCountdown(DURATION_MS, started, () =>
    onFinish({ score: tapsPerSecond(taps), details: { 'Total taps': String(taps) } }),
  )
  const live = !started || remaining > 0

  return (
    <div className="flex h-full flex-col">
      <TimerBar remaining={remaining} total={DURATION_MS}>{taps} taps</TimerBar>
      <button
        type="button"
        // pointerdown per finger: multi-finger tapping is allowed
        onPointerDown={() => live && setTaps((t) => t + 1)}
        onKeyDown={(e) => e.preventDefault()}
        className="play-area flex min-h-0 flex-1 w-full flex-col items-center justify-center rounded-2xl bg-violet-600 text-white select-none active:bg-violet-700"
        style={{ touchAction: 'none' }}
      >
        <span className="text-7xl font-bold tabular-nums">{taps}</span>
        <span className="mt-3 text-lg opacity-90">{started ? 'Keep tapping!' : 'Start tapping — the timer starts with your first tap'}</span>
      </button>
    </div>
  )
}
