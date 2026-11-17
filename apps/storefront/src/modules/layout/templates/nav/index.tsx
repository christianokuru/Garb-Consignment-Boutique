import { departments, slugify } from "@lib/garb"
import { UserIcon } from "@modules/common/components/garb-icons"
import Link from "next/link"
import BagButton from "../../components/garb/bag-button"
import MobileMenu from "../../components/garb/mobile-menu"
import OpenStatus from "../../components/garb/open-status"
import SearchButton from "../../components/garb/search-button"
import Wordmark from "../../components/garb/wordmark"

function DepartmentMenu({ department }: { department: keyof typeof departments }) {
  const d = departments[department]
  return (
    <div className="group relative">
      <Link href={`/${department}`} className="pill" aria-haspopup="true">
        {d.label}
      </Link>
      <div className="invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-opacity duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
        <div className="w-[420px] rounded-utility bg-white p-5 shadow-[0_16px_40px_rgba(0,0,0,0.08)] ring-1 ring-line">
          <p className="meta mb-3">Shop {d.label.toLowerCase()}</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            <li><Link href={`/${department}`} className="text-label hover:underline">Everything</Link></li>
            {d.categories.map((c) => (
              <li key={c}>
                <Link href={`/${department}/${slugify(c)}`} className="text-label hover:underline">{c}</Link>
              </li>
            ))}
            <li><Link href={`/sale?department=${department}`} className="text-label italic hover:underline">Sale</Link></li>
            <li><Link href={`/designers?department=${department}`} className="text-label hover:underline">Designers A–Z</Link></li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto grid h-[72px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:h-[92px]">
        <nav className="flex items-center gap-2" aria-label="Primary">
          <div className="lg:hidden">
            <MobileMenu />
          </div>
          <div className="hidden items-center gap-2 lg:flex">
            <DepartmentMenu department="women" />
            <DepartmentMenu department="men" />
            <Link href="/designers" className="pill">Designers</Link>
            <Link href="/sale" className="pill">Sale</Link>
            <Link href="/consign" className="pill">Consign</Link>
          </div>
        </nav>
        <Wordmark />
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Link href="/visit" className="mr-2 hidden xl:block">
            <OpenStatus />
          </Link>
          <div className="hidden sm:block">
            <SearchButton />
          </div>
          <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-pill hover:bg-paper sm:inline-flex" aria-label="Account">
            <UserIcon />
          </Link>
          <BagButton />
        </div>
      </div>
    </header>
  )
}
