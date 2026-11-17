import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONSIGNMENT_MODULE } from "../../../modules/consignment"
import type ConsignmentModuleService from "../../../modules/consignment/service"

/** GET /admin/payouts?status=scheduled|paid&period=YYYY-MM */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service: ConsignmentModuleService = req.scope.resolve(CONSIGNMENT_MODULE)
  const status = req.query.status as "scheduled" | "paid" | undefined
  const period = req.query.period as string | undefined
  const list = await service.listPayouts(
    { ...(status ? { status } : {}), ...(period ? { period } : {}) },
    { relations: ["consignor"], order: { period: "DESC" } }
  )
  const now = Date.now()
  const payouts = list
    .map((p: any) => ({
      id: p.id,
      period: p.period,
      amount: Number(p.amount),
      item_count: p.item_count,
      status: p.status,
      available_at: p.available_at,
      paid_at: p.paid_at,
      method: p.method,
      note: p.note,
      consignor: {
        id: p.consignor.id,
        first_name: p.consignor.first_name,
        last_name: p.consignor.last_name,
        account_number: p.consignor.account_number,
        email: p.consignor.email,
      },
      state: p.status === "paid" ? "paid" : new Date(p.available_at).getTime() <= now ? "ready" : "scheduled",
    }))
    .sort((a, b) => b.period.localeCompare(a.period) || a.consignor.last_name.localeCompare(b.consignor.last_name))
  res.json({ payouts, count: payouts.length })
}
