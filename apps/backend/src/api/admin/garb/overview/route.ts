import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CONSIGNMENT_MODULE } from "../../../../modules/consignment"
import type ConsignmentModuleService from "../../../../modules/consignment/service"
import { APPOINTMENT_MODULE } from "../../../../modules/appointment"
import type AppointmentModuleService from "../../../../modules/appointment/service"
import { periodFor, roundMoney } from "../../../../lib/garb"

/** GET /admin/garb/overview: numbers for the consignment overview page. */
export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const consignment: ConsignmentModuleService = req.scope.resolve(CONSIGNMENT_MODULE)
  const appointmentService: AppointmentModuleService = req.scope.resolve(APPOINTMENT_MODULE)
  const [items, payouts, appointments] = await Promise.all([
    consignment.listConsignmentItems({}, { select: ["status", "expires_at", "sold_at", "sale_price", "consignor_share", "payout_id"] }),
    consignment.listPayouts({ status: "scheduled" }, { select: ["status", "amount", "available_at"] }),
    appointmentService.listAppointmentRequests({ status: "new" }, { select: ["status"] }),
  ])
  const now = Date.now()
  const week = now + 7 * 24 * 60 * 60 * 1000
  const month = periodFor(new Date())
  const soldThisMonth = (items as any[]).filter((i) => i.status === "sold" && i.sold_at && periodFor(new Date(i.sold_at)) === month)
  res.json({
    overview: {
      active: (items as any[]).filter((i) => i.status === "active").length,
      expiring_this_week: (items as any[]).filter((i) => i.status === "active" && new Date(i.expires_at).getTime() < week).length,
      awaiting_pickup: (items as any[]).filter((i) => i.status === "expired").length,
      sold_this_month: soldThisMonth.length,
      sales_this_month: roundMoney(soldThisMonth.reduce((s, i) => s + Number(i.sale_price ?? 0), 0)),
      unbatched_earnings: roundMoney(
        (items as any[]).filter((i) => i.status === "sold" && !i.payout_id).reduce((s, i) => s + Number(i.consignor_share ?? 0), 0)
      ),
      payouts_ready: roundMoney(
        (payouts as any[])
          .filter((p) => p.status === "scheduled" && new Date(p.available_at).getTime() <= now)
          .reduce((s, p) => s + Number(p.amount), 0)
      ),
      new_appointments: (appointments as any[]).filter((a) => a.status === "new").length,
    },
  })
}
