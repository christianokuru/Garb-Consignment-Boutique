import { HttpTypes } from "@medusajs/types"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import BagItem from "@modules/garb/bag/bag-item"
import { convertToLocale } from "@lib/util/money"

function SummaryBody({ cart }: { cart: HttpTypes.StoreCart }) {
  return (
    <>
      <ul className="mt-2 divide-y divide-line" data-testid="items-table">
        {cart.items?.map((item) => (
          <BagItem key={item.id} item={item} currencyCode={cart.currency_code} compact />
        ))}
      </ul>
      <div className="mt-4 border-t border-line pt-5">
        <CartTotals totals={cart} />
      </div>
      <div className="mt-5">
        <DiscountCode cart={cart} />
      </div>
    </>
  )
}

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const count = cart.items?.length ?? 0
  const heading = (
    <h2 className="font-serif text-[28px] font-light leading-none tracking-[-0.03em]">
      Your order <span className="font-sans text-label text-quiet">({count})</span>
    </h2>
  )
  return (
    <>
      {/* Phones: collapsed so the form comes first */}
      <details className="group order-first rounded-utility bg-paper p-5 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
          {heading}
          <span className="text-right text-label">
            <span className="block font-medium tabular-nums">{convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code })}</span>
            <span className="text-quiet underline underline-offset-4 group-open:hidden">Show</span>
            <span className="hidden text-quiet underline underline-offset-4 group-open:inline">Hide</span>
          </span>
        </summary>
        <SummaryBody cart={cart} />
      </details>
      <aside className="hidden rounded-utility bg-paper p-6 lg:sticky lg:top-8 lg:block lg:self-start" aria-label="Order summary">
        {heading}
        <SummaryBody cart={cart} />
      </aside>
    </>
  )
}

export default CheckoutSummary
