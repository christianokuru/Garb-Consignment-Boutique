"use client"

import { HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Link from "next/link"

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="rounded-utility bg-paper p-5 sm:p-6">
      <h2 className="mb-5 font-serif text-[30px] font-light leading-none tracking-[-0.03em]">Summary</h2>
      <CartTotals totals={cart} />
      <div className="mt-5">
        <DiscountCode cart={cart} />
      </div>
      <Link href={"/checkout?step=" + step} data-testid="checkout-button" className="btn btn-primary mt-5 w-full py-3.5">
        Check out
      </Link>
      <ul className="mt-5 space-y-1.5 text-micro text-[#3d3d3d]">
        <li>Pay by card or Interac e-Transfer.</li>
        <li>Tracked shipping across Canada, or free pickup on Queen West.</li>
        <li>All online sales are final.</li>
      </ul>
    </div>
  )
}

export default Summary
