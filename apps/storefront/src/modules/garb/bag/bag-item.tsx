"use client"

import { deleteLineItem } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import Link from "next/link"
import { useState, useTransition } from "react"
import { notifyBagChanged } from "@modules/layout/components/garb/bag-button"

export default function BagItem({
  item,
  currencyCode,
  compact,
}: {
  item: HttpTypes.StoreCartLineItem
  currencyCode: string
  compact?: boolean
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const meta = (item.variant?.product?.metadata ?? {}) as Record<string, any>
  const code = item.variant_sku?.replace(/^GARB-/, "") ?? meta.item_code
  const size = item.variant_title && item.variant_title !== "Default variant" ? item.variant_title : meta.size
  const unit = Number(item.unit_price ?? 0)
  const total = Number(item.subtotal ?? unit * (item.quantity ?? 1))
  const original = Number((item as any).compare_at_unit_price ?? 0)

  return (
    <li className="flex gap-4 py-5" data-testid="product-row">
      <Link href={`/products/${item.product_handle}`} className={`relative shrink-0 overflow-hidden bg-paper ${compact ? "h-24 w-16" : "h-36 w-24 sm:h-44 sm:w-[118px]"}`}>
        {item.thumbnail && <Image src={item.thumbnail} alt={item.product_title ?? ""} fill sizes="120px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/products/${item.product_handle}`} className="text-label font-medium hover:underline" data-testid="product-title">
              {item.product_title}
            </Link>
            <p className="mt-0.5 text-label text-quiet">
              {[size && size !== "O/S" ? `Size ${size}` : null, code ? `#${code}` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="text-label tabular-nums" data-testid="product-price">
            {original > unit && <s className="mr-2 text-quiet">{convertToLocale({ amount: original, currency_code: currencyCode })}</s>}
            {convertToLocale({ amount: compact ? total : unit, currency_code: currencyCode })}
          </p>
        </div>
        {!compact && (
          <div className="mt-auto flex items-center justify-between pt-3">
            <span className="text-micro text-quiet">One of one · final sale</span>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null)
                  try {
                    await deleteLineItem(item.id)
                    notifyBagChanged()
                  } catch (e) {
                    setError((e as Error).message)
                  }
                })
              }
              className="text-label underline underline-offset-4 disabled:opacity-40"
              data-testid="product-delete-button"
            >
              {pending ? "Removing" : "Remove"}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-micro text-alert">{error}</p>}
      </div>
    </li>
  )
}
