import { STORE } from "@lib/garb"
import FaqList from "@modules/garb/faq-list"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Consign with Garb",
  description: "Sell your designer clothing, bags and accessories through Garb on Queen West, Toronto. Earn 50% of every sale. 90 days on display, payouts from the 15th.",
  alternates: { canonical: "/consign" },
}

const STEPS = [
  {
    title: "Book an appointment",
    copy: <>Every consignment starts with an appointment: <Link href="/consign/book" className="link">book online</Link>, call {STORE.phone} or email {STORE.email}. We don&apos;t take walk-ins. For more than 25 pieces, we can come to you, usually outside shop hours.</>,
  },
  {
    title: "Prepare your pieces",
    copy: <>Bring items freshly laundered or dry-cleaned, wrinkle-free, on hangers or neatly folded. Use garment bags, flat-bottomed shopping bags or totes (we return them). Please no garbage or grocery bags: we&apos;re not a thrift store.</>,
  },
  {
    title: "We look at everything together",
    copy: <>We check each piece for condition and decide what will sell, based on current and classic trends and what our clients ask for. Leave original tags on anything unworn: those can sell for more.</>,
  },
  {
    title: "We price, photograph and sell",
    copy: <>Accepted pieces go on the floor on Queen West and online for 90 days. Luxury bags and other highly desirable pieces stay for 180 days.</>,
  },
  {
    title: "You get paid",
    copy: <>You receive {STORE.splitRate}% of each sale. A month&apos;s sales are ready to collect at the shop on or after the 15th of the following month, with no exceptions. Follow everything in your <Link href="/seller" className="link">seller account</Link>.</>,
  },
]

export default function ConsignPage() {
  return (
    <>
      <section className="content-container pb-16 pt-10 sm:pt-16">
        <div className="mb-6 flex flex-wrap gap-2">
          {["Earn 50%", "90 days on the floor", "In store and online"].map((t) => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
        <h1 className="display max-w-[13ch]">Your closet, <em>sold</em> beautifully.</h1>
        <p className="mt-6 max-w-xl text-body text-[#3d3d3d] sm:text-lede">
          Consign your designer clothing, bags, shoes and accessories with Garb. We price them, style them and sell them in
          our Queen West shop and online. You keep half of every sale.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/consign/book" className="btn btn-primary">Book an appointment</Link>
          <Link href="/consign/what-we-take" className="btn btn-secondary">What we take</Link>
          <Link href="/seller" className="btn btn-ghost">Seller login</Link>
        </div>
      </section>

      <section className="content-container grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16" aria-labelledby="how">
        <div>
          <h2 id="how" className="display-md">How it <em>works</em></h2>
          <p className="mt-4 max-w-sm text-body text-[#3d3d3d]">Five steps from your closet to someone else&apos;s.</p>
        </div>
        <ol className="space-y-3 rounded-utility bg-paper p-3 sm:p-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_1fr] gap-4 rounded-[14px] bg-white p-5 sm:gap-6 sm:p-6">
              <span className="font-serif text-[40px] font-light leading-none tracking-[-0.05em] text-quiet">0{i + 1}</span>
              <div>
                <h3 className="text-sans-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-label text-[#3d3d3d] text-pretty">{s.copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="content-container mt-24 grid gap-6 sm:grid-cols-3" aria-label="Condition">
        {[
          ["Pristine condition", "No stains, odours, discolouring or visible wear. Common reasons we decline: deodorant marks, tiny holes and unravelling seams."],
          ["Complete and working", "Buttons intact, zippers working, hems and pockets undamaged, labels securely attached."],
          ["Current or collectible", "Pieces that feel relevant now, or collectible designer vintage in great condition."],
        ].map(([t, c]) => (
          <div key={t} className="border-t border-ink pt-5">
            <p className="text-body font-medium">{t}</p>
            <p className="mt-2 text-label text-[#3d3d3d]">{c}</p>
          </div>
        ))}
      </section>

      <section className="content-container mt-24 grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <h2 className="display-md">Questions <em>sellers</em> ask</h2>
          <Link href="/consign/book" className="btn btn-primary mt-8">Book an appointment</Link>
        </div>
        <FaqList
          items={[
            { q: "What happens if my piece doesn't sell?", a: "After the display period we contact you to pick it up, and you have one week to collect it. Pieces that aren't collected become the property of Garb and are put to good use." },
            { q: "How is the price set?", a: "We price each piece from its label, condition, current demand and what similar pieces sell for. Unworn pieces with tags can sell for more. Most pieces sell for 50 to 75% below original retail." },
            { q: "Can I see how my pieces are doing?", a: <>Yes. When you consign with us we&apos;ll invite you to a <Link href="/seller" className="link">seller account</Link> where you can see what&apos;s on the floor, what has sold, what you&apos;ve earned and when your payout is ready.</> },
            { q: "When and how do I get paid?", a: "Sales from one month can be collected at the shop on or after the 15th of the next month. For example, July sales are ready from August 15." },
            { q: "Do you buy items outright?", a: "No, Garb works on consignment only, which is how we can offer sellers half of the sale price." },
            { q: "Not sure if we'll take something?", a: <>It never hurts to ask. Call {STORE.phone} or email <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a> with a photo.</> },
          ]}
        />
      </section>
    </>
  )
}
