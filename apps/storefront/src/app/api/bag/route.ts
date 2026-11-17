import { retrieveCart } from "@lib/data/cart"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/** Number of pieces in the visitor's bag, for the header badge. */
export async function GET() {
  const cart = await retrieveCart().catch(() => null)
  const count = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0
  return NextResponse.json({ count }, { headers: { "cache-control": "no-store" } })
}
