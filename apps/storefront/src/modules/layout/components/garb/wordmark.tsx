import Link from "next/link"
import { clx } from "@medusajs/ui"

export default function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" aria-label="Garb Consignment Boutique, home" className={clx("block text-center text-ink", className)}>
      <span className="block font-serif text-[34px] font-light leading-[0.85] tracking-[-0.06em] sm:text-[40px]">Garb</span>
      {!compact && (
        <span className="mt-1 block font-serif text-[15px] font-light italic leading-none tracking-[-0.02em] text-ink sm:text-[17px]">
          consignment
        </span>
      )}
    </Link>
  )
}
