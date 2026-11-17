import { listDesigners } from "@lib/data/garb"
import { Metadata } from "next"
import Link from "next/link"

type Props = { searchParams: Promise<{ department?: string }> }

export const metadata: Metadata = {
  title: "Designers A–Z",
  description: "Every designer currently at Garb Consignment Boutique, Toronto: luxury houses, Canadian designers and contemporary labels.",
  alternates: { canonical: "/designers" },
}

export default async function DesignersPage({ searchParams }: Props) {
  const { department } = await searchParams
  const gender = department === "women" || department === "men" ? department : undefined
  const designers = await listDesigners({ gender })
  const featured = designers.filter((d) => d.is_featured)
  const groups = designers.reduce<Record<string, typeof designers>>((acc, d) => {
    const first = d.name[0]?.toUpperCase() ?? "#"
    const key = /[A-Z]/.test(first) ? first : "#"
    ;(acc[key] ||= []).push(d)
    return acc
  }, {})
  const letters = Object.keys(groups).sort((a, b) => (a === "#" ? -1 : b === "#" ? 1 : a.localeCompare(b)))
  const suffix = gender ? `?department=${gender}` : ""

  return (
    <div className="content-container pb-8 pt-8 sm:pt-12">
      <header className="mb-8">
        <p className="meta mb-3">{designers.length} designers on the floor</p>
        <h1 className="display">Designers <em>A–Z</em></h1>
      </header>
      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Department">
        {[
          ["Everyone", "/designers", !gender],
          ["Women", "/designers?department=women", gender === "women"],
          ["Men", "/designers?department=men", gender === "men"],
        ].map(([label, href, active]) => (
          <Link key={String(href)} href={String(href)} className="pill" aria-current={active ? "page" : undefined}>{label}</Link>
        ))}
      </nav>

      {featured.length > 0 && (
        <section className="mb-16" aria-labelledby="featured">
          <h2 id="featured" className="eyebrow mb-4">Most wanted</h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {featured.map((d) => (
              <li key={d.id}>
                <Link href={`/designers/${d.handle}${suffix}`} className="font-serif text-[28px] font-light tracking-[-0.03em] hover:italic sm:text-[36px]">
                  {d.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav className="no-scrollbar sticky top-[72px] z-10 -mx-4 mb-8 flex gap-1 overflow-x-auto bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-[92px]" aria-label="Jump to letter">
        {letters.map((l) => (
          <a key={l} href={`#letter-${l}`} className="inline-flex h-9 min-w-9 items-center justify-center rounded-pill px-2 text-label hover:bg-paper">{l}</a>
        ))}
      </nav>

      <div className="columns-1 gap-10 sm:columns-2 lg:columns-3 xl:columns-4">
        {letters.map((l) => (
          <section key={l} id={`letter-${l}`} className="mb-10 break-inside-avoid scroll-mt-40">
            <h2 className="mb-3 font-serif text-[40px] font-light leading-none tracking-[-0.04em]">{l}</h2>
            <ul className="space-y-1.5">
              {groups[l].map((d) => (
                <li key={d.id}>
                  <Link href={`/designers/${d.handle}${suffix}`} className="group flex items-baseline justify-between gap-3 text-body">
                    <span className="group-hover:underline">{d.name}</span>
                    <span className="text-label tabular-nums text-quiet">{d.product_count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
