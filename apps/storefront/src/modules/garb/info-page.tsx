import Link from "next/link"

export default function InfoPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow?: string
  title: React.ReactNode
  intro?: React.ReactNode
  updated?: string
  children: React.ReactNode
}) {
  return (
    <div className="content-container pb-8 pt-10 sm:pt-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          {eyebrow && <p className="meta mb-3">{eyebrow}</p>}
          <h1 className="display max-w-[12ch]">{title}</h1>
          {intro && <div className="mt-5 max-w-sm text-body text-[#3d3d3d]">{intro}</div>}
          {updated && <p className="mt-6 text-micro text-quiet">Last updated {updated}</p>}
          <nav className="mt-10 hidden flex-wrap gap-2 lg:flex" aria-label="Help">
            {[
              ["Visit", "/visit"],
              ["FAQ", "/faq"],
              ["Shipping & pickup", "/shipping"],
              ["Final sale", "/returns"],
              ["Terms", "/terms"],
              ["Privacy", "/privacy"],
            ].map(([l, h]) => (
              <Link key={h} href={h} className="pill">{l}</Link>
            ))}
          </nav>
        </div>
        <div className="prose-garb">{children}</div>
      </div>
    </div>
  )
}
