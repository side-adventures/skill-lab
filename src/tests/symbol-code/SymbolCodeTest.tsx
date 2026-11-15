import { useEffect, useRef, useState } from 'react'
import { AnswerButtons } from '../../components/game/AnswerButtons'
import { GameInfo, InfoValue } from '../../components/game/GameInfo'
import { PromptLayout } from '../../components/game/layouts'
import { feedbackRing, useAnswerFlash } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import { answerStats, type TimedAnswer } from '../../lib/resultFormat'
import type { TestComponentProps } from '../types'
import { DURATION_MS, SYMBOLS, makeKey, makeSymbolSource, symbolScore } from './scoring'

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
  const [symbol, setSymbol] = useState(() => next())
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [flash, signal] = useAnswerFlash()
  const shownAt = useRef(0)
  useEffect(() => {
    shownAt.current = performance.now()
  }, [])
  const answers = useRef<TimedAnswer[]>([])

  const remaining = useCountdown(DURATION_MS, true, () =>
    onFinish({
      score: symbolScore(correct, wrong),
      ...(correct + wrong === 0 && { failed: 'No answers — try again!' }),
      details: { stats: answerStats(answers.current) },
    }),
  )

  const answer = (digit: number) => {
    if (remaining <= 0) return
    const now = performance.now()
    const ok = key[digit - 1] === symbol
    answers.current.push({ ms: now - shownAt.current, correct: ok })
    shownAt.current = now
    if (ok) setCorrect((c) => c + 1)
    else setWrong((w) => w + 1)
    signal(ok)
    setSymbol(next())
  }

  return (
    <>
      <GameInfo
        left={<InfoValue value={(remaining / 1000).toFixed(1)} unit="s left" />}
        middle="Click the number that goes with the symbol"
        right={<InfoValue label="Score" value={symbolScore(correct, wrong)} />}
        timer={remaining / DURATION_MS}
      />
      <PromptLayout
        displayClassName={feedbackRing(flash)}
        display={
          <div className="flex flex-col items-center gap-8">
            <div className="flex overflow-hidden rounded-xl border border-zinc-700">
              {key.map((s, i) => (
                <div key={i} className="flex w-14 flex-col items-center border-r border-zinc-700 last:border-r-0">
                  <Glyph index={s} className="my-2 size-8 text-zinc-200" />
                  <span className="w-full border-t border-zinc-700 bg-zinc-900 py-1 text-center text-lg font-bold text-zinc-300">{i + 1}</span>
                </div>
              ))}
            </div>
            <Glyph index={symbol} className="size-28 text-violet-300" />
          </div>
        }
        answers={
          <AnswerButtons
            wide
            disabled={remaining <= 0}
            options={key.map((_, i) => ({ label: String(i + 1), key: String(i + 1), onPress: () => answer(i + 1) }))}
          />
        }
      />
    </>
  )
}
