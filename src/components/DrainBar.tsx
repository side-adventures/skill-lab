/** A bar that empties over `ms` — restart it by changing `key`. */
export function DrainBar({ ms }: { ms: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
      <div className="drain h-full rounded-full bg-violet-500" style={{ ['--duration' as string]: `${ms}ms` }} />
    </div>
  )
}
