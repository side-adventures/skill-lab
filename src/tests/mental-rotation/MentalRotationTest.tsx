import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { answerStats, fmtPct, type TimedAnswer } from '../../lib/resultFormat'
import { correctMinusWrong } from '../../lib/scoring'
import type { TestComponentProps } from '../types'
import { DURATION_MS, makeTrial, mirror, type Shape } from './scoring'

function ShapeView({ shape, angle }: { shape: Shape; angle: number }) {
  // Rotate around the center of the bounding box (works for any offset), which keeps every
  // allowed shape (max 4 × 4 cells, half-diagonal 2.83) inside the 6 × 6 view.
  const xs = shape.map((c) => c[0]), ys = shape.map((c) => c[1])
  const cx = (Math.min(...xs) + Math.max(...xs) + 1) / 2
  const cy = (Math.min(...ys) + Math.max(...ys) + 1) / 2
  return (
    <svg viewBox="-3 -3 6 6" className="aspect-square h-full max-w-full">
      <g transform={`rotate(${angle}) translate(${-cx} ${-cy})`}>
        {shape.map(([x, y]) => (
          <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} className="fill-violet-500 stroke-white dark:stroke-zinc-900" strokeWidth={0.08} />
        ))}
      </g>
    </svg>
  )
}

const accuracyOf = (xs: TimedAnswer[]) => (xs.length ? fmtPct(xs.filter((a) => a.correct).length / xs.length) : '–')

export default function MentalRotationTest({ onFinish }: TestComponentProps) {
  const [trial, setTrial] = useState(makeTrial)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  // When the current pair appeared, and every answer (for the result stats).
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answers = useRef<(TimedAnswer & { mirrored: boolean })[]>([])

  const remaining = useCountdown(DURATION_MS, true, () =>
    onFinish({
      score: correctMinusWrong(correct, wrong),
      ...(correct + wrong === 0 && { failed: 'No answers — try again!' }), // idle run: shown, not saved
      details: {
        stats: answerStats(answers.current),
        extra: {
          kind: 'pair',
          a: { label: 'Accuracy · same', value: accuracyOf(answers.current.filter((a) => !a.mirrored)) },
          b: { label: 'Accuracy · mirrored', value: accuracyOf(answers.current.filter((a) => a.mirrored)) },
        },
      },
    }),
  )

  const answer = (saysMirrored: boolean) => {
    if (remaining <= 0) return
    const ok = saysMirrored === trial.mirrored
    const now = performance.now()
    answers.current.push({ ms: now - shownAt.current, correct: ok, mirrored: trial.mirrored })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setTrial(makeTrial())
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle="Rotated, or mirrored?"
        right={<InfoValue label="Score" value={correctMinusWrong(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="grid size-full grid-cols-2 place-items-center gap-6 p-6">
            <ShapeView shape={trial.shape} angle={trial.leftAngle} />
            <ShapeView shape={trial.mirrored ? mirror(trial.shape) : trial.shape} angle={trial.rightAngle} />
          </div>
        }
        answers={
          <AnswerButtons
            disabled={remaining <= 0}
            options={[
              { label: 'SAME', key: 'ArrowLeft', onPress: () => answer(false) },
              { label: 'MIRRORED', key: 'ArrowRight', onPress: () => answer(true) },
            ]}
          />
        }
      />
    </>
  )
}
