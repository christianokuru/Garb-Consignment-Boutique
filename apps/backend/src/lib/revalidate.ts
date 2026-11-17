import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { STOREFRONT_URL } from "./notify"

async function ping(container: MedusaContainer, secret: string) {
  try {
    await fetch(`${STOREFRONT_URL}/api/revalidate`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
      signal: AbortSignal.timeout(5000),
    })
  } catch (e) {
    container.resolve(ContainerRegistrationKeys.LOGGER).warn(`[garb] Storefront revalidation failed: ${(e as Error).message}`)
  }
}

/**
 * Asks the storefront to drop cached product data. Never throws. A second
 * call a few seconds later catches the search index, which updates
 * asynchronously after the same events.
 */
export async function revalidateStorefront(container: MedusaContainer) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return
  }
  await ping(container, secret)
  setTimeout(() => void ping(container, secret), 4000).unref?.()
}
