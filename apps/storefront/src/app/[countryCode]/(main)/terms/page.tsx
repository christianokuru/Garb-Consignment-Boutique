import { STORE } from "@lib/garb"
import InfoPage from "@modules/garb/info-page"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Terms of sale", alternates: { canonical: "/terms" } }

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" title={<>Terms of <em>sale</em></>} updated="November 2026">
      <p>These terms apply to purchases from garb.ca, operated by {STORE.name}, {STORE.street}, {STORE.city}, Ontario.</p>
      <h2>Pieces and descriptions</h2>
      <p>Pieces are pre-owned unless marked new with tags, and each is one of one. We describe condition, size and measurements as accurately as we can. Colours may look slightly different on screen.</p>
      <h2>Prices and payment</h2>
      <p>Prices are in Canadian dollars and don&apos;t include tax, which is added at checkout. We accept major credit cards and Interac e-Transfer. E-Transfer orders must be paid within {STORE.unpaidHoldHours} hours, or they are cancelled and the pieces returned to sale.</p>
      <h2>Availability</h2>
      <p>Pieces are sold in the shop and online at the same time. If a piece sells in the shop before your payment is processed, we&apos;ll cancel that item and refund any payment in full.</p>
      <h2>Shipping</h2>
      <p>We ship within Canada only. Risk passes to you on delivery. See <a href="/shipping">shipping &amp; pickup</a>.</p>
      <h2>Final sale</h2>
      <p>All sales are final, with no returns, refunds or exchanges, except where an item arrives damaged or not as described and you tell us within 48 hours of delivery.</p>
      <h2>Contact</h2>
      <p>{STORE.phone} · <a href={`mailto:${STORE.email}`}>{STORE.email}</a></p>
    </InfoPage>
  )
}
