import { useEffect, useRef, useState } from 'react'
import { TimerBar } from '../../components/TimerBar'
import { useLatest } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { DURATION_MS, RAMP_IN_MS, pathAt, radiusAt, randomPhases, scoreInside, speedAt } from './scoring'

export default function SteadyHandTest({ onFinish }: TestComponentProps) {
  const [playing, setPlaying] = useState(false)
  const [hud, setHud] = useState({ remaining: DURATION_MS, pct: 0 })
  const area = useRef<HTMLDivElement>(null)
  const circle = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const onFinishRef = useLatest(onFinish)

  // Position the circle in the area; returns whether the pointer is inside it.
  const draw = (nx: number, ny: number, radiusFrac: number) => {
    const el = area.current, c = circle.current
    if (!el || !c) return false
    const { width: w, height: h } = el.getBoundingClientRect()
    const r = Math.min(w, h) * radiusFrac
    const cx = w / 2 + nx * (w / 2 - r - 4)
    const cy = h / 2 + ny * (h / 2 - r - 4)
    c.style.width = c.style.height = `${r * 2}px`
    c.style.transform = `translate(${cx - r}px, ${cy - r}px)`
    const p = pointer.current
    const inside = !!p && (p.x - cx) ** 2 + (p.y - cy) ** 2 <= r * r
    c.dataset.inside = String(inside)
    return inside
  }

  // Before start: circle rests in the centre, game starts once the pointer is inside it.
  useEffect(() => {
    if (playing) return
    let raf = 0
    const idle = () => {
      if (draw(0, 0, radiusAt(0))) return setPlaying(true)
      raf = requestAnimationFrame(idle)
    }
    raf = requestAnimationFrame(idle)
    return () => cancelAnimationFrame(raf)
  }, [playing])

  useEffect(() => {
    if (!playing) return
    const phases = randomPhases()
    const start = performance.now()
    let last = start, t = 0, insideMs = 0, lastHud = 0, raf = 0
    const tick = (now: number) => {
      const elapsed = Math.min(now - start, DURATION_MS)
      const dt = Math.min(now - last, 100) // ignore big gaps (tab switch)
      last = now
      const progress = elapsed / DURATION_MS
      t += (dt / 1000) * speedAt(progress)
      const amp = Math.min(1, elapsed / RAMP_IN_MS) // glide out of the centre
      const pos = pathAt(t, phases)
      if (draw(pos.x * amp, pos.y * amp, radiusAt(progress))) insideMs += dt
      if (now - lastHud > 100 || elapsed >= DURATION_MS) {
        lastHud = now
        setHud({ remaining: DURATION_MS - elapsed, pct: scoreInside(insideMs, Math.max(elapsed, 1)) })
      }
      if (elapsed >= DURATION_MS) {
        const score = scoreInside(insideMs)
        return onFinishRef.current({
          score,
          details: { 'Time inside': `${(insideMs / 1000).toFixed(1)} s`, 'Time outside': `${((DURATION_MS - insideMs) / 1000).toFixed(1)} s` },
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, onFinishRef])

  const track = (e: React.PointerEvent) => {
    const rect = area.current!.getBoundingClientRect()
    pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  return (
    <div className="flex h-full flex-col">
      <TimerBar remaining={hud.remaining} total={DURATION_MS}>
        {playing ? `Inside: ${hud.pct.toFixed(1)} %` : 'Not started'}
      </TimerBar>
      <div
        ref={area}
        onPointerMove={track}
        onPointerDown={track}
        onPointerLeave={() => (pointer.current = null)}
        onPointerUp={(e) => e.pointerType === 'touch' && (pointer.current = null)}
        className="play-area relative min-h-0 flex-1 w-full cursor-crosshair overflow-hidden rounded-2xl bg-white dark:bg-zinc-900"
        style={{ touchAction: 'none' }}
      >
        <div
          ref={circle}
          className="pointer-events-none absolute top-0 left-0 rounded-full border-4 border-rose-500 bg-rose-500/15 data-[inside=true]:border-emerald-500 data-[inside=true]:bg-emerald-500/20"
        />
        {!playing && (
          <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-zinc-500">
            Move your pointer (or finger) into the circle to start
          </p>
        )}
      </div>
    </div>
  )
}
