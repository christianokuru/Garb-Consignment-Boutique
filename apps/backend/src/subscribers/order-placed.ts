import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recordConsignmentSalesWorkflow } from "../workflows/consignment"
import { ETRANSFER_EMAIL, money, sendEmail, STORE_EMAIL, STOREFRONT_URL } from "../lib/notify"

export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  await recordConsignmentSalesWorkflow(container).run({ input: { order_id: data.id } })

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "email",
      "total",
      "items.title",
      "items.product_title",
      "items.variant_sku",
      "shipping_methods.name",
      "payment_collections.payments.provider_id",
    ],
    filters: { id: data.id },
  })
  const order = orders[0] as any
  if (!order) {
    logger.warn(`[garb] order.placed for unknown order ${data.id}`)
    return
  }
  const providers: string[] = (order.payment_collections ?? []).flatMap((pc: any) =>
    (pc?.payments ?? []).map((p: any) => p?.provider_id)
  )
  const isEtransfer = !providers.some((p) => p?.startsWith("pp_stripe"))
  const lines = (order.items ?? [])
    .map((i: any) => `- ${i.product_title ?? i.title}${i.variant_sku ? ` (${i.variant_sku.replace(/^GARB-/, "#")})` : ""}`)
    .join("\n")
  const total = money(order.total)
  const payment = isEtransfer
    ? `To complete your purchase, send an Interac e-Transfer of ${total} to ${ETRANSFER_EMAIL} within 72 hours. Put your order number #${order.display_id} in the message. Your pieces are held for you until then.`
    : "Your card payment was received."

  await sendEmail(container, {
    to: order.email,
    template: "order-placed",
    idempotency_key: `order-placed-${order.id}`,
    subject: `Garb order #${order.display_id}`,
    text: `Thank you for shopping at Garb.\n\n${lines}\n\nTotal: ${total}\n${payment}\n\nAll online sales are final.\nView your order: ${STOREFRONT_URL}/order/${order.id}/confirmed`,
    data: { order_id: order.id, display_id: order.display_id, total: order.total, etransfer: isEtransfer },
  })
  await sendEmail(container, {
    to: STORE_EMAIL,
    template: "order-placed-staff",
    idempotency_key: `order-placed-staff-${order.id}`,
    subject: `New online order #${order.display_id} (${isEtransfer ? "e-Transfer pending" : "paid by card"})`,
    text: `${order.email}\n${lines}\nTotal: ${total}\nShipping: ${(order.shipping_methods ?? []).map((s: any) => s.name).join(", ")}`,
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
