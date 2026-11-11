import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { GameContext } from '../../lib/game'
import type { StartMode } from '../../tests/types'
import { GameInfo } from './GameInfo'

const COUNT_STEP_MS = 600
const QUICK_MS = 450

/**
 * Everything around a running test: the info row (filled by the test's <GameInfo>) and the fixed
 * 3:2 stage (768 × 512, invisible — the layouts draw their own surfaces). Before the test mounts it
 * shows a 3-2-1 countdown, a short "Ready", or nothing, depending on `start`.
 */
export function GameFrame({ start, children }: { start: StartMode; children: ReactNode }) {
  const [infoSlot, setInfoSlot] = useState<HTMLDivElement | null>(null)
  const [infoWidth, setInfoWidth] = useState<number | null>(null)
  const [ready, setReady] = useState(start === 'none')
  const ctx = useMemo(() => ({ infoSlot, setInfoWidth }), [infoSlot])

  return (
    <GameContext.Provider value={ctx}>
      {/* Info row: same height as on the rules screen, so the stage never moves. */}
      <div ref={setInfoSlot} className="mx-auto mb-2 h-10 w-full" style={infoWidth ? { maxWidth: infoWidth } : undefined} />
      <div className="grid aspect-[3/2] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
        {ready ? children : <StartTransition mode={start} onDone={() => setReady(true)} />}
      </div>
    </GameContext.Provider>
  )
}

function StartTransition({ mode, onDone }: { mode: StartMode; onDone: () => void }) {
  const [n, setN] = useState(mode === 'countdown' ? 3 : 0)
  useEffect(() => {
    const t = window.setTimeout(() => (n > 1 ? setN(n - 1) : onDone()), mode === 'countdown' ? COUNT_STEP_MS : QUICK_MS)
    return () => window.clearTimeout(t)
  }, [n, mode, onDone])
  return (
    <div className="grid place-items-center">
      <GameInfo middle="Get ready" />
      <p key={n} className="animate-[pop_.6s_ease-out] text-7xl font-bold text-violet-300 tabular-nums">
        {mode === 'countdown' ? n : <span className="text-3xl text-zinc-400">Ready</span>}
      </p>
    </div>
  )
}
