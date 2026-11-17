import { DAY_NAMES, hoursLabel, STORE } from "@lib/garb"
import { ArrowUpRight } from "@modules/common/components/garb-icons"
import OpenStatus from "@modules/layout/components/garb/open-status"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Visit the shop",
  description: "Garb Consignment Boutique, 1046 Queen St W, Toronto. Open Tuesday to Sunday, 12 to 6 pm.",
  alternates: { canonical: "/visit" },
}

export default function VisitPage() {
  const days = [2, 3, 4, 5, 6, 0, 1]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name: STORE.name,
    telephone: "+1-416-588-2121",
    email: STORE.email,
    address: { "@type": "PostalAddress", streetAddress: STORE.street, addressLocality: STORE.city, addressRegion: STORE.province, postalCode: STORE.postalCode, addressCountry: "CA" },
    openingHoursSpecification: [{ "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], opens: "12:00", closes: "18:00" }],
    sameAs: [STORE.instagram, STORE.facebook],
  }
  return (
    <div className="content-container pb-8 pt-10 sm:pt-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="meta mb-3">Visit</p>
      <h1 className="display max-w-[14ch]">{STORE.street}, <em>Toronto</em></h1>
      <div className="mt-6"><OpenStatus /></div>
      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <div className="rounded-utility bg-paper p-6">
          <p className="eyebrow mb-4">Hours</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-1.5 text-body">
            {days.map((d) => (
              <div key={d} className="contents">
                <dt className="text-quiet">{DAY_NAMES[d]}</dt>
                <dd>{hoursLabel(STORE.hours[d])}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-micro text-quiet">Hours can change on holidays. Check our Instagram or call ahead.</p>
        </div>
        <div className="rounded-utility bg-paper p-6">
          <p className="eyebrow mb-4">Find us</p>
          <p className="text-body">{STORE.street}<br />{STORE.city}, {STORE.province} {STORE.postalCode}</p>
          <p className="mt-3 text-label text-[#3d3d3d]">On Queen Street West between Dovercourt and Ossington. The 501 Queen streetcar stops right outside.</p>
          <a href={STORE.mapUrl} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm mt-5">Open in Maps <ArrowUpRight /></a>
        </div>
        <div className="rounded-utility bg-paper p-6">
          <p className="eyebrow mb-4">Talk to us</p>
          <p className="text-body"><a href={STORE.phoneHref} className="link">{STORE.phone}</a><br /><a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a></p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={STORE.instagram} target="_blank" rel="noreferrer" className="pill bg-white">Instagram</a>
            <a href={STORE.facebook} target="_blank" rel="noreferrer" className="pill bg-white">Facebook</a>
          </div>
        </div>
      </div>
      <section className="mt-24 grid gap-8 sm:grid-cols-2">
        <Link href="/consign/book" className="group block border-t border-ink pt-6">
          <p className="display-sm">Selling? <em>Book first.</em></p>
          <p className="mt-3 max-w-md text-body text-[#3d3d3d]">Consignments are by appointment only, so we can give your pieces proper attention.</p>
          <span className="btn btn-primary btn-sm mt-5">Book an appointment</span>
        </Link>
        <Link href="/new-arrivals" className="group block border-t border-ink pt-6">
          <p className="display-sm">Shopping? <em>Come in.</em></p>
          <p className="mt-3 max-w-md text-body text-[#3d3d3d]">No appointment needed. New pieces arrive every day, and most sell within weeks.</p>
          <span className="btn btn-secondary btn-sm mt-5">See what&apos;s new</span>
        </Link>
      </section>
    </div>
  )
}
