/** Site logo: a lab flask with a spark inside (white on a violet tile). Same drawing as public/favicon.svg. */
export function Logo({ className = 'size-8' }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center rounded-lg bg-violet-600 text-white ${className}`}>
      <svg viewBox="0 0 48 48" className="size-[62%]" fill="currentColor" aria-hidden>
        <path
          d="M17.5 4.5h13M20 5v12L9 38a4 4 0 0 0 3.5 6h23a4 4 0 0 0 3.5-6L28 17V5"
          fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M25.5 22L18 34h5.5l-1.5 8 8-12h-5.5z" />
      </svg>
    </span>
  )
}
