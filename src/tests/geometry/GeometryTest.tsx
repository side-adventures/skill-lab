import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { RoundResult } from '../../components/game/RoundResult'
import { NumberPad } from '../../components/NumberPad'
import type { TestComponentProps } from '../types'
import { add, angleTo, clampToRange, dirOf, makeTasks, totalScore, type Answer, type Evaluation, type Pt, type Shape, type Task } from './scoring'

const STROKE = 0.9

function Draw({ shape, tone }: { shape: Shape; tone: 'base' | 'answer' | 'solution' }) {
  const color = tone === 'base' ? 'stroke-zinc-800 dark:stroke-zinc-200' : tone === 'answer' ? 'stroke-violet-500' : 'stroke-emerald-500'
  const fill = tone === 'base' ? 'fill-zinc-800 dark:fill-zinc-200' : tone === 'answer' ? 'fill-violet-500' : 'fill-emerald-500'
  const dashed = tone === 'solution' ? '2 1.5' : undefined
  switch (shape.t) {
    case 'seg':
      return <line x1={shape.a.x} y1={shape.a.y} x2={shape.b.x} y2={shape.b.y} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={dashed} className={color} />
    case 'circle':
      return <circle cx={shape.c.x} cy={shape.c.y} r={shape.r} fill="none" strokeWidth={STROKE} strokeDasharray={dashed} className={color} />
    case 'dot':
      return <circle cx={shape.p.x} cy={shape.p.y} r={1.4} className={fill} />
    case 'poly':
      return <polygon points={shape.pts.map((p) => `${p.x},${p.y}`).join(' ')} strokeWidth={STROKE} className={`${color} fill-violet-500/10`} />
    case 'ray': {
      const end = add(shape.from, dirOf(shape.angle), shape.len)
      return (
        <g>
          <line x1={shape.from.x} y1={shape.from.y} x2={end.x} y2={end.y} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={dashed} className={color} />
          <circle cx={shape.from.x} cy={shape.from.y} r={1.2} className={fill} />
        </g>
      )
    }
    case 'arc': {
      // Marks which angle is meant: a filled wedge with an arc edge (always violet).
      const p1 = add(shape.c, dirOf(shape.from), shape.r), p2 = add(shape.c, dirOf(shape.from + shape.span), shape.r)
      const large = shape.span > 180 ? 1 : 0
      return (
        <path
          d={`M ${shape.c.x} ${shape.c.y} L ${p1.x} ${p1.y} A ${shape.r} ${shape.r} 0 ${large} 0 ${p2.x} ${p2.y} Z`}
          className="fill-violet-500/20 stroke-violet-500"
          strokeWidth={0.6}
        />
      )
    }
    case 'line': {
      const a = add(shape.through, dirOf(shape.angle), -150), b = add(shape.through, dirOf(shape.angle), 150)
      return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeWidth={STROKE} strokeDasharray={dashed} className={color} />
    }
  }
}

/** Turns the current answer into something drawable. */
function answerShapes(task: Task, a: Answer): Shape[] {
  switch (task.input) {
    case 'point': return a.point ? [{ t: 'dot', p: a.point }] : []
    case 'ray': return a.angle === undefined ? [] : [{ t: 'ray', from: task.pivot!, angle: a.angle, len: task.armLen ?? 42 }]
    case 'length': return a.length === undefined ? [] : [{ t: 'seg', a: task.pivot!, b: add(task.pivot!, task.dir!, a.length) }]
    case 'offset':
      return a.offset === undefined ? [] : [{ t: 'line', through: add(task.pivot!, task.dir!, a.offset), angle: angleTo({ x: 0, y: 0 }, task.dir!) - 90 }]
    case 'number': return []
  }
}

/** Where the drag handle sits (if any). */
function handleAt(task: Task, a: Answer): Pt | undefined {
  if (task.input === 'ray' && a.angle !== undefined) return add(task.pivot!, dirOf(a.angle), task.armLen ?? 42)
  if (task.input === 'length' && a.length !== undefined) return add(task.pivot!, task.dir!, a.length)
  if (task.input === 'offset' && a.offset !== undefined) return add(task.pivot!, task.dir!, a.offset)
  return undefined
}

