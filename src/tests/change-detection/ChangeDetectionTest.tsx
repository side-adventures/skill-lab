import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { SquarePanelLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash, useLater } from '../../lib/game'
import { fmtPct } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import {
  BLANK_MS, FIX_MS, GRID, ITEM, KINDS, SAMPLE_MS, SCORED_SIZES, SET_SIZES, capacity, capacityScore, makeTrials, type Answer,
} from './scoring'

type Stage = 'fix' | 'sample' | 'blank' | 'test' | 'feedback'

const PHASE: Record<Stage, string> = {
  fix: 'Get ready',
  sample: 'Remember them',
  blank: 'Remember them',
  test: 'Did one of them change?',
  feedback: '',
}

export default function ChangeDetectionTest({ onFinish }: TestComponentProps) {
  const [trials] = useState(makeTrials)
  const [t, setT] = useState(0)
  const [stage, setStage] = useState<Stage>('fix')
  const answers = useRef<Answer[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  // fix → sample → blank → test, for every trial.
  useEffect(() => {
    later(FIX_MS, () => setStage('sample'))
    later(FIX_MS + SAMPLE_MS, () => setStage('blank'))
    later(FIX_MS + SAMPLE_MS + BLANK_MS, () => setStage('test'))
  }, [t, later])

  const trial = trials[t]

  const answer = (saidChange: boolean) => {
    if (stage !== 'test') return
    const change = trial.changed !== null
    answers.current.push({ size: trial.size, change, saidChange })
    signal(change === saidChange)
    setStage('feedback')
    if (t + 1 < trials.length) return later(400, () => {
      setStage('fix')
      setT(t + 1)
    })
    const a = answers.current
    const correct = a.filter((x) => x.change === x.saidChange).length
    onFinish({
      score: capacityScore(a),
      details: {
        stats: [
          { label: 'Correct', value: `${correct} / ${a.length}` },
          { label: 'Accuracy', value: fmtPct(correct / a.length) },
        ],
        extra: {
          kind: 'table',
          columns: ['Items', 'Changes seen', 'False alarms', 'Capacity'],
          rows: SET_SIZES.map((s) => {
            const c = capacity(a, s)!
            return {
              cells: [String(s), fmtPct(c.hit), fmtPct(c.fa), Math.max(0, c.k).toFixed(1)],
              dim: !SCORED_SIZES.includes(s), // not in the score
            }
          }),
        },
      },
    })
  }

  const visible = stage === 'sample' || stage === 'test' || stage === 'feedback'
  const size = `${(ITEM / GRID) * 100}%`
  return (
    <>
      <GameInfo
        left={<InfoValue value={`Trial ${t + 1}`} of={trials.length} />}
        middle={PHASE[stage]}
        right={<InfoValue value={trial.size} unit="items" />}
      />
      <SquarePanelLayout
        boardClassName={feedbackRing(flash)}
        board={
          <>
            {stage === 'fix' && <div className="grid size-full place-items-center text-5xl text-zinc-600">+</div>}
            {visible &&
              trial.items.map((it, i) => {
                const kind = KINDS[stage !== 'sample' && i === trial.changed ? trial.newKind : it.kind]
                return (
                  <svg
                    key={i}
                    viewBox="0 0 24 24"
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%`, width: size, height: size }}
                    aria-label={kind.name}
                  >
                    <path d={kind.path} fill={kind.color} fillRule="evenodd" />
                  </svg>
                )
              })}
          </>
        }
        panel={
          <div className="flex h-full flex-col justify-end gap-3">
            <p className="text-sm text-zinc-400">Same items in the same places, or did one turn into a different one?</p>
            <AnswerButtons
              columns={1}
              disabled={stage !== 'test'}
              options={[
                { label: 'Same', key: 's', onPress: () => answer(false) },
                { label: 'Changed', key: 'c', onPress: () => answer(true) },
              ]}
            />
          </div>
        }
      />
    </>
  )
}
