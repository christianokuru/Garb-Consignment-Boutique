import type { GarbProduct } from "@lib/data/garb"
import { searchProducts } from "@lib/data/garb"
import { formatPrice, STORE } from "@lib/garb"
import Link from "next/link"
import FaqList from "../faq-list"
import ProductCard, { Price } from "../product-card"
import AddToBag from "./add-to-bag"
import Gallery from "./gallery"

const CONDITION_NOTES: Record<string, string> = {
  "New With Tags": "Never worn, with the original tags attached.",
  "New with tags": "Never worn, with the original tags attached.",
  Flawless: "Worn once or twice. No signs of wear at all.",
  Mint: "Gently worn with no visible signs of wear.",
  Pristine: "Lightly worn, with only the faintest signs of use.",
  Excellent: "Worn with care. Very minor signs of wear, noted in the description.",
  "Very good": "Some light signs of wear, noted in the description.",
  Good: "Visible signs of wear, priced accordingly and noted in the description.",
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-6 border-b border-line py-3 text-label last:border-0">
      <dt className="text-quiet">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

export default async function ProductView({ product }: { product: GarbProduct }) {
  const meta = (product.metadata ?? {}) as Record<string, any>
  const variant = product.variants?.[0]
  const price = variant?.calculated_price
  const amount = Number(price?.calculated_amount ?? 0)
  const original = Number(price?.original_amount ?? amount)
  const onSale = price?.calculated_price?.price_list_type === "sale" && original > amount
  const available = !variant?.manage_inventory || (variant?.inventory_quantity ?? 0) > 0
  const retail = Number(meta.retail_price) || null
  const images = (product.images ?? [])
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((i) => i.url)
  const measurements = Object.entries((meta.measurements ?? {}) as Record<string, string>)
  const details = Object.entries((meta.details ?? {}) as Record<string, string>)
  const category = product.categories?.find((c) => c.parent_category)
  const gender = meta.gender as string | undefined
  const designer = product.designer
  const itemCode = meta.item_code ?? variant?.sku?.replace(/^GARB-/, "")
  const askHref = `mailto:${STORE.email}?subject=${encodeURIComponent(`Question about #${itemCode} ${product.title}`)}`

  const [moreFromDesigner, similar] = await Promise.all([
    designer
      ? searchProducts({ designer: [designer.name], excludeId: product.id, limit: 4 })
      : Promise.resolve({ products: [] }),
    category ? searchProducts({ category: category.handle, excludeId: product.id, limit: 8 }) : Promise.resolve({ products: [] }),
  ])
  const similarFiltered = similar.products.filter((p) => !moreFromDesigner.products.some((m) => m.id === p.id)).slice(0, 4)

  return (
    <div className="content-container pb-8 pt-4 sm:pt-8">
      <nav className="mb-4 hidden text-label text-quiet sm:block" aria-label="Breadcrumb">
        <ol className="flex flex-wrap gap-1.5">
          {gender && (
            <li><Link href={`/${gender}`} className="hover:text-ink">{gender === "men" ? "Men" : "Women"}</Link> /</li>
          )}
          {category && gender && (
            <li><Link href={`/${gender}/${category.handle.replace(`${gender}-`, "")}`} className="hover:text-ink">{category.name}</Link> /</li>
          )}
          <li className="text-ink" aria-current="page">{product.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
        <Gallery images={images} alt={product.title} />

        <div className="lg:sticky lg:top-[112px] lg:self-start">
          {designer ? (
            <Link href={`/designers/${designer.handle}`} className="eyebrow hover:underline">{designer.name}</Link>
          ) : (
            <p className="eyebrow">Garb</p>
          )}
          <h1 className="display-md mt-2">{meta.item_type ?? product.title}</h1>
          {product.subtitle && <p className="mt-1 text-body text-quiet">{product.subtitle}</p>}

          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Price price={amount} original={original} onSale={onSale} className="text-sans-xl" />
            {onSale && <span className="tag bg-ink text-white">Reduced</span>}
          </div>
          {retail && retail > amount && (
            <p className="mt-1 text-label text-quiet">
              Originally {formatPrice(retail)} new · {Math.round((1 - amount / retail) * 100)}% below retail
            </p>
          )}
          <p className="mt-1 text-micro text-quiet">Plus applicable tax. Shipping calculated at checkout.</p>

          <div className="mt-5">
            {available ? (
              <p className="inline-flex items-center gap-2 text-label text-signal">
                <span className="h-2 w-2 rounded-full bg-signal" aria-hidden /> Available · one of one
              </p>
            ) : (
              <p className="text-label text-quiet">Sold</p>
            )}
          </div>

          <dl className="mt-5 rounded-utility bg-paper px-4">
            {meta.size && <DetailRow label="Size">{meta.labeled_size ?? meta.size}</DetailRow>}
            {meta.condition && (
              <DetailRow label="Condition">
                <span className="block">{meta.condition}</span>
                {CONDITION_NOTES[meta.condition] && (
                  <span className="block max-w-[220px] text-micro text-quiet">{CONDITION_NOTES[meta.condition]}</span>
                )}
              </DetailRow>
            )}
            {meta.colour && <DetailRow label="Colour">{meta.colour}</DetailRow>}
            {itemCode && <DetailRow label="Item code"><span className="tabular-nums">#{itemCode}</span></DetailRow>}
          </dl>

          <div className="mt-6">
            <AddToBag variantId={variant?.id} available={available} title={product.title} />
          </div>
          <a href={askHref} className="btn btn-secondary mt-2 w-full">Ask about this piece</a>

          <ul className="mt-6 space-y-1.5 text-label text-[#3d3d3d]">
            <li>Tracked shipping across Canada, or free pickup at {STORE.street}.</li>
            <li>Pay by card or Interac e-Transfer.</li>
            <li>All online sales are final. Ask us for more photos or measurements.</li>
          </ul>

          <div className="mt-8">
            <FaqList
              items={[
                ...(product.description ? [{ q: "Description", a: <p>{product.description}</p> }] : []),
                ...(measurements.length
                  ? [
                      {
                        q: "Measurements",
                        a: (
                          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-label">
                            {measurements.map(([k, v]) => (
                              <div key={k} className="contents">
                                <dt className="text-quiet">{k}</dt>
                                <dd className="tabular-nums">{v}</dd>
                              </div>
                            ))}
                            <p className="col-span-2 mt-2 text-micro text-quiet">Measured flat. Chest and waist are across the front.</p>
                          </dl>
                        ),
                      },
                    ]
                  : []),
                ...(details.length
                  ? [
                      {
                        q: "Details",
                        a: (
                          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-label">
                            {details.map(([k, v]) => (
                              <div key={k} className="contents">
                                <dt className="text-quiet">{k}</dt>
                                <dd>{v}</dd>
                              </div>
                            ))}
                          </dl>
                        ),
                      },
                    ]
                  : []),
                {
                  q: "Shipping, pickup and payment",
                  a: (
                    <p>
                      Canada Post Expedited ($20) or Xpresspost ($35), tracked to anywhere in Canada. Or pick up for free
                      at {STORE.street}, usually ready the next business day. Pay by card, or by Interac e-Transfer to{" "}
                      {STORE.etransferEmail} within {STORE.unpaidHoldHours} hours. <Link href="/shipping" className="link">More</Link>
                    </p>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>

      {moreFromDesigner.products.length > 0 && designer && (
        <section className="mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="display-sm">More from <em>{designer.name}</em></h2>
            <Link href={`/designers/${designer.handle}`} className="btn btn-secondary btn-sm">View all</Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {moreFromDesigner.products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
      {similarFiltered.length > 0 && (
        <section className="mt-24">
          <h2 className="display-sm mb-8">You may also <em>like</em></h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {similarFiltered.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
