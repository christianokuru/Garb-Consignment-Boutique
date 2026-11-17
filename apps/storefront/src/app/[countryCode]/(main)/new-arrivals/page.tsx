import ShopTemplate from "@modules/garb/shop/shop-template"
import { Metadata } from "next"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata: Metadata = {
  title: "New arrivals",
  description: "The latest designer pieces to arrive at Garb Consignment Boutique on Queen West, Toronto.",
  alternates: { canonical: "/new-arrivals" },
}

export default async function NewArrivalsPage({ searchParams }: Props) {
  const sp = await searchParams
  const department = sp.department === "women" || sp.department === "men" ? sp.department : undefined
  return (
    <ShopTemplate
      eyebrow="Shop"
      title={<>New <em>arrivals</em></>}
      intro="Fresh from our consignors' closets. Every piece is one of one, so when it's gone, it's gone."
      base={{ gender: department, sort: "newest" }}
      searchParams={sp}
      path="/new-arrivals"
      nav={[
        { label: "Everything", href: "/new-arrivals", active: !department },
        { label: "Women", href: "/new-arrivals?department=women", active: department === "women" },
        { label: "Men", href: "/new-arrivals?department=men", active: department === "men" },
      ]}
    />
  )
}
