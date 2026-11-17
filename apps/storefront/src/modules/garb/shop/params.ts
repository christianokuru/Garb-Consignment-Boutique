import type { SearchParams, SortKey } from "@lib/data/garb"

export type RawParams = Record<string, string | string[] | undefined>

export const PRICE_RANGES: { key: string; label: string; min?: number; max?: number }[] = [
  { key: "0-200", label: "Under $200", max: 199.99 },
  { key: "200-500", label: "$200 to $500", min: 200, max: 500 },
  { key: "500-1000", label: "$500 to $1,000", min: 500, max: 1000 },
  { key: "1000-", label: "Over $1,000", min: 1000 },
]

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price, low to high" },
  { key: "price_desc", label: "Price, high to low" },
]

const list = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []).filter(Boolean)

/** Turns URL search params into a search request. */
export function parseShopParams(raw: RawParams): SearchParams & { price?: string } {
  const sort = SORT_OPTIONS.find((s) => s.key === raw.sort)?.key
  const price = PRICE_RANGES.find((p) => p.key === raw.price)
  const page = Math.max(1, Number(raw.page) || 1)
  return {
    designer: list(raw.designer),
    size: list(raw.size),
    sort,
    page,
    onSale: raw.sale === "1",
    minPrice: price?.min,
    maxPrice: price?.max,
    price: price?.key,
  }
}

/** Builds a query string from the current params with some keys changed. */
export function withParams(raw: RawParams, changes: Record<string, string | string[] | null>) {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(raw)) {
    if (k in changes) continue
    for (const x of list(v)) sp.append(k, x)
  }
  for (const [k, v] of Object.entries(changes)) {
    for (const x of list(v ?? undefined)) sp.append(k, x)
  }
  const s = sp.toString()
  return s ? `?${s}` : ""
}
