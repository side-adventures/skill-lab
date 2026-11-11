import { useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { flashRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
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

export default function MentalRotationTest({ onFinish }: TestComponentProps) {
  const [trial, setTrial] = useState(makeTrial)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()

  const remaining = useCountdown(DURATION_MS, true, () =>
    onFinish({
      score: correctMinusWrong(correct, wrong),
      details: {
        Correct: String(correct),
        Wrong: String(wrong),
        'Avg per answer': correct + wrong ? `${(DURATION_MS / 1000 / (correct + wrong)).toFixed(1)} s` : '–',
      },
    }),
  )

  const answer = (saysMirrored: boolean) => {
    if (remaining <= 0) return
    const ok = saysMirrored === trial.mirrored
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
        displayClassName={flashRing(flash)}
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
              { label: 'SAME', key: 's', onPress: () => answer(false), primary: true },
              { label: 'MIRRORED', key: 'm', onPress: () => answer(true) },
            ]}
          />
        }
      />
    </>
  )
}
