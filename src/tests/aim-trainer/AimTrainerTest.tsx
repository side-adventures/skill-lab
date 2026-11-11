import { useEffect, useRef, useState } from 'react'
import { GetReady } from '../../components/GetReady'
import { TimerBar } from '../../components/TimerBar'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { CENTER_FRACTION, DURATION_MS, TARGET_PX, hitPoints, nextSpot, type Spot } from './scoring'

interface Pop { id: number; pts: number; spot: Spot }

export default function AimTrainerTest({ onFinish }: TestComponentProps) {
  const [started, setStarted] = useState(false)
  const [spot, setSpot] = useState(() => nextSpot(undefined))
  const [points, setPoints] = useState(0)
  const [centers, setCenters] = useState(0)
  const [edges, setEdges] = useState(0)
  const [misses, setMisses] = useState(0)
  // Little "+2" / "+1" that floats up where the last target was hit.
  const [pop, setPop] = useState<Pop | null>(null)
  const popTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(popTimer.current), [])

  const remaining = useCountdown(DURATION_MS, started, () => {
    const hits = centers + edges
    onFinish({
      score: points,
      details: {
        'Center hits (2 pts)': String(centers),
        'Edge hits (1 pt)': String(edges),
        Misses: String(misses),
        Accuracy: hits + misses ? `${Math.round((hits / (hits + misses)) * 100)} %` : '–',
        'Avg per target': hits ? `${Math.round(DURATION_MS / hits)} ms` : '–',
      },
    })
  })

  if (!started) return <GetReady onDone={() => setStarted(true)} />

  const live = remaining > 0
  const place = (s: Spot) => ({
    left: `calc(${s.x} * (100% - ${TARGET_PX}px))`,
    top: `calc(${s.y} * (100% - ${TARGET_PX}px))`,
  })
  return (
    <div className="flex h-full flex-col">
      <TimerBar remaining={remaining} total={DURATION_MS}>
        🎯 {points} pts · missed {misses}
      </TimerBar>
      <div
        className="play-area relative min-h-0 flex-1 w-full cursor-crosshair overflow-hidden rounded-2xl bg-white dark:bg-zinc-900"
        style={{ touchAction: 'none' }}
        onPointerDown={() => live && setMisses((m) => m + 1)}
      >
        {pop && (
          <span
            key={pop.id}
            className={`float-up pointer-events-none absolute grid place-items-center text-lg font-black ${pop.pts === 2 ? 'text-red-600' : 'text-zinc-500'}`}
            style={{ ...place(pop.spot), width: TARGET_PX, height: TARGET_PX }}
          >
            +{pop.pts}
          </span>
        )}
        <button
          type="button"
          aria-label="Target"
          onPointerDown={(e) => {
            e.stopPropagation()
            if (!live) return
            const r = e.currentTarget.getBoundingClientRect()
            const pts = hitPoints(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width)
            setPoints((p) => p + pts)
            if (pts === 2) setCenters((c) => c + 1)
            else setEdges((c) => c + 1)
            setPop({ id: performance.now(), pts, spot })
            window.clearTimeout(popTimer.current)
            popTimer.current = window.setTimeout(() => setPop(null), 500)
            setSpot((s) => nextSpot(s))
          }}
          // Classic red/white target: white ring with a red border (1 pt), red bullseye (2 pts).
          className="absolute grid place-items-center rounded-full border-4 border-red-600 bg-white shadow-sm"
          style={{ width: TARGET_PX, height: TARGET_PX, ...place(spot) }}
        >
          <span
            className="rounded-full bg-red-600"
            style={{ width: TARGET_PX * CENTER_FRACTION, height: TARGET_PX * CENTER_FRACTION }}
          />
        </button>
      </div>
    </div>
  )
}
