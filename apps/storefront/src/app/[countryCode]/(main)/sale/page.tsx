import ShopTemplate from "@modules/garb/shop/shop-template"
import { Metadata } from "next"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata: Metadata = {
  title: "Sale",
  description: "Reduced designer consignment pieces at Garb, Toronto. Already below retail, now marked down further.",
  alternates: { canonical: "/sale" },
}

export default async function SalePage({ searchParams }: Props) {
  const sp = await searchParams
  const department = sp.department === "women" || sp.department === "men" ? sp.department : undefined
  return (
    <ShopTemplate
      eyebrow="Shop"
      title={<><em>Sale</em></>}
      intro="Already well below retail, and now reduced again. Pieces leave as fast as they arrive."
      base={{ onSale: true, gender: department }}
      searchParams={sp}
      path="/sale"
      nav={[
        { label: "Everything", href: "/sale", active: !department },
        { label: "Women", href: "/sale?department=women", active: department === "women" },
        { label: "Men", href: "/sale?department=men", active: department === "men" },
      ]}
    />
  )
}
