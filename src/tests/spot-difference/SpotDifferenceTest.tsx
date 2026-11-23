import { useCallback, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { FullLayout } from '../../components/game/layouts'
import { Button } from '../../components/Button'
import { StartTransition } from '../../components/game/GameFrame'
import { useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { renderItems } from './scenes.gen.js'
import { DIFFS, PICTURES, POINTS_MS, hitDiff, makePictures, pictureScore, roundPoints, runScore, wrongCost, wrongCosts, type PictureResult } from './scoring'

/** Two pictures side by side in the 768 × 512 stage (4:3 each). */
const PIC_W = 376
const PIC_H = PIC_W * 0.75

/** Points with a real minus sign and a singular for 1. */
const fmtPts = (n: number) => `${n < 0 ? '−' : ''}${Math.abs(n)} ${Math.abs(n) === 1 ? 'pt' : 'pts'}`

/** Time since the picture appeared (read in event handlers). */
const since = (t0: number) => performance.now() - t0

/** The site's feedback colours (emerald-400 / rose-400) for the SVG marks. */
const OK = '#34d399'
const BAD = '#fb7185'

interface Miss { id: number; side: 0 | 1; x: number; y: number }

export default function SpotDifferenceTest({ onFinish }: TestComponentProps) {
  const [pics] = useState(() => makePictures())
  const [idx, setIdx] = useState(0)
  const [found, setFound] = useState<boolean[]>(() => Array(DIFFS).fill(false))
  const [wrong, setWrong] = useState(0)
  const [timeUp, setTimeUp] = useState(false)
  // ready: "Ready" before rounds 2–5 · play · done: the round is over, answers show until Next
  const [phase, setPhase] = useState<'ready' | 'play' | 'done'>('play')
  const [misses, setMisses] = useState<Miss[]>([])
  const [penalty, setPenalty] = useState<number | null>(null)
  const [results, setResults] = useState<PictureResult[]>([])
  const [scored, setScored] = useState(0)
  // where the pointer is (scene units, which picture), mirrored as a marker in the other picture
  const [hover, setHover] = useState<{ side: 0 | 1; x: number; y: number } | null>(null)
  const inTime = useRef(0)
  const leftAtEnd = useRef<number | null>(null)
  const clicks = useRef(0)
  const start = useRef(0)
  const missId = useRef(0)
  const { later } = useLater()

  const pic = pics[idx]
  const wrongBefore = results.slice(0, idx).reduce((s, r) => s + r.wrong, 0)
  const left = useMemo(() => renderItems(pic.items), [pic])
  const right = useMemo(() => renderItems(pic.items, pic.diffs), [pic])

  // The points clock starts when the picture is on screen.
  useLayoutEffect(() => {
    if (phase === 'play') start.current = performance.now()
  }, [idx, phase])
  const running = phase === 'play' && !timeUp
  const remaining = useCountdown(POINTS_MS, running, () => setTimeUp(true))

  /** The round is over (all found, or the answers were asked for): show them and wait for Next. */
  const endRound = (ended: boolean) => {
    setResults([...results, { scene: pic.scene, found: inTime.current, leftMs: leftAtEnd.current, ms: since(start.current), wrong, penalty: wrongCosts(wrongBefore, wrong), skipped: ended }])
    setPhase('done')
  }

  const next = () => {
    if (phase !== 'done') return
    if (idx + 1 < PICTURES) {
      inTime.current = 0
      setScored(0)
      leftAtEnd.current = null
      setFound(Array(DIFFS).fill(false))
      setWrong(0)
      setTimeUp(false)
      setMisses([])
      setPenalty(null)
      setIdx(idx + 1)
      setPhase('ready')
      return
    }
    if (clicks.current === 0) return onFinish({ score: 0, failed: 'No clicks — try again!' })
    const all = results
    const wrongAll = all.reduce((s, r) => s + r.wrong, 0)
    const penaltyAll = all.reduce((s, r) => s + r.penalty, 0)
    onFinish({
      score: runScore(all),
      details: {
        stats: [
          { label: 'Differences found', value: `${all.reduce((s, r) => s + r.found, 0)} / ${PICTURES * DIFFS}` },
          { label: 'Points from rounds', value: fmtPts(all.reduce((s, r) => s + roundPoints(r), 0)) },
          { label: 'Wrong clicks', value: wrongAll ? `${wrongAll} (${fmtPts(-penaltyAll)})` : '0' },
        ],
        extra: {
          kind: 'table',
          columns: ['Picture', 'Found', 'Time', 'Wrong', 'Points'],
          rows: all.map((r) => ({
            cells: [r.scene, `${r.found} / ${DIFFS}`, r.ms === undefined ? '–' : `${(r.ms / 1000).toFixed(1)} s`, String(r.wrong), String(roundPoints(r))],
            dim: r.found < DIFFS,
          })),
        },
      },
    })
  }
  // Next / See result: button, Enter or Space; input in the first 300 ms is ignored, so a double click on
  // "Show answers" (the same spot) doesn't skip the answers unseen.
  const armed = useContinue(next, { enabled: phase === 'done', pointer: false })
  const go = useCallback(() => setPhase('play'), [])

  const click = (side: 0 | 1, e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || phase !== 'play') return
    clicks.current++
    // Points time by the clock itself (the timer state only flips on the next frame).
    const inT = !timeUp && since(start.current) < POINTS_MS
    const r = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width) * 120
    const y = ((e.clientY - r.top) / r.height) * 90
    const k = hitDiff(pic.diffs, x, y, found)
    if (k < 0 && hitDiff(pic.diffs, x, y) >= 0) return // on an already found one: no penalty
    if (k >= 0) {
      const f = found.map((v, i) => v || i === k)
      setFound(f)
      if (inT) {
        inTime.current++
        setScored(inTime.current)
        if (inTime.current === DIFFS) leftAtEnd.current = Math.max(0, POINTS_MS - since(start.current))
      }
      if (f.every(Boolean)) endRound(false)
      return
    }
    const id = ++missId.current
    setMisses((m) => [...m, { id, side, x, y }])
    later(700, () => setMisses((m) => m.filter((q) => q.id !== id)))
    if (inT) {
      const cost = wrongCost(wrongBefore + wrong + 1)
      setWrong(wrong + 1)
      setPenalty(cost)
      later(1000, () => setPenalty((p) => (p === cost ? null : p)))
    }
  }

  const score = Math.max(0, results.reduce((s, r) => s + pictureScore(r), 0) + (phase === 'play' ? 10 * scored - wrongCosts(wrongBefore, wrong) : 0))
  const last = results[results.length - 1]
  const marks = (side: 0 | 1) => (
    <svg viewBox="0 0 120 90" className="pointer-events-none absolute inset-0 size-full">
      {pic.diffs.map(({ b: [x, y, w, h] }, i) =>
        found[i] ? (
          <rect key={i} x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx={2} fill="none" stroke={OK} strokeWidth={1} />
        ) : phase === 'done' ? (
          <rect key={i} x={x - 1.5} y={y - 1.5} width={w + 3} height={h + 3} rx={2} fill="none" stroke={BAD} strokeWidth={0.9} strokeDasharray="2 1.5" />
        ) : null,
      )}
      {hover && hover.side !== side && phase !== 'ready' && (
        // the pointer's spot in the other picture: a white ring with a dark edge and a dot, unlike anything in a scene
        <g opacity={0.9}>
          <circle cx={hover.x} cy={hover.y} r={2.3} fill="none" stroke="#0a0a0a" strokeWidth={0.9} opacity={0.55} />
          <circle cx={hover.x} cy={hover.y} r={2.3} fill="none" stroke="#ffffff" strokeWidth={0.4} />
          <circle cx={hover.x} cy={hover.y} r={0.35} fill="#ffffff" stroke="#0a0a0a" strokeWidth={0.15} />
        </g>
      )}
      {misses.filter((m) => m.side === side).map((m) => (
        <path key={m.id} d={`M${m.x - 2.5} ${m.y - 2.5}L${m.x + 2.5} ${m.y + 2.5}M${m.x + 2.5} ${m.y - 2.5}L${m.x - 2.5} ${m.y + 2.5}`} stroke={BAD} strokeWidth={1.2} strokeLinecap="round" />
      ))}
    </svg>
  )

  const middle = phase === 'ready' ? (
    'Next picture'
  ) : phase === 'done' && last ? (
    <span className={last.found === DIFFS ? 'text-emerald-300' : 'text-zinc-300'}>
      {last.found === DIFFS ? `All ${DIFFS} found` : `${last.found} of ${DIFFS} found in time`} · +{fmtPts(roundPoints(last))}
    </span>
  ) : timeUp ? (
    <span className="text-amber-300">Time is up · no more points</span>
  ) : penalty !== null ? (
    <>Find the {DIFFS} differences <span className="text-rose-300">· {fmtPts(-penalty)}</span></>
  ) : (
    `Find the ${DIFFS} differences`
  )

  return (
    <>
      <GameInfo
        left={
          <>
            <InfoValue value={phase === 'ready' ? (POINTS_MS / 1000).toFixed(1) : timeUp ? '0.0' : (remaining / 1000).toFixed(1)} unit="s left" />
            <InfoValue value={`Round ${idx + 1}`} of={PICTURES} />
          </>
        }
        middle={middle}
        right={<InfoValue label="Score" value={score} unit="pts" />}
        timer={phase === 'ready' ? 1 : timeUp ? 0 : remaining / POINTS_MS}
      />
      <FullLayout className="flex flex-col items-center justify-center gap-4 bg-zinc-950/40">
        <div className="relative flex gap-2">
          {phase === 'ready' && (
            <div className="absolute inset-0 z-10 grid place-items-center rounded-lg bg-zinc-950">
              <StartTransition mode="quick" onDone={go} />
            </div>
          )}
          {[left, right].map((svg, side) => (
            <div
              key={`${idx}-${side}`}
              className={`relative cursor-crosshair overflow-hidden rounded-lg ${phase === 'ready' ? '' : 'ring-1 ring-zinc-500/80'}`}
              style={{ width: PIC_W, height: PIC_H }}
              onPointerDown={(e) => click(side as 0 | 1, e)}
              onPointerMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                setHover({ side: side as 0 | 1, x: ((e.clientX - r.left) / r.width) * 120, y: ((e.clientY - r.top) / r.height) * 90 })
              }}
              onPointerLeave={() => setHover(null)}
            >
              <svg viewBox="0 0 120 90" className="block size-full" dangerouslySetInnerHTML={{ __html: svg }} />
              {marks(side as 0 | 1)}
            </div>
          ))}
        </div>
        <div className="flex w-full items-center justify-between gap-4 px-3" style={{ maxWidth: 2 * PIC_W + 8 }}>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            Found
            {found.map((_, i) => (
              <span key={i} className={`size-3 rounded-full ${i < found.filter(Boolean).length ? 'bg-emerald-400' : 'border border-zinc-600'}`} />
            ))}
          </div>
          <div className="flex items-center gap-3">
            {phase === 'play' && timeUp && <span className="text-sm text-zinc-400">Keep looking, or show the answers</span>}
            {phase === 'done' ? (
              <Button key="next" size="sm" onClick={() => armed.current && next()}>{idx + 1 < PICTURES ? 'Next' : 'See result'}</Button>
            ) : (
              <Button key="show" size="sm" variant="secondary" disabled={phase !== 'play'} onClick={() => endRound(true)}>
                Show answers
              </Button>
            )}
          </div>
        </div>
      </FullLayout>
    </>
  )
}
