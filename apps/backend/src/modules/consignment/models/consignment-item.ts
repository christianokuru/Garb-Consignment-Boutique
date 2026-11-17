import { model } from "@medusajs/framework/utils"
import Consignor from "./consignor"
import Payout from "./payout"

export const CONSIGNMENT_ITEM_STATUSES = [
  "active",
  "sold",
  "expired",
  "returned",
  "forfeited",
  "withdrawn",
] as const

const ConsignmentItem = model.define("consignment_item", {
  id: model.id({ prefix: "citem" }).primaryKey(),
  item_code: model.text().searchable(),
  title: model.text().searchable(),
  status: model.enum([...CONSIGNMENT_ITEM_STATUSES]).default("active"),
  received_at: model.dateTime(),
  display_days: model.number().default(90),
  expires_at: model.dateTime(),
  list_price: model.bigNumber(),
  sale_price: model.bigNumber().nullable(),
  consignor_share: model.bigNumber().nullable(),
  sold_at: model.dateTime().nullable(),
  order_id: model.text().nullable(),
  pickup_deadline: model.dateTime().nullable(),
  consignor: model.belongsTo(() => Consignor, { mappedBy: "items" }),
  payout: model.belongsTo(() => Payout, { mappedBy: "items" }).nullable(),
})

export default ConsignmentItem
