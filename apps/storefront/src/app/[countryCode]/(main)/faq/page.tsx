import { STORE } from "@lib/garb"
import FaqList from "@modules/garb/faq-list"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "FAQ", alternates: { canonical: "/faq" } }

export default function FaqPage() {
  return (
    <div className="content-container pb-8 pt-10 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <p className="meta mb-3">Help</p>
          <h1 className="display max-w-[10ch]">Good to <em>know</em></h1>
          <p className="mt-5 max-w-sm text-body text-[#3d3d3d]">Can&apos;t find your answer? Call {STORE.phone} or email {STORE.email}.</p>
        </div>
        <div className="space-y-14">
          <section>
            <h2 className="eyebrow mb-2">Buying</h2>
            <FaqList
              items={[
                { q: "Is everything authentic?", a: "Yes. Every piece is inspected by our team before it reaches the floor. We only accept labels we know well and turn away anything we can't stand behind." },
                { q: "What do the condition grades mean?", a: "New with tags: never worn, tags attached. Flawless: worn once or twice, no signs of wear. Mint: gently worn, no visible signs of wear. Pristine: lightly worn, only the faintest signs of use. Any flaws are described on the product page." },
                { q: "How do I pay?", a: <>By card at checkout, or by Interac e-Transfer from a Canadian bank account. With e-Transfer we hold your pieces for {STORE.unpaidHoldHours} hours while you send payment to {STORE.etransferEmail}.</> },
                { q: "Can I put something on hold?", a: "Pieces aren't reserved until you check out, and the same pieces are for sale in the shop. If you love something, it's safest to buy it." },
                { q: "Can I return something?", a: <>All sales are final. Ask us for more photos or measurements before you buy. <Link href="/returns" className="link">Read the policy</Link>.</> },
                { q: "Do you ship outside Canada?", a: <>Not at the moment. We ship anywhere in Canada and offer free pickup on Queen West. <Link href="/shipping" className="link">Shipping details</Link>.</> },
                { q: "Do I need an account to order?", a: "No. You can check out as a guest. An account lets you see past orders and saves your address." },
              ]}
            />
          </section>
          <section>
            <h2 className="eyebrow mb-2">Selling</h2>
            <FaqList
              items={[
                { q: "How much do I earn?", a: `${STORE.splitRate}% of the selling price of each piece.` },
                { q: "How long are my pieces displayed?", a: "Up to 90 days. Luxury bags and certain highly desirable pieces get 180 days." },
                { q: "When do I get paid?", a: "Sales from one month can be collected on or after the 15th of the following month." },
                { q: "Do you take walk-ins?", a: <>No, consignment is by appointment. <Link href="/consign/book" className="link">Book online</Link>, call or email us.</> },
                { q: "Where can I see my pieces and earnings?", a: <>In your <Link href="/seller" className="link">seller account</Link>. We send you an invite when you first consign.</> },
              ]}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
