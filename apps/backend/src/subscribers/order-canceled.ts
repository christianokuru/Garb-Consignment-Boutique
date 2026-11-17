import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { revertConsignmentSalesWorkflow } from "../workflows/consignment"

export default async function orderCanceledHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  await revertConsignmentSalesWorkflow(container).run({ input: { order_id: data.id } })
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}
