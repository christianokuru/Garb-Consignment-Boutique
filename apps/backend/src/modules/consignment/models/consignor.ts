import { model } from "@medusajs/framework/utils"
import ConsignmentItem from "./consignment-item"
import Payout from "./payout"

const Consignor = model.define("consignor", {
  id: model.id({ prefix: "csgn" }).primaryKey(),
  account_number: model.text().unique(),
  first_name: model.text().searchable(),
  last_name: model.text().searchable(),
  email: model.text().unique().searchable(),
  phone: model.text().nullable(),
  split_rate: model.number().default(50),
  notes: model.text().nullable(),
  has_account: model.boolean().default(false),
  invite_token_hash: model.text().nullable(),
  invite_expires_at: model.dateTime().nullable(),
  items: model.hasMany(() => ConsignmentItem, { mappedBy: "consignor" }),
  payouts: model.hasMany(() => Payout, { mappedBy: "consignor" }),
})

export default Consignor
