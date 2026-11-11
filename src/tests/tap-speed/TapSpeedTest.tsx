import { useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
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
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle={started ? 'Keep clicking!' : 'The timer starts with your first click'}
        right={<InfoValue label="Clicks" value={taps} />}
        timer={remaining / DURATION_MS}
      />
      <FullLayout
        // pointerdown per finger: multi-finger tapping is allowed
        onPointerDown={() => live && setTaps((t) => t + 1)}
        className="grid cursor-pointer place-items-center bg-violet-600 text-white select-none active:bg-violet-700"
        style={{ touchAction: 'none' }}
      >
        <span className="text-8xl font-bold tabular-nums">{taps}</span>
      </FullLayout>
    </>
  )
}
