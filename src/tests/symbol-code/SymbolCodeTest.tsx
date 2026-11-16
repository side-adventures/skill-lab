import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { answerStats } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { DURATION_MS, ROW_LENGTH, SYMBOLS, learningGain, makeKey, makeSymbolSource, symbolScore, type Answer } from './scoring'

function Glyph({ index, className }: { index: number; className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path d={SYMBOLS[index]} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SymbolCodeTest({ onFinish }: TestComponentProps) {
  const [key] = useState(() => makeKey())
  const [next] = useState(() => makeSymbolSource())
  // The code row: numbers (0-based) whose symbols are shown; [0] is the one to answer now.
  const [row, setRow] = useState(() => Array.from({ length: ROW_LENGTH }, () => next()))
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  const startedAt = useRef(0)
  const shownAt = useRef(0)
  useEffect(() => {
    startedAt.current = shownAt.current = performance.now()
  }, [])
  const answers = useRef<(Answer & { ms: number })[]>([])

  const remaining = useCountdown(DURATION_MS, true, () => {
    const gain = learningGain(answers.current)
    onFinish({
      score: symbolScore(correct, wrong),
      ...(correct + wrong === 0 && { failed: 'No answers — try again!' }),
      details: {
        stats: [
          ...answerStats(answers.current),
          ...(gain === undefined ? [] : [{ label: 'Last 20 s vs first 20 s', value: `${gain >= 0 ? '+' : '−'}${Math.abs(Math.round(gain * 100))} %` }]),
        ],
      },
    })
  })

  const answer = (n: number) => {
    if (remaining <= 0) return
    const now = performance.now()
    const ok = n === row[0]
    answers.current.push({ at: now - startedAt.current, ms: now - shownAt.current, correct: ok })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setRow([...row.slice(1), next()])
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle="Click the number that goes with the first symbol"
        right={<InfoValue label="Score" value={symbolScore(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="flex flex-col items-center gap-10">
            <div className="flex overflow-hidden rounded-xl border border-zinc-700" aria-label="Key">
              {key.map((s, i) => (
                <div key={i} className="flex w-16 flex-col items-center border-r border-zinc-700 last:border-r-0">
                  <Glyph index={s} className="my-2 size-9 text-zinc-200" />
                  <span className="w-full border-t border-zinc-700 bg-zinc-900 py-1 text-center text-lg font-bold text-zinc-300">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="flex items-end gap-3">
              {row.map((n, i) => (
                <div
                  key={i}
                  className={`grid place-items-center rounded-xl border-2 ${
                    i === 0 ? 'size-24 border-violet-400 bg-violet-500/10 text-violet-200' : 'size-16 border-zinc-800 text-zinc-500'
                  }`}
                >
                  <Glyph index={key[n]} className={i === 0 ? 'size-14' : 'size-9'} />
                </div>
              ))}
            </div>
          </div>
        }
        answers={
          <div className="mx-auto w-80">
            <AnswerButtons
              columns={3}
              disabled={remaining <= 0}
              options={key.map((_, i) => ({ label: String(i + 1), key: String(i + 1), onPress: () => answer(i) }))}
            />
          </div>
        }
      />
    </>
  )
}
