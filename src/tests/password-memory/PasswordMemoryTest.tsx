import { useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { PasswordForm, type FormPhase } from './PasswordForm'
import {
  LIVES, SYMBOL_KEYS, afterMiss, afterRight, levelOf, matches, passwordForLoad, showMsFor, startClimb, type Climb,
  type Password,
} from './scoring'

const newPassword = (c: Climb) => passwordForLoad(c.load, showMsFor(c.load))

/** Loads like 11.5 as "11.5", whole ones as "12". */
const loadText = (load: number) => (Number.isInteger(load) ? String(load) : load.toFixed(1))

export default function PasswordMemoryTest({ onFinish }: TestComponentProps) {
  const [climb, setClimb] = useState<Climb>(startClimb)
  const [password, setPassword] = useState<Password>(() => newPassword(startClimb()))
  const [phase, setPhase] = useState<FormPhase>('show')
  const [input, setInput] = useState('')
  const [lives, setLives] = useState(LIVES)
  // The hardest password confirmed so far and its load (the score is its level).
  const [best, setBest] = useState<{ text: string; load: number } | null>(null)
  // Levels of the missed passwords, for the result.
  const [missed, setMissed] = useState<number[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  const target = password.text
  const showFor = showMsFor(climb.load)
  const showLeft = useCountdown(showFor, phase === 'show', () => setPhase('input'))
  const score = best ? levelOf(best.load) : 0
  const next = afterMiss(climb)

  const play = (c: Climb) => {
    setClimb(c)
    setPassword(newPassword(c))
    setInput('')
    setPhase('show')
  }

  const submit = () => {
    if (phase !== 'input' || input === '') return
    const ok = matches(input, target)
    signal(ok)
    if (ok) {
      if (!best || climb.load > best.load) setBest({ text: target, load: climb.load })
      setPhase('correct')
      later(900, () => play(afterRight(climb)))
      return
    }
    setMissed([...missed, levelOf(climb.load)])
    setLives(lives - 1)
    setPhase('wrong')
  }

  const finish = () => {
    onFinish({
      score,
      details: {
        stats: [
          ...(best
            ? [
                { label: 'Hardest password', value: best.text },
                { label: 'As hard to remember as', value: `~${loadText(best.load)} random digits` },
              ]
            : []),
          ...(missed.length ? [{ label: 'Missed at', value: `level ${missed.join(', ')}` }] : []),
        ],
      },
    })
  }

  // After a mistake both passwords stay until you continue (click, Enter or Space; ignored for 300 ms so the Enter
  // that saved the wrong password doesn't skip it): the next password (a smaller step), or the result.
  useContinue(() => (lives > 0 ? play(next) : finish()), { enabled: phase === 'wrong' })

  return (
    <>
      <GameInfo
        left={<><InfoValue label="Level" value={levelOf(climb.load)} /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Memorize'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? 'Saved'
              : lives === 0 ? 'Out of lives'
              : next.load < climb.load ? 'No match · smaller steps now'
              : 'No match · new password, same level'}
          </span>
        }
        right={<InfoValue label="Score" value={score} />}
        timer={phase === 'show' ? showLeft / showFor : undefined}
      />
      <PasswordForm
        phase={phase}
        target={target}
        input={input}
        onInput={setInput}
        onSubmit={submit}
        symbols={SYMBOL_KEYS}
        flash={flash}
        wrongHint={lives > 0 ? 'Click anywhere to try a new password' : 'Click anywhere to see your result'}
      />
    </>
  )
}
