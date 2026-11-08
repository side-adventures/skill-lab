import { useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, TARGET_PX, nextSpot } from './scoring'

export default function AimTrainerTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [spot, setSpot] = useState(() => nextSpot(undefined))
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)

  const remaining = useCountdown(DURATION_MS, started, () =>
    onFinish({
      score: hits,
      details: {
        Misses: String(misses),
        Accuracy: hits + misses ? `${Math.round((hits / (hits + misses)) * 100)} %` : '–',
        'Avg per target': hits ? `${Math.round(DURATION_MS / hits)} ms` : '–',
      },
    }),
  )

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const live = remaining > 0
  return (
    <div>
      <TimerBar remaining={remaining} total={DURATION_MS}>
        🎯 {hits} · missed {misses}
      </TimerBar>
      <div
        className="play-area relative h-[60vh] max-h-[520px] min-h-[320px] w-full cursor-crosshair overflow-hidden rounded-2xl bg-white dark:bg-zinc-900"
        style={{ touchAction: 'none' }}
        onPointerDown={() => live && setMisses((m) => m + 1)}
      >
        <button
          type="button"
          aria-label="Target"
          onPointerDown={(e) => {
            e.stopPropagation()
            if (!live) return
            setHits((h) => h + 1)
            setSpot((s) => nextSpot(s))
          }}
          className="absolute grid place-items-center rounded-full bg-rose-500 ring-4 ring-rose-500/30"
          style={{
            width: TARGET_PX,
            height: TARGET_PX,
            left: `calc(${spot.x} * (100% - ${TARGET_PX}px))`,
            top: `calc(${spot.y} * (100% - ${TARGET_PX}px))`,
          }}
        >
          <span className="size-1/2 rounded-full bg-white" />
        </button>
      </div>
    </div>
  )
}
