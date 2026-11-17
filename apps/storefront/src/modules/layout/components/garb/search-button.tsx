"use client"

import { CloseIcon, SearchIcon } from "@modules/common/components/garb-icons"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export default function SearchButton() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      input.current?.focus()
      const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
      window.addEventListener("keydown", onKey)
      return () => window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-paper"
        aria-label="Search"
      >
        <SearchIcon />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Search the shop">
          <button className="absolute inset-0 bg-black/20" aria-label="Close search" onClick={() => setOpen(false)} />
          <form
            className="relative bg-white px-4 pb-8 pt-6 sm:px-6"
            onSubmit={(e) => {
              e.preventDefault()
              if (q.trim()) {
                setOpen(false)
                router.push(`/search?q=${encodeURIComponent(q.trim())}`)
              }
            }}
          >
            <div className="mx-auto flex max-w-[1440px] items-center gap-3">
              <SearchIcon size={24} className="shrink-0" />
              <input
                ref={input}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search designers, pieces, item codes"
                className="w-full bg-transparent py-2 font-serif text-[28px] font-light tracking-[-0.03em] outline-none placeholder:text-quiet sm:text-[40px]"
                aria-label="Search"
                enterKeyHint="search"
              />
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-paper" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="mx-auto mt-4 flex max-w-[1440px] flex-wrap gap-2 pl-9">
              {["Chanel", "Max Mara", "Cashmere", "Leather jacket", "Loafers"].map((s) => (
                <button
                  key={s}
                  type="button"
                  className="tag hover:bg-[#ececec]"
                  onClick={() => {
                    setOpen(false)
                    router.push(`/search?q=${encodeURIComponent(s)}`)
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  )
}
