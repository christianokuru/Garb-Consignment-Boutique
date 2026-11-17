import { model } from "@medusajs/framework/utils"
import Consignor from "./consignor"
import ConsignmentItem from "./consignment-item"

const Payout = model.define("consignor_payout", {
  id: model.id({ prefix: "cpay" }).primaryKey(),
  period: model.text(),
  amount: model.bigNumber(),
  item_count: model.number().default(0),
  status: model.enum(["scheduled", "paid"]).default("scheduled"),
  available_at: model.dateTime(),
  paid_at: model.dateTime().nullable(),
  method: model.text().nullable(),
  note: model.text().nullable(),
  consignor: model.belongsTo(() => Consignor, { mappedBy: "payouts" }),
  items: model.hasMany(() => ConsignmentItem, { mappedBy: "payout" }),
})

export default Payout
