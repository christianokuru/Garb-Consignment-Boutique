import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { markPayoutPaidWorkflow } from "../../../../../workflows/garb-admin"

/** POST /admin/payouts/:id/mark-paid { method?, note? } */
export const POST = async (req: AuthenticatedMedusaRequest<{ method?: string; note?: string }>, res: MedusaResponse) => {
  const { result } = await markPayoutPaidWorkflow(req.scope).run({ input: { id: req.params.id, ...req.validatedBody } })
  res.json({ payout: { ...result, amount: Number(result.amount) } })
}
