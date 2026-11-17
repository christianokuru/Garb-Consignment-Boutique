import { STORE } from "@lib/garb"
import InfoPage from "@modules/garb/info-page"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Final sale policy", alternates: { canonical: "/returns" } }

export default function ReturnsPage() {
  return (
    <InfoPage eyebrow="Help" title={<>All sales are <em>final</em></>} intro="Every piece at Garb is one of one and sold on behalf of its owner, so we can't take returns.">
      <p>All online purchases are final sale: no returns, refunds or exchanges. This includes orders shipped to you and orders picked up in the shop.</p>
      <h2>Ask before you buy</h2>
      <p>We&apos;re happy to help you decide. Ask us for more photos, measurements, or details about condition. Email <a href={`mailto:${STORE.email}`}>{STORE.email}</a> with the item code (it&apos;s on every product page), or call {STORE.phone}.</p>
      <h2>Condition</h2>
      <p>We inspect every piece before it goes on sale and describe any signs of wear. Our condition grades run from <em>New with tags</em> (never worn) through <em>Flawless</em>, <em>Mint</em> and <em>Pristine</em>.</p>
      <h2>If something is wrong</h2>
      <p>If your order arrives damaged or isn&apos;t what was described, contact us within 48 hours of delivery and we&apos;ll make it right.</p>
    </InfoPage>
  )
}
