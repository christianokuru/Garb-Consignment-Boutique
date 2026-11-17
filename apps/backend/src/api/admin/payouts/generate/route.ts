import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generatePayoutsWorkflow } from "../../../../workflows/consignment"
import { previousPeriod } from "../../../../lib/garb"

/** POST /admin/payouts/generate { period?: "YYYY-MM" } (defaults to last month) */
export const POST = async (req: AuthenticatedMedusaRequest<{ period?: string }>, res: MedusaResponse) => {
  const period = req.validatedBody.period ?? previousPeriod()
  const { result } = await generatePayoutsWorkflow(req.scope).run({ input: { period } })
  res.json({ period, payouts: result, count: result.length })
}
