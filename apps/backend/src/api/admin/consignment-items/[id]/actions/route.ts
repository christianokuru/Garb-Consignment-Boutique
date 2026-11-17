import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { consignmentItemActionWorkflow, ItemAction } from "../../../../../workflows/garb-admin"

/**
 * POST /admin/consignment-items/:id/actions
 * { action: "extend" | "relist" | "returned" | "withdrawn" | "forfeited", days? }
 */
export const POST = async (req: AuthenticatedMedusaRequest<{ action: ItemAction; days?: number }>, res: MedusaResponse) => {
  const { result } = await consignmentItemActionWorkflow(req.scope).run({
    input: { id: req.params.id, ...req.validatedBody },
  })
  res.json({ item: result.item })
}
