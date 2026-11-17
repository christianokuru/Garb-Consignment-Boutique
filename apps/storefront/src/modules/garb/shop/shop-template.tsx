import { searchProducts, type SearchParams } from "@lib/data/garb"
import { ArrowLeft, ArrowRight } from "@modules/common/components/garb-icons"
import ProductCard from "@modules/garb/product-card"
import Link from "next/link"
import { Suspense } from "react"
import { ActiveFilters, FilterDrawerButton, FilterSidebar, SortSelect } from "./filters"
import { parseShopParams, withParams, type RawParams } from "./params"

const PAGE_SIZE = 24

export type ShopNavItem = { label: string; href: string; active?: boolean }

type Props = {
  title: React.ReactNode
  intro?: React.ReactNode
  eyebrow?: React.ReactNode
  base: SearchParams
  searchParams: RawParams
  path: string
  nav?: ShopNavItem[]
  showDesignerFilter?: boolean
  showSaleFilter?: boolean
  empty?: React.ReactNode
}

function Pagination({ page, pages, path, searchParams }: { page: number; pages: number; path: string; searchParams: RawParams }) {
  if (pages <= 1) return null
  const href = (p: number) => `${path}${withParams(searchParams, { page: p > 1 ? String(p) : null })}`
  return (
    <nav className="mt-16 flex items-center justify-center gap-3" aria-label="Pages">
      {page > 1 ? (
        <Link href={href(page - 1)} className="btn btn-secondary btn-sm" rel="prev"><ArrowLeft /> Previous</Link>
      ) : (
        <span className="btn btn-secondary btn-sm opacity-40" aria-hidden><ArrowLeft /> Previous</span>
      )}
      <span className="px-2 text-label tabular-nums text-quiet">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={href(page + 1)} className="btn btn-primary btn-sm" rel="next">Next <ArrowRight /></Link>
      ) : (
        <span className="btn btn-primary btn-sm opacity-40" aria-hidden>Next <ArrowRight /></span>
      )}
    </nav>
  )
}

export default async function ShopTemplate({
  title,
  intro,
  eyebrow,
  base,
  searchParams,
  path,
  nav,
  showDesignerFilter = true,
  showSaleFilter = true,
  empty,
}: Props) {
  const parsed = parseShopParams(searchParams)
  const query = {
    ...base,
    ...(parsed.designer?.length ? { designer: parsed.designer } : {}),
    size: parsed.size,
    sort: parsed.sort ?? base.sort,
    page: parsed.page,
    onSale: base.onSale || parsed.onSale,
    minPrice: parsed.minPrice,
    maxPrice: parsed.maxPrice,
    limit: PAGE_SIZE,
  }
  const result = await searchProducts(query)
  const pages = Math.max(1, Math.ceil(result.count / PAGE_SIZE))
  const filterProps = {
    designers: result.facets.designer,
    sizes: result.facets.size,
    showDesigners: showDesignerFilter,
    showSale: showSaleFilter && !base.onSale,
    count: result.count,
  }

  return (
    <div className="content-container pb-8 pt-8 sm:pt-12">
      <header className="mb-8 sm:mb-10">
        {eyebrow && <div className="meta mb-3">{eyebrow}</div>}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <h1 className="display">{title}</h1>
          <p className="pb-2 text-label tabular-nums text-quiet">
            {result.count} {result.count === 1 ? "piece" : "pieces"}
          </p>
        </div>
        {intro && <div className="mt-4 max-w-2xl text-body text-[#3d3d3d]">{intro}</div>}
      </header>

      {nav && nav.length > 0 && (
        <nav className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categories">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="pill shrink-0" aria-current={n.active ? "page" : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
      )}

      <Suspense>
        <div className="mb-6 flex items-center justify-between gap-3 border-t border-line pt-6">
          <FilterDrawerButton {...filterProps} />
          <p className="hidden text-label font-medium lg:block">Filter</p>
          <SortSelect />
        </div>
      </Suspense>

      <div className="grid gap-10 lg:grid-cols-[240px_1fr] xl:grid-cols-[264px_1fr]">
        <Suspense>
          <FilterSidebar {...filterProps} />
        </Suspense>
        <div className="min-w-0">
          <Suspense>
            <ActiveFilters />
          </Suspense>
          {result.products.length ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
              {result.products.map((p, i) => (
                <li key={p.id}>
                  <ProductCard product={p} priority={i < 4} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-utility bg-paper px-6 py-16 text-center">
              {empty ?? (
                <>
                  <p className="display-sm">Nothing here <em>yet</em>.</p>
                  <p className="mx-auto mt-3 max-w-md text-body text-[#3d3d3d]">
                    New pieces arrive every day. Try removing a filter, or come back soon.
                  </p>
                  <Link href={path} className="btn btn-primary mt-6">Clear filters</Link>
                </>
              )}
            </div>
          )}
          <Pagination page={parsed.page ?? 1} pages={pages} path={path} searchParams={searchParams} />
        </div>
      </div>
    </div>
  )
}
