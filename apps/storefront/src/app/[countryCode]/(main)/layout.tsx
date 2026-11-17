import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { Suspense } from "react"

async function MismatchBanner() {
  const [customer, cart] = await Promise.all([retrieveCustomer(), retrieveCart()])
  if (!customer || !cart) return null
  return <CartMismatchBanner customer={customer} cart={cart} />
}

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <Suspense fallback={null}>
        <MismatchBanner />
      </Suspense>
      <main id="main" className="relative">{props.children}</main>
      <Footer />
    </>
  )
}
