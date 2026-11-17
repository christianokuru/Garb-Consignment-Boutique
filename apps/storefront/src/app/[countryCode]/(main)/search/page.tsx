import ShopTemplate from "@modules/garb/shop/shop-template"
import { Metadata } from "next"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export const metadata: Metadata = { title: "Search", robots: { index: false } }

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : ""
  return (
    <>
      <div className="content-container pt-8 sm:pt-12">
        <form action="/search" className="flex max-w-2xl items-center gap-2 rounded-pill bg-paper p-1.5 pl-5" role="search">
          <label htmlFor="q" className="sr-only">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Designer, piece or item code" className="w-full bg-transparent text-body outline-none placeholder:text-quiet" type="search" />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
        </form>
      </div>
      {q ? (
        <ShopTemplate
          eyebrow="Search"
          title={<>“{q}”</>}
          base={{ q }}
          searchParams={sp}
          path={`/search`}
        />
      ) : (
        <div className="content-container pb-24 pt-12">
          <h1 className="display">What are you <em>looking</em> for?</h1>
          <p className="mt-4 text-body text-[#3d3d3d]">Search by designer, type of piece, colour or the six-digit item code.</p>
        </div>
      )}
    </>
  )
}
