import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-violet-600 text-white">⚡</span>
          Skill Lab
        </Link>
      </header>
      <main className="flex-1 pb-10">{children}</main>
      <footer className="py-6 text-center text-xs text-zinc-500">
        Scores are saved only in this browser.
      </footer>
    </div>
  )
}
