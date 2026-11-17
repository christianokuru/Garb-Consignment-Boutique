import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONSIGNMENT_MODULE } from "../../../modules/consignment"
import type ConsignmentModuleService from "../../../modules/consignment/service"
import { periodFor, roundMoney } from "../../../lib/garb"
import { getConsignor } from "../helpers"
import { updateConsignorWorkflow } from "../../../workflows/garb-admin"

const PROFILE_FIELDS = ["id", "account_number", "first_name", "last_name", "email", "phone", "split_rate", "created_at"]

/** GET /consignors/me: profile and an at-a-glance summary for the seller dashboard. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const consignor = await getConsignor(req, [
    ...PROFILE_FIELDS,
    "items.status",
    "items.consignor_share",
    "items.sold_at",
    "items.payout_id",
    "items.expires_at",
    "payouts.status",
    "payouts.amount",
    "payouts.available_at",
  ])
  const items = (consignor.items ?? []) as any[]
  const payouts = (consignor.payouts ?? []) as any[]
  const sold = items.filter((i) => i.status === "sold")
  const thisMonth = periodFor(new Date())
  const now = Date.now()
  const soon = now + 14 * 24 * 60 * 60 * 1000
  const summary = {
    active_count: items.filter((i) => i.status === "active").length,
    expiring_soon_count: items.filter((i) => i.status === "active" && new Date(i.expires_at).getTime() < soon).length,
    awaiting_pickup_count: items.filter((i) => i.status === "expired").length,
    sold_count: sold.length,
    lifetime_earnings: roundMoney(sold.reduce((s, i) => s + Number(i.consignor_share ?? 0), 0)),
    this_month_earnings: roundMoney(
      sold.filter((i) => i.sold_at && periodFor(new Date(i.sold_at)) === thisMonth).reduce((s, i) => s + Number(i.consignor_share ?? 0), 0)
    ),
    // Sold but not yet grouped into a payout.
    pending_earnings: roundMoney(sold.filter((i) => !i.payout_id).reduce((s, i) => s + Number(i.consignor_share ?? 0), 0)),
    ready_to_collect: roundMoney(
      payouts
        .filter((p) => p.status === "scheduled" && new Date(p.available_at).getTime() <= now)
        .reduce((s, p) => s + Number(p.amount), 0)
    ),
    scheduled_payouts: roundMoney(
      payouts
        .filter((p) => p.status === "scheduled" && new Date(p.available_at).getTime() > now)
        .reduce((s, p) => s + Number(p.amount), 0)
    ),
  }
  const profile = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, consignor[f]]))
  res.json({ consignor: profile, summary })
}

/** POST /consignors/me: sellers can update their phone number. */
export const POST = async (req: AuthenticatedMedusaRequest<{ phone?: string }>, res: MedusaResponse) => {
  const service: ConsignmentModuleService = req.scope.resolve(CONSIGNMENT_MODULE)
  await updateConsignorWorkflow(req.scope).run({ input: { id: req.auth_context.actor_id, ...req.validatedBody } })
  const consignor = await service.retrieveConsignor(req.auth_context.actor_id)
  res.json({ consignor: Object.fromEntries(PROFILE_FIELDS.map((f) => [f, (consignor as any)[f]])) })
}
