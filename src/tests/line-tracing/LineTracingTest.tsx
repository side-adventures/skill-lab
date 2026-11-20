import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { useLater } from '../../lib/game'
import type { TestComponentProps } from '../types'
import {
  END_RADIUS, HEIGHT, PENALTY_MS, WIDTH, WINDOW, indexRange, makeTracks, nearestIn, totalMs, type Pt, type Route, type Track,
} from './scoring'

// waiting: not on GO yet · armed: on GO, nothing counts yet · tracing: left GO along the path, timer runs
// between: a track just finished, the next one comes · done: all tracks finished
type Phase = 'waiting' | 'armed' | 'tracing' | 'between' | 'done'

const NEXT_TRACK_MS = 1000
/** After the last flag: a short look at the full trace, like other tests after a last correct answer. */
const FINISH_MS = 400
const secs = (ms: number) => (ms / 1000).toFixed(2)
const line = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

/** The corridor of one route between sample indexes [from, to), as round-capped segments (widths may vary). */
function Segments({ r, from, to, className }: { r: Route; from: number; to: number; className: string }) {
  const out = []
  for (let i = from; i < Math.min(to, r.pts.length - 1); i++) {
    const a = r.pts[i], b = r.pts[i + 1]
    out.push(<line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={r.half[i] * 2} strokeLinecap="round" />)
  }
  return <g className={className}>{out}</g>
}

const centerLine = 'stroke-zinc-400 dark:stroke-zinc-600'

/**
 * All routes of the track. Drawn last route first, so route 0 (the main road at the fork) lies on top and its center
 * line runs on through the junction.
 */
const Corridor = memo(function Corridor({ track }: { track: Track }) {
  return (
    <>
      {[...track.routes].reverse().map((r, k) => (
        <g key={k}>
          <Segments r={r} from={0} to={r.pts.length} className="stroke-zinc-200 dark:stroke-zinc-800" />
          <path d={line(r.pts)} fill="none" strokeWidth={2} strokeDasharray="8 12" className={centerLine} />
        </g>
      ))}
    </>
  )
})

/**
 * The bridge: the piece of the later pass where it crosses the earlier one, drawn again on top with a dark edge. Flat
 * ends, so it doesn't cover the path (or the traced line) before and after it.
 */
const Bridge = memo(function Bridge({ r, range }: { r: Route; range: [number, number] }) {
  const [from, to] = indexRange(r, ...range)
  const d = line(r.pts.slice(from, to))
  const w = r.half[Math.floor((from + to) / 2)] * 2
  return (
    <>
      <path d={d} fill="none" strokeWidth={w + 18} strokeLinejoin="round" className="stroke-zinc-100 dark:stroke-zinc-900" />
      <path d={d} fill="none" strokeWidth={w} strokeLinejoin="round" className="stroke-zinc-200 dark:stroke-zinc-800" />
      <path d={d} fill="none" strokeWidth={2} strokeDasharray="8 12" className={centerLine} />
    </>
  )
})

