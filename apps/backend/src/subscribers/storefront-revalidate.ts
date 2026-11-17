import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revalidateStorefront } from "../lib/revalidate"

/** Keeps the storefront's cached listings in step with the catalogue. */
export default async function storefrontRevalidateHandler({ container }: SubscriberArgs<unknown>) {
  await revalidateStorefront(container)
}

export const config: SubscriberConfig = {
  event: ["product.updated", "product.created", "product.deleted", "order.placed", "order.canceled"],
}
