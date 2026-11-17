import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONSIGNMENT_MODULE } from "../../../../modules/consignment"
import type ConsignmentModuleService from "../../../../modules/consignment/service"

/** GET /consignors/me/payouts */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: ConsignmentModuleService = req.scope.resolve(CONSIGNMENT_MODULE)
  const list = await service.listPayouts(
    { consignor_id: req.auth_context.actor_id },
    { relations: ["items"], order: { period: "DESC" } }
  )
  const now = Date.now()
  const payouts = list.map((p: any) => ({
    id: p.id,
    period: p.period,
    amount: Number(p.amount),
    item_count: p.item_count,
    status: p.status,
    available_at: p.available_at,
    paid_at: p.paid_at,
    method: p.method,
    state: p.status === "paid" ? "paid" : new Date(p.available_at).getTime() <= now ? "ready" : "scheduled",
    items: (p.items ?? []).map((i: any) => ({
      id: i.id,
      title: i.title,
      item_code: i.item_code,
      sale_price: Number(i.sale_price ?? 0),
      consignor_share: Number(i.consignor_share ?? 0),
      sold_at: i.sold_at,
    })),
  }))
  res.json({ payouts, count: payouts.length })
}