export default function LineTracingTest({ onFinish }: TestComponentProps) {
  const tracks = useMemo(() => makeTracks(), [])
  const [index, setIndex] = useState(0)
  const track = tracks[index]
  const start = track.routes[0].pts[0], end = track.routes[0].pts.at(-1)!

  const svg = useRef<SVGSVGElement>(null)
  const [phase, setPhaseState] = useState<Phase>('waiting')
  // Pointer events come in bursts; the ref lets every point in a burst see the latest phase.
  const phaseRef = useRef<Phase>('waiting')
  const setPhase = (p: Phase) => {
    phaseRef.current = p
    setPhaseState(p)
  }
  // Per route: still possible (you are inside it) and the arc length reached on it.
  const alive = useRef<boolean[]>([])
  const reached = useRef<number[]>([])
  const [drawn, setDrawn] = useState<{ route: number; along: number }>({ route: 0, along: 0 })
  const [elapsed, setElapsed] = useState(0)
  const [failAt, setFailAt] = useState<Pt | null>(null)
  // left GO but not along the path: no penalty, but say why nothing started
  const [offStart, setOffStart] = useState(false)
  const trackMs = useRef<number[]>([])
  const [times, setTimes] = useState<number[]>([])
  const [exits, setExits] = useState(0)
  const exitsRef = useRef(0)
  const trackExits = useRef<number[]>([])
  const startedAt = useRef(0)
  const last = useRef<Pt | null>(null)
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

  const showProgress = () => {
    let best = -1
    alive.current.forEach((a, k) => {
      if (a && (best < 0 || reached.current[k] > reached.current[best])) best = k
    })
    if (best >= 0) setDrawn({ route: best, along: reached.current[best] })
  }

  const exit = (at: Pt) => {
    exitsRef.current++
    trackExits.current[index] = (trackExits.current[index] ?? 0) + 1
    setExits(exitsRef.current)
    // a board exit happens outside the svg: keep the dot on the board's edge so it stays visible
    setFailAt({ x: Math.min(WIDTH - 14, Math.max(14, at.x)), y: Math.min(HEIGHT - 14, Math.max(14, at.y)) })
    setElapsed(0)
    setPhase('waiting')
  }

  const finishTrack = () => {
    const ms = Math.round(performance.now() - startedAt.current)
    trackMs.current.push(ms)
    setTimes([...trackMs.current])
    setElapsed(0)
    if (index < tracks.length - 1) {
      setPhase('between')
      later(NEXT_TRACK_MS, () => {
        setIndex((i) => i + 1)
        setDrawn({ route: 0, along: 0 })
        setPhase('waiting')
      })
      return
    }
    setPhase('done')
    const times = trackMs.current, n = exitsRef.current
    later(FINISH_MS, () =>
      onFinish({
        score: totalMs(times, n),
        details: {
          stats: [
            { label: 'Times you left', value: String(n) },
            { label: 'Penalty', value: n ? `+${(n * PENALTY_MS) / 1000} s` : '0 s' },
            { label: 'Time without penalty', value: `${secs(times.reduce((s, t) => s + t, 0))} s` },
          ],
          chips: {
            title: 'Tracks',
            items: times.map((t, i) => {
              const pen = ((trackExits.current[i] ?? 0) * PENALTY_MS) / 1000
              return { label: tracks[i].name, value: `${secs(t)} s${pen ? ` +${pen} s` : ''}` }
            }),
          },
        },
      }),
    )
  }

  const inStart = (q: Pt) => Math.hypot(q.x - start.x, q.y - start.y) <= END_RADIUS
  const inEnd = (q: Pt) => Math.hypot(q.x - end.x, q.y - end.y) <= END_RADIUS

  const handle = (p: Pt) => {
    if (phaseRef.current === 'waiting') {
      if (inStart(p)) {
        setFailAt(null)
        setOffStart(false)
        setDrawn({ route: 0, along: 0 })
        setPhase('armed')
      }
      return
    }
    if (phaseRef.current === 'armed') {
      if (inStart(p)) return
      // Left GO: the track (and the timer) starts only if you left it along the path.
      const hits = track.routes.map((r) => nearestIn(p, r, 0, WINDOW))
      if (!hits.some((h) => h.inside)) {
        setOffStart(true)
        return setPhase('waiting')
      }
      alive.current = hits.map((h) => h.inside)
      reached.current = hits.map((h) => h.along)
      startedAt.current = performance.now()
      last.current = p
      showProgress()
      setPhase('tracing')
      return
    }
    if (phaseRef.current !== 'tracing') return
    // check intermediate points too, so a fast move can't skip across a bend
    const from = last.current ?? p
    const steps = Math.max(1, Math.ceil(Math.hypot(p.x - from.x, p.y - from.y) / 6))
    for (let s = 1; s <= steps; s++) {
      const q = { x: from.x + ((p.x - from.x) * s) / steps, y: from.y + ((p.y - from.y) * s) / steps }
      const atEnd = inEnd(q), atStart = inStart(q)
      track.routes.forEach((r, k) => {
        if (!alive.current[k]) return
        // only near your progress, so the other pass of the loop never counts
        const h = nearestIn(q, r, reached.current[k] - WINDOW, reached.current[k] + WINDOW)
        if (h.inside) reached.current[k] = Math.max(reached.current[k], h.along)
        else if (!atEnd && !atStart) alive.current[k] = false
      })
      if (!alive.current.some(Boolean)) return exit(q)
      if (atEnd && track.routes.some((r, k) => alive.current[k] && reached.current[k] > r.length * 0.9)) {
        const k = alive.current.findIndex(Boolean)
        setDrawn({ route: k, along: track.routes[k].length })
        return finishTrack()
      }
    }
    last.current = p
    showProgress()
  }

  const onMove = (e: React.PointerEvent) => {
    const events = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const ev of events.length ? events : [e.nativeEvent]) handle(toSvg(ev.clientX, ev.clientY))
  }

  // the traced part, split at the bridge so the lower pass stays under it
  const r = track.routes[drawn.route]
  const reachedIdx = indexRange(r, 0, drawn.along)[1]
  const [b0] = track.bridge && drawn.route === 0 ? indexRange(r, ...track.bridge) : [r.pts.length]
  const tracedBelow = r.pts.slice(0, Math.min(reachedIdx, b0 + 1))
  const tracedAbove = reachedIdx > b0 ? r.pts.slice(b0, reachedIdx) : []
  const tracedClass = 'stroke-violet-500'

  const total = totalMs(times, exits) + (phase === 'tracing' ? elapsed : 0)
  const status =
    phase === 'waiting'
      ? failAt ? `Off the path · +${PENALTY_MS / 1000} s · back to GO`
      : offStart ? 'Start along the path · back to GO'
      : 'Move your pointer onto GO'
    : phase === 'armed' ? 'Leave GO along the path to start'
    : phase === 'tracing' ? 'Follow the path to the flag'
    : phase === 'between' ? `${track.name} done: ${secs(times.at(-1) ?? 0)} s`
    : 'Finished'
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Track ${index + 1}`} of={tracks.length} />}
        middle={<span className={(failAt || offStart) && phase === 'waiting' ? 'text-rose-300' : ''}>{status}</span>}
        right={<InfoValue label="Total" value={secs(total)} unit="s" />}
      />
      <FullLayout className="bg-zinc-900" style={{ touchAction: 'none' }}>
        <svg
          ref={svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block size-full cursor-crosshair"
          onPointerMove={onMove}
          onPointerDown={(e) => handle(toSvg(e.clientX, e.clientY))}
          onPointerUp={(e) => phaseRef.current === 'tracing' && e.pointerType !== 'mouse' && exit(toSvg(e.clientX, e.clientY))}
          onPointerLeave={(e) => phaseRef.current === 'tracing' && exit(toSvg(e.clientX, e.clientY))}
        >
          <Corridor track={track} />
          {tracedBelow.length > 1 && <path d={line(tracedBelow)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={10} className={tracedClass} />}
          {track.bridge && <Bridge r={track.routes[0]} range={track.bridge} />}
          {tracedAbove.length > 1 && <path d={line(tracedAbove)} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={10} className={tracedClass} />}
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
