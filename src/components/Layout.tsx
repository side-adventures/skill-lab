import type { ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { allScoresShare } from '../lib/allScores'
import { ComingSoonButton } from './ComingSoon'
import { Logo } from './Logo'
import { SettingsIcon, ShareIcon, StatsIcon } from './HeaderIcons'
import { ShareButton } from './ShareButton'

export function Layout({ children }: { children: ReactNode }) {
  // The home page uses the full width for its card grid; test pages stay narrower so play areas
  // (and therefore scores) don't change with the window size.
  const path = useLocation().pathname
  const wide = path === '/' || path === '/stats'
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between gap-4 py-5">
        <Link to="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight">
          <Logo />
          Skill Lab
        </Link>
        <div className="flex items-center gap-2">
          <ShareButton label="Share scores" icon={<ShareIcon />} variant="primary" size="sm" getShare={allScoresShare} />
          <NavLink
            to="/stats"
            aria-label="Stats"
            title="Stats"
            className={({ isActive }) =>
              `grid size-9 place-items-center rounded-lg border transition-colors ${
                isActive ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-100'
              }`
            }
          >
            <StatsIcon />
          </NavLink>
          <ComingSoonButton
            label="Settings"
            icon={<SettingsIcon />}
            text="Coming soon: export, import and reset your scores, and more options."
          />
        </div>
      </header>
      <main className={`w-full flex-1 pb-10 ${wide ? '' : 'mx-auto max-w-3xl'}`}>{children}</main>
      <footer className="py-6 text-center text-xs text-zinc-500">
        No sign-up, no tracking. Scores are saved only in this browser.
      </footer>
    </div>
  )
}
