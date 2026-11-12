import { useEffect, useMemo, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { END_MOMENT_MS, useLater } from '../../lib/game'
import { fmtMs, fmtPct } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { END_RADIUS, HALF_WIDTH, HEIGHT, WIDTH, cumulative, makeControlPoints, nearest, samplePath, type Pt } from './scoring'

// waiting: not on GO yet · armed: on GO, nothing counts yet · tracing: left GO along the path, timer runs
type Phase = 'waiting' | 'armed' | 'tracing' | 'done'

export default function LineTracingTest({ onFinish }: TestComponentProps) {
  const path = useMemo(() => samplePath(makeControlPoints()), [])
  const acc = useMemo(() => cumulative(path), [path])
  const total = acc[acc.length - 1]
  const start = path[0], end = path[path.length - 1]

  const svg = useRef<SVGSVGElement>(null)
  const [phase, setPhaseState] = useState<Phase>('waiting')
  // Pointer events come in bursts; the ref lets every point in a burst see the latest phase.
  const phaseRef = useRef<Phase>('waiting')
  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  const [progress, setProgress] = useState(0) // arc length reached
  const [elapsed, setElapsed] = useState(0)
  const [failAt, setFailAt] = useState<Pt | null>(null)
  const startedAt = useRef(0)
  const last = useRef<Pt | null>(null)
  const reached = useRef(0)
  // For the result stats: distance from the center line, sampled on every checked point.
  const off = useRef({ sum: 0, count: 0, max: 0 })
  const { later } = useLater()

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
    const ms = performance.now() - startedAt.current
    later(END_MOMENT_MS, () =>
      onFinish({
        score: 0,
        failed: `Off the line at ${pct} %`,
        details: { stats: [{ label: 'Made it', value: `${pct} % of the path` }, { label: 'Time until then', value: fmtMs(ms) }] },
      }),
    )
  }

  const succeed = () => {
    setPhase('done')
    const ms = Math.round(performance.now() - startedAt.current)
    setElapsed(ms)
    const o = off.current
    later(END_MOMENT_MS, () =>
      onFinish({
        score: ms,
        details: {
          stats: [
            { label: 'Avg off-center', value: fmtPct(o.count ? o.sum / o.count / HALF_WIDTH : 0) },
            { label: 'Closest call', value: `${fmtPct(o.max / HALF_WIDTH)} to the edge` },
          ],
        },
      }),
    )
  }

  const inStart = (q: Pt) => Math.hypot(q.x - start.x, q.y - start.y) <= END_RADIUS

  const handle = (p: Pt) => {
    if (phaseRef.current === 'waiting') {
      if (inStart(p)) setPhase('armed')
      return
    }
    if (phaseRef.current === 'armed') {
      if (inStart(p)) return
      // Left GO: the run (and the timer) starts only if you left it along the path.
      const { dist, along } = nearest(p, path, acc)
      if (dist > HALF_WIDTH) return setPhase('waiting')
      startedAt.current = performance.now()
      last.current = p
      reached.current = Math.min(along, 80)
      setProgress(reached.current)
      setPhase('tracing')
      return
    }
    if (phaseRef.current !== 'tracing') return
    // check intermediate points too, so a fast move can't skip across a bend
    const from = last.current ?? p
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 6))
    for (let s = 1; s <= steps; s++) {
      const q = { x: from.x + ((p.x - from.x) * s) / steps, y: from.y + ((p.y - from.y) * s) / steps }
      const inEnd = Math.hypot(q.x - end.x, q.y - end.y) <= END_RADIUS
      const { dist, along } = nearest(q, path, acc)
      if (dist > HALF_WIDTH && !inEnd && !inStart(q)) return fail(q)
      if (!inEnd && !inStart(q)) {
        off.current.sum += dist
        off.current.count++
        off.current.max = Math.max(off.current.max, dist)
      }
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

  const status =
    phase === 'waiting' ? 'Move your pointer onto GO'
    : phase === 'armed' ? 'Leave GO along the path to start'
    : phase === 'tracing' ? 'Follow the path to the flag'
    : failAt ? 'Off the line' : 'Finished'
  return (
    <>
      <GameInfo
        left={<InfoValue value={(elapsed / 1000).toFixed(2)} unit="s" />}
        middle={<span className={failAt ? 'text-rose-300' : ''}>{status}</span>}
        right={<InfoValue value={Math.floor((progress / total) * 100)} unit="%" />}
      />
      <FullLayout className="bg-zinc-900" style={{ touchAction: 'none' }}>
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
          <circle cx={start.x} cy={start.y} r={END_RADIUS} className={phase === 'waiting' ? 'animate-pulse fill-emerald-500' : phase === 'armed' ? 'fill-emerald-400' : 'fill-emerald-500/60'} />
          <text x={start.x} y={start.y + 8} textAnchor="middle" className="pointer-events-none fill-white text-[22px] font-bold">GO</text>
          <circle cx={end.x} cy={end.y} r={END_RADIUS} className="fill-zinc-900 dark:fill-zinc-100" />
          <text x={end.x} y={end.y + 9} textAnchor="middle" className="pointer-events-none fill-white text-[26px] dark:fill-zinc-900">🏁</text>
          {failAt && <circle cx={failAt.x} cy={failAt.y} r={14} className="fill-rose-500" />}
        </svg>
      </FullLayout>
    </>
  )
}
