import { getSeller, getSellerItems, getSellerPayouts, sellerLogout, type SellerItem } from "@lib/data/garb-auth"
import { formatPrice, STORE } from "@lib/garb"
import AuthShell from "@modules/garb/auth/auth-shell"
import { SellerLoginForm, SellerPhoneForm } from "@modules/garb/auth/forms"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = { title: "Seller account", robots: { index: false } }
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ tab?: string }> }

const date = (d: string | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: STORE.timeZone }).format(new Date(d)) : "—"
const period = (p: string) => {
  const [y, m] = p.split("-").map(Number)
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1))
}
const daysLeft = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
const money = (n: number | null | undefined) => formatPrice(n, { cents: true })

const STATUS: Record<SellerItem["status"], string> = {
  active: "On the floor",
  sold: "Sold",
  expired: "Ready for pickup",
  returned: "Picked up",
  forfeited: "Kept by Garb",
  withdrawn: "Withdrawn",
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[14px] bg-white p-4 sm:p-5">
      <p className="meta">{label}</p>
      <p className="mt-2 font-serif text-[34px] font-light leading-none tracking-[-0.04em] tabular-nums sm:text-[40px]">{value}</p>
      {hint && <p className="mt-2 text-micro text-quiet">{hint}</p>}
    </div>
  )
}

