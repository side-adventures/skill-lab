import { useEffect, useMemo, useRef, useState } from 'react'
import type { TestComponentProps } from '../types'
import { END_RADIUS, HALF_WIDTH, HEIGHT, WIDTH, cumulative, makeControlPoints, nearest, samplePath, type Pt } from './scoring'

type Phase = 'waiting' | 'tracing' | 'done'

export default function LineTracingTest({ onFinish }: TestComponentProps) {
  const path = useMemo(() => samplePath(makeControlPoints()), [])
  const acc = useMemo(() => cumulative(path), [path])
  const total = acc[acc.length - 1]
  const start = path[0], end = path[path.length - 1]

  const svg = useRef<SVGSVGElement>(null)
  const [phase, setPhase] = useState<Phase>('waiting')
  const [progress, setProgress] = useState(0) // arc length reached
  const [elapsed, setElapsed] = useState(0)
  const [failAt, setFailAt] = useState<Pt | null>(null)
  const startedAt = useRef(0)
  const last = useRef<Pt | null>(null)
  const reached = useRef(0)
  const endTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(endTimer.current), [])

  useEffect(() => {
    if (phase !== 'tracing') return
    const id = window.setInterval(() => setElapsed(performance.now() - startedAt.current), 50)
    return () => window.clearInterval(id)
  }, [phase])

  const toSvg = (clientX: number, clientY: number): Pt => {
    const m = svg.current!.getScreenCTM()!.inverse()
    const p = new DOMPoint(clientX, clientY).matrixTransform(m)
    return { x: p.x, y: p.y }
  }

  const fail = (at: Pt) => {
    setFailAt(at)
    setPhase('done')
    const pct = Math.floor((reached.current / total) * 100)
    endTimer.current = window.setTimeout(() => onFinish({ score: 0, failed: `Off the line at ${pct} %` }), 1200)
  }

  const succeed = () => {
    setPhase('done')
    const ms = Math.round(performance.now() - startedAt.current)
    setElapsed(ms)
    endTimer.current = window.setTimeout(() => onFinish({ score: ms }), 600)
  }

  const handle = (p: Pt) => {
    if (phase === 'waiting') {
      if (Math.hypot(p.x - start.x, p.y - start.y) <= END_RADIUS) {
        startedAt.current = performance.now()
        last.current = p
        reached.current = 0
        setPhase('tracing')
      }
      return
    }
    if (phase !== 'tracing') return
    // check intermediate points too, so a fast move can't skip across a bend
    const from = last.current ?? p
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 6))
    for (let s = 1; s <= steps; s++) {
      const q = { x: from.x + ((p.x - from.x) * s) / steps, y: from.y + ((p.y - from.y) * s) / steps }
      const inEnd = Math.hypot(q.x - end.x, q.y - end.y) <= END_RADIUS
      const { dist, along } = nearest(q, path, acc)
      if (dist > HALF_WIDTH && !inEnd) return fail(q)
      // progress only advances continuously (no jumping ahead along the path)
      if (along > reached.current && along - reached.current < 80) reached.current = along
      if (inEnd && reached.current > total * 0.9) {
        reached.current = total
        setProgress(total)
        return succeed()
      }
    }
    last.current = p
    setProgress(reached.current)
  }

  const onMove = (e: React.PointerEvent) => {
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) handle(toSvg(ev.clientX, ev.clientY))
  }

  const d = path.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const doneIdx = acc.findIndex((a) => a >= progress)
  const traced = path.slice(0, doneIdx === -1 ? path.length : doneIdx + 1)
  const dTraced = traced.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex justify-between text-sm text-zinc-500">
        <span className="tabular-nums">{(elapsed / 1000).toFixed(2)} s</span>
        <span>{Math.floor((progress / total) * 100)} %</span>
      </div>
      <div className="play-area min-h-0 flex-1 rounded-2xl bg-white p-2 dark:bg-zinc-900" style={{ touchAction: 'none' }}>
        <svg
          ref={svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block size-full cursor-crosshair"
          onPointerMove={onMove}
          onPointerDown={(e) => handle(toSvg(e.clientX, e.clientY))}
          onPointerUp={(e) => phase === 'tracing' && e.pointerType !== 'mouse' && fail(toSvg(e.clientX, e.clientY))}
          onPointerLeave={(e) => phase === 'tracing' && fail(toSvg(e.clientX, e.clientY))}
        >
          <path d={d} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={HALF_WIDTH * 2} className="stroke-zinc-200 dark:stroke-zinc-800" />
          <path d={d} fill="none" strokeWidth={3} strokeDasharray="10 12" className="stroke-zinc-400 dark:stroke-zinc-600" />
          {traced.length > 1 && <path d={dTraced} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={10} className="stroke-violet-500" />}
          <circle cx={start.x} cy={start.y} r={END_RADIUS} className={phase === 'waiting' ? 'animate-pulse fill-emerald-500' : 'fill-emerald-500/60'} />
          <text x={start.x} y={start.y + 8} textAnchor="middle" className="pointer-events-none fill-white text-[22px] font-bold">GO</text>
          <circle cx={end.x} cy={end.y} r={END_RADIUS} className="fill-zinc-900 dark:fill-zinc-100" />
          <text x={end.x} y={end.y + 9} textAnchor="middle" className="pointer-events-none fill-white text-[26px] dark:fill-zinc-900">🏁</text>
          {failAt && <circle cx={failAt.x} cy={failAt.y} r={14} className="fill-rose-500" />}
        </svg>
      </div>
      <p className="mt-3 text-center text-sm text-zinc-500">
        {phase === 'waiting'
          ? 'Put your pointer (or finger) on GO, then follow the path to the flag without leaving it.'
          : phase === 'tracing' ? 'Go go go!' : failAt ? 'Off the line!' : `Finished in ${(elapsed / 1000).toFixed(2)} s`}
      </p>
    </div>
  )
}
