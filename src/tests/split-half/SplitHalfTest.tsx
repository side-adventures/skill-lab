import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { useActionKey } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import type { Pt } from '../geometry/scoring'
import { ROUNDS, START_X, evaluate, leftPart, makeRounds, resultDetails, rightPart, totalScore } from './scoring'

const STROKE = 0.9
/** The white cut line: thin, so it doesn't hide the shape's edge it crosses. */
const CUT_LINE = 0.45
const toPoints = (pts: Pt[]) => pts.map((p) => `${p.x},${p.y}`).join(' ')
type Result = { name: string; points: number; left: number }

export default function SplitHalfTest({ onFinish }: TestComponentProps) {
  const [rounds] = useState(() => makeRounds())
  const [index, setIndex] = useState(0)
  const round = rounds[index]
  const [x, setX] = useState(START_X)
  const [touched, setTouched] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [results, setResults] = useState<Result[]>([])
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const fromPointer = (e: React.PointerEvent) => {
    if (result) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse())
    setX(Math.min(100, Math.max(0, p.x)))
    setTouched(true)
  }

  const submit = () => {
    if (result || !touched) return
    const ev = evaluate(round, x)
    const r = { name: round.name, points: ev.points, left: ev.left }
    setResult(r)
    setResults([...results, r])
  }

  const next = () => {
    if (index + 1 >= ROUNDS) return onFinish({ score: totalScore(results.map((r) => r.points)), details: resultDetails(results) })
    setIndex(index + 1)
    setX(START_X)
    setTouched(false)
    setResult(null)
  }

  useActionKey(submit, !result)
  // ← / → nudge the line (Shift: bigger steps); a bonus next to dragging
  useEffect(() => {
    if (result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'ArrowLeft' && e.code !== 'ArrowRight') return
      e.preventDefault()
      const step = (e.shiftKey ? 2 : 0.5) * (e.code === 'ArrowLeft' ? -1 : 1)
      setX((v) => Math.min(100, Math.max(0, v + step)))
      setTouched(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result])

  const soFar = results.length ? totalScore(results.map((r) => r.points)) : 0
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${index + 1}`} of={ROUNDS} />}
        middle={result ? '' : touched ? 'Adjust, then Done' : 'Click or drag on the board'}
        right={results.length > 0 && <InfoValue label="Score" value={soFar.toFixed(1)} unit="pts" />}
      />
      <SquarePanelLayout
        board={
          <svg
            ref={svg}
            viewBox="0 0 100 100"
            className={`play-area block size-full ${result ? '' : 'cursor-ew-resize'}`}
            onPointerDown={(e) => {
              if (e.button !== 0) return
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              fromPointer(e)
            }}
            onPointerMove={(e) => dragging.current && fromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            {/* The shape is one solid color, no border: you judge one area, not a fill plus an outline. */}
            {result ? (
              <>
                {/* after Done: your left part in the full color, the right part lighter, the correct cut dashed */}
                <polygon points={toPoints(leftPart(round.pts, x))} className="fill-violet-800" />
                <polygon points={toPoints(rightPart(round.pts, x))} className="fill-violet-500" />
                <line x1={round.half} y1={0} x2={round.half} y2={100} strokeWidth={STROKE} strokeDasharray="2 1.5" className="stroke-emerald-400" />
              </>
            ) : (
              <polygon points={toPoints(round.pts)} className="fill-violet-800" />
            )}
            <line x1={x} y1={0} x2={x} y2={100} strokeWidth={CUT_LINE} className="stroke-white" />
            {!result && <circle cx={x} cy={50} r={2.6} className="fill-white/25 stroke-white" strokeWidth={0.5} />}
          </svg>
        }
        panel={
          <>
            <p className="text-2xl font-bold">Split in half</p>
            <p className="mt-1 text-zinc-400">Slide the line so both sides of the shape have the same area.</p>
            <div className="mt-auto">
              {result ? (
                <RoundResult
                  value={result.points}
                  unit="pts"
                  line={`${(result.left * 100).toFixed(1)} / ${((1 - result.left) * 100).toFixed(1)} split`}
                  button={index + 1 >= ROUNDS ? 'See result' : 'Next'}
                  onContinue={next}
                />
              ) : (
                <Button onClick={submit} disabled={!touched} className="w-full">Done</Button>
              )}
            </div>
          </>
        }
      />
    </>
  )
}
