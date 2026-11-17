import { getDesigner } from "@lib/data/garb"
import ShopTemplate from "@modules/garb/shop/shop-template"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ handle: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getDesigner((await params).handle)
  if (!data) return {}
  return {
    title: `${data.designer.name}, pre-owned`,
    description: `Pre-owned ${data.designer.name} at Garb Consignment Boutique, Toronto. Authenticated pieces, mostly 50 to 75% below original retail.`,
    alternates: { canonical: `/designers/${data.designer.handle}` },
  }
}

export default async function DesignerPage({ params, searchParams }: Props) {
  const { handle } = await params
  const sp = await searchParams
  const data = await getDesigner(handle)
  if (!data) notFound()
  const department = sp.department === "women" || sp.department === "men" ? sp.department : undefined
  const path = `/designers/${handle}`

  return (
    <ShopTemplate
      eyebrow={<Link href="/designers" className="hover:underline">Designers</Link>}
      title={data.designer.name}
      intro={data.designer.description ?? undefined}
      base={{ designer: [data.designer.name], gender: department }}
      searchParams={sp}
      path={path}
      showDesignerFilter={false}
      nav={[
        { label: "Everything", href: path, active: !department },
        { label: "Women", href: `${path}?department=women`, active: department === "women" },
        { label: "Men", href: `${path}?department=men`, active: department === "men" },
      ]}
      empty={
        <>
          <p className="display-sm">No {data.designer.name} on the floor <em>right now</em>.</p>
          <p className="mx-auto mt-3 max-w-md text-body text-[#3d3d3d]">New pieces arrive daily. Have some to sell? We&apos;d love to see them.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/new-arrivals" className="btn btn-primary">See new arrivals</Link>
            <Link href="/consign/book" className="btn btn-secondary">Consign {data.designer.name}</Link>
          </div>
        </>
      }
    />
  )
}
