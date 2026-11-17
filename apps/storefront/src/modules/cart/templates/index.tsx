import { HttpTypes } from "@medusajs/types"
import BagItem from "@modules/garb/bag/bag-item"
import Link from "next/link"
import Summary from "./summary"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const items = [...(cart?.items ?? [])].sort((a, b) => ((a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1))

  if (!cart || !items.length) {
    return (
      <div className="content-container py-20 text-center sm:py-28" data-testid="empty-cart-message">
        <h1 className="display mx-auto max-w-[12ch]">Your bag is <em>empty</em>.</h1>
        <p className="mx-auto mt-5 max-w-md text-body text-[#3d3d3d]">
          Everything at Garb is one of one. When you see something you love, add it to your bag before someone else does.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/new-arrivals" className="btn btn-primary">Shop new arrivals</Link>
          <Link href="/designers" className="btn btn-secondary">Browse designers</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container pb-8 pt-8 sm:pt-12" data-testid="cart-container">
      <h1 className="display mb-8">Your <em>bag</em></h1>
      <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div>
          {!customer && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-utility bg-paper px-5 py-4">
              <p className="text-label">Have an account? Sign in to check out faster and see your orders.</p>
              <Link href="/account" className="btn btn-secondary btn-sm bg-white" data-testid="sign-in-button">Sign in</Link>
            </div>
          )}
          <ul className="divide-y divide-line border-b border-line">
            {items.map((item) => (
              <BagItem key={item.id} item={item} currencyCode={cart.currency_code} />
            ))}
          </ul>
          <p className="mt-4 text-label text-quiet">
            Items in your bag aren&apos;t reserved until you check out. Pieces are one of one and can sell in the shop at any time.
          </p>
        </div>
        <div className="lg:sticky lg:top-[112px] lg:self-start">
          <Summary cart={cart} />
        </div>
      </div>
    </div>
  )
}

export default CartTemplate
