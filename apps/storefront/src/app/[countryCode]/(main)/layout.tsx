import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="relative">{props.children}</main>
      <Footer />
    </>
  )
}

// One country, so every page can be pre-rendered for it.
export function generateStaticParams() {
  return [{ countryCode: (process.env.NEXT_PUBLIC_DEFAULT_REGION || "ca").toLowerCase() }]
}
