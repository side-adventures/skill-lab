import { useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { END_MOMENT_MS, useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { PasswordForm, type FormPhase } from './PasswordForm'
import {
  LIVES, SYMBOL_KEYS, TOP_LEVEL, afterMiss, afterRight, matches, passwordForLevel, showMsOfLevel, startClimb,
  type Climb, type Password,
} from './scoring'

const newPassword = (c: Climb) => passwordForLevel(c.level)

export default function PasswordMemoryTest({ onFinish }: TestComponentProps) {
  const [climb, setClimb] = useState<Climb>(startClimb)
  const [password, setPassword] = useState<Password>(() => newPassword(startClimb()))
  const [phase, setPhase] = useState<FormPhase>('show')
  const [input, setInput] = useState('')
  const [lives, setLives] = useState(LIVES)
  // The hardest password confirmed so far and its level (the score).
  const [best, setBest] = useState<{ text: string; level: number } | null>(null)
  // Levels of the missed passwords, for the result.
  const [missed, setMissed] = useState<number[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  const target = password.text
  const showFor = showMsOfLevel(climb.level)
  const showLeft = useCountdown(showFor, phase === 'show', () => setPhase('input'))
  const score = best?.level ?? 0
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
      if (!best || climb.level > best.level) setBest({ text: target, level: climb.level })
      setPhase('correct')
      // The top level ends the run (see TOP_LEVEL).
      later(climb.level === TOP_LEVEL ? END_MOMENT_MS : 900, () => (climb.level === TOP_LEVEL ? finish(climb.level, target) : play(afterRight(climb))))
      return
    }
    setMissed([...missed, climb.level])
    setLives(lives - 1)
    setPhase('wrong')
  }

  /** Ends the run; `top` is the password of the top level when it was just confirmed (state isn't updated yet). */
  const finish = (topLevel?: number, topText?: string) => {
    const hardest = topLevel ? { text: topText!, level: topLevel } : best
    onFinish({
      score: hardest?.level ?? 0,
      details: {
        stats: [
          ...(hardest ? [{ label: 'Hardest password', value: hardest.text }] : []),
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
        left={<><InfoValue label="Level" value={climb.level} /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Memorize'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? (climb.level === TOP_LEVEL ? 'Top level reached' : 'Saved')
              : lives === 0 ? 'Out of lives'
              : next.level < climb.level ? `No match · next: level ${next.level}`
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