export default function GeometryTest({ onFinish }: TestComponentProps) {
  const [tasks] = useState(() => makeTasks())
  const [index, setIndex] = useState(0)
  const task = tasks[index]
  const [answer, setAnswer] = useState<Answer>(() => task.initial ?? {})
  const [typed, setTyped] = useState('')
  const [touched, setTouched] = useState(false)
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null)
  const [results, setResults] = useState<{ task: Task; ev: Evaluation }[]>([])
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const fromPointer = (e: React.PointerEvent) => {
    if (evaluation || task.input === 'number') return
    const m = svg.current!.getScreenCTM()!.inverse()
    const sp = new DOMPoint(e.clientX, e.clientY).matrixTransform(m)
    const p = { x: Math.min(100, Math.max(0, sp.x)), y: Math.min(100, Math.max(0, sp.y)) }
    const rel = task.pivot && { x: p.x - task.pivot.x, y: p.y - task.pivot.y }
    if (task.input === 'point') setAnswer({ point: p })
    if (task.input === 'ray') {
      const angle = angleTo(task.pivot!, p)
      setAnswer({ angle: task.range ? clampToRange(angle, task.range) : angle })
    }
    if (task.input === 'length') setAnswer({ length: Math.max(0, rel!.x * task.dir!.x + rel!.y * task.dir!.y) })
    if (task.input === 'offset') setAnswer({ offset: rel!.x * task.dir!.x + rel!.y * task.dir!.y })
    setTouched(true)
  }

  const submit = (typedValue?: string) => {
    const a = task.input === 'number' ? { number: Number(typedValue ?? typed) } : answer
    const ev = task.evaluate(a)
    setEvaluation(ev)
    setResults([...results, { task, ev }])
  }

  const next = () => {
    if (index + 1 >= tasks.length) {
      return onFinish({
        score: totalScore(results.map((r) => r.ev.points)),
        details: Object.fromEntries(results.map((r) => [r.task.title, `${r.ev.points} pts · ${r.ev.label}`])),
      })
    }
    const nt = tasks[index + 1]
    setIndex(index + 1)
    setAnswer(nt.initial ?? {})
    setTyped('')
    setTouched(false)
    setEvaluation(null)
  }

  const handle = handleAt(task, answer)
  const ready = task.input === 'number' ? typed !== '' : touched
  const soFar = Math.round(results.reduce((sum, r) => sum + r.ev.points, 0))

  return (
    <>
      <GameInfo
        left={<InfoValue value={`Round ${index + 1}`} of={tasks.length} />}
        middle={evaluation ? '' : task.input === 'number' ? 'Type the angle, then Enter' : touched ? 'Adjust, then Done' : 'Click or drag on the board'}
        right={<InfoValue label="Score" value={soFar} unit="pts" />}
      />
      <SquarePanelLayout
        board={
          <svg
            ref={svg}
            viewBox="0 0 100 100"
            className={`block size-full ${task.input === 'number' || evaluation ? '' : 'cursor-crosshair'}`}
            onPointerDown={(e) => {
              dragging.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              fromPointer(e)
            }}
            onPointerMove={(e) => dragging.current && fromPointer(e)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            {task.shapes.map((s, i) => <Draw key={`b${i}`} shape={s} tone="base" />)}
            {answerShapes(task, answer).map((s, i) => <Draw key={`a${i}`} shape={s} tone="answer" />)}
            {handle && !evaluation && <circle cx={handle.x} cy={handle.y} r={2.6} className="fill-violet-500/30 stroke-violet-500" strokeWidth={0.5} />}
            {evaluation?.solution.map((s, i) => <Draw key={`s${i}`} shape={s} tone="solution" />)}
          </svg>
        }
        panel={
          <>
            <p className="text-2xl font-bold">{task.title}</p>
            <p className="mt-1 text-zinc-400">{task.prompt}</p>
            <div className="mt-auto">
              {evaluation ? (
                <RoundResult value={evaluation.points} unit="pts" line={evaluation.label} onContinue={next} />
              ) : task.input === 'number' ? (
                <>
                  <p className="mb-3 h-12 text-4xl font-bold tabular-nums">{typed ? `${typed}°` : <span className="text-zinc-700">–</span>}</p>
                  <NumberPad value={typed} onChange={setTyped} onSubmit={submit} maxLength={3} />
                </>
              ) : (
                <Button onClick={() => submit()} disabled={!ready} className="w-full">Done</Button>
              )}
            </div>
          </>
        }
      />
    </>
  )
}
