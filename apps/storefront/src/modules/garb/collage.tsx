import type { ListingProduct } from "@lib/data/garb"
import { formatPrice } from "@lib/garb"
import Image from "next/image"
import Link from "next/link"

// Unequal, square-edged crops that run past the viewport edge, like a
// contact sheet. Widths repeat in a fixed rhythm so the row feels composed.
const WIDTHS = ["w-[62vw] sm:w-[300px]", "w-[52vw] sm:w-[240px]", "w-[70vw] sm:w-[360px]", "w-[52vw] sm:w-[260px]"]
const OFFSETS = ["mt-0", "mt-10", "mt-4", "mt-16"]

export default function Collage({ products }: { products: ListingProduct[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:gap-6 sm:px-6" aria-label="Just in">
      {products.map((p, i) => (
        <Link
          key={p.id}
          href={`/products/${p.handle}`}
          className={`group shrink-0 snap-start ${WIDTHS[i % WIDTHS.length]} ${OFFSETS[i % OFFSETS.length]}`}
        >
          <div className="relative aspect-[2/3] overflow-hidden bg-paper">
            {p.thumbnail && (
              <Image src={p.thumbnail} alt={p.title} fill sizes="(min-width: 640px) 360px, 70vw" priority={i < 2} className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3 text-micro">
            <span className="truncate">{p.designer}</span>
            <span className="tabular-nums text-quiet">{formatPrice(p.price)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
