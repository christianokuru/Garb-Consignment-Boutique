import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { processConsignmentExpiryWorkflow } from "../workflows/consignment"
import { formatDate, sendEmail } from "../lib/notify"

/**
 * Every morning: pieces past their display period come off the shop and the
 * seller is asked to collect them; pieces not collected in time become Garb's.
 */
export default async function consignmentExpiryJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { result } = await processConsignmentExpiryWorkflow(container).run({ input: { now: new Date() } })
  for (const item of result.expired as any[]) {
    if (!item.consignor?.email) {
      continue
    }
    await sendEmail(container, {
      to: item.consignor.email,
      template: "consignment-expired",
      idempotency_key: `consignment-expired-${item.id}-${new Date(item.expires_at).toISOString().slice(0, 10)}`,
      subject: `Please collect your ${item.title}`,
      text: `Hi ${item.consignor.first_name},\n\nYour ${item.title} (#${item.item_code}) has finished its display period. Please pick it up at 1046 Queen St W by ${formatDate(item.pickup_deadline)}. Items not collected by then become the property of Garb.\n\nCall 416.588.2121 if you'd like to discuss options.`,
    })
  }
  if (result.expired.length || result.forfeited.length) {
    logger.info(`[garb] Expired ${result.expired.length} items, forfeited ${result.forfeited.length}`)
  }
}

export const config = {
  name: "garb-consignment-expiry",
  schedule: "0 7 * * *",
}
