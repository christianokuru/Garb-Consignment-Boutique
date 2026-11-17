import { listDesigners, searchProducts } from "@lib/data/garb"
import { STORE } from "@lib/garb"
import { ArrowRight } from "@modules/common/components/garb-icons"
import Collage from "@modules/garb/collage"
import FaqList from "@modules/garb/faq-list"
import ProductCard from "@modules/garb/product-card"
import SectionHeading from "@modules/garb/section-heading"
import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: "Garb Consignment Boutique · Designer consignment in Toronto" },
  alternates: { canonical: "/" },
}

const TAGS: [string, string, string][] = [
  ["Outerwear", "/women/outerwear", "#2b44ff"],
  ["Bags", "/women/bags", "#ff3b30"],
  ["Knitwear", "/women/knitwear", "#e535ab"],
  ["Footwear", "/women/footwear", "#22b8f0"],
  ["Suiting", "/men/suits", "#ff7a1a"],
  ["Jewelry", "/women/jewelry", "#7a5af8"],
]

const STEPS = [
  ["Book", "Request an appointment online, by phone or email. Bring up to 25 pieces in store, or we come to you for larger collections."],
  ["Bring", "Freshly cleaned, on hangers or neatly folded. We look at every piece with you and accept what our clients are asking for."],
  ["We sell", "We price, photograph and display your pieces for 90 days (180 for luxury bags), in the shop and online."],
  ["You earn", `You receive ${STORE.splitRate}% of each sale. A month's sales are ready to collect from the 15th of the next month.`],
]

