import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

/**
 * Called by the Medusa backend when a piece sells, is cancelled or edited, so
 * cached listings and product pages refresh right away instead of within 60s.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }
  revalidateTag("products", { expire: 0 })
  return NextResponse.json({ ok: true })
}
