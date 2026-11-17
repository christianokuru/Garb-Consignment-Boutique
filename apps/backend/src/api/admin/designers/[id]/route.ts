import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteDesignerWorkflow, upsertDesignerWorkflow } from "../../../../workflows/garb-admin"

/** POST /admin/designers/:id */
export const POST = async (req: AuthenticatedMedusaRequest<any>, res: MedusaResponse) => {
  const { result } = await upsertDesignerWorkflow(req.scope).run({ input: { ...req.validatedBody, id: req.params.id } })
  res.json({ designer: result })
}

/** DELETE /admin/designers/:id */
export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  await deleteDesignerWorkflow(req.scope).run({ input: { id: req.params.id } })
  res.json({ id: req.params.id, object: "designer", deleted: true })
}