export default async function Home() {
  const [latest, reduced, designers, women, men] = await Promise.all([
    searchProducts({ limit: 10, sort: "newest" }),
    searchProducts({ limit: 4, onSale: true, sort: "newest" }),
    listDesigners({ featured: true }),
    searchProducts({ limit: 1, gender: "women", category: "women-outerwear" }),
    searchProducts({ limit: 1, gender: "men", category: "men-outerwear" }),
  ])
  const womenImage = women.products[0]?.thumbnail
  const menImage = men.products[0]?.thumbnail

  return (
    <>
      {/* Hero */}
      <section className="content-container pb-12 pt-10 sm:pt-16 lg:pb-16 lg:pt-20">
        <h1 className="display max-w-[11ch] text-balance sm:max-w-[14ch]">
          Designer pieces with <em>another</em> life in them.
        </h1>
        <p className="mt-6 max-w-xl text-body text-[#3d3d3d] sm:text-lede">
          Garb is a designer consignment boutique on Queen West. Women&apos;s and men&apos;s clothing, bags, shoes and
          accessories from the labels people look for, mostly 50 to 75% below original retail.
        </p>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Popular categories">
          {TAGS.map(([label, href, color]) => (
            <li key={label}>
              <Link href={href} className="pill py-1.5 text-micro sm:text-label">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden />
                {label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/new-arrivals" className="btn btn-primary">Shop new arrivals</Link>
          <Link href="/consign" className="btn btn-secondary">Consign with us</Link>
        </div>
      </section>

      {/* Just in */}
      {latest.products.length > 0 && (
        <section className="content-container overflow-hidden">
          <div className="mb-4 flex items-baseline justify-between">
            <p className="eyebrow">Just in</p>
            <Link href="/new-arrivals" className="text-label hover:underline">See all new arrivals</Link>
          </div>
          <Collage products={latest.products} />
        </section>
      )}

      {/* Designers proof row */}
      {designers.length > 0 && (
        <section className="content-container py-20 text-center sm:py-24">
          <p className="mx-auto max-w-xl text-label text-[#3d3d3d]">
            Every piece is checked by hand. Labels on the floor right now include
          </p>
          <ul className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
            {designers.slice(0, 10).map((d) => (
              <li key={d.id}>
                <Link
                  href={`/designers/${d.handle}`}
                  className="font-serif text-[22px] font-normal tracking-[-0.02em] text-quiet transition-colors hover:text-ink sm:text-[28px]"
                >
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/designers" className="mt-8 inline-block text-label underline underline-offset-4">All designers</Link>
        </section>
      )}

      {/* Departments */}
      <section className="content-container grid gap-4 sm:grid-cols-2 sm:gap-6">
        {([
          ["women", "Women", womenImage, "Coats, dresses, bags, shoes and jewelry."],
          ["men", "Men", menImage, "Suiting, outerwear, knitwear and shoes."],
        ] as [string, string, string | null | undefined, string][]).map(([href, label, img, copy]) => (
          <Link key={href} href={`/${href}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-paper sm:aspect-[3/4]">
              {img && (
                <Image src={img} alt="" fill sizes="(min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
              )}
            </div>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="display-sm">{label}</h2>
                <p className="meta mt-1">{copy}</p>
              </div>
              <span className="btn btn-primary btn-sm shrink-0">Shop {label.toLowerCase()}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Manifesto */}
      <section className="content-container py-24 text-center sm:py-32">
        <h2 className="display-md mx-auto max-w-[16ch] text-balance">
          Not a thrift store. A <em>considered</em> closet.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-body text-[#3d3d3d]">
          We are selective on purpose. Pieces arrive clean, current and in pristine condition, from luxury houses,
          Canadian designers and the best of the contemporary labels. If it&apos;s on our rail, it&apos;s worth your time.
        </p>
      </section>

      {/* Recently reduced */}
      {reduced.products.length > 0 && (
        <section className="content-container">
          <SectionHeading title={<>Recently <em>reduced</em></>} href="/sale" linkLabel="Shop the sale" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {reduced.products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Consign */}
      <section className="content-container mt-24 grid gap-10 sm:mt-32 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <div>
          <div className="mb-6 flex flex-wrap gap-2">
            {["Earn 50%", "90 days on the floor", "Paid monthly"].map((t, i) => (
              <span key={t} className={`tag ${i === 1 ? "-rotate-3" : i === 2 ? "rotate-2" : ""}`}>{t}</span>
            ))}
          </div>
          <h2 className="display-md max-w-[12ch]">
            Your closet, <em>sold</em> beautifully.
          </h2>
          <p className="mt-5 max-w-md text-body text-[#3d3d3d]">
            Consign your designer clothing, bags, shoes and accessories with Garb. We do the pricing, styling and
            selling, in the shop and online, and you collect half of every sale.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/consign/book" className="btn btn-primary">Book an appointment</Link>
            <Link href="/consign/what-we-take" className="btn btn-secondary">What we take</Link>
          </div>
          <div className="mt-10 space-y-3 text-label">
            <p className="font-medium">Why sellers choose Garb</p>
            <p><span aria-hidden>→ </span><span className="font-medium">A real shop.</span> Your pieces hang on Queen West and sell online at the same time.</p>
            <p><span aria-hidden>→ </span><span className="font-medium">Clear terms.</span> A 50% split, 90 days on display, payouts from the 15th.</p>
            <p><span aria-hidden>→ </span><span className="font-medium">Follow along.</span> See what&apos;s on the floor and what has sold in your seller account.</p>
          </div>
        </div>
        <ol className="grid gap-3 rounded-utility bg-paper p-3 sm:grid-cols-2 sm:p-4">
          {STEPS.map(([title, copy], i) => (
            <li key={title} className="flex flex-col justify-between gap-6 rounded-[14px] bg-white p-5 sm:min-h-[240px]">
              <span className="font-serif text-[56px] font-light leading-none tracking-[-0.05em] text-quiet">0{i + 1}</span>
              <div>
                <p className="text-sans-xl font-medium">{title}</p>
                <p className="mt-2 text-label text-[#3d3d3d]">{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ split */}
      <section className="content-container mt-24 grid gap-10 sm:mt-32 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        <div>
          <h2 className="display-md">Good to <em>know</em></h2>
          <p className="mt-4 max-w-sm text-body text-[#3d3d3d]">Buying online, picking up in store, or selling with us.</p>
          <Link href="/faq" className="btn btn-primary mt-8">More answers <ArrowRight /></Link>
        </div>
        <FaqList
          items={[
            { q: "How do I pay for an online order?", a: <>Pay by card at checkout, or choose Interac e-Transfer. With e-Transfer we hold your pieces for {STORE.unpaidHoldHours} hours while you send payment to {STORE.etransferEmail}.</> },
            { q: "Do you ship?", a: "Yes, anywhere in Canada with tracked Canada Post shipping. You can also pick up for free at the shop on Queen West." },
            { q: "Can I return something?", a: "All online sales are final, so ask us anything first: we're happy to send more photos or measurements." },
            { q: "Is everything authentic?", a: "Every piece is inspected by our team before it reaches the floor. We only accept labels we know well and refuse anything we can't stand behind." },
            { q: "How does consigning work?", a: <>Book an appointment, bring your pieces, and we sell them for 90 days. You earn {STORE.splitRate}% of each sale. <Link href="/consign" className="link">Read the details</Link>.</> },
          ]}
        />
      </section>
    </>
  )
}
