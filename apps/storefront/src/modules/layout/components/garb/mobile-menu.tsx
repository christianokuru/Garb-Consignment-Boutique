"use client"

import { departments, slugify, STORE } from "@lib/garb"
import { ChevronDown, CloseIcon, MenuIcon, SearchIcon } from "@modules/common/components/garb-icons"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import OpenStatus from "./open-status"

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const big = "block py-2 font-serif text-[40px] font-light leading-none tracking-[-0.04em]"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pill gap-2 pr-3"
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        Menu <MenuIcon />
      </button>
      {open && createPortal(
        <div id="mobile-menu" className="fixed inset-0 z-[70] flex flex-col overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="flex items-center justify-between px-4 py-4">
            <OpenStatus />
            <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-paper" aria-label="Close menu">
              <CloseIcon />
            </button>
          </div>
          <form action="/search" role="search" className="mx-4 mb-2 flex items-center gap-2 rounded-pill bg-paper p-1.5 pl-4">
            <SearchIcon className="shrink-0" />
            <label htmlFor="mobile-search" className="sr-only">Search</label>
            <input id="mobile-search" name="q" type="search" placeholder="Designer, piece or item code" enterKeyHint="search" className="w-full bg-transparent text-body outline-none placeholder:text-quiet" />
            <button type="submit" className="btn btn-primary btn-sm">Go</button>
          </form>
          <nav className="flex-1 px-4 pb-10 pt-2" aria-label="Main">
            <ul className="divide-y divide-line">
              {(Object.keys(departments) as (keyof typeof departments)[]).map((d) => (
                <li key={d} className="py-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/${d}`} className={big}>{departments[d].label}</Link>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === d ? null : d)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-paper"
                      aria-label={`${departments[d].label} categories`}
                      aria-expanded={expanded === d}
                    >
                      <ChevronDown className={expanded === d ? "rotate-180 transition-transform" : "transition-transform"} />
                    </button>
                  </div>
                  {expanded === d && (
                    <div className="flex flex-wrap gap-2 pb-3 pt-2">
                      <Link href={`/${d}`} className="pill">All {departments[d].label.toLowerCase()}</Link>
                      {departments[d].categories.map((c) => (
                        <Link key={c} href={`/${d}/${slugify(c)}`} className="pill">{c}</Link>
                      ))}
                      <Link href={`/sale?department=${d}`} className="pill">Sale</Link>
                    </div>
                  )}
                </li>
              ))}
              <li className="py-2"><Link href="/designers" className={big}>Designers</Link></li>
              <li className="py-2"><Link href="/new-arrivals" className={big}>New arrivals</Link></li>
              <li className="py-2"><Link href="/sale" className={big}><em className="italic">Sale</em></Link></li>
              <li className="py-2"><Link href="/consign" className={big}>Consign</Link></li>
              <li className="py-2"><Link href="/visit" className={big}>Visit</Link></li>
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href="/account" className="pill">My account</Link>
              <Link href="/seller" className="pill">Seller login</Link>
              <Link href="/consign/book" className="btn btn-primary btn-sm">Book a consignment</Link>
            </div>
            <div className="mt-10 space-y-1 text-label text-quiet">
              <p>{STORE.street}, {STORE.city}</p>
              <p>Tuesday to Sunday, 12–6 pm</p>
              <p><a href={STORE.phoneHref} className="link">{STORE.phone}</a> · <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a></p>
            </div>
          </nav>
        </div>,
        document.body
      )}
    </>
  )
}
