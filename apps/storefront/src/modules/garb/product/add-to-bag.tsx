"use client"

import { addToCart } from "@lib/data/cart"
import { CheckIcon } from "@modules/common/components/garb-icons"
import Link from "next/link"
import { notifyBagChanged } from "@modules/layout/components/garb/bag-button"
import { useState, useTransition } from "react"

export default function AddToBag({ variantId, available, title }: { variantId?: string; available: boolean; title: string }) {
  const [state, setState] = useState<"idle" | "added" | "error">("idle")
  const [message, setMessage] = useState("")
  const [pending, start] = useTransition()

  if (!available || !variantId) {
    return (
      <div className="space-y-3">
        <button className="btn btn-secondary w-full" disabled>Sold</button>
        <p className="text-label text-quiet">This piece has found a new home. New arrivals land every day.</p>
      </div>
    )
  }

  const add = () =>
    start(async () => {
      try {
        await addToCart({ variantId, quantity: 1, countryCode: "ca" })
        setState("added")
        notifyBagChanged()
      } catch (e) {
        const msg = (e as Error).message || ""
        setState("error")
        setMessage(
          /inventory|stock|quantity/i.test(msg)
            ? "This piece is already in your bag, or someone has just reserved it."
            : "Something went wrong. Please try again."
        )
      }
    })

  if (state === "added") {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <p className="flex items-center gap-2 text-label font-medium">
          <CheckIcon /> {title} is in your bag
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/cart" className="btn btn-secondary">View bag</Link>
          <Link href="/checkout?step=address" className="btn btn-primary">Checkout</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={add} className="btn btn-primary w-full py-3.5" disabled={pending} data-testid="add-to-bag">
        {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" aria-hidden />}
        {pending ? "Adding" : "Add to bag"}
      </button>
      {state === "error" && (
        <p className="text-label text-alert" role="alert">
          {message} <Link href="/cart" className="link">Open your bag</Link>
        </p>
      )}
    </div>
  )
}
