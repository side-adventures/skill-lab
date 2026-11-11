import { createContext, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const BelowSlot = createContext<HTMLElement | null>(null)

/**
 * The fixed 3:2 play area (full content width, 768 × 512). Every test plays inside it, so the area never
 * changes size or position. The test's root element fills it (use `flex h-full flex-col`).
 * Content that must not take room from the game, like an on-screen keypad, goes in <BelowStage>.
 */
export function Stage({ children }: { children: ReactNode }) {
  const [below, setBelow] = useState<HTMLDivElement | null>(null)
  return (
    <BelowSlot.Provider value={below}>
      <div className="grid aspect-[3/2] w-full grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4">
        {children}
      </div>
      <div ref={setBelow} className="mt-4 empty:hidden" />
    </BelowSlot.Provider>
  )
}

/** Renders its children right below the stage (for on-screen keypads). */
export function BelowStage({ children }: { children: ReactNode }) {
  const el = useContext(BelowSlot)
  return el ? createPortal(children, el) : null
}
