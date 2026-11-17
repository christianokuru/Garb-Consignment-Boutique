"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export const BAG_EVENT = "garb:bag-updated"

/** Tell the header the bag changed (after adding or removing a piece). */
export function notifyBagChanged() {
  window.dispatchEvent(new Event(BAG_EVENT))
}

/**
 * The bag count loads in the browser so pages themselves can be cached and
 * served instantly; only this small badge is per-visitor.
 */
export default function BagButton() {
  const [count, setCount] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    let alive = true
    const load = () =>
      fetch("/api/bag", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => alive && setCount(d.count ?? 0))
        .catch(() => {})
    load()
    window.addEventListener(BAG_EVENT, load)
    window.addEventListener("focus", load)
    return () => {
      alive = false
      window.removeEventListener(BAG_EVENT, load)
      window.removeEventListener("focus", load)
    }
  }, [pathname])

  return (
    <Link href="/cart" className="btn btn-primary btn-sm" data-testid="nav-cart-link" aria-label={`Bag, ${count ?? 0} items`}>
      Bag
      <span className="min-w-[0.6em] tabular-nums" aria-hidden>{count ?? ""}</span>
    </Link>
  )
}
