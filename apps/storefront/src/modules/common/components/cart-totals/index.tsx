"use client"

import { convertToLocale } from "@lib/util/money"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
    shipping_methods?: unknown[] | null
  }
}

const Row = ({ label, value, testId, raw, emphasis }: { label: string; value: string; testId: string; raw: number; emphasis?: boolean }) => (
  <div className={`flex items-baseline justify-between gap-4 ${emphasis ? "text-body font-medium" : "text-label"}`}>
    <span className={emphasis ? "" : "text-[#3d3d3d]"}>{label}</span>
    <span className="tabular-nums" data-testid={testId} data-value={raw}>{value}</span>
  </div>
)

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const { currency_code, total, tax_total, item_subtotal, shipping_subtotal, discount_subtotal, shipping_methods } = totals
  const fmt = (amount?: number | null) => convertToLocale({ amount: amount ?? 0, currency_code })
  const shippingChosen = Array.isArray(shipping_methods) ? shipping_methods.length > 0 : true

  return (
    <div className="space-y-2.5">
      <Row label="Subtotal" value={fmt(item_subtotal)} testId="cart-subtotal" raw={item_subtotal ?? 0} />
      <Row
        label="Shipping"
        value={shippingChosen ? (shipping_subtotal ? fmt(shipping_subtotal) : "Free") : "At checkout"}
        testId="cart-shipping"
        raw={shipping_subtotal ?? 0}
      />
      {!!discount_subtotal && <Row label="Discount" value={`− ${fmt(discount_subtotal)}`} testId="cart-discount" raw={discount_subtotal} />}
      <Row label="Tax (GST/HST)" value={fmt(tax_total)} testId="cart-taxes" raw={tax_total ?? 0} />
      <div className="!mt-4 border-t border-line pt-4">
        <Row label="Total" value={fmt(total)} testId="cart-total" raw={total ?? 0} emphasis />
      </div>
    </div>
  )
}

export default CartTotals
