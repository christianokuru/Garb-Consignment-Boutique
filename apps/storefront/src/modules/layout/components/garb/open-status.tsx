"use client"

import { openStatus, type OpenStatus as Status } from "@lib/garb"
import { clx } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Live "open now" signal. The green dot only appears while the shop is
 * actually open; otherwise the line is quiet grey. Computed in the browser so
 * cached pages never show a stale status.
 */
export default function OpenStatus({ className }: { className?: string }) {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    const update = () => setStatus(openStatus())
    update()
    const id = window.setInterval(update, 60_000)
    return () => window.clearInterval(id)
  }, [])

  if (!status) {
    return <span className={clx("inline-block h-5 w-40", className)} aria-hidden />
  }

  return (
    <span
      className={clx(
        "inline-flex items-center gap-2 text-label",
        status.open ? "text-signal" : "text-quiet",
        className
      )}
    >
      {status.open && (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
        </span>
      )}
      {status.label}
    </span>
  )
}
