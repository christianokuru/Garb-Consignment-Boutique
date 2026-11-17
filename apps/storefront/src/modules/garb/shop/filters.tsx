"use client"

import type { Facet } from "@lib/data/garb"
import { clx } from "@medusajs/ui"
import { CloseIcon, FilterIcon } from "@modules/common/components/garb-icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { PRICE_RANGES, SORT_OPTIONS } from "./params"

type Props = {
  designers: Facet[]
  sizes: Facet[]
  showDesigners?: boolean
  showSale?: boolean
  count: number
}

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "O/S"]
function sortSizes(a: Facet, b: Facet) {
  const ia = SIZE_ORDER.indexOf(a.value)
  const ib = SIZE_ORDER.indexOf(b.value)
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  const na = parseFloat(a.value)
  const nb = parseFloat(b.value)
  if (!isNaN(na) && !isNaN(nb)) return na - nb
  return a.value.localeCompare(b.value)
}

function useShopUrl() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, start] = useTransition()
  const update = (fn: (sp: URLSearchParams) => void) => {
    const sp = new URLSearchParams(params.toString())
    fn(sp)
    sp.delete("page")
    const qs = sp.toString()
    start(() => router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false }))
  }
  return { params, update, pending }
}

function toggle(sp: URLSearchParams, key: string, value: string) {
  const values = sp.getAll(key)
  sp.delete(key)
  const next = values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
  next.forEach((v) => sp.append(key, v))
}

function FilterGroups({ designers, sizes, showDesigners = true, showSale = true }: Props) {
  const { params, update } = useShopUrl()
  const [q, setQ] = useState("")
  const selectedDesigners = params.getAll("designer")
  const selectedSizes = params.getAll("size")
  const price = params.get("price")
  const sale = params.get("sale") === "1"
  const visibleDesigners = useMemo(
    () => designers.filter((d) => !q || d.value.toLowerCase().includes(q.toLowerCase())),
    [designers, q]
  )

  return (
    <div className="space-y-8">
      {showSale && (
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="text-label font-medium">On sale only</span>
          <input
            type="checkbox"
            className="peer sr-only"
            checked={sale}
            onChange={() => update((sp) => (sale ? sp.delete("sale") : sp.set("sale", "1")))}
          />
          <span className="relative h-6 w-10 rounded-pill bg-[#dcdcdc] transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-ink peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ink" aria-hidden />
        </label>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-label font-medium">Size</legend>
          <div className="flex flex-wrap gap-2">
            {[...sizes].sort(sortSizes).map((s) => {
              const active = selectedSizes.includes(s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  data-active={active}
                  onClick={() => update((sp) => toggle(sp, "size", s.value))}
                  className="pill min-w-[44px] justify-center px-3 py-1.5"
                >
                  {s.value}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-label font-medium">Price</legend>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => {
            const active = price === r.key
            return (
              <button
                key={r.key}
                type="button"
                aria-pressed={active}
                data-active={active}
                onClick={() => update((sp) => (active ? sp.delete("price") : sp.set("price", r.key)))}
                className="pill px-3 py-1.5"
              >
                {r.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {showDesigners && designers.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-label font-medium">Designer</legend>
          {designers.length > 10 && (
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Find a designer"
              className="field mb-3 py-2 text-label"
              aria-label="Find a designer"
            />
          )}
          <ul className="max-h-72 space-y-0.5 overflow-y-auto pr-2">
            {visibleDesigners.map((d) => {
              const active = selectedDesigners.includes(d.value)
              return (
                <li key={d.value}>
                  <label className="flex cursor-pointer items-center gap-3 py-1.5 text-label">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => update((sp) => toggle(sp, "designer", d.value))}
                      className="h-4 w-4 rounded-[4px] border-[#bdbdbd] accent-black"
                    />
                    <span className="flex-1">{d.value}</span>
                    <span className="text-quiet tabular-nums">{d.count}</span>
                  </label>
                </li>
              )
            })}
            {!visibleDesigners.length && <li className="meta py-1.5">No match</li>}
          </ul>
        </fieldset>
      )}
    </div>
  )
}

export function SortSelect() {
  const { params, update, pending } = useShopUrl()
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort by</span>
      <select
        value={params.get("sort") ?? "newest"}
        onChange={(e) => update((sp) => (e.target.value === "newest" ? sp.delete("sort") : sp.set("sort", e.target.value)))}
        className={clx("pill appearance-none pr-8", pending && "opacity-60")}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 h-3 w-3" viewBox="0 0 12 12" aria-hidden><path d="m3 4.5 3 3 3-3" stroke="currentColor" fill="none" strokeWidth="1.5" /></svg>
    </label>
  )
}

export function ActiveFilters() {
  const { params, update } = useShopUrl()
  const chips: [string, string, string][] = [
    ...params.getAll("designer").map((v) => ["designer", v, v] as [string, string, string]),
    ...params.getAll("size").map((v) => ["size", v, `Size ${v}`] as [string, string, string]),
  ]
  const price = PRICE_RANGES.find((p) => p.key === params.get("price"))
  if (price) chips.push(["price", price.key, price.label])
  if (params.get("sale") === "1") chips.push(["sale", "1", "On sale"])
  if (!chips.length) return null
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map(([k, v, label]) => (
        <button
          key={`${k}-${v}`}
          type="button"
          onClick={() => update((sp) => (k === "designer" || k === "size" ? toggle(sp, k, v) : sp.delete(k)))}
          className="pill bg-ink py-1.5 pl-3 pr-2 text-micro text-white hover:bg-[#262626]"
          aria-label={`Remove ${label}`}
        >
          {label} <CloseIcon size={14} />
        </button>
      ))}
      <button
        type="button"
        className="text-micro underline underline-offset-4"
        onClick={() => update((sp) => ["designer", "size", "price", "sale"].forEach((k) => sp.delete(k)))}
      >
        Clear all
      </button>
    </div>
  )
}

export function FilterSidebar(props: Props) {
  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <div className="sticky top-[108px] max-h-[calc(100vh-130px)] overflow-y-auto pb-8 pr-2">
        <FilterGroups {...props} />
      </div>
    </aside>
  )
}

export function FilterDrawerButton(props: Props) {
  const [open, setOpen] = useState(false)
  const params = useSearchParams()
  const active = ["designer", "size"].reduce((n, k) => n + params.getAll(k).length, 0) + (params.get("price") ? 1 : 0) + (params.get("sale") ? 1 : 0)

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <button type="button" className="pill lg:hidden" onClick={() => setOpen(true)} aria-expanded={open}>
        <FilterIcon /> Filter{active ? ` (${active})` : ""}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-black/30" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-utility bg-white">
            <div className="flex items-center justify-between px-4 py-4">
              <p className="font-serif text-[28px] font-light tracking-[-0.03em]">Filter</p>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-pill bg-paper" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              <FilterGroups {...props} />
            </div>
            <div className="border-t border-line p-4">
              <button type="button" className="btn btn-primary w-full" onClick={() => setOpen(false)}>
                Show {props.count} {props.count === 1 ? "piece" : "pieces"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
