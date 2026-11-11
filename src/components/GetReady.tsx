import { useEffect, useRef, useState } from 'react'
import { useLatest } from '../lib/hooks'

/** "3 · 2 · 1" countdown before timed tests. */
export function GetReady({ onDone, from = 3 }: { onDone: () => void; from?: number }) {
  const [n, setN] = useState(from)
  const done = useRef(false)
  const onDoneRef = useLatest(onDone)
  useEffect(() => {
    if (n === 0) {
      if (!done.current) {
        done.current = true
        onDoneRef.current()
      }
      return
    }
    const t = window.setTimeout(() => setN(n - 1), 700)
    return () => window.clearTimeout(t)
  }, [n, onDoneRef])
  return (
    <div className="grid h-full place-items-center">
      <div className="text-center">
        <p className="text-sm tracking-wide text-zinc-500 uppercase">Get ready</p>
        <p key={n} className="mt-2 text-7xl font-bold tabular-nums">{n || 'Go!'}</p>
      </div>
    </div>
  )
}
