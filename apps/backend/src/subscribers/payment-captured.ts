import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { sendEmail } from "../lib/notify"

/** Lets e-transfer customers know their payment arrived. */
export default async function paymentCapturedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: payments } = await query.graph({
    entity: "payment",
    fields: ["id", "provider_id", "payment_collection.order.id", "payment_collection.order.email", "payment_collection.order.display_id"],
    filters: { id: data.id },
  })
  const payment = payments[0] as any
  const order = payment?.payment_collection?.order
  if (!payment || payment.provider_id !== "pp_system_default" || !order?.email) {
    return
  }
  await sendEmail(container, {
    to: order.email,
    template: "etransfer-received",
    idempotency_key: `etransfer-received-${payment.id}`,
    subject: `Payment received for Garb order #${order.display_id}`,
    text: `Thank you, we've received your e-Transfer for order #${order.display_id}. We'll let you know as soon as it ships or is ready for pickup.`,
  })
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
