import { PlusIcon } from "@modules/common/components/garb-icons"

export type QA = { q: string; a: React.ReactNode }

/** Questions separated by whitespace and hairlines, not boxes. */
export default function FaqList({ items }: { items: QA[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <details key={item.q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-body font-medium [&::-webkit-details-marker]:hidden">
            {item.q}
            <PlusIcon className="mt-1 shrink-0 transition-transform duration-200 group-open:rotate-45" />
          </summary>
          <div className="mt-3 max-w-xl text-body text-[#3d3d3d] text-pretty">{item.a}</div>
        </details>
      ))}
    </div>
  )
}
