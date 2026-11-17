import type { ListingProduct } from "@lib/data/garb"
import { formatPrice } from "@lib/garb"
import { clx } from "@medusajs/ui"
import Image from "next/image"
import Link from "next/link"

export function Price({ price, original, onSale, className }: { price: number; original?: number; onSale?: boolean; className?: string }) {
  return (
    <span className={clx("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span>{formatPrice(price)}</span>
      {onSale && original && original > price && (
        <>
          <span className="sr-only">, reduced from</span>
          <s className="text-quiet">{formatPrice(original)}</s>
        </>
      )}
    </span>
  )
}

export default function ProductCard({
  product,
  priority,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw",
  className,
}: {
  product: ListingProduct
  priority?: boolean
  sizes?: string
  className?: string
}) {
  return (
    <Link href={`/products/${product.handle}`} className={clx("group block", className)} data-testid="product-card">
      <div className="relative aspect-[2/3] overflow-hidden bg-paper">
        {product.thumbnail && (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover transition-opacity duration-300"
          />
        )}
        {product.hover_image && (
          <Image
            src={product.hover_image}
            alt=""
            fill
            sizes={sizes}
            className="hidden object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:block"
          />
        )}
        {product.on_sale && (
          <span className="absolute left-2 top-2 rounded-pill bg-white px-2.5 py-1 text-micro text-ink">Reduced</span>
        )}
      </div>
      <div className="mt-3 space-y-0.5 pr-2">
        <p className="text-label font-medium leading-snug">{product.designer ?? product.title}</p>
        <p className="text-label text-quiet">
          {product.item_type}
          {product.size && product.size !== "O/S" ? ` · ${product.size}` : ""}
        </p>
        <Price className="text-label" price={product.price} original={product.original_price} onSale={product.on_sale} />
      </div>
    </Link>
  )
}
