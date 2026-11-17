import { categoryFromSlug, departments, slugify, type Department } from "@lib/garb"
import { notFound } from "next/navigation"
import ShopTemplate from "./shop-template"
import type { RawParams } from "./params"

export async function departmentMetadata(department: Department, slug?: string) {
  const d = departments[department]
  const category = slug ? categoryFromSlug(department, slug) : null
  const title = category ? `${d.label}'s ${category.toLowerCase()}` : `${d.label}'s designer consignment`
  return {
    title,
    description: `Shop pre-owned designer ${category?.toLowerCase() ?? "clothing, bags, shoes and accessories"} for ${d.label.toLowerCase()} at Garb, Toronto. Pieces from luxury and contemporary labels, mostly 50 to 75% below retail.`,
    alternates: { canonical: `/${department}${category ? `/${slug}` : ""}` },
  }
}

export default async function DepartmentPage({
  department,
  slug,
  searchParams,
}: {
  department: Department
  slug?: string
  searchParams: RawParams
}) {
  const d = departments[department]
  const category = slug ? categoryFromSlug(department, slug) : null
  if (slug && !category) notFound()

  const nav = [
    { label: "Everything", href: `/${department}`, active: !category },
    ...d.categories.map((c) => ({ label: c, href: `/${department}/${slugify(c)}`, active: c === category })),
  ]

  return (
    <ShopTemplate
      eyebrow={category ? d.label : "Shop"}
      title={category ? category : <>{d.label}</>}
      base={{ gender: department, category: category ? `${department}-${slugify(category)}` : undefined }}
      searchParams={searchParams}
      path={`/${department}${category ? `/${slugify(category)}` : ""}`}
      nav={nav}
    />
  )
}
