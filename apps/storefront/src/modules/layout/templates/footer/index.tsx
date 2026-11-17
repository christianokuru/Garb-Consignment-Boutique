import { DAY_NAMES, hoursLabel, STORE } from "@lib/garb"
import { ArrowUpRight } from "@modules/common/components/garb-icons"
import Link from "next/link"
import OpenStatus from "../../components/garb/open-status"

const columns: { title: string; links: [string, string][] }[] = [
  {
    title: "Shop",
    links: [
      ["Women", "/women"],
      ["Men", "/men"],
      ["New arrivals", "/new-arrivals"],
      ["Designers", "/designers"],
      ["Sale", "/sale"],
    ],
  },
  {
    title: "Consign",
    links: [
      ["How it works", "/consign"],
      ["What we take", "/consign/what-we-take"],
      ["Book an appointment", "/consign/book"],
      ["Seller login", "/seller"],
    ],
  },
  {
    title: "Help",
    links: [
      ["Visit the shop", "/visit"],
      ["FAQ", "/faq"],
      ["Shipping & pickup", "/shipping"],
      ["Final sale policy", "/returns"],
      ["My account", "/account"],
    ],
  },
]

export default function Footer() {
  const days = [2, 3, 4, 5, 6, 0, 1]
  return (
    <footer className="mt-24 bg-white">
      <div className="content-container">
        <div className="hairline grid gap-12 pb-16 pt-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="display-sm max-w-md">
              Come by <em>1046 Queen St W</em> and try it on.
            </p>
            <div className="mt-6"><OpenStatus /></div>
            <dl className="mt-6 grid max-w-xs grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-label">
              {days.map((d) => (
                <div key={d} className="contents">
                  <dt className="text-quiet">{DAY_NAMES[d]}</dt>
                  <dd>{hoursLabel(STORE.hours[d])}</dd>
                </div>
              ))}
            </dl>
            <a href={STORE.mapUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm mt-6">
              Directions <ArrowUpRight />
            </a>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="meta mb-4">{col.title}</p>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-body hover:underline">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="col-span-2 sm:col-span-3">
              <p className="meta mb-3">Talk to us</p>
              <p className="text-body">
                <a href={STORE.phoneHref} className="link">{STORE.phone}</a>
                <span className="text-quiet"> · </span>
                <a href={`mailto:${STORE.email}`} className="link">{STORE.email}</a>
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-line py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <a href={STORE.instagram} target="_blank" rel="noreferrer" className="pill">Instagram</a>
            <a href={STORE.facebook} target="_blank" rel="noreferrer" className="pill">Facebook</a>
          </div>
          <p className="text-label text-quiet">
            © {new Date().getFullYear()} Garb Consignment Boutique · Toronto ·{" "}
            <Link href="/privacy" className="hover:underline">Privacy</Link> ·{" "}
            <Link href="/terms" className="hover:underline">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
