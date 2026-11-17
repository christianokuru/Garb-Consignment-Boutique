import { STORE } from "@lib/garb"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import CartTotals from "@modules/common/components/cart-totals"
import BagItem from "@modules/garb/bag/bag-item"
import { provinceName } from "@lib/provinces"
import Link from "next/link"

type Props = { order: HttpTypes.StoreOrder }

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="meta mb-2">{title}</p>
      <div className="text-label leading-relaxed">{children}</div>
    </div>
  )
}

export default async function OrderCompletedTemplate({ order }: Props) {
  const payments = (order.payment_collections ?? []).flatMap((pc) => pc.payments ?? [])
  const isEtransfer = payments.length > 0 && payments.every((p) => p.provider_id === "pp_system_default")
  const paid = payments.some((p) => !!p.captured_at)
  const shipping = order.shipping_methods?.[0]
  const isPickup = /pick ?up/i.test(shipping?.name ?? "")
  const a = order.shipping_address
  const total = convertToLocale({ amount: order.total ?? 0, currency_code: order.currency_code })

  return (
    <div className="content-container pb-8 pt-10 sm:pt-16" data-testid="order-complete-container">
      <div className="max-w-3xl">
        <p className="meta">Order #{order.display_id}</p>
        <h1 className="display mt-3">
          Thank you{a?.first_name ? `, ${a.first_name}` : ""}. <em>It&apos;s yours.</em>
        </h1>
        <p className="mt-5 text-body text-[#3d3d3d]">
          We&apos;ve emailed a confirmation to <span className="text-ink">{order.email}</span>.
        </p>
      </div>

      {isEtransfer && !paid && (
        <section className="mt-10 max-w-3xl rounded-utility bg-paper p-5 sm:p-8" aria-labelledby="etransfer">
          <h2 id="etransfer" className="display-sm">Send your e-Transfer</h2>
          <p className="mt-3 text-body text-[#3d3d3d]">
            Your pieces are held for {STORE.unpaidHoldHours} hours. Send an Interac e-Transfer from your Canadian bank:
          </p>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Amount", total],
              ["Send to", STORE.etransferEmail],
              ["Message", `Order #${order.display_id}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[14px] bg-white p-4">
                <dt className="meta">{k}</dt>
                <dd className="mt-1 break-all text-body font-medium" data-testid={`etransfer-${k.toLowerCase().replace(" ", "-")}`}>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-label text-quiet">
            Once it arrives we&apos;ll email you and {isPickup ? "let you know your order is ready for pickup" : "ship your order"}.
            If we don&apos;t receive payment in time, the order is cancelled and the pieces go back on sale.
          </p>
        </section>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
        <div>
          <h2 className="eyebrow mb-2">What you bought</h2>
          <ul className="divide-y divide-line border-y border-line">
            {order.items?.map((item) => (
              <BagItem key={item.id} item={item as unknown as HttpTypes.StoreCartLineItem} currencyCode={order.currency_code} compact />
            ))}
          </ul>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Block title={isPickup ? "Pickup" : "Shipping to"}>
              {isPickup ? (
                <>
                  {STORE.street}<br />{STORE.city}, {STORE.province}<br />
                  <span className="text-quiet">Tuesday to Sunday, 12–6 pm. Bring photo ID.</span>
                </>
              ) : a ? (
                <>
                  {a.first_name} {a.last_name}<br />
                  {a.address_1}{a.address_2 ? `, ${a.address_2}` : ""}<br />
                  {a.city}, {provinceName(a.province)} {a.postal_code}
                </>
              ) : null}
            </Block>
            <Block title="Delivery">{shipping?.name ?? "—"}</Block>
            <Block title="Payment">
              {isEtransfer ? "Interac e-Transfer" : "Card"}
              <br />
              <span className="text-quiet">{paid ? "Received" : isEtransfer ? "Awaiting e-Transfer" : "Authorized"}</span>
            </Block>
          </div>
        </div>
        <aside className="rounded-utility bg-paper p-5 sm:p-6 lg:self-start">
          <CartTotals totals={order} />
          <div className="mt-6 space-y-2 text-label text-[#3d3d3d]">
            <p>All online sales are final.</p>
            <p>
              Questions? <a href={STORE.phoneHref} className="link">{STORE.phone}</a> or{" "}
              <a href={`mailto:${STORE.email}?subject=${encodeURIComponent(`Order #${order.display_id}`)}`} className="link">{STORE.email}</a>
            </p>
          </div>
          <Link href="/new-arrivals" className="btn btn-primary mt-6 w-full">Keep shopping</Link>
        </aside>
      </div>
    </div>
  )
}
