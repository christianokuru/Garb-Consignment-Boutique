import {
  CANADIAN_LABELS,
  CONTEMPORARY_LABELS,
  DECLINED_CLOTHING,
  DECLINED_DENIM,
  DECLINED_SHOES,
  LUXURY_LABELS,
} from "@lib/consign-content"
import { STORE } from "@lib/garb"
import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "What we take",
  description: "The designer labels and pieces Garb accepts for consignment, and the labels we don't carry.",
  alternates: { canonical: "/consign/what-we-take" },
}

function LabelCloud({ labels }: { labels: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
      {labels.map((l) => (
        <li key={l} className="font-serif text-[22px] font-light tracking-[-0.02em] sm:text-[26px]">{l}</li>
      ))}
    </ul>
  )
}

function Columns({ labels }: { labels: string[] }) {
  return (
    <ul className="columns-2 gap-6 text-label text-[#3d3d3d] sm:columns-3 lg:columns-4">
      {labels.map((l) => <li key={l} className="py-0.5">{l}</li>)}
    </ul>
  )
}

const CATEGORIES = [
  ["Bags", "Always in demand from Chanel, Hermès, Louis Vuitton, Gucci, Prada, Celine, Valentino, Burberry and similar houses. Some mid-range all-leather bags, evening bags and signed vintage pieces too. Pristine or near-pristine only."],
  ["Shoes", "Christian Louboutin, Jimmy Choo, Manolo Blahnik, Chanel, Prada, Ferragamo, Balenciaga, Gucci and other luxury labels in great condition. Shoes must have retailed for at least $750."],
  ["Designer denim", "Most designer denim that retailed over $300 and is very current."],
  ["Jewelry & watches", "Precious metals and gems, signed high-end costume jewelry (Chanel, Hermès, Dior), Tiffany & Co. silver. Watches from Rolex, Omega, Cartier, Tag Heuer, Breitling and similar, in great condition with working batteries."],
  ["Accessories", "Pristine silk scarves, designer sunglasses, belts, hats, small leather goods. For men: silk ties, wallets, bags and cufflinks."],
]

export default function WhatWeTakePage() {
  return (
    <div className="content-container pb-8 pt-10 sm:pt-16">
      <p className="meta mb-3"><Link href="/consign" className="hover:underline">Consign</Link></p>
      <h1 className="display max-w-[12ch]">What we <em>take</em></h1>
      <p className="mt-5 max-w-xl text-body text-[#3d3d3d]">
        Our clients come to Garb for pieces that are unique and harder to find. This list changes with the seasons and isn&apos;t
        complete, so if you&apos;re unsure, just ask.
      </p>
      <nav className="mt-8 flex flex-wrap gap-2" aria-label="On this page">
        <a href="#labels" className="pill">Labels we love</a>
        <a href="#pieces" className="pill">Bags, shoes & more</a>
        <a href="#declined" className="pill">Labels we don&apos;t take</a>
      </nav>

      <section id="labels" className="mt-16 scroll-mt-28 space-y-12">
        <div>
          <h2 className="eyebrow mb-4">Luxury labels</h2>
          <LabelCloud labels={LUXURY_LABELS} />
        </div>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="eyebrow mb-4">Canadian designers</h2>
            <LabelCloud labels={CANADIAN_LABELS} />
          </div>
          <div>
            <h2 className="eyebrow mb-4">Contemporary labels</h2>
            <LabelCloud labels={CONTEMPORARY_LABELS} />
          </div>
        </div>
      </section>

      <section id="pieces" className="mt-24 scroll-mt-28">
        <h2 className="display-md mb-8">Bags, shoes <em>and more</em></h2>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(([t, c]) => (
            <div key={t} className="border-t border-ink pt-5">
              <h3 className="text-body font-medium">{t}</h3>
              <p className="mt-2 text-label text-[#3d3d3d]">{c}</p>
            </div>
          ))}
          <div className="rounded-utility bg-paper p-6">
            <p className="text-body font-medium">Not sure?</p>
            <p className="mt-2 text-label text-[#3d3d3d]">Call {STORE.phone} or email {STORE.email}. A photo helps.</p>
            <Link href="/consign/book" className="btn btn-primary btn-sm mt-4">Book an appointment</Link>
          </div>
        </div>
      </section>

      <section id="declined" className="mt-24 scroll-mt-28">
        <h2 className="display-md">Labels we <em>don&apos;t</em> take</h2>
        <p className="mt-4 max-w-xl text-body text-[#3d3d3d]">
          Not a judgement on taste or style. These labels are easy to find elsewhere, so our clients don&apos;t look for them here.
        </p>
        <div className="mt-10 space-y-10">
          <details className="group border-t border-line pt-5" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-body font-medium [&::-webkit-details-marker]:hidden">
              Clothing <span className="text-label text-quiet">{DECLINED_CLOTHING.length} labels</span>
            </summary>
            <div className="mt-4"><Columns labels={DECLINED_CLOTHING} /></div>
          </details>
          <details className="group border-t border-line pt-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-body font-medium [&::-webkit-details-marker]:hidden">
              Shoes <span className="text-label text-quiet">{DECLINED_SHOES.length} labels · shoes must retail over $750</span>
            </summary>
            <div className="mt-4"><Columns labels={DECLINED_SHOES} /></div>
          </details>
          <details className="group border-y border-line py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between text-body font-medium [&::-webkit-details-marker]:hidden">
              Denim <span className="text-label text-quiet">{DECLINED_DENIM.length} labels</span>
            </summary>
            <div className="mt-4"><Columns labels={DECLINED_DENIM} /></div>
          </details>
        </div>
      </section>
    </div>
  )
}
