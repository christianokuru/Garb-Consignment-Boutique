import { ArrowLeft } from "@modules/common/components/garb-icons"
import Wordmark from "@modules/layout/components/garb/wordmark"
import Link from "next/link"

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-white">
      <header className="border-b border-line">
        <nav className="mx-auto grid h-[72px] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
          <Link href="/cart" className="pill w-fit" data-testid="back-to-cart-link">
            <ArrowLeft /> <span className="hidden sm:inline">Back to bag</span><span className="sm:hidden">Bag</span>
          </Link>
          <Wordmark compact />
          <p className="flex items-center justify-end gap-2 text-label text-quiet">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 1 1 8 0v3" /></svg>
            <span className="hidden sm:inline">Secure checkout</span>
          </p>
        </nav>
      </header>
      <main id="main" className="relative" data-testid="checkout-container">{children}</main>
    </div>
  )
}
