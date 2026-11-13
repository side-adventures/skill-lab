import { useEffect, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { CENTER_FRACTION, DURATION_MS, TARGET_PX, hitPoints, nextSpot, type Spot } from './scoring'

interface Pop { id: number; pts: number; spot: Spot }

export default function AimTrainerTest({ onFinish }: TestComponentProps) {
  const [spot, setSpot] = useState(() => nextSpot(undefined))
  const [points, setPoints] = useState(0)
  const [centers, setCenters] = useState(0)
  const [edges, setEdges] = useState(0)
  const [misses, setMisses] = useState(0)
  // Little "+2" / "+1" that floats up where the last target was hit.
  const [pop, setPop] = useState<Pop | null>(null)
  const popTimer = useRef<number | undefined>(undefined)
  // When the current target appeared, and the fastest hit (for the result stats).
  const shownAt = useRef(0)
  const fastest = useRef(Infinity)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  useEffect(() => () => window.clearTimeout(popTimer.current), [])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const hits = centers + edges
    onFinish({
      score: points,
      ...(centers + edges + misses === 0 && { failed: 'No clicks — try again!' }), // idle run: shown, not saved
      details: {
        stats: [
          { label: 'Center hits', value: String(centers) },
          { label: 'Edge hits', value: String(edges) },
          { label: 'Misses', value: String(misses) },
          { label: 'Accuracy', value: hits + misses ? `${Math.round((hits / (hits + misses)) * 100)} %` : '–' },
          { label: 'Avg per target', value: hits ? `${Math.round(DURATION_MS / hits)} ms` : '–' },
          ...(hits ? [{ label: 'Fastest hit', value: `${Math.round(fastest.current)} ms` }] : []),
        ],
      },
    })
  })


  const live = remaining > 0
  const place = (s: Spot) => ({
    left: `calc(${s.x} * (100% - ${TARGET_PX}px))`,
    top: `calc(${s.y} * (100% - ${TARGET_PX}px))`,
  })
  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle={misses ? `${misses} missed` : ''}
        right={<InfoValue label="Score" value={points} unit="pts" />}
        timer={remaining / DURATION_MS}
      />
      <FullLayout
        className="cursor-crosshair bg-zinc-900"
        style={{ touchAction: 'none' }}
        onPointerDown={(e) => live && e.button === 0 && setMisses((m) => m + 1)}
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
            if (!live || e.button !== 0) return
            const r = e.currentTarget.getBoundingClientRect()
            const pts = hitPoints(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2), r.width)
            setPoints((p) => p + pts)
            if (pts === 2) setCenters((c) => c + 1)
            else setEdges((c) => c + 1)
            setPop({ id: performance.now(), pts, spot })
            window.clearTimeout(popTimer.current)
            popTimer.current = window.setTimeout(() => setPop(null), 500)
            const now = performance.now()
            fastest.current = Math.min(fastest.current, now - shownAt.current)
            shownAt.current = now
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
      </FullLayout>
    </>
  )
}