function ItemRow({ item }: { item: SellerItem }) {
  const thumb = item.product?.thumbnail
  const live = item.status === "active" && item.product?.status === "published"
  const left = daysLeft(item.expires_at)
  return (
    <li className="flex gap-4 py-4">
      <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-paper">
        {thumb && <Image src={thumb} alt="" fill sizes="64px" className="object-cover" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          {live ? (
            <Link href={`/products/${item.product!.handle}`} className="text-label font-medium hover:underline">{item.title}</Link>
          ) : (
            <p className="text-label font-medium">{item.title}</p>
          )}
          <p className="text-label text-quiet">#{item.item_code} · in {date(item.received_at)}</p>
          <p className="mt-1">
            <span className={`tag ${item.status === "expired" ? "bg-ink text-white" : ""}`}>{STATUS[item.status]}</span>
          </p>
        </div>
        <div className="text-label sm:text-right">
          {item.status === "sold" ? (
            <>
              <p className="tabular-nums">Sold for {money(item.sale_price)}</p>
              <p className="font-medium tabular-nums">You earn {money(item.consignor_share)}</p>
              <p className="text-quiet">{date(item.sold_at)}</p>
            </>
          ) : item.status === "active" ? (
            <>
              <p className="tabular-nums">Listed at {money(item.list_price)}</p>
              <p className={left <= 14 ? "font-medium" : "text-quiet"}>
                {left > 0 ? `${left} days left · until ${date(item.expires_at)}` : "Display period ending"}
              </p>
            </>
          ) : item.status === "expired" ? (
            <p className="font-medium">Collect by {date(item.pickup_deadline)}</p>
          ) : (
            <p className="text-quiet">{money(item.list_price)}</p>
          )}
        </div>
      </div>
    </li>
  )
}

export default async function SellerPage({ searchParams }: Props) {
  const me = await getSeller()

  if (!me) {
    return (
      <AuthShell
        title={<>Seller <em>account</em></>}
        intro={
          <>
            <p>Follow your consigned pieces: what&apos;s on the floor, what has sold, what you&apos;ve earned and when your payout is ready.</p>
            <p className="mt-4 text-label">
              No account yet? We set one up when you first consign with us. Ask for your invite at the shop or by email at{" "}
              <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a>.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/consign" className="btn btn-secondary">How consigning works</Link>
              <Link href="/consign/book" className="btn btn-secondary">Book an appointment</Link>
            </div>
          </>
        }
      >
        <SellerLoginForm />
      </AuthShell>
    )
  }

  const { tab = "floor" } = await searchParams
  const [items, payouts] = await Promise.all([getSellerItems(), getSellerPayouts()])
  const { consignor, summary } = me
  const pickup = items.filter((i) => i.status === "expired")
  const floor = items.filter((i) => i.status === "active").sort((a, b) => +new Date(a.expires_at) - +new Date(b.expires_at))
  const sold = items.filter((i) => i.status === "sold")
  const past = items.filter((i) => ["returned", "forfeited", "withdrawn"].includes(i.status))
  const tabs = [
    ["floor", `On the floor (${floor.length})`],
    ["sold", `Sold (${sold.length})`],
    ["payouts", `Payouts (${payouts.length})`],
    ["past", `Returned (${past.length})`],
    ["profile", "Profile"],
  ]

  return (
    <div className="content-container pb-8 pt-8 sm:pt-12" data-testid="seller-dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="meta">Seller account {consignor.account_number} · {consignor.split_rate}% split</p>
          <h1 className="display mt-2">Hello, <em>{consignor.first_name}</em></h1>
        </div>
        <form action={sellerLogout}>
          <button className="btn btn-secondary btn-sm" type="submit">Sign out</button>
        </form>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-2 rounded-utility bg-paper p-2 sm:gap-3 sm:p-3 lg:grid-cols-4" aria-label="Summary">
        <Stat label="Ready to collect" value={money(summary.ready_to_collect)} hint={summary.ready_to_collect ? "Pick up at the shop, Tue–Sun 12–6" : "Nothing waiting right now"} />
        <Stat label="Earned this month" value={money(summary.this_month_earnings)} hint={`Paid from the 15th of next month`} />
        <Stat label="On the floor" value={String(summary.active_count)} hint={summary.expiring_soon_count ? `${summary.expiring_soon_count} ending in the next 2 weeks` : "Pieces for sale now"} />
        <Stat label="Lifetime earnings" value={money(summary.lifetime_earnings)} hint={`${summary.sold_count} pieces sold`} />
      </section>

      {pickup.length > 0 && (
        <section className="mt-6 rounded-utility bg-ink p-5 text-white sm:p-6" aria-label="Ready for pickup">
          <p className="font-serif text-[28px] font-light tracking-[-0.03em]">{pickup.length === 1 ? "One piece is" : `${pickup.length} pieces are`} ready for pickup</p>
          <ul className="mt-3 space-y-1 text-label">
            {pickup.map((i) => (
              <li key={i.id}>{i.title} (#{i.item_code}) · collect by {date(i.pickup_deadline)}</li>
            ))}
          </ul>
          <p className="mt-3 text-label text-white/70">
            Its display period has ended. Pieces not collected by the date become Garb&apos;s property. Questions? {STORE.phone}.
          </p>
        </section>
      )}

      <nav className="no-scrollbar -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" aria-label="Seller sections">
        {tabs.map(([key, label]) => (
          <Link key={key} href={`/seller?tab=${key}`} scroll={false} className="pill shrink-0" aria-current={tab === key ? "page" : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "floor" && (
          floor.length ? (
            <ul className="divide-y divide-line border-y border-line">{floor.map((i) => <ItemRow key={i.id} item={i} />)}</ul>
          ) : (
            <p className="rounded-utility bg-paper p-6 text-body">Nothing on the floor right now. <Link href="/consign/book" className="link">Book a consignment appointment</Link>.</p>
          )
        )}
        {tab === "sold" && (
          sold.length ? (
            <>
              <ul className="divide-y divide-line border-y border-line">{sold.map((i) => <ItemRow key={i.id} item={i} />)}</ul>
              {summary.pending_earnings > 0 && (
                <p className="mt-4 text-label text-quiet">
                  {money(summary.pending_earnings)} from recent sales will be added to next month&apos;s payout.
                </p>
              )}
            </>
          ) : (
            <p className="rounded-utility bg-paper p-6 text-body">No sales yet. We&apos;ll email you when something sells.</p>
          )
        )}
        {tab === "payouts" && (
          payouts.length ? (
            <ul className="divide-y divide-line border-y border-line">
              {payouts.map((p) => (
                <li key={p.id} className="py-4">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                      <div>
                        <p className="text-body font-medium">{period(p.period)} sales</p>
                        <p className="text-label text-quiet">
                          {p.item_count} {p.item_count === 1 ? "piece" : "pieces"} ·{" "}
                          {p.state === "paid" ? `Paid ${date(p.paid_at)}${p.method ? ` by ${p.method}` : ""}` : p.state === "ready" ? "Ready to collect now" : `Ready from ${date(p.available_at)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`tag ${p.state === "ready" ? "bg-ink text-white" : ""}`}>{p.state === "paid" ? "Paid" : p.state === "ready" ? "Ready" : "Scheduled"}</span>
                        <span className="text-body font-medium tabular-nums">{money(p.amount)}</span>
                      </div>
                    </summary>
                    <ul className="mt-3 space-y-1 rounded-[14px] bg-paper p-4 text-label">
                      {p.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-4">
                          <span>{i.title} <span className="text-quiet">#{i.item_code}</span></span>
                          <span className="tabular-nums">{money(i.consignor_share)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-utility bg-paper p-6 text-body">No payouts yet. Each month&apos;s sales are grouped into one payout, ready from the 15th of the following month.</p>
          )
        )}
        {tab === "past" && (
          past.length ? (
            <ul className="divide-y divide-line border-y border-line">{past.map((i) => <ItemRow key={i.id} item={i} />)}</ul>
          ) : (
            <p className="rounded-utility bg-paper p-6 text-body">Nothing here yet.</p>
          )
        )}
        {tab === "profile" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-utility bg-paper p-6">
              <dl className="space-y-3 text-label">
                <div><dt className="text-quiet">Name</dt><dd className="text-body">{consignor.first_name} {consignor.last_name}</dd></div>
                <div><dt className="text-quiet">Email</dt><dd className="text-body">{consignor.email}</dd></div>
                <div><dt className="text-quiet">Account number</dt><dd className="text-body">{consignor.account_number}</dd></div>
                <div><dt className="text-quiet">Your split</dt><dd className="text-body">{consignor.split_rate}% of each sale</dd></div>
                <div><dt className="text-quiet">Seller since</dt><dd className="text-body">{date(consignor.created_at)}</dd></div>
              </dl>
              <p className="mt-6 text-label text-quiet">To change your name or email, call {STORE.phone}.</p>
            </div>
            <div>
              <SellerPhoneForm phone={consignor.phone} />
            </div>
          </div>
        )}
      </div>

      <section className="mt-16 grid gap-6 border-t border-line pt-10 text-label sm:grid-cols-3">
        <div><p className="font-medium">How payouts work</p><p className="mt-1 text-[#3d3d3d]">You earn {consignor.split_rate}% of each sale. A month&apos;s sales are ready to collect at the shop from the 15th of the next month.</p></div>
        <div><p className="font-medium">Display period</p><p className="mt-1 text-[#3d3d3d]">Pieces are shown for 90 days (180 for luxury bags). After that we&apos;ll ask you to collect them within a week.</p></div>
        <div><p className="font-medium">Bring more</p><p className="mt-1 text-[#3d3d3d]"><Link href="/consign/book" className="link">Book your next appointment</Link> or see <Link href="/consign/what-we-take" className="link">what we take</Link>.</p></div>
      </section>
    </div>
  )
}
