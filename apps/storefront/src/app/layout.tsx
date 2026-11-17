import { getBaseURL } from "@lib/util/env"
import { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import "styles/globals.css"

const serif = localFont({
  src: [
    { path: "../styles/fonts/cormorant-garamond-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../styles/fonts/cormorant-garamond-latin-300-italic.woff2", weight: "300", style: "italic" },
    { path: "../styles/fonts/cormorant-garamond-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../styles/fonts/cormorant-garamond-latin-400-italic.woff2", weight: "400", style: "italic" },
    { path: "../styles/fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
})

const sans = localFont({
  src: [{ path: "../styles/fonts/dm-sans-latin-wght-normal.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-sans",
  display: "swap",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Garb Consignment Boutique · Designer consignment in Toronto",
    template: "%s · Garb Consignment Boutique",
  },
  description:
    "Designer consignment on Queen West, Toronto. Women's and men's luxury clothing, bags, shoes and accessories at 50 to 75% below original retail. Shop online or consign with us.",
  openGraph: {
    siteName: "Garb Consignment Boutique",
    locale: "en_CA",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en-CA" data-mode="light" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-pill focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {props.children}
      </body>
    </html>
  )
}
