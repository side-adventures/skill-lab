import { useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, resultDetails, tapsPerSecond } from './scoring'

export default function TapSpeedTest({ onFinish }: TestComponentProps) {
  const [taps, setTaps] = useState(0)
  const started = taps > 0
  // Click times in ms since the first click (for the clicks-per-frame stats).
  const times = useRef<number[]>([])
  const firstAt = useRef(0)

  const remaining = useCountdown(DURATION_MS, started, () =>
    onFinish({ score: tapsPerSecond(taps), details: resultDetails(times.current) }),
  )
  const live = !started || remaining > 0

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle={started ? 'Keep clicking!' : 'The timer starts with your first click'}
        right={<InfoValue label="Clicks" value={taps} />}
        timer={remaining / DURATION_MS}
      />
      <FullLayout
        // pointerdown per finger: multi-finger tapping is allowed
        onPointerDown={(e) => {
          if (!live || e.button !== 0) return // left button only (touch counts as button 0)
          const now = performance.now()
          if (!times.current.length) firstAt.current = now
          times.current.push(now - firstAt.current)
          setTaps((t) => t + 1)
        }}
        className="grid cursor-pointer place-items-center bg-violet-600 text-white select-none active:bg-violet-700"
        style={{ touchAction: 'none' }}
      >
        <span className="text-8xl font-bold tabular-nums">{taps}</span>
      </FullLayout>
    </>
  )
}
