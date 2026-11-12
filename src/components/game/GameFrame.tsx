import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { GameContext } from '../../lib/game'
import type { StageLayout, StartMode } from '../../tests/types'
import { GameInfo } from './GameInfo'
import { FullLayout, PromptLayout, SquareLayout, SquarePanelLayout } from './layouts'

const COUNT_STEP_MS = 600
const QUICK_MS = 450

/**
 * Everything around a running test: the info row (filled by the test's <GameInfo>) and the fixed
 * 3:2 stage (768 × 512, invisible — the layouts draw their own surfaces). Before the test mounts it
 * shows a 3-2-1 countdown, a short "Ready", or nothing, depending on `start` — drawn on an empty
 * version of the test's layout, so the play area is already there.
 */
export function GameFrame({ start, layout, boardAspect, children }: {
  start: StartMode
  layout: StageLayout
  boardAspect?: number
  children: ReactNode
}) {
  const [infoSlot, setInfoSlot] = useState<HTMLDivElement | null>(null)
  const [infoWidth, setInfoWidth] = useState<number | null>(null)
  const [ready, setReady] = useState(start === 'none')
  const ctx = useMemo(() => ({ infoSlot, setInfoWidth }), [infoSlot])
  const begin = useCallback(() => setReady(true), [])

  return (
    <GameContext.Provider value={ctx}>
      {/* Info row: same height as on the rules screen, so the stage never moves. */}
      <div ref={setInfoSlot} className="mx-auto mb-2 h-10 w-full" style={infoWidth ? { maxWidth: infoWidth } : undefined} />
      <div className="grid aspect-[3/2] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)]">
        {ready ? (
          // Code is preloaded on the rules screen; if it still isn't there, show the empty stage, no text.
          <Suspense fallback={<EmptyStage layout={layout} boardAspect={boardAspect} />}>{children}</Suspense>
        ) : (
          <EmptyStage layout={layout} boardAspect={boardAspect}>
            <GameInfo middle="Get ready" />
            <StartTransition mode={start} onDone={begin} />
          </EmptyStage>
        )}
      </div>
    </GameContext.Provider>
  )
}

/** The test's layout with nothing in it; `children` is centered on the main area. */
function EmptyStage({ layout, boardAspect, children }: { layout: StageLayout; boardAspect?: number; children?: ReactNode }) {
  const center = <div className="grid size-full place-items-center">{children}</div>
  switch (layout) {
    case 'full':
      return <FullLayout className="bg-zinc-900">{center}</FullLayout>
    case 'prompt':
      return <PromptLayout display={center} answers={<div className="h-14" />} />
    case 'square':
      return (
        <SquareLayout aspect={boardAspect}>
          <div className="size-full rounded-2xl bg-zinc-800">{center}</div>
        </SquareLayout>
      )
    case 'panel':
      return <SquarePanelLayout board={center} panel={null} />
  }
}

function StartTransition({ mode, onDone }: { mode: StartMode; onDone: () => void }) {
  const [n, setN] = useState(mode === 'countdown' ? 3 : 0)
  useEffect(() => {
    const t = window.setTimeout(() => (n > 1 ? setN(n - 1) : onDone()), mode === 'countdown' ? COUNT_STEP_MS : QUICK_MS)
    return () => window.clearTimeout(t)
  }, [n, mode, onDone])
  return (
    <p key={n} className="animate-[pop_.6s_ease-out] text-7xl font-bold text-violet-300 tabular-nums">
      {mode === 'countdown' ? n : <span className="text-3xl text-zinc-400">Ready</span>}
    </p>
  )
}
