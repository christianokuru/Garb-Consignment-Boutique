import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
}

export default async function Checkout() {
  const cart = await retrieveCart()

  if (!cart || !cart.items?.length) {
    redirect("/cart")
  }

  const customer = await retrieveCustomer()

  return (
    <div className="content-container grid grid-cols-1 gap-10 py-8 sm:py-12 lg:grid-cols-[1fr_420px] lg:gap-16">
      <PaymentWrapper cart={cart}>
        <CheckoutForm cart={cart} customer={customer} />
      </PaymentWrapper>
      <CheckoutSummary cart={cart} />
    </div>
  )
}
