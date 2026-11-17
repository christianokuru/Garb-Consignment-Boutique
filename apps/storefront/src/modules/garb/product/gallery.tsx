"use client"

import Image from "next/image"
import { useRef, useState } from "react"

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)

  const onScroll = () => {
    const el = track.current
    if (!el) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  if (!images.length) {
    return <div className="aspect-[2/3] bg-paper" />
  }

  return (
    <>
      {/* Mobile: swipe through full-width crops */}
      <div className="relative -mx-4 sm:-mx-6 lg:hidden">
        <div
          ref={track}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          aria-label="Product photos"
          aria-roledescription="carousel"
        >
          {images.map((src, i) => (
            <div key={src} className="relative aspect-[2/3] w-full shrink-0 snap-center bg-paper" aria-label={`Photo ${i + 1} of ${images.length}`}>
              <Image src={src} alt={i === 0 ? alt : `${alt}, view ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {images.map((src, i) => (
              <span key={src} className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-ink" : "w-1.5 bg-ink/25"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: a column of crops, first one large */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        {images.map((src, i) => (
          <div key={src} className={`relative aspect-[2/3] bg-paper ${i === 0 ? "col-span-2" : ""}`}>
            <Image
              src={src}
              alt={i === 0 ? alt : `${alt}, view ${i + 1}`}
              fill
              priority={i === 0}
              sizes={i === 0 ? "(min-width: 1440px) 820px, 55vw" : "(min-width: 1440px) 400px, 28vw"}
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </>
  )
}
