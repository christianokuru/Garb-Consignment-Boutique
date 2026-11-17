import Link from "next/link"
import { ArrowRight } from "@modules/common/components/garb-icons"

export default function SectionHeading({
  title,
  href,
  linkLabel = "View all",
  children,
}: {
  title: React.ReactNode
  href?: string
  linkLabel?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="display-sm">{title}</h2>
        {children && <div className="mt-3 max-w-xl text-body text-[#3d3d3d]">{children}</div>}
      </div>
      {href && (
        <Link href={href} className="btn btn-secondary btn-sm">
          {linkLabel} <ArrowRight />
        </Link>
      )}
    </div>
  )
}
