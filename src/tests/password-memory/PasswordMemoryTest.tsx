import { useState } from 'react'
import { GameInfo, InfoValue, Lives } from '../../components/game/GameInfo'
import { useAnswerFlash, useContinue, useLater } from '../../lib/game'
import { useCountdown } from '../../lib/hooks'
import type { TestComponentProps } from '../types'
import { PasswordForm, type FormPhase } from './PasswordForm'
import { LIVES, SYMBOL_KEYS, crackTime, matches, passwordFor, scoreBits, showMs, strengthLabel, type Password } from './scoring'

export default function PasswordMemoryTest({ onFinish }: TestComponentProps) {
  const [level, setLevel] = useState(1)
  const [password, setPassword] = useState<Password>(() => passwordFor(1))
  const [phase, setPhase] = useState<FormPhase>('show')
  const [input, setInput] = useState('')
  const [lives, setLives] = useState(LIVES)
  // Strongest password confirmed so far (the score is its strength in whole bits).
  const [best, setBest] = useState<Password | null>(null)
  // Strength of each missed password, for the result.
  const [missed, setMissed] = useState<number[]>([])
  const [flash, signal] = useAnswerFlash()
  const { later } = useLater()

  const target = password.text
  const showFor = showMs(password)
  const showLeft = useCountdown(showFor, phase === 'show', () => setPhase('input'))
  const score = best ? scoreBits(best.bits) : 0

  const play = (next: number) => {
    setLevel(next)
    setPassword(passwordFor(next))
    setInput('')
    setPhase('show')
  }

  const submit = () => {
    if (phase !== 'input' || input === '') return
    const ok = matches(input, target)
    signal(ok)
    if (ok) {
      if (!best || password.bits > best.bits) setBest(password)
      setPhase('correct')
      later(900, () => play(level + 1))
      return
    }
    setMissed([...missed, scoreBits(password.bits)])
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
                { label: 'Strongest', value: best.text },
                { label: 'Strength', value: strengthLabel(best.bits) },
                { label: 'Time to crack', value: crackTime(best.bits) },
              ]
            : []),
          ...(missed.length ? [{ label: 'Missed at', value: `${missed.join(', ')} bits` }] : []),
        ],
      },
    })
  }

  // After a mistake both passwords stay until you continue (click, Enter or Space; ignored for 300 ms so the Enter
  // that saved the wrong password doesn't skip it): a new password of the same level, or the result.
  useContinue(() => (lives > 0 ? play(level) : finish()), { enabled: phase === 'wrong' })

  return (
    <>
      <GameInfo
        left={<><InfoValue value={scoreBits(password.bits)} unit="bits" /><Lives left={lives} total={LIVES} /></>}
        middle={
          <span className={phase === 'wrong' ? 'text-rose-300' : ''}>
            {phase === 'show' ? 'Memorize'
              : phase === 'input' ? 'Type it, then Enter'
              : phase === 'correct' ? 'Saved'
              : lives > 0 ? 'No match · new password, same strength' : 'Out of lives'}
          </span>
        }
        right={<InfoValue label="Score" value={score} unit="bits" />}
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
