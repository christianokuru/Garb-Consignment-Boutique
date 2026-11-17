import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { cancelOrderWorkflow } from "@medusajs/medusa/core-flows"
import { sendEmail } from "../lib/notify"

export const UNPAID_ORDER_HOURS = Number(process.env.GARB_UNPAID_ORDER_HOURS || 72)

/**
 * E-transfer orders hold one-of-a-kind pieces. If payment hasn't been marked
 * as received within the window, the order is cancelled and the pieces go back
 * on sale.
 */
export default async function cancelUnpaidOrdersJob(container: MedusaContainer) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const cutoff = new Date(Date.now() - UNPAID_ORDER_HOURS * 60 * 60 * 1000)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "status",
      "created_at",
      "fulfillments.id",
      "payment_collections.status",
      "payment_collections.payments.provider_id",
      "payment_collections.payments.captured_at",
    ],
    filters: { status: "pending", created_at: { $lt: cutoff } },
  })
  for (const order of orders as any[]) {
    const payments = (order.payment_collections ?? []).flatMap((pc: any) => pc?.payments ?? [])
    const isEtransfer = payments.length > 0 && payments.every((p: any) => p?.provider_id === "pp_system_default")
    const captured = payments.some((p: any) => !!p?.captured_at)
    if (!isEtransfer || captured || (order.fulfillments ?? []).length) {
      continue
    }
    try {
      await cancelOrderWorkflow(container).run({ input: { order_id: order.id } })
      logger.info(`[garb] Cancelled unpaid e-transfer order #${order.display_id}`)
      await sendEmail(container, {
        to: order.email,
        template: "order-cancelled-unpaid",
        idempotency_key: `order-cancelled-unpaid-${order.id}`,
        subject: `Garb order #${order.display_id} was cancelled`,
        text: `We didn't receive the e-Transfer for order #${order.display_id} within ${UNPAID_ORDER_HOURS} hours, so the order was cancelled and the pieces returned to the shop. If you sent payment, reply to this email and we'll sort it out.`,
      })
    } catch (e) {
      logger.warn(`[garb] Could not cancel unpaid order ${order.id}: ${(e as Error).message}`)
    }
  }
}

export const config = {
  name: "garb-cancel-unpaid-orders",
  schedule: "15 * * * *",
}
