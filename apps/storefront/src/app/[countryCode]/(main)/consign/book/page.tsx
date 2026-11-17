import BookingForm from "@modules/garb/consign/booking-form"
import { STORE } from "@lib/garb"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Book a consignment appointment",
  description: "Request an in-store or in-home consignment appointment with Garb, Toronto.",
  alternates: { canonical: "/consign/book" },
}

export default function BookPage() {
  return (
    <div className="content-container grid gap-12 pb-8 pt-10 sm:pt-16 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
      <div>
        <p className="meta mb-3"><Link href="/consign" className="hover:underline">Consign</Link></p>
        <h1 className="display max-w-[12ch]">Book an <em>appointment</em></h1>
        <p className="mt-5 max-w-md text-body text-[#3d3d3d]">
          Tell us a little about what you&apos;d like to consign and when suits you. We&apos;ll confirm a time within two business days.
        </p>
        <div className="mt-10 space-y-4 text-label">
          <p className="font-medium">Before you come</p>
          <p><span aria-hidden>→ </span>Freshly cleaned, wrinkle-free, on hangers or neatly folded.</p>
          <p><span aria-hidden>→ </span>Garment bags, shopping bags or totes, not garbage bags.</p>
          <p><span aria-hidden>→ </span>Leave tags on anything unworn.</p>
          <p><span aria-hidden>→ </span>Check <Link href="/consign/what-we-take" className="link">what we take</Link> first.</p>
        </div>
        <p className="mt-10 text-label text-quiet">{STORE.street}, {STORE.city} · Tuesday to Sunday, 12–6</p>
      </div>
      <BookingForm />
    </div>
  )
}
