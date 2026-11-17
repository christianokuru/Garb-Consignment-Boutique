import { STORE } from "@lib/garb"
import InfoPage from "@modules/garb/info-page"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Shipping & pickup", alternates: { canonical: "/shipping" } }

export default function ShippingPage() {
  return (
    <InfoPage eyebrow="Help" title={<>Shipping <em>&amp;</em> pickup</>} intro="We ship anywhere in Canada, or you can pick up for free at the shop.">
      <h2>Shipping in Canada</h2>
      <ul>
        <li><strong>Canada Post Expedited</strong>: $20, tracked, usually 2 to 6 business days.</li>
        <li><strong>Canada Post Xpresspost</strong>: $35, tracked and insured, usually 1 to 3 business days.</li>
      </ul>
      <p>Orders ship within one to two business days of payment. You&apos;ll get a tracking number by email. We don&apos;t ship outside Canada.</p>
      <h2>Free pickup</h2>
      <p>Choose pickup at checkout and collect your order at {STORE.street}, Toronto, Tuesday to Sunday from 12 to 6 pm. We&apos;ll email you when it&apos;s ready, usually the next business day. Please bring photo ID.</p>
      <h2>Paying by e-Transfer</h2>
      <p>If you choose Interac e-Transfer, send the order total to {STORE.etransferEmail} within {STORE.unpaidHoldHours} hours with your order number in the message. We hold your pieces until it arrives, then ship or prepare them for pickup. Orders we haven&apos;t been paid for after {STORE.unpaidHoldHours} hours are cancelled automatically.</p>
      <h2>Taxes</h2>
      <p>Prices don&apos;t include tax. GST, HST or PST is added at checkout based on where the order is going (or Ontario HST for pickup).</p>
    </InfoPage>
  )
}
